#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PROJECT_ID="saleor-platform-dev"
REGION="asia-southeast2"

echo -e "${GREEN}🔍 Monitoring Saleor Platform Deployment${NC}"
echo -e "${YELLOW}Project: $PROJECT_ID${NC}"
echo -e "${YELLOW}Region: $REGION${NC}"
echo ""

# Function to check Cloud SQL status
check_cloudsql() {
    echo -e "${BLUE}📊 Cloud SQL Status:${NC}"
    if gcloud sql instances list --project=$PROJECT_ID --format="table(name,databaseVersion,region,settings.tier,state)" 2>/dev/null; then
        echo ""
        # Get detailed status
        if gcloud sql instances describe saleor-db-dev --project=$PROJECT_ID --format="value(state)" 2>/dev/null | grep -q "RUNNABLE"; then
            echo -e "${GREEN}✅ Cloud SQL is RUNNABLE${NC}"
        else
            echo -e "${YELLOW}⏳ Cloud SQL is still creating...${NC}"
        fi
    else
        echo -e "${YELLOW}⏳ Cloud SQL instance not found or still creating...${NC}"
    fi
    echo ""
}

# Function to check GKE status
check_gke() {
    echo -e "${BLUE}🎛️  GKE Cluster Status:${NC}"
    if gcloud container clusters list --project=$PROJECT_ID --region=$REGION --format="table(name,location,status,currentMasterVersion,currentNodeVersion)" 2>/dev/null; then
        echo ""
        # Check cluster status
        if gcloud container clusters describe saleor-gke-dev --project=$PROJECT_ID --region=$REGION --format="value(status)" 2>/dev/null | grep -q "RUNNING"; then
            echo -e "${GREEN}✅ GKE Cluster is RUNNING${NC}"
            
            # Check node pool status
            echo -e "${BLUE}🔗 Node Pool Status:${NC}"
            gcloud container node-pools list --cluster=saleor-gke-dev --project=$PROJECT_ID --region=$REGION --format="table(name,status,version,machineType)" 2>/dev/null
        else
            echo -e "${YELLOW}⏳ GKE Cluster is still creating...${NC}"
        fi
    else
        echo -e "${YELLOW}⏳ GKE Cluster not found or still creating...${NC}"
    fi
    echo ""
}

# Function to check Redis status
check_redis() {
    echo -e "${BLUE}🗄️  Redis Status:${NC}"
    if gcloud redis instances list --project=$PROJECT_ID --region=$REGION --format="table(name,region,tier,memorySizeGb,state)" 2>/dev/null; then
        echo ""
        if gcloud redis instances describe saleor-redis-dev --project=$PROJECT_ID --region=$REGION --format="value(state)" 2>/dev/null | grep -q "READY"; then
            echo -e "${GREEN}✅ Redis is READY${NC}"
        else
            echo -e "${YELLOW}⏳ Redis is still creating...${NC}"
        fi
    else
        echo -e "${YELLOW}⏳ Redis instance not found or still creating...${NC}"
    fi
    echo ""
}

# Function to check storage buckets
check_storage() {
    echo -e "${BLUE}🪣 Storage Buckets:${NC}"
    if gsutil ls -p $PROJECT_ID 2>/dev/null | grep -E "(saleor-media|saleor-static)"; then
        echo -e "${GREEN}✅ Storage buckets created${NC}"
    else
        echo -e "${YELLOW}⏳ Storage buckets not found or still creating...${NC}"
    fi
    echo ""
}

# Function to check recent operations
check_operations() {
    echo -e "${BLUE}🔄 Recent Operations:${NC}"
    echo "Last 5 operations:"
    gcloud logging read 'resource.type="gce_operation" OR resource.type="container_operation" OR resource.type="sql_operation"' \
        --project=$PROJECT_ID \
        --limit=5 \
        --format="table(timestamp,resource.type,jsonPayload.operationType,severity)" \
        2>/dev/null || echo "No recent operations found"
    echo ""
}

# Function to show Terraform logs
show_terraform_logs() {
    echo -e "${BLUE}📝 Recent Terraform Activity:${NC}"
    echo "If Terraform is running, you can monitor it with:"
    echo "  tail -f terraform.log"
    echo "  terraform show"
    echo ""
}

# Function to monitor continuously
monitor_loop() {
    local interval=30
    echo -e "${GREEN}🔄 Starting continuous monitoring (every ${interval}s)${NC}"
    echo -e "${YELLOW}Press Ctrl+C to stop${NC}"
    echo ""
    
    while true; do
        clear
        echo -e "${GREEN}🔍 Saleor Platform Deployment Monitor - $(date)${NC}"
        echo "========================================================"
        
        check_cloudsql
        check_gke
        check_redis
        check_storage
        
        echo -e "${BLUE}⏰ Next check in ${interval} seconds...${NC}"
        sleep $interval
    done
}

# Main menu
main() {
    if [ "$1" = "--continuous" ] || [ "$1" = "-c" ]; then
        monitor_loop
    else
        echo -e "${GREEN}📋 Current Status Check:${NC}"
        echo "======================================="
        
        check_cloudsql
        check_gke
        check_redis
        check_storage
        check_operations
        show_terraform_logs
        
        echo -e "${YELLOW}💡 Tip: Use --continuous or -c for live monitoring${NC}"
        echo -e "${YELLOW}Example: ./scripts/monitor-deployment.sh --continuous${NC}"
    fi
}

# Handle Ctrl+C gracefully
trap 'echo -e "\n${GREEN}👋 Monitoring stopped${NC}"; exit 0' INT

# Run main function
main "$@"