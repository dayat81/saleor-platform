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

# Function to check and install kubectl
check_kubectl() {
    echo -e "${YELLOW}🔍 Checking kubectl installation...${NC}"
    if command -v kubectl &> /dev/null; then
        echo -e "${GREEN}✅ kubectl is installed${NC}"
    else
        echo -e "${YELLOW}📦 Installing kubectl...${NC}"
        gcloud components install kubectl
        echo -e "${GREEN}✅ kubectl installed${NC}"
    fi
}

# Function to install GKE auth plugin
install_gke_auth_plugin() {
    echo -e "${YELLOW}🔑 Installing GKE authentication plugin...${NC}"
    
    # Install the plugin
    gcloud components install gke-gcloud-auth-plugin
    
    # Ensure the plugin is in PATH by sourcing the gcloud path
    if [[ -f "$HOME/.bashrc" ]]; then
        source "$HOME/.bashrc"
    fi
    
    # Add gcloud bin to PATH if not already present
    GCLOUD_BIN_PATH=$(gcloud info --format="value(installation.sdk_root)")/bin
    if [[ ":$PATH:" != *":$GCLOUD_BIN_PATH:"* ]]; then
        export PATH="$GCLOUD_BIN_PATH:$PATH"
    fi
    
    echo -e "${GREEN}✅ GKE auth plugin installed and PATH updated${NC}"
}

# Function to check cluster connection
check_cluster_connection() {
    echo -e "${YELLOW}🔍 Checking cluster connection...${NC}"
    
    # Check if kubectl is installed
    check_kubectl
    
    # Install GKE auth plugin if needed
    echo -e "${YELLOW}🔍 Checking GKE auth plugin...${NC}"
    if ! gcloud components list --filter="id:gke-gcloud-auth-plugin" --format="value(state.name)" | grep -q "Installed"; then
        echo -e "${YELLOW}📦 GKE auth plugin not found, installing...${NC}"
        install_gke_auth_plugin
    elif ! command -v gke-gcloud-auth-plugin &> /dev/null; then
        echo -e "${YELLOW}🔧 GKE auth plugin installed but not in PATH, fixing...${NC}"
        install_gke_auth_plugin
    else
        echo -e "${GREEN}✅ GKE auth plugin is ready${NC}"
    fi
    
    # Get cluster credentials
    echo -e "${YELLOW}🔑 Getting cluster credentials...${NC}"
    gcloud container clusters get-credentials $CLUSTER_NAME --region $REGION --project $PROJECT_ID
    
    # Test connection
    echo -e "${YELLOW}🔍 Testing cluster connection...${NC}"
    if kubectl cluster-info &> /dev/null; then
        echo -e "${GREEN}✅ Connected to cluster${NC}"
        kubectl cluster-info | head -1
    else
        echo -e "${RED}❌ Failed to connect to cluster${NC}"
        echo -e "${YELLOW}💡 Troubleshooting steps:${NC}"
        echo "1. Ensure you're authenticated: gcloud auth login"
        echo "2. Verify project: gcloud config get-value project"
        echo "3. Check cluster exists: gcloud container clusters list"
        echo "4. Try manual auth: gcloud container clusters get-credentials $CLUSTER_NAME --region $REGION --project $PROJECT_ID"
        exit 1
    fi
}

# Function to ensure database user exists and reset password
reset_database_password() {
    echo -e "${YELLOW}🔐 Ensuring database user exists and resetting password...${NC}"
    
    # Check if user exists, create if not
    echo -e "${YELLOW}👤 Checking if user 'saleor' exists...${NC}"
    if ! gcloud sql users list --instance=saleor-db-dev --project=$PROJECT_ID --format="value(name)" | grep -q "^saleor$"; then
        echo -e "${YELLOW}📦 Creating user 'saleor'...${NC}"
        # Generate initial password for user creation
        INITIAL_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
        gcloud sql users create saleor --instance=saleor-db-dev --password="$INITIAL_PASSWORD" --project=$PROJECT_ID
    else
        echo -e "${GREEN}✅ User 'saleor' already exists${NC}"
    fi
    
    # Generate a new password
    NEW_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
    
    # Update the password in Cloud SQL
    echo -e "${YELLOW}🔄 Updating Cloud SQL password...${NC}"
    gcloud sql users set-password saleor --instance=saleor-db-dev --password="$NEW_PASSWORD" --project=$PROJECT_ID
    
    # Update Secret Manager
    echo -e "${YELLOW}🔄 Updating Secret Manager...${NC}"
    echo -n "$NEW_PASSWORD" | gcloud secrets versions add saleor-db-dev-password --data-file=- --project=$PROJECT_ID
    
    # Wait a moment for password change to propagate
    echo -e "${YELLOW}⏳ Waiting for password change to propagate...${NC}"
    sleep 10
    
    echo -e "${GREEN}✅ Database user ensured and password reset${NC}"
}

