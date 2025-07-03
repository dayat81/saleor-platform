#!/bin/bash

# Saleor Platform Monitoring Script for aksa.ai domains
# Monitors service health, DNS propagation, and SSL certificate status

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

STATIC_IP="34.120.162.244"
DOMAINS=("api-dev.aksa.ai" "dashboard-dev.aksa.ai" "storefront-dev.aksa.ai")

echo -e "${BLUE}===========================================${NC}"
echo -e "${BLUE}  Saleor Platform Monitoring - aksa.ai    ${NC}"
echo -e "${BLUE}===========================================${NC}"
echo -e "${YELLOW}Timestamp: $(date)${NC}"
echo -e "${YELLOW}Project: saleor-platform-dev${NC}"
echo -e "${YELLOW}Region: asia-southeast2${NC}"
echo ""

# Function to check DNS propagation
check_dns() {
    echo -e "${BLUE}--- DNS Propagation Status ---${NC}"
    for domain in "${DOMAINS[@]}"; do
        echo -n "🌐 $domain: "
        if nslookup $domain 8.8.8.8 2>/dev/null | grep -q "Address: $STATIC_IP"; then
            echo -e "${GREEN}✅ DNS OK${NC}"
        else
            echo -e "${RED}❌ DNS not propagated${NC}"
        fi
    done
    echo ""
}

# Function to check Kubernetes services
check_k8s_services() {
    echo -e "${BLUE}--- Kubernetes Services Status ---${NC}"
    
    # Pod status
    echo "📦 Pod Status:"
    kubectl get pods -n saleor-dev --no-headers | while read line; do
        name=$(echo $line | awk '{print $1}')
        ready=$(echo $line | awk '{print $2}')
        status=$(echo $line | awk '{print $3}')
        
        if [[ "$status" == "Running" && "$ready" =~ ^[0-9]+/[0-9]+$ ]]; then
            echo -e "  ${GREEN}✅ $name: $ready ($status)${NC}"
        else
            echo -e "  ${RED}❌ $name: $ready ($status)${NC}"
        fi
    done
    
    echo ""
    
    # Ingress status
    echo "🌐 Ingress Status:"
    kubectl get ingress -n saleor-dev --no-headers | while read line; do
        name=$(echo $line | awk '{print $1}')
        hosts=$(echo $line | awk '{print $3}')
        address=$(echo $line | awk '{print $4}')
        
        if [[ -n "$address" ]]; then
            echo -e "  ${GREEN}✅ $name: $hosts -> $address${NC}"
        else
            echo -e "  ${YELLOW}⏳ $name: $hosts (pending)${NC}"
        fi
    done
    
    echo ""
}

# Function to check SSL certificates
check_ssl_certificates() {
    echo -e "${BLUE}--- SSL Certificate Status ---${NC}"
    
    kubectl describe managedcertificate saleor-dev-cert -n saleor-dev 2>/dev/null | grep -A 10 "Domain Status:" | while read line; do
        if [[ $line =~ Domain:[[:space:]]+(.+) ]]; then
            domain="${BASH_REMATCH[1]}"
            echo -n "🔒 $domain: "
        elif [[ $line =~ Status:[[:space:]]+(.+) ]]; then
            status="${BASH_REMATCH[1]}"
            if [[ "$status" == "Active" ]]; then
                echo -e "${GREEN}✅ $status${NC}"
            elif [[ "$status" == "Provisioning" ]]; then
                echo -e "${YELLOW}⏳ $status${NC}"
            else
                echo -e "${RED}❌ $status${NC}"
            fi
        fi
    done
    echo ""
}

