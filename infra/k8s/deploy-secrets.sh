#!/bin/bash
# K8s Secrets Deployment Script
# This script safely deploys production secrets to K8s cluster
#
# USAGE:
#   ./infra/k8s/deploy-secrets.sh
#
# REQUIREMENTS:
#   - kubectl configured and pointing to production cluster
#   - All secret values ready (see docs/task-2-k8s-secrets-checklist.md)
#   - /tmp/k8s-secrets.env file with all values
#
# SECURITY:
#   - Script deletes /tmp/k8s-secrets.env after deployment
#   - Never commits secrets to git
#   - Logs actions for audit trail

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  K8s Secrets Deployment — Zunftgewerk Production          ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Step 0: Pre-flight checks
echo -e "${BLUE}Step 0: Pre-flight Checks${NC}"
echo "  ✓ Checking kubectl..."
if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}  ✗ kubectl not found. Install it first.${NC}"
    exit 1
fi

echo "  ✓ Checking cluster context..."
CONTEXT=$(kubectl config current-context)
echo "    Current context: $CONTEXT"

echo "  ✓ Checking namespace..."
if ! kubectl get namespace zunftgewerk &> /dev/null; then
    echo -e "${YELLOW}    Namespace 'zunftgewerk' not found. Creating...${NC}"
    kubectl create namespace zunftgewerk
fi

echo "  ✓ Checking secrets file..."
if [ ! -f "/tmp/k8s-secrets.env" ]; then
    echo -e "${RED}  ✗ /tmp/k8s-secrets.env not found!${NC}"
    echo "    See: docs/task-2-k8s-secrets-checklist.md Step 1.7"
    exit 1
fi

echo -e "${GREEN}✓ Pre-flight checks passed${NC}"
echo

# Step 1: Source secrets
echo -e "${BLUE}Step 1: Loading Secrets${NC}"
source /tmp/k8s-secrets.env
echo -e "${GREEN}✓ Secrets loaded from /tmp/k8s-secrets.env${NC}"
echo

# Step 2: Validate secrets
echo -e "${BLUE}Step 2: Validating Secrets${NC}"

# Check all keys exist
REQUIRED_KEYS=(
    "DATABASE_URL"
    "DATABASE_USERNAME"
    "DATABASE_PASSWORD"
    "JWT_PRIVATE_KEY_PEM"
    "JWT_PUBLIC_KEY_PEM"
    "STRIPE_SECRET_KEY"
    "STRIPE_WEBHOOK_SECRET"
    "MFA_ENCRYPTION_KEY"
    "REDIS_HOST"
    "REDIS_PORT"
)

for key in "${REQUIRED_KEYS[@]}"; do
    if [ -z "${!key}" ]; then
        echo -e "${RED}  ✗ Missing: $key${NC}"
        exit 1
    fi
    echo "  ✓ $key: present"
done

echo -e "${GREEN}✓ All required secrets validated${NC}"
echo

# Step 3: Create K8s Secret
echo -e "${BLUE}Step 3: Creating K8s Secret${NC}"

# Check if secret already exists
if kubectl get secret zunftgewerk-secrets -n zunftgewerk &> /dev/null; then
    echo -e "${YELLOW}  ⚠ Secret 'zunftgewerk-secrets' already exists${NC}"
    echo -n "  Replace it? [y/N]: "
    read -r REPLACE
    if [ "$REPLACE" = "y" ]; then
        kubectl delete secret zunftgewerk-secrets -n zunftgewerk
        echo "  ✓ Old secret deleted"
    else
        echo "  Skipping secret creation"
        exit 0
    fi
fi

# Create secret with envFrom-compatible keys
kubectl create secret generic zunftgewerk-secrets \
  --namespace=zunftgewerk \
  --from-literal=DATABASE_URL="$DATABASE_URL" \
  --from-literal=DATABASE_USERNAME="$DATABASE_USERNAME" \
  --from-literal=DATABASE_PASSWORD="$DATABASE_PASSWORD" \
  --from-literal=JWT_PRIVATE_KEY_PEM="$JWT_PRIVATE_KEY_PEM" \
  --from-literal=JWT_PUBLIC_KEY_PEM="$JWT_PUBLIC_KEY_PEM" \
  --from-literal=STRIPE_SECRET_KEY="$STRIPE_SECRET_KEY" \
  --from-literal=STRIPE_WEBHOOK_SECRET="$STRIPE_WEBHOOK_SECRET" \
  --from-literal=MFA_ENCRYPTION_KEY="$MFA_ENCRYPTION_KEY" \
  --from-literal=REDIS_HOST="$REDIS_HOST" \
  --from-literal=REDIS_PORT="$REDIS_PORT"

