#!/bin/bash

# Quick demo OAuth setup for testing (uses placeholder credentials)
# For production, use create-oauth-credentials.sh with real Google credentials

set -e

echo "🚀 Setting up Demo OAuth Credentials for Testing"
echo "================================================"
echo ""
echo "⚠️  Note: This creates demo credentials for local testing only"
echo "For production, use: ./scripts/create-oauth-credentials.sh"
echo ""

PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
DOMAIN="storefront-dev.aksa.ai"

# Create demo credentials (these won't work for real OAuth but will allow app to start)
DEMO_CLIENT_ID="123456789-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com"
DEMO_CLIENT_SECRET="GOCSPX-demo_client_secret_for_testing"
NEXTAUTH_SECRET=$(openssl rand -base64 32)

echo "🔧 Creating demo OAuth secrets in Kubernetes..."

# Create secrets
kubectl create secret generic google-oauth-secret -n saleor-dev \
    --from-literal=client-id="$DEMO_CLIENT_ID" \
    --from-literal=client-secret="$DEMO_CLIENT_SECRET" \
    --dry-run=client -o yaml | kubectl apply -f -

kubectl create secret generic nextauth-secret -n saleor-dev \
    --from-literal=secret="$NEXTAUTH_SECRET" \
    --dry-run=client -o yaml | kubectl apply -f -

echo "✅ Demo secrets created"

# Apply the deployment
echo "🔄 Applying storefront deployment with OAuth configuration..."
kubectl apply -f /home/ptsec/saleor-platform/k8s/dev/saleor-storefront-fixed.yaml

echo "⏳ Waiting for deployment rollout..."
kubectl rollout status deployment/saleor-storefront-fixed -n saleor-dev --timeout=300s

echo ""
echo "✅ Demo OAuth setup complete!"
echo ""
echo "📋 What was configured:"
echo "   ✅ OAuth secrets in Kubernetes"
echo "   ✅ Storefront deployment updated"
echo "   ✅ NextAuth.js configured"
echo ""
echo "🌐 Storefront URL: http://$DOMAIN"
echo ""
echo "⚠️  Important:"
echo "   - Demo credentials won't work for real Google OAuth"
echo "   - Google sign-in will show 'OAuth client not found' error"
echo "   - Use ./scripts/create-oauth-credentials.sh for real setup"
echo ""
echo "🔧 To configure real OAuth credentials:"
echo "   1. Run: ./scripts/create-oauth-credentials.sh"
echo "   2. Follow the interactive setup process"
echo "   3. Enter real Google Client ID and Secret"
echo ""
echo "🧪 Test the app structure (without OAuth):"
echo "   curl -H 'Host: $DOMAIN' http://34.101.90.208/"
echo ""

# Show current pod status
echo "📊 Current deployment status:"
kubectl get pods -n saleor-dev -l app=saleor-storefront-fixed

echo ""
echo "🏁 Demo setup complete!"