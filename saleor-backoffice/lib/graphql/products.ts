import { gql } from '@apollo/client'

export const PRODUCTS_QUERY = gql`
  query Products($first: Int, $after: String, $filter: ProductFilterInput) {
    products(first: $first, after: $after, filter: $filter) {
      edges {
        node {
          id
          name
          slug
          description
          category {
            id
            name
          }
          productType {
            id
            name
          }
          thumbnail {
            url
            alt
          }
          defaultVariant {
            id
            name
            sku
            pricing {
              price {
                gross {
                  amount
                  currency
                }
              }
            }
            quantityAvailable
          }
          variants {
            id
            name
            sku
            pricing {
              price {
                gross {
                  amount
                  currency
                }
              }
            }
            quantityAvailable
          }
          isAvailable
          isPublished
          visibleInListings
          availableForPurchase
          created
          updatedAt
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

export const PRODUCT_QUERY = gql`
  query Product($id: ID!) {
    product(id: $id) {
      id
      name
      slug
      description
      category {
        id
        name
      }
      productType {
        id
        name
      }
      media {
        url
        alt
        type
      }
      variants {
        id
        name
        sku
        pricing {
          price {
            gross {
              amount
              currency
            }
          }
        }
        quantityAvailable
        attributes {
          attribute {
            id
            name
          }
          values {
            id
            name
            value
          }
        }
      }
      attributes {
        attribute {
          id
          name
        }
        values {
          id
          name
          value
        }
      }
      isAvailable
      isPublished
      visibleInListings
      availableForPurchase
      weight {
        unit
        value
      }
      rating
      created
      updatedAt
    }
  }
`

export const CATEGORIES_QUERY = gql`
  query Categories($first: Int) {
    categories(first: $first) {
      edges {
        node {
          id
          name
          slug
          description
          parent {
            id
            name
          }
          children {
            totalCount
          }
          products {
            totalCount
          }
        }
      }
      totalCount
    }
  }
`

export const PRODUCT_TYPES_QUERY = gql`
  query ProductTypes($first: Int) {
    productTypes(first: $first) {
      edges {
        node {
          id
          name
          slug
          hasVariants
          isShippingRequired
          isDigital
          weight {
            unit
            value
          }
          productAttributes {
            id
            name
            type
            unit
          }
          variantAttributes {
            id
            name
            type
            unit
          }
        }
      }
      totalCount
    }
  }
`

export const CREATE_PRODUCT_MUTATION = gql`
  mutation CreateProduct($input: ProductCreateInput!) {
    productCreate(input: $input) {
      product {
        id
        name
        slug
      }
      errors {
        field
        message
        code
      }
    }
  }
`

export const UPDATE_PRODUCT_MUTATION = gql`
  mutation UpdateProduct($id: ID!, $input: ProductInput!) {
    productUpdate(id: $id, input: $input) {
      product {
        id
        name
        slug
      }
      errors {
        field
        message
        code
      }
    }
  }
`

export const DELETE_PRODUCT_MUTATION = gql`
  mutation DeleteProduct($id: ID!) {
    productDelete(id: $id) {
      product {
        id
        name
      }
      errors {
        field
        message
        code
      }
    }
  }
`