# Function to check Cloud SQL instance status
check_cloudsql_status() {
    echo -e "${YELLOW}🔍 Checking Cloud SQL instance status...${NC}"
    
    # Check instance status
    INSTANCE_STATE=$(gcloud sql instances describe saleor-db-dev --project=$PROJECT_ID --format="value(state)")
    echo -e "${YELLOW}Instance State: $INSTANCE_STATE${NC}"
    
    if [[ "$INSTANCE_STATE" != "RUNNABLE" ]]; then
        echo -e "${RED}❌ Cloud SQL instance is not running (state: $INSTANCE_STATE)${NC}"
        return 1
    fi
    
    # Check if instance has public IP authorized
    AUTHORIZED_NETWORKS=$(gcloud sql instances describe saleor-db-dev --project=$PROJECT_ID --format="value(settings.ipConfiguration.authorizedNetworks[].value)" | tr '\n' ' ')
    echo -e "${YELLOW}Authorized Networks: ${AUTHORIZED_NETWORKS:-"None"}${NC}"
    
    # Check users
    echo -e "${YELLOW}🔍 Checking database users...${NC}"
    gcloud sql users list --instance=saleor-db-dev --project=$PROJECT_ID --format="table(name,host)"
    
    # Check databases
    echo -e "${YELLOW}🔍 Checking databases...${NC}"
    gcloud sql databases list --instance=saleor-db-dev --project=$PROJECT_ID --format="table(name,charset,collation)"
    
    echo -e "${GREEN}✅ Cloud SQL instance status check completed${NC}"
    return 0
}

# Function to test Cloud SQL Proxy connection
test_cloudsql_proxy_connection() {
    local connection_name="$1"
    local password="$2"
    
    echo -e "${YELLOW}🔍 Testing Cloud SQL Proxy connection...${NC}"
    
    # Check if cloud_sql_proxy is available
    if ! command -v cloud_sql_proxy &> /dev/null; then
        echo -e "${YELLOW}📦 Installing Cloud SQL Proxy...${NC}"
        wget https://dl.google.com/cloudsql/cloud_sql_proxy.linux.amd64 -O cloud_sql_proxy 2>/dev/null || {
            echo -e "${RED}❌ Failed to download Cloud SQL Proxy${NC}"
            return 1
        }
        chmod +x cloud_sql_proxy
        sudo mv cloud_sql_proxy /usr/local/bin/ 2>/dev/null || {
            echo -e "${RED}❌ Failed to install Cloud SQL Proxy${NC}"
            return 1
        }
    fi
    
    # Start Cloud SQL Proxy in background with verbose output and log capture
    echo -e "${YELLOW}🔍 Starting Cloud SQL Proxy for $connection_name...${NC}"
    
    # Create a log file for the proxy
    PROXY_LOG="/tmp/cloud_sql_proxy.log"
    rm -f "$PROXY_LOG"
    
    # Start proxy with output redirection
    cloud_sql_proxy -instances="$connection_name"=tcp:5433 -verbose > "$PROXY_LOG" 2>&1 &
    PROXY_PID=$!
    
    echo -e "${YELLOW}🔍 Proxy PID: $PROXY_PID${NC}"
    
    # Wait longer for proxy to start and check multiple times
    echo -e "${YELLOW}⏳ Waiting for Cloud SQL Proxy to start...${NC}"
    for i in {1..15}; do
        sleep 2
        echo -e "${YELLOW}🔍 Checking proxy status (attempt $i/15)...${NC}"
        
        # Check if process is still running
        if ! kill -0 $PROXY_PID 2>/dev/null; then
            echo -e "${RED}❌ Cloud SQL Proxy process died${NC}"
            echo -e "${YELLOW}🔍 Proxy logs:${NC}"
            if [[ -f "$PROXY_LOG" ]]; then
                cat "$PROXY_LOG"
            else
                echo "No log file found"
            fi
            return 1
        fi
        
        # Check if port is listening using multiple methods
        PORT_LISTENING=false
        
        # Method 1: Use ss (more modern than netstat)
        if command -v ss &> /dev/null; then
            if ss -ln | grep -q ":5433"; then
                PORT_LISTENING=true
            fi
        # Method 2: Use lsof
        elif command -v lsof &> /dev/null; then
            if lsof -i :5433 | grep -q LISTEN; then
                PORT_LISTENING=true
            fi
        # Method 3: Use netstat if available
        elif command -v netstat &> /dev/null; then
            if netstat -ln | grep -q ":5433"; then
                PORT_LISTENING=true
            fi
        # Method 4: Try connecting directly
        else
            if timeout 5 bash -c "</dev/tcp/localhost/5433" 2>/dev/null; then
                PORT_LISTENING=true
            fi
        fi
        
        if $PORT_LISTENING; then
            echo -e "${GREEN}✅ Cloud SQL Proxy is listening on port 5433${NC}"
            break
        fi
        
        if [[ $i -eq 15 ]]; then
            echo -e "${RED}❌ Cloud SQL Proxy failed to start listening on port 5433 after 30 seconds${NC}"
            echo -e "${YELLOW}🔍 Proxy logs:${NC}"
            if [[ -f "$PROXY_LOG" ]]; then
                cat "$PROXY_LOG"
            else
                echo "No log file found"
            fi
            echo -e "${YELLOW}🔍 Process status:${NC}"
            ps aux | grep cloud_sql_proxy | grep -v grep || echo "No proxy process found"
            kill $PROXY_PID 2>/dev/null
            return 1
        fi
    done
    
    # Test with verbose error output
    if python3 -c "
