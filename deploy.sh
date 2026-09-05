#!/usr/bin/env bash
set -e

echo -e "\n======================================================="
echo -e "   🚀 SETTLEFLOW DOCKER & KUBERNETES DEPLOYMENT"
echo -e "=======================================================\n"

if [[ "$1" == "--compose" ]]; then
    echo -e "[1/2] 🐳 Deploying via Docker Compose..."
    docker compose up --build -d
    echo -e "\n[2/2] ✅ Verifying containers..."
    docker compose ps
    echo -e "\n🎉 SettleFlow is live via Docker Compose!"
    echo -e "  👉 Frontend: http://localhost:3000"
    echo -e "  👉 Backend:  http://localhost:8080/api/transactions\n"
    exit 0
fi

if [[ "$1" != "--deploy-only" ]]; then
    echo -e "[1/3] 🔨 Building Docker container images..."
    docker build -t ghcr.io/moni-sm/settleflow-backend:latest ./backend
    docker build -t ghcr.io/moni-sm/settleflow-frontend:latest ./frontend
    echo -e "\n✅ All Docker images built successfully!"
fi

if [[ "$1" == "--build-only" ]]; then
    echo -e "Build-only completed. Exiting."
    exit 0
fi

echo -e "\n[2/3] ☸️ Applying Kubernetes manifests (Kustomize)..."
kubectl apply -k k8s/

echo -e "\n[3/3] ⏳ Waiting for deployments to become ready..."
kubectl rollout status deployment/postgres-deployment -n settleflow --timeout=120s
kubectl rollout status deployment/backend-deployment -n settleflow --timeout=180s
kubectl rollout status deployment/frontend-deployment -n settleflow --timeout=180s
kubectl rollout status deployment/public-tunnel -n settleflow --timeout=90s

echo -e "\n======================================================="
echo -e "   🎉 SettleFlow Deployed Successfully to Kubernetes!   "
echo -e "=======================================================\n"

echo -e "📋 Current Pod Status:"
kubectl get pods -n settleflow

echo -e "\n🌐 Access URLs (run port-forward in separate terminals):"
echo -e "  kubectl port-forward svc/frontend-service 3000:3000 -n settleflow"
echo -e "  kubectl port-forward svc/backend-service 8080:8080 -n settleflow"
echo -e "\nThen open http://localhost:3000 in your browser.\n"
