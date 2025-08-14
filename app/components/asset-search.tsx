
'use client'

import { useState, useEffect } from 'react'
import { Search, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Asset } from '@/lib/types'
import { formatPrice, formatPercent, getChangeColor, debounce } from '@/lib/utils'

interface AssetSearchProps {
  onSelectAsset: (asset: Asset) => void
  placeholder?: string
}

export function AssetSearch({ onSelectAsset, placeholder = "Search stocks or crypto (e.g., AAPL, BTC)" }: AssetSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Asset[]>([])
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)

  const searchAssets = debounce(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([])
      setShowResults(false)
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`)
      if (response.ok) {
        const data = await response.json()
        setResults(data.assets || [])
        setShowResults(true)
      }
    } catch (error) {
      console.error('Search error:', error)
      setResults([])
    } finally {
      setLoading(false)
    }
  }, 300)

  useEffect(() => {
    searchAssets(query)
  }, [query])

  const handleSelectAsset = (asset: Asset) => {
    onSelectAsset(asset)
    setQuery('')
    setShowResults(false)
    setResults([])
  }

  return (
    <div className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="pl-10 pr-10"
          onFocus={() => {
            if (results.length > 0) {
              setShowResults(true)
            }
          }}
          onBlur={() => {
            // Delay hiding results to allow for clicks
            setTimeout(() => setShowResults(false), 200)
          }}
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
        )}
      </div>

      {showResults && results.length > 0 && (
        <Card className="absolute top-full mt-2 w-full z-50 max-h-80 overflow-y-auto">
          <CardContent className="p-0">
            {results.map((asset, index) => (
              <div
                key={`${asset.symbol}-${asset.type}-${index}`}
                className="flex items-center justify-between p-4 hover:bg-muted cursor-pointer border-b border-border last:border-b-0"
                onClick={() => handleSelectAsset(asset)}
              >
                <div className="flex items-center space-x-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold">{asset.symbol}</span>
                      <Badge variant={asset.type === 'stock' ? 'default' : 'secondary'}>
                        {asset.type}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{asset.name}</p>
                  </div>
                </div>
                {asset.price > 0 && (
                  <div className="text-right">
                    <p className="font-semibold">{formatPrice(asset.price)}</p>
                    <p className={`text-sm ${getChangeColor(asset.changePercent)}`}>
                      {formatPercent(asset.changePercent)}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
