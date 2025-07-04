import { gql } from '@apollo/client'

export const TOKEN_AUTH_MUTATION = gql`
  mutation TokenAuth($email: String!, $password: String!) {
    tokenCreate(email: $email, password: $password) {
      token
      refreshToken
      csrfToken
      user {
        id
        email
        firstName
        lastName
        isStaff
        isActive
        userPermissions {
          code
          name
        }
      }
      errors {
        field
        message
        code
      }
    }
  }
`

export const TOKEN_REFRESH_MUTATION = gql`
  mutation TokenRefresh($refreshToken: String!) {
    tokenRefresh(refreshToken: $refreshToken) {
      token
      errors {
        field
        message
        code
      }
    }
  }
`

export const TOKEN_VERIFY_MUTATION = gql`
  mutation TokenVerify($token: String!) {
    tokenVerify(token: $token) {
      isValid
      payload
      user {
        id
        email
        firstName
        lastName
        isStaff
        isActive
        userPermissions {
          code
          name
        }
      }
      errors {
        field
        message
        code
      }
    }
  }
`

export const USER_QUERY = gql`
  query User {
    me {
      id
      email
      firstName
      lastName
      isStaff
      isActive
      userPermissions {
        code
        name
      }
    }
  }
`

export const LOGOUT_MUTATION = gql`
  mutation Logout {
    tokensDeactivateAll {
      errors {
        field
        message
        code
      }
    }
  }
`