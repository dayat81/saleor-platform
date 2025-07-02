import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { useMutation } from '@apollo/client';
import { LOGIN_MUTATION, REGISTER_MUTATION } from './graphql/auth';
import apolloClient from './apollo-client';

// Check if Google OAuth is properly configured
const isGoogleConfigured = process.env.GOOGLE_CLIENT_ID && 
  process.env.GOOGLE_CLIENT_SECRET && 
  process.env.GOOGLE_CLIENT_ID !== 'your-google-client-id-from-console' &&
  process.env.GOOGLE_CLIENT_SECRET !== 'your-google-client-secret-from-console';

export const authOptions: NextAuthOptions = {
  providers: [
    // Only include Google provider if properly configured
    ...(isGoogleConfigured ? [
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        authorization: {
          params: {
            prompt: "consent",
            access_type: "offline",
            response_type: "code"
          }
        }
      })
    ] : []),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const { data } = await apolloClient.mutate({
            mutation: LOGIN_MUTATION,
            variables: {
              email: credentials.email,
              password: credentials.password,
            },
          });

          if (data?.tokenCreate?.errors?.length > 0) {
            return null;
          }

          if (data?.tokenCreate?.token && data?.tokenCreate?.user) {
            return {
              id: data.tokenCreate.user.id,
              email: data.tokenCreate.user.email,
              name: `${data.tokenCreate.user.firstName} ${data.tokenCreate.user.lastName}`,
              accessToken: data.tokenCreate.token,
              refreshToken: data.tokenCreate.refreshToken,
            };
          }

          return null;
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      },
    }),
  ],
  
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        try {
          // Check if user exists in Saleor
          const existingUser = await checkSaleorUser(user.email!);
          
          if (!existingUser) {
            // Create user in Saleor
            const result = await apolloClient.mutate({
              mutation: REGISTER_MUTATION,
              variables: {
                input: {
                  email: user.email,
                  firstName: profile?.given_name || user.name?.split(' ')[0] || '',
                  lastName: profile?.family_name || user.name?.split(' ').slice(1).join(' ') || '',
                  redirectUrl: `${process.env.NEXTAUTH_URL}/auth/verify-email`,
                },
              },
            });

            if (result.data?.accountRegister?.errors?.length > 0) {
              console.error('Failed to create user in Saleor:', result.data.accountRegister.errors);
              return false;
            }
          }
          
          return true;
        } catch (error) {
          console.error('Google sign-in error:', error);
          return false;
        }
      }
      
      return true;
    },

    async jwt({ token, user, account }) {
      if (account && user) {
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
      }
      return token;
    },

    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.refreshToken = token.refreshToken;
      return session;
    },
  },

  pages: {
    signIn: '/auth/login',
    signUp: '/auth/register',
    error: '/auth/error',
  },

  session: {
    strategy: 'jwt',
  },

  secret: process.env.NEXTAUTH_SECRET,
};

// Helper function to check if user exists in Saleor
async function checkSaleorUser(email: string): Promise<boolean> {
  try {
    // We can try to get user info or implement a specific query
    // For now, we'll assume new Google users need to be created
    return false;
  } catch (error) {
    return false;
  }
}