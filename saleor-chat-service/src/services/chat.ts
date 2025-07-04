import { v4 as uuidv4 } from 'uuid';
import { ChatSession, ChatMessage, ChatIntent, ChatContext, ConversationStage, SearchParams } from '../types';
import geminiService from './gemini';
import saleorService from './saleor';
import redisService from './redis';
import logger from '../utils/logger';

export class ChatService {
  async createSession(userId?: string): Promise<ChatSession> {
    const session: ChatSession = {
      id: uuidv4(),
      userId,
      isActive: true,
      createdAt: new Date(),
      lastMessageAt: new Date(),
      context: {
        conversationStage: ConversationStage.GREETING,
        cart: [],
        userPreferences: {},
      },
    };

    await redisService.saveSession(session);
    logger.info('Chat session created', { sessionId: session.id, userId });

    return session;
  }

  async getSession(sessionId: string): Promise<ChatSession | null> {
    return await redisService.getSession(sessionId);
  }

  async processMessage(sessionId: string, userMessage: string): Promise<ChatMessage> {
    try {
      // Get or create session
      let session = await redisService.getSession(sessionId);
      if (!session) {
        session = await this.createSession();
        logger.warn('Session not found, created new session', { 
          originalSessionId: sessionId, 
          newSessionId: session.id 
        });
      }

      // Create user message
      const userChatMessage: ChatMessage = {
        id: uuidv4(),
        sessionId: session.id,
        role: 'user',
        content: userMessage,
        timestamp: new Date(),
      };

      // Save user message
      await redisService.saveMessage(userChatMessage);

      // Build context for AI
      const context = await this.buildContext(session);

      // Process with Gemini
      const geminiResponse = await geminiService.processMessage({
        prompt: userMessage,
        context,
        sessionId: session.id,
      });

      // Execute any actions identified by AI
      const actionResults = await this.executeActions(geminiResponse.actions || [], session);

      // Generate AI response text
      let aiResponseText = geminiResponse.text;
      if (actionResults.length > 0) {
        aiResponseText = await this.enhanceResponseWithActionResults(
          geminiResponse.text,
          actionResults,
          geminiResponse.intent
        );
      }

      // Create AI response message
      const aiMessage: ChatMessage = {
        id: uuidv4(),
        sessionId: session.id,
        role: 'assistant',
        content: aiResponseText,
        timestamp: new Date(),
        metadata: {
          intent: geminiResponse.intent,
          entities: geminiResponse.entities,
          actions: geminiResponse.actions,
          confidence: geminiResponse.confidence,
        },
      };

      // Update session context
      await this.updateSessionContext(session, geminiResponse.intent, actionResults);

      // Save AI message
      await redisService.saveMessage(aiMessage);

      logger.info('Message processed successfully', {
        sessionId: session.id,
        intent: geminiResponse.intent,
        actionsExecuted: actionResults.length,
      });

      return aiMessage;
    } catch (error) {
      logger.error('Error processing message', { 
        error: error.message,
        sessionId,
        userMessage: userMessage.substring(0, 100),
      });

      // Return error message
      const errorMessage: ChatMessage = {
        id: uuidv4(),
        sessionId,
        role: 'assistant',
        content: 'I apologize, but I encountered an error processing your message. Please try again or contact support if the issue persists.',
        timestamp: new Date(),
        metadata: {
          intent: ChatIntent.GENERAL,
        },
      };

      await redisService.saveMessage(errorMessage);
      return errorMessage;
    }
  }

  async getMessageHistory(sessionId: string, limit = 50): Promise<ChatMessage[]> {
    return await redisService.getMessages(sessionId, limit);
  }

  private async buildContext(session: ChatSession): Promise<string> {
    const recentMessages = await redisService.getMessages(session.id, 10);
    const messageHistory = recentMessages
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');

    const context = {
      conversationStage: session.context.conversationStage,
      cartItems: session.context.cart?.length || 0,
      userPreferences: session.context.userPreferences,
      recentMessages: messageHistory,
    };

    return JSON.stringify(context, null, 2);
  }

