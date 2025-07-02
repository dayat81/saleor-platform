// GraphQL queries and mutations for authentication

export const LOGIN_MUTATION = `
  mutation TokenCreate($email: String!, $password: String!) {
    tokenCreate(email: $email, password: $password) {
      token
      refreshToken
      user {
        id
        email
        firstName
        lastName
        isActive
        dateJoined
        lastLogin
      }
      errors {
        field
        message
        code
      }
    }
  }
`;

export const REGISTER_MUTATION = `
  mutation AccountRegister($input: AccountRegisterInput!) {
    accountRegister(input: $input) {
      user {
        id
        email
        firstName
        lastName
        isActive
        dateJoined
      }
      errors {
        field
        message
        code
      }
      requiresConfirmation
    }
  }
`;

export const REFRESH_TOKEN_MUTATION = `
  mutation TokenRefresh($refreshToken: String!) {
    tokenRefresh(refreshToken: $refreshToken) {
      token
      user {
        id
        email
        firstName
        lastName
        isActive
        dateJoined
        lastLogin
      }
      errors {
        field
        message
        code
      }
    }
  }
`;

export const PASSWORD_RESET_MUTATION = `
  mutation RequestPasswordReset($email: String!, $redirectUrl: String!) {
    requestPasswordReset(email: $email, redirectUrl: $redirectUrl) {
      errors {
        field
        message
        code
      }
    }
  }
`;

export const PASSWORD_CHANGE_MUTATION = `
  mutation PasswordChange($oldPassword: String!, $newPassword: String!) {
    passwordChange(oldPassword: $oldPassword, newPassword: $newPassword) {
      user {
        id
        email
        firstName
        lastName
      }
      errors {
        field
        message
        code
      }
    }
  }
`;

export const CONFIRM_ACCOUNT_MUTATION = `
  mutation ConfirmAccount($email: String!, $token: String!) {
    confirmAccount(email: $email, token: $token) {
      user {
        id
        email
        firstName
        lastName
        isActive
      }
      errors {
        field
        message
        code
      }
    }
  }
`;

export const GET_USER_QUERY = `
  query Me {
    me {
      id
      email
      firstName
      lastName
      isActive
      dateJoined
      lastLogin
      addresses {
        id
        firstName
        lastName
        streetAddress1
        streetAddress2
        city
        postalCode
        country {
          code
          country
        }
      }
    }
  }
`;

export const UPDATE_ACCOUNT_MUTATION = `
  mutation AccountUpdate($input: AccountInput!) {
    accountUpdate(input: $input) {
      user {
        id
        email
        firstName
        lastName
      }
      errors {
        field
        message
        code
      }
    }
  }
`;

export const ACCOUNT_DELETE_MUTATION = `
  mutation AccountDelete($token: String!) {
    accountDelete(token: $token) {
      user {
        id
        email
      }
      errors {
        field
        message
        code
      }
    }
  }
`;

export const REQUEST_ACCOUNT_DELETE_MUTATION = `
  mutation AccountRequestDeletion($redirectUrl: String!) {
    accountRequestDeletion(redirectUrl: $redirectUrl) {
      errors {
        field
        message
        code
      }
    }
  }
`;