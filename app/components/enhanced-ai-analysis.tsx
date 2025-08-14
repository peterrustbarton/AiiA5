
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from '@/hooks/use-toast'
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Activity,
  Target,
  Shield,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  BarChart3,
  DollarSign,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  BookOpen
} from 'lucide-react'

interface AIAnalysisData {
  id: string
  symbol: string
  type: 'stock' | 'crypto'
  recommendation: 'buy' | 'sell' | 'hold'
  confidence: number
  reasoning: string
  technicalScore: number
  fundamentalScore?: number
  sentimentScore: number
  riskLevel: 'low' | 'medium' | 'high'
  targetPrice?: number
  stopLoss?: number
  dataSource?: any
  createdAt: string
  expiresAt: string
}

interface EnhancedAIAnalysisProps {
  symbol: string
  type: 'stock' | 'crypto'
  onAnalysisUpdate?: (analysis: AIAnalysisData) => void
}

export function EnhancedAIAnalysis({ symbol, type, onAnalysisUpdate }: EnhancedAIAnalysisProps) {
  const [analysis, setAnalysis] = useState<AIAnalysisData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    loadAnalysis()
  }, [symbol, type])

  const loadAnalysis = async (refresh = false) => {
    setIsLoading(true)
    try {
      const response = await fetch(
        `/api/analysis/${symbol}?type=${type}&refresh=${refresh}`
      )
      
      if (response.ok) {
        const data = await response.json()
        setAnalysis(data.analysis)
        onAnalysisUpdate?.(data.analysis)
      } else {
        throw new Error('Failed to load analysis')
      }
    } catch (error) {
      console.error('Analysis error:', error)
      toast({
        title: 'Analysis Error',
        description: 'Failed to load AI analysis. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
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

  const getRecommendationIcon = (recommendation: string) => {
    switch (recommendation) {
      case 'buy': return TrendingUp
      case 'sell': return TrendingDown
      case 'hold': return Activity
      default: return Activity
    }
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600'
      case 'medium': return 'text-yellow-600'
      case 'high': return 'text-red-600'
      default: return 'text-muted-foreground'
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

  const isAnalysisExpired = () => {
    if (!analysis) return false
    return new Date(analysis.expiresAt) < new Date()
  }

  if (isLoading && !analysis) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-muted rounded w-1/2"></div>
              <div className="h-20 bg-muted rounded"></div>
              <div className="h-4 bg-muted rounded w-3/4"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!analysis) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">No analysis available</p>
            <Button onClick={() => loadAnalysis(true)} disabled={isLoading}>
              Generate Analysis
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const RecommendationIcon = getRecommendationIcon(analysis.recommendation)

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Analysis for {symbol}
          </CardTitle>
          <div className="flex items-center gap-2">
            {isAnalysisExpired() && (
              <Badge variant="outline" className="text-amber-600">
                <Clock className="h-3 w-3 mr-1" />
                Expired
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadAnalysis(true)}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
        <CardDescription>
          Advanced AI-powered analysis with confidence scoring
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Main Recommendation */}
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full bg-background`}>
              <RecommendationIcon className={`h-6 w-6 ${getRecommendationColor(analysis.recommendation)}`} />
            </div>
            <div>
              <h3 className={`text-xl font-bold capitalize ${getRecommendationColor(analysis.recommendation)}`}>
                {analysis.recommendation}
              </h3>
              <p className="text-sm text-muted-foreground">
                Last updated: {new Date(analysis.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <div className={`text-2xl font-bold ${getConfidenceColor(analysis.confidence)}`}>
              {analysis.confidence}%
            </div>
            <p className="text-sm text-muted-foreground">Confidence</p>
          </div>
        </div>

        {/* Confidence Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Confidence Level</span>
            <span className={getConfidenceColor(analysis.confidence)}>
              {analysis.confidence}%
            </span>
          </div>
          <Progress 
            value={analysis.confidence} 
            className="h-2"
          />
        </div>

        {/* Score Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="text-sm font-medium">Technical</span>
            </div>
            <div className="flex items-center gap-2">
              <Progress value={analysis.technicalScore} className="flex-1 h-2" />
              <span className="text-sm font-mono w-8">{analysis.technicalScore}%</span>
            </div>
          </div>

          {analysis.fundamentalScore && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                <span className="text-sm font-medium">Fundamental</span>
              </div>
              <div className="flex items-center gap-2">
                <Progress value={analysis.fundamentalScore} className="flex-1 h-2" />
                <span className="text-sm font-mono w-8">{analysis.fundamentalScore}%</span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              <span className="text-sm font-medium">Sentiment</span>
            </div>
            <div className="flex items-center gap-2">
              <Progress value={analysis.sentimentScore} className="flex-1 h-2" />
              <span className="text-sm font-mono w-8">{analysis.sentimentScore}%</span>
            </div>
          </div>
        </div>

        {/* Risk Assessment */}
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="font-medium">Risk Level</span>
          </div>
          <Badge variant="outline" className={getRiskColor(analysis.riskLevel)}>
            {analysis.riskLevel.toUpperCase()}
          </Badge>
        </div>

        {/* Price Targets */}
        {(analysis.targetPrice || analysis.stopLoss) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {analysis.targetPrice && (
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-green-600" />
                  <span className="font-medium">Target Price</span>
                </div>
                <span className="font-mono text-green-600">
                  {formatCurrency(analysis.targetPrice)}
                </span>
              </div>
            )}

            {analysis.stopLoss && (
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="font-medium">Stop Loss</span>
                </div>
                <span className="font-mono text-red-600">
                  {formatCurrency(analysis.stopLoss)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Reasoning */}
        <div className="space-y-3">
          <Button
            variant="ghost"
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full justify-between"
          >
            <span className="font-medium">Analysis Reasoning</span>
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
          
          {isExpanded && (
            <ScrollArea className="h-32 w-full rounded-md border p-4">
              <p className="text-sm leading-relaxed">{analysis.reasoning}</p>
            </ScrollArea>
          )}
        </div>

        {/* Technical Details */}
        {analysis.dataSource && (
          <div className="space-y-3">
            <Button
              variant="ghost"
              onClick={() => setShowDetails(!showDetails)}
              className="w-full justify-between"
            >
              <span className="font-medium">Technical Details</span>
              {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            
            {showDetails && (
              <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Data Sources:</span>
                    <span className="ml-2 font-mono">
                      {analysis.dataSource.dataSourcesUsed || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Volatility:</span>
                    <span className="ml-2 font-mono">
                      {analysis.dataSource.volatility?.toFixed(2) || 'N/A'}%
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Trend:</span>
                    <span className="ml-2 font-mono">
                      {analysis.dataSource.trendDirection || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">News Articles:</span>
                    <span className="ml-2 font-mono">
                      {analysis.dataSource.newsCount || 0}
                    </span>
                  </div>
                </div>

                {analysis.dataSource.confidenceFactors && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">Confidence Breakdown:</h4>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span>Base Score:</span>
                        <span>{analysis.dataSource.confidenceFactors.baseConfidence}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Data Quality:</span>
                        <span>+{analysis.dataSource.confidenceFactors.dataQualityBoost}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Volume:</span>
                        <span>+{analysis.dataSource.confidenceFactors.volumeBoost}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>News:</span>
                        <span>+{analysis.dataSource.confidenceFactors.newsBoost}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Sentiment:</span>
                        <span>+{analysis.dataSource.confidenceFactors.sentimentBoost}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Volatility Penalty:</span>
                        <span>{analysis.dataSource.confidenceFactors.volatilityPenalty}</span>
                      </div>
                      <Separator className="my-1" />
                      <div className="flex justify-between font-medium">
                        <span>Final Score:</span>
                        <span>{analysis.dataSource.confidenceFactors.finalConfidence}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
