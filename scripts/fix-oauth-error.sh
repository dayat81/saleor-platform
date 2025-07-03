#!/bin/bash

# Quick fix for "OAuth client was not found" error
set -e

echo "🔧 Fixing OAuth Error: 'OAuth client was not found'"
echo "===================================================="
echo ""
echo "The error occurs because demo credentials are configured."
echo "You need real Google OAuth credentials from Google Cloud Console."
echo ""

PROJECT_ID="saleor-platform-dev"
DOMAIN="storefront-dev.aksa.ai"

echo "🎯 Required Configuration:"
echo "========================="
echo ""
echo "📋 OAuth Consent Screen:"
echo "   URL: https://console.cloud.google.com/apis/credentials/consent?project=$PROJECT_ID"
echo "   - App Name: Saleor Storefront"
echo "   - User Support Email: hidayat@insist.co.id"
echo "   - Authorized Domains: aksa.ai"
echo ""
echo "🔑 OAuth Client Credentials:"
echo "   URL: https://console.cloud.google.com/apis/credentials?project=$PROJECT_ID"
echo "   - Type: Web application"
echo "   - JavaScript Origins: http://$DOMAIN, http://localhost:3000"
echo "   - Redirect URIs: http://$DOMAIN/api/auth/callback/google"
echo ""

echo "Choose an option:"
echo "1. 🚀 I have OAuth credentials ready (quick fix)"
echo "2. 📋 Guide me through creating credentials"
echo "3. 🧪 Use demo mode (OAuth won't work but app will start)"
echo ""
read -p "Enter choice (1-3): " choice

case $choice in
    1)
        echo ""
        echo "🔐 Enter your Google OAuth credentials:"
        echo ""
        read -p "Client ID: " CLIENT_ID
        read -s -p "Client Secret: " CLIENT_SECRET
        echo ""
        
        if [ -z "$CLIENT_ID" ] || [ -z "$CLIENT_SECRET" ]; then
            echo "❌ Error: Both credentials required"
            exit 1
        fi
        
        # Update secrets
        kubectl create secret generic google-oauth-secret -n saleor-dev \
            --from-literal=client-id="$CLIENT_ID" \
            --from-literal=client-secret="$CLIENT_SECRET" \
            --dry-run=client -o yaml | kubectl apply -f -
        
        NEXTAUTH_SECRET=$(openssl rand -base64 32)
        kubectl create secret generic nextauth-secret -n saleor-dev \
            --from-literal=secret="$NEXTAUTH_SECRET" \
            --dry-run=client -o yaml | kubectl apply -f -
        
        kubectl rollout restart deployment/saleor-storefront-fixed -n saleor-dev
        kubectl rollout status deployment/saleor-storefront-fixed -n saleor-dev --timeout=180s
        
        echo ""
        echo "✅ OAuth credentials updated!"
        echo "🌐 Test at: http://$DOMAIN"
        ;;
        
    2)
        echo ""
        echo "📋 Step-by-step OAuth setup:"
        ./scripts/manual-oauth-setup.sh
        ;;
        
    3)
        echo ""
        echo "🧪 Demo mode - OAuth won't work but app will start"
        echo "📋 Instructions saved to OAUTH-QUICK-SETUP.md"
        echo "🌐 App available at: http://$DOMAIN (OAuth button will show error)"
        ;;
        
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "🔍 Current OAuth status:"
kubectl get secrets -n saleor-dev | grep -E "(google-oauth|nextauth)" || echo "No OAuth secrets found"

echo ""
echo "📝 Documentation:"
echo "   - Quick setup: OAUTH-QUICK-SETUP.md"
echo "   - Full guide: GOOGLE-OAUTH-SETUP.md"
echo ""
echo "🏁 OAuth configuration complete!"