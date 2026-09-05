# SettleFlow Automated Docker & Kubernetes Deployment Script
param(
    [switch]$BuildOnly,
    [switch]$DeployOnly,
    [switch]$Compose
)

$ErrorActionPreference = "Stop"

Write-Host "`n=======================================================" -ForegroundColor Cyan
Write-Host "   SETTLEFLOW DOCKER & KUBERNETES DEPLOYMENT" -ForegroundColor Cyan
Write-Host "=======================================================`n" -ForegroundColor Cyan

# 1. Option: Docker Compose deployment
if ($Compose) {
    Write-Host "[1/2] Deploying via Docker Compose..." -ForegroundColor Yellow
    docker compose up --build -d
    Write-Host "`n[2/2] Verifying containers..." -ForegroundColor Green
    docker compose ps
    Write-Host "`nSettleFlow is live via Docker Compose!" -ForegroundColor Green
    Write-Host "  Frontend: http://localhost:3000" -ForegroundColor Cyan
    Write-Host "  Backend:  http://localhost:8080/api/transactions" -ForegroundColor Cyan
    exit 0
}

# 2. Build Container Images
if (-not $DeployOnly) {
    Write-Host "[1/3] Building Docker container images..." -ForegroundColor Yellow

    Write-Host "  --> Building Backend (ghcr.io/moni-sm/settleflow-backend:latest)..." -ForegroundColor Gray
    docker build -t ghcr.io/moni-sm/settleflow-backend:latest ./backend

    Write-Host "  --> Building Frontend (ghcr.io/moni-sm/settleflow-frontend:latest)..." -ForegroundColor Gray
    docker build -t ghcr.io/moni-sm/settleflow-frontend:latest ./frontend

    Write-Host "  --> Building Mock PSPs (ghcr.io/moni-sm/settleflow-psp-mocks:latest)..." -ForegroundColor Gray
    docker build -t ghcr.io/moni-sm/settleflow-psp-mocks:latest ./psp-mocks

    Write-Host "  --> Building Recon Worker (ghcr.io/moni-sm/settleflow-recon:latest)..." -ForegroundColor Gray
    docker build -t ghcr.io/moni-sm/settleflow-recon:latest ./reconciliation

    Write-Host "`nAll Docker images built successfully!" -ForegroundColor Green
}

if ($BuildOnly) {
    Write-Host "BuildOnly specified. Skipping Kubernetes apply." -ForegroundColor Yellow
    exit 0
}

# 3. Deploy to Kubernetes
Write-Host "`n[2/3] Applying Kubernetes manifests (Kustomize)..." -ForegroundColor Yellow
kubectl apply -k k8s/

Write-Host "`n[3/3] Waiting for deployments to become ready..." -ForegroundColor Yellow
kubectl rollout status deployment/postgres-deployment -n settleflow --timeout=120s
kubectl rollout status deployment/psp-mocks-deployment -n settleflow --timeout=120s
kubectl rollout status deployment/backend-deployment -n settleflow --timeout=180s
kubectl rollout status deployment/frontend-deployment -n settleflow --timeout=180s
kubectl rollout status deployment/public-tunnel -n settleflow --timeout=90s

Write-Host "`n=======================================================" -ForegroundColor Green
Write-Host "   SettleFlow Deployed Successfully to Kubernetes!      " -ForegroundColor Green
Write-Host "=======================================================" -ForegroundColor Green

Write-Host "`nCurrent Pod Status:" -ForegroundColor Cyan
kubectl get pods -n settleflow

Write-Host "`nExtracting Live Public Tunnel URL..." -ForegroundColor Yellow
Start-Sleep -Seconds 5
$tunnelLogs = kubectl logs -l app=public-tunnel -n settleflow --tail=50
$tunnelMatch = ($tunnelLogs | Select-String -Pattern 'https://[a-zA-Z0-9-]+\.trycloudflare\.com')
if ($tunnelMatch) {
    $tunnelUrl = $tunnelMatch.Matches.Value | Select-Object -First 1
    Write-Host "`n=======================================================" -ForegroundColor Green
    Write-Host "PUBLIC LIVE LINK: $tunnelUrl" -ForegroundColor Green
    Write-Host "Share this URL publicly with anyone!" -ForegroundColor Cyan
    Write-Host "=======================================================`n" -ForegroundColor Green
} else {
    Write-Host "`nCloudflare tunnel URL is still initializing. Check logs with:" -ForegroundColor Yellow
    Write-Host "  kubectl logs -l app=public-tunnel -n settleflow --tail=20" -ForegroundColor White
}

Write-Host "`nTo access locally via port-forwarding:" -ForegroundColor Yellow
Write-Host "  kubectl port-forward svc/frontend-service 3000:3000 -n settleflow" -ForegroundColor White
Write-Host "  kubectl port-forward svc/backend-service 8080:8080 -n settleflow" -ForegroundColor White
Write-Host "`nLocal URL: http://localhost:3000`n" -ForegroundColor Green
