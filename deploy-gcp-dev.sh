#!/bin/bash

# Saleor Platform GCP Deployment Script
# This script deploys the complete Saleor e-commerce platform to Google Cloud Platform

set -e

# Configuration
PROJECT_ID="gcp-saleor-dev"
REGION="asia-southeast2"
ZONE="asia-southeast2-a"
ARTIFACT_REGISTRY="$REGION-docker.pkg.dev/$PROJECT_ID/saleor-repo"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    if ! command -v gcloud &> /dev/null; then
        log_error "gcloud CLI is required but not installed."
        exit 1
    fi
    
    if ! command -v terraform &> /dev/null; then
        log_error "Terraform is required but not installed."
        exit 1
    fi
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker is required but not installed."
        exit 1
    fi
    
    log_info "Prerequisites check passed."
}

# Set up GCP project
setup_gcp_project() {
    log_info "Setting up GCP project..."
    
    # Set project
    gcloud config set project $PROJECT_ID
    
    # Enable required APIs
    log_info "Enabling required APIs..."
    gcloud services enable \
        sqladmin.googleapis.com \
        redis.googleapis.com \
        run.googleapis.com \
        cloudbuild.googleapis.com \
        secretmanager.googleapis.com \
        storage.googleapis.com \
        cloudtrace.googleapis.com \
        monitoring.googleapis.com \
        logging.googleapis.com \
        artifactregistry.googleapis.com \
        compute.googleapis.com \
        vpcaccess.googleapis.com \
        servicenetworking.googleapis.com
    
    # Create Artifact Registry repository
    log_info "Creating Artifact Registry repository..."
    if ! gcloud artifacts repositories describe saleor-repo --location=$REGION &> /dev/null; then
        gcloud artifacts repositories create saleor-repo \
            --repository-format=docker \
            --location=$REGION \
            --description="Saleor platform container images"
    else
        log_warn "Artifact Registry repository already exists."
    fi
    
    # Configure Docker for Artifact Registry
    gcloud auth configure-docker $REGION-docker.pkg.dev
    
    log_info "GCP project setup completed."
}

# Deploy infrastructure with Terraform
deploy_infrastructure() {
    log_info "Deploying infrastructure with Terraform..."
    
    cd terraform/environments/dev-new
    
    # Create Terraform state bucket
    log_info "Creating Terraform state bucket..."
    if ! gsutil ls gs://saleor-terraform-state-dev-new &> /dev/null; then
        gsutil mb gs://saleor-terraform-state-dev-new
        gsutil versioning set on gs://saleor-terraform-state-dev-new
    else
        log_warn "Terraform state bucket already exists."
    fi
    
    # Initialize Terraform
    terraform init
    
    # Plan and apply
    terraform plan -out=tfplan
    terraform apply tfplan
    
    # Get outputs
    export DATABASE_CONNECTION_NAME=$(terraform output -raw database_connection_name)
    export REDIS_HOST=$(terraform output -raw redis_host)
    export REDIS_PORT=$(terraform output -raw redis_port)
    export MEDIA_BUCKET=$(terraform output -raw media_bucket_url)
    export VPC_CONNECTOR=$(terraform output -raw vpc_connector_name)
    
    cd ../../..
    log_info "Infrastructure deployment completed."
}

# Build and push container images
build_and_push_images() {
    log_info "Building and pushing container images..."
    
    # Build and push Saleor API image
    log_info "Building Saleor API image..."
    docker build -t $ARTIFACT_REGISTRY/saleor-api:latest \
        --build-arg="SALEOR_IMAGE=ghcr.io/saleor/saleor:3.21" \
        -f - . <<'EOF'
FROM ghcr.io/saleor/saleor:3.21
COPY common.env backend.env /app/
EOF
    docker push $ARTIFACT_REGISTRY/saleor-api:latest
    
    # Build and push Saleor Dashboard image
    log_info "Building Saleor Dashboard image..."
    docker build -t $ARTIFACT_REGISTRY/saleor-dashboard:latest \
        --build-arg="DASHBOARD_IMAGE=ghcr.io/saleor/saleor-dashboard:latest" \
        -f - . <<'EOF'
FROM ghcr.io/saleor/saleor-dashboard:latest
EOF
    docker push $ARTIFACT_REGISTRY/saleor-dashboard:latest
    
    # Build and push custom services
    log_info "Building Saleor Storefront image..."
    cd saleor-storefront
    docker build -t $ARTIFACT_REGISTRY/saleor-storefront:latest -f Dockerfile.production .
    docker push $ARTIFACT_REGISTRY/saleor-storefront:latest
    cd ..
    
    log_info "Building Saleor Backoffice image..."
    cd saleor-backoffice
    docker build -t $ARTIFACT_REGISTRY/saleor-backoffice:latest -f Dockerfile.production .
    docker push $ARTIFACT_REGISTRY/saleor-backoffice:latest
    cd ..
    
    log_info "Building Saleor Chat Service image..."
    cd saleor-chat-service
    docker build -t $ARTIFACT_REGISTRY/saleor-chat-service:latest -f Dockerfile.production .
    docker push $ARTIFACT_REGISTRY/saleor-chat-service:latest
    cd ..
    
    log_info "Container images built and pushed successfully."
}