  private async executeActions(actions: any[], session: ChatSession): Promise<any[]> {
    const results: any[] = [];

    for (const action of actions) {
      try {
        let result: any = null;

        switch (action.type) {
          case 'search_products':
            result = await this.searchProducts(action.parameters);
            break;

          case 'recommend_products':
            result = await this.recommendProducts(session, action.parameters);
            break;

          case 'add_to_cart':
            result = await this.addToCart(session, action.parameters);
            break;

          case 'modify_cart':
            result = await this.modifyCart(session, action.parameters);
            break;

          case 'checkout':
            result = await this.processCheckout(session, action.parameters);
            break;

          case 'get_order_status':
            result = await this.getOrderStatus(session, action.parameters);
            break;

          case 'show_menu':
            result = await this.showMenu(action.parameters);
            break;

          default:
            logger.warn('Unknown action type', { actionType: action.type });
        }

        if (result) {
          results.push({
            action: action.type,
            success: true,
            data: result,
          });
        }
      } catch (error) {
        logger.error('Action execution failed', {
          actionType: action.type,
          error: error.message,
          sessionId: session.id,
        });

        results.push({
          action: action.type,
          success: false,
          error: error.message,
        });
      }
    }

    return results;
  }

  private async searchProducts(parameters: any): Promise<any> {
    const searchParams: SearchParams = {
      query: parameters.query || '',
      category: parameters.category,
      minPrice: parameters.minPrice,
      maxPrice: parameters.maxPrice,
      dietary: parameters.dietary,
      limit: parameters.limit || 5,
    };

    const products = await saleorService.searchProducts(searchParams);
    return { products, count: products.length };
  }

  private async recommendProducts(session: ChatSession, parameters: any): Promise<any> {
    // Get popular products or products based on user preferences
    const searchParams: SearchParams = {
      query: '',
      limit: parameters.limit || 3,
    };

    // Apply user preferences if available
    if (session.context.userPreferences?.favoriteCategories?.length) {
      searchParams.category = session.context.userPreferences.favoriteCategories[0];
    }

    if (session.context.userPreferences?.dietary?.length) {
      searchParams.dietary = session.context.userPreferences.dietary;
    }

    const products = await saleorService.searchProducts(searchParams);
    const recommendation = await geminiService.generateProductRecommendation(
      products,
      session.context.userPreferences
    );

    return { products, recommendation };
  }

  private async addToCart(session: ChatSession, parameters: any): Promise<any> {
    // This would integrate with Saleor's checkout system
    // For now, we'll simulate adding to cart in session context
    const { productId, quantity = 1 } = parameters;
    
    const product = await saleorService.getProductById(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    if (!session.context.cart) {
      session.context.cart = [];
    }

    const existingItem = session.context.cart.find(item => item.productId === productId);
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      session.context.cart.push({
        id: uuidv4(),
        productId,
        productName: product.name,
        quantity,
        price: product.price,
      });
    }

    await redisService.saveSession(session);
    
    return {
      cart: session.context.cart,
      totalItems: session.context.cart.reduce((sum, item) => sum + item.quantity, 0),
      totalPrice: session.context.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
    };
  }

  private async modifyCart(session: ChatSession, parameters: any): Promise<any> {
    // Implement cart modification logic
    const { productId, quantity, action } = parameters;
    
    if (!session.context.cart) {
      session.context.cart = [];
    }

    const itemIndex = session.context.cart.findIndex(item => item.productId === productId);
    
    if (action === 'remove' || quantity === 0) {
      if (itemIndex >= 0) {
        session.context.cart.splice(itemIndex, 1);
      }
    } else if (itemIndex >= 0) {
      session.context.cart[itemIndex].quantity = quantity;
    }

    await redisService.saveSession(session);
    
    return {
      cart: session.context.cart,
      totalItems: session.context.cart.reduce((sum, item) => sum + item.quantity, 0),
      totalPrice: session.context.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
    };
  }