import psycopg2
import sys
import time

print('Starting proxy connection test...')
print(f'Connecting to localhost:5433 as user: saleor')

try:
    # Wait a bit more for proxy to be fully ready
    time.sleep(2)
    
    # Test connection via proxy with detailed error handling
    print('Attempting connection to postgres database...')
    conn = psycopg2.connect(
        host='localhost',
        port=5433,
        database='postgres',
        user='saleor',
        password='$password',
        connect_timeout=15
    )
    cur = conn.cursor()
    cur.execute('SELECT version();')
    version = cur.fetchone()
    print(f'SUCCESS: Connected via Cloud SQL Proxy')
    print(f'PostgreSQL version: {version[0][:50]}...')
    
    # List existing databases
    cur.execute('SELECT datname FROM pg_database;')
    databases = cur.fetchall()
    print(f'Available databases: {[db[0] for db in databases]}')
    
    # Try to create saleor database if it doesn't exist
    try:
        cur.execute('CREATE DATABASE saleor;')
        print('Created saleor database')
    except Exception as create_e:
        print(f'Database creation info: {create_e}')
    
    cur.close()
    conn.close()
    
    # Test saleor database
    print('Testing connection to saleor database...')
    conn = psycopg2.connect(
        host='localhost',
        port=5433,
        database='saleor',
        user='saleor',
        password='$password',
        connect_timeout=15
    )
    conn.close()
    print('SUCCESS: Connected to saleor database via proxy')
    
except psycopg2.OperationalError as e:
    print(f'ERROR: Database connection failed: {e}')
    print('This is typically an authentication or database access issue')
    sys.exit(1)
except Exception as e:
    print(f'ERROR: Unexpected error: {e}')
    import traceback
    traceback.print_exc()
    sys.exit(1)
"; then
        echo -e "${GREEN}✅ Cloud SQL Proxy connection successful${NC}"
        # Kill the proxy and clean up
        kill $PROXY_PID 2>/dev/null
        rm -f "$PROXY_LOG"
        return 0
    else
        echo -e "${RED}❌ Cloud SQL Proxy connection failed${NC}"
        echo -e "${YELLOW}🔍 Final proxy logs:${NC}"
        if [[ -f "$PROXY_LOG" ]]; then
            tail -20 "$PROXY_LOG"
        fi
        # Kill the proxy and clean up
        kill $PROXY_PID 2>/dev/null
        rm -f "$PROXY_LOG"
        return 1
    fi
}

