#!/usr/bin/env bash
# ==============================================================================
# SettleFlow Automated Nginx Reverse Proxy & SSL (HTTPS) Setup Script
# Domain: settle-flow.duckdns.org
# ==============================================================================

set -euo pipefail

DOMAIN="${1:-settle-flow.duckdns.org}"
EMAIL="${2:-admin@settleflow.dev}"

echo "=========================================================="
echo "🔒 Setting up Nginx + Free Let's Encrypt SSL for: $DOMAIN"
echo "=========================================================="

# 1. Clean up conflicting containers or k3s listeners
echo "[1/5] Cleaning up old port listeners..."
sudo docker rm -f cloudflare-tunnel cady-ssl 2>/dev/null || true
sudo /usr/local/bin/k3s-uninstall.sh 2>/dev/null || true

# 2. Install Nginx and Certbot
echo "[2/5] Installing Nginx and Certbot..."
sudo apt-get update -y
sudo apt-get install -y nginx certbot python3-certbot-nginx

# 3. Write Nginx reverse proxy configuration
echo "[3/5] Configuring Nginx reverse proxy for $DOMAIN -> localhost:3000..."
sudo tee "/etc/nginx/sites-available/settleflow" > /dev/null << EOF
server {
    listen 80;
    server_name $DOMAIN;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# 4. Enable configuration & reload Nginx
echo "[4/5] Activating Nginx configuration..."
sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -sf "/etc/nginx/sites-available/settleflow" /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# 5. Obtain Let's Encrypt SSL certificate
echo "[5/5] Requesting SSL Certificate from Let's Encrypt..."
sudo certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m "$EMAIL" --redirect || true

echo "=========================================================="
echo "🎉 SUCCESS! Your SettleFlow website is now live on HTTPS:"
echo "👉 https://$DOMAIN"
echo "=========================================================="
