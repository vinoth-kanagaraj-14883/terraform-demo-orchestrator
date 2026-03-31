import uuid
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, HTTPException, BackgroundTasks, Query

from app.models import DeploymentRequest, DeploymentRecord, DeploymentStatus
from app.database import (
    save_deployment,
    get_deployment,
    list_deployments,
    update_status,
    update_deployment,
)
from app.services.template_selector import select_template, get_template_path
from app.services.terraform_executor import TerraformExecutor

router = APIRouter(prefix="/api/deployments", tags=["deployments"])


def _build_variables(req: DeploymentRequest, deployment_id: str) -> dict:
    return {
        "deployment_id": deployment_id,
        "customer_name": req.customer_name,
        "region": req.region or "us-east-1",
        "instance_size": req.instance_size or "medium",
    }


def run_terraform_deploy(deployment_id: str, req: DeploymentRequest, template_name: str):
    template_path = get_template_path(template_name)
    executor = TerraformExecutor(template_path, deployment_id)
    variables = _build_variables(req, deployment_id)

    try:
        update_status(deployment_id, DeploymentStatus.planning)
        init_result = executor.init()
        if init_result.returncode != 0:
            raise RuntimeError(f"terraform init failed:\n{init_result.stderr}")

        plan_result = executor.plan(variables)
        if plan_result.returncode != 0:
            raise RuntimeError(f"terraform plan failed:\n{plan_result.stderr}")

        update_status(deployment_id, DeploymentStatus.applying)
        apply_result = executor.apply()
        if apply_result.returncode != 0:
            raise RuntimeError(f"terraform apply failed:\n{apply_result.stderr}")

        outputs = executor.output()
        update_deployment(
            deployment_id,
            {"status": DeploymentStatus.deployed, "outputs": outputs},
        )
    except Exception as exc:
        update_status(deployment_id, DeploymentStatus.failed, str(exc))


def run_terraform_destroy(deployment_id: str, req_data: dict):
    record = get_deployment(deployment_id)
    if not record:
        return

    template_path = get_template_path(record["template_used"])
    executor = TerraformExecutor(template_path, deployment_id)
    variables = {
        "deployment_id": deployment_id,
        "customer_name": record["customer_name"],
        "region": req_data.get("region", "us-east-1"),
        "instance_size": req_data.get("instance_size", "medium"),
    }

    try:
        update_status(deployment_id, DeploymentStatus.destroying)
        init_result = executor.init()
        if init_result.returncode != 0:
            raise RuntimeError(f"terraform init failed:\n{init_result.stderr}")

        destroy_result = executor.destroy(variables)
        if destroy_result.returncode != 0:
            raise RuntimeError(f"terraform destroy failed:\n{destroy_result.stderr}")

        update_status(deployment_id, DeploymentStatus.destroyed)
    except Exception as exc:
        update_status(deployment_id, DeploymentStatus.failed, str(exc))


@router.post("/", response_model=DeploymentRecord, status_code=201)
async def create_deployment(req: DeploymentRequest, background_tasks: BackgroundTasks):
    try:
        template_name = select_template(req.infrastructure, req.environment)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    deployment_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()
    record = {
        "id": deployment_id,
        "ticket_id": req.ticket_id,
        "sales_engineer": req.sales_engineer,
        "customer_name": req.customer_name,
        "infrastructure": req.infrastructure.value,
        "environment": req.environment.value,
        "template_used": template_name,
        "status": DeploymentStatus.pending.value,
        "created_at": now,
        "updated_at": now,
        "terraform_workspace": f"workspace-{deployment_id[:8]}",
        "outputs": None,
        "error_message": None,
    }
    save_deployment(record)
    background_tasks.add_task(run_terraform_deploy, deployment_id, req, template_name)
    return _row_to_record(record)


@router.get("/", response_model=List[DeploymentRecord])
async def list_all_deployments(sales_engineer: Optional[str] = Query(None)):
    rows = list_deployments(sales_engineer)
    return [_row_to_record(r) for r in rows]


@router.get("/{deployment_id}", response_model=DeploymentRecord)
async def get_single_deployment(deployment_id: str):
    record = get_deployment(deployment_id)
    if not record:
        raise HTTPException(status_code=404, detail="Deployment not found")
    return _row_to_record(record)


@router.post("/{deployment_id}/destroy", response_model=DeploymentRecord)
async def destroy_deployment(deployment_id: str, background_tasks: BackgroundTasks):
    record = get_deployment(deployment_id)
    if not record:
        raise HTTPException(status_code=404, detail="Deployment not found")
    if record["status"] != DeploymentStatus.deployed.value:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot destroy deployment in status '{record['status']}'",
        )
    background_tasks.add_task(run_terraform_destroy, deployment_id, record)
    return _row_to_record(record)


def _row_to_record(row: dict) -> DeploymentRecord:
    return DeploymentRecord(
        id=row["id"],
        ticket_id=row["ticket_id"],
        sales_engineer=row["sales_engineer"],
        customer_name=row["customer_name"],
        infrastructure=row["infrastructure"],
        environment=row["environment"],
        template_used=row["template_used"],
        status=row["status"],
        created_at=row["created_at"],
        updated_at=row["updated_at"],
        terraform_workspace=row["terraform_workspace"],
        outputs=row.get("outputs"),
        error_message=row.get("error_message"),
    )