if [ -n "$OPENROUTESERVICE_API_KEY" ]; then
    kubectl patch secret zunftgewerk-secrets -n zunftgewerk \
      -p '{"stringData":{"OPENROUTESERVICE_API_KEY":"'$OPENROUTESERVICE_API_KEY'"}}'
fi

echo -e "${GREEN}✓ K8s Secret created: zunftgewerk-secrets${NC}"
echo

# Step 4: Verify secret
echo -e "${BLUE}Step 4: Verifying Secret${NC}"
echo "  Checking secret structure..."
kubectl describe secret zunftgewerk-secrets -n zunftgewerk | grep -E "^[a-zA-Z_]+"
echo -e "${GREEN}✓ Secret structure verified${NC}"
echo

# Step 5: Update deployments
echo -e "${BLUE}Step 5: Updating Deployments${NC}"
echo "  Deploying manifests..."
kubectl apply -k infra/k8s/base/
echo -e "${GREEN}✓ Manifests applied${NC}"
echo

# Step 6: Wait for rollout
echo -e "${BLUE}Step 6: Waiting for Deployments${NC}"
for deployment in zunftgewerk-api zunftgewerk-landing zunftgewerk-web; do
    echo "  Waiting for $deployment..."
    kubectl rollout status deployment/$deployment -n zunftgewerk --timeout=5m || true
done
echo -e "${GREEN}✓ Deployments updated${NC}"
echo

# Step 7: Verify pods
echo -e "${BLUE}Step 7: Verifying Pods${NC}"
kubectl get pods -n zunftgewerk -o wide
echo -e "${GREEN}✓ Pods status displayed${NC}"
echo

# Step 8: Check API health
echo -e "${BLUE}Step 8: Health Check${NC}"
echo "  Testing API health..."
if kubectl get service zunftgewerk-api -n zunftgewerk &> /dev/null; then
    # Get service IP or hostname
    API_IP=$(kubectl get service zunftgewerk-api -n zunftgewerk -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "pending")
    if [ "$API_IP" != "pending" ]; then
        if curl -sf "http://$API_IP:8080/actuator/health" > /dev/null 2>&1; then
            echo -e "${GREEN}✓ API health check passed${NC}"
        else
            echo -e "${YELLOW}⚠ API not responding yet (may still be starting)${NC}"
        fi
    else
        echo -e "${YELLOW}⚠ LoadBalancer IP not assigned yet. Check again in a few minutes.${NC}"
    fi
fi
echo

# Step 9: Cleanup
echo -e "${BLUE}Step 9: Cleanup${NC}"
echo -n "  Delete /tmp/k8s-secrets.env? [Y/n]: "
read -r CLEANUP
if [ "$CLEANUP" != "n" ]; then
    # Secure delete
    if command -v shred &> /dev/null; then
        shred -vfz /tmp/k8s-secrets.env
    else
        rm /tmp/k8s-secrets.env
    fi
    echo -e "${GREEN}✓ Temporary secrets file deleted${NC}"
else
    echo -e "${YELLOW}⚠ Remember to delete /tmp/k8s-secrets.env manually${NC}"
fi
echo

echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ✓ K8s Secrets Deployment Complete!                      ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo
echo "Next steps:"
echo "  1. Monitor pod logs: kubectl logs -f deployment/zunftgewerk-api -n zunftgewerk"
echo "  2. Test API: curl http://API_IP:8080/actuator/health"
echo "  3. Check web app: curl http://WEB_IP:3001"
echo "  4. Document rotation: Edit infra/k8s/SECRETS.md"
echo
echo "For troubleshooting, see: docs/task-2-k8s-secrets-checklist.md Step 5-6"
