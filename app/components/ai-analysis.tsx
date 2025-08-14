
'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Brain, TrendingUp, TrendingDown, Minus, Target, Shield, RefreshCw } from 'lucide-react'
import { AIAnalysis } from '@/lib/types'
import { formatPrice, formatPercent } from '@/lib/utils'

interface AIAnalysisProps {
  analysis: AIAnalysis | null
  loading: boolean
  onRefresh?: () => void
}

export function AIAnalysisComponent({ analysis, loading, onRefresh }: AIAnalysisProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="h-5 w-5" />
            <span>AI Analysis</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Analyzing...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!analysis) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="h-5 w-5" />
            <span>AI Analysis</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">
            <p>No analysis available</p>
            {onRefresh && (
              <Button variant="outline" onClick={onRefresh} className="mt-4">
                <RefreshCw className="h-4 w-4 mr-2" />
                Generate Analysis
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  const getRecommendationIcon = (recommendation: string) => {
    switch (recommendation.toLowerCase()) {
      case 'buy':
        return <TrendingUp className="h-5 w-5 text-green-500" />
      case 'sell':
        return <TrendingDown className="h-5 w-5 text-red-500" />
      default:
        return <Minus className="h-5 w-5 text-yellow-500" />
    }
  }

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation.toLowerCase()) {
      case 'buy':
        return 'success'
      case 'sell':
        return 'destructive'
      default:
        return 'warning'
    }
  }

  const getRiskColor = (riskLevel?: string) => {
    switch (riskLevel?.toLowerCase()) {
      case 'low':
        return 'success'
      case 'high':
        return 'destructive'
      default:
        return 'warning'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Brain className="h-5 w-5" />
            <span>AI Analysis</span>
          </div>
          {onRefresh && (
            <Button variant="ghost" size="sm" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Recommendation */}
        <div className="text-center p-6 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-center space-x-2 mb-2">
            {getRecommendationIcon(analysis.recommendation)}
            <Badge variant={getRecommendationColor(analysis.recommendation) as any} className="text-lg px-4 py-1">
              {analysis.recommendation.toUpperCase()}
            </Badge>
          </div>
          <div className="text-3xl font-bold text-primary mb-2">
            {analysis.confidence}%
          </div>
          <p className="text-sm text-muted-foreground">Confidence Score</p>
        </div>

        {/* Summary Metrics */}
        <div className="grid grid-cols-2 gap-4">
          {analysis.technicalScore !== undefined && (
            <div className="text-center p-4 bg-card rounded-lg">
              <div className="text-2xl font-semibold">{analysis.technicalScore}%</div>
              <p className="text-sm text-muted-foreground">Technical Score</p>
            </div>
          )}
          {analysis.fundamentalScore !== undefined && (
            <div className="text-center p-4 bg-card rounded-lg">
              <div className="text-2xl font-semibold">{analysis.fundamentalScore}%</div>
              <p className="text-sm text-muted-foreground">Fundamental Score</p>
            </div>
          )}
          {analysis.sentimentScore !== undefined && (
            <div className="text-center p-4 bg-card rounded-lg">
              <div className="text-2xl font-semibold">{analysis.sentimentScore}%</div>
              <p className="text-sm text-muted-foreground">Sentiment Score</p>
            </div>
          )}
          {analysis.riskLevel && (
            <div className="text-center p-4 bg-card rounded-lg">
              <div className="flex items-center justify-center space-x-1">
                <Shield className="h-4 w-4" />
                <Badge variant={getRiskColor(analysis.riskLevel) as any}>
                  {analysis.riskLevel.toUpperCase()}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">Risk Level</p>
            </div>
          )}
        </div>

        {/* Price Targets */}
        {(analysis.targetPrice || analysis.stopLoss) && (
          <div className="space-y-3">
            <h4 className="font-semibold flex items-center space-x-2">
              <Target className="h-4 w-4" />
              <span>Price Targets</span>
            </h4>
            <div className="grid grid-cols-2 gap-4">
              {analysis.targetPrice && (
                <div className="text-center p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <div className="text-lg font-semibold text-green-500">
                    {formatPrice(analysis.targetPrice)}
                  </div>
                  <p className="text-sm text-muted-foreground">Target Price</p>
                </div>
              )}
              {analysis.stopLoss && (
                <div className="text-center p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <div className="text-lg font-semibold text-red-500">
                    {formatPrice(analysis.stopLoss)}
                  </div>
                  <p className="text-sm text-muted-foreground">Stop Loss</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Reasoning */}
        <div className="space-y-3">
          <h4 className="font-semibold">Analysis Reasoning</h4>
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-sm leading-relaxed">{analysis.reasoning}</p>
          </div>
        </div>

        {/* Timestamp */}
        <div className="text-center text-xs text-muted-foreground">
          Last updated: {new Date(analysis.lastUpdated).toLocaleString()}
        </div>
      </CardContent>
    </Card>
  )
}
