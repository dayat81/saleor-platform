# Google OAuth Setup for Saleor Storefront

## Overview
The Saleor storefront now includes Google OAuth login functionality using NextAuth.js. Users can sign in with their Gmail accounts to access the e-commerce platform.

## Features Implemented
- ✅ Google OAuth 2.0 integration with NextAuth.js
- ✅ Sign in with Google button
- ✅ User profile display (name, email, avatar)
- ✅ Sign out functionality
- ✅ Session management
- ✅ Responsive authentication UI

## Required Google Cloud Console Setup

### 1. Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing project
3. Enable the Google+ API

### 2. Configure OAuth Consent Screen
1. Navigate to **APIs & Services** > **OAuth consent screen**
2. Choose **External** user type
3. Fill in required information:
   - App name: `Saleor Storefront`
   - User support email: Your email
   - Developer contact information: Your email
4. Add scopes: `email`, `profile`, `openid`
5. Add test users if needed

### 3. Create OAuth 2.0 Credentials
1. Navigate to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth 2.0 Client IDs**
3. Application type: **Web application**
4. Name: `Saleor Storefront OAuth`
5. **Authorized JavaScript origins**:
   ```
   http://storefront-dev.aksa.ai
   http://localhost:3000
   ```
6. **Authorized redirect URIs**:
   ```
   http://storefront-dev.aksa.ai/api/auth/callback/google
   http://localhost:3000/api/auth/callback/google
   ```
7. Click **Create**
8. Copy the **Client ID** and **Client Secret**

## Update Kubernetes Deployment

Replace the placeholder values in the storefront deployment:

```bash
kubectl edit deployment saleor-storefront-fixed -n saleor-dev
```

Update these environment variables:
```yaml
env:
- name: GOOGLE_CLIENT_ID
  value: "YOUR_ACTUAL_GOOGLE_CLIENT_ID.apps.googleusercontent.com"
- name: GOOGLE_CLIENT_SECRET
  value: "YOUR_ACTUAL_GOOGLE_CLIENT_SECRET"
- name: NEXTAUTH_SECRET
  value: "a-secure-random-string-generate-new-one"
```

Or use a ConfigMap/Secret approach:

```bash
# Create secret for Google OAuth credentials
kubectl create secret generic google-oauth-secret -n saleor-dev \
  --from-literal=client-id="YOUR_GOOGLE_CLIENT_ID" \
  --from-literal=client-secret="YOUR_GOOGLE_CLIENT_SECRET"

# Create secret for NextAuth
kubectl create secret generic nextauth-secret -n saleor-dev \
  --from-literal=secret="$(openssl rand -base64 32)"
```

Then update the deployment to use secrets:
```yaml
env:
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
- name: NEXTAUTH_SECRET
  valueFrom:
    secretKeyRef:
      name: nextauth-secret
      key: secret
```

## Testing the Integration

### 1. Access the Storefront
- **URL**: http://storefront-dev.aksa.ai/
- **Port Forward**: `kubectl port-forward svc/saleor-storefront-fixed 3000:3000 -n saleor-dev`

### 2. Test Google Sign-In
1. Click "Sign in with Google" button
2. Complete Google OAuth flow
3. Verify user profile displays correctly
4. Test sign out functionality

### 3. Verify Features
- ✅ User profile information (name, email, avatar)
- ✅ Authentication state persistence
- ✅ Proper redirects after login/logout
- ✅ Session management

## Security Considerations

### Production Setup
1. **Use HTTPS**: Update URLs to use HTTPS in production
2. **Secure Secrets**: Store OAuth credentials in Kubernetes secrets
3. **Environment Variables**: Use proper secret management
4. **CORS Configuration**: Ensure proper CORS settings
5. **Domain Validation**: Verify authorized domains in Google Console

### NextAuth Security
- Generate secure `NEXTAUTH_SECRET` using: `openssl rand -base64 32`
- Use environment-specific URLs
- Enable CSRF protection (enabled by default)
- Use secure cookie settings in production

## Integration with Saleor Backend

The current implementation provides frontend authentication. To fully integrate with Saleor:

1. **User Synchronization**: Implement GraphQL mutations to create/update users in Saleor
2. **JWT Token Integration**: Pass NextAuth tokens to Saleor API
3. **Customer Account Creation**: Automatically create customer accounts in Saleor
4. **Order Management**: Link authenticated users to their orders

Example GraphQL mutation for user creation:
```graphql
mutation CreateUser($input: AccountRegisterInput!) {
  accountRegister(input: $input) {
    user {
      id
      email
      firstName
      lastName
    }
    errors {
      field
      message
    }
  }
}
```

## Troubleshooting

### Common Issues
1. **OAuth Error**: Check redirect URIs match exactly
2. **Client ID Missing**: Ensure environment variables are set correctly
3. **CORS Errors**: Verify authorized origins in Google Console
4. **Session Issues**: Check NextAuth secret is set

### Debug Commands
```bash
# Check environment variables
kubectl exec -it deployment/saleor-storefront-fixed -n saleor-dev -- env | grep -E "(GOOGLE|NEXTAUTH)"

# Check pod logs
kubectl logs deployment/saleor-storefront-fixed -n saleor-dev

# Test connectivity
curl -H "Host: storefront-dev.aksa.ai" http://34.101.90.208/api/auth/providers
```

## Current Status
- ✅ Google OAuth integration implemented
- ✅ NextAuth.js configured
- ✅ Authentication UI created
- ⚠️  **Requires**: Real Google OAuth credentials
- ⚠️  **Requires**: Production HTTPS setup for security
- 🔄  **Optional**: Full Saleor backend integration

The storefront is ready for Google OAuth authentication once proper credentials are configured.