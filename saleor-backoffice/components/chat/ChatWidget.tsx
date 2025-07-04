'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, Send, Loader2, ShoppingCart, Mic, MicOff } from 'lucide-react'
import { useChat } from '@/hooks/useChat'
import { 
  ChatMessage, 
  QuickActions, 
  TypingIndicator,
  MessageHistory,
  ConnectionStatus,
  BackofficeDataCard
} from './ChatComponents'
import { cn } from '@/lib/utils'

interface ChatWidgetProps {
  className?: string
  position?: 'bottom-right' | 'bottom-left'
  theme?: 'light' | 'dark'
  initialMessage?: string
}

export function ChatWidget({ 
  className,
  position = 'bottom-right',
  theme = 'light',
  initialMessage = "👋 Hello! I'm your AI backoffice assistant. I can help you with orders, inventory, analytics, staff management, and more. What would you like to know?"
}: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [isListening, setIsListening] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  
  const {
    messages,
    isTyping,
    isConnected,
    sessionId,
    sendMessage,
    startSession,
    connectionStatus
  } = useChat()

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Initialize chat session when widget opens
  useEffect(() => {
    if (isOpen && !sessionId) {
      startSession()
    }
  }, [isOpen, sessionId, startSession])

  const handleSendMessage = async () => {
    if (!message.trim() || !isConnected) return
    
    const userMessage = message.trim()
    setMessage('')
    
    try {
      await sendMessage(userMessage)
    } catch (error) {
      console.error('Failed to send message:', error)
      // Could add error toast here
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const toggleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Voice input is not supported in your browser')
      return
    }

    if (isListening) {
      setIsListening(false)
      // Stop voice recognition
    } else {
      setIsListening(true)
      // Start voice recognition
      startVoiceRecognition()
    }
  }

  const startVoiceRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-US'
    
    recognition.onstart = () => {
      setIsListening(true)
    }
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      setMessage(transcript)
      setIsListening(false)
    }
    
    recognition.onerror = () => {
      setIsListening(false)
    }
    
    recognition.onend = () => {
      setIsListening(false)
    }
    
    recognition.start()
  }

  const quickActions = [
    { label: "Today's Orders", action: "todays_orders", emoji: "📦", category: "orders" },
    { label: "Inventory Status", action: "inventory_status", emoji: "📋", category: "inventory" },
    { label: "Sales Analytics", action: "sales_analytics", emoji: "📊", category: "analytics" },
    { label: "Staff Schedule", action: "staff_schedule", emoji: "👥", category: "staff" },
    { label: "Low Stock Alert", action: "low_stock", emoji: "⚠️", category: "inventory" },
    { label: "Customer Reports", action: "customer_reports", emoji: "👤", category: "customers" },
  ]

  const handleQuickAction = async (action: string) => {
    const actionMessages: Record<string, string> = {
      todays_orders: "Show me today's orders",
      inventory_status: "What's our current inventory status?",
      sales_analytics: "Show me today's sales performance",
      staff_schedule: "Who's scheduled for today?",
      low_stock: "What items are running low on stock?",
      customer_reports: "Show me customer analytics",
    }
    
    const messageText = actionMessages[action] || action
    setMessage(messageText)
    await sendMessage(messageText)
  }

  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
  }

  const themeClasses = {
    light: 'bg-white text-gray-900 border-gray-200',
    dark: 'bg-gray-800 text-white border-gray-700',
  }

  return (
    <div className={cn(
      'fixed z-50',
      positionClasses[position],
      className
    )}>
      {/* Chat Toggle Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="relative bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-colors duration-200"
          >
            <MessageCircle className="h-6 w-6" />
            {/* Connection status indicator */}
            <div className={cn(
              "absolute -top-1 -right-1 w-3 h-3 rounded-full",
              isConnected ? "bg-green-400" : "bg-red-400"
            )} />
            {/* Unread message badge */}
            {messages.length > 0 && (
              <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                !
              </div>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={cn(
              "absolute bottom-0 right-0 w-96 h-[600px] rounded-lg shadow-2xl border flex flex-col overflow-hidden",
              themeClasses[theme]
            )}
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  🍕
                </div>
                <div>
                  <h3 className="font-semibold">Backoffice Assistant</h3>
                  <p className="text-xs opacity-90">
                    {isConnected ? 'Online' : 'Connecting...'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Welcome Message */}
              {messages.length === 0 && (
                <ChatMessage
                  role="assistant"
                  content={initialMessage}
                  timestamp={new Date()}
                />
              )}

              {/* Chat Messages */}
              {messages.map((msg) => (
                <ChatMessage
                  key={msg.id}
                  role={msg.role}
                  content={msg.content}
                  timestamp={msg.timestamp}
                  intent={msg.intent}
                  data={msg.data}
                  isStreaming={msg.isStreaming}
                  metadata={msg.metadata}
                />
              ))}

              {/* Typing Indicator */}
              {isTyping && <TypingIndicator />}

              {/* Quick Actions (shown when no conversation) */}
              {messages.length === 0 && (
                <QuickActions
                  actions={quickActions}
                  onAction={handleQuickAction}
                />
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2">
                <div className="flex-1 relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    disabled={!isConnected}
                    className={cn(
                      "w-full px-4 py-2 pr-12 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500",
                      "disabled:opacity-50 disabled:cursor-not-allowed",
                      theme === 'dark' && "bg-gray-700 border-gray-600 text-white"
                    )}
                  />
                  
                  {/* Voice Input Button */}
                  <button
                    onClick={toggleVoiceInput}
                    disabled={!isConnected}
                    className={cn(
                      "absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded",
                      "hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors",
                      isListening && "text-red-500 animate-pulse"
                    )}
                  >
                    {isListening ? (
                      <MicOff className="h-4 w-4" />
                    ) : (
                      <Mic className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {/* Send Button */}
                <button
                  onClick={handleSendMessage}
                  disabled={!message.trim() || !isConnected || isTyping}
                  className={cn(
                    "p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors",
                    "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600"
                  )}
                >
                  {isTyping ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </button>
              </div>

              {/* Connection Status */}
              {connectionStatus !== 'connected' && (
                <div className="mt-2">
                  <ConnectionStatus 
                    status={connectionStatus}
                    onRetry={() => window.location.reload()}
                  />
                </div>
              )}
              
              {/* Message History */}
              <MessageHistory 
                messages={messages.filter(msg => !msg.isStreaming)}
                onClearHistory={() => {
                  // Clear messages functionality would go here
                  console.log('Clear history requested')
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}