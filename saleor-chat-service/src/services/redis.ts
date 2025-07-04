import { createClient } from 'redis';
import config from '../config';
import { ChatSession, ChatMessage } from '../types';
import logger from '../utils/logger';

export class RedisService {
  private client: any;
  private isConnected = false;

  constructor() {
    this.client = createClient({
      url: config.redisUrl,
    });

    this.client.on('error', (err: Error) => {
      logger.error('Redis Client Error', { error: err.message });
    });

    this.client.on('connect', () => {
      this.isConnected = true;
      logger.info('Connected to Redis');
    });

    this.client.on('disconnect', () => {
      this.isConnected = false;
      logger.warn('Disconnected from Redis');
    });
  }

  async connect(): Promise<void> {
    try {
      await this.client.connect();
    } catch (error) {
      logger.error('Failed to connect to Redis', { error: error.message });
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.client.disconnect();
    } catch (error) {
      logger.error('Failed to disconnect from Redis', { error: error.message });
    }
  }

  // Session management
  async saveSession(session: ChatSession): Promise<void> {
    try {
      const key = `session:${session.id}`;
      await this.client.setEx(key, 3600, JSON.stringify(session)); // 1 hour TTL
      logger.debug('Session saved', { sessionId: session.id });
    } catch (error) {
      logger.error('Failed to save session', { error: error.message, sessionId: session.id });
      throw error;
    }
  }

  async getSession(sessionId: string): Promise<ChatSession | null> {
    try {
      const key = `session:${sessionId}`;
      const data = await this.client.get(key);
      
      if (!data) {
        return null;
      }

      const session = JSON.parse(data);
      session.createdAt = new Date(session.createdAt);
      session.lastMessageAt = new Date(session.lastMessageAt);
      
      logger.debug('Session retrieved', { sessionId });
      return session;
    } catch (error) {
      logger.error('Failed to get session', { error: error.message, sessionId });
      return null;
    }
  }

  async deleteSession(sessionId: string): Promise<void> {
    try {
      const key = `session:${sessionId}`;
      await this.client.del(key);
      logger.debug('Session deleted', { sessionId });
    } catch (error) {
      logger.error('Failed to delete session', { error: error.message, sessionId });
    }
  }

  // Message history management
  async saveMessage(message: ChatMessage): Promise<void> {
    try {
      const key = `messages:${message.sessionId}`;
      const messageData = JSON.stringify({
        ...message,
        timestamp: message.timestamp.toISOString(),
      });
      
      // Add to list and keep only last 100 messages
      await this.client.lPush(key, messageData);
      await this.client.lTrim(key, 0, 99);
      await this.client.expire(key, 86400); // 24 hours TTL
      
      logger.debug('Message saved', { messageId: message.id, sessionId: message.sessionId });
    } catch (error) {
      logger.error('Failed to save message', { error: error.message, messageId: message.id });
      throw error;
    }
  }

  async getMessages(sessionId: string, limit = 50): Promise<ChatMessage[]> {
    try {
      const key = `messages:${sessionId}`;
      const messages = await this.client.lRange(key, 0, limit - 1);
      
      return messages.reverse().map((data: string) => {
        const message = JSON.parse(data);
        message.timestamp = new Date(message.timestamp);
        return message;
      });
    } catch (error) {
      logger.error('Failed to get messages', { error: error.message, sessionId });
      return [];
    }
  }

  // Cache management for frequently accessed data
  async cacheSet(key: string, value: any, ttl = 300): Promise<void> {
    try {
      await this.client.setEx(`cache:${key}`, ttl, JSON.stringify(value));
    } catch (error) {
      logger.error('Failed to set cache', { error: error.message, key });
    }
  }

  async cacheGet(key: string): Promise<any | null> {
    try {
      const data = await this.client.get(`cache:${key}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error('Failed to get cache', { error: error.message, key });
      return null;
    }
  }

  async cacheDel(key: string): Promise<void> {
    try {
      await this.client.del(`cache:${key}`);
    } catch (error) {
      logger.error('Failed to delete cache', { error: error.message, key });
    }
  }

  // Rate limiting
  async checkRateLimit(identifier: string, windowMs: number, maxRequests: number): Promise<boolean> {
    try {
      const key = `rate:${identifier}`;
      const current = await this.client.incr(key);
      
      if (current === 1) {
        await this.client.expire(key, Math.ceil(windowMs / 1000));
      }
      
      return current <= maxRequests;
    } catch (error) {
      logger.error('Failed to check rate limit', { error: error.message, identifier });
      return true; // Allow request on error
    }
  }

  // User context management
  async saveUserContext(userId: string, context: any): Promise<void> {
    try {
      const key = `user:${userId}:context`;
      await this.client.setEx(key, 86400, JSON.stringify(context)); // 24 hours TTL
    } catch (error) {
      logger.error('Failed to save user context', { error: error.message, userId });
    }
  }

  async getUserContext(userId: string): Promise<any | null> {
    try {
      const key = `user:${userId}:context`;
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error('Failed to get user context', { error: error.message, userId });
      return null;
    }
  }

  // Health check
  isHealthy(): boolean {
    return this.isConnected;
  }
}

export default new RedisService();