
'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DollarSign, TrendingUp, TrendingDown, PieChart, Plus, Minus, Activity, Bot, ShoppingCart } from 'lucide-react'
import { Portfolio, Position, Trade, TradeData } from '@/lib/types'
import { formatPrice, formatPercent, getChangeColor, formatDate } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { TradeEntryModal } from '@/components/trade-entry-modal'
import { TradeConfirmationModal } from '@/components/trade-confirmation-modal'

export default function PortfolioPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null)
  const [trades, setTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState(true)
  const [tradeModalOpen, setTradeModalOpen] = useState(false)
  const [confirmationModalOpen, setConfirmationModalOpen] = useState(false)
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null)
  const [tradeSide, setTradeSide] = useState<'buy' | 'sell'>('buy')
  const [confirmationData, setConfirmationData] = useState<{
    title: string
    message: string
    isSuccess: boolean
    tradeDetails?: any
  } | null>(null)
  const [accountTier, setAccountTier] = useState<'free' | 'pro' | 'admin'>('free')
  const [aiAnalysis, setAiAnalysis] = useState<{
    recommendation: string
    confidence: number
    reasons?: string[]
    timeHorizon?: string
    riskLevel?: 'low' | 'medium' | 'high'
  } | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user) {
      loadPortfolioData()
      loadAccountTier()
    }
  }, [session])

  const loadPortfolioData = async () => {
    try {
      setLoading(true)

      // Load portfolio
      const portfolioRes = await fetch('/api/portfolio')
      if (portfolioRes.ok) {
        const portfolioData = await portfolioRes.json()
        setPortfolio(portfolioData)
      }

      // Load trade history
      const tradesRes = await fetch('/api/trades')
      if (tradesRes.ok) {
        const tradesData = await tradesRes.json()
        setTrades(tradesData.trades || [])
      }
    } catch (error) {
      console.error('Error loading portfolio data:', error)
      toast({
        title: 'Error',
        description: 'Failed to load portfolio data',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  // Load user account tier
  const loadAccountTier = async () => {
    try {
      const response = await fetch('/api/user')
      if (response.ok) {
        const userData = await response.json()
        setAccountTier(userData.subscription?.tier || 'free')
      }
    } catch (error) {
      console.error('Error loading account tier:', error)
    }
  }

  // Mock AI analysis (in real app, this would call an AI service)
  const generateAIAnalysis = (symbol: string, side: 'buy' | 'sell') => {
    const recommendations = ['buy', 'sell', 'hold']
    const riskLevels: ('low' | 'medium' | 'high')[] = ['low', 'medium', 'high']
    
    return {
      recommendation: side, // Use the intended side for demo
      confidence: Math.random() * 0.4 + 0.6, // 60-100% confidence
      reasons: [
        'Strong technical indicators',
        'Positive market sentiment',
        'Good fundamental analysis'
      ],
      timeHorizon: 'Short-term (1-3 months)',
      riskLevel: riskLevels[Math.floor(Math.random() * riskLevels.length)]
    }
  }

  // Handle comprehensive trade execution
  const handleTrade = async (tradeData: TradeData) => {
    try {
      const response = await fetch('/api/trades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...tradeData,
          type: 'stock' // For now, assume stock trading
        })
      })

      const result = await response.json()

      if (response.ok) {
        setConfirmationData({
          title: 'Trade Executed Successfully',
          message: result.message || `Successfully ${tradeData.side} ${tradeData.quantity} shares of ${tradeData.symbol}`,
          isSuccess: true,
          tradeDetails: result.tradeDetails
        })
        
        // Refresh portfolio data
        loadPortfolioData()
      } else {
        setConfirmationData({
          title: 'Trade Failed',
          message: result.error || 'Failed to execute trade',
          isSuccess: false
        })
      }
    } catch (error: any) {
      console.error('Trade execution error:', error)
      setConfirmationData({
        title: 'Trade Failed',
        message: error.message || 'An unexpected error occurred',
        isSuccess: false
      })
    } finally {
      setConfirmationModalOpen(true)
    }
  }

  // Open trade modal for buying a new position
  const openBuyModal = (symbol?: string) => {
    if (symbol) {
      const position = portfolio?.positions?.find(p => p.symbol === symbol)
      setSelectedPosition(position || null)
      setAiAnalysis(generateAIAnalysis(symbol, 'buy'))
    } else {
      setSelectedPosition(null)
      setAiAnalysis(null)
    }
    setTradeSide('buy')
    setTradeModalOpen(true)
  }

  // Open trade modal for selling an existing position
  const openSellModal = (position: Position) => {
    setSelectedPosition(position)
    setTradeSide('sell')
    setAiAnalysis(generateAIAnalysis(position.symbol, 'sell'))
    setTradeModalOpen(true)
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading portfolio...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Portfolio</h1>
          <p className="text-muted-foreground">
            Manage your investments and trading activity
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => openBuyModal()}>
            <ShoppingCart className="h-4 w-4 mr-2" />
            Buy Stock
          </Button>
          <Badge variant={accountTier === 'free' ? 'secondary' : accountTier === 'pro' ? 'default' : 'destructive'}>
            {accountTier.toUpperCase()} Account
          </Badge>
        </div>
      </div>

      {/* Portfolio Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {portfolio ? formatPrice(portfolio.totalValue) : '$0.00'}
            </div>
            <p className="text-xs text-muted-foreground">
              Portfolio value
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Return</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getChangeColor(portfolio?.totalReturn || 0)}`}>
              {portfolio ? formatPercent(portfolio.totalReturn) : '0.00%'}
            </div>
            <p className="text-xs text-muted-foreground">
              All-time return
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Change</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getChangeColor(portfolio?.dailyReturn || 0)}`}>
              {portfolio ? formatPercent(portfolio.dailyReturn) : '0.00%'}
            </div>
            <p className="text-xs text-muted-foreground">
              24h change
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cash Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {portfolio ? formatPrice(portfolio.cashBalance) : '$0.00'}
            </div>
            <p className="text-xs text-muted-foreground">
              Available cash
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Portfolio Tabs */}
      <Tabs defaultValue="positions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="positions">Positions</TabsTrigger>
          <TabsTrigger value="trades">Trade History</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="positions">
          <Card>
            <CardHeader>
              <CardTitle>Current Positions</CardTitle>
              <CardDescription>Your active investments</CardDescription>
            </CardHeader>
            <CardContent>
              {!portfolio?.positions || portfolio.positions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <PieChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No positions yet</p>
                  <p className="text-sm">Start by making your first trade</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {portfolio.positions.map((position, index) => (
                    <div key={`${position.symbol}-${position.type}-${index}`} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold">{position.symbol}</span>
                            <Badge variant={position.type === 'stock' ? 'default' : 'secondary'}>
                              {position.type}
                            </Badge>
                            {position.unrealizedPnL >= 0 ? (
                              <TrendingUp className="h-4 w-4 text-green-500" />
                            ) : (
                              <TrendingDown className="h-4 w-4 text-red-500" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{position.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {position.quantity.toLocaleString()} shares @ {formatPrice(position.avgPrice)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Current: {formatPrice(position.currentPrice)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right space-y-1">
                          <div className="font-semibold">{formatPrice(position.totalValue)}</div>
                          <div className={`text-sm ${getChangeColor(position.unrealizedPnL)}`}>
                            {position.unrealizedPnL >= 0 ? '+' : ''}{formatPrice(position.unrealizedPnL)}
                          </div>
                          <div className={`text-xs ${getChangeColor(position.unrealizedPnLPercent)}`}>
                            {formatPercent(position.unrealizedPnLPercent)}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => openBuyModal(position.symbol)}
                            className="text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Buy More
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => openSellModal(position)}
                            className="text-red-600 border-red-600 hover:bg-red-50 hover:text-red-700"
                          >
                            <Minus className="h-3 w-3 mr-1" />
                            Sell
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trades">
          <Card>
            <CardHeader>
              <CardTitle>Trade History</CardTitle>
              <CardDescription>Your recent trading activity</CardDescription>
            </CardHeader>
            <CardContent>
              {trades.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No trades yet</p>
                  <p className="text-sm">Your trade history will appear here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {trades.map((trade) => (
                    <div key={trade.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className={`p-2 rounded-full ${trade.action === 'buy' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                          {trade.action === 'buy' ? <Plus className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold">
                              {trade.action.toUpperCase()} {trade.symbol}
                            </span>
                            <Badge variant={trade.type === 'stock' ? 'default' : 'secondary'}>
                              {trade.type}
                            </Badge>
                            <Badge variant={trade.status === 'completed' ? 'success' : trade.status === 'pending' ? 'warning' : 'destructive'}>
                              {trade.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {trade.quantity} shares @ {formatPrice(trade.price)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(trade.executedAt)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{formatPrice(trade.totalValue)}</div>
                        {trade.fee > 0 && (
                          <div className="text-xs text-muted-foreground">
                            Fee: {formatPrice(trade.fee)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>Performance Overview</CardTitle>
              <CardDescription>Your investment performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-primary">
                      {portfolio?.positions?.length || 0}
                    </div>
                    <p className="text-sm text-muted-foreground">Active Positions</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-primary">
                      {trades.length}
                    </div>
                    <p className="text-sm text-muted-foreground">Total Trades</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-primary">
                      {trades.filter(t => t.action === 'buy').length}
                    </div>
                    <p className="text-sm text-muted-foreground">Buy Orders</p>
                  </div>
                </div>

                <div className="text-center py-8 text-muted-foreground">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Performance charts and analytics</p>
                  <p className="text-sm">Advanced portfolio analytics coming soon</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Comprehensive Trade Entry Modal */}
      <TradeEntryModal
        isOpen={tradeModalOpen}
        onClose={() => {
          setTradeModalOpen(false)
          setSelectedPosition(null)
          setAiAnalysis(null)
        }}
        symbol={selectedPosition?.symbol || 'AAPL'}
        side={tradeSide}
        currentPrice={selectedPosition?.currentPrice || 150}
        onTrade={handleTrade}
        analysis={aiAnalysis || undefined}
        currentPosition={selectedPosition}
        accountTier={accountTier}
      />

      {/* Trade Confirmation Modal */}
      <TradeConfirmationModal
        isOpen={confirmationModalOpen}
        onClose={() => {
          setConfirmationModalOpen(false)
          setConfirmationData(null)
        }}
        title={confirmationData?.title || ''}
        message={confirmationData?.message || ''}
        isSuccess={confirmationData?.isSuccess || false}
        tradeDetails={confirmationData?.tradeDetails}
      />
    </div>
  )
}
