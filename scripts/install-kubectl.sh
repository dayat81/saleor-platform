#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔧 Installing Kubernetes Tools${NC}"

# Function to install kubectl
install_kubectl() {
    echo -e "${YELLOW}📦 Installing kubectl...${NC}"
    
    if command -v kubectl &> /dev/null; then
        echo -e "${GREEN}✅ kubectl is already installed${NC}"
        kubectl version --client
        return 0
    fi
    
    # Try gcloud components first
    if command -v gcloud &> /dev/null; then
        echo -e "${YELLOW}Installing kubectl via gcloud components...${NC}"
        gcloud components install kubectl
    else
        # Fallback to direct installation
        echo -e "${YELLOW}Installing kubectl directly...${NC}"
        
        # Detect OS
        if [[ "$OSTYPE" == "linux-gnu"* ]]; then
            # Linux
            curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
            sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
            rm kubectl
        elif [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            if command -v brew &> /dev/null; then
                brew install kubectl
            else
                curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/darwin/amd64/kubectl"
                chmod +x kubectl
                sudo mv kubectl /usr/local/bin/
            fi
        else
            echo -e "${RED}❌ Unsupported OS: $OSTYPE${NC}"
            exit 1
        fi
    fi
    
    echo -e "${GREEN}✅ kubectl installed successfully${NC}"
    kubectl version --client
}

# Function to install GKE auth plugin
install_gke_auth_plugin() {
    echo -e "${YELLOW}🔑 Installing GKE authentication plugin...${NC}"
    
    # Check if already installed
    if gcloud components list --filter="id:gke-gcloud-auth-plugin" --format="value(state.name)" | grep -q "Installed"; then
        echo -e "${GREEN}✅ GKE auth plugin is already installed${NC}"
        return 0
    fi
    
    gcloud components install gke-gcloud-auth-plugin
    echo -e "${GREEN}✅ GKE auth plugin installed successfully${NC}"
}

# Function to verify installation
verify_installation() {
    echo -e "${YELLOW}🔍 Verifying installation...${NC}"
    
    # Check kubectl
    if command -v kubectl &> /dev/null; then
        echo -e "${GREEN}✅ kubectl: $(kubectl version --client --short)${NC}"
    else
        echo -e "${RED}❌ kubectl not found${NC}"
        exit 1
    fi
    
    # Check GKE auth plugin
    if gcloud components list --filter="id:gke-gcloud-auth-plugin" --format="value(state.name)" | grep -q "Installed"; then
        echo -e "${GREEN}✅ GKE auth plugin: Installed${NC}"
    else
        echo -e "${RED}❌ GKE auth plugin not installed${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ All tools installed successfully!${NC}"
}

# Function to test cluster connection
test_cluster_connection() {
    echo -e "${YELLOW}🔗 Testing cluster connection...${NC}"
    
    PROJECT_ID="saleor-platform-dev"
    REGION="asia-southeast2"
    CLUSTER_NAME="saleor-gke-dev"
    
    # Get credentials
    gcloud container clusters get-credentials $CLUSTER_NAME --region $REGION --project $PROJECT_ID
    
    # Test connection
    if kubectl cluster-info &> /dev/null; then
        echo -e "${GREEN}✅ Successfully connected to cluster${NC}"
        kubectl get nodes
    else
        echo -e "${YELLOW}⚠️  Cluster connection will be tested when running deploy-k8s.sh${NC}"
    fi
}

# Main function
main() {
    echo -e "${GREEN}🚀 Starting Kubernetes tools installation...${NC}"
    
    install_kubectl
    install_gke_auth_plugin
    verify_installation
    test_cluster_connection
    
    echo -e "${GREEN}🎉 Installation completed!${NC}"
    echo -e "${YELLOW}You can now run: ./scripts/deploy-k8s.sh${NC}"
}

# Run main function
main