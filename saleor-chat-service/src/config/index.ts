import dotenv from 'dotenv';
import { Config } from '../types';

// Load environment variables
dotenv.config();

const config: Config = {
  port: parseInt(process.env.PORT || '3002', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Gemini API configuration
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
  
  // Saleor configuration
  saleorApiUrl: process.env.SALEOR_API_URL || 'http://api-dev.aksa.ai/graphql/',
  saleorAuthToken: process.env.SALEOR_AUTH_TOKEN || '',
  
  // Redis configuration
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  
  // Security
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  corsOrigin: (process.env.CORS_ORIGIN || 'http://localhost:3000').split(','),
  
  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
  logFile: process.env.LOG_FILE || 'logs/chat-service.log',
  
  // Rate limiting
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
};

// Validate required environment variables
const requiredEnvVars = [
  'GEMINI_API_KEY',
  'SALEOR_API_URL',
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars);
  process.exit(1);
}

export default config;