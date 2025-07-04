'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { 
  ShoppingCart, 
  Clock, 
  Star, 
  Plus, 
  Minus,
  Package,
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  BarChart3
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Types tailored for backoffice operations
interface Message {
  id?: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  intent?: string
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

interface QuickAction {
  label: string
  action: string
  emoji?: string
  variant?: 'primary' | 'secondary' | 'outline'
  category?: 'orders' | 'inventory' | 'staff' | 'analytics' | 'customers'
}

// Streamlit-inspired typewriter effect component
export function StreamingText({ 
  text, 
  isStreaming = false, 
  speed = 50 
}: { 
  text: string
  isStreaming?: boolean
  speed?: number 
}) {
  const [displayedText, setDisplayedText] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (!isStreaming) {
      setDisplayedText(text)
      setCurrentIndex(text.length)
      return
    }

    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayedText(text.slice(0, currentIndex + 1))
        setCurrentIndex(currentIndex + 1)
      }, speed)

      return () => clearTimeout(timer)
    }
  }, [text, currentIndex, isStreaming, speed])

  useEffect(() => {
    // Reset when text changes
    setCurrentIndex(0)
    setDisplayedText('')
  }, [text])

  return (
    <span>
      {displayedText}
      {isStreaming && currentIndex < text.length && (
        <motion.span 
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 0.8, repeat: Infinity }}
          className="ml-1"
        >
          |
        </motion.span>
      )}
    </span>
  )
}

// Backoffice-focused Chat Message Component
export function ChatMessage({ 
  role, 
  content, 
  timestamp, 
  intent, 
  data, 
  isStreaming = false,
  metadata 
}: Message) {
  const isUser = role === 'user'
  const isSystem = role === 'system'
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "flex w-full mb-4",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      <div className={cn(
        "max-w-[85%] rounded-lg px-4 py-3 shadow-sm",
        isUser 
          ? "bg-blue-600 text-white" 
          : isSystem
          ? getSystemMessageStyles(metadata?.alertLevel)
          : "bg-white border border-gray-200 text-gray-900"
      )}>
        {/* Avatar and role indicator for non-user messages */}
        {!isUser && (
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-sm">
              {getMessageIcon(intent, isSystem)}
            </div>
            <span className="text-xs text-gray-500 font-medium">
              {isSystem ? 'Alert Sistem' : 'Asisten Backoffice'}
            </span>
          </div>
        )}

        {/* Message content with streaming support */}
        <div className="prose prose-sm max-w-none whitespace-pre-wrap break-words">
          <StreamingText 
            text={content} 
            isStreaming={isStreaming}
            speed={25}
          />
        </div>
        
        {/* Data visualization for analytics and reports */}
        {data && data.length > 0 && (
          <div className="mt-3">
            <BackofficeDataCard 
              data={data}
              intent={intent}
              chartData={metadata?.chartData}
            />
          </div>
        )}

        {/* Intent-based action buttons */}
        {intent && metadata?.actions && (
          <div className="mt-3 flex flex-wrap gap-2">
            {metadata.actions.map((action, index) => (
              <button
                key={index}
                className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
              >
                {action}
              </button>
            ))}
          </div>
        )}
        
        {/* Timestamp */}
        <div className={cn(
          "text-xs mt-2 opacity-70",
          isUser ? "text-blue-100" : "text-gray-500"
        )}>
          {format(timestamp, 'HH:mm')}
        </div>
      </div>
    </motion.div>
  )
}

// Helper functions
function getSystemMessageStyles(alertLevel?: string) {
  switch (alertLevel) {
    case 'error':
      return "bg-red-50 border border-red-200 text-red-800"
    case 'warning':
      return "bg-yellow-50 border border-yellow-200 text-yellow-800"
    case 'success':
      return "bg-green-50 border border-green-200 text-green-800"
    default:
      return "bg-blue-50 border border-blue-200 text-blue-800"
  }
}

function getMessageIcon(intent?: string, isSystem?: boolean) {
  if (isSystem) return '⚡'
  
  switch (intent) {
    case 'orders':
      return '📦'
    case 'inventory':
      return '📋'
    case 'analytics':
      return '📊'
    case 'staff':
      return '👥'
    case 'customers':
      return '👤'
    default:
      return '🤖'
  }
}

// Backoffice Data Card Component
export function BackofficeDataCard({ 
  data, 
  intent, 
  chartData 
}: { 
  data: any[]
  intent?: string
  chartData?: any 
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gray-50 rounded-lg border border-gray-200 p-3"
    >
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-gray-900 flex items-center">
          {getDataIcon(intent)}
          <span className="ml-2">{getDataTitle(intent)}</span>
        </h4>
        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
          {data.length} items
        </span>
      </div>

      {/* Data table/list */}
      <div className="space-y-2 max-h-40 overflow-y-auto">
        {data.slice(0, 5).map((item, index) => (
          <div key={index} className="flex justify-between items-center text-sm bg-white rounded p-2">
            <span className="font-medium">{item.name || item.title || item.id}</span>
            <span className={cn(
              "text-xs px-2 py-1 rounded",
              getStatusStyles(item.status || item.state)
            )}>
              {item.status || item.value || item.count}
            </span>
          </div>
        ))}
        
        {data.length > 5 && (
          <div className="text-xs text-gray-500 text-center py-2">
            +{data.length - 5} more items
          </div>
        )}
      </div>

      {/* Chart preview if available */}
      {chartData && (
        <div className="mt-3 h-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded flex items-center justify-center">
          <BarChart3 className="h-6 w-6 text-blue-600" />
          <span className="ml-2 text-xs text-blue-700">Chart visualization available</span>
        </div>
      )}
    </motion.div>
  )
}

