import { ApolloClient, InMemoryCache, gql, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import config from '../config';
import { Product, SearchParams, CartItem, Order } from '../types';
import logger from '../utils/logger';

// GraphQL queries and mutations
const GET_PRODUCTS = gql`
  query GetProducts($filter: ProductFilterInput, $first: Int = 10) {
    products(first: $first, filter: $filter) {
      edges {
        node {
          id
          name
          description
          thumbnail {
            url
          }
          pricing {
            priceRange {
              start {
                gross {
                  amount
                  currency
                }
              }
            }
          }
          category {
            id
            name
            slug
          }
          attributes {
            attribute {
              id
              name
              slug
            }
            values {
              id
              name
              slug
            }
          }
          isAvailable
          quantityAvailable
        }
      }
    }
  }
`;

const GET_PRODUCT_BY_ID = gql`
  query GetProductById($id: ID!) {
    product(id: $id) {
      id
      name
      description
      thumbnail {
        url
      }
      pricing {
        priceRange {
          start {
            gross {
              amount
              currency
            }
          }
        }
      }
      category {
        id
        name
        slug
      }
      attributes {
        attribute {
          id
          name
          slug
        }
        values {
          id
          name
          slug
        }
      }
      isAvailable
      quantityAvailable
    }
  }
`;

const GET_CATEGORIES = gql`
  query GetCategories {
    categories(first: 20) {
      edges {
        node {
          id
          name
          slug
          children(first: 10) {
            edges {
              node {
                id
                name
                slug
              }
            }
          }
        }
      }
    }
  }
`;

const CREATE_CHECKOUT = gql`
  mutation CreateCheckout($input: CheckoutCreateInput!) {
    checkoutCreate(input: $input) {
      checkout {
        id
        token
        lines {
          id
          quantity
          variant {
            id
            product {
              id
              name
            }
            pricing {
              price {
                gross {
                  amount
                  currency
                }
              }
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
      errors {
        field
        message
      }
    }
  }
`;

const ADD_TO_CART = gql`
  mutation AddToCart($checkoutId: ID!, $lines: [CheckoutLineInput!]!) {
    checkoutLinesAdd(checkoutId: $checkoutId, lines: $lines) {
      checkout {
        id
        token
        lines {
          id
          quantity
          variant {
            id
            product {
              id
              name
            }
            pricing {
              price {
                gross {
                  amount
                  currency
                }
              }
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
      errors {
        field
        message
      }
    }
  }
`;

const COMPLETE_CHECKOUT = gql`
  mutation CompleteCheckout($checkoutId: ID!) {
    checkoutComplete(checkoutId: $checkoutId) {
      order {
        id
        number
        status
        total {
          gross {
            amount
            currency
          }
        }
        created
        lines {
          id
          quantity
          variant {
            product {
              name
            }
            pricing {
              price {
                gross {
                  amount
                  currency
                }
              }
            }
          }
        }
      }
      errors {
        field
        message
      }
    }
  }
`;

const GET_ORDER_BY_ID = gql`
  query GetOrderById($id: ID!) {
    order(id: $id) {
      id
      number
      status
      total {
        gross {
          amount
          currency
        }
      }
      created
      lines {
        id
        quantity
        variant {
          product {
            name
          }
          pricing {
            price {
              gross {
                amount
                currency
              }
            }
          }
        }
      }
    }
  }
`;

export class SaleorService {
  private client: ApolloClient<any>;

  constructor() {
    const httpLink = createHttpLink({
      uri: config.saleorApiUrl,
    });

    const authLink = setContext((_, { headers }) => {
      return {
        headers: {
          ...headers,
          authorization: config.saleorAuthToken ? `Bearer ${config.saleorAuthToken}` : '',
          'Content-Type': 'application/json',
        },
      };
    });

    this.client = new ApolloClient({
      link: authLink.concat(httpLink),
      cache: new InMemoryCache(),
      defaultOptions: {
        watchQuery: {
          errorPolicy: 'all',
        },
        query: {
          errorPolicy: 'all',
        },
      },
    });
  }

  async searchProducts(params: SearchParams): Promise<Product[]> {
    try {
      logger.info('Searching products', { params });

      const filter: any = {};
      
      if (params.query) {
        filter.search = params.query;
      }
      
      if (params.category) {
        filter.categories = [params.category];
      }
      
      if (params.minPrice || params.maxPrice) {
        filter.price = {};
        if (params.minPrice) filter.price.gte = params.minPrice;
        if (params.maxPrice) filter.price.lte = params.maxPrice;
      }
      
      if (params.attributes) {
        filter.attributes = Object.entries(params.attributes).map(([key, value]) => ({
          slug: key,
          values: Array.isArray(value) ? value : [value],
        }));
      }

      const { data } = await this.client.query({
        query: GET_PRODUCTS,
        variables: {
          filter,
          first: params.limit || 10,
        },
      });

      const products = data.products.edges.map((edge: any) => this.mapProductFromSaleor(edge.node));
      
      logger.info('Products found', { count: products.length });
      return products;
    } catch (error) {
      logger.error('Error searching products', { error: error.message, params });
      throw new Error(`Failed to search products: ${error.message}`);
    }
  }

  async getProductById(id: string): Promise<Product | null> {
    try {
      const { data } = await this.client.query({
        query: GET_PRODUCT_BY_ID,
        variables: { id },
      });

      return data.product ? this.mapProductFromSaleor(data.product) : null;
    } catch (error) {
      logger.error('Error getting product by ID', { error: error.message, id });
      return null;
    }
  }

  async getCategories(): Promise<any[]> {
    try {
      const { data } = await this.client.query({
        query: GET_CATEGORIES,
      });

      return data.categories.edges.map((edge: any) => ({
        id: edge.node.id,
        name: edge.node.name,
        slug: edge.node.slug,
        children: edge.node.children.edges.map((child: any) => ({
          id: child.node.id,
          name: child.node.name,
          slug: child.node.slug,
        })),
      }));
    } catch (error) {
      logger.error('Error getting categories', { error: error.message });
      throw new Error(`Failed to get categories: ${error.message}`);
    }
  }

  async createCheckout(lines: any[]): Promise<any> {
    try {
      const { data } = await this.client.mutate({
        mutation: CREATE_CHECKOUT,
        variables: {
          input: {
            lines,
          },
        },
      });

      if (data.checkoutCreate.errors.length > 0) {
        throw new Error(data.checkoutCreate.errors[0].message);
      }

      return data.checkoutCreate.checkout;
    } catch (error) {
      logger.error('Error creating checkout', { error: error.message });
      throw new Error(`Failed to create checkout: ${error.message}`);
    }
  }

  async addToCart(checkoutId: string, lines: any[]): Promise<any> {
    try {
      const { data } = await this.client.mutate({
        mutation: ADD_TO_CART,
        variables: {
          checkoutId,
          lines,
        },
      });

      if (data.checkoutLinesAdd.errors.length > 0) {
        throw new Error(data.checkoutLinesAdd.errors[0].message);
      }

      return data.checkoutLinesAdd.checkout;
    } catch (error) {
      logger.error('Error adding to cart', { error: error.message });
      throw new Error(`Failed to add to cart: ${error.message}`);
    }
  }

  async completeCheckout(checkoutId: string): Promise<Order> {
    try {
      const { data } = await this.client.mutate({
        mutation: COMPLETE_CHECKOUT,
        variables: {
          checkoutId,
        },
      });

      if (data.checkoutComplete.errors.length > 0) {
        throw new Error(data.checkoutComplete.errors[0].message);
      }

      return this.mapOrderFromSaleor(data.checkoutComplete.order);
    } catch (error) {
      logger.error('Error completing checkout', { error: error.message });
      throw new Error(`Failed to complete checkout: ${error.message}`);
    }
  }

  async getOrderById(id: string): Promise<Order | null> {
    try {
      const { data } = await this.client.query({
        query: GET_ORDER_BY_ID,
        variables: { id },
      });

      return data.order ? this.mapOrderFromSaleor(data.order) : null;
    } catch (error) {
      logger.error('Error getting order by ID', { error: error.message, id });
      return null;
    }
  }

  private mapProductFromSaleor(saleorProduct: any): Product {
    return {
      id: saleorProduct.id,
      name: saleorProduct.name,
      description: saleorProduct.description || '',
      price: saleorProduct.pricing?.priceRange?.start?.gross?.amount || 0,
      currency: saleorProduct.pricing?.priceRange?.start?.gross?.currency || 'USD',
      category: saleorProduct.category?.name || 'Other',
      thumbnail: saleorProduct.thumbnail?.url || '',
      attributes: saleorProduct.attributes?.map((attr: any) => ({
        name: attr.attribute.name,
        value: attr.values.map((v: any) => v.name).join(', '),
        slug: attr.attribute.slug,
      })) || [],
      isAvailable: saleorProduct.isAvailable,
      quantityAvailable: saleorProduct.quantityAvailable,
    };
  }

  private mapOrderFromSaleor(saleorOrder: any): Order {
    return {
      id: saleorOrder.id,
      number: saleorOrder.number,
      status: saleorOrder.status,
      total: saleorOrder.total?.gross?.amount || 0,
      createdAt: new Date(saleorOrder.created),
      items: saleorOrder.lines?.map((line: any) => ({
        id: line.id,
        productId: line.variant?.product?.id || '',
        productName: line.variant?.product?.name || '',
        quantity: line.quantity,
        price: line.variant?.pricing?.price?.gross?.amount || 0,
        modifiers: {},
      })) || [],
    };
  }
}

export default new SaleorService();