# Function to test Cloud SQL connection directly
test_cloudsql_connection() {
    echo -e "${YELLOW}🔍 Testing Cloud SQL connection directly...${NC}"
    
    # Get the latest password and host
    DB_PASSWORD=$(gcloud secrets versions access latest --secret="saleor-db-dev-password" --project=$PROJECT_ID)
    
    # Debug: Show raw gcloud output
    echo -e "${YELLOW}🔍 Raw Cloud SQL instance info:${NC}"
    gcloud sql instances describe saleor-db-dev --project=$PROJECT_ID --format="json" | jq '.ipAddresses'
    
    # Try different methods to get the IP
    echo -e "${YELLOW}🔍 Trying different IP retrieval methods:${NC}"
    
    # Method 1: Get connection name and use proxy
    CONNECTION_NAME=$(gcloud sql instances describe saleor-db-dev --project=$PROJECT_ID --format="value(connectionName)")
    echo -e "${YELLOW}Connection Name: $CONNECTION_NAME${NC}"
    
    # Method 2: Get public IP
    PUBLIC_IP=$(gcloud sql instances describe saleor-db-dev --project=$PROJECT_ID --format="value(ipAddresses[0].ipAddress)")
    echo -e "${YELLOW}Public IP: $PUBLIC_IP${NC}"
    
    # Method 3: Check if this is a private instance
    PRIVATE_IP=$(gcloud sql instances describe saleor-db-dev --project=$PROJECT_ID --format="json" | jq -r '.ipAddresses[] | select(.type=="PRIVATE") | .ipAddress' 2>/dev/null)
    echo -e "${YELLOW}Private IP: ${PRIVATE_IP:-"Not found"}${NC}"
    
    # Use public IP if available and not a kubernetes IP
    if [[ -n "$PUBLIC_IP" && "$PUBLIC_IP" != "10.103.0.3" ]]; then
        DB_HOST="$PUBLIC_IP"
        echo -e "${YELLOW}🔍 Using public IP: $DB_HOST${NC}"
    elif [[ -n "$PRIVATE_IP" && "$PRIVATE_IP" != "10.103.0.3" ]]; then
        DB_HOST="$PRIVATE_IP"
        echo -e "${YELLOW}🔍 Using private IP: $DB_HOST${NC}"
    else
        echo -e "${RED}❌ Could not find valid Cloud SQL IP. The IP 10.103.0.3 appears to be a Kubernetes service IP.${NC}"
        echo -e "${YELLOW}💡 This suggests the Cloud SQL instance might be configured for private access only.${NC}"
        echo -e "${YELLOW}💡 Trying Cloud SQL Proxy connection...${NC}"
        
        # Try using Cloud SQL Proxy
        if test_cloudsql_proxy_connection "$CONNECTION_NAME" "$DB_PASSWORD"; then
            return 0
        else
            echo -e "${RED}❌ Both direct and proxy connections failed${NC}"
            return 1
        fi
    fi
    
    # Test using psql if available, or python
    if command -v psql &> /dev/null; then
        echo -e "${YELLOW}🔍 Testing with psql to postgres database...${NC}"
        if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U saleor -d postgres -c "SELECT version();" 2>/dev/null; then
            echo -e "${GREEN}✅ Direct Cloud SQL connection to postgres DB successful${NC}"
            
            # Now test saleor database
            echo -e "${YELLOW}🔍 Testing connection to saleor database...${NC}"
            if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U saleor -d saleor -c "SELECT version();" 2>/dev/null; then
                echo -e "${GREEN}✅ Saleor database connection successful${NC}"
            else
                echo -e "${YELLOW}⚠️  Saleor database not accessible, will create if needed${NC}"
                # Try to create the saleor database
                PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U saleor -d postgres -c "CREATE DATABASE saleor;" 2>/dev/null || true
            fi
            return 0
        else
            echo -e "${RED}❌ Direct Cloud SQL connection failed${NC}"
        fi
    fi
    
    # Fallback to Python test
    echo -e "${YELLOW}🔍 Testing with Python...${NC}"
    if python3 -c "
import psycopg2
import sys

try:
    # First test connection to postgres database
    print('Testing connection to postgres database...')
    conn = psycopg2.connect(
        host='$DB_HOST',
        port=5432,
        database='postgres',
        user='saleor',
        password='$DB_PASSWORD',
        connect_timeout=10
    )
    cur = conn.cursor()
    cur.execute('SELECT version();')
    version = cur.fetchone()
    print(f'SUCCESS: Connected to postgres database')
    print(f'PostgreSQL version: {version[0][:50]}...')
    
    # Try to create saleor database if it doesn't exist
    try:
        cur.execute('CREATE DATABASE saleor;')
        print('Created saleor database')
    except:
        print('Saleor database already exists or could not be created')
    
    cur.close()
    conn.close()
    
    # Now test saleor database
    print('Testing connection to saleor database...')
    conn = psycopg2.connect(
        host='$DB_HOST',
        port=5432,
        database='saleor',
        user='saleor',
        password='$DB_PASSWORD',
        connect_timeout=10
    )
    conn.close()
    print('SUCCESS: Connected to saleor database')
    
except Exception as e:
    print(f'ERROR: Direct Cloud SQL connection failed: {e}')
    import traceback
    traceback.print_exc()
    sys.exit(1)
" 2>/dev/null; then
        echo -e "${GREEN}✅ Direct Cloud SQL connection successful${NC}"
        return 0
    else
        echo -e "${RED}❌ Direct Cloud SQL connection failed${NC}"
        return 1
    fi
}

