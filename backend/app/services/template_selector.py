from pathlib import Path
from typing import Optional
from app.models import InfrastructureType, EnvironmentType, CloudProvider

# Base directory for Terraform templates
TEMPLATES_BASE = Path(__file__).parent.parent.parent.parent / "terraform" / "templates"

TEMPLATE_MAP = {
    (InfrastructureType.kubernetes, EnvironmentType.apm): "k8s-apm",
    (InfrastructureType.bare_metal, EnvironmentType.apm): "baremetal-apm",
    (InfrastructureType.kubernetes, EnvironmentType.network): "network",
    (InfrastructureType.bare_metal, EnvironmentType.network): "network",
    (InfrastructureType.kubernetes, EnvironmentType.vmware): "vmware",
    (InfrastructureType.bare_metal, EnvironmentType.vmware): "vmware",
}


def select_template(
    infrastructure: InfrastructureType,
    environment: EnvironmentType,
    cloud_provider: Optional[CloudProvider] = None,
) -> tuple[str, dict]:
    """Return (template_name, extra_variables) for the given selection."""
    key = (infrastructure, environment)
    template = TEMPLATE_MAP.get(key)
    if template is None:
        raise ValueError(
            f"No template found for infrastructure={infrastructure}, environment={environment}"
        )

    extra_vars: dict = {}
    if template == "k8s-apm":
        extra_vars["cloud_provider"] = (cloud_provider or CloudProvider.azure).value

    return template, extra_vars


def get_template_path(template_name: str) -> Path:
    path = TEMPLATES_BASE / template_name
    return path
