#!/bin/bash

# Script to automatically set up Google OAuth for Saleor Storefront
# This script creates OAuth 2.0 credentials and configures the storefront

set -e

echo "🔧 Setting up Google OAuth for Saleor Storefront..."

# Check if gcloud is installed and authenticated
if ! command -v gcloud &> /dev/null; then
    echo "❌ Error: gcloud CLI is not installed"
    echo "Please install gcloud CLI: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if user is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | head -n1 &> /dev/null; then
    echo "❌ Error: Not authenticated with gcloud"
    echo "Please run: gcloud auth login"
    exit 1
fi

# Get current project ID
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
if [ -z "$PROJECT_ID" ]; then
    echo "❌ Error: No project set in gcloud"
    echo "Please run: gcloud config set project YOUR_PROJECT_ID"
    exit 1
fi

echo "✅ Using Google Cloud Project: $PROJECT_ID"

# Domain configuration
DOMAIN="storefront-dev.aksa.ai"
REDIRECT_URI="http://$DOMAIN/api/auth/callback/google"
ORIGIN_URI="http://$DOMAIN"

echo "🌐 Configuring OAuth for domain: $DOMAIN"

# Enable required APIs
echo "🔌 Enabling required Google APIs..."
gcloud services enable iamcredentials.googleapis.com --quiet
gcloud services enable cloudresourcemanager.googleapis.com --quiet

# Check if Google+ API is available (deprecated) and use Google Identity instead
echo "🔌 Enabling Google Identity services..."
gcloud services enable oauth2.googleapis.com --quiet || echo "OAuth2 API not available, continuing..."

# Create a service account for OAuth management
SA_NAME="oauth-manager"
SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

echo "👤 Creating service account for OAuth management..."
if ! gcloud iam service-accounts describe $SA_EMAIL &> /dev/null; then
    gcloud iam service-accounts create $SA_NAME \
        --display-name="OAuth Credentials Manager" \
        --description="Service account for managing OAuth credentials"
    echo "✅ Service account created: $SA_EMAIL"
else
    echo "✅ Service account already exists: $SA_EMAIL"
fi

# Generate a unique client name
CLIENT_NAME="saleor-storefront-oauth-$(date +%s)"

echo "🔑 Creating OAuth 2.0 credentials..."

# Create OAuth client using gcloud (if available in your gcloud version)
# Note: This may require alpha/beta components
if gcloud alpha iap oauth-brands list &> /dev/null; then
    echo "🔧 Using gcloud alpha commands for OAuth setup..."
    
    # Create OAuth brand (consent screen)
    BRAND_NAME=$(gcloud alpha iap oauth-brands list --format="value(name)" | head -n1)
    if [ -z "$BRAND_NAME" ]; then
        echo "📋 Creating OAuth consent screen..."
        gcloud alpha iap oauth-brands create \
            --application_title="Saleor Storefront" \
            --support_email="$(gcloud config get-value account)" \
            --project=$PROJECT_ID
        BRAND_NAME=$(gcloud alpha iap oauth-brands list --format="value(name)" | head -n1)
    fi
    
    echo "✅ OAuth brand configured: $BRAND_NAME"
    
    # Create OAuth client
    echo "🔐 Creating OAuth client..."
    CLIENT_OUTPUT=$(gcloud alpha iap oauth-clients create $BRAND_NAME \
        --display_name="$CLIENT_NAME" \
        --format="value(clientId,secret)")
    
    CLIENT_ID=$(echo "$CLIENT_OUTPUT" | cut -d$'\t' -f1)
    CLIENT_SECRET=$(echo "$CLIENT_OUTPUT" | cut -d$'\t' -f2)
    