# Function to update secrets from Secret Manager
update_secrets() {
    echo -e "${YELLOW}🔐 Updating secrets from Cloud resources...${NC}"
    
    # Get database password from Secret Manager
    echo -e "${YELLOW}📡 Fetching database password...${NC}"
    DB_PASSWORD=$(gcloud secrets versions access latest --secret="saleor-db-dev-password" --project=$PROJECT_ID)
    if [[ -z "$DB_PASSWORD" ]]; then
        echo -e "${RED}❌ Failed to retrieve database password from Secret Manager${NC}"
        exit 1
    fi
    
    # Get database host (try private IP first, then public IP)
    echo -e "${YELLOW}📡 Fetching database host...${NC}"
    
    # Get all IP addresses for debugging
    echo -e "${YELLOW}🔍 All Cloud SQL IP addresses:${NC}"
    gcloud sql instances describe saleor-db-dev --project=$PROJECT_ID --format="table(ipAddresses[].ipAddress:label=IP,ipAddresses[].type:label=TYPE)"
    
    # Try to get private IP first
    DB_HOST=$(gcloud sql instances describe saleor-db-dev --project=$PROJECT_ID --format="value(ipAddresses[?type=PRIVATE].ipAddress)" | head -1)
    
    if [[ -z "$DB_HOST" ]]; then
        echo -e "${YELLOW}⚠️  Private IP not found, trying public IP...${NC}"
        DB_HOST=$(gcloud sql instances describe saleor-db-dev --project=$PROJECT_ID --format="value(ipAddresses[?type=PRIMARY].ipAddress)" | head -1)
    fi
    
    if [[ -z "$DB_HOST" ]]; then
        echo -e "${YELLOW}⚠️  PRIMARY IP not found, using first available IP...${NC}"
        DB_HOST=$(gcloud sql instances describe saleor-db-dev --project=$PROJECT_ID --format="value(ipAddresses[0].ipAddress)")
    fi
    
    if [[ -z "$DB_HOST" ]]; then
        echo -e "${RED}❌ Could not determine database host IP${NC}"
        exit 1
    fi
    
    # Get Redis host
    echo -e "${YELLOW}📡 Fetching Redis host...${NC}"
    REDIS_HOST=$(gcloud redis instances describe saleor-redis-dev --region=$REGION --project=$PROJECT_ID --format="value(host)")
    if [[ -z "$REDIS_HOST" ]]; then
        echo -e "${RED}❌ Failed to retrieve Redis host${NC}"
        exit 1
    fi
    
    # Check if we should use Cloud SQL Proxy for Kubernetes connection
    if [[ "$DB_HOST" == "10.103.0.3" ]] || [[ -z "$DB_HOST" ]]; then
        echo -e "${YELLOW}💡 Using Cloud SQL Proxy for Kubernetes connection${NC}"
        # For Kubernetes, we'll need to deploy Cloud SQL Proxy sidecar
        # For now, use the connection name to set up proxy
        CONNECTION_NAME=$(gcloud sql instances describe saleor-db-dev --project=$PROJECT_ID --format="value(connectionName)")
        DATABASE_URL="postgres://saleor:${DB_PASSWORD}@127.0.0.1:5432/saleor"
        echo -e "${YELLOW}💡 Will need to deploy Cloud SQL Proxy sidecar in Kubernetes${NC}"
    else
        # Use direct IP connection
        DATABASE_URL="postgres://saleor:${DB_PASSWORD}@${DB_HOST}/saleor"
    fi
    
    REDIS_URL="redis://${REDIS_HOST}:6379/1"
    
    echo -e "${YELLOW}🔍 Database Host: ${DB_HOST}${NC}"
    echo -e "${YELLOW}🔍 Redis Host: ${REDIS_HOST}${NC}"
    
    # Base64 encode secrets
    DATABASE_URL_B64=$(echo -n "$DATABASE_URL" | base64 -w 0)
    REDIS_URL_B64=$(echo -n "$REDIS_URL" | base64 -w 0)
    
    # Check if secret exists, create if not
    if ! kubectl get secret saleor-secrets -n saleor-dev &> /dev/null; then
        echo -e "${YELLOW}📦 Creating secret saleor-secrets...${NC}"
        kubectl create secret generic saleor-secrets -n saleor-dev \
            --from-literal=DATABASE_URL="$DATABASE_URL" \
            --from-literal=REDIS_URL="$REDIS_URL"
    else
        echo -e "${YELLOW}🔄 Updating existing secret...${NC}"
        # Update secrets in Kubernetes
        kubectl patch secret saleor-secrets -n saleor-dev --type='json' -p="[{\"op\": \"replace\", \"path\": \"/data/DATABASE_URL\", \"value\":\"$DATABASE_URL_B64\"},{\"op\": \"replace\", \"path\": \"/data/REDIS_URL\", \"value\":\"$REDIS_URL_B64\"}]"
    fi
    
    # Restart deployments to pick up new secrets
    echo -e "${YELLOW}🔄 Restarting deployments to pick up new secrets...${NC}"
    kubectl rollout restart deployment/saleor-api -n saleor-dev
    kubectl rollout restart deployment/saleor-worker -n saleor-dev
    
    echo -e "${GREEN}✅ Secrets updated and deployments restarted${NC}"
}

