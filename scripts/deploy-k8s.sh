#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PROJECT_ID="saleor-platform-dev"
REGION="asia-southeast2"
CLUSTER_NAME="saleor-gke-dev"

echo -e "${GREEN}🚀 Deploying Saleor Applications to GKE${NC}"

# Function to check cluster connection
check_cluster_connection() {
    echo -e "${YELLOW}🔍 Checking cluster connection...${NC}"
    if kubectl cluster-info &> /dev/null; then
        echo -e "${GREEN}✅ Connected to cluster${NC}"
        kubectl cluster-info | head -1
    else
        echo -e "${RED}❌ Not connected to cluster. Getting credentials...${NC}"
        gcloud container clusters get-credentials $CLUSTER_NAME --region $REGION --project $PROJECT_ID
    fi
}

# Function to update secrets from Secret Manager
update_secrets() {
    echo -e "${YELLOW}🔐 Updating secrets from Cloud resources...${NC}"
    
    # Get database password from Secret Manager
    DB_PASSWORD=$(gcloud secrets versions access latest --secret="saleor-db-dev-password" --project=$PROJECT_ID)
    DB_HOST=$(gcloud sql instances describe saleor-db-dev --project=$PROJECT_ID --format="value(ipAddresses[0].ipAddress)")
    REDIS_HOST=$(gcloud redis instances describe saleor-redis-dev --region=$REGION --project=$PROJECT_ID --format="value(host)")
    
    # Update database URL
    DATABASE_URL="postgres://saleor:${DB_PASSWORD}@${DB_HOST}/saleor"
    REDIS_URL="redis://${REDIS_HOST}:6379/1"
    
    # Base64 encode secrets
    DATABASE_URL_B64=$(echo -n "$DATABASE_URL" | base64 -w 0)
    REDIS_URL_B64=$(echo -n "$REDIS_URL" | base64 -w 0)
    
    # Update secrets in Kubernetes
    kubectl patch secret saleor-secrets -n saleor-dev --type='json' -p="[{\"op\": \"replace\", \"path\": \"/data/DATABASE_URL\", \"value\":\"$DATABASE_URL_B64\"},{\"op\": \"replace\", \"path\": \"/data/REDIS_URL\", \"value\":\"$REDIS_URL_B64\"}]"
    
    echo -e "${GREEN}✅ Secrets updated${NC}"
}

# Function to run database migrations
run_migrations() {
    echo -e "${YELLOW}🗄️  Running database migrations...${NC}"
    
    # Wait for API pod to be ready
    kubectl wait --for=condition=ready pod -l app=saleor-api -n saleor-dev --timeout=300s
    
    # Get API pod name
    API_POD=$(kubectl get pods -n saleor-dev -l app=saleor-api -o jsonpath='{.items[0].metadata.name}')
    
    # Run migrations
    kubectl exec -n saleor-dev $API_POD -- python manage.py migrate
    
    # Create superuser (skip if exists)
    kubectl exec -n saleor-dev $API_POD -- python manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(email='admin@example.com').exists():
    User.objects.create_superuser('admin@example.com', 'admin')
    print('Superuser created')
else:
    print('Superuser already exists')
"
    
    # Populate database with sample data
    kubectl exec -n saleor-dev $API_POD -- python manage.py populatedb --createsuperuser
    
    echo -e "${GREEN}✅ Database initialized${NC}"
}

# Function to deploy applications
deploy_applications() {
    echo -e "${YELLOW}📦 Deploying Kubernetes manifests...${NC}"
    
    # Apply manifests in order
    kubectl apply -f k8s/dev/namespace.yaml
    kubectl apply -f k8s/dev/configmap.yaml
    kubectl apply -f k8s/dev/secret.yaml
    
    # Wait a moment for namespace to be ready
    sleep 5
    
    kubectl apply -f k8s/dev/saleor-api.yaml
    kubectl apply -f k8s/dev/saleor-worker.yaml
    kubectl apply -f k8s/dev/saleor-dashboard.yaml
    kubectl apply -f k8s/dev/saleor-storefront.yaml
    kubectl apply -f k8s/dev/hpa.yaml
    
    echo -e "${GREEN}✅ Applications deployed${NC}"
}

# Function to setup ingress
setup_ingress() {
    echo -e "${YELLOW}🌐 Setting up ingress...${NC}"
    
    # Reserve static IP
    if ! gcloud compute addresses describe saleor-dev-ip --global --project=$PROJECT_ID &> /dev/null; then
        gcloud compute addresses create saleor-dev-ip --global --project=$PROJECT_ID
        echo -e "${GREEN}✅ Static IP reserved${NC}"
    else
        echo -e "${GREEN}✅ Static IP already exists${NC}"
    fi
    
    # Apply ingress
    kubectl apply -f k8s/dev/ingress.yaml
    
    # Get static IP
    STATIC_IP=$(gcloud compute addresses describe saleor-dev-ip --global --project=$PROJECT_ID --format="value(address)")
    
    echo -e "${GREEN}✅ Ingress configured${NC}"
    echo -e "${YELLOW}📝 Static IP: $STATIC_IP${NC}"
    echo -e "${YELLOW}📝 Update your DNS records to point to this IP${NC}"
}

# Function to check deployment status
check_deployment_status() {
    echo -e "${YELLOW}🔍 Checking deployment status...${NC}"
    
    echo "Pods:"
    kubectl get pods -n saleor-dev
    
    echo -e "\nServices:"
    kubectl get svc -n saleor-dev
    
    echo -e "\nIngress:"
    kubectl get ingress -n saleor-dev
    
    echo -e "\nHPA:"
    kubectl get hpa -n saleor-dev
}

# Function to show access information  
show_access_info() {
    echo -e "${GREEN}🎉 Deployment completed!${NC}"
    echo -e "${YELLOW}Access Information:${NC}"
    
    STATIC_IP=$(gcloud compute addresses describe saleor-dev-ip --global --project=$PROJECT_ID --format="value(address)" 2>/dev/null || echo "Not available")
    
    echo "Static IP: $STATIC_IP"
    echo ""
    echo "Once DNS is configured:"
    echo "- API: https://api-dev.saleor.example.com/graphql/"
    echo "- Dashboard: https://dashboard-dev.saleor.example.com/"
    echo "- Storefront: https://storefront-dev.saleor.example.com/"
    echo ""
    echo "For local testing (port forwarding):"
    echo "- API: kubectl port-forward svc/saleor-api 8000:8000 -n saleor-dev"
    echo "- Dashboard: kubectl port-forward svc/saleor-dashboard 9000:80 -n saleor-dev"
    echo "- Storefront: kubectl port-forward svc/saleor-storefront 3000:3000 -n saleor-dev"
    echo ""
    echo "Default admin credentials:"
    echo "- Email: admin@example.com"
    echo "- Password: admin"
}

# Main deployment flow
main() {
    check_cluster_connection
    deploy_applications
    update_secrets
    
    # Wait for deployments
    echo -e "${YELLOW}⏳ Waiting for deployments to be ready...${NC}"
    kubectl wait --for=condition=available --timeout=300s deployment/saleor-api -n saleor-dev
    kubectl wait --for=condition=available --timeout=300s deployment/saleor-dashboard -n saleor-dev
    
    run_migrations
    setup_ingress
    check_deployment_status
    show_access_info
}

# Run main function
main