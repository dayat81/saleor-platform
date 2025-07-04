import { GoogleGenerativeAI } from '@google/generative-ai';
import config from '../config';
import { GeminiRequest, GeminiResponse, ChatIntent, ChatAction, Product } from '../types';
import logger from '../utils/logger';

export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    this.genAI = new GoogleGenerativeAI(config.geminiApiKey);
    this.model = this.genAI.getGenerativeModel({ model: config.geminiModel });
  }

  async processMessage(request: GeminiRequest): Promise<GeminiResponse> {
    try {
      const prompt = this.buildPrompt(request);
      
      logger.info('Sending request to Gemini API', { 
        sessionId: request.sessionId,
        promptLength: prompt.length 
      });

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      logger.info('Received response from Gemini API', { 
        sessionId: request.sessionId,
        responseLength: text.length 
      });

      // Parse the response to extract intent and entities
      const parsed = this.parseResponse(text, request);
      
      return {
        text: parsed.text,
        intent: parsed.intent,
        entities: parsed.entities,
        actions: parsed.actions,
        confidence: parsed.confidence
      };
    } catch (error) {
      logger.error('Error processing message with Gemini API', { 
        error: error.message,
        sessionId: request.sessionId 
      });
      
      // Return a helpful fallback response based on detected language
      const language = this.detectLanguage(request.prompt);
      const fallbackResponse = language === 'id' 
        ? 'Maaf, saya mengalami gangguan teknis. Bisakah Anda mengulangi pertanyaan Anda? Saya siap membantu Anda dengan pemesanan makanan.'
        : 'Sorry, I\'m experiencing technical difficulties. Could you please repeat your question? I\'m here to help you with your food order.';
      
      return {
        text: fallbackResponse,
        intent: ChatIntent.GENERAL,
        entities: {},
        actions: [],
        confidence: 0.5
      };
    }
  }

  private buildPrompt(request: GeminiRequest): string {
    // Detect language from user input
    const language = this.detectLanguage(request.prompt);
    const isIndonesian = language === 'id';
    const isBackoffice = request.context?.includes('backoffice') || request.sessionId?.includes('backoffice');
    
    const systemPrompt = isIndonesian ? this.buildIndonesianPrompt(request, isBackoffice) : this.buildEnglishPrompt(request, isBackoffice);
    return systemPrompt;
  }

  private detectLanguage(text: string): string {
    const indonesianWords = ['bisa', 'halo', 'terima', 'kasih', 'tolong', 'mau', 'ingin', 'pesan', 'makanan', 'minuman', 'selamat', 'bagaimana', 'dimana', 'kapan', 'berapa', 'apa', 'siapa', 'mengapa', 'bahasa', 'indonesia'];
    const textLower = text.toLowerCase();
    
    const indonesianMatches = indonesianWords.filter(word => textLower.includes(word)).length;
    
    // If more than 1 Indonesian word found, assume Indonesian
    return indonesianMatches > 0 ? 'id' : 'en';
  }

  private buildIndonesianPrompt(request: GeminiRequest, isBackoffice: boolean): string {
    if (isBackoffice) {
      return `Anda adalah asisten AI yang membantu untuk sistem backoffice restoran/F&B.
Anda dapat membantu dengan manajemen pesanan, inventori, analitik, dan operasional restoran.

INSTRUKSI PENTING:
1. Selalu merespons dalam bahasa Indonesia dengan nada ramah dan profesional
2. Bantu staff dengan informasi pesanan, status inventori, laporan penjualan, dan manajemen staff
3. Berikan informasi yang akurat dan berguna
4. Jika tidak bisa membantu, jelaskan dengan sopan dan tawarkan alternatif
5. Gunakan emoji yang sesuai untuk meningkatkan komunikasi

FUNGSI YANG TERSEDIA:
- Cek pesanan hari ini
- Status inventori dan stok
- Laporan penjualan dan analitik
- Manajemen staff dan jadwal
- Alert stok menipis
- Data pelanggan

KONTEKS: ${request.context || 'Percakapan baru'}

PESAN STAFF: ${request.prompt}

Mohon respon dengan membantu dan alami dalam bahasa Indonesia:`;
    } else {
      return `Anda adalah asisten pemesanan makanan yang membantu untuk platform delivery online.
Peran Anda adalah membantu pelanggan memesan makanan melalui percakapan alami.

INSTRUKSI PENTING:
1. Selalu merespons dalam bahasa Indonesia dengan nada ramah dan percakapan
2. Bantu pelanggan mencari produk, menambah item ke keranjang, dan menyelesaikan pesanan
3. Tanyakan pertanyaan klarifikasi jika diperlukan
4. Sarankan item pelengkap dengan tepat
5. Tangani pembatasan diet dan preferensi dengan hati-hati
6. Berikan informasi akurat tentang produk dan harga
7. Gunakan emoji makanan secukupnya untuk memperkaya percakapan
8. Jika tidak bisa membantu, jelaskan dengan sopan dan tawarkan alternatif

AKSI YANG TERSEDIA:
- search_products: Cari produk berdasarkan nama, kategori, atau kebutuhan diet
- add_to_cart: Tambah item ke keranjang pelanggan
- modify_cart: Update jumlah atau hapus item dari keranjang
- checkout: Proses pesanan
- get_order_status: Cek status pesanan yang ada
- show_menu: Tampilkan kategori menu yang tersedia
- recommend_products: Sarankan produk berdasarkan preferensi

FORMAT RESPONS:
Respond secara alami sebagai asisten yang membantu. Jika perlu melakukan aksi, sertakan dalam respons Anda.
Untuk rekomendasi produk, selalu sebutkan nama dan harga.
Untuk konfirmasi pesanan, ringkas item dan total biaya.

KONTEKS: ${request.context || 'Percakapan baru'}

PESAN PELANGGAN: ${request.prompt}

Mohon respon dengan membantu dan alami dalam bahasa Indonesia:`;
    }
  }

  private buildEnglishPrompt(request: GeminiRequest, isBackoffice: boolean): string {
    if (isBackoffice) {
      return `You are a helpful AI assistant for restaurant/F&B backoffice operations.
You can help with order management, inventory, analytics, and restaurant operations.

IMPORTANT INSTRUCTIONS:
1. Always respond in English with a friendly and professional tone
2. Help staff with order information, inventory status, sales reports, and staff management
3. Provide accurate and useful information
4. If you cannot help with something, politely explain and offer alternatives
5. Use appropriate emojis to enhance communication

AVAILABLE FUNCTIONS:
- Check today's orders
- Inventory and stock status
- Sales reports and analytics
- Staff management and scheduling
- Low stock alerts
- Customer data

CONTEXT: ${request.context || 'New conversation'}

STAFF MESSAGE: ${request.prompt}

Please respond helpfully and naturally:`;
    } else {
      return `You are a helpful F&B (Food & Beverage) ordering assistant for an online food delivery platform.
Your role is to help customers order food through natural conversation.

IMPORTANT INSTRUCTIONS:
1. Always respond in English with a friendly, conversational tone
2. Help customers find products, add items to cart, and complete orders
3. Ask clarifying questions when needed
4. Suggest complementary items appropriately
5. Handle dietary restrictions and preferences carefully
6. Provide accurate information about products and pricing
7. Use food emojis sparingly to enhance the conversation
8. If you cannot help with something, politely explain and offer alternatives

AVAILABLE ACTIONS:
- search_products: Search for products by name, category, or dietary requirements
- add_to_cart: Add items to the customer's cart
- modify_cart: Update quantities or remove items from cart
- checkout: Process the order
- get_order_status: Check the status of existing orders
- show_menu: Display available menu categories
- recommend_products: Suggest products based on preferences

RESPONSE FORMAT:
Respond naturally as a helpful assistant. If you need to perform actions, include them in your response.
For product recommendations, always mention the name and price.
For order confirmations, summarize the items and total cost.

CONTEXT: ${request.context || 'New conversation'}

CUSTOMER MESSAGE: ${request.prompt}

Please respond helpfully and naturally:`;
    }
  }

  private parseResponse(text: string, request: GeminiRequest): {
    text: string;
    intent: ChatIntent;
    entities: Record<string, any>;
    actions: ChatAction[];
    confidence: number;
  } {
    // Extract intent from the response
    const intent = this.extractIntent(text, request.prompt);
    
    // Extract entities (products, quantities, etc.)
    const entities = this.extractEntities(text, request.prompt);
    
    // Extract actions to perform
    const actions = this.extractActions(text, request.prompt, intent);
    
    // Clean up the response text
    const cleanText = this.cleanResponseText(text);
    
    return {
      text: cleanText,
      intent,
      entities,
      actions,
      confidence: 0.85 // Default confidence score
    };
  }

  private extractIntent(response: string, userMessage: string): ChatIntent {
    const message = userMessage.toLowerCase();
    const responseText = response.toLowerCase();
    
    // Order-related intents (English and Indonesian)
    if (message.includes('order') || message.includes('buy') || message.includes('purchase') ||
        message.includes('pesan') || message.includes('beli') || message.includes('mau')) {
      if (message.includes('status') || message.includes('track') || message.includes('where') ||
          message.includes('dimana') || message.includes('cek') || message.includes('lacak')) {
        return ChatIntent.ORDER_STATUS;
      }
      if (message.includes('cancel') || message.includes('delete') ||
          message.includes('batal') || message.includes('hapus')) {
        return ChatIntent.ORDER_CANCEL;
      }
      if (message.includes('change') || message.includes('modify') || message.includes('update') ||
          message.includes('ubah') || message.includes('ganti')) {
        return ChatIntent.ORDER_MODIFY;
      }
      return ChatIntent.ORDER_NEW;
    }
    
    // Product search intents (English and Indonesian)
    if (message.includes('search') || message.includes('find') || message.includes('show') || 
        message.includes('what') || message.includes('menu') || message.includes('available') ||
        message.includes('cari') || message.includes('tampilkan') || message.includes('lihat') ||
        message.includes('apa') || message.includes('ada')) {
      return ChatIntent.PRODUCT_SEARCH;
    }
    
    // Cart intents (English and Indonesian)
    if (message.includes('cart') || message.includes('basket') ||
        message.includes('keranjang') || message.includes('troli')) {
      if (message.includes('checkout') || message.includes('pay') || message.includes('buy') ||
          message.includes('bayar') || message.includes('beli')) {
        return ChatIntent.CART_CHECKOUT;
      }
      return ChatIntent.CART_VIEW;
    }
    
    // Recommendation intents (English and Indonesian)
    if (message.includes('recommend') || message.includes('suggest') || message.includes('popular') ||
        message.includes('rekomen') || message.includes('sarankan') || message.includes('populer') ||
        message.includes('favorit') || message.includes('terbaik')) {
      return ChatIntent.PRODUCT_RECOMMEND;
    }
    
    // Support intents (English and Indonesian)
    if (message.includes('help') || message.includes('problem') || message.includes('issue') ||
        message.includes('bantuan') || message.includes('tolong') || message.includes('masalah')) {
      return ChatIntent.SUPPORT;
    }
    
    // Complaint intents (English and Indonesian)
    if (message.includes('complaint') || message.includes('wrong') || message.includes('bad') ||
        message.includes('keluhan') || message.includes('salah') || message.includes('buruk') ||
        message.includes('jelek') || message.includes('komplain')) {
      return ChatIntent.COMPLAINT;
    }
    
    // Delivery intents (English and Indonesian)
    if (message.includes('deliver') || message.includes('address') || message.includes('time') ||
        message.includes('antar') || message.includes('alamat') || message.includes('waktu') ||
        message.includes('kirim') || message.includes('jam')) {
      return ChatIntent.DELIVERY_INFO;
    }
    
    // Greeting intents (English and Indonesian)
    if (message.includes('hello') || message.includes('hi') || message.includes('hey') ||
        message.includes('halo') || message.includes('hai') || message.includes('selamat') ||
        message.includes('salam')) {
      return ChatIntent.GREETING;
    }
    
    return ChatIntent.GENERAL;
  }

  private extractEntities(response: string, userMessage: string): Record<string, any> {
    const entities: Record<string, any> = {};
    
    // Extract quantities
    const quantityMatch = userMessage.match(/(\d+)\s*(piece|pieces|item|items|x)?/i);
    if (quantityMatch) {
      entities.quantity = parseInt(quantityMatch[1]);
    }
    
    // Extract price ranges
    const priceMatch = userMessage.match(/under\s*\$?(\d+)|below\s*\$?(\d+)|less\s*than\s*\$?(\d+)/i);
    if (priceMatch) {
      entities.maxPrice = parseInt(priceMatch[1] || priceMatch[2] || priceMatch[3]);
    }
    
    // Extract dietary preferences
    const dietaryKeywords = ['vegetarian', 'vegan', 'gluten-free', 'halal', 'kosher', 'dairy-free'];
    const dietaryMatches = dietaryKeywords.filter(keyword => 
      userMessage.toLowerCase().includes(keyword)
    );
    if (dietaryMatches.length > 0) {
      entities.dietary = dietaryMatches;
    }
    
    // Extract product categories
    const categoryKeywords = ['pizza', 'burger', 'pasta', 'salad', 'drink', 'dessert', 'appetizer'];
    const categoryMatches = categoryKeywords.filter(category => 
      userMessage.toLowerCase().includes(category)
    );
    if (categoryMatches.length > 0) {
      entities.categories = categoryMatches;
    }
    
    return entities;
  }

  private extractActions(response: string, userMessage: string, intent: ChatIntent): ChatAction[] {
    const actions: ChatAction[] = [];
    
    switch (intent) {
      case ChatIntent.PRODUCT_SEARCH:
        actions.push({
          type: 'search_products',
          parameters: {
            query: userMessage,
            limit: 5
          }
        });
        break;
        
      case ChatIntent.PRODUCT_RECOMMEND:
        actions.push({
          type: 'recommend_products',
          parameters: {
            limit: 3
          }
        });
        break;
        
      case ChatIntent.CART_VIEW:
        actions.push({
          type: 'show_menu',
          parameters: {}
        });
        break;
        
      case ChatIntent.ORDER_STATUS:
        actions.push({
          type: 'get_order_status',
          parameters: {}
        });
        break;
    }
    
    return actions;
  }

  private cleanResponseText(text: string): string {
    // Remove any system prompts or formatting that might have leaked through
    return text.trim();
  }

  // Helper method to generate product recommendations
  async generateProductRecommendation(products: Product[], userPreferences?: any): Promise<string> {
    const productsText = products.map(p => 
      `${p.name} - $${p.price} (${p.category})`
    ).join('\n');
    
    const prompt = `Based on these available products, provide a helpful recommendation:

${productsText}

User preferences: ${JSON.stringify(userPreferences || {})}

Provide a natural, conversational recommendation mentioning 2-3 products with prices and why they're good choices:`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      logger.error('Error generating product recommendation', { error: error.message });
      return 'I\'d be happy to help you choose from our menu. What type of food are you in the mood for?';
    }
  }
}

export default new GeminiService();