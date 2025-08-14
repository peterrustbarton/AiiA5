
'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TrendingUp, TrendingDown, RefreshCw, Filter } from 'lucide-react'
import { Asset } from '@/lib/types'
import { formatPrice, formatPercent, getChangeColor, formatNumber } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { UniversalStockCard, UniversalStockCardSkeleton } from '@/components/universal-stock-card'
import { useToast } from '@/hooks/use-toast'

export default function MarketMoversPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [stockMovers, setStockMovers] = useState<{ gainers: Asset[], losers: Asset[] }>({ gainers: [], losers: [] })
  const [cryptoMovers, setCryptoMovers] = useState<{ gainers: Asset[], losers: Asset[] }>({ gainers: [], losers: [] })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [watchlistMap, setWatchlistMap] = useState<Set<string>>(new Set())
  const [selectedTab, setSelectedTab] = useState<'stocks' | 'crypto'>('stocks')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user) {
      loadMarketData()
      loadWatchlist()
    }
  }, [session])

  const loadWatchlist = async () => {
    try {
      const response = await fetch('/api/watchlist')
      if (response.ok) {
        const data = await response.json()
        const watchlistItems = data.watchlist || []
        setWatchlistMap(new Set(watchlistItems.map((item: Asset) => `${item.symbol}-${item.type}`)))
      }
    } catch (error) {
      console.error('Error loading watchlist:', error)
    }
  }

  const loadMarketData = async () => {
    try {
      setLoading(true)

      // Load stock movers
      const stockRes = await fetch('/api/market-movers?type=stock')
      if (stockRes.ok) {
        const stockData = await stockRes.json()
        setStockMovers(stockData)
      }

      // Load crypto movers
      const cryptoRes = await fetch('/api/market-movers?type=crypto')
      if (cryptoRes.ok) {
        const cryptoData = await cryptoRes.json()
        setCryptoMovers(cryptoData)
      }
    } catch (error) {
      console.error('Error loading market data:', error)
      toast({
        title: 'Error',
        description: 'Failed to load market data',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadMarketData()
    await loadWatchlist()
    setRefreshing(false)
    toast({
      title: 'Market Data Refreshed',
      description: 'Latest market data has been loaded',
    })
  }

  const handleWatchlistToggle = async (symbol: string, type: 'stock' | 'crypto') => {
    try {
      const key = `${symbol}-${type}`
      const isCurrentlyInWatchlist = watchlistMap.has(key)
      
      const response = await fetch('/api/watchlist', {
        method: isCurrentlyInWatchlist ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol, type })
      })

      if (response.ok) {
        if (isCurrentlyInWatchlist) {
          setWatchlistMap(prev => {
            const newSet = new Set(prev)
            newSet.delete(key)
            return newSet
          })
        } else {
          setWatchlistMap(prev => new Set(prev).add(key))
        }
      }
    } catch (error) {
      console.error('Error toggling watchlist:', error)
      throw error
    }
  }

  const handleTradeComplete = () => {
    // Refresh market data after trade
    loadMarketData()
  }

  if (status === 'loading' || loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="h-8 bg-muted rounded w-48 animate-pulse" />
          <div className="h-4 bg-muted rounded w-64 animate-pulse" />
        </div>
        <div className="grid gap-4">
          {[...Array(6)].map((_, i) => (
            <UniversalStockCardSkeleton key={i} variant="compact" />
          ))}
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
          <h1 className="text-3xl font-bold">Market Movers</h1>
          <p className="text-muted-foreground">
            Top gainers and losers in stocks and cryptocurrencies
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Market Movers Tabs */}
      <Tabs defaultValue="stocks" onValueChange={(value) => setSelectedTab(value as 'stocks' | 'crypto')} className="space-y-4">
        <TabsList>
          <TabsTrigger value="stocks">Stocks</TabsTrigger>
          <TabsTrigger value="crypto">Cryptocurrency</TabsTrigger>
        </TabsList>

        <TabsContent value="stocks" className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-2">
            {/* Stock Gainers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-green-600">
                  <TrendingUp className="h-5 w-5" />
                  <span>Top Gainers</span>
                </CardTitle>
                <CardDescription>
                  Best performing stocks today
                </CardDescription>
              </CardHeader>
              <CardContent>
                {stockMovers.gainers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p>No stock gainers available</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {stockMovers.gainers.map((stock, index) => (
                      <div key={`${stock.symbol}-gainer-${index}`} className="relative">
                        <div className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10">
                          <div className="flex items-center justify-center w-6 h-6 bg-green-500/10 text-green-600 rounded-full text-xs font-bold">
                            {index + 1}
                          </div>
                        </div>
                        <div className="pl-10">
                          <UniversalStockCard
                            asset={stock}
                            variant="compact"
                            showActions={true}
                            isInWatchlist={watchlistMap.has(`${stock.symbol}-${stock.type}`)}
                            onWatchlistToggle={handleWatchlistToggle}
                            onTradeComplete={handleTradeComplete}
                            className="hover:shadow-md transition-shadow"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Stock Losers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-red-600">
                  <TrendingDown className="h-5 w-5" />
                  <span>Top Losers</span>
                </CardTitle>
                <CardDescription>
                  Worst performing stocks today
                </CardDescription>
              </CardHeader>
              <CardContent>
                {stockMovers.losers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <TrendingDown className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p>No stock losers available</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {stockMovers.losers.map((stock, index) => (
                      <div key={`${stock.symbol}-loser-${index}`} className="relative">
                        <div className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10">
                          <div className="flex items-center justify-center w-6 h-6 bg-red-500/10 text-red-600 rounded-full text-xs font-bold">
                            {index + 1}
                          </div>
                        </div>
                        <div className="pl-10">
                          <UniversalStockCard
                            asset={stock}
                            variant="compact"
                            showActions={true}
                            isInWatchlist={watchlistMap.has(`${stock.symbol}-${stock.type}`)}
                            onWatchlistToggle={handleWatchlistToggle}
                            onTradeComplete={handleTradeComplete}
                            className="hover:shadow-md transition-shadow"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="crypto" className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-2">
            {/* Crypto Gainers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-green-600">
                  <TrendingUp className="h-5 w-5" />
                  <span>Top Gainers</span>
                </CardTitle>
                <CardDescription>
                  Best performing cryptocurrencies today
                </CardDescription>
              </CardHeader>
              <CardContent>
                {cryptoMovers.gainers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p>No crypto gainers available</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cryptoMovers.gainers.map((crypto, index) => (
                      <div key={`${crypto.symbol}-gainer-${index}`} className="relative">
                        <div className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10">
                          <div className="flex items-center justify-center w-6 h-6 bg-green-500/10 text-green-600 rounded-full text-xs font-bold">
                            {index + 1}
                          </div>
                        </div>
                        <div className="pl-10">
                          <UniversalStockCard
                            asset={crypto}
                            variant="compact"
                            showActions={true}
                            isInWatchlist={watchlistMap.has(`${crypto.symbol}-${crypto.type}`)}
                            onWatchlistToggle={handleWatchlistToggle}
                            onTradeComplete={handleTradeComplete}
                            className="hover:shadow-md transition-shadow"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Crypto Losers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-red-600">
                  <TrendingDown className="h-5 w-5" />
                  <span>Top Losers</span>
                </CardTitle>
                <CardDescription>
                  Worst performing cryptocurrencies today
                </CardDescription>
              </CardHeader>
              <CardContent>
                {cryptoMovers.losers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <TrendingDown className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p>No crypto losers available</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cryptoMovers.losers.map((crypto, index) => (
                      <div key={`${crypto.symbol}-loser-${index}`} className="relative">
                        <div className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10">
                          <div className="flex items-center justify-center w-6 h-6 bg-red-500/10 text-red-600 rounded-full text-xs font-bold">
                            {index + 1}
                          </div>
                        </div>
                        <div className="pl-10">
                          <UniversalStockCard
                            asset={crypto}
                            variant="compact"
                            showActions={true}
                            isInWatchlist={watchlistMap.has(`${crypto.symbol}-${crypto.type}`)}
                            onWatchlistToggle={handleWatchlistToggle}
                            onTradeComplete={handleTradeComplete}
                            className="hover:shadow-md transition-shadow"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
