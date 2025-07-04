# Saleor Chat Service with Gemini AI

An AI-powered chat service for the Saleor F&B platform using Google's Gemini API for natural language processing and conversational commerce.
GEMINI_API_KEY="AIzaSyDc5iF5xLH0iujbB3jo0h94tWKiFm6IGYo"
## Features

### Core Capabilities
- **Gemini AI Integration**: Advanced natural language understanding using Google's Gemini API
- **Real-time Communication**: WebSocket support for instant messaging
- **Saleor Integration**: Direct GraphQL integration with Saleor backend
- **Context Management**: Persistent conversation state and user preferences
- **Intent Recognition**: Automatic classification of user intents (ordering, product search, support)
- **Product Search**: Natural language product discovery
- **Order Management**: Conversational ordering workflow
- **Redis Caching**: Session management and message history storage

### AI Features
- **Natural Language Ordering**: "I want 2 large pepperoni pizzas"
- **Product Recommendations**: AI-driven suggestions based on preferences
- **Dietary Preferences**: Handles vegetarian, vegan, gluten-free requests
- **Order Modifications**: "Make one of them gluten-free"
- **Order Status**: "Where's my order?"
- **Contextual Conversations**: Remembers conversation history

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Chat Widget   │    │   Chat Service   │    │   Gemini API    │
│   (Frontend)    │◄──►│   (Backend)      │◄──►│   (Google AI)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │   Saleor API     │
                       │   (GraphQL)      │
                       └──────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │   Redis Cache    │
                       │   (Sessions)     │
                       └──────────────────┘
```

## Installation

### Prerequisites
- Node.js 18+
- Redis server
- Google Gemini API key
- Saleor GraphQL API access

### Local Development

1. **Clone and install dependencies:**
```bash
cd saleor-chat-service
npm install
```

2. **Environment setup:**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Required environment variables:**
```env
# Server Configuration
PORT=3002
NODE_ENV=development

# Gemini API Configuration
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash

# Saleor Configuration
SALEOR_API_URL=http://api-dev.aksa.ai/graphql/
SALEOR_AUTH_TOKEN=your_saleor_token_here

# Redis Configuration
REDIS_URL=redis://localhost:6379

# Security
JWT_SECRET=your_jwt_secret_here
CORS_ORIGIN=http://localhost:3000,http://storefront-dev.aksa.ai
```

4. **Start development server:**
```bash
npm run dev
```

5. **Build for production:**
```bash
npm run build
npm start
```

## API Endpoints

### REST API

#### Create Chat Session
```http
POST /api/chat/session/start
Content-Type: application/json

{
  "userId": "optional-user-id"
}
```

#### Send Message
```http
POST /api/chat/message
Content-Type: application/json

{
  "message": "I want to order a pizza",
  "sessionId": "session-id",
  "userId": "optional-user-id"
}
```

#### Get Session History
```http
GET /api/chat/session/{sessionId}/history?limit=50
```

#### Health Check
```http
GET /health
```

### WebSocket Events

#### Client → Server
- `join_session`: Join a chat session
- `send_message`: Send a message
- `typing`: Send typing indicator

#### Server → Client
- `message`: Receive a message
- `typing`: Typing indicator
- `session_joined`: Session join confirmation
- `error`: Error message
- `notification`: System notifications

## Usage Examples

### Basic Chat Interaction
```javascript
// Initialize chat
const response = await fetch('/api/chat/session/start', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({})
});
const { sessionId } = await response.json();

// Send message
const chatResponse = await fetch('/api/chat/message', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: "Show me vegetarian pizzas under $15",
    sessionId
  })
});
```

### WebSocket Connection
```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3002');

// Join session
socket.emit('join_session', { userId: 'user123' });

// Send message
socket.emit('send_message', {
  message: "I'd like to order food",
  sessionId: "session-id"
});

// Listen for responses
socket.on('message', (data) => {
  console.log('AI Response:', data.data.message);
});
```

## Conversation Flows

### Product Search Flow
```
User: "Show me vegetarian options"
AI: "Here are our popular vegetarian dishes:
    🥗 Garden Fresh Salad - $8.99
    🍕 Margherita Pizza - $12.99
    🍝 Pasta Primavera - $10.99
    Would you like to add any of these to your cart?"

User: "Add the pizza"
AI: "Great choice! I've added the Margherita Pizza ($12.99) to your cart.
    Would you like to add any drinks or sides?"
