# Google OAuth Setup Guide - Complete Walkthrough

## Problem: Error 401: invalid_client

This error means Google OAuth credentials are not properly configured. Follow this step-by-step guide to fix it.

## Step 1: Google Cloud Console Setup

### 1.1 Create/Select Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account
3. Click project dropdown → "New Project"
4. Name: "F&B Marketplace" (or your preferred name)
5. Click "Create"

### 1.2 Enable Required APIs
1. Go to "APIs & Services" → "Library"
2. Search and enable these APIs:
   - **Google+ API** (for basic profile info)
   - **People API** (for user details)

### 1.3 Configure OAuth Consent Screen
1. Go to "APIs & Services" → "OAuth consent screen"
2. Choose "External" (unless you have Google Workspace)
3. Fill in required fields:

```
App name: F&B Marketplace
User support email: your-email@domain.com
Developer contact information: your-email@domain.com
```

4. **Scopes**: Add these scopes:
   - `../auth/userinfo.email`
   - `../auth/userinfo.profile`
   - `openid`

5. **Test users** (for development):
   - Add your email: `hidayat@insist.co.id`
   - Add any other test emails

6. Click "Save and Continue" through all steps

## Step 2: Create OAuth 2.0 Credentials

### 2.1 Create Client ID
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth 2.0 Client IDs"
3. Application type: "Web application"
4. Name: "F&B Marketplace Web Client"

### 2.2 Configure Authorized URLs

**Authorized JavaScript origins:**
```
http://localhost:3000
http://192.168.18.144:3000
```

**Authorized redirect URIs:**
```
http://localhost:3000/api/auth/callback/google
http://192.168.18.144:3000/api/auth/callback/google
```

### 2.3 Download Credentials
1. Click "Create"
2. Copy the **Client ID** and **Client Secret**
3. Keep these secure!

## Step 3: Update Environment Variables

### 3.1 Update .env.local
Replace the placeholder values in `.env.local`:

```env
# Saleor API Configuration
NEXT_PUBLIC_API_URL=http://192.168.18.144:8000/graphql/

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-32-character-secret-here

# Google OAuth Configuration (REPLACE WITH REAL VALUES)
GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-actual-client-secret-here
```

### 3.2 Generate Secure Secret
Run this command to generate NEXTAUTH_SECRET:

```bash
openssl rand -base64 32
```

## Step 4: Restart and Test

### 4.1 Restart Development Server
```bash
# Stop current server (Ctrl+C)
npm run dev
```

### 4.2 Test OAuth Flow
1. Go to: http://localhost:3000/auth/login
2. Click "Sign in with Google"
3. Should redirect to Google OAuth
4. Complete authentication
5. Should redirect back to your app

## Common Issues & Solutions

### Issue 1: "OAuth client was not found"
**Cause**: Wrong Client ID or Secret
**Solution**: 
- Double-check credentials in Google Console
- Ensure no extra spaces in .env.local
- Restart development server

### Issue 2: "redirect_uri_mismatch"
**Cause**: Redirect URI not authorized
**Solution**:
- Add exact URI to Google Console
- Check for http vs https
- Include port numbers

### Issue 3: "Access blocked: This app isn't verified"
**Cause**: App not verified by Google
**Solutions**:
- Add test users in OAuth consent screen
- Use your own email for testing
- For production: submit for verification

### Issue 4: "403: access_denied"
**Cause**: User not in test users list
**Solution**:
- Add user email to test users in Google Console
- Or publish the app (for production)

## Development vs Production

### Development Setup
```env
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=dev-client-id
```

### Production Setup
```env
NEXTAUTH_URL=https://yourdomain.com
GOOGLE_CLIENT_ID=prod-client-id
```

**Important**: Use different OAuth clients for dev and production!

## Security Checklist

- [ ] Client Secret is secure and not in version control
- [ ] NEXTAUTH_SECRET is 32+ characters
- [ ] Authorized URIs exactly match your domains
- [ ] Test users include all developers
- [ ] Scopes are minimal (email, profile, openid only)

## Testing Checklist

- [ ] Google button appears on login page
- [ ] Click redirects to Google OAuth
- [ ] Can complete Google authentication
- [ ] Redirects back to application
- [ ] User session is created
- [ ] Can sign out properly

## Next Steps After Setup

1. **Test with multiple users**
2. **Add error handling for OAuth failures**
3. **Implement user profile sync with Saleor**
4. **Add Facebook/Apple login (optional)**
5. **Prepare for production verification**

---

## Quick Fix Commands

```bash
# Check current environment
cat .env.local

# Restart with fresh environment
npm run dev

# Test API endpoint
curl http://localhost:3000/api/auth/providers

# Check Google provider is loaded
curl http://localhost:3000/api/auth/providers | grep google
```

## Support

If you continue having issues:
1. Check Google Cloud Console audit logs
2. Enable NextAuth debug mode: `NEXTAUTH_DEBUG=true`
3. Check browser developer console for errors
4. Verify network requests in browser DevTools