#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PROJECT_ID="saleor-platform-dev"

echo -e "${GREEN}🔧 Fixing VPC Private Service Connection${NC}"

# Function to enable Service Networking API
enable_service_networking() {
    echo -e "${YELLOW}🔧 Enabling Service Networking API...${NC}"
    gcloud services enable servicenetworking.googleapis.com --project=$PROJECT_ID
    echo -e "${GREEN}✅ Service Networking API enabled${NC}"
}

# Function to check and create private service connection
check_private_connection() {
    echo -e "${YELLOW}🔍 Checking private service connection...${NC}"
    
    # Check if private service access range exists
    if gcloud compute addresses describe saleor-vpc-dev-private-service-access --global --project=$PROJECT_ID &> /dev/null; then
        echo -e "${GREEN}✅ Private service access range exists${NC}"
    else
        echo -e "${YELLOW}📝 Creating private service access range...${NC}"
        gcloud compute addresses create saleor-vpc-dev-private-service-access \
            --global \
            --purpose=VPC_PEERING \
            --prefix-length=16 \
            --network=saleor-vpc-dev \
            --project=$PROJECT_ID
        echo -e "${GREEN}✅ Private service access range created${NC}"
    fi
    
    # Create VPC peering connection
    echo -e "${YELLOW}🔗 Creating VPC peering connection...${NC}"
    gcloud services vpc-peerings connect \
        --service=servicenetworking.googleapis.com \
        --ranges=saleor-vpc-dev-private-service-access \
        --network=saleor-vpc-dev \
        --project=$PROJECT_ID
    
    echo -e "${GREEN}✅ VPC peering connection created${NC}"
}

# Main function
main() {
    echo -e "${GREEN}🚀 Starting VPC connection fix...${NC}"
    
    # Set project context
    gcloud config set project $PROJECT_ID
    
    enable_service_networking
    check_private_connection
    
    echo -e "${GREEN}🎉 VPC private service connection fixed!${NC}"
    echo -e "${YELLOW}You can now run: terraform apply${NC}"
}

# Run main function
main