  private async processCheckout(session: ChatSession, parameters: any): Promise<any> {
    if (!session.context.cart || session.context.cart.length === 0) {
      throw new Error('Cart is empty');
    }

    // This would integrate with Saleor's checkout system
    // For now, we'll simulate the checkout process
    const totalPrice = session.context.cart.reduce(
      (sum, item) => sum + (item.price * item.quantity), 
      0
    );

    // Clear cart after successful checkout
    session.context.cart = [];
    session.context.conversationStage = ConversationStage.COMPLETED;
    await redisService.saveSession(session);

    return {
      orderId: uuidv4(),
      total: totalPrice,
      status: 'confirmed',
      estimatedDelivery: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
    };
  }

  private async getOrderStatus(session: ChatSession, parameters: any): Promise<any> {
    // This would query Saleor for actual order status
    // For now, return simulated status
    return {
      orderId: parameters.orderId || 'demo-order-123',
      status: 'preparing',
      estimatedDelivery: new Date(Date.now() + 20 * 60 * 1000),
      progress: [
        { step: 'Order confirmed', completed: true, time: new Date(Date.now() - 10 * 60 * 1000) },
        { step: 'Preparing food', completed: true, time: new Date(Date.now() - 5 * 60 * 1000) },
        { step: 'Out for delivery', completed: false, time: null },
        { step: 'Delivered', completed: false, time: null },
      ],
    };
  }

  private async showMenu(parameters: any): Promise<any> {
    const categories = await saleorService.getCategories();
    return { categories };
  }

  private async enhanceResponseWithActionResults(
    originalResponse: string,
    actionResults: any[],
    intent?: ChatIntent
  ): Promise<string> {
    // Find successful product search results
    const productSearchResults = actionResults.find(
      result => result.action === 'search_products' && result.success
    );

    if (productSearchResults && productSearchResults.data.products.length > 0) {
      const products = productSearchResults.data.products.slice(0, 3); // Show top 3
      const productList = products.map((product: any) => 
        `🍽️ **${product.name}** - $${product.price} (${product.category})\n   ${product.description.substring(0, 80)}...`
      ).join('\n\n');

      return `${originalResponse}\n\nHere are some options I found:\n\n${productList}\n\nWould you like to add any of these to your cart?`;
    }

    // Handle cart actions
    const cartResults = actionResults.find(
      result => (result.action === 'add_to_cart' || result.action === 'modify_cart') && result.success
    );

    if (cartResults) {
      const { totalItems, totalPrice } = cartResults.data;
      return `${originalResponse}\n\n🛒 **Cart Update**: ${totalItems} items, Total: $${totalPrice.toFixed(2)}`;
    }

    // Handle recommendations
    const recommendationResults = actionResults.find(
      result => result.action === 'recommend_products' && result.success
    );

    if (recommendationResults && recommendationResults.data.recommendation) {
      return recommendationResults.data.recommendation;
    }

    return originalResponse;
  }

  private async updateSessionContext(
    session: ChatSession,
    intent?: ChatIntent,
    actionResults?: any[]
  ): Promise<void> {
    // Update conversation stage based on intent
    if (intent) {
      switch (intent) {
        case ChatIntent.GREETING:
          session.context.conversationStage = ConversationStage.GREETING;
          break;
        case ChatIntent.PRODUCT_SEARCH:
        case ChatIntent.PRODUCT_RECOMMEND:
          session.context.conversationStage = ConversationStage.BROWSING;
          break;
        case ChatIntent.ORDER_NEW:
          session.context.conversationStage = ConversationStage.ORDERING;
          break;
        case ChatIntent.CART_VIEW:
        case ChatIntent.ORDER_MODIFY:
          session.context.conversationStage = ConversationStage.CART_MANAGEMENT;
          break;
        case ChatIntent.CART_CHECKOUT:
          session.context.conversationStage = ConversationStage.CHECKOUT;
          break;
        case ChatIntent.ORDER_STATUS:
          session.context.conversationStage = ConversationStage.ORDER_TRACKING;
          break;
      }
    }

    // Update last message timestamp
    session.lastMessageAt = new Date();

    // Save updated session
    await redisService.saveSession(session);
  }
}

export default new ChatService();