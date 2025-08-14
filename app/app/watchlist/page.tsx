
'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, Plus, Filter, ArrowUpDown } from 'lucide-react'
import { Asset } from '@/lib/types'
import { UniversalStockCard, UniversalStockCardSkeleton } from '@/components/universal-stock-card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Link from 'next/link'

export default function WatchlistPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [watchlist, setWatchlist] = useState<Asset[]>([])
  const [filteredWatchlist, setFilteredWatchlist] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'stock' | 'crypto'>('all')
  const [sortBy, setSortBy] = useState<'symbol' | 'price' | 'change'>('symbol')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [watchlistMap, setWatchlistMap] = useState<Set<string>>(new Set())

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

  useEffect(() => {
    filterAndSortWatchlist()
  }, [watchlist, searchTerm, typeFilter, sortBy, sortOrder])

  const loadWatchlist = async () => {
    try {
      const response = await fetch('/api/watchlist')
      if (response.ok) {
        const data = await response.json()
        const watchlistItems = data.watchlist || []
        setWatchlist(watchlistItems)
        setWatchlistMap(new Set(watchlistItems.map((item: Asset) => `${item.symbol}-${item.type}`)))
      }
    } catch (error) {
      console.error('Error loading watchlist:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterAndSortWatchlist = () => {
    let filtered = watchlist.filter(asset => {
      const matchesSearch = asset.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           asset.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesType = typeFilter === 'all' || asset.type === typeFilter
      return matchesSearch && matchesType
    })

    filtered.sort((a, b) => {
      let aVal, bVal
      switch (sortBy) {
        case 'price':
          aVal = a.price
          bVal = b.price
          break
        case 'change':
          aVal = a.changePercent
          bVal = b.changePercent
          break
        default:
          aVal = a.symbol
          bVal = b.symbol
          break
      }

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      }
      
      return sortOrder === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number)
    })

    setFilteredWatchlist(filtered)
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
        }
      }
    } catch (error) {
      console.error('Error toggling watchlist:', error)
      throw error
    }
  }

  const handleTradeComplete = () => {
    // Refresh watchlist after trade
    loadWatchlist()
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
            <UniversalStockCardSkeleton key={i} />
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
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Your Watchlist</h1>
        <p className="text-muted-foreground">
          Track your favorite assets and stay updated on their performance
        </p>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Filter & Sort</CardTitle>
          <CardDescription>Customize your watchlist view</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search assets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Type Filter */}
            <Select value={typeFilter} onValueChange={(value: 'all' | 'stock' | 'crypto') => setTypeFilter(value)}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="stock">Stocks</SelectItem>
                <SelectItem value="crypto">Crypto</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort By */}
            <Select value={sortBy} onValueChange={(value: 'symbol' | 'price' | 'change') => setSortBy(value)}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="symbol">Symbol</SelectItem>
                <SelectItem value="price">Price</SelectItem>
                <SelectItem value="change">Change</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort Order */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="w-full sm:w-auto"
            >
              <ArrowUpDown className="h-4 w-4 mr-2" />
              {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">
                {filteredWatchlist.length} of {watchlist.length} assets
              </span>
              {typeFilter !== 'all' && (
                <Badge variant="secondary">{typeFilter}</Badge>
              )}
            </div>

            <Link href="/analyze">
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Asset
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Watchlist Grid */}
      {filteredWatchlist.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Search className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchTerm || typeFilter !== 'all' ? 'No assets found' : 'Your watchlist is empty'}
            </h3>
            <p className="text-muted-foreground text-center mb-6">
              {searchTerm || typeFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria' 
                : 'Start by analyzing some assets to add them to your watchlist'
              }
            </p>
            <Link href="/analyze">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Asset
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredWatchlist.map((asset) => (
            <UniversalStockCard
              key={`${asset.symbol}-${asset.type}`}
              asset={asset}
              variant="detailed"
              showActions={true}
              showChart={true}
              isInWatchlist={watchlistMap.has(`${asset.symbol}-${asset.type}`)}
              onWatchlistToggle={handleWatchlistToggle}
              onTradeComplete={handleTradeComplete}
            />
          ))}
        </div>
      )}
    </div>
  )
}
