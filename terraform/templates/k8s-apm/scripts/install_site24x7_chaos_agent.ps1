# =============================================================================
# Site24x7 Labs — Universal Agent Installer (PowerShell)
# =============================================================================
# Usage:
#   irm http://<server>/api/v1/install.ps1 | iex
#   .\install_site24x7_chaos_agent.ps1 `
#     -Platform <kubernetes|docker|compose|windows> `
#     -Token "s24x7_at_..." `
#     -EnvironmentId "uuid" `
#     -Server "<ip-or-hostname>"
# =============================================================================

[CmdletBinding()]
param(
    [ValidateSet("kubernetes", "docker", "compose", "windows")]
    [string]$Platform,

    [string]$Token,

    [string]$EnvironmentId,

    [Alias("s")]
    [string]$Server,

    [string]$Namespace = "site24x7-labs",

    [string]$Image = "impazhani/site24x7-labs-agent:latest-vm",

    [string]$Name,

    [switch]$Uninstall,

    [switch]$Help
)

$ErrorActionPreference = "Stop"

function Log-Info  { param([string]$Message) Write-Host "[INFO]  $Message" -ForegroundColor Green }
function Log-Warn  { param([string]$Message) Write-Host "[WARN]  $Message" -ForegroundColor Yellow }
function Log-Error { param([string]$Message) Write-Host "[ERROR] $Message" -ForegroundColor Red }
function Log-Step  { param([string]$Message) Write-Host "[STEP]  $Message" -ForegroundColor Blue }

function Show-Usage {
    @"
Site24x7 Labs Agent Installer (PowerShell)

Usage:
  .\install_site24x7_chaos_agent.ps1 [OPTIONS]

Options:
  -Platform <kubernetes|docker|compose|windows>  Target platform (required)
  -Token <token>                                  Agent token (required)
  -EnvironmentId <uuid>                           Environment ID (required)
  -Server <ip-or-hostname>                        Server address (required)
  -Namespace <ns>                                 Kubernetes namespace (default: site24x7-labs)
  -Image <image>                                  Agent Docker image
  -Name <name>                                    Agent name (default: hostname)
  -Uninstall                                      Remove agent instead of installing
  -Help                                           Show this help
"@
}

if ($Help) {
    Show-Usage
    return
}

function Confirm-Parameters {
    if ([string]::IsNullOrWhiteSpace($Server)) {
        Log-Error "-Server is required (IP or hostname of the Site24x7 Labs server)"
        exit 1
    }

    $script:ServerAddress = "${Server}:9090"
    $script:HttpAddress   = "http://${Server}"

    if ([string]::IsNullOrWhiteSpace($Platform)) {
        Log-Error "-Platform is required (kubernetes|docker|compose|windows)"
        exit 1
    }
    if ([string]::IsNullOrWhiteSpace($Token)) {
        Log-Error "-Token is required"
        exit 1
    }
    if ([string]::IsNullOrWhiteSpace($EnvironmentId)) {
        Log-Error "-EnvironmentId is required"
        exit 1
    }
}

function Install-Kubernetes {
    Log-Step "Installing Site24x7 Labs agent on Kubernetes..."

    if (-not (Get-Command kubectl -ErrorAction SilentlyContinue)) {
        Log-Error "kubectl is not installed or not in PATH"
        exit 1
    }

    Log-Info "Namespace: $Namespace"
    Log-Info "Server:    $script:ServerAddress"
    Log-Info "Image:     $Image"

    $manifest = @"
---
apiVersion: v1
kind: Namespace
metadata:
  name: $Namespace
  labels:
    app.kubernetes.io/part-of: site24x7-labs
---
apiVersion: v1
kind: Secret
metadata:
  name: site24x7-labs-agent-secret
  namespace: $Namespace
type: Opaque
stringData:
  AGENT_TOKEN: "$Token"
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: site24x7-labs-agent
  namespace: $Namespace
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: site24x7-labs-agent
rules:
  - apiGroups: [""]
    resources: ["pods"]
    verbs: ["get", "list", "watch", "delete", "deletecollection"]
  - apiGroups: [""]
    resources: ["pods/exec"]
    verbs: ["create"]
  - apiGroups: [""]
    resources: ["pods/log"]
    verbs: ["get"]
  - apiGroups: [""]
    resources: ["services", "endpoints", "nodes"]
    verbs: ["get", "list", "watch"]
  - apiGroups: ["apps"]
    resources: ["deployments", "statefulsets", "daemonsets", "replicasets"]
    verbs: ["get", "list", "watch", "update", "patch"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: site24x7-labs-agent
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: site24x7-labs-agent
subjects:
  - kind: ServiceAccount
    name: site24x7-labs-agent
    namespace: $Namespace
---
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: site24x7-labs-agent
  namespace: $Namespace
spec:
  selector:
    matchLabels:
      app.kubernetes.io/component: agent
      app.kubernetes.io/part-of: site24x7-labs
  template:
    metadata:
      labels:
        app.kubernetes.io/component: agent
        app.kubernetes.io/part-of: site24x7-labs
    spec:
      serviceAccountName: site24x7-labs-agent
      hostPID: true
      containers:
        - name: agent
          image: $Image
          imagePullPolicy: Always
          env:
            - name: SERVER_ADDRESS
              value: "$($script:ServerAddress)"
            - name: AGENT_TOKEN
              valueFrom:
                secretKeyRef:
                  name: site24x7-labs-agent-secret
                  key: AGENT_TOKEN
            - name: AGENT_ENVIRONMENT
              value: "$EnvironmentId"
            - name: AGENT_NAME
              valueFrom:
                fieldRef:
                  fieldPath: spec.nodeName
            - name: ENABLE_KUBERNETES
              value: "true"
            - name: ENABLE_HOST
              value: "true"
          securityContext:
            privileged: true
          volumeMounts:
            - name: proc
              mountPath: /host/proc
              readOnly: true
            - name: sys
              mountPath: /host/sys
              readOnly: true
      volumes:
        - name: proc
          hostPath:
            path: /proc
        - name: sys
          hostPath:
            path: /sys
      tolerations:
        - operator: Exists
"@

    $manifest | kubectl apply -f -
    if ($LASTEXITCODE -ne 0) {
        Log-Error "kubectl apply failed"
        exit 1
    }

    Log-Info "Kubernetes agent installed successfully!"
}

function Uninstall-Kubernetes {
    Log-Step "Uninstalling Site24x7 Labs agent from Kubernetes..."
    kubectl delete daemonset site24x7-labs-agent -n $Namespace --ignore-not-found 2>$null
    kubectl delete clusterrolebinding site24x7-labs-agent --ignore-not-found 2>$null
    kubectl delete clusterrole site24x7-labs-agent --ignore-not-found 2>$null
    kubectl delete serviceaccount site24x7-labs-agent -n $Namespace --ignore-not-found 2>$null
    kubectl delete secret site24x7-labs-agent-secret -n $Namespace --ignore-not-found 2>$null
    Log-Info "Kubernetes agent uninstalled successfully!"
}

# =============================================================================
# Main
# =============================================================================
Confirm-Parameters

if ($Uninstall) {
    switch ($Platform) {
        "kubernetes" { Uninstall-Kubernetes }
        default      { Log-Error "Uninstall not supported for platform: $Platform"; exit 1 }
    }
} else {
    switch ($Platform) {
        "kubernetes" { Install-Kubernetes }
        default      { Log-Error "Platform not supported: $Platform"; exit 1 }
    }
}