# Deploy services to Cloud Run
deploy_cloud_run_services() {
    log_info "Deploying services to Cloud Run..."
    
    # Get infrastructure outputs
    cd terraform/environments/prod
    DATABASE_CONNECTION_NAME=$(terraform output -raw database_connection_name)
    REDIS_HOST=$(terraform output -raw redis_host)
    REDIS_PORT=$(terraform output -raw redis_port)
    MEDIA_BUCKET=$(terraform output -raw media_bucket_url)
    VPC_CONNECTOR=$(terraform output -raw vpc_connector_name)
    cd ../../..
    
    # Deploy Saleor API
    log_info "Deploying Saleor API service..."
    gcloud run deploy saleor-api \
        --image $ARTIFACT_REGISTRY/saleor-api:latest \
        --platform managed \
        --region $REGION \
        --allow-unauthenticated \
        --memory 2Gi \
        --cpu 2 \
        --concurrency 100 \
        --timeout 300 \
        --min-instances 1 \
        --max-instances 10 \
        --vpc-connector $VPC_CONNECTOR \
        --set-env-vars="CELERY_BROKER_URL=redis://$REDIS_HOST:$REDIS_PORT/1" \
        --set-env-vars="DATABASE_URL=postgres://saleor@$DATABASE_CONNECTION_NAME/saleor" \
        --set-env-vars="DEFAULT_FROM_EMAIL=noreply@saleor.com" \
        --set-env-vars="EMAIL_URL=smtp://localhost:587" \
        --set-env-vars="DEFAULT_CHANNEL_SLUG=default-channel" \
        --set-env-vars="HTTP_IP_FILTER_ALLOW_LOOPBACK_IPS=True" \
        --set-env-vars="HTTP_IP_FILTER_ENABLED=False" \
        --set-env-vars="DASHBOARD_URL=https://saleor-dashboard-$PROJECT_ID.a.run.app/" \
        --set-env-vars="ALLOWED_CLIENT_HOSTS=*" \
        --set-env-vars="ALLOWED_HOSTS=*" \
        --set-secrets="SECRET_KEY=saleor-django-secret-key:latest" \
        --set-secrets="DATABASE_PASSWORD=saleor-db-password:latest"
    
    # Deploy Saleor Worker
    log_info "Deploying Saleor Worker service..."
    gcloud run deploy saleor-worker \
        --image $ARTIFACT_REGISTRY/saleor-api:latest \
        --platform managed \
        --region $REGION \
        --no-allow-unauthenticated \
        --memory 1Gi \
        --cpu 1 \
        --concurrency 1 \
        --timeout 3600 \
        --min-instances 1 \
        --max-instances 5 \
        --vpc-connector $VPC_CONNECTOR \
        --command="celery" \
        --args="-A,saleor,--app=saleor.celeryconf:app,worker,--loglevel=info,-B" \
        --set-env-vars="CELERY_BROKER_URL=redis://$REDIS_HOST:$REDIS_PORT/1" \
        --set-env-vars="DATABASE_URL=postgres://saleor@$DATABASE_CONNECTION_NAME/saleor" \
        --set-env-vars="DEFAULT_FROM_EMAIL=noreply@saleor.com" \
        --set-env-vars="EMAIL_URL=smtp://localhost:587" \
        --set-env-vars="DEFAULT_CHANNEL_SLUG=default-channel" \
        --set-secrets="SECRET_KEY=saleor-django-secret-key:latest" \
        --set-secrets="DATABASE_PASSWORD=saleor-db-password:latest"
    
    # Get API service URL
    API_URL=$(gcloud run services describe saleor-api --region=$REGION --format="value(status.url)")
    
    # Deploy Dashboard
    log_info "Deploying Saleor Dashboard..."
    gcloud run deploy saleor-dashboard \
        --image $ARTIFACT_REGISTRY/saleor-dashboard:latest \
        --platform managed \
        --region $REGION \
        --allow-unauthenticated \
        --memory 512Mi \
        --cpu 1 \
        --concurrency 80 \
        --set-env-vars="API_URL=$API_URL/graphql/"
    
    # Deploy Storefront
    log_info "Deploying Saleor Storefront..."
    gcloud run deploy saleor-storefront \
        --image $ARTIFACT_REGISTRY/saleor-storefront:latest \
        --platform managed \
        --region $REGION \
        --allow-unauthenticated \
        --memory 1Gi \
        --cpu 1 \
        --concurrency 80 \
        --port 3000 \
        --set-env-vars="NEXT_PUBLIC_API_URI=$API_URL/graphql/" \
        --set-env-vars="NEXTAUTH_URL=https://saleor-storefront-$PROJECT_ID.a.run.app" \
        --set-env-vars="NEXTAUTH_SECRET=your-nextauth-secret"
    
    # Deploy Backoffice
    log_info "Deploying Saleor Backoffice..."
    gcloud run deploy saleor-backoffice \
        --image $ARTIFACT_REGISTRY/saleor-backoffice:latest \
        --platform managed \
        --region $REGION \
        --allow-unauthenticated \
        --memory 1Gi \
        --cpu 1 \
        --concurrency 80 \
        --port 3001 \
        --set-env-vars="NEXT_PUBLIC_API_URI=$API_URL/graphql/"
    
    # Deploy Chat Service
    log_info "Deploying Saleor Chat Service..."
    gcloud run deploy saleor-chat-service \
        --image $ARTIFACT_REGISTRY/saleor-chat-service:latest \
        --platform managed \
        --region $REGION \
        --allow-unauthenticated \
        --memory 512Mi \
        --cpu 1 \
        --concurrency 50 \
        --port 3001 \
        --vpc-connector $VPC_CONNECTOR \
        --set-env-vars="REDIS_URL=redis://$REDIS_HOST:$REDIS_PORT/0" \
        --set-env-vars="SALEOR_API_URL=$API_URL/graphql/" \
        --set-secrets="GEMINI_API_KEY=saleor-gemini-api-key:latest"
    
    log_info "All Cloud Run services deployed successfully."
}