# Function to test service accessibility
test_service_access() {
    echo -e "${BLUE}--- Service Accessibility Test ---${NC}"
    
    # Get LoadBalancer IP
    LB_IP=$(kubectl get svc saleor-ingress-service -n saleor-dev -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null)
    
    if [[ -n "$LB_IP" ]]; then
        echo "🔗 Testing via LoadBalancer IP: $LB_IP"
        
        # Test API
        echo -n "🔌 API (api-dev.aksa.ai): "
        if curl -s -H "Host: api-dev.aksa.ai" "http://$LB_IP/health/" --max-time 5 >/dev/null 2>&1; then
            echo -e "${GREEN}✅ Responding${NC}"
        else
            echo -e "${RED}❌ Not responding${NC}"
        fi
        
        # Test Dashboard
        echo -n "📊 Dashboard (dashboard-dev.aksa.ai): "
        if curl -s -H "Host: dashboard-dev.aksa.ai" "http://$LB_IP/" --max-time 5 >/dev/null 2>&1; then
            echo -e "${GREEN}✅ Responding${NC}"
        else
            echo -e "${RED}❌ Not responding${NC}"
        fi
        
        # Test Storefront
        echo -n "🛒 Storefront (storefront-dev.aksa.ai): "
        if curl -s -H "Host: storefront-dev.aksa.ai" "http://$LB_IP/" --max-time 5 >/dev/null 2>&1; then
            echo -e "${GREEN}✅ Responding${NC}"
        else
            echo -e "${RED}❌ Not responding${NC}"
        fi
    else
        echo -e "${RED}❌ LoadBalancer IP not found${NC}"
    fi
    echo ""
}

# Function to check for issues
check_issues() {
    echo -e "${BLUE}--- Issue Detection ---${NC}"
    
    # Check for failing pods
    failing_pods=$(kubectl get pods -n saleor-dev --no-headers | grep -v "Running\|Completed" | wc -l)
    if [[ $failing_pods -gt 0 ]]; then
        echo -e "${RED}⚠️  $failing_pods pod(s) not running properly${NC}"
        kubectl get pods -n saleor-dev --no-headers | grep -v "Running\|Completed" | while read line; do
            pod_name=$(echo $line | awk '{print $1}')
            echo -e "   ${RED}❌ $pod_name${NC}"
        done
    else
        echo -e "${GREEN}✅ All pods running properly${NC}"
    fi
    
    # Check Cloud SQL proxy logs for errors
    echo ""
    echo "🔍 Checking for database connection issues..."
    error_count=$(kubectl logs -n saleor-dev -l app=saleor-api -c cloud-sql-proxy --tail=50 2>/dev/null | grep -c "ERROR" || echo "0")
    if [[ $error_count -gt 0 ]]; then
        echo -e "${RED}⚠️  $error_count database connection errors detected${NC}"
        echo -e "${YELLOW}💡 Check: kubectl logs -n saleor-dev -l app=saleor-api -c cloud-sql-proxy${NC}"
    else
        echo -e "${GREEN}✅ No recent database connection errors${NC}"
    fi
    echo ""
}

# Function to show access URLs
show_access_urls() {
    echo -e "${BLUE}--- Access Information ---${NC}"
    
    # Check if DNS has propagated
    dns_ready=true
    for domain in "${DOMAINS[@]}"; do
        if ! nslookup $domain 8.8.8.8 2>/dev/null | grep -q "Address: $STATIC_IP"; then
            dns_ready=false
            break
        fi
    done
    
    if $dns_ready; then
        echo -e "${GREEN}🌐 Production URLs (DNS ready):${NC}"
        echo "   API: https://api-dev.aksa.ai/graphql/"
        echo "   Dashboard: https://dashboard-dev.aksa.ai/"
        echo "   Storefront: https://storefront-dev.aksa.ai/"
    else
        echo -e "${YELLOW}⏳ DNS still propagating. Use port-forward for now:${NC}"
        echo "   kubectl port-forward svc/saleor-api 8000:8000 -n saleor-dev"
        echo "   kubectl port-forward svc/saleor-dashboard 9000:80 -n saleor-dev"
        echo "   kubectl port-forward svc/saleor-storefront 3000:3000 -n saleor-dev"
    fi
    echo ""
}

# Main execution
check_dns
check_k8s_services
check_ssl_certificates
test_service_access
check_issues
show_access_urls

echo -e "${BLUE}===========================================${NC}"
echo -e "${BLUE}  Monitoring Complete                     ${NC}"
echo -e "${BLUE}===========================================${NC}"