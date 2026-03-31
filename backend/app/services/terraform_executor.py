import subprocess
import platform
import shutil
import json
import os
from pathlib import Path
from typing import Optional


class TerraformExecutor:
    def __init__(self, template_dir: Path, deployment_id: str):
        self.template_dir = template_dir
        self.deployment_id = deployment_id
        self.state_dir = Path("tf-state") / deployment_id
        self.state_dir.mkdir(parents=True, exist_ok=True)
        self.is_windows = platform.system() == "Windows"

    def _run(self, args: list, cwd: Optional[Path] = None) -> subprocess.CompletedProcess:
        cmd = ["terraform"] + args
        return subprocess.run(
            cmd,
            cwd=str(cwd or self.template_dir),
            capture_output=True,
            text=True,
            shell=self.is_windows,
        )

    def init(self) -> subprocess.CompletedProcess:
        backend_config = [
            f"-backend-config=path={self.state_dir.resolve() / 'terraform.tfstate'}"
        ]
        result = self._run(["init", "-reconfigure"] + backend_config)
        return result

    def plan(self, variables: dict) -> subprocess.CompletedProcess:
        var_args = []
        for key, value in variables.items():
            if value not in (None, ""):
                var_args += ["-var", f"{key}={value}"]
        plan_file = str(self.state_dir.resolve() / "tfplan")
        result = self._run(["plan", "-out", plan_file] + var_args)
        return result

    def apply(self) -> subprocess.CompletedProcess:
        plan_file = str(self.state_dir.resolve() / "tfplan")
        result = self._run(["apply", "-auto-approve", plan_file])
        return result

    def destroy(self, variables: dict) -> subprocess.CompletedProcess:
        var_args = []
        for key, value in variables.items():
            if value is not None and value != "":
                var_args += ["-var", f"{key}={value}"]
        state_file = str(self.state_dir.resolve() / "terraform.tfstate")
        result = self._run(
            ["destroy", "-auto-approve", f"-state={state_file}"] + var_args
        )
        return result

    def output(self) -> dict:
        state_file = str(self.state_dir.resolve() / "terraform.tfstate")
        result = self._run(["output", "-json", f"-state={state_file}"])
        if result.returncode == 0 and result.stdout.strip():
            try:
                raw = json.loads(result.stdout)
                return {k: v.get("value") for k, v in raw.items()}
            except json.JSONDecodeError:
                return {}
        return {}