function getDataIcon(intent?: string) {
  switch (intent) {
    case 'orders':
      return <Package className="h-4 w-4" />
    case 'inventory':
      return <ShoppingCart className="h-4 w-4" />
    case 'analytics':
      return <TrendingUp className="h-4 w-4" />
    case 'staff':
      return <Users className="h-4 w-4" />
    case 'customers':
      return <Users className="h-4 w-4" />
    default:
      return <BarChart3 className="h-4 w-4" />
  }
}

function getDataTitle(intent?: string) {
  switch (intent) {
    case 'orders':
      return 'Order Summary'
    case 'inventory':
      return 'Inventory Status'
    case 'analytics':
      return 'Performance Metrics'
    case 'staff':
      return 'Staff Information'
    case 'customers':
      return 'Customer Data'
    default:
      return 'Data Overview'
  }
}

function getStatusStyles(status?: string) {
  if (!status) return "bg-gray-100 text-gray-700"
  
  const lowercaseStatus = status.toLowerCase()
  if (lowercaseStatus.includes('completed') || lowercaseStatus.includes('active') || lowercaseStatus.includes('online')) {
    return "bg-green-100 text-green-700"
  }
  if (lowercaseStatus.includes('pending') || lowercaseStatus.includes('processing')) {
    return "bg-yellow-100 text-yellow-700"
  }
  if (lowercaseStatus.includes('failed') || lowercaseStatus.includes('error') || lowercaseStatus.includes('offline')) {
    return "bg-red-100 text-red-700"
  }
  return "bg-blue-100 text-blue-700"
}

// Backoffice Quick Actions Component
export function QuickActions({ 
  actions, 
  onAction 
}: { 
  actions: QuickAction[]
  onAction: (action: string) => void 
}) {
  const groupedActions = actions.reduce((acc, action) => {
    const category = action.category || 'general'
    if (!acc[category]) acc[category] = []
    acc[category].push(action)
    return acc
  }, {} as Record<string, QuickAction[]>)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3 mt-4"
    >
      {Object.entries(groupedActions).map(([category, categoryActions]) => (
        <div key={category}>
          <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
            {category}
          </h4>
          <div className="flex flex-wrap gap-2">
            {categoryActions.map((action, index) => (
              <motion.button
                key={action.action}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onAction(action.action)}
                className={cn(
                  "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  "border border-gray-200 hover:border-blue-300 hover:bg-blue-50",
                  "flex items-center space-x-2"
                )}
              >
                {action.emoji && <span>{action.emoji}</span>}
                <span>{action.label}</span>
              </motion.button>
            ))}
          </div>
        </div>
      ))}
    </motion.div>
  )
}

// Enhanced Typing Indicator Component
export function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex items-center space-x-3 text-gray-500 text-sm mb-4"
    >
      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
        🤖
      </div>
      <div className="flex items-center space-x-1">
        <span>Processing request</span>
        <div className="flex space-x-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2
              }}
              className="w-1 h-1 bg-gray-400 rounded-full"
            />
          ))}
        </div>
      </div>
    </motion.div>
  )
}

// Message history component for conversation management
export function MessageHistory({ 
  messages, 
  onClearHistory 
}: { 
  messages: any[]
  onClearHistory: () => void 
}) {
  if (messages.length === 0) {
    return null
  }

  return (
    <div className="border-t border-gray-200 p-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-gray-700">
          Session History ({messages.length} interactions)
        </h4>
        <button
          onClick={onClearHistory}
          className="text-xs text-gray-500 hover:text-red-500 transition-colors"
        >
          Clear History
        </button>
      </div>
      <p className="text-xs text-gray-500">
        Sesi Anda disimpan otomatis untuk kelancaran operasi backoffice.
      </p>
    </div>
  )
}

// Connection status indicator
export function ConnectionStatus({ 
  status, 
  onRetry 
}: { 
  status: string
  onRetry?: () => void 
}) {
  const statusConfig = {
    connecting: { color: 'yellow', text: 'Menghubungkan ke backoffice...', icon: '🔄' },
    connected: { color: 'green', text: 'Backoffice Online', icon: '✅' },
    disconnected: { color: 'red', text: 'Disconnected', icon: '❌' },
    error: { color: 'red', text: 'Connection Error', icon: '⚠️' }
  }

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.disconnected

  return (
    <div className={cn(
      "flex items-center justify-between p-2 rounded-lg text-xs",
      config.color === 'green' && "bg-green-50 text-green-700",
      config.color === 'yellow' && "bg-yellow-50 text-yellow-700",
      config.color === 'red' && "bg-red-50 text-red-700"
    )}>
      <div className="flex items-center space-x-2">
        <span>{config.icon}</span>
        <span>{config.text}</span>
      </div>
      
      {(status === 'disconnected' || status === 'error') && onRetry && (
        <button
          onClick={onRetry}
          className="px-2 py-1 bg-white rounded border hover:bg-gray-50 transition-colors"
        >
          Retry
        </button>
      )}
    </div>
  )
}