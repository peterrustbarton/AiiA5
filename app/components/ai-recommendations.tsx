
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from '@/hooks/use-toast'
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
  Target,
  X,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  DollarSign
} from 'lucide-react'

interface Recommendation {
  id: string
  symbol: string
  type: 'stock' | 'crypto'
  recommendation: 'buy' | 'sell' | 'hold'
  confidence: number
  reasoning: string
  targetPrice?: number
  stopLoss?: number
  priority: 'low' | 'medium' | 'high'
  status: 'active' | 'dismissed' | 'executed'
  createdAt: string
  expiresAt: string
  viewedAt?: string
}

interface AIRecommendationsProps {
  limit?: number
  showHeader?: boolean
  compact?: boolean
}

export function AIRecommendations({ limit = 10, showHeader = true, compact = false }: AIRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    loadRecommendations()
  }, [])

  const loadRecommendations = async (refresh = false) => {
    if (refresh) setIsRefreshing(true)
    else setIsLoading(true)

    try {
      const response = await fetch(`/api/recommendations?limit=${limit}&status=active`)
      if (response.ok) {
        const data = await response.json()
        setRecommendations(data.recommendations)
      }
    } catch (error) {
      console.error('Failed to load recommendations:', error)
      toast({
        title: 'Error',
        description: 'Failed to load recommendations',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  const dismissRecommendation = async (id: string) => {
    try {
      const response = await fetch(`/api/recommendations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'dismissed' })
      })

      if (response.ok) {
        setRecommendations(prev => prev.filter(r => r.id !== id))
        toast({
          title: 'Recommendation Dismissed',
          description: 'The recommendation has been removed from your list.',
        })
      }
    } catch (error) {
      console.error('Failed to dismiss recommendation:', error)
    }
  }

  const markAsViewed = async (id: string) => {
    try {
      await fetch(`/api/recommendations/${id}/view`, { method: 'POST' })
    } catch (error) {
      console.error('Failed to mark as viewed:', error)
    }
  }

  const getRecommendationIcon = (recommendation: string) => {
    switch (recommendation) {
      case 'buy': return TrendingUp
      case 'sell': return TrendingDown
      case 'hold': return Activity
      default: return Activity
    }
  }

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'buy': return 'text-green-600 dark:text-green-400'
      case 'sell': return 'text-red-600 dark:text-red-400'
      case 'hold': return 'text-yellow-600 dark:text-yellow-400'
      default: return 'text-muted-foreground'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive'
      case 'medium': return 'default'
      case 'low': return 'secondary'
      default: return 'secondary'
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600'
    if (confidence >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  }

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date()
  }

  if (isLoading) {
    return (
      <Card>
        {showHeader && (
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              AI Recommendations
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse space-y-2">
                <div className="h-4 bg-muted rounded w-1/2"></div>
                <div className="h-8 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (recommendations.length === 0) {
    return (
      <Card>
        {showHeader && (
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              AI Recommendations
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="text-center py-8">
            <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">No active recommendations</p>
            <Button onClick={() => loadRecommendations(true)} disabled={isRefreshing} variant="outline">
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      {showHeader && (
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              AI Recommendations
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadRecommendations(true)}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          <CardDescription>
            Personalized trading recommendations based on AI analysis
          </CardDescription>
        </CardHeader>
      )}
      
      <CardContent>
        <ScrollArea className={compact ? "h-64" : "h-96"}>
          <div className="space-y-3">
            {recommendations.map((rec) => {
              const RecommendationIcon = getRecommendationIcon(rec.recommendation)
              const expired = isExpired(rec.expiresAt)
              
              return (
                <div
                  key={rec.id}
                  className={`p-4 border rounded-lg transition-colors hover:bg-muted/50 ${
                    !rec.viewedAt ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800' : ''
                  }`}
                  onClick={() => !rec.viewedAt && markAsViewed(rec.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`p-2 rounded-full bg-background`}>
                        <RecommendationIcon className={`h-4 w-4 ${getRecommendationColor(rec.recommendation)}`} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{rec.symbol}</h4>
                          <Badge variant="outline" className="text-xs">
                            {rec.type}
                          </Badge>
                          <Badge variant={getPriorityColor(rec.priority)} className="text-xs">
                            {rec.priority}
                          </Badge>
                          {expired && (
                            <Badge variant="outline" className="text-xs text-amber-600">
                              <Clock className="h-3 w-3 mr-1" />
                              Expired
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 mb-2">
                          <span className={`font-bold capitalize ${getRecommendationColor(rec.recommendation)}`}>
                            {rec.recommendation}
                          </span>
                          <span className={`text-sm font-mono ${getConfidenceColor(rec.confidence)}`}>
                            {rec.confidence}% confidence
                          </span>
                        </div>
                        
                        {(rec.targetPrice || rec.stopLoss) && (
                          <div className="flex gap-4 text-sm mb-2">
                            {rec.targetPrice && (
                              <div className="flex items-center gap-1 text-green-600">
                                <Target className="h-3 w-3" />
                                Target: {formatCurrency(rec.targetPrice)}
                              </div>
                            )}
                            {rec.stopLoss && (
                              <div className="flex items-center gap-1 text-red-600">
                                <AlertTriangle className="h-3 w-3" />
                                Stop: {formatCurrency(rec.stopLoss)}
                              </div>
                            )}
                          </div>
                        )}
                        
                        {!compact && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {rec.reasoning}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {new Date(rec.createdAt).toLocaleDateString()}
                          {rec.expiresAt && (
                            <>
                              <span>•</span>
                              <span>Expires: {new Date(rec.expiresAt).toLocaleDateString()}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        dismissRecommendation(rec.id)
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

export function QuickRecommendationCard({ symbol, type }: { symbol: string, type: 'stock' | 'crypto' }) {
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    loadQuickRecommendation()
  }, [symbol, type])

  const loadQuickRecommendation = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/recommendations/quick?symbol=${symbol}&type=${type}`)
      if (response.ok) {
        const data = await response.json()
        setRecommendation(data.recommendation)
      }
    } catch (error) {
      console.error('Failed to load quick recommendation:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getRecommendationIcon = (recommendation: string) => {
    switch (recommendation) {
      case 'buy': return TrendingUp
      case 'sell': return TrendingDown
      case 'hold': return Activity
      default: return Activity
    }
  }

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'buy': return 'text-green-600 dark:text-green-400'
      case 'sell': return 'text-red-600 dark:text-red-400'
      case 'hold': return 'text-yellow-600 dark:text-yellow-400'
      default: return 'text-muted-foreground'
    }
  }

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-muted rounded w-32"></div>
      </div>
    )
  }

  if (!recommendation) {
    return null
  }

  const RecommendationIcon = getRecommendationIcon(recommendation.recommendation)

  return (
    <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
      <RecommendationIcon className={`h-4 w-4 ${getRecommendationColor(recommendation.recommendation)}`} />
      <span className={`font-medium capitalize ${getRecommendationColor(recommendation.recommendation)}`}>
        {recommendation.recommendation}
      </span>
      <span className="text-sm text-muted-foreground">
        {recommendation.confidence}%
      </span>
    </div>
  )
}