```

### Order Status Flow
```
User: "Where's my order?"
AI: "Your order #1234 is currently being prepared in the kitchen.
    Estimated delivery time: 25 minutes
    I'll send you updates as your order progresses!"
```

## Integration with Saleor

The chat service integrates with Saleor via GraphQL for:

- **Product Search**: Real-time product catalog queries
- **Cart Management**: Add/remove items, modify quantities
- **Order Creation**: Complete checkout process
- **Order Status**: Real-time order tracking
- **User Management**: Customer profiles and preferences

### Saleor GraphQL Queries Used
- `products`: Search and retrieve product information
- `checkoutCreate`: Initialize shopping cart
- `checkoutLinesAdd`: Add items to cart
- `checkoutComplete`: Process order
- `order`: Get order status and details

## Deployment

### Kubernetes Deployment

1. **Update secrets:**
```bash
# Create base64 encoded secrets
echo -n "your_gemini_api_key" | base64
echo -n "your_jwt_secret" | base64

# Update k8s/dev/saleor-chat-service.yaml with encoded values
```

2. **Deploy to Kubernetes:**
```bash
kubectl apply -f k8s/dev/saleor-chat-service.yaml
kubectl apply -f k8s/dev/ingress.yaml
```

3. **Verify deployment:**
```bash
kubectl get pods -n saleor-dev | grep chat-service
kubectl logs -f deployment/saleor-chat-service -n saleor-dev
```

### Environment Access

After deployment, the chat service will be available at:
- **API**: http://storefront-dev.aksa.ai/api/chat/
- **WebSocket**: http://storefront-dev.aksa.ai/socket.io/
- **Health Check**: http://storefront-dev.aksa.ai/api/chat/health

## Monitoring & Logging

### Health Checks
- **Liveness Probe**: `/health` endpoint
- **Readiness Probe**: Service availability check
- **Connection Status**: Redis and Gemini API connectivity

### Logging
- **Winston Logger**: Structured JSON logging
- **Log Levels**: Error, warn, info, debug
- **Log Files**: Persistent storage in `/app/logs/`

### Metrics
- **Active Sessions**: Number of concurrent chat sessions
- **Message Volume**: Messages processed per minute
- **Response Time**: AI response latency
- **Error Rate**: Failed message processing rate

## Security

### Authentication
- **JWT Tokens**: Secure session management
- **Rate Limiting**: 100 requests per minute per IP
- **CORS**: Configured for specific domains
- **Input Validation**: Joi schema validation

### Data Protection
- **Session Encryption**: Redis session data encryption
- **Message History**: Automatic cleanup after 24 hours
- **API Security**: Helmet.js security headers
- **Environment Secrets**: Kubernetes secrets management

## Troubleshooting

### Common Issues

1. **Gemini API Connection Failed**
```bash
# Check API key configuration
kubectl get secret chat-service-secrets -n saleor-dev -o yaml
# Verify API key is valid and base64 encoded
```

2. **Redis Connection Issues**
```bash
# Check Redis connectivity
kubectl exec -it deployment/saleor-chat-service -n saleor-dev -- nc -zv saleor-redis 6379
```

3. **Saleor GraphQL Errors**
```bash
# Test Saleor API connectivity
kubectl exec -it deployment/saleor-chat-service -n saleor-dev -- curl http://saleor-api:8000/graphql/
```

### Debug Mode
```bash
# Enable debug logging
kubectl set env deployment/saleor-chat-service LOG_LEVEL=debug -n saleor-dev
kubectl logs -f deployment/saleor-chat-service -n saleor-dev
```

## Development

### Project Structure
```
saleor-chat-service/
├── src/
│   ├── types/           # TypeScript type definitions
│   ├── config/          # Configuration management
│   ├── services/        # Core services (Gemini, Saleor, Redis)
│   ├── routes/          # Express API routes
│   ├── websocket/       # WebSocket handling
│   ├── utils/           # Utility functions
│   └── index.ts         # Application entry point
├── k8s/                 # Kubernetes deployment configs
├── logs/                # Log files
└── package.json         # Dependencies and scripts
```

### Contributing
1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

### Testing
```bash
npm test                 # Run unit tests
npm run test:integration # Run integration tests
npm run test:e2e         # Run end-to-end tests
```

## License

MIT License - see LICENSE file for details.