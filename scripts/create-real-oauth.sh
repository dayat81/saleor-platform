#!/bin/bash

# Script to create real Google OAuth credentials
set -e

PROJECT_ID="saleor-platform-dev"
DOMAIN="storefront-dev.aksa.ai"
CLIENT_NAME="Saleor-Storefront-$(date +%Y%m%d)"

echo "🔐 Creating Real Google OAuth Credentials"
echo "========================================"
echo "Project: $PROJECT_ID"
echo "Domain: $DOMAIN"
echo ""

# Step 1: Enable required APIs
echo "🔌 Enabling required Google APIs..."
gcloud services enable iamcredentials.googleapis.com --project=$PROJECT_ID
gcloud services enable cloudresourcemanager.googleapis.com --project=$PROJECT_ID

# Step 2: Create OAuth consent screen using gcloud
echo "📋 Setting up OAuth consent screen..."

# Get access token for REST API calls
ACCESS_TOKEN=$(gcloud auth print-access-token)

# Create OAuth consent screen via REST API
echo "🔧 Creating OAuth consent screen..."
CONSENT_RESPONSE=$(curl -s -X POST \
    "https://iap.googleapis.com/v1/projects/$PROJECT_ID/brands" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
        \"applicationTitle\": \"Saleor Storefront\",
        \"supportEmail\": \"hidayat@insist.co.id\",
        \"applicationTitle\": \"Saleor Storefront OAuth Application\"
    }")

echo "Consent response: $CONSENT_RESPONSE"

# If consent screen creation fails, try to get existing one
BRAND_NAME=$(curl -s -X GET \
    "https://iap.googleapis.com/v1/projects/$PROJECT_ID/brands" \
    -H "Authorization: Bearer $ACCESS_TOKEN" | \
    grep -o '"name":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$BRAND_NAME" ]; then
    echo "⚠️  Could not create or find OAuth brand. Creating manually..."
    
    # Manual creation instructions
    echo ""
    echo "🌐 Please complete OAuth consent screen setup manually:"
    echo "1. Go to: https://console.cloud.google.com/apis/credentials/consent?project=$PROJECT_ID"
    echo "2. Choose 'External' user type"
    echo "3. Fill in:"
    echo "   - App name: Saleor Storefront"
    echo "   - User support email: hidayat@insist.co.id"
    echo "   - Developer contact: hidayat@insist.co.id"
    echo "4. Add authorized domain: aksa.ai"
    echo "5. Scopes: email, profile, openid"
    echo ""
    read -p "Press Enter when OAuth consent screen is configured..."
else
    echo "✅ Using OAuth brand: $BRAND_NAME"
fi

# Step 3: Create OAuth client credentials
echo "🔑 Creating OAuth 2.0 client..."

# Create OAuth client via REST API
OAUTH_CLIENT_RESPONSE=$(curl -s -X POST \
    "https://oauth2.googleapis.com/v1/clients" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
        \"client_name\": \"$CLIENT_NAME\",
        \"redirect_uris\": [
            \"http://$DOMAIN/api/auth/callback/google\",
            \"http://localhost:3000/api/auth/callback/google\"
        ],
        \"application_type\": \"web\",
        \"javascript_origins\": [
            \"http://$DOMAIN\",
            \"http://localhost:3000\"
        ]
    }")

echo "OAuth client response: $OAUTH_CLIENT_RESPONSE"

# Try alternative API endpoint
if ! echo "$OAUTH_CLIENT_RESPONSE" | grep -q "client_id"; then
    echo "🔧 Trying alternative OAuth creation method..."
    
    # Use gcloud to create credentials if available
    if gcloud alpha iap oauth-clients create --help &> /dev/null; then
        echo "📝 Using gcloud alpha commands..."
        
        # Get or create brand first
        BRAND_LIST=$(gcloud alpha iap oauth-brands list --format="value(name)" 2>/dev/null || echo "")
        if [ -z "$BRAND_LIST" ]; then
            echo "Creating OAuth brand..."
            gcloud alpha iap oauth-brands create \
                --application_title="Saleor Storefront" \
                --support_email="hidayat@insist.co.id" \
                --project=$PROJECT_ID
        fi
        
        BRAND_NAME=$(gcloud alpha iap oauth-brands list --format="value(name)" | head -1)
        
        if [ -n "$BRAND_NAME" ]; then
            echo "Creating OAuth client with brand: $BRAND_NAME"
            CLIENT_OUTPUT=$(gcloud alpha iap oauth-clients create "$BRAND_NAME" \
                --display_name="$CLIENT_NAME" \
                --format="value(clientId,secret)" 2>/dev/null || echo "")
            
            if [ -n "$CLIENT_OUTPUT" ]; then
                CLIENT_ID=$(echo "$CLIENT_OUTPUT" | cut -d$'\t' -f1)
                CLIENT_SECRET=$(echo "$CLIENT_OUTPUT" | cut -d$'\t' -f2)
            fi
        fi
    fi
