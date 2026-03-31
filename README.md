# Terraform Demo Orchestrator

A self-service portal where sales engineers raise deployment requests via a frontend UI, and the backend selects the correct Terraform template and runs `terraform apply` or `terraform destroy` accordingly.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    Sales Engineer Browser                    │
│               http://localhost:3000  (Next.js)               │
└────────────────────────┬─────────────────────────────────────┘
                         │ REST API calls
                         ▼
┌──────────────────────────────────────────────────────────────┐
│               FastAPI Backend  (port 8000)                   │
│  POST /api/deployments/   →  select template + apply         │
│  POST /api/deployments/{id}/destroy  →  destroy              │
│  GET  /api/deployments/   →  list all                        │
└────────────────────────┬─────────────────────────────────────┘
                         │ subprocess
                         ▼
┌──────────────────────────────────────────────────────────────┐
│              Terraform Templates  (./terraform/)             │
│   k8s-apm/  |  baremetal-apm/  |  network/  |  vmware/      │
└──────────────────────────────────────────────────────────────┘
```

---

## ZylkerKart Template (k8s-apm)

The **k8s-apm** template is the production-grade **ZylkerKart** application from [site24x7/demo-apps](https://github.com/site24x7/demo-apps/tree/main/Terraform%20Deployment). It deploys a full 6-microservice e-commerce application on Kubernetes with optional Site24x7 APM monitoring and chaos engineering support.

### What it deploys

| Component | Description |
|-----------|-------------|
| **ZylkerKart microservices** | 6 services: Product (Java/Spring Boot), Order (Node.js), Search (Go), Payment (Python/Flask), Auth (C#/.NET), Storefront (NGINX) |
| **MySQL** | Persistent database with PVC |
| **Redis** | In-memory cache |
| **NGINX Ingress** | External load balancer |
| **Site24x7 APM** | Optional — auto-installs APM agents per service (Java, Node.js, Go, Python, .NET) when `site24x7_license_key` is provided |
| **Site24x7 Monitor Group** | Groups all APM monitors in one dashboard |
| **Chaos Engineering** | Site24x7 Labs DaemonSet for fault injection experiments |

### Cloud Provider Support

The `cloud_provider` variable toggles between:
- **`azure`** — deploys on Azure AKS (Azure Kubernetes Service)
- **`aws`** — deploys on AWS EKS (Elastic Kubernetes Service) with full VPC, subnets, IAM roles, OIDC, and EBS CSI driver

### Required Environment Variables for APM

Set these environment variables before running `terraform apply` when `site24x7_license_key` is provided:

```powershell
$env:SITE24X7_CLIENT_ID     = "your-zoho-oauth-client-id"
$env:SITE24X7_CLIENT_SECRET = "your-zoho-oauth-client-secret"
$env:SITE24X7_REFRESH_TOKEN = "your-zoho-oauth-refresh-token"
```

These are used to authenticate with the Site24x7 REST API to fetch APM application IDs and create Monitor Groups.

---

## Deployment Option Matrix

| Option | Infrastructure | Environment | Terraform Template |
|--------|---------------|-------------|-------------------|
| A | Kubernetes | APM | `k8s-apm/` — ZylkerKart (Azure AKS or AWS EKS) + APM Agent |
| B | Bare Metal | APM | `baremetal-apm/` — Application + APM + Server |
| C | Any | Network | `network/` — Network Deployment |
| D | Any | VMware | `vmware/` — VMware Deployment |

---

## Prerequisites

- **Python 3.11+** — [https://www.python.org/downloads/](https://www.python.org/downloads/)
- **Node.js 18+** — [https://nodejs.org/](https://nodejs.org/)
- **Terraform 1.5+** — [https://www.terraform.io/downloads](https://www.terraform.io/downloads)
- **Docker Desktop** (optional, for Docker Compose setup) — [https://www.docker.com/products/docker-desktop/](https://www.docker.com/products/docker-desktop/)

For k8s-apm deployments, also install:
- **Azure CLI** (`az`) — for AKS deployments
- **AWS CLI + `aws`** — for EKS deployments
- **kubectl** — Kubernetes CLI
- **helm** — Helm package manager

---

## Running on Windows (Without Docker)

### Option 1: Automated Script

```bat
run.bat
```

The script will:
1. Check Python, Node.js, and Terraform installations
2. Create a Python virtual environment under `backend/venv/`
3. Install backend dependencies
4. Install frontend npm dependencies
5. Start the backend on `http://localhost:8000`
6. Start the frontend on `http://localhost:3000`
7. Open the browser automatically

### Option 2: Manual Setup

**Backend:**
```bat
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Frontend (in a separate terminal):**
```bat
cd frontend
npm install
npm run dev
```

---

## Running with Docker Compose

```bash
docker-compose up --build
```

- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend API: [http://localhost:8000](http://localhost:8000)
- API Docs (Swagger): [http://localhost:8000/docs](http://localhost:8000/docs)

---

## API Reference

### Health Check
```
GET /health
→ { "status": "ok", "service": "terraform-demo-orchestrator" }
```

### Create Deployment
```
POST /api/deployments/
Content-Type: application/json

