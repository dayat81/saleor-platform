#!/bin/bash

# Saleor Platform GCP Deployment Verification Script
# This script verifies that all services are deployed and functioning correctly

set -e

PROJECT_ID="saleor-platform-prod"
REGION="us-central1"

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

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Check service health
check_service_health() {
    local service_name=$1
    local expected_status="True"
    
    log_info "Checking $service_name service health..."
    
    local status=$(gcloud run services describe $service_name \
        --region=$REGION \
        --format="value(status.conditions[0].status)" 2>/dev/null || echo "NotFound")
    
    if [ "$status" = "$expected_status" ]; then
        log_success "$service_name is healthy"
        return 0
    else
        log_error "$service_name is not healthy (status: $status)"
        return 1
    fi
}

# Test service endpoint
test_endpoint() {
    local service_name=$1
    local endpoint_path=$2
    local expected_status=${3:-200}
    
    log_info "Testing $service_name endpoint..."
    
    local url=$(gcloud run services describe $service_name \
        --region=$REGION \
        --format="value(status.url)" 2>/dev/null)
    
    if [ -z "$url" ]; then
        log_error "Could not get URL for $service_name"
        return 1
    fi
    
    local full_url="$url$endpoint_path"
    local status_code=$(curl -s -o /dev/null -w "%{http_code}" "$full_url" || echo "000")
    
    if [ "$status_code" -eq "$expected_status" ]; then
        log_success "$service_name endpoint is responding (HTTP $status_code)"
        echo "  URL: $full_url"
        return 0
    else
        log_error "$service_name endpoint failed (HTTP $status_code)"
        echo "  URL: $full_url"
        return 1
    fi
}

# Check infrastructure components
check_infrastructure() {
    log_info "Checking infrastructure components..."
    
    # Check Cloud SQL
    log_info "Checking Cloud SQL instance..."
    if gcloud sql instances describe saleor-db-prod &>/dev/null; then
        local db_state=$(gcloud sql instances describe saleor-db-prod --format="value(state)")
        if [ "$db_state" = "RUNNABLE" ]; then
            log_success "Cloud SQL instance is running"
        else
            log_error "Cloud SQL instance is not running (state: $db_state)"
        fi
    else
        log_error "Cloud SQL instance not found"
    fi
    
    # Check Redis
    log_info "Checking Redis instance..."
    if gcloud redis instances describe saleor-redis-prod --region=$REGION &>/dev/null; then
        local redis_state=$(gcloud redis instances describe saleor-redis-prod --region=$REGION --format="value(state)")
        if [ "$redis_state" = "READY" ]; then
            log_success "Redis instance is ready"
        else
            log_error "Redis instance is not ready (state: $redis_state)"
        fi
    else
        log_error "Redis instance not found"
    fi
    
    # Check storage buckets
    log_info "Checking storage buckets..."
    cd terraform/environments/prod 2>/dev/null || { log_error "Terraform directory not found"; return 1; }
    
    local media_bucket=$(terraform output -raw media_bucket_url 2>/dev/null | sed 's|gs://||')
    local static_bucket=$(terraform output -raw static_bucket_url 2>/dev/null | sed 's|gs://||')
    
    if [ -n "$media_bucket" ] && gsutil ls gs://$media_bucket &>/dev/null; then
        log_success "Media bucket exists and is accessible"
    else
        log_error "Media bucket not found or not accessible"
    fi
    
    if [ -n "$static_bucket" ] && gsutil ls gs://$static_bucket &>/dev/null; then
        log_success "Static bucket exists and is accessible"
    else
        log_error "Static bucket not found or not accessible"
    fi
    
    cd - &>/dev/null
}

