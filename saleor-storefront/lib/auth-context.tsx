import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User,
  AuthTokens,
  getAuthToken,
  setAuthToken,
  setRefreshToken,
  getUserData,
  storeUserData,
  logout as authLogout,
  isAuthenticated as checkIsAuthenticated,
} from './auth';
import { loginUser, registerUser, getCurrentUser, refreshToken as refreshAuthToken } from './api';
import { ApiError } from './api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => Promise<{ requiresConfirmation?: boolean }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      const token = getAuthToken();
      if (token) {
        // Try to get fresh user data from API
        try {
          const userData = await getCurrentUser();
          if (userData) {
            setUser(userData);
            storeUserData(userData);
            setIsAuthenticated(true);
          } else {
            // Token is invalid, clear auth
            handleLogout();
          }
        } catch (error) {
          // If API call fails, try to use stored user data
          const storedUser = getUserData();
          if (storedUser) {
            setUser(storedUser);
            setIsAuthenticated(true);
          } else {
            handleLogout();
          }
        }
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Auth initialization failed:', error);
      handleLogout();
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await loginUser(email, password);
      
      if (response.token && response.user) {
        setAuthToken(response.token);
        if (response.refreshToken) {
          setRefreshToken(response.refreshToken);
        }
        
        setUser(response.user);
        storeUserData(response.user);
        setIsAuthenticated(true);
      } else {
        throw new Error('Invalid login response');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => {
    try {
      setIsLoading(true);
      const response = await registerUser(data);
      
      return {
        requiresConfirmation: response.requiresConfirmation,
      };
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    authLogout();
    setUser(null);
    setIsAuthenticated(false);
  };

  const refreshUser = async () => {
    try {
      const userData = await getCurrentUser();
      if (userData) {
        setUser(userData);
        storeUserData(userData);
      }
    } catch (error) {
      console.error('Failed to refresh user data:', error);
      // Don't logout on refresh failure, just log the error
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}