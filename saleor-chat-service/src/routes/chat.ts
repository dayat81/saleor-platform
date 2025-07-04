import { Router } from 'express';
import Joi from 'joi';
import chatService from '../services/chat';
import redisService from '../services/redis';
import logger from '../utils/logger';
import { ApiResponse } from '../types';

const router = Router();

// Helper function to detect Indonesian language
function detectIndonesian(text: string): boolean {
  if (!text) return false;
  const indonesianWords = ['bisa', 'halo', 'terima', 'kasih', 'tolong', 'mau', 'ingin', 'pesan', 'makanan', 'minuman', 'selamat', 'bagaimana', 'dimana', 'kapan', 'berapa', 'apa', 'siapa', 'mengapa', 'bahasa', 'indonesia', 'saya', 'anda', 'dengan', 'untuk', 'dari', 'yang', 'ini', 'itu'];
  const textLower = text.toLowerCase();
  return indonesianWords.some(word => textLower.includes(word));
}

// Validation schemas
const messageSchema = Joi.object({
  message: Joi.string().required().min(1).max(1000),
  sessionId: Joi.string().optional(),
  userId: Joi.string().optional(),
});

const sessionSchema = Joi.object({
  userId: Joi.string().optional(),
});

// Create new chat session
router.post('/session/start', async (req, res) => {
  try {
    const { error, value } = sessionSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: error.details[0].message,
      } as ApiResponse);
    }

    const session = await chatService.createSession(value.userId);
    
    logger.info('New chat session created via API', { 
      sessionId: session.id,
      userId: value.userId 
    });

    // Detect if this is a backoffice session based on referer or user agent
    const isBackoffice = req.headers.referer?.includes('backoffice') || req.headers['user-agent']?.includes('backoffice');
    
    const welcomeMessage = isBackoffice 
      ? '👋 Halo! Saya asisten AI untuk backoffice. Saya bisa membantu dengan manajemen pesanan, inventori, analitik, dan operasional. Ada yang bisa saya bantu?'
      : '👋 Halo! Saya asisten pemesanan makanan Anda. Apa yang ingin Anda pesan hari ini?';

    res.json({
      success: true,
      data: {
        sessionId: session.id,
        message: welcomeMessage,
      },
    } as ApiResponse);
  } catch (error) {
    logger.error('Error creating chat session', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to create chat session',
    } as ApiResponse);
  }
});

// Send message to chat
router.post('/message', async (req, res) => {
  try {
    const { error, value } = messageSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: error.details[0].message,
      } as ApiResponse);
    }

    const { message, sessionId, userId } = value;
    
    // Create session if not provided
    let finalSessionId = sessionId;
    if (!finalSessionId) {
      const session = await chatService.createSession(userId);
      finalSessionId = session.id;
    }

    // Rate limiting check
    const rateLimitKey = `${req.ip}:${finalSessionId}`;
    const isAllowed = await redisService.checkRateLimit(rateLimitKey, 60000, 20); // 20 requests per minute
    
    if (!isAllowed) {
      const isIndonesian = detectIndonesian(message);
      const rateLimitMessage = isIndonesian
        ? 'Terlalu banyak pesan. Mohon tunggu sebentar sebelum mengirim pesan lagi.'
        : 'Too many messages. Please wait a moment before sending another message.';
      
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        message: rateLimitMessage,
      } as ApiResponse);
    }

    const response = await chatService.processMessage(finalSessionId, message);
    
    logger.info('Message processed via API', {
      sessionId: finalSessionId,
      messageLength: message.length,
      intent: response.metadata?.intent,
    });

    res.json({
      success: true,
      data: {
        sessionId: finalSessionId,
        message: response.content,
        intent: response.metadata?.intent,
        timestamp: response.timestamp,
      },
    } as ApiResponse);
  } catch (error) {
    logger.error('Error processing chat message', { error: error.message });
    // Detect language for error message
    const isIndonesian = req.body.message && detectIndonesian(req.body.message);
    const errorMessage = isIndonesian 
      ? 'Maaf, terjadi kesalahan saat memproses pesan Anda. Silakan coba lagi.'
      : 'Sorry, I had trouble processing your request. Please try again.';
    
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: errorMessage,
    } as ApiResponse);
  }
});

// Get chat session history
router.get('/session/:sessionId/history', async (req, res) => {
  try {
    const sessionId = req.params.sessionId;
    const limit = parseInt(req.query.limit as string) || 50;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'Session ID is required',
      } as ApiResponse);
    }

    const session = await chatService.getSession(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found',
        message: 'Chat session does not exist',
      } as ApiResponse);
    }

    const messages = await chatService.getMessageHistory(sessionId, limit);
    
    res.json({
      success: true,
      data: {
        sessionId,
        messages: messages.map(msg => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp,
          intent: msg.metadata?.intent,
        })),
        session: {
          id: session.id,
          isActive: session.isActive,
          createdAt: session.createdAt,
          conversationStage: session.context.conversationStage,
        },
      },
    } as ApiResponse);
  } catch (error) {
    logger.error('Error getting session history', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve session history',
    } as ApiResponse);
  }
});

// Get session info
router.get('/session/:sessionId', async (req, res) => {
  try {
    const sessionId = req.params.sessionId;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'Session ID is required',
      } as ApiResponse);
    }

    const session = await chatService.getSession(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found',
        message: 'Chat session does not exist',
      } as ApiResponse);
    }

    res.json({
      success: true,
      data: {
        sessionId: session.id,
        userId: session.userId,
        isActive: session.isActive,
        createdAt: session.createdAt,
        lastMessageAt: session.lastMessageAt,
        conversationStage: session.context.conversationStage,
        cartItems: session.context.cart?.length || 0,
        totalCartValue: session.context.cart?.reduce(
          (sum, item) => sum + (item.price * item.quantity), 
          0
        ) || 0,
      },
    } as ApiResponse);
  } catch (error) {
    logger.error('Error getting session info', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve session info',
    } as ApiResponse);
  }
});

// Health check endpoint
router.get('/health', async (req, res) => {
  try {
    const redisHealthy = redisService.isHealthy();
    
    res.json({
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date(),
        services: {
          redis: redisHealthy ? 'connected' : 'disconnected',
          gemini: 'configured',
          saleor: 'configured',
        },
      },
    } as ApiResponse);
  } catch (error) {
    logger.error('Health check failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Health check failed',
      message: error.message,
    } as ApiResponse);
  }
});

export default router;