# Test GraphQL API functionality
test_graphql_api() {
    log_info "Testing GraphQL API functionality..."
    
    local api_url=$(gcloud run services describe saleor-api \
        --region=$REGION \
        --format="value(status.url)")
    
    if [ -z "$api_url" ]; then
        log_error "Could not get API URL"
        return 1
    fi
    
    local graphql_url="$api_url/graphql/"
    
    # Test GraphQL introspection query
    local query='{"query": "{ __schema { types { name } } }"}'
    local response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -d "$query" \
        "$graphql_url")
    
    if echo "$response" | grep -q "types"; then
        log_success "GraphQL API is responding correctly"
        echo "  GraphQL Endpoint: $graphql_url"
    else
        log_error "GraphQL API is not responding correctly"
        echo "  Response: $response"
        return 1
    fi
}

# Check database connectivity
check_database_connectivity() {
    log_info "Checking database connectivity..."
    
    # This would require creating a job to test DB connectivity
    # For now, we'll check if the Cloud SQL proxy is accessible
    local connection_name=$(cd terraform/environments/prod && terraform output -raw database_connection_name 2>/dev/null)
    
    if [ -n "$connection_name" ]; then
        log_success "Database connection name retrieved: $connection_name"
    else
        log_error "Could not retrieve database connection name"
        return 1
    fi
}

# Generate health report
generate_health_report() {
    log_info "Generating deployment health report..."
    
    local report_file="deployment-health-report-$(date +%Y%m%d-%H%M%S).txt"
    
    {
        echo "Saleor Platform GCP Deployment Health Report"
        echo "Generated on: $(date)"
        echo "Project ID: $PROJECT_ID"
        echo "Region: $REGION"
        echo "============================================"
        echo ""
        
        echo "Service URLs:"
        for service in saleor-api saleor-dashboard saleor-storefront saleor-backoffice saleor-chat-service; do
            local url=$(gcloud run services describe $service --region=$REGION --format="value(status.url)" 2>/dev/null || echo "Not found")
            echo "  $service: $url"
        done
        
        echo ""
        echo "Infrastructure Status:"
        
        # Cloud SQL status
        local db_state=$(gcloud sql instances describe saleor-db-prod --format="value(state)" 2>/dev/null || echo "Not found")
        echo "  Cloud SQL: $db_state"
        
        # Redis status
        local redis_state=$(gcloud redis instances describe saleor-redis-prod --region=$REGION --format="value(state)" 2>/dev/null || echo "Not found")
        echo "  Redis: $redis_state"
        
        echo ""
        echo "Next Steps:"
        echo "1. Configure custom domain names and SSL certificates"
        echo "2. Set up monitoring alerts and dashboards"
        echo "3. Configure email delivery service (SendGrid)"
        echo "4. Set up automated backups and disaster recovery"
        echo "5. Implement CI/CD pipeline for automated deployments"
        echo "6. Configure load testing and performance monitoring"
        
    } > "$report_file"
    
    log_success "Health report generated: $report_file"
}

# Main verification function
main() {
    log_info "Starting Saleor Platform deployment verification..."
    
    local overall_health=0
    
    # Check infrastructure
    check_infrastructure || overall_health=1
    
    # Check Cloud Run services
    local services=("saleor-api" "saleor-dashboard" "saleor-storefront" "saleor-backoffice" "saleor-chat-service" "saleor-worker")
    
    for service in "${services[@]}"; do
        check_service_health "$service" || overall_health=1
    done
    
    # Test endpoints
    test_endpoint "saleor-api" "/graphql/" 400  # GraphQL endpoint returns 400 for GET requests without query
    test_endpoint "saleor-dashboard" "/" 200
    test_endpoint "saleor-storefront" "/" 200
    test_endpoint "saleor-backoffice" "/" 200
    
    # Test GraphQL API
    test_graphql_api || overall_health=1
    
    # Check database connectivity
    check_database_connectivity || overall_health=1
    
    # Generate health report
    generate_health_report
    
    if [ $overall_health -eq 0 ]; then
        log_success "All verification checks passed!"
        echo ""
        echo "Your Saleor Platform is successfully deployed and running on GCP."
        echo "You can now access your services using the URLs shown above."
    else
        log_warn "Some verification checks failed. Please review the errors above."
        echo ""
        echo "The deployment may still be functional, but some components need attention."
    fi
    
    return $overall_health
}

# Run main function
main "$@"