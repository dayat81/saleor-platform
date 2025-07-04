'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { io, Socket } from 'socket.io-client'

// Types
interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  intent?: string
  products?: Product[]
  data?: any[]
  isStreaming?: boolean
  metadata?: {
    typing?: boolean
    error?: boolean
    actions?: string[]
    chartData?: any
    alertLevel?: 'info' | 'warning' | 'error' | 'success'
  }
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
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => string
  updateMessage: (id: string, updates: Partial<ChatMessage>) => void
  getMessageHistory: () => ChatMessage[]
  saveConversation: () => void
  loadConversation: () => void
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
  const streamingMessageRef = useRef<string | null>(null)

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
        isStreaming: false
      }
      
      setMessages(prev => [...prev, message])
      setIsTyping(false)
    })

    // Handle streaming message chunks
    socket.on('message_chunk', (data: any) => {
      const { messageId, content, isComplete } = data
      
      setMessages(prev => prev.map(msg => {
        if (msg.id === messageId) {
          return {
            ...msg,
            content: msg.content + content,
            isStreaming: !isComplete
          }
        }
        return msg
      }))
      
      if (isComplete) {
        setIsTyping(false)
        streamingMessageRef.current = null
      }
    })

    // Handle message start (for streaming)
    socket.on('message_start', (data: any) => {
      const messageId = data.messageId || `msg-${Date.now()}`
      streamingMessageRef.current = messageId
      
      const message: ChatMessage = {
        id: messageId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isStreaming: true,
        intent: data.intent,
        products: data.products
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

  // Add message utility
  const addMessage = useCallback((message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const id = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const newMessage: ChatMessage = {
      ...message,
      id,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, newMessage])
    return id
  }, [])

  // Update message utility
  const updateMessage = useCallback((id: string, updates: Partial<ChatMessage>) => {
    setMessages(prev => prev.map(msg => 
      msg.id === id ? { ...msg, ...updates } : msg
    ))
  }, [])

  // Get message history
  const getMessageHistory = useCallback(() => {
    return messages.filter(msg => !msg.isStreaming)
  }, [messages])

  // Save conversation to localStorage
  const saveConversation = useCallback(() => {
    if (messages.length > 0) {
      const conversation = {
        sessionId,
        messages: messages.filter(msg => !msg.isStreaming),
        timestamp: new Date().toISOString()
      }
      localStorage.setItem('chat_conversation', JSON.stringify(conversation))
    }
  }, [messages, sessionId])

  // Load conversation from localStorage
  const loadConversation = useCallback(() => {
    try {
      const saved = localStorage.getItem('chat_conversation')
      if (saved) {
        const conversation = JSON.parse(saved)
        const savedDate = new Date(conversation.timestamp)
        const now = new Date()
        const hoursDiff = (now.getTime() - savedDate.getTime()) / (1000 * 60 * 60)
        
        // Only load if conversation is less than 24 hours old
        if (hoursDiff < 24) {
          setMessages(conversation.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
            isStreaming: false
          })))
          setSessionId(conversation.sessionId)
        }
      }
    } catch (error) {
      console.error('Failed to load conversation:', error)
    }
  }, [])

  // Clear messages
  const clearMessages = useCallback(() => {
    setMessages([])
    streamingMessageRef.current = null
    localStorage.removeItem('chat_conversation')
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

  // Initialize socket on mount and load conversation
  useEffect(() => {
    loadConversation()
    initializeSocket()

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      socketRef.current?.disconnect()
    }
  }, [initializeSocket, loadConversation])

  // Auto-save conversation when messages change
  useEffect(() => {
    if (messages.length > 0) {
      const timeoutId = setTimeout(saveConversation, 1000)
      return () => clearTimeout(timeoutId)
    }
  }, [messages, saveConversation])

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
    addMessage,
    updateMessage,
    getMessageHistory,
    saveConversation,
    loadConversation
  }
}