import { gql } from '@apollo/client';

export const REGISTER_MUTATION = gql`
  mutation AccountRegister($input: AccountRegisterInput!) {
    accountRegister(input: $input) {
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

export const LOGIN_MUTATION = gql`
  mutation TokenCreate($email: String!, $password: String!) {
    tokenCreate(email: $email, password: $password) {
      token
      refreshToken
      user {
        id
        email
        firstName
        lastName
        isStaff
      }
      errors {
        field
        message
        code
      }
    }
  }
`;

export const REFRESH_TOKEN_MUTATION = gql`
  mutation TokenRefresh($refreshToken: String!) {
    tokenRefresh(refreshToken: $refreshToken) {
      token
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

export const REQUEST_PASSWORD_RESET_MUTATION = gql`
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

export const SET_PASSWORD_MUTATION = gql`
  mutation SetPassword($token: String!, $password: String!) {
    setPassword(token: $token, password: $password) {
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

export const CURRENT_USER_QUERY = gql`
  query CurrentUser {
    me {
      id
      email
      firstName
      lastName
      isActive
      isStaff
      dateJoined
      lastLogin
      avatar {
        url
        alt
      }
      addresses {
        id
        firstName
        lastName
        companyName
        streetAddress1
        streetAddress2
        city
        cityArea
        postalCode
        country {
          code
          country
        }
        countryArea
        phone
        isDefaultBillingAddress
        isDefaultShippingAddress
      }
    }
  }
`;

export const ACCOUNT_UPDATE_MUTATION = gql`
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

export const VERIFY_EMAIL_MUTATION = gql`
  mutation ConfirmAccount($token: String!) {
    confirmAccount(token: $token) {
      user {
        id
        email
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

// Social auth specific mutation for creating/linking accounts
export const SOCIAL_AUTH_MUTATION = gql`
  mutation SocialAuth($provider: String!, $accessToken: String!, $email: String!, $firstName: String, $lastName: String) {
    externalAuthenticationUrl(
      pluginId: "saleor.plugins.oidc"
      input: {
        provider: $provider
        accessToken: $accessToken
        email: $email
        firstName: $firstName
        lastName: $lastName
      }
    ) {
      authenticationData
      errors {
        field
        message
        code
      }
    }
  }
`;

// Check if user exists by email
export const CHECK_USER_EXISTS_QUERY = gql`
  query CheckUserExists($email: String!) {
    customers(first: 1, filter: { search: $email }) {
      edges {
        node {
          id
          email
          firstName
          lastName
        }
      }
    }
  }
`;