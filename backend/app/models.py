from enum import Enum
from typing import Optional
from pydantic import BaseModel
from datetime import datetime


class InfrastructureType(str, Enum):
    kubernetes = "kubernetes"
    bare_metal = "bare_metal"


class EnvironmentType(str, Enum):
    apm = "apm"
    network = "network"
    vmware = "vmware"


class DeploymentStatus(str, Enum):
    pending = "pending"
    planning = "planning"
    applying = "applying"
    deployed = "deployed"
    destroying = "destroying"
    destroyed = "destroyed"
    failed = "failed"


class DeploymentRequest(BaseModel):
    ticket_id: str
    sales_engineer: str
    customer_name: str
    infrastructure: InfrastructureType
    environment: EnvironmentType
    region: Optional[str] = "us-east-1"
    instance_size: Optional[str] = "medium"
    demo_duration_days: Optional[int] = 7


class DeploymentRecord(BaseModel):
    id: str
    ticket_id: str
    sales_engineer: str
    customer_name: str
    infrastructure: InfrastructureType
    environment: EnvironmentType
    template_used: str
    status: DeploymentStatus
    created_at: datetime
    updated_at: datetime
    terraform_workspace: str
    outputs: Optional[dict] = None
    error_message: Optional[str] = None
