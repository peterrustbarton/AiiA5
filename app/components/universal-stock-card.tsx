
'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  TrendingUp, 
  TrendingDown, 
  ChevronDown, 
  ChevronUp, 
  BarChart3, 
  Info, 
  DollarSign,
  Volume2,
  Clock,
  Star,
  StarOff
} from 'lucide-react'
import { Asset, AIAnalysis } from '@/lib/types'
import { formatPrice, formatPercent, getChangeColor, cn } from '@/lib/utils'
import { PriceChart } from '@/components/price-chart'
import { TradeEntryModal } from '@/components/trade-entry-modal'
import { useSession } from 'next-auth/react'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'

interface UniversalStockCardProps {
  asset: Asset
  variant?: 'default' | 'compact' | 'detailed'
  showActions?: boolean
  showChart?: boolean
  showAnalysis?: boolean
  analysis?: AIAnalysis
  isInWatchlist?: boolean
  onWatchlistToggle?: (symbol: string, type: 'stock' | 'crypto') => Promise<void>
  onTradeComplete?: () => void
  onClick?: () => void
  className?: string
}

export function UniversalStockCard({
  asset,
  variant = 'default',
  showActions = true,
  showChart = false,
  showAnalysis = false,
  analysis,
  isInWatchlist = false,
  onWatchlistToggle,
  onTradeComplete,
  onClick,
  className
}: UniversalStockCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false)
  const [tradeSide, setTradeSide] = useState<'buy' | 'sell'>('buy')
  const [watchlistLoading, setWatchlistLoading] = useState(false)
  const { data: session } = useSession()
  const { toast } = useToast()

  const userTier = (session?.user as any)?.accountTier || 'Free'
  const isPositive = asset.changePercent > 0

  const handleWatchlistToggle = async () => {
    if (!onWatchlistToggle) return
    
    setWatchlistLoading(true)
    try {
      await onWatchlistToggle(asset.symbol, asset.type)
      toast({
        title: isInWatchlist ? 'Removed from Watchlist' : 'Added to Watchlist',
        description: `${asset.symbol} ${isInWatchlist ? 'removed from' : 'added to'} your watchlist`,
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update watchlist',
        variant: 'destructive',
      })
    } finally {
      setWatchlistLoading(false)
    }
  }

  const handleTradeClick = (side: 'buy' | 'sell') => {
    if (!session) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to trade',
        variant: 'destructive',
      })
      return
    }

    setTradeSide(side)
    setIsTradeModalOpen(true)
  }

  const handleTradeSubmit = async (tradeData: any) => {
    try {
      const response = await fetch('/api/trades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...tradeData,
          symbol: asset.symbol,
          type: asset.type,
          currentPrice: asset.price,
        }),
      })

      if (!response.ok) {
        throw new Error('Trade failed')
      }

      toast({
        title: 'Trade Submitted',
        description: `${tradeData.side.toUpperCase()} order for ${asset.symbol} has been submitted`,
      })

      setIsTradeModalOpen(false)
      onTradeComplete?.()
    } catch (error) {
      toast({
        title: 'Trade Failed',
        description: 'Failed to submit trade order',
        variant: 'destructive',
      })
    }
  }

  if (variant === 'compact') {
    return (
      <Card 
        className={cn('hover:shadow-md transition-all duration-200', onClick && 'cursor-pointer', className)}
        onClick={onClick}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-semibold">{asset.symbol}</span>
                  <Badge variant={asset.type === 'stock' ? 'default' : 'secondary'}>
                    {asset.type}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                  {asset.name}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold">{formatPrice(asset.price)}</p>
              <div className={cn('flex items-center space-x-1 text-sm', getChangeColor(asset.changePercent))}>
                {isPositive ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                <span>{formatPercent(asset.changePercent)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card 
        className={cn(
          'hover:shadow-lg transition-all duration-200 overflow-hidden',
          isExpanded && 'shadow-lg',
          onClick && 'cursor-pointer',
          className
        )}
        onClick={onClick}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <CardTitle className="text-lg">{asset.symbol}</CardTitle>
                <Badge variant={asset.type === 'stock' ? 'default' : 'secondary'}>
                  {asset.type}
                </Badge>
                {analysis && (
                  <Badge 
                    variant={
                      analysis.recommendation === 'buy' ? 'default' : 
                      analysis.recommendation === 'sell' ? 'destructive' : 'secondary'
                    }
                    className="text-xs"
                  >
                    {analysis.recommendation.toUpperCase()}
                  </Badge>
                )}
              </div>
              <CardDescription className="line-clamp-1">
                {asset.name}
              </CardDescription>
            </div>
            
            {onWatchlistToggle && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleWatchlistToggle}
                disabled={watchlistLoading}
                className="shrink-0"
              >
                {watchlistLoading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : isInWatchlist ? (
                  <Star className="h-4 w-4 fill-current" />
                ) : (
                  <StarOff className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Price Display */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">
                {formatPrice(asset.price)}
              </div>
              <div className={cn('flex items-center space-x-1 text-sm', getChangeColor(asset.changePercent))}>
                {isPositive ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                <span>{formatPercent(asset.changePercent)}</span>
                <span>({formatPrice(asset.change)})</span>
              </div>
            </div>
            
            {variant === 'detailed' && (
              <div className="grid grid-cols-2 gap-4 text-sm">
                {asset.volume && (
                  <div className="flex items-center space-x-1">
                    <Volume2 className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Volume:</span>
                    <span>{asset.volume.toLocaleString()}</span>
                  </div>
                )}
                {asset.marketCap && (
                  <div className="flex items-center space-x-1">
                    <DollarSign className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Market Cap:</span>
                    <span>{formatPrice(asset.marketCap)}</span>
                  </div>
                )}
                {asset.high24h && (
                  <div className="flex items-center space-x-1">
                    <TrendingUp className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">24h High:</span>
                    <span>{formatPrice(asset.high24h)}</span>
                  </div>
                )}
                {asset.low24h && (
                  <div className="flex items-center space-x-1">
                    <TrendingDown className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">24h Low:</span>
                    <span>{formatPrice(asset.low24h)}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* AI Analysis Preview */}
          {analysis && (
            <div className="bg-muted/50 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Info className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">AI Analysis</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  {analysis.confidence}% confidence
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {analysis.reasoning}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          {showActions && session && (
            <div className="flex space-x-2">
              <Button
                onClick={() => handleTradeClick('buy')}
                className="flex-1"
                disabled={userTier === 'Free' && asset.type === 'crypto'}
              >
                Buy {asset.symbol}
              </Button>
              <Button
                onClick={() => handleTradeClick('sell')}
                variant="outline"
                className="flex-1"
                disabled={userTier === 'Free' && asset.type === 'crypto'}
              >
                Sell {asset.symbol}
              </Button>
            </div>
          )}

          {userTier === 'Free' && asset.type === 'crypto' && (
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-2">
                Crypto trading requires Pro subscription
              </p>
              <Link href="/settings?tab=subscription">
                <Button size="sm" variant="outline">
                  Upgrade to Pro
                </Button>
              </Link>
            </div>
          )}

          {/* Expandable Content */}
          {(showChart || showAnalysis) && (
            <div className="space-y-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full justify-between"
              >
                <span className="flex items-center space-x-2">
                  <BarChart3 className="h-4 w-4" />
                  <span>
                    {isExpanded ? 'Hide Details' : 'Show Details'}
                  </span>
                </span>
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>

              {isExpanded && (
                <div className="space-y-4 pt-2 border-t">
                  {showChart && (
                    <div className="h-64">
                      <PriceChart
                        symbol={asset.symbol}
                        data={[]}
                        height={240}
                      />
                    </div>
                  )}
                  
                  {showAnalysis && analysis && (
                    <div className="space-y-3">
                      <h4 className="font-semibold text-sm">Detailed Analysis</h4>
                      
                      <div className="grid grid-cols-3 gap-4">
                        {analysis.technicalScore && (
                          <div className="text-center">
                            <div className="text-lg font-bold text-blue-400">
                              {analysis.technicalScore}/100
                            </div>
                            <div className="text-xs text-muted-foreground">Technical</div>
                          </div>
                        )}
                        {analysis.fundamentalScore && (
                          <div className="text-center">
                            <div className="text-lg font-bold text-green-400">
                              {analysis.fundamentalScore}/100
                            </div>
                            <div className="text-xs text-muted-foreground">Fundamental</div>
                          </div>
                        )}
                        {analysis.sentimentScore && (
                          <div className="text-center">
                            <div className="text-lg font-bold text-purple-400">
                              {analysis.sentimentScore}/100
                            </div>
                            <div className="text-xs text-muted-foreground">Sentiment</div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Risk Level:</span>
                          <Badge 
                            variant={
                              analysis.riskLevel === 'low' ? 'default' : 
                              analysis.riskLevel === 'high' ? 'destructive' : 'secondary'
                            }
                          >
                            {analysis.riskLevel}
                          </Badge>
                        </div>
                        
                        {analysis.targetPrice && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Target Price:</span>
                            <span className="font-semibold">{formatPrice(analysis.targetPrice)}</span>
                          </div>
                        )}
                        
                        {analysis.stopLoss && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Stop Loss:</span>
                            <span className="font-semibold">{formatPrice(analysis.stopLoss)}</span>
                          </div>
                        )}
                      </div>

                      <div className="bg-muted/30 rounded-lg p-3">
                        <h5 className="font-medium text-sm mb-2">AI Reasoning</h5>
                        <p className="text-sm text-muted-foreground">
                          {analysis.reasoning}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trade Modal */}
      {isTradeModalOpen && (
        <TradeEntryModal
          isOpen={isTradeModalOpen}
          onClose={() => setIsTradeModalOpen(false)}
          symbol={asset.symbol}
          side={tradeSide}
          currentPrice={asset.price}
          onTrade={handleTradeSubmit}
          analysis={analysis ? {
            recommendation: analysis.recommendation,
            confidence: analysis.confidence,
            reasons: [analysis.reasoning],
            riskLevel: analysis.riskLevel,
          } : undefined}
          accountTier={userTier}
        />
      )}
    </>
  )
}

export function UniversalStockCardSkeleton({ variant = 'default' }: { variant?: 'default' | 'compact' | 'detailed' }) {
  if (variant === 'compact') {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-4 w-12" />
                </div>
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
            <div className="text-right space-y-2">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-4 w-12" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            <div className="flex items-center space-x-2">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-12" />
            </div>
            <Skeleton className="h-4 w-40" />
          </div>
          <Skeleton className="h-8 w-8 rounded" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
        <Skeleton className="h-16 w-full rounded-lg" />
        <div className="flex space-x-2">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 flex-1" />
        </div>
      </CardContent>
    </Card>
  )
}
