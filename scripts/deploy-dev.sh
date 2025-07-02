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

echo -e "${GREEN}🚀 Starting Saleor Platform Dev Environment Deployment${NC}"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ gcloud CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Check if terraform is installed
if ! command -v terraform &> /dev/null; then
    echo -e "${RED}❌ Terraform is not installed. Please install it first.${NC}"
    exit 1
fi

# Function to setup authentication
setup_authentication() {
    echo -e "${YELLOW}🔐 Setting up Google Cloud authentication...${NC}"
    
    # Check if user is authenticated
    if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | head -1 &> /dev/null; then
        echo -e "${YELLOW}⚠️  Not authenticated with Google Cloud${NC}"
        echo -e "${YELLOW}🔑 Please authenticate with Google Cloud...${NC}"
        gcloud auth login
    else
        ACTIVE_ACCOUNT=$(gcloud auth list --filter=status:ACTIVE --format="value(account)" | head -1)
        echo -e "${GREEN}✅ Authenticated as: $ACTIVE_ACCOUNT${NC}"
    fi
    
    # Set up application default credentials for Terraform
    echo -e "${YELLOW}🔑 Setting up Application Default Credentials...${NC}"
    gcloud auth application-default login
    
    echo -e "${GREEN}✅ Authentication configured${NC}"
}

# Function to check if project exists
check_project() {
    if gcloud projects describe $PROJECT_ID &> /dev/null; then
        echo -e "${GREEN}✅ Project $PROJECT_ID already exists${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠️  Project $PROJECT_ID does not exist${NC}"
        return 1
    fi
}

# Function to create project
create_project() {
    echo -e "${YELLOW}📝 Creating GCP project: $PROJECT_ID${NC}"
    gcloud projects create $PROJECT_ID --name="Saleor Platform Dev"
    
    # Set the project
    gcloud config set project $PROJECT_ID
    
    # Link billing account (you may need to modify this)
    echo -e "${YELLOW}⚠️  Please link a billing account to project $PROJECT_ID manually in the GCP Console${NC}"
    echo "Press any key to continue after linking billing..."
    read -n 1 -s
}

# Function to enable APIs
enable_apis() {
    echo -e "${YELLOW}🔧 Enabling required GCP APIs...${NC}"
    
    apis=(
        "compute.googleapis.com"
        "container.googleapis.com" 
        "sqladmin.googleapis.com"
        "redis.googleapis.com"
        "storage-api.googleapis.com"
        "secretmanager.googleapis.com"
        "servicenetworking.googleapis.com"
        "cloudresourcemanager.googleapis.com"
    )
    
    for api in "${apis[@]}"; do
        echo "Enabling $api..."
        gcloud services enable $api
    done
    
    echo -e "${GREEN}✅ All APIs enabled${NC}"
}

# Function to create terraform state bucket
create_terraform_bucket() {
    BUCKET_NAME="saleor-terraform-state-dev"
    
    if gsutil ls -b gs://$BUCKET_NAME &> /dev/null; then
        echo -e "${GREEN}✅ Terraform state bucket already exists${NC}"
    else
        echo -e "${YELLOW}📦 Creating Terraform state bucket...${NC}"
        gsutil mb -p $PROJECT_ID -l $REGION gs://$BUCKET_NAME
        gsutil versioning set on gs://$BUCKET_NAME
        echo -e "${GREEN}✅ Terraform state bucket created${NC}"
    fi
}

# Function to deploy infrastructure
deploy_infrastructure() {
    echo -e "${YELLOW}🏗️  Deploying infrastructure with Terraform...${NC}"
    
    cd terraform/environments/dev
    
    # Initialize Terraform
    terraform init
    
    # Plan deployment
    echo -e "${YELLOW}📋 Planning Terraform deployment...${NC}"
    terraform plan -out=tfplan
    
    # Apply deployment
    echo -e "${YELLOW}🚀 Applying Terraform deployment...${NC}"
    terraform apply tfplan
    
    echo -e "${GREEN}✅ Infrastructure deployed successfully${NC}"
    
    cd ../../..
}

# Function to get cluster credentials
get_cluster_credentials() {
    echo -e "${YELLOW}🔑 Getting GKE cluster credentials...${NC}"
    gcloud container clusters get-credentials $CLUSTER_NAME --region $REGION --project $PROJECT_ID
    echo -e "${GREEN}✅ Cluster credentials configured${NC}"
}

# Main deployment flow
main() {
    echo -e "${GREEN}🔍 Setting up authentication and project...${NC}"
    
    # Setup authentication first
    setup_authentication
    
    if ! check_project; then
        create_project
    fi
    
    # Set project context
    gcloud config set project $PROJECT_ID
    
    enable_apis
    create_terraform_bucket
    deploy_infrastructure
    get_cluster_credentials
    
    echo -e "${GREEN}🎉 Dev environment infrastructure deployed successfully!${NC}"
    echo -e "${YELLOW}Next steps:${NC}"
    echo "1. Deploy Kubernetes applications: ./scripts/deploy-k8s.sh"
    echo "2. Access cluster: kubectl get pods -n saleor-dev"
    echo "3. Check services: kubectl get svc -n saleor-dev"
}

# Run main function
main