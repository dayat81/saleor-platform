#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔐 Google Cloud Authentication Setup${NC}"

# Function to check if gcloud is installed
check_gcloud() {
    if ! command -v gcloud &> /dev/null; then
        echo -e "${RED}❌ gcloud CLI is not installed${NC}"
        echo -e "${YELLOW}Please install it from: https://cloud.google.com/sdk/docs/install${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ gcloud CLI found${NC}"
}

# Function to authenticate user
authenticate_user() {
    echo -e "${YELLOW}🔑 Authenticating with Google Cloud...${NC}"
    
    # Check if already authenticated
    if gcloud auth list --filter=status:ACTIVE --format="value(account)" | head -1 &> /dev/null; then
        ACTIVE_ACCOUNT=$(gcloud auth list --filter=status:ACTIVE --format="value(account)" | head -1)
        echo -e "${GREEN}✅ Already authenticated as: $ACTIVE_ACCOUNT${NC}"
        
        read -p "Do you want to re-authenticate? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            gcloud auth login
        fi
    else
        echo -e "${YELLOW}🔑 Please sign in to Google Cloud...${NC}"
        gcloud auth login
    fi
}

# Function to set up application default credentials
setup_adc() {
    echo -e "${YELLOW}🔑 Setting up Application Default Credentials for Terraform...${NC}"
    
    # Check if ADC is already set up
    if gcloud auth application-default print-access-token &> /dev/null; then
        echo -e "${GREEN}✅ Application Default Credentials already configured${NC}"
        
        read -p "Do you want to reconfigure ADC? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            gcloud auth application-default login
        fi
    else
        echo -e "${YELLOW}🔑 Please authenticate for Application Default Credentials...${NC}"
        gcloud auth application-default login
    fi
}

# Function to verify authentication
verify_auth() {
    echo -e "${YELLOW}🔍 Verifying authentication...${NC}"
    
    # Check user authentication
    ACTIVE_ACCOUNT=$(gcloud auth list --filter=status:ACTIVE --format="value(account)" | head -1)
    if [ -n "$ACTIVE_ACCOUNT" ]; then
        echo -e "${GREEN}✅ User authenticated as: $ACTIVE_ACCOUNT${NC}"
    else
        echo -e "${RED}❌ User authentication failed${NC}"
        exit 1
    fi
    
    # Check ADC
    if gcloud auth application-default print-access-token &> /dev/null; then
        echo -e "${GREEN}✅ Application Default Credentials configured${NC}"
    else
        echo -e "${RED}❌ Application Default Credentials not configured${NC}"
        exit 1
    fi
    
    # List available projects
    echo -e "${YELLOW}📋 Available projects:${NC}"
    gcloud projects list --format="table(projectId,name,projectNumber)"
}

# Function to set default project
set_default_project() {
    echo -e "${YELLOW}🎯 Setting default project...${NC}"
    
    read -p "Enter project ID to use as default (or press Enter to skip): " PROJECT_ID
    
    if [ -n "$PROJECT_ID" ]; then
        if gcloud projects describe "$PROJECT_ID" &> /dev/null; then
            gcloud config set project "$PROJECT_ID"
            echo -e "${GREEN}✅ Default project set to: $PROJECT_ID${NC}"
        else
            echo -e "${RED}❌ Project $PROJECT_ID not found or not accessible${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  No default project set${NC}"
    fi
}

# Main function
main() {
    echo -e "${GREEN}Starting Google Cloud authentication setup...${NC}"
    
    check_gcloud
    authenticate_user
    setup_adc
    verify_auth
    set_default_project
    
    echo -e "${GREEN}🎉 Authentication setup completed!${NC}"
    echo -e "${YELLOW}You can now run: ./scripts/deploy-dev.sh${NC}"
}

# Run main function
main