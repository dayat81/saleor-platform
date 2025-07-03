#!/bin/bash

# Script to create real Google OAuth credentials through Cloud Console
# This provides step-by-step instructions and automated credential updates

set -e

PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
DOMAIN="storefront-dev.aksa.ai"

echo "🔐 Google OAuth Credential Setup for Saleor Storefront"
echo "=================================================="
echo ""
echo "Project ID: $PROJECT_ID"
echo "Domain: $DOMAIN"
echo ""

# Function to open URLs (cross-platform)
open_url() {
    if command -v xdg-open > /dev/null; then
        xdg-open "$1"
    elif command -v open > /dev/null; then
        open "$1"
    else
        echo "Please open this URL manually: $1"
    fi
}

echo "📋 Step 1: Configure OAuth Consent Screen"
echo "==========================================="
echo ""
echo "1. Opening Google Cloud Console..."
CONSENT_URL="https://console.cloud.google.com/apis/credentials/consent?project=$PROJECT_ID"
echo "   URL: $CONSENT_URL"
open_url "$CONSENT_URL"
echo ""
echo "2. Configure the consent screen:"
echo "   - User Type: External"
echo "   - App Name: Saleor Storefront"
echo "   - User Support Email: Your email"
echo "   - Developer Contact: Your email"
echo "   - Authorized Domains: aksa.ai"
echo "   - Scopes: email, profile, openid"
echo ""
read -p "Press Enter when OAuth consent screen is configured..."

echo ""
echo "🔑 Step 2: Create OAuth 2.0 Client ID"
echo "======================================"
echo ""
echo "1. Opening Credentials page..."
CREDS_URL="https://console.cloud.google.com/apis/credentials?project=$PROJECT_ID"
echo "   URL: $CREDS_URL"
open_url "$CREDS_URL"
echo ""
echo "2. Click 'Create Credentials' > 'OAuth 2.0 Client IDs'"
echo "3. Configure the OAuth client:"
echo "   - Application type: Web application"
echo "   - Name: Saleor Storefront OAuth"
echo "   - Authorized JavaScript origins:"
echo "     * http://$DOMAIN"
echo "     * http://localhost:3000"
echo "   - Authorized redirect URIs:"
echo "     * http://$DOMAIN/api/auth/callback/google"
echo "     * http://localhost:3000/api/auth/callback/google"
echo ""
read -p "Press Enter when OAuth client is created..."

echo ""
echo "📝 Step 3: Enter OAuth Credentials"
echo "=================================="
echo ""
read -p "Enter Google Client ID: " CLIENT_ID
read -s -p "Enter Google Client Secret: " CLIENT_SECRET
echo ""

if [ -z "$CLIENT_ID" ] || [ -z "$CLIENT_SECRET" ]; then
    echo "❌ Error: Client ID and Secret are required"
    exit 1
fi

echo ""
echo "🔧 Step 4: Updating Kubernetes Deployment"
echo "========================================="
echo ""

# Validate credentials format
if [[ ! "$CLIENT_ID" =~ \.apps\.googleusercontent\.com$ ]]; then
    echo "⚠️  Warning: Client ID doesn't end with .apps.googleusercontent.com"
    read -p "Continue anyway? (y/N): " confirm
    if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
        echo "Aborted."
        exit 1
    fi
fi

# Update secrets
echo "🔐 Creating/updating Kubernetes secrets..."

kubectl create secret generic google-oauth-secret -n saleor-dev \
    --from-literal=client-id="$CLIENT_ID" \
    --from-literal=client-secret="$CLIENT_SECRET" \
    --dry-run=client -o yaml | kubectl apply -f -

# Generate a secure NextAuth secret
NEXTAUTH_SECRET=$(openssl rand -base64 32)
kubectl create secret generic nextauth-secret -n saleor-dev \
    --from-literal=secret="$NEXTAUTH_SECRET" \
    --dry-run=client -o yaml | kubectl apply -f -

echo "✅ Secrets updated successfully"

# Apply the updated deployment
echo "🔄 Applying updated deployment configuration..."
kubectl apply -f /home/ptsec/saleor-platform/k8s/dev/saleor-storefront-fixed.yaml

echo "⏳ Waiting for deployment rollout..."
kubectl rollout status deployment/saleor-storefront-fixed -n saleor-dev --timeout=300s

echo ""
echo "🎉 OAuth Setup Complete!"
echo "======================="
echo ""
echo "✅ Google OAuth Client ID: $CLIENT_ID"
echo "✅ Kubernetes secrets updated"
echo "✅ Deployment rolled out"
echo ""
echo "🌐 Test your OAuth login at: http://$DOMAIN"
echo ""
echo "🔍 Verification Commands:"
echo "   kubectl get secrets -n saleor-dev | grep oauth"
echo "   kubectl logs deployment/saleor-storefront-fixed -n saleor-dev"
echo ""
echo "📝 Important Notes:"
echo "   - OAuth credentials are now stored securely in Kubernetes secrets"
echo "   - The storefront will restart automatically with new credentials"
echo "   - Make sure DNS is pointing $DOMAIN to your LoadBalancer IP"
echo ""

# Test the deployment
echo "🧪 Testing OAuth endpoint..."
sleep 10
if curl -s -H "Host: $DOMAIN" "http://34.101.90.208/api/auth/providers" | grep -q "google"; then
    echo "✅ OAuth provider endpoint is responding"
else
    echo "⚠️  OAuth provider endpoint test failed - check deployment logs"
fi

echo ""
echo "🏁 Setup complete! Your Google OAuth is now configured."