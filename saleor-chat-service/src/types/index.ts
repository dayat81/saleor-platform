// Core chat message types
export interface ChatMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    intent?: ChatIntent;
    entities?: Record<string, any>;
    products?: Product[];
    actions?: ChatAction[];
    confidence?: number;
  };
}

// Chat session management
export interface ChatSession {
  id: string;
  userId?: string;
  isActive: boolean;
  createdAt: Date;
  lastMessageAt: Date;
  context: ChatContext;
  metadata?: Record<string, any>;
}

// Chat context for conversation state
export interface ChatContext {
  currentIntent?: ChatIntent;
  cart?: CartItem[];
  userPreferences?: UserPreferences;
  orderHistory?: Order[];
  lastProducts?: Product[];
  conversationStage?: ConversationStage;
}

// Intent classification
export enum ChatIntent {
  GREETING = 'greeting',
  ORDER_NEW = 'order_new',
  ORDER_MODIFY = 'order_modify',
  ORDER_STATUS = 'order_status',
  ORDER_CANCEL = 'order_cancel',
  PRODUCT_SEARCH = 'product_search',
  PRODUCT_INFO = 'product_info',
  PRODUCT_RECOMMEND = 'product_recommend',
  CART_VIEW = 'cart_view',
  CART_CHECKOUT = 'cart_checkout',
  DELIVERY_INFO = 'delivery_info',
  SUPPORT = 'support',
  COMPLAINT = 'complaint',
  GENERAL = 'general'
}

// Conversation stages
export enum ConversationStage {
  GREETING = 'greeting',
  BROWSING = 'browsing',
  ORDERING = 'ordering',
  CART_MANAGEMENT = 'cart_management',
  CHECKOUT = 'checkout',
  ORDER_TRACKING = 'order_tracking',
  SUPPORT = 'support',
  COMPLETED = 'completed'
}

// Chat actions that can be performed
export interface ChatAction {
  type: 'search_products' | 'add_to_cart' | 'modify_cart' | 'checkout' | 'get_order_status' | 'show_menu' | 'recommend_products';
  parameters: Record<string, any>;
}

// Product information
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  thumbnail?: string;
  attributes?: ProductAttribute[];
  isAvailable: boolean;
  quantityAvailable?: number;
}

export interface ProductAttribute {
  name: string;
  value: string;
  slug: string;
}

// Cart and order management
export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  modifiers?: Record<string, any>;
}

export interface Order {
  id: string;
  number: string;
  status: string;
  total: number;
  createdAt: Date;
  items: CartItem[];
}

// User preferences
export interface UserPreferences {
  dietaryRestrictions?: string[];
  favoriteCategories?: string[];
  priceRange?: {
    min?: number;
    max?: number;
  };
  deliveryAddress?: string;
  preferredDeliveryTime?: string;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Gemini API types
export interface GeminiRequest {
  prompt: string;
  context?: string;
  sessionId: string;
}

export interface GeminiResponse {
  text: string;
  intent?: ChatIntent;
  entities?: Record<string, any>;
  actions?: ChatAction[];
  confidence?: number;
}

// WebSocket message types
export interface WebSocketMessage {
  type: 'message' | 'typing' | 'error' | 'system';
  data: any;
  timestamp: Date;
}

// Search parameters
export interface SearchParams {
  query: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  dietary?: string[];
  attributes?: Record<string, any>;
  limit?: number;
}

// Configuration types
export interface Config {
  port: number;
  nodeEnv: string;
  geminiApiKey: string;
  geminiModel: string;
  saleorApiUrl: string;
  saleorAuthToken: string;
  redisUrl: string;
  jwtSecret: string;
  corsOrigin: string[];
  logLevel: string;
  logFile: string;
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
}