# SettleFlow Automated Docker & Kubernetes Deployment Script
param(
    [switch]$BuildOnly,
    [switch]$DeployOnly,
    [switch]$Compose
)

$ErrorActionPreference = "Stop"

Write-Host "`n=======================================================" -ForegroundColor Cyan
Write-Host "   🚀 SETTLEFLOW DOCKER & KUBERNETES DEPLOYMENT" -ForegroundColor Cyan
Write-Host "=======================================================`n" -ForegroundColor Cyan

# 1. Option: Docker Compose deployment
if ($Compose) {
    Write-Host "[1/2] 🐳 Deploying via Docker Compose..." -ForegroundColor Yellow
    docker compose up --build -d
    Write-Host "`n[2/2] ✅ Verifying containers..." -ForegroundColor Green
    docker compose ps
    Write-Host "`n🎉 SettleFlow is live via Docker Compose!" -ForegroundColor Green
    Write-Host "  👉 Frontend: http://localhost:3000" -ForegroundColor Cyan
    Write-Host "  👉 Backend:  http://localhost:8080/api/transactions" -ForegroundColor Cyan
    exit 0
}

# 2. Build Container Images
if (-not $DeployOnly) {
    Write-Host "[1/3] 🔨 Building Docker container images..." -ForegroundColor Yellow

    Write-Host "  --> Building Backend (ghcr.io/moni-sm/settleflow-backend:latest)..." -ForegroundColor Gray
    docker build -t ghcr.io/moni-sm/settleflow-backend:latest ./backend

    Write-Host "  --> Building Frontend (ghcr.io/moni-sm/settleflow-frontend:latest)..." -ForegroundColor Gray
    docker build -t ghcr.io/moni-sm/settleflow-frontend:latest ./frontend

    Write-Host "  --> Building Mock PSPs (ghcr.io/moni-sm/settleflow-psp-mocks:latest)..." -ForegroundColor Gray
    docker build -t ghcr.io/moni-sm/settleflow-psp-mocks:latest ./psp-mocks

    Write-Host "  --> Building Recon Worker (ghcr.io/moni-sm/settleflow-recon:latest)..." -ForegroundColor Gray
    docker build -t ghcr.io/moni-sm/settleflow-recon:latest ./reconciliation

    Write-Host "`n✅ All Docker images built successfully!" -ForegroundColor Green
}

if ($BuildOnly) {
    Write-Host "BuildOnly specified. Skipping Kubernetes apply." -ForegroundColor Yellow
    exit 0
}

# 3. Deploy to Kubernetes
Write-Host "`n[2/3] ☸️ Applying Kubernetes manifests (Kustomize)..." -ForegroundColor Yellow
kubectl apply -k k8s/

Write-Host "`n[3/3] ⏳ Waiting for deployments to become ready..." -ForegroundColor Yellow
kubectl rollout status deployment/postgres-deployment -n settleflow --timeout=120s
kubectl rollout status deployment/psp-mocks-deployment -n settleflow --timeout=120s
kubectl rollout status deployment/backend-deployment -n settleflow --timeout=180s
kubectl rollout status deployment/frontend-deployment -n settleflow --timeout=180s

Write-Host "`n=======================================================" -ForegroundColor Green
Write-Host "   🎉 SettleFlow Deployed Successfully to Kubernetes!   " -ForegroundColor Green
Write-Host "=======================================================" -ForegroundColor Green

Write-Host "`n📋 Current Pod Status:" -ForegroundColor Cyan
kubectl get pods -n settleflow

Write-Host "`n🌐 To access the application locally, run in separate terminals:" -ForegroundColor Yellow
Write-Host "  kubectl port-forward svc/frontend-service 3000:3000 -n settleflow" -ForegroundColor White
Write-Host "  kubectl port-forward svc/backend-service 8080:8080 -n settleflow" -ForegroundColor White
Write-Host "`nThen open: http://localhost:3000 in your browser.`n" -ForegroundColor Green
