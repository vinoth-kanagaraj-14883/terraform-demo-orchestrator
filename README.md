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

## Deployment Option Matrix

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