# Initialize database
initialize_database() {
    log_info "Initializing database..."
    
    # Run migrations
    log_info "Running database migrations..."
    gcloud run jobs create saleor-migrate \
        --image $ARTIFACT_REGISTRY/saleor-api:latest \
        --region $REGION \
        --memory 1Gi \
        --cpu 1 \
        --task-timeout 600 \
        --vpc-connector $VPC_CONNECTOR \
        --command="python" \
        --args="manage.py,migrate" \
        --set-env-vars="DATABASE_URL=postgres://saleor@$DATABASE_CONNECTION_NAME/saleor" \
        --set-secrets="SECRET_KEY=saleor-django-secret-key:latest" \
        --set-secrets="DATABASE_PASSWORD=saleor-db-password:latest"
    
    gcloud run jobs execute saleor-migrate --region $REGION --wait
    
    # Create superuser and populate database
    log_info "Creating superuser and populating database..."
    gcloud run jobs create saleor-populate \
        --image $ARTIFACT_REGISTRY/saleor-api:latest \
        --region $REGION \
        --memory 1Gi \
        --cpu 1 \
        --task-timeout 600 \
        --vpc-connector $VPC_CONNECTOR \
        --command="python" \
        --args="manage.py,populatedb,--createsuperuser" \
        --set-env-vars="DATABASE_URL=postgres://saleor@$DATABASE_CONNECTION_NAME/saleor" \
        --set-secrets="SECRET_KEY=saleor-django-secret-key:latest" \
        --set-secrets="DATABASE_PASSWORD=saleor-db-password:latest"
    
    gcloud run jobs execute saleor-populate --region $REGION --wait
    
    log_info "Database initialization completed."
}

# Display deployment summary
show_deployment_summary() {
    log_info "Deployment Summary"
    echo "===================="
    
    # Get service URLs
    API_URL=$(gcloud run services describe saleor-api --region=$REGION --format="value(status.url)")
    DASHBOARD_URL=$(gcloud run services describe saleor-dashboard --region=$REGION --format="value(status.url)")
    STOREFRONT_URL=$(gcloud run services describe saleor-storefront --region=$REGION --format="value(status.url)")
    BACKOFFICE_URL=$(gcloud run services describe saleor-backoffice --region=$REGION --format="value(status.url)")
    CHAT_URL=$(gcloud run services describe saleor-chat-service --region=$REGION --format="value(status.url)")
    
    echo "Service URLs:"
    echo "  API (GraphQL): $API_URL/graphql/"
    echo "  Dashboard: $DASHBOARD_URL"
    echo "  Storefront: $STOREFRONT_URL"
    echo "  Backoffice: $BACKOFFICE_URL"
    echo "  Chat Service: $CHAT_URL"
    echo ""
    echo "Default Admin Credentials:"
    echo "  Email: admin@example.com"
    echo "  Password: admin"
    echo ""
    echo "Next Steps:"
    echo "  1. Configure custom domain names"
    echo "  2. Set up SSL certificates"
    echo "  3. Configure SendGrid for email delivery"
    echo "  4. Set up monitoring alerts"
    echo "  5. Configure backup schedules"
}

# Main deployment function
main() {
    log_info "Starting Saleor Platform deployment to GCP..."
    
    check_prerequisites
    setup_gcp_project
    deploy_infrastructure
    build_and_push_images
    deploy_cloud_run_services
    initialize_database
    show_deployment_summary
    
    log_info "Deployment completed successfully!"
}

# Run main function
main "$@"