{
  "ticket_id": "DEMO-001",
  "sales_engineer": "Jane Smith",
  "customer_name": "Acme Corp",
  "infrastructure": "kubernetes",   // or "bare_metal"
  "environment": "apm",             // or "network" or "vmware"
  "region": "us-east-1",
  "instance_size": "medium",        // small | medium | large
  "demo_duration_days": 7,
  "cloud_provider": "azure",        // "azure" or "aws" — only for k8s-apm
  "site24x7_license_key": ""        // optional — enables APM monitoring
}
```

### List Deployments
```
GET /api/deployments/
GET /api/deployments/?sales_engineer=Jane+Smith
```

### Get Single Deployment
```
GET /api/deployments/{deployment_id}
```

### Destroy Deployment
```
POST /api/deployments/{deployment_id}/destroy
```

---

## Frontend Usage

1. **Submit a Request** — Fill in the form at the top of the page with ticket ID, your name, customer name, infrastructure type, and environment. The template preview updates live.
2. **Select Cloud Provider** — When Kubernetes + APM is selected, a **Cloud Provider** dropdown appears to choose between Azure (AKS) or AWS (EKS).
3. **Site24x7 License Key** — Optionally enter your Site24x7 license key to enable APM agent injection into all 6 ZylkerKart microservices.
4. **Monitor Progress** — The dashboard below auto-refreshes every 5 seconds showing all deployments with color-coded status badges.
5. **Destroy a Deployment** — Click the red "Destroy" button next to any `deployed` deployment and confirm in the dialog.
6. **View Details** — Click a ticket ID link to see full deployment details, Terraform outputs, and error messages.

---

## Project Structure

```
terraform-demo-orchestrator/
├── README.md
├── docker-compose.yml
├── run.bat                          # Windows quick-start script
├── .gitignore
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app/
│       ├── main.py                  # FastAPI entry point
│       ├── models.py                # Pydantic models & enums (incl. CloudProvider)
│       ├── database.py              # SQLite layer
│       ├── routers/
│       │   └── deployments.py       # API routes + background tasks
│       └── services/
│           ├── template_selector.py # Maps infra+env+cloud_provider → template dir
│           └── terraform_executor.py# Runs terraform commands
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── components/
│       │   ├── DeploymentForm.tsx   # Cloud Provider dropdown + License Key field
│       │   ├── DeploymentDashboard.tsx
│       │   └── DestroyConfirmDialog.tsx
│       ├── pages/
│       │   ├── index.tsx
│       │   └── deployments/[id].tsx
│       └── services/
│           └── api.ts
└── terraform/
    ├── templates/
    │   ├── k8s-apm/                 # ZylkerKart production template
    │   │   ├── main.tf              # Multi-cloud providers (Azure + AWS)
    │   │   ├── variables.tf         # cloud_provider, ticket_id, license_key, etc.
    │   │   ├── outputs.tf
    │   │   ├── aks.tf               # Azure AKS cluster
    │   │   ├── eks.tf               # AWS EKS cluster + VPC + IAM + EBS CSI
    │   │   ├── k8s-resources.tf     # 6 microservices, MySQL, Redis, NGINX
    │   │   ├── site24x7_apm.tf      # APM token refresh + agent polling
    │   │   ├── site24x7_mg.tf       # Monitor Group creation
    │   │   ├── site24_7_chaos.tf    # Chaos engineering Helm chart
    │   │   ├── site24x7_chaos_agent.tf  # Chaos agent DaemonSet + RBAC
    │   │   ├── terraform.tfvars.example
    │   │   ├── scripts/             # PowerShell scripts
    │   │   └── site24x7-labs/       # Helm chart for Site24x7 Labs
    │   ├── baremetal-apm/
    │   ├── network/
    │   └── vmware/
    └── modules/
        ├── apm-agent/
        ├── app-server/
        └── networking/
```

---

## Deployment Status Flow

```
pending → planning → applying → deployed
                              ↓
                          destroying → destroyed
                              
