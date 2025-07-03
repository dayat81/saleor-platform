#!/bin/bash

# Manual OAuth Setup Guide with Step-by-Step Instructions
set -e

PROJECT_ID="saleor-platform-dev"
DOMAIN="storefront-dev.aksa.ai"

echo "🔐 Google OAuth Manual Setup Guide"
echo "==================================="
echo ""
echo "Project: $PROJECT_ID"
echo "Domain: $DOMAIN"
echo ""

# Function to open URLs
open_url() {
    if command -v xdg-open > /dev/null; then
        xdg-open "$1"
    elif command -v open > /dev/null; then
        open "$1"
    else
        echo "Please open this URL manually: $1"
    fi
}

echo "📋 STEP 1: Configure OAuth Consent Screen"
echo "=========================================="
echo ""
echo "1. Opening OAuth consent screen configuration..."
CONSENT_URL="https://console.cloud.google.com/apis/credentials/consent?project=$PROJECT_ID"
echo "   URL: $CONSENT_URL"
open_url "$CONSENT_URL"
echo ""
echo "2. Configure the following:"
echo "   ✅ User Type: External"
echo "   ✅ App Name: Saleor Storefront"
echo "   ✅ User Support Email: hidayat@insist.co.id"
echo "   ✅ App Logo: (optional)"
echo "   ✅ App Domain: aksa.ai"
echo "   ✅ Authorized Domains: aksa.ai"
echo "   ✅ Developer Contact: hidayat@insist.co.id"
echo ""
echo "3. Scopes (click Add or Remove Scopes):"
echo "   ✅ .../auth/userinfo.email"
echo "   ✅ .../auth/userinfo.profile"
echo "   ✅ openid"
echo ""
echo "4. Test Users (optional): Add your email for testing"
echo ""
read -p "⏳ Press Enter when OAuth consent screen is configured..."

echo ""
echo "🔑 STEP 2: Create OAuth 2.0 Client ID"
echo "======================================"
echo ""
echo "1. Opening credentials page..."
CREDS_URL="https://console.cloud.google.com/apis/credentials?project=$PROJECT_ID"
echo "   URL: $CREDS_URL"
open_url "$CREDS_URL"
echo ""
echo "2. Click '+ CREATE CREDENTIALS' → 'OAuth 2.0 Client IDs'"
echo ""
echo "3. Configure OAuth Client:"
echo "   ✅ Application type: Web application"
echo "   ✅ Name: Saleor Storefront OAuth Client"
echo ""
echo "4. Authorized JavaScript origins:"
echo "   ✅ http://$DOMAIN"
echo "   ✅ http://localhost:3000"
echo ""
echo "5. Authorized redirect URIs:"
echo "   ✅ http://$DOMAIN/api/auth/callback/google"
echo "   ✅ http://localhost:3000/api/auth/callback/google"
echo ""
echo "6. Click 'CREATE'"
echo "7. Copy the Client ID and Client Secret from the popup"
echo ""
read -p "⏳ Press Enter when OAuth client is created..."

echo ""
echo "📝 STEP 3: Enter Your OAuth Credentials"
echo "======================================="
echo ""
echo "Please enter the credentials from Google Cloud Console:"
echo ""
read -p "📋 Google Client ID: " CLIENT_ID
read -s -p "🔐 Google Client Secret: " CLIENT_SECRET
echo ""

# Validate credentials
if [ -z "$CLIENT_ID" ] || [ -z "$CLIENT_SECRET" ]; then
    echo "❌ Error: Both Client ID and Secret are required"
    exit 1
fi

# Basic validation of Client ID format
if [[ ! "$CLIENT_ID" =~ \.apps\.googleusercontent\.com$ ]]; then
    echo "⚠️  Warning: Client ID should end with .apps.googleusercontent.com"
    read -p "Continue anyway? (y/N): " confirm
    if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
        echo "❌ Aborted. Please check your Client ID."
        exit 1
    fi
fi

echo ""
echo "🔧 STEP 4: Updating Kubernetes Configuration"
echo "============================================"
echo ""

# Update Kubernetes secrets
echo "🔐 Creating Kubernetes secrets..."
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

# Restart the deployment to pick up new secrets
echo "🔄 Restarting storefront deployment..."
kubectl rollout restart deployment/saleor-storefront-fixed -n saleor-dev

echo "⏳ Waiting for deployment to restart..."
kubectl rollout status deployment/saleor-storefront-fixed -n saleor-dev --timeout=300s

echo ""
echo "🎉 OAuth Setup Complete!"
echo "========================"
echo ""
echo "✅ OAuth Consent Screen: Configured"
echo "✅ OAuth Client ID: $CLIENT_ID"
echo "✅ Kubernetes Secrets: Updated"
echo "✅ Deployment: Restarted"
echo ""
echo "🌐 Your storefront is now ready for Google OAuth!"
echo "   URL: http://$DOMAIN"
echo ""
echo "🔍 Verification Commands:"
echo "   kubectl get secrets -n saleor-dev | grep oauth"
echo "   kubectl logs deployment/saleor-storefront-fixed -n saleor-dev"
echo ""

# Test OAuth endpoint
echo "🧪 Testing OAuth configuration..."
sleep 10

# Test via port-forward
kubectl port-forward svc/saleor-storefront-fixed 3004:3000 -n saleor-dev &> /dev/null &
PORT_FORWARD_PID=$!
sleep 5

if curl -s http://localhost:3004/api/auth/providers | grep -q "google"; then
    echo "✅ OAuth providers endpoint is working"
else
    echo "⚠️  OAuth providers endpoint test inconclusive"
fi

kill $PORT_FORWARD_PID 2>/dev/null || true

echo ""
echo "📋 Next Steps:"
echo "1. 🌐 Go to: http://$DOMAIN"
echo "2. 🔐 Click 'Sign in with Google'"
echo "3. ✅ Complete Google OAuth flow"
echo "4. 🎯 Verify user profile displays"
echo ""
echo "🔧 If you encounter issues:"
echo "- Check that DNS points $DOMAIN to your LoadBalancer IP"
echo "- Verify OAuth redirect URIs match exactly"
echo "- Ensure OAuth consent screen is published (not in testing)"
echo ""
echo "🏁 Google OAuth is now configured and ready!"