#!/usr/bin/env bash
# ==============================================================================
# SettleFlow AWS EC2 Automated Provisioning Script (Docker + K8s / K3s)
# ==============================================================================
# Tested on: Ubuntu 22.04 / 24.04 LTS on AWS EC2 (t3.medium or t3.large recommended)
# ==============================================================================

set -euo pipefail

echo "========================================================"
echo "🚀 SettleFlow AWS EC2 Setup: Docker + Kubernetes (k3s)"
echo "========================================================"

# 1. Ensure Swap Space (prevents OOM during Maven/Next.js Docker builds)
if [ ! -f /swapfile ]; then
    echo "[1/6] Configuring 2GB Swap Memory..."
    sudo fallocate -l 2G /swapfile || sudo dd if=/dev/zero of=/swapfile bs=1M count=2048
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
fi

# 2. Update OS packages
echo "[2/6] Updating system packages..."
sudo apt-get update -y && sudo apt-get upgrade -y
sudo apt-get install -y git curl wget unzip ca-certificates gnupg lsb-release

# 3. Install Docker
echo "[3/6] Installing Docker Engine..."
if ! command -v docker &> /dev/null; then
    sudo install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    sudo chmod a+r /etc/apt/keyrings/docker.gpg
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt-get update -y
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    sudo usermod -aG docker "$USER"
    echo "Docker installed successfully."
else
    echo "Docker is already installed."
fi

# 3. Install lightweight Kubernetes (k3s)
echo "[3/5] Installing Kubernetes (k3s lightweight production cluster)..."
if ! command -v k3s &> /dev/null; then
    # Install k3s with Docker support
    curl -sfL https://get.k3s.io | sh -s - --docker --write-kubeconfig-mode 644
    echo "k3s Kubernetes cluster installed."
else
    echo "k3s is already installed."
fi

# Configure kubectl alias & permissions for current user
mkdir -p "$HOME/.kube"
sudo cp /etc/rancher/k3s/k3s.yaml "$HOME/.kube/config"
sudo chown -R "$USER:$USER" "$HOME/.kube"
export KUBECONFIG="$HOME/.kube/config"

# 4. Ensure Docker daemon socket permissions
sudo chmod 666 /var/run/docker.sock || true

# 5. Build images & Apply Kubernetes Manifests
echo "[5/5] Deploying SettleFlow to Kubernetes..."
sudo docker build -t ghcr.io/moni-sm/settleflow-backend:latest ./backend
sudo docker build -t ghcr.io/moni-sm/settleflow-frontend:latest ./frontend

# Import local docker images into k3s containerd
sudo docker save ghcr.io/moni-sm/settleflow-backend:latest | sudo k3s ctr images import - || true
sudo docker save ghcr.io/moni-sm/settleflow-frontend:latest | sudo k3s ctr images import - || true

# Deploy to k8s
kubectl apply -k k8s/

echo "Waiting for pods to stabilize..."
kubectl rollout status deployment/postgres-deployment -n settleflow --timeout=120s
kubectl rollout status deployment/backend-deployment -n settleflow --timeout=180s
kubectl rollout status deployment/frontend-deployment -n settleflow --timeout=180s

echo "========================================================"
echo "🎉 SettleFlow is LIVE on your AWS EC2 Instance!"
echo "========================================================"
kubectl get pods -n settleflow -o wide
echo ""
echo "Access points:"
PUBLIC_IP=$(curl -s ifconfig.me || echo "<EC2_PUBLIC_IP>")
echo "  👉 Frontend: http://${PUBLIC_IP}:3000 (Ensure Port 3000 is open in EC2 Security Group)"
echo "  👉 Backend:  http://${PUBLIC_IP}:8080/api/transactions (Port 8080)"
echo "========================================================"
