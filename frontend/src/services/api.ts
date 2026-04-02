const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface DeploymentRequest {
  ticket_id: string;
  sales_engineer: string;
  customer_name: string;
  infrastructure: "kubernetes" | "bare_metal";
  environment: "apm" | "network" | "vmware";
  region?: string;
  instance_size?: string;
  demo_duration_days?: number;
  cloud_provider?: "azure" | "aws";
  site24x7_license_key?: string;
}

export interface DeploymentRecord {
  id: string;
  ticket_id: string;
  sales_engineer: string;
  customer_name: string;
  infrastructure: "kubernetes" | "bare_metal";
  environment: "apm" | "network" | "vmware";
  template_used: string;
  status:
    | "pending"
    | "planning"
    | "applying"
    | "deployed"
    | "destroying"
    | "destroyed"
    | "failed";
  created_at: string;
  updated_at: string;
  terraform_workspace: string;
  outputs?: Record<string, unknown> | null;
  error_message?: string | null;
}

export async function createDeployment(
  req: DeploymentRequest
): Promise<DeploymentRecord> {
  const res = await fetch(`${API_URL}/api/deployments/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to create deployment");
  }
  return res.json();
}

export async function listDeployments(
  salesEngineer?: string
): Promise<DeploymentRecord[]> {
  const url = salesEngineer
    ? `${API_URL}/api/deployments/?sales_engineer=${encodeURIComponent(salesEngineer)}`
    : `${API_URL}/api/deployments/`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to list deployments");
  return res.json();
}

export async function getDeployment(id: string): Promise<DeploymentRecord> {
  const res = await fetch(`${API_URL}/api/deployments/${id}`);
  if (!res.ok) throw new Error("Deployment not found");
  return res.json();
}

export async function destroyDeployment(id: string): Promise<DeploymentRecord> {
  const res = await fetch(`${API_URL}/api/deployments/${id}/destroy`, {
    method: "POST",
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to destroy deployment");
  }
  return res.json();
}

export interface TerraformLogEntry {
  phase: string;
  stream: string;
  text: string;
  timestamp: string;
}

export async function getDeploymentLogs(
  id: string
): Promise<TerraformLogEntry[]> {
  const res = await fetch(`${API_URL}/api/deployments/${id}/logs`);
  if (!res.ok) throw new Error("Failed to fetch deployment logs");
  return res.json();
}