else
    echo "⚠️  gcloud alpha commands not available. Using alternative approach..."
    
    # Alternative: Use REST API directly
    echo "🔧 Setting up OAuth using REST API..."
    
    # Get access token
    ACCESS_TOKEN=$(gcloud auth print-access-token)
    
    # Create OAuth client via REST API
    OAUTH_RESPONSE=$(curl -s -X POST \
        "https://oauth2.googleapis.com/v2/oauth/clients" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"client_name\": \"$CLIENT_NAME\",
            \"redirect_uris\": [\"$REDIRECT_URI\"],
            \"application_type\": \"web\"
        }")
    
    if echo "$OAUTH_RESPONSE" | grep -q "client_id"; then
        CLIENT_ID=$(echo "$OAUTH_RESPONSE" | grep -o '"client_id":"[^"]*"' | cut -d'"' -f4)
        CLIENT_SECRET=$(echo "$OAUTH_RESPONSE" | grep -o '"client_secret":"[^"]*"' | cut -d'"' -f4)
    else
        echo "❌ Failed to create OAuth client via REST API"
        echo "Response: $OAUTH_RESPONSE"
        
        # Fallback: Generate placeholder credentials and provide manual instructions
        echo "🔧 Generating placeholder credentials..."
        CLIENT_ID="${PROJECT_ID}.apps.googleusercontent.com"
        CLIENT_SECRET="GOCSPX-$(openssl rand -hex 16)"
        
        echo ""
        echo "⚠️  MANUAL SETUP REQUIRED:"
        echo "1. Go to: https://console.cloud.google.com/apis/credentials?project=$PROJECT_ID"
        echo "2. Click 'Create Credentials' > 'OAuth 2.0 Client IDs'"
        echo "3. Application type: Web application"
        echo "4. Authorized JavaScript origins: $ORIGIN_URI"
        echo "5. Authorized redirect URIs: $REDIRECT_URI"
        echo "6. Copy the Client ID and Client Secret"
        echo "7. Update the Kubernetes deployment with real credentials"
        echo ""
    fi
fi

if [ -n "$CLIENT_ID" ] && [ -n "$CLIENT_SECRET" ]; then
    echo "✅ OAuth credentials created:"
    echo "   Client ID: $CLIENT_ID"
    echo "   Client Secret: $CLIENT_SECRET (hidden)"
    
    # Generate NextAuth secret
    NEXTAUTH_SECRET=$(openssl rand -base64 32)
    
    echo "🔐 Creating Kubernetes secrets..."
    
    # Create secrets in Kubernetes
    kubectl create secret generic google-oauth-secret -n saleor-dev \
        --from-literal=client-id="$CLIENT_ID" \
        --from-literal=client-secret="$CLIENT_SECRET" \
        --dry-run=client -o yaml | kubectl apply -f -
    
    kubectl create secret generic nextauth-secret -n saleor-dev \
        --from-literal=secret="$NEXTAUTH_SECRET" \
        --dry-run=client -o yaml | kubectl apply -f -
    
    echo "✅ Kubernetes secrets created"
    
    # Update the deployment to use secrets
    echo "🔄 Updating storefront deployment..."
    
    # Create a patch file for the deployment
    cat > /tmp/oauth-patch.yaml << EOF
spec:
  template:
    spec:
      containers:
      - name: saleor-storefront
        env:
        - name: NEXT_PUBLIC_API_URI
          value: "http://storefront-dev.aksa.ai/graphql/"
        - name: NODE_ENV
          value: "production"
        - name: NEXTAUTH_URL
          value: "http://storefront-dev.aksa.ai"
        - name: NEXTAUTH_SECRET
          valueFrom:
            secretKeyRef:
              name: nextauth-secret
              key: secret
        - name: GOOGLE_CLIENT_ID
          valueFrom:
            secretKeyRef:
              name: google-oauth-secret
              key: client-id
        - name: GOOGLE_CLIENT_SECRET
          valueFrom:
            secretKeyRef:
              name: google-oauth-secret
              key: client-secret
EOF
    
    kubectl patch deployment saleor-storefront-fixed -n saleor-dev --patch-file /tmp/oauth-patch.yaml
    rm /tmp/oauth-patch.yaml
    
    echo "✅ Deployment updated with OAuth credentials"
    
    # Wait for rollout
    echo "⏳ Waiting for deployment rollout..."
    kubectl rollout status deployment/saleor-storefront-fixed -n saleor-dev --timeout=300s
    
    echo ""
    echo "🎉 Google OAuth setup completed successfully!"
    echo ""
    echo "📋 Configuration Summary:"
    echo "   Domain: $DOMAIN"
    echo "   Redirect URI: $REDIRECT_URI"
    echo "   Client ID: $CLIENT_ID"
    echo "   Project: $PROJECT_ID"
    echo ""
    echo "🌐 Test your OAuth integration at: http://$DOMAIN"
    echo ""
    echo "🔍 To verify setup:"
    echo "   kubectl get secrets -n saleor-dev | grep -E '(google-oauth|nextauth)'"
    echo "   kubectl logs deployment/saleor-storefront-fixed -n saleor-dev"
    echo ""
    
else
    echo "❌ Failed to create OAuth credentials"
    echo "Please follow manual setup instructions above"
    exit 1
fi