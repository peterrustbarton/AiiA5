
'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/hooks/use-toast'
import {
  MessageCircle,
  Send,
  Bot,
  User,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  Trash2,
  TrendingUp,
  DollarSign,
  BarChart3,
  AlertTriangle
} from 'lucide-react'

interface ChatMessage {
  id: string
  message: string
  response: string
  createdAt: string
  feedback?: 'helpful' | 'not_helpful'
}

interface QuickAction {
  label: string
  query: string
  icon: any
}

const quickActions: QuickAction[] = [
  {
    label: 'Market Summary',
    query: 'Give me a summary of today\'s market performance',
    icon: TrendingUp
  },
  {
    label: 'Portfolio Analysis',
    query: 'Analyze my current portfolio and suggest improvements',
    icon: BarChart3
  },
  {
    label: 'Risk Assessment',
    query: 'What are the current market risks I should be aware of?',
    icon: AlertTriangle
  },
  {
    label: 'Investment Ideas',
    query: 'Suggest some investment opportunities based on current market conditions',
    icon: DollarSign
  }
]

export function AIAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadChatHistory()
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadChatHistory = async () => {
    try {
      const response = await fetch('/api/chat/history')
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
      }
    } catch (error) {
      console.error('Failed to load chat history:', error)
    } finally {
      setIsLoadingHistory(false)
    }
  }

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight
      }
    }
  }

  const sendMessage = async (messageText: string = input) => {
    if (!messageText.trim() || isLoading) return

    setIsLoading(true)
    const userMessage = messageText.trim()
    setInput('')

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage })
      })

      if (response.ok) {
        const data = await response.json()
        setMessages(prev => [...prev, data.message])
      } else {
        throw new Error('Failed to get response')
      }
    } catch (error) {
      console.error('Chat error:', error)
      toast({
        title: 'Error',
        description: 'Failed to get AI response. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }

  const provideFeedback = async (messageId: string, feedback: 'helpful' | 'not_helpful') => {
    try {
      await fetch(`/api/chat/${messageId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback })
      })

      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId ? { ...msg, feedback } : msg
        )
      )

      toast({
        title: 'Feedback Recorded',
        description: 'Thank you for your feedback!',
      })
    } catch (error) {
      console.error('Feedback error:', error)
    }
  }

  const clearHistory = async () => {
    try {
      await fetch('/api/chat/history', { method: 'DELETE' })
      setMessages([])
      toast({
        title: 'History Cleared',
        description: 'Chat history has been cleared.',
      })
    } catch (error) {
      console.error('Clear history error:', error)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  if (isLoadingHistory) {
    return (
      <Card className="h-[600px]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            AI Assistant
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-20 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              AI Assistant
            </CardTitle>
            <CardDescription>
              Get investment insights and analysis from our AI
            </CardDescription>
          </div>
          {messages.length > 0 && (
            <Button variant="outline" size="sm" onClick={clearHistory}>
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col space-y-4">
        {/* Quick Actions */}
        {messages.length === 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">Quick Actions</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {quickActions.map((action, index) => {
                const Icon = action.icon
                return (
                  <Button
                    key={index}
                    variant="outline"
                    className="h-auto p-3 justify-start"
                    onClick={() => sendMessage(action.query)}
                    disabled={isLoading}
                  >
                    <Icon className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="text-left text-sm">{action.label}</span>
                  </Button>
                )
              })}
            </div>
          </div>
        )}

        {/* Chat Messages */}
        <ScrollArea className="flex-1" ref={scrollAreaRef}>
          <div className="space-y-4 pr-4">
            {messages.map((message) => (
              <div key={message.id} className="space-y-3">
                {/* User Message */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4" />
                  </div>
                  <div className="bg-muted p-3 rounded-lg flex-1">
                    <p className="text-sm">{message.message}</p>
                  </div>
                </div>

                {/* AI Response */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <div className="bg-card border rounded-lg p-3 flex-1">
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      {message.response.split('\n').map((line, index) => (
                        <p key={index} className="mb-2 last:mb-0">{line}</p>
                      ))}
                    </div>
                    
                    {/* Feedback Buttons */}
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                      <span className="text-xs text-muted-foreground">Was this helpful?</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => provideFeedback(message.id, 'helpful')}
                        disabled={!!message.feedback}
                        className={message.feedback === 'helpful' ? 'text-green-600' : ''}
                      >
                        <ThumbsUp className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => provideFeedback(message.id, 'not_helpful')}
                        disabled={!!message.feedback}
                        className={message.feedback === 'not_helpful' ? 'text-red-600' : ''}
                      >
                        <ThumbsDown className="h-3 w-3" />
                      </Button>
                      {message.feedback && (
                        <Badge variant="outline" className="text-xs">
                          Feedback recorded
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div className="bg-card border rounded-lg p-3 flex-1">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            placeholder="Ask me about investments, market analysis, or trading strategies..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
          />
          <Button 
            onClick={() => sendMessage()} 
            disabled={!input.trim() || isLoading}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