Any stage can → failed
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `terraform: command not found` | Add Terraform to your PATH. See [https://www.terraform.io/downloads](https://www.terraform.io/downloads) |
| Backend port 8000 already in use | Change the port: `uvicorn app.main:app --port 8001` |
| Frontend port 3000 already in use | `npm run dev -- --port 3001` |
| CORS errors in browser | Ensure backend is running on port 8000 and `NEXT_PUBLIC_API_URL` is set correctly |
| Deployment stuck in `planning` | Check backend terminal for Terraform errors |
| SQLite locked | Stop all backend processes, delete `backend/deployments.db`, and restart |
| APM registration timeout | Ensure `SITE24X7_CLIENT_ID`, `SITE24X7_CLIENT_SECRET`, and `SITE24X7_REFRESH_TOKEN` are set |
| AKS/EKS auth error | Run `az login` (Azure) or `aws configure` (AWS) before starting the backend |


| Option | Infrastructure | Environment | Terraform Template |
|--------|---------------|-------------|-------------------|
| A | Kubernetes | APM | `k8s-apm/` — Kubernetes + Application + APM Agent |
| B | Bare Metal | APM | `baremetal-apm/` — Application + APM + Server |
| C | Any | Network | `network/` — Network Deployment |
| D | Any | VMware | `vmware/` — VMware Deployment |

---

## Prerequisites

- **Python 3.11+** — [https://www.python.org/downloads/](https://www.python.org/downloads/)
- **Node.js 18+** — [https://nodejs.org/](https://nodejs.org/)
- **Terraform 1.5+** — [https://www.terraform.io/downloads](https://www.terraform.io/downloads)
- **Docker Desktop** (optional, for Docker Compose setup) — [https://www.docker.com/products/docker-desktop/](https://www.docker.com/products/docker-desktop/)

---

## Running on Windows (Without Docker)

### Option 1: Automated Script

```bat
run.bat
```

The script will:
1. Check Python, Node.js, and Terraform installations
2. Create a Python virtual environment under `backend/venv/`
3. Install backend dependencies
4. Install frontend npm dependencies
5. Start the backend on `http://localhost:8000`
6. Start the frontend on `http://localhost:3000`
7. Open the browser automatically

### Option 2: Manual Setup

**Backend:**
```bat
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Frontend (in a separate terminal):**
```bat
cd frontend
npm install
npm run dev
```

---

## Running with Docker Compose

```bash
docker-compose up --build
```

- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend API: [http://localhost:8000](http://localhost:8000)
- API Docs (Swagger): [http://localhost:8000/docs](http://localhost:8000/docs)

---

## API Reference

### Health Check
```
GET /health
→ { "status": "ok", "service": "terraform-demo-orchestrator" }
```

### Create Deployment
```
POST /api/deployments/
Content-Type: application/json

{
  "ticket_id": "DEMO-001",
  "sales_engineer": "Jane Smith",
  "customer_name": "Acme Corp",
  "infrastructure": "kubernetes",   // or "bare_metal"
  "environment": "apm",             // or "network" or "vmware"
  "region": "us-east-1",
  "instance_size": "medium",        // small | medium | large
  "demo_duration_days": 7
}
```

### List Deployments
```
GET /api/deployments/
GET /api/deployments/?sales_engineer=Jane+Smith
```

### Get Single Deployment
```
GET /api/deployments/{deployment_id}
```

### Destroy Deployment
```
POST /api/deployments/{deployment_id}/destroy
```

---

## Frontend Usage

1. **Submit a Request** — Fill in the form at the top of the page with ticket ID, your name, customer name, infrastructure type, and environment. The template preview updates live.
2. **Monitor Progress** — The dashboard below auto-refreshes every 5 seconds showing all deployments with color-coded status badges.
3. **Destroy a Deployment** — Click the red "Destroy" button next to any `deployed` deployment and confirm in the dialog.
4. **View Details** — Click a ticket ID link to see full deployment details, Terraform outputs, and error messages.

---

## Project Structure

```
terraform-demo-orchestrator/
├── README.md
├── docker-compose.yml
├── run.bat                          # Windows quick-start script
├── .gitignore
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app/
│       ├── main.py                  # FastAPI entry point
│       ├── models.py                # Pydantic models & enums
│       ├── database.py              # SQLite layer
│       ├── routers/
│       │   └── deployments.py       # API routes + background tasks
│       └── services/
│           ├── template_selector.py # Maps infra+env → template dir
│           └── terraform_executor.py# Runs terraform commands
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── components/
│       │   ├── DeploymentForm.tsx
│       │   ├── DeploymentDashboard.tsx
│       │   └── DestroyConfirmDialog.tsx
│       ├── pages/
│       │   ├── index.tsx
│       │   └── deployments/[id].tsx
│       └── services/
│           └── api.ts
└── terraform/
    ├── templates/
    │   ├── k8s-apm/
    │   ├── baremetal-apm/
    │   ├── network/
    │   └── vmware/
    └── modules/
        ├── apm-agent/
        ├── app-server/
        └── networking/
```

---

## Deployment Status Flow

```
pending → planning → applying → deployed
                              ↓
                          destroying → destroyed
                              
Any stage can → failed
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `terraform: command not found` | Add Terraform to your PATH. See [https://www.terraform.io/downloads](https://www.terraform.io/downloads) |
| Backend port 8000 already in use | Change the port: `uvicorn app.main:app --port 8001` |
| Frontend port 3000 already in use | `npm run dev -- --port 3001` |
| CORS errors in browser | Ensure backend is running on port 8000 and `NEXT_PUBLIC_API_URL` is set correctly |
| Deployment stuck in `planning` | Check backend terminal for Terraform errors |
| SQLite locked | Stop all backend processes, delete `backend/deployments.db`, and restart |
