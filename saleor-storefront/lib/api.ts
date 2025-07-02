import { getAuthToken } from './auth';
import {
  LOGIN_MUTATION,
  REGISTER_MUTATION,
  REFRESH_TOKEN_MUTATION,
  PASSWORD_RESET_MUTATION,
  PASSWORD_CHANGE_MUTATION,
  CONFIRM_ACCOUNT_MUTATION,
  GET_USER_QUERY,
  UPDATE_ACCOUNT_MUTATION,
} from './graphql';

const SALEOR_API_URL = process.env.NEXT_PUBLIC_SALEOR_API_URL || 'http://localhost:8000/graphql/';

interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{
    message: string;
    locations?: Array<{ line: number; column: number }>;
    path?: string[];
  }>;
}

interface GraphQLError {
  field?: string;
  message: string;
  code?: string;
}

export class ApiError extends Error {
  constructor(public errors: GraphQLError[]) {
    super(errors.map(e => e.message).join(', '));
    this.name = 'ApiError';
  }
}

async function makeGraphQLRequest<T>(
  query: string,
  variables?: Record<string, any>,
  requiresAuth = false
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (requiresAuth) {
    const token = getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  try {
    const response = await fetch(SALEOR_API_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: GraphQLResponse<T> = await response.json();

    if (result.errors) {
      throw new Error(result.errors.map(e => e.message).join(', '));
    }

    if (!result.data) {
      throw new Error('No data returned from API');
    }

    return result.data;
  } catch (error) {
    console.error('GraphQL request failed:', error);
    throw error;
  }
}

// Authentication API functions
export async function loginUser(email: string, password: string) {
  const response = await makeGraphQLRequest<{
    tokenCreate: {
      token?: string;
      refreshToken?: string;
      user?: any;
      errors: GraphQLError[];
    };
  }>(LOGIN_MUTATION, { email, password });

  if (response.tokenCreate.errors.length > 0) {
    throw new ApiError(response.tokenCreate.errors);
  }

  return response.tokenCreate;
}

export async function registerUser(input: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}) {
  const response = await makeGraphQLRequest<{
    accountRegister: {
      user?: any;
      errors: GraphQLError[];
      requiresConfirmation?: boolean;
    };
  }>(REGISTER_MUTATION, { input });

  if (response.accountRegister.errors.length > 0) {
    throw new ApiError(response.accountRegister.errors);
  }

  return response.accountRegister;
}

export async function refreshToken(refreshToken: string) {
  const response = await makeGraphQLRequest<{
    tokenRefresh: {
      token?: string;
      user?: any;
      errors: GraphQLError[];
    };
  }>(REFRESH_TOKEN_MUTATION, { refreshToken });

  if (response.tokenRefresh.errors.length > 0) {
    throw new ApiError(response.tokenRefresh.errors);
  }

  return response.tokenRefresh;
}

export async function requestPasswordReset(email: string, redirectUrl: string) {
  const response = await makeGraphQLRequest<{
    requestPasswordReset: {
      errors: GraphQLError[];
    };
  }>(PASSWORD_RESET_MUTATION, { email, redirectUrl });

  if (response.requestPasswordReset.errors.length > 0) {
    throw new ApiError(response.requestPasswordReset.errors);
  }

  return response.requestPasswordReset;
}

export async function changePassword(oldPassword: string, newPassword: string) {
  const response = await makeGraphQLRequest<{
    passwordChange: {
      user?: any;
      errors: GraphQLError[];
    };
  }>(PASSWORD_CHANGE_MUTATION, { oldPassword, newPassword }, true);

  if (response.passwordChange.errors.length > 0) {
    throw new ApiError(response.passwordChange.errors);
  }

  return response.passwordChange;
}

export async function confirmAccount(email: string, token: string) {
  const response = await makeGraphQLRequest<{
    confirmAccount: {
      user?: any;
      errors: GraphQLError[];
    };
  }>(CONFIRM_ACCOUNT_MUTATION, { email, token });

  if (response.confirmAccount.errors.length > 0) {
    throw new ApiError(response.confirmAccount.errors);
  }

  return response.confirmAccount;
}

export async function getCurrentUser() {
  const response = await makeGraphQLRequest<{
    me: any;
  }>(GET_USER_QUERY, {}, true);

  return response.me;
}

export async function updateAccount(input: {
  firstName?: string;
  lastName?: string;
  email?: string;
}) {
  const response = await makeGraphQLRequest<{
    accountUpdate: {
      user?: any;
      errors: GraphQLError[];
    };
  }>(UPDATE_ACCOUNT_MUTATION, { input }, true);

  if (response.accountUpdate.errors.length > 0) {
    throw new ApiError(response.accountUpdate.errors);
  }

  return response.accountUpdate;
}