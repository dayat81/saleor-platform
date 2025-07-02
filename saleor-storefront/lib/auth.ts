import { getCookie, setCookie, deleteCookie } from 'cookies-next';

const TOKEN_COOKIE_NAME = 'saleor-auth-token';
const REFRESH_TOKEN_COOKIE_NAME = 'saleor-refresh-token';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  dateJoined: string;
  lastLogin?: string;
}

export interface AuthTokens {
  token: string;
  refreshToken?: string;
  user?: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface PasswordResetData {
  email: string;
}

export interface PasswordChangeData {
  oldPassword: string;
  newPassword: string;
}

// Token management
export const getAuthToken = (): string | null => {
  return getCookie(TOKEN_COOKIE_NAME) as string | null;
};

export const setAuthToken = (token: string, options?: { expires?: Date }) => {
  setCookie(TOKEN_COOKIE_NAME, token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    ...options,
  });
};

export const getRefreshToken = (): string | null => {
  return getCookie(REFRESH_TOKEN_COOKIE_NAME) as string | null;
};

export const setRefreshToken = (token: string, options?: { expires?: Date }) => {
  setCookie(REFRESH_TOKEN_COOKIE_NAME, token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    ...options,
  });
};

export const clearAuthTokens = () => {
  deleteCookie(TOKEN_COOKIE_NAME);
  deleteCookie(REFRESH_TOKEN_COOKIE_NAME);
};

// Auth state management
export const isAuthenticated = (): boolean => {
  return !!getAuthToken();
};

// Storage utilities for user data
export const storeUserData = (user: User) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('saleor-user', JSON.stringify(user));
  }
};

export const getUserData = (): User | null => {
  if (typeof window !== 'undefined') {
    const userData = localStorage.getItem('saleor-user');
    return userData ? JSON.parse(userData) : null;
  }
  return null;
};

export const clearUserData = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('saleor-user');
  }
};

// Complete logout
export const logout = () => {
  clearAuthTokens();
  clearUserData();
  // Redirect to home page
  if (typeof window !== 'undefined') {
    window.location.href = '/';
  }
};

// Validation utilities
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): boolean => {
  // At least 8 characters long
  return password.length >= 8;
};

export const validateRequired = (value: string): boolean => {
  return value.trim().length > 0;
};