# Function to validate secrets in Kubernetes
validate_secrets() {
    echo -e "${YELLOW}🔍 Validating Kubernetes secrets...${NC}"
    
    # Check if secret exists
    if ! kubectl get secret saleor-secrets -n saleor-dev &> /dev/null; then
        echo -e "${RED}❌ Secret 'saleor-secrets' not found${NC}"
        return 1
    fi
    
    # Decode and show DATABASE_URL (without password)
    DATABASE_URL_B64=$(kubectl get secret saleor-secrets -n saleor-dev -o jsonpath='{.data.DATABASE_URL}')
    if [[ -n "$DATABASE_URL_B64" ]]; then
        DATABASE_URL_DECODED=$(echo "$DATABASE_URL_B64" | base64 -d)
        # Mask password for security
        DATABASE_URL_MASKED=$(echo "$DATABASE_URL_DECODED" | sed 's/:\/\/[^:]*:[^@]*@/:\/\/***:***@/')
        echo -e "${YELLOW}🔍 DATABASE_URL (masked): $DATABASE_URL_MASKED${NC}"
    else
        echo -e "${RED}❌ DATABASE_URL not found in secret${NC}"
        return 1
    fi
    
    # Check REDIS_URL
    REDIS_URL_B64=$(kubectl get secret saleor-secrets -n saleor-dev -o jsonpath='{.data.REDIS_URL}')
    if [[ -n "$REDIS_URL_B64" ]]; then
        REDIS_URL_DECODED=$(echo "$REDIS_URL_B64" | base64 -d)
        echo -e "${YELLOW}🔍 REDIS_URL: $REDIS_URL_DECODED${NC}"
    else
        echo -e "${RED}❌ REDIS_URL not found in secret${NC}"
        return 1
    fi
    
    echo -e "${GREEN}✅ Secrets validation passed${NC}"
    return 0
}

