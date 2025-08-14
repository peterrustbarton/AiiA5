
'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, DollarSign, PieChart, Bell, Plus, Search, ExternalLink, Eye } from 'lucide-react'
import { Portfolio, Asset, NewsArticle } from '@/lib/types'
import { formatPrice, formatPercent, getChangeColor, formatRelativeTime } from '@/lib/utils'
import { UniversalStockCard } from '@/components/universal-stock-card'
import Link from 'next/link'

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null)
  const [watchlist, setWatchlist] = useState<Asset[]>([])
  const [news, setNews] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [watchlistMap, setWatchlistMap] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user) {
      loadDashboardData()
    }
  }, [session])

  const loadDashboardData = async () => {
    try {
      // Load portfolio data
      const portfolioRes = await fetch('/api/portfolio')
      if (portfolioRes.ok) {
        const portfolioData = await portfolioRes.json()
        setPortfolio(portfolioData)
      }

      // Load watchlist
      const watchlistRes = await fetch('/api/watchlist')
      if (watchlistRes.ok) {
        const watchlistData = await watchlistRes.json()
        const watchlistItems = watchlistData.watchlist || []
        setWatchlist(watchlistItems)
        setWatchlistMap(new Set(watchlistItems.map((item: Asset) => `${item.symbol}-${item.type}`)))
      }

      // Load news
      const newsRes = await fetch('/api/news')
      if (newsRes.ok) {
        const newsData = await newsRes.json()
        setNews(newsData.articles?.slice(0, 5) || [])
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
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
          setWatchlist(prev => prev.filter(item => `${item.symbol}-${item.type}` !== key))
          setWatchlistMap(prev => {
            const newSet = new Set(prev)
            newSet.delete(key)
            return newSet
          })
        } else {
          // For adding, we need to fetch the asset data
          const assetRes = await fetch(`/api/assets/${symbol}?type=${type}`)
          if (assetRes.ok) {
            const assetData = await assetRes.json()
            setWatchlist(prev => [...prev, assetData])
            setWatchlistMap(prev => new Set(prev).add(key))
          }
        }
      }
    } catch (error) {
      console.error('Error toggling watchlist:', error)
      throw error
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">
          Welcome back, {session.user?.name || 'Investor'}
        </h1>
        <p className="text-muted-foreground">
          Here's your investment overview for today
        </p>
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
            <CardTitle className="text-sm font-medium">Daily Change</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
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
            <CardTitle className="text-sm font-medium">Total Return</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
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

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Start your investment journey</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Link href="/analyze">
              <Button variant="outline" className="w-full h-16 flex flex-col space-y-2">
                <Search className="h-6 w-6" />
                <span>Analyze Assets</span>
              </Button>
            </Link>
            <Link href="/market-movers">
              <Button variant="outline" className="w-full h-16 flex flex-col space-y-2">
                <TrendingUp className="h-6 w-6" />
                <span>Market Movers</span>
              </Button>
            </Link>
            <Link href="/portfolio">
              <Button variant="outline" className="w-full h-16 flex flex-col space-y-2">
                <PieChart className="h-6 w-6" />
                <span>View Portfolio</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Watchlist */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Your Watchlist</CardTitle>
            <CardDescription>Keep track of your favorite assets</CardDescription>
          </div>
          <Link href="/analyze">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Asset
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {watchlist.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Your watchlist is empty</p>
              <p className="text-sm">Start by analyzing some assets to add them to your watchlist</p>
            </div>
          ) : (
            <div className="space-y-4">
              {watchlist.slice(0, 5).map((asset) => (
                <UniversalStockCard
                  key={`${asset.symbol}-${asset.type}`}
                  asset={asset}
                  variant="compact"
                  showActions={false}
                  isInWatchlist={watchlistMap.has(`${asset.symbol}-${asset.type}`)}
                  onWatchlistToggle={handleWatchlistToggle}
                  className="hover:bg-muted/50"
                />
              ))}
              {watchlist.length > 5 && (
                <div className="text-center">
                  <Link href="/watchlist">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      View All ({watchlist.length})
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Market News */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            <span>Market News</span>
          </CardTitle>
          <CardDescription>Latest financial news and updates</CardDescription>
        </CardHeader>
        <CardContent>
          {news.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No news available at the moment</p>
            </div>
          ) : (
            <div className="space-y-4">
              {news.map((article) => (
                <div key={article.id} className="relative border rounded-lg p-4 hover:bg-muted/50 transition-colors group cursor-pointer">
                  <div className="flex items-start justify-between space-x-4">
                    <div className="flex-1">
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
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
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
                    </div>
                  </div>
                  
                  {/* Click overlay for entire card */}
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
    </div>
  )
}
