
'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AssetSearch } from '@/components/asset-search'
import { UniversalStockCard, UniversalStockCardSkeleton } from '@/components/universal-stock-card'
import { Search, Star, TrendingUp, DollarSign, Volume, Info, ExternalLink, RefreshCw, Brain, Target, AlertTriangle } from 'lucide-react'
import { Asset, AIAnalysis, ChartData, NewsArticle } from '@/lib/types'
import { formatPrice, formatPercent, formatNumber, getChangeColor, formatRelativeTime } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

export default function AnalyzePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const [searchResults, setSearchResults] = useState<Asset[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null)
  const [news, setNews] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState({
    search: false,
    analysis: false,
    news: false
  })
  const [watchlistMap, setWatchlistMap] = useState<Set<string>>(new Set())
  const [showDetailedAnalysis, setShowDetailedAnalysis] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user) {
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

  const handleSearch = async (term: string) => {
    if (!term.trim()) {
      setSearchResults([])
      return
    }

    setLoading(prev => ({ ...prev, search: true }))
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(term)}`)
      if (response.ok) {
        const data = await response.json()
        setSearchResults(data.results || [])
      }
    } catch (error) {
      console.error('Error searching assets:', error)
      toast({
        title: 'Search Error',
        description: 'Failed to search for assets',
        variant: 'destructive',
      })
    } finally {
      setLoading(prev => ({ ...prev, search: false }))
    }
  }

  const handleSelectAsset = async (asset: Asset) => {
    setSelectedAsset(asset)
    setAiAnalysis(null)
    setNews([])
    setShowDetailedAnalysis(false)

    // Load detailed asset data
    await loadAssetData(asset.symbol, asset.type)
  }

  const loadAssetData = async (symbol: string, type: 'stock' | 'crypto') => {
    try {
      // Load AI analysis
      setLoading(prev => ({ ...prev, analysis: true }))
      const analysisRes = await fetch(`/api/analysis/${symbol}?type=${type}`)
      if (analysisRes.ok) {
        const analysisData = await analysisRes.json()
        setAiAnalysis(analysisData.analysis)
      }

      // Load news
      setLoading(prev => ({ ...prev, news: true }))
      const newsRes = await fetch(`/api/news?symbols=${symbol}`)
      if (newsRes.ok) {
        const newsData = await newsRes.json()
        setNews(newsData.articles || [])
      }
    } catch (error) {
      console.error('Error loading asset data:', error)
      toast({
        title: 'Error',
        description: 'Failed to load asset data',
        variant: 'destructive',
      })
    } finally {
      setLoading({
        search: false,
        analysis: false,
        news: false
      })
    }
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
    // Refresh data after trade
    if (selectedAsset) {
      loadAssetData(selectedAsset.symbol, selectedAsset.type)
    }
  }

  const handleRefreshAnalysis = async () => {
    if (!selectedAsset) return
    
    setLoading(prev => ({ ...prev, analysis: true }))
    try {
      const response = await fetch(`/api/analysis/${selectedAsset.symbol}?type=${selectedAsset.type}&refresh=true`)
      if (response.ok) {
        const data = await response.json()
        setAiAnalysis(data.analysis)
        toast({
          title: 'Analysis Updated',
          description: 'AI analysis has been refreshed with latest data',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to refresh analysis',
        variant: 'destructive',
      })
    } finally {
      setLoading(prev => ({ ...prev, analysis: false }))
    }
  }



  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
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
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Asset Analysis</h1>
        <p className="text-muted-foreground">
          Search and analyze stocks and cryptocurrencies with AI-powered insights
        </p>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Asset Search</CardTitle>
          <CardDescription>Find stocks and cryptocurrencies to analyze</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search for stocks or crypto (e.g., AAPL, BTC)..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                handleSearch(e.target.value)
              }}
              className="pl-10"
            />
          </div>
          
          {loading.search && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Search Results</CardTitle>
            <CardDescription>Found {searchResults.length} assets</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {searchResults.map((asset) => (
                <UniversalStockCard
                  key={`${asset.symbol}-${asset.type}`}
                  asset={asset}
                  variant="compact"
                  showActions={false}
                  isInWatchlist={watchlistMap.has(`${asset.symbol}-${asset.type}`)}
                  onWatchlistToggle={handleWatchlistToggle}
                  className="cursor-pointer hover:shadow-md"
                  onClick={() => handleSelectAsset(asset)}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selected Asset Analysis */}
      {selectedAsset && (
        <div className="space-y-6">
          {/* Asset Stock Card */}
          <UniversalStockCard
            asset={selectedAsset}
            variant="detailed"
            showActions={true}
            showChart={true}
            showAnalysis={false}
            analysis={aiAnalysis || undefined}
            isInWatchlist={watchlistMap.has(`${selectedAsset.symbol}-${selectedAsset.type}`)}
            onWatchlistToggle={handleWatchlistToggle}
            onTradeComplete={handleTradeComplete}
          />

          {/* Enhanced AI Analysis */}
          {aiAnalysis && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <Brain className="h-5 w-5 text-primary" />
                    <span>AI Analysis</span>
                  </CardTitle>
                  <CardDescription>
                    Comprehensive analysis for {selectedAsset.symbol}
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefreshAnalysis}
                  disabled={loading.analysis}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading.analysis ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                {loading.analysis ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <>
                    {/* Analysis Summary */}
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <div className="text-2xl font-bold text-primary mb-2">
                          {aiAnalysis.confidence}%
                        </div>
                        <div className="text-sm text-muted-foreground">Confidence</div>
                      </div>
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <div className="text-2xl font-bold mb-2">
                          <Badge 
                            variant={
                              aiAnalysis.recommendation === 'buy' ? 'default' : 
                              aiAnalysis.recommendation === 'sell' ? 'destructive' : 'secondary'
                            }
                            className="text-lg px-3 py-1"
                          >
                            {aiAnalysis.recommendation.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">Recommendation</div>
                      </div>
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <div className="text-2xl font-bold mb-2">
                          <Badge 
                            variant={
                              aiAnalysis.riskLevel === 'low' ? 'default' : 
                              aiAnalysis.riskLevel === 'high' ? 'destructive' : 'secondary'
                            }
                            className="text-lg px-3 py-1"
                          >
                            {aiAnalysis.riskLevel?.toUpperCase() || 'N/A'}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">Risk Level</div>
                      </div>
                    </div>

                    {/* Detailed Scores */}
                    <div className="grid gap-4 md:grid-cols-3">
                      {aiAnalysis.technicalScore && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Technical Score</span>
                            <span className="text-sm text-muted-foreground">
                              {aiAnalysis.technicalScore}/100
                            </span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${aiAnalysis.technicalScore}%` }}
                            />
                          </div>
                        </div>
                      )}
                      {aiAnalysis.fundamentalScore && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Fundamental Score</span>
                            <span className="text-sm text-muted-foreground">
                              {aiAnalysis.fundamentalScore}/100
                            </span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${aiAnalysis.fundamentalScore}%` }}
                            />
                          </div>
                        </div>
                      )}
                      {aiAnalysis.sentimentScore && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Sentiment Score</span>
                            <span className="text-sm text-muted-foreground">
                              {aiAnalysis.sentimentScore}/100
                            </span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div 
                              className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${aiAnalysis.sentimentScore}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Price Targets */}
                    {(aiAnalysis.targetPrice || aiAnalysis.stopLoss) && (
                      <div className="grid gap-4 md:grid-cols-2">
                        {aiAnalysis.targetPrice && (
                          <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <Target className="h-5 w-5 text-green-600" />
                              <span className="font-medium">Target Price</span>
                            </div>
                            <span className="text-lg font-bold text-green-600">
                              {formatPrice(aiAnalysis.targetPrice)}
                            </span>
                          </div>
                        )}
                        {aiAnalysis.stopLoss && (
                          <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <AlertTriangle className="h-5 w-5 text-red-600" />
                              <span className="font-medium">Stop Loss</span>
                            </div>
                            <span className="text-lg font-bold text-red-600">
                              {formatPrice(aiAnalysis.stopLoss)}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Detailed Reasoning */}
                    <div className="bg-muted/30 rounded-lg p-4">
                      <h4 className="font-semibold mb-3 flex items-center space-x-2">
                        <Info className="h-4 w-4" />
                        <span>Analysis Reasoning</span>
                      </h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {aiAnalysis.reasoning}
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Related News */}
          {news.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Related News</CardTitle>
                <CardDescription>Latest news for {selectedAsset.symbol}</CardDescription>
              </CardHeader>
              <CardContent>
                {loading.news ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {news.map((article) => (
                      <div key={article.id} className="relative border rounded-lg p-4 hover:bg-muted/50 transition-colors group cursor-pointer">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                            {article.title}
                          </h4>
                          <a
                            href={article.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-primary" />
                          </a>
                        </div>
                        {article.summary && (
                          <p className="text-sm text-muted-foreground line-clamp-3 mb-2">
                            {article.summary}
                          </p>
                        )}
                        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                          <span>{article.source}</span>
                          <span>•</span>
                          <span>{formatRelativeTime(article.publishedAt)}</span>
                          {article.sentiment !== undefined && (
                            <>
                              <span>•</span>
                              <Badge 
                                variant={article.sentiment > 0.1 ? 'default' : article.sentiment < -0.1 ? 'destructive' : 'secondary'}
                                className="text-xs"
                              >
                                {article.sentiment > 0.1 ? 'Positive' : article.sentiment < -0.1 ? 'Negative' : 'Neutral'}
                              </Badge>
                            </>
                          )}
                        </div>
                        
                        {/* Click overlay */}
                        <a
                          href={article.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="absolute inset-0 z-10"
                          aria-label={`Read full article: ${article.title}`}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