# Function to test database connection
test_database_connection() {
    echo -e "${YELLOW}🔍 Testing database connection...${NC}"
    
    # Wait for API pod to be ready
    kubectl wait --for=condition=ready pod -l app=saleor-api -n saleor-dev --timeout=300s
    
    # Get API pod name
    API_POD=$(kubectl get pods -n saleor-dev -l app=saleor-api -o jsonpath='{.items[0].metadata.name}')
    
    echo -e "${YELLOW}🔍 Using pod: $API_POD${NC}"
    
    # Check if DATABASE_URL is set
    echo -e "${YELLOW}🔍 Checking DATABASE_URL...${NC}"
    kubectl exec -n saleor-dev $API_POD -- printenv DATABASE_URL
    
    # Debug connection details
    echo -e "${YELLOW}🔍 Debugging connection details...${NC}"
    kubectl exec -n saleor-dev $API_POD -- python -c "
import os
from urllib.parse import urlparse

database_url = os.environ.get('DATABASE_URL', 'NOT SET')
print(f'DATABASE_URL: {database_url}')

if database_url != 'NOT SET':
    parsed = urlparse(database_url)
    print(f'Host: {parsed.hostname}')
    print(f'Port: {parsed.port}')
    print(f'Database: {parsed.path[1:]}')
    print(f'User: {parsed.username}')
    print(f'Password length: {len(parsed.password) if parsed.password else 0}')
"
    
    # Test database connection with detailed error output
    echo -e "${YELLOW}🔍 Testing actual connection...${NC}"
    if kubectl exec -n saleor-dev $API_POD -- python -c "
import os
import sys
try:
    import psycopg2
    from urllib.parse import urlparse
    
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        print('ERROR: DATABASE_URL not set')
        sys.exit(1)
        
    parsed = urlparse(database_url)
    
    print(f'Attempting connection to {parsed.hostname}:{parsed.port}/{parsed.path[1:]} as {parsed.username}')
    
    conn = psycopg2.connect(
        host=parsed.hostname,
        port=parsed.port or 5432,
        database=parsed.path[1:] if parsed.path else 'saleor',
        user=parsed.username,
        password=parsed.password,
        connect_timeout=10
    )
    
    # Test with a simple query
    cur = conn.cursor()
    cur.execute('SELECT version();')
    version = cur.fetchone()
    cur.close()
    conn.close()
    
    print('SUCCESS: Database connection established')
    print(f'PostgreSQL version: {version[0][:50]}...')
    
except ImportError as e:
    print(f'ERROR: Missing dependency: {e}')
    sys.exit(1)
except Exception as e:
    print(f'ERROR: Database connection failed: {e}')
    import traceback
    traceback.print_exc()
    sys.exit(1)
"; then
        echo -e "${GREEN}✅ Database connection successful${NC}"
        return 0
    else
        echo -e "${RED}❌ Database connection failed${NC}"
        return 1
    fi
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
    
    # Check Cloud SQL instance status first
    if ! check_cloudsql_status; then
        echo -e "${RED}❌ Cloud SQL instance status check failed.${NC}"
        exit 1
    fi
    
    # Reset database password to ensure sync
    reset_database_password
    
    # Ensure saleor database exists
    echo -e "${YELLOW}🔍 Ensuring saleor database exists...${NC}"
    if ! gcloud sql databases list --instance=saleor-db-dev --project=$PROJECT_ID --format="value(name)" | grep -q "^saleor$"; then
        echo -e "${YELLOW}📦 Creating saleor database...${NC}"
        gcloud sql databases create saleor --instance=saleor-db-dev --project=$PROJECT_ID
    else
        echo -e "${GREEN}✅ Saleor database already exists${NC}"
    fi
    
    # Test Cloud SQL connection directly before updating Kubernetes
    if ! test_cloudsql_connection; then
        echo -e "${RED}❌ Direct Cloud SQL connection failed. Check your Cloud SQL instance and network configuration.${NC}"
        exit 1
    fi
    
    update_secrets
    
    # Validate secrets are properly set
    if ! validate_secrets; then
        echo -e "${RED}❌ Secrets validation failed. Exiting...${NC}"
        exit 1
    fi
    
    # Wait for deployments after secret update and restart
    echo -e "${YELLOW}⏳ Waiting for deployments to be ready after secret update...${NC}"
    kubectl wait --for=condition=available --timeout=600s deployment/saleor-api -n saleor-dev
    kubectl wait --for=condition=available --timeout=300s deployment/saleor-dashboard -n saleor-dev
    kubectl wait --for=condition=available --timeout=300s deployment/saleor-worker -n saleor-dev
    
    # Test database connection before running migrations
    if ! test_database_connection; then
        echo -e "${RED}❌ Database connection test failed. Exiting...${NC}"
        exit 1
    fi
    
    run_migrations
    setup_ingress
    check_deployment_status
    show_access_info
}

# Run main function
main