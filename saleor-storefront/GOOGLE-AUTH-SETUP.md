# Google OAuth Integration Setup Guide

This guide explains how to set up Google OAuth authentication for the F&B Marketplace frontend.

## Prerequisites

1. **Google Cloud Console Project**: You need a Google Cloud Console project
2. **OAuth 2.0 Credentials**: Client ID and Client Secret from Google
3. **Authorized Redirect URIs**: Properly configured redirect URLs

## Setup Steps

### 1. Google Cloud Console Configuration

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google+ API
4. Go to "Credentials" in the API & Services section
5. Click "Create Credentials" > "OAuth 2.0 Client IDs"
6. Choose "Web application"
7. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `http://192.168.18.144:3000/api/auth/callback/google` (local network)
   - `https://yourdomain.com/api/auth/callback/google` (production)

### 2. Environment Variables

Copy `.env.example` to `.env.local` and update:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-actual-google-client-id
GOOGLE_CLIENT_SECRET=your-actual-google-client-secret

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=a-secure-random-string-at-least-32-characters
```

### 3. Generate NextAuth Secret

Run this command to generate a secure secret:

```bash
openssl rand -base64 32
```

## Features Implemented

### 🔐 Authentication Flow
- **Google OAuth 2.0**: Secure authentication via Google
- **Account Creation**: Automatic user creation in Saleor when using Google
- **Session Management**: JWT-based sessions with NextAuth.js
- **Secure Logout**: Proper session cleanup

### 🎨 UI Components
- **GoogleSignInButton**: Reusable Google authentication button
- **Responsive Design**: Works on all device sizes
- **Loading States**: Visual feedback during authentication
- **Error Handling**: User-friendly error messages

### 🔗 Saleor Integration
- **User Sync**: Google users are created in Saleor backend
- **Profile Mapping**: Google profile data maps to Saleor user fields
- **Fallback Handling**: Graceful handling of Saleor connection issues

## File Structure

```
lib/
├── auth-config.ts          # NextAuth configuration
├── auth-provider.tsx       # Session provider wrapper
├── apollo-client.ts        # GraphQL client (existing)
└── graphql/
    └── auth.ts            # Authentication GraphQL queries

components/
└── auth/
    └── GoogleSignInButton.tsx  # Google sign-in component

app/
├── api/
│   └── auth/
│       └── [...nextauth]/
│           └── route.ts    # NextAuth API routes
├── auth/
│   ├── login/
│   │   └── page.tsx       # Login page with Google button
│   └── register/
│       └── page.tsx       # Register page with Google button
└── account/
    └── page.tsx           # Protected account page
```

## Usage

### In Login/Register Pages

```tsx
import GoogleSignInButton from '@/components/auth/GoogleSignInButton';

// In your component
<GoogleSignInButton variant="login" />
<GoogleSignInButton variant="register" />
```

### Checking Authentication Status

```tsx
import { useSession } from 'next-auth/react';

function MyComponent() {
  const { data: session, status } = useSession();
  
  if (status === 'loading') return <p>Loading...</p>;
  if (status === 'unauthenticated') return <p>Not signed in</p>;
  
  return <p>Signed in as {session.user.email}</p>;
}
```

### Protecting Pages

```tsx
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

function ProtectedPage() {
  const { status } = useSession();
  const router = useRouter();
  
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, router]);
  
  // Page content...
}
```

## Testing

### 1. Start the Development Server

```bash
npm run dev
```

### 2. Test Google Authentication

1. Navigate to `http://localhost:3000/auth/login`
2. Click "Sign in with Google"
3. Complete Google OAuth flow
4. Verify redirect to `/account` page
5. Check user creation in Saleor admin

### 3. Test Sign Out

1. From account page, click "Sign Out"
2. Verify redirect to home page
3. Confirm session is cleared

## Security Considerations

### 🔒 Environment Variables
- Never commit `.env.local` to version control
- Use secure, random values for `NEXTAUTH_SECRET`
- Rotate credentials regularly

### 🛡️ HTTPS Requirements
- Google OAuth requires HTTPS in production
- Use proper SSL certificates
- Configure secure cookie settings

### 🔐 Data Protection
- User data is encrypted in transit and at rest
- Minimal data collection (email, name only)
- Compliance with Google's OAuth policies

## Troubleshooting

### Common Issues

1. **"OAuth Error: redirect_uri_mismatch"**
   - Check authorized redirect URIs in Google Console
   - Ensure exact match including protocol and port

2. **"Invalid client_id"**
   - Verify `GOOGLE_CLIENT_ID` in environment variables
   - Check if credentials are for correct environment

3. **NextAuth errors**
   - Ensure `NEXTAUTH_SECRET` is set
   - Check `NEXTAUTH_URL` matches your domain

4. **Saleor integration issues**
   - Verify Saleor API is accessible
   - Check GraphQL mutations are correct
   - Review Saleor logs for errors

### Debug Mode

Enable debug logging in development:

```env
NEXTAUTH_DEBUG=true
```

## Production Deployment

### Environment Setup
1. Update `NEXTAUTH_URL` to production domain
2. Add production redirect URI to Google Console
3. Use secure `NEXTAUTH_SECRET`
4. Enable HTTPS

### Domain Configuration
```env
NEXTAUTH_URL=https://yourdomain.com
GOOGLE_CLIENT_ID=prod-client-id
GOOGLE_CLIENT_SECRET=prod-client-secret
```

## Next Steps

1. **Enhanced Profile Management**: Add more user profile fields
2. **Role-Based Access**: Implement user roles and permissions
3. **Social Login Expansion**: Add Facebook, Apple, etc.
4. **Account Linking**: Allow linking multiple OAuth providers
5. **2FA Integration**: Add two-factor authentication

---

For more information, see:
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Google OAuth 2.0 Guide](https://developers.google.com/identity/protocols/oauth2)
- [Saleor GraphQL API](https://docs.saleor.io/docs/3.x/api-reference)