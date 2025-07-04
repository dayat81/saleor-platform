'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { io, Socket } from 'socket.io-client'

// Types
interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  intent?: string
  products?: Product[]
}

interface Product {
  id: string
  name: string
  description: string
  price: number
  currency: string
  category: string
  thumbnail?: string
  isAvailable: boolean
}

interface UseChatReturn {
  messages: ChatMessage[]
  isTyping: boolean
  isConnected: boolean
  sessionId: string | null
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error'
  sendMessage: (message: string) => Promise<void>
  startSession: (userId?: string) => Promise<void>
  clearMessages: () => void
  retryConnection: () => void
}

const CHAT_SERVICE_URL = process.env.NEXT_PUBLIC_CHAT_SERVICE_URL || 'http://localhost:3002'

export function useChat(): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected')
  
  const socketRef = useRef<Socket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5

  // Initialize socket connection
  const initializeSocket = useCallback(() => {
    if (socketRef.current?.connected) {
      return
    }

    setConnectionStatus('connecting')
    
    const socket = io(CHAT_SERVICE_URL, {
      transports: ['websocket', 'polling'],
      timeout: 10000,
      reconnection: true,
      reconnectionAttempts: maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    })

    // Connection events
    socket.on('connect', () => {
      console.log('Connected to chat service')
      setIsConnected(true)
      setConnectionStatus('connected')
      reconnectAttempts.current = 0
    })

    socket.on('disconnect', (reason) => {
      console.log('Disconnected from chat service:', reason)
      setIsConnected(false)
      setConnectionStatus('disconnected')
      
      // Auto-reconnect for certain disconnect reasons
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, don't reconnect automatically
        return
      }
      
      // Client-side disconnect, attempt to reconnect
      if (reconnectAttempts.current < maxReconnectAttempts) {
        reconnectAttempts.current++
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 10000)
        
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log(`Reconnection attempt ${reconnectAttempts.current}`)
          socket.connect()
        }, delay)
      } else {
        setConnectionStatus('error')
      }
    })

    socket.on('connect_error', (error) => {
      console.error('Connection error:', error)
      setIsConnected(false)
      setConnectionStatus('error')
    })

    // Chat events
    socket.on('session_joined', (data: { sessionId: string; isActive: boolean }) => {
      console.log('Joined session:', data.sessionId)
      setSessionId(data.sessionId)
    })

    socket.on('message', (data: any) => {
      const message: ChatMessage = {
        id: data.data.messageId || `msg-${Date.now()}`,
        role: data.data.role,
        content: data.data.message,
        timestamp: new Date(data.data.timestamp),
        intent: data.data.intent,
        products: data.data.products,
      }
      
      setMessages(prev => [...prev, message])
      setIsTyping(false)
    })

    socket.on('message_history', (history: any[]) => {
      const historyMessages = history.map((data: any) => ({
        id: data.data.messageId || `msg-${Date.now()}-${Math.random()}`,
        role: data.data.role,
        content: data.data.message,
        timestamp: new Date(data.data.timestamp),
        intent: data.data.intent,
        products: data.data.products,
      }))
      
      setMessages(historyMessages)
    })

    socket.on('typing', (data: { isTyping: boolean; role: string }) => {
      if (data.role === 'assistant') {
        setIsTyping(data.isTyping)
      }
    })

    socket.on('error', (error: any) => {
      console.error('Chat error:', error)
      // You could show an error toast here
    })

    socket.on('notification', (notification: any) => {
      console.log('Received notification:', notification)
      // Handle order updates, etc.
    })

    socketRef.current = socket
  }, [])

  // Start a new chat session
  const startSession = useCallback(async (userId?: string) => {
    if (!socketRef.current) {
      initializeSocket()
    }

    // Wait for connection
    if (!isConnected) {
      await new Promise((resolve) => {
        const checkConnection = () => {
          if (isConnected) {
            resolve(void 0)
          } else {
            setTimeout(checkConnection, 100)
          }
        }
        checkConnection()
      })
    }

    socketRef.current?.emit('join_session', { userId })
  }, [isConnected, initializeSocket])

  // Send a message
  const sendMessage = useCallback(async (message: string) => {
    if (!socketRef.current || !isConnected || !message.trim()) {
      return
    }

    // Add user message to UI immediately
    const userMessage: ChatMessage = {
      id: `user-msg-${Date.now()}`,
      role: 'user',
      content: message.trim(),
      timestamp: new Date(),
    }
    
    setMessages(prev => [...prev, userMessage])
    setIsTyping(true)

    // Send message via WebSocket
    socketRef.current.emit('send_message', {
      message: message.trim(),
      sessionId,
    })
  }, [isConnected, sessionId])

  // Clear messages
  const clearMessages = useCallback(() => {
    setMessages([])
  }, [])

  // Retry connection
  const retryConnection = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    
    reconnectAttempts.current = 0
    socketRef.current?.disconnect()
    socketRef.current = null
    initializeSocket()
  }, [initializeSocket])

  // Initialize socket on mount
  useEffect(() => {
    initializeSocket()

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      socketRef.current?.disconnect()
    }
  }, [initializeSocket])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      socketRef.current?.disconnect()
    }
  }, [])

  return {
    messages,
    isTyping,
    isConnected,
    sessionId,
    connectionStatus,
    sendMessage,
    startSession,
    clearMessages,
    retryConnection,
  }
}