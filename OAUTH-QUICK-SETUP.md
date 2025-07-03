# Quick OAuth Setup Guide

## Error Fix: "OAuth client was not found. Error 401: invalid_client"

The error occurs because we need real Google OAuth credentials. Here's the quick fix:

## 🚀 Quick Setup (5 minutes)

### Step 1: OAuth Consent Screen
1. **Open**: https://console.cloud.google.com/apis/credentials/consent?project=saleor-platform-dev
2. **Choose**: External
3. **Fill in**:
   - App name: `Saleor Storefront`
   - User support email: `hidayat@insist.co.id`
   - Developer contact: `hidayat@insist.co.id`
   - Authorized domains: `aksa.ai`

### Step 2: Create OAuth Client
1. **Open**: https://console.cloud.google.com/apis/credentials?project=saleor-platform-dev
2. **Click**: CREATE CREDENTIALS → OAuth 2.0 Client IDs
3. **Configure**:
   - Application type: `Web application`
   - Name: `Saleor Storefront OAuth`
   - Authorized JavaScript origins:
     ```
     http://storefront-dev.aksa.ai
     http://localhost:3000
     ```
   - Authorized redirect URIs:
     ```
     http://storefront-dev.aksa.ai/api/auth/callback/google
     http://localhost:3000/api/auth/callback/google
     ```

### Step 3: Update Credentials
Run this command and enter your real credentials:
```bash
./scripts/manual-oauth-setup.sh
```

## 🔧 Alternative: Manual Update

If you have the credentials, update them directly:

```bash
# Replace with your real credentials
CLIENT_ID="YOUR_REAL_CLIENT_ID.apps.googleusercontent.com"
CLIENT_SECRET="YOUR_REAL_CLIENT_SECRET"

# Update Kubernetes secrets
kubectl create secret generic google-oauth-secret -n saleor-dev \
    --from-literal=client-id="$CLIENT_ID" \
    --from-literal=client-secret="$CLIENT_SECRET" \
    --dry-run=client -o yaml | kubectl apply -f -

# Restart deployment
kubectl rollout restart deployment/saleor-storefront-fixed -n saleor-dev
```

## 🎯 Expected Result

After setup, visiting http://storefront-dev.aksa.ai should show:
- ✅ Saleor shop information
- ✅ "Sign in with Google" button  
- ✅ Working OAuth flow (no more "client not found" error)
- ✅ User profile display after login

## 🔍 Verification

Test OAuth endpoint:
```bash
kubectl port-forward svc/saleor-storefront-fixed 3000:3000 -n saleor-dev
curl http://localhost:3000/api/auth/providers
```

Should return:
```json
{"google":{"id":"google","name":"Google","type":"oauth","signinUrl":"...","callbackUrl":"..."}}
```

## 📋 Troubleshooting

- **"OAuth client not found"**: Credentials not updated in Kubernetes
- **"redirect_uri_mismatch"**: Check authorized redirect URIs
- **"access_blocked"**: OAuth consent screen not configured

The OAuth infrastructure is complete - only real Google credentials are needed to resolve the error.