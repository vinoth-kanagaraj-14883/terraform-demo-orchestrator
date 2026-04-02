import subprocess
import platform
import shutil
import json
import os
from pathlib import Path
from typing import Optional

# Per-deployment workspace copies live here (sibling of backend/, terraform/, etc.)
WORKSPACES_BASE = Path(__file__).resolve().parents[4] / "tf-workspaces"


class TerraformExecutor:
    def __init__(self, template_dir: Path, deployment_id: str):
        self.template_dir = template_dir
        self.deployment_id = deployment_id
        self.work_dir = WORKSPACES_BASE / deployment_id
        self.is_windows = platform.system() == "Windows"

    def _prepare_workspace(self) -> None:
        """Copy the template into a per-deployment workspace if not already present."""
        if not self.work_dir.exists():
            self.work_dir.mkdir(parents=True, exist_ok=True)
            shutil.copytree(
                str(self.template_dir),
                str(self.work_dir),
                dirs_exist_ok=True,
            )

    def _run(self, args: list, cwd: Optional[Path] = None) -> subprocess.CompletedProcess:
        cmd = ["terraform"] + args
        return subprocess.run(
            cmd,
            cwd=str(cwd or self.work_dir),
            capture_output=True,
            text=True,
            shell=self.is_windows,
        )

    def init(self) -> subprocess.CompletedProcess:
        self._prepare_workspace()
        result = self._run(["init", "-reconfigure"])
        return result

    def plan(self, variables: dict) -> subprocess.CompletedProcess:
        var_args = []
        for key, value in variables.items():
            if value not in (None, ""):
                var_args += ["-var", f"{key}={value}"]
        result = self._run(["plan", "-out", "tfplan"] + var_args)
        return result

    def apply(self) -> subprocess.CompletedProcess:
        result = self._run(["apply", "-auto-approve", "tfplan"])
        return result

    def destroy(self, variables: dict) -> subprocess.CompletedProcess:
        var_args = []
        for key, value in variables.items():
            if value is not None and value != "":
                var_args += ["-var", f"{key}={value}"]
        init_result = self.init()
        if init_result.returncode != 0:
            return init_result
        result = self._run(["destroy", "-auto-approve"] + var_args)
        return result

    def output(self) -> dict:
        result = self._run(["output", "-json"])
        if result.returncode == 0 and result.stdout.strip():
            try:
                raw = json.loads(result.stdout)
                return {k: v.get("value") for k, v in raw.items()}
            except json.JSONDecodeError:
                return {}
        return {}

    def cleanup(self) -> None:
        """Remove the per-deployment workspace directory."""
        shutil.rmtree(str(self.work_dir), ignore_errors=True)
