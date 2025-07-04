'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useMutation, useQuery } from '@apollo/client'
import { TOKEN_AUTH_MUTATION, USER_QUERY } from './graphql/auth'
import { toast } from '@/hooks/use-toast'

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  isStaff: boolean
  isActive: boolean
  userPermissions: Array<{
    code: string
    name: string
  }>
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  loading: boolean
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const [tokenAuth] = useMutation(TOKEN_AUTH_MUTATION)
  
  // Check for existing token on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('auth_token')
    if (savedToken) {
      setToken(savedToken)
      // Verify token is still valid by fetching user
      fetchUser(savedToken)
    } else {
      setLoading(false)
    }
  }, [])

  const fetchUser = async (authToken: string) => {
    try {
      // We'll implement user fetching with the token
      // For now, we'll assume the token is valid
      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch user:', error)
      logout()
    }
  }

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true)
      const { data } = await tokenAuth({
        variables: { email, password }
      })

      if (data?.tokenCreate?.errors?.length > 0) {
        const errorMessage = data.tokenCreate.errors[0].message || 'Login failed'
        toast({
          title: 'Login Failed',
          description: errorMessage,
          variant: 'destructive'
        })
        return false
      }

      if (data?.tokenCreate?.token) {
        const authToken = data.tokenCreate.token
        const userData = data.tokenCreate.user

        setToken(authToken)
        setUser(userData)
        localStorage.setItem('auth_token', authToken)
        
        toast({
          title: 'Login Successful',
          description: `Welcome back, ${userData.firstName || userData.email}!`
        })
        
        return true
      }

      return false
    } catch (error) {
      console.error('Login error:', error)
      toast({
        title: 'Login Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive'
      })
      return false
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('auth_token')
    toast({
      title: 'Logged Out',
      description: 'You have been successfully logged out.'
    })
  }

  const value: AuthContextType = {
    user,
    token,
    login,
    logout,
    loading,
    isAuthenticated: !!token && !!user
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}