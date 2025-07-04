import { gql } from '@apollo/client'

export const CUSTOMERS_QUERY = gql`
  query Customers($first: Int, $after: String, $filter: CustomerFilterInput) {
    customers(first: $first, after: $after, filter: $filter) {
      edges {
        node {
          id
          email
          firstName
          lastName
          isActive
          dateJoined
          lastLogin
          defaultShippingAddress {
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
            phone
          }
          defaultBillingAddress {
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
            phone
          }
          orders {
            totalCount
          }
          note
          languageCode
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      totalCount
    }
  }
`

export const CUSTOMER_QUERY = gql`
  query Customer($id: ID!) {
    user(id: $id) {
      id
      email
      firstName
      lastName
      isActive
      dateJoined
      lastLogin
      defaultShippingAddress {
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
        phone
      }
      defaultBillingAddress {
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
        phone
      }
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
        phone
      }
      orders {
        edges {
          node {
            id
            number
            status
            created
            total {
              gross {
                amount
                currency
              }
            }
            lines {
              id
              quantity
              variant {
                product {
                  name
                }
                name
              }
            }
          }
        }
        totalCount
      }
      note
      languageCode
    }
  }
`

export const CUSTOMER_ORDERS_QUERY = gql`
  query CustomerOrders($customerId: ID!, $first: Int, $after: String) {
    orders(first: $first, after: $after, filter: { customer: $customerId }) {
      edges {
        node {
          id
          number
          status
          created
          updatedAt
          total {
            gross {
              amount
              currency
            }
          }
          subtotal {
            gross {
              amount
              currency
            }
          }
          shippingPrice {
            gross {
              amount
              currency
            }
          }
          lines {
            id
            quantity
            variant {
              id
              name
              sku
              product {
                id
                name
                thumbnail {
                  url
                  alt
                }
              }
            }
            totalPrice {
              gross {
                amount
                currency
              }
            }
          }
          shippingAddress {
            firstName
            lastName
            streetAddress1
            city
            postalCode
            country {
              code
              country
            }
          }
          billingAddress {
            firstName
            lastName
            streetAddress1
            city
            postalCode
            country {
              code
              country
            }
          }
          fulfillments {
            id
            status
            trackingNumber
            created
          }
          payments {
            id
            gateway
            isActive
            total {
              amount
              currency
            }
            capturedAmount {
              amount
              currency
            }
            chargeStatus
          }
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      totalCount
    }
  }
`

export const CREATE_CUSTOMER_MUTATION = gql`
  mutation CreateCustomer($input: UserCreateInput!) {
    customerCreate(input: $input) {
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
`

export const UPDATE_CUSTOMER_MUTATION = gql`
  mutation UpdateCustomer($id: ID!, $input: CustomerInput!) {
    customerUpdate(id: $id, input: $input) {
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
`

export const DELETE_CUSTOMER_MUTATION = gql`
  mutation DeleteCustomer($id: ID!) {
    customerDelete(id: $id) {
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
`