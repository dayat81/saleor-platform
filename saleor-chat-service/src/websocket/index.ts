import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import chatService from '../services/chat';
import redisService from '../services/redis';
import logger from '../utils/logger';
import config from '../config';
import { WebSocketMessage, ChatMessage } from '../types';

export class WebSocketService {
  private io: SocketIOServer;
  private connectedSessions = new Map<string, string>(); // socketId -> sessionId

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: config.corsOrigin,
        methods: ['GET', 'POST'],
        credentials: true,
      },
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket) => {
      logger.info('Client connected to WebSocket', { socketId: socket.id });

      // Handle chat session join
      socket.on('join_session', async (data: { sessionId?: string; userId?: string }) => {
        try {
          let sessionId = data.sessionId;
          
          // Create new session if not provided
          if (!sessionId) {
            const session = await chatService.createSession(data.userId);
            sessionId = session.id;
            
            // Send welcome message
            const welcomeMessage: WebSocketMessage = {
              type: 'message',
              data: {
                sessionId,
                message: '👋 Hello! I\'m your food ordering assistant. What would you like to order today?',
                role: 'assistant',
                timestamp: new Date(),
              },
              timestamp: new Date(),
            };
            
            socket.emit('message', welcomeMessage);
          }

          // Join the session room
          socket.join(sessionId);
          this.connectedSessions.set(socket.id, sessionId);

          logger.info('Client joined chat session', { 
            socketId: socket.id,
            sessionId,
            userId: data.userId 
          });

          // Send session info
          const session = await chatService.getSession(sessionId);
          socket.emit('session_joined', {
            sessionId,
            isActive: session?.isActive || true,
            conversationStage: session?.context.conversationStage,
          });

          // Send recent message history
          const recentMessages = await chatService.getMessageHistory(sessionId, 10);
          if (recentMessages.length > 0) {
            const historyMessages = recentMessages.map(msg => ({
              type: 'message',
              data: {
                sessionId,
                message: msg.content,
                role: msg.role,
                intent: msg.metadata?.intent,
                timestamp: msg.timestamp,
              },
              timestamp: msg.timestamp,
            }));

            socket.emit('message_history', historyMessages);
          }
        } catch (error) {
          logger.error('Error joining chat session', { 
            error: error.message,
            socketId: socket.id 
          });
          
          socket.emit('error', {
            type: 'error',
            data: {
              message: 'Failed to join chat session',
              error: error.message,
            },
            timestamp: new Date(),
          });
        }
      });

      // Handle incoming messages
      socket.on('send_message', async (data: { message: string; sessionId?: string }) => {
        try {
          const sessionId = this.connectedSessions.get(socket.id) || data.sessionId;
          
          if (!sessionId) {
            socket.emit('error', {
              type: 'error',
              data: { message: 'No active session found' },
              timestamp: new Date(),
            });
            return;
          }

          // Rate limiting
          const rateLimitKey = `ws:${socket.id}:${sessionId}`;
          const isAllowed = await redisService.checkRateLimit(rateLimitKey, 60000, 30); // 30 messages per minute
          
          if (!isAllowed) {
            socket.emit('error', {
              type: 'error',
              data: { message: 'Rate limit exceeded. Please slow down.' },
              timestamp: new Date(),
            });
            return;
          }

          // Show typing indicator
          socket.to(sessionId).emit('typing', {
            type: 'typing',
            data: { isTyping: true, role: 'assistant' },
            timestamp: new Date(),
          });

          // Process the message
          const response = await chatService.processMessage(sessionId, data.message);

          // Stop typing indicator
          socket.to(sessionId).emit('typing', {
            type: 'typing',
            data: { isTyping: false, role: 'assistant' },
            timestamp: new Date(),
          });

          // Send response to all clients in the session
          const responseMessage: WebSocketMessage = {
            type: 'message',
            data: {
              sessionId,
              message: response.content,
              role: response.role,
              intent: response.metadata?.intent,
              timestamp: response.timestamp,
            },
            timestamp: response.timestamp,
          };

          this.io.to(sessionId).emit('message', responseMessage);

          logger.info('WebSocket message processed', {
            sessionId,
            socketId: socket.id,
            intent: response.metadata?.intent,
            messageLength: data.message.length,
          });
        } catch (error) {
          logger.error('Error processing WebSocket message', { 
            error: error.message,
            socketId: socket.id 
          });

          socket.emit('error', {
            type: 'error',
            data: {
              message: 'Failed to process message',
              error: error.message,
            },
            timestamp: new Date(),
          });
        }
      });

      // Handle typing indicators
      socket.on('typing', (data: { isTyping: boolean; sessionId?: string }) => {
        const sessionId = this.connectedSessions.get(socket.id) || data.sessionId;
        if (sessionId) {
          socket.to(sessionId).emit('typing', {
            type: 'typing',
            data: { isTyping: data.isTyping, role: 'user' },
            timestamp: new Date(),
          });
        }
      });

      // Handle disconnection
      socket.on('disconnect', (reason) => {
        const sessionId = this.connectedSessions.get(socket.id);
        
        logger.info('Client disconnected from WebSocket', { 
          socketId: socket.id,
          sessionId,
          reason 
        });

        // Clean up
        this.connectedSessions.delete(socket.id);
        
        if (sessionId) {
          socket.leave(sessionId);
        }
      });

      // Handle errors
      socket.on('error', (error) => {
        logger.error('WebSocket error', { 
          error: error.message,
          socketId: socket.id 
        });
      });
    });

    logger.info('WebSocket service initialized');
  }

  // Method to broadcast system messages to a session
  public broadcastToSession(sessionId: string, message: WebSocketMessage): void {
    this.io.to(sessionId).emit('system_message', message);
  }

  // Method to broadcast notifications (order updates, etc.)
  public broadcastNotification(sessionId: string, notification: any): void {
    this.io.to(sessionId).emit('notification', {
      type: 'system',
      data: notification,
      timestamp: new Date(),
    });
  }

  // Get connected clients count
  public getConnectionCount(): number {
    return this.connectedSessions.size;
  }

  // Get active sessions
  public getActiveSessions(): string[] {
    return Array.from(new Set(this.connectedSessions.values()));
  }
}

export default WebSocketService;