fi

# Extract credentials from response if successful
if echo "$OAUTH_CLIENT_RESPONSE" | grep -q "client_id"; then
    CLIENT_ID=$(echo "$OAUTH_CLIENT_RESPONSE" | grep -o '"client_id":"[^"]*"' | cut -d'"' -f4)
    CLIENT_SECRET=$(echo "$OAUTH_CLIENT_RESPONSE" | grep -o '"client_secret":"[^"]*"' | cut -d'"' -f4)
fi

# If automated creation failed, provide manual instructions
if [ -z "$CLIENT_ID" ] || [ -z "$CLIENT_SECRET" ]; then
    echo ""
    echo "❌ Automated OAuth client creation failed"
    echo ""
    echo "🔧 Please create OAuth credentials manually:"
    echo "1. Go to: https://console.cloud.google.com/apis/credentials?project=$PROJECT_ID"
    echo "2. Click 'Create Credentials' → 'OAuth 2.0 Client IDs'"
    echo "3. Application type: Web application"
    echo "4. Name: $CLIENT_NAME"
    echo "5. Authorized JavaScript origins:"
    echo "   - http://$DOMAIN"
    echo "   - http://localhost:3000"
    echo "6. Authorized redirect URIs:"
    echo "   - http://$DOMAIN/api/auth/callback/google"
    echo "   - http://localhost:3000/api/auth/callback/google"
    echo ""
    
    # Open the URL automatically
    if command -v xdg-open > /dev/null; then
        xdg-open "https://console.cloud.google.com/apis/credentials?project=$PROJECT_ID"
    fi
    
    echo "Enter the credentials when ready:"
    read -p "Google Client ID: " CLIENT_ID
    read -s -p "Google Client Secret: " CLIENT_SECRET
    echo ""
fi

# Validate credentials
if [ -z "$CLIENT_ID" ] || [ -z "$CLIENT_SECRET" ]; then
    echo "❌ Error: No credentials provided"
    exit 1
fi

echo ""
echo "✅ OAuth credentials obtained:"
echo "   Client ID: $CLIENT_ID"
echo "   Client Secret: [HIDDEN]"

# Step 4: Update Kubernetes secrets
echo ""
echo "🔐 Updating Kubernetes secrets..."

kubectl create secret generic google-oauth-secret -n saleor-dev \
    --from-literal=client-id="$CLIENT_ID" \
    --from-literal=client-secret="$CLIENT_SECRET" \
    --dry-run=client -o yaml | kubectl apply -f -

# Generate secure NextAuth secret
NEXTAUTH_SECRET=$(openssl rand -base64 32)
kubectl create secret generic nextauth-secret -n saleor-dev \
    --from-literal=secret="$NEXTAUTH_SECRET" \
    --dry-run=client -o yaml | kubectl apply -f -

echo "✅ Kubernetes secrets updated"

# Step 5: Restart deployment
echo "🔄 Restarting storefront deployment..."
kubectl rollout restart deployment/saleor-storefront-fixed -n saleor-dev
kubectl rollout status deployment/saleor-storefront-fixed -n saleor-dev --timeout=300s

echo ""
echo "🎉 OAuth Setup Complete!"
echo "======================="
echo ""
echo "✅ Google OAuth Client ID: $CLIENT_ID"
echo "✅ OAuth consent screen configured"
echo "✅ Kubernetes secrets updated"
echo "✅ Deployment restarted"
echo ""
echo "🌐 Test OAuth login at: http://$DOMAIN"
echo ""
echo "🔍 Verification:"
echo "   kubectl get secrets -n saleor-dev | grep oauth"
echo "   kubectl logs deployment/saleor-storefront-fixed -n saleor-dev"
echo ""
echo "📝 OAuth Configuration:"
echo "   Domain: $DOMAIN"
echo "   Callback URL: http://$DOMAIN/api/auth/callback/google"
echo "   Project: $PROJECT_ID"
echo ""

# Test the OAuth endpoint
echo "🧪 Testing OAuth configuration..."
sleep 15

if kubectl port-forward svc/saleor-storefront-fixed 3003:3000 -n saleor-dev &> /dev/null &
then
    PORT_FORWARD_PID=$!
    sleep 5
    
    if curl -s http://localhost:3003/api/auth/providers | grep -q "google"; then
        echo "✅ OAuth provider endpoint is working"
        kill $PORT_FORWARD_PID 2>/dev/null || true
    else
        echo "⚠️  OAuth provider endpoint test failed"
        kill $PORT_FORWARD_PID 2>/dev/null || true
    fi
fi

echo ""
echo "🏁 Real OAuth credentials are now configured!"
echo "Try signing in with your Google account at: http://$DOMAIN"