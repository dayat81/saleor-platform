import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import config from './config';
import chatRoutes from './routes/chat';
import WebSocketService from './websocket';
import redisService from './services/redis';
import logger from './utils/logger';

// Create Express app
const app = express();
const server = createServer(app);

// Initialize WebSocket service
const wsService = new WebSocketService(server);

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "ws:", "wss:"],
    },
  },
}));

app.use(cors({
  origin: config.corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  logger.info('HTTP Request', {
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
  });
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date(),
    service: 'saleor-chat-service',
    version: '1.0.0',
    uptime: process.uptime(),
    connections: wsService.getConnectionCount(),
    activeSessions: wsService.getActiveSessions().length,
  });
});

// API routes
app.use('/api/chat', chatRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Saleor Chat Service API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      chat: '/api/chat',
      websocket: '/socket.io',
    },
    documentation: {
      chat: {
        'POST /api/chat/session/start': 'Create new chat session',
        'POST /api/chat/message': 'Send message to chat',
        'GET /api/chat/session/:sessionId/history': 'Get chat history',
        'GET /api/chat/session/:sessionId': 'Get session info',
      },
      websocket: {
        events: {
          'join_session': 'Join a chat session',
          'send_message': 'Send a message',
          'typing': 'Send typing indicator',
        },
      },
    },
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    url: req.url,
  });

  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: config.nodeEnv === 'development' ? err.message : 'An unexpected error occurred',
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not found',
    message: `Route ${req.method} ${req.url} not found`,
  });
});

// Graceful shutdown handler
const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}, starting graceful shutdown`);
  
  try {
    // Close server
    server.close(() => {
      logger.info('HTTP server closed');
    });

    // Disconnect from Redis
    await redisService.disconnect();
    logger.info('Redis disconnected');

    // Exit process
    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown', { error: error.message });
    process.exit(1);
  }
};

// Setup signal handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection', { reason, promise });
  process.exit(1);
});

// Start server
async function startServer() {
  try {
    // Connect to Redis
    await redisService.connect();
    logger.info('Connected to Redis');

    // Start HTTP server
    server.listen(config.port, () => {
      logger.info(`🚀 Saleor Chat Service started on port ${config.port}`, {
        environment: config.nodeEnv,
        port: config.port,
        corsOrigins: config.corsOrigin,
      });

      logger.info('Service endpoints:', {
        api: `http://localhost:${config.port}/api/chat`,
        websocket: `http://localhost:${config.port}/socket.io`,
        health: `http://localhost:${config.port}/health`,
      });
    });
  } catch (error) {
    logger.error('Failed to start server', { error: error.message });
    process.exit(1);
  }
}

// Start the server
startServer();