import './globals.css'
import { Inter } from 'next/font/google'
import { ApolloWrapper } from '@/lib/apollo-wrapper'
import { AuthProvider } from '@/lib/auth-context'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { Toaster } from '@/components/ui/toaster'
import { ChatWidget } from '@/components/chat/ChatWidget'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Saleor F&B Backoffice',
  description: 'Food & Beverage Management System',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ApolloWrapper>
          <AuthProvider>
            <ProtectedRoute>
              {children}
            </ProtectedRoute>
            <Toaster />
            <ChatWidget />
          </AuthProvider>
        </ApolloWrapper>
      </body>
    </html>
  )
}