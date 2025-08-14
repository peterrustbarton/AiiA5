
import { Asset, MarketMover, ChartData, NewsArticle } from './types'
import { 
  scrapeYahooFinanceQuote, 
  scrapeYahooMarketMovers, 
  scrapeYahooFinanceSearch,
  scrapeSocialSentiment,
  aggregateMarketData,
  canScrape 
} from './web-scraping'

// API Configuration - Fixed environment variable names and added News API
const ALPHA_VANTAGE_API_KEY = process.env.ALPHADVANTAGE_API_KEY || ''
const ALPHA_VANTAGE_BASE_URL = 'https://www.alphavantage.co/query'
const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY || ''
const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1'
const NEWS_API_KEY = process.env.NEWS_API_KEY || ''
const NEWS_API_BASE_URL = 'https://newsapi.org/v2'
const COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3'

// Rate limiting configuration
const API_RATE_LIMITS = {
  ALPHA_VANTAGE: { requestsPerMinute: 5, requestsPerDay: 25 },
  FINNHUB: { requestsPerMinute: 60, requestsPerDay: 1000 },
  NEWS_API: { requestsPerDay: 1000 },
  COINGECKO: { requestsPerMinute: 30 }
}

interface CacheEntry<T> {
  data: T
  timestamp: number
  expiresIn: number
  source: string
}

interface RateLimitEntry {
  requests: number[]
  dailyRequests: number
  lastReset: number
}

class MarketDataCache {
  private cache = new Map<string, CacheEntry<any>>()
  private rateLimits = new Map<string, RateLimitEntry>()

  set<T>(key: string, data: T, expiresInMs: number = 60000, source: string = 'unknown'): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresIn: expiresInMs,
      source
    })
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    if (Date.now() - entry.timestamp > entry.expiresIn) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  clear(): void {
    this.cache.clear()
  }

  // Rate limiting functionality
  canMakeRequest(apiName: string): boolean {
    const limits = API_RATE_LIMITS[apiName as keyof typeof API_RATE_LIMITS]
    if (!limits) return true

    const now = Date.now()
    const entry = this.rateLimits.get(apiName) || {
      requests: [],
      dailyRequests: 0,
      lastReset: now
    }

    // Reset daily counter if it's a new day
    if (now - entry.lastReset > 24 * 60 * 60 * 1000) {
      entry.dailyRequests = 0
      entry.lastReset = now
    }

    // Check daily limit
    if ('requestsPerDay' in limits && limits.requestsPerDay && entry.dailyRequests >= limits.requestsPerDay) {
      return false
    }

    // Check per-minute limit
    if ('requestsPerMinute' in limits && limits.requestsPerMinute) {
      const oneMinuteAgo = now - 60 * 1000
      entry.requests = entry.requests.filter(time => time > oneMinuteAgo)
      
      if (entry.requests.length >= limits.requestsPerMinute) {
        return false
      }
    }

    return true
  }

  recordRequest(apiName: string): void {
    const now = Date.now()
    const entry = this.rateLimits.get(apiName) || {
      requests: [],
      dailyRequests: 0,
      lastReset: now
    }

    entry.requests.push(now)
    entry.dailyRequests++
    this.rateLimits.set(apiName, entry)
  }

  getCacheStats(): { entries: number, sources: Record<string, number> } {
    const sources: Record<string, number> = {}
    for (const entry of this.cache.values()) {
      sources[entry.source] = (sources[entry.source] || 0) + 1
    }
    return { entries: this.cache.size, sources }
  }
}

const cache = new MarketDataCache()

// Enhanced stock data function with multiple sources
export async function getStockQuote(symbol: string): Promise<Asset | null> {
  const cacheKey = `stock_quote_${symbol}`
  const cached = cache.get<Asset>(cacheKey)
  if (cached) return cached

  let asset: Asset | null = null

  // Try Yahoo Finance first (more reliable and faster)
  if (canScrape('yahoo_finance', 30)) {
    try {
      asset = await scrapeYahooFinanceQuote(symbol)
      if (asset) {
        cache.set(cacheKey, asset, 60000, 'yahoo_finance')
        return asset
      }
    } catch (error) {
      console.error('Error fetching from Yahoo Finance:', error)
    }
  }

  // Fallback to Alpha Vantage API
  if (!asset && ALPHA_VANTAGE_API_KEY && cache.canMakeRequest('ALPHA_VANTAGE')) {
    try {
      cache.recordRequest('ALPHA_VANTAGE')
      
      const response = await fetch(
        `${ALPHA_VANTAGE_BASE_URL}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`
      )
      const data = await response.json()

      if (data['Error Message'] || data['Note']) {
        console.warn('Alpha Vantage API limit or error:', data['Error Message'] || data['Note'])
      } else {
        const quote = data['Global Quote']
        if (quote && quote['05. price']) {
          asset = {
            symbol: symbol.toUpperCase(),
            name: symbol.toUpperCase(),
            type: 'stock',
            price: parseFloat(quote['05. price']),
            change: parseFloat(quote['09. change']),
            changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
            volume: parseInt(quote['06. volume'])
          }
          cache.set(cacheKey, asset, 60000, 'alpha_vantage')
        }
      }
    } catch (error) {
      console.error('Error fetching from Alpha Vantage:', error)
    }
  }

  // Fallback to Finnhub API
  if (!asset && FINNHUB_API_KEY && cache.canMakeRequest('FINNHUB')) {
    try {
      cache.recordRequest('FINNHUB')
      
      const response = await fetch(
        `${FINNHUB_BASE_URL}/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`
      )
      const data = await response.json()

      if (data.c && data.c > 0) { // current price exists
        const currentPrice = data.c
        const previousClose = data.pc
        const change = currentPrice - previousClose
        const changePercent = (change / previousClose) * 100

        asset = {
          symbol: symbol.toUpperCase(),
          name: symbol.toUpperCase(),
          type: 'stock',
          price: currentPrice,
          change: change,
          changePercent: changePercent,
          volume: 0 // Finnhub basic doesn't include volume in quote
        }
        cache.set(cacheKey, asset, 60000, 'finnhub')
      }
    } catch (error) {
      console.error('Error fetching from Finnhub:', error)
    }
  }

  return asset
}

export async function getCryptoQuote(symbol: string): Promise<Asset | null> {
  const cacheKey = `crypto_quote_${symbol}`
  const cached = cache.get<Asset>(cacheKey)
  if (cached) return cached

  try {
    const coinId = symbol.toLowerCase() === 'btc' ? 'bitcoin' : 
                   symbol.toLowerCase() === 'eth' ? 'ethereum' :
                   symbol.toLowerCase()

    const response = await fetch(
      `${COINGECKO_BASE_URL}/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true`
    )
    const data = await response.json()

    if (!data[coinId]) {
      return null
    }

    const coinData = data[coinId]
    const asset: Asset = {
      symbol: symbol.toUpperCase(),
      name: symbol.toUpperCase(),
      type: 'crypto',
      price: coinData.usd,
      change: coinData.usd_24h_change || 0,
      changePercent: coinData.usd_24h_change || 0,
      volume: coinData.usd_24h_vol,
      marketCap: coinData.usd_market_cap
    }

    cache.set(cacheKey, asset, 60000) // Cache for 1 minute
    return asset
  } catch (error) {
    console.error('Error fetching crypto quote:', error)
    return null
  }
}

export async function searchAssets(query: string): Promise<Asset[]> {
  const cacheKey = `search_${query.toLowerCase()}`
  const cached = cache.get<Asset[]>(cacheKey)
  if (cached) return cached

  const results: Asset[] = []
  const seenSymbols = new Set<string>()

  // First, try Yahoo Finance search (most comprehensive)
  if (canScrape('yahoo_finance_search', 20)) {
    try {
      const yahooResults = await scrapeYahooFinanceSearch(query)
      for (const result of yahooResults) {
        if (!seenSymbols.has(result.symbol)) {
          results.push(result)
          seenSymbols.add(result.symbol)
        }
      }
    } catch (error) {
      console.error('Error searching with Yahoo Finance:', error)
    }
  }

  // Enhanced popular stocks mapping with more companies
  const popularStocks: Record<string, string> = {
    'AAPL': 'Apple Inc.',
    'GOOGL': 'Alphabet Inc.',
    'GOOG': 'Alphabet Inc. Class A',
    'MSFT': 'Microsoft Corporation',
    'AMZN': 'Amazon.com Inc.',
    'TSLA': 'Tesla Inc.',
    'META': 'Meta Platforms Inc.',
    'NVDA': 'NVIDIA Corporation',
    'NFLX': 'Netflix Inc.',
    'AMD': 'Advanced Micro Devices Inc.',
    'ADBE': 'Adobe Inc.',
    'CRM': 'Salesforce Inc.',
    'ORCL': 'Oracle Corporation',
    'IBM': 'International Business Machines',
    'INTC': 'Intel Corporation',
    'PYPL': 'PayPal Holdings Inc.',
    'SHOP': 'Shopify Inc.',
    'UBER': 'Uber Technologies Inc.',
    'SNAP': 'Snap Inc.',
    'SQ': 'Block Inc.',
    'ZM': 'Zoom Video Communications',
    'ROKU': 'Roku Inc.',
    'SPOT': 'Spotify Technology S.A.',
    'GME': 'GameStop Corp.',
    'AMC': 'AMC Entertainment Holdings',
    'BB': 'BlackBerry Limited',
    'NOK': 'Nokia Corporation',
    'F': 'Ford Motor Company',
    'GE': 'General Electric Company',
    'JPM': 'JPMorgan Chase & Co.',
    'BAC': 'Bank of America Corporation',
    'WFC': 'Wells Fargo & Company',
    'C': 'Citigroup Inc.',
    'GS': 'Goldman Sachs Group Inc.',
    'V': 'Visa Inc.',
    'MA': 'Mastercard Incorporated',
    'DIS': 'Walt Disney Company',
    'KO': 'Coca-Cola Company',
    'PEP': 'PepsiCo Inc.',
    'MCD': 'McDonald\'s Corporation',
    'NKE': 'Nike Inc.',
    'WMT': 'Walmart Inc.',
    'JNJ': 'Johnson & Johnson',
    'PG': 'Procter & Gamble',
    'UNH': 'UnitedHealth Group',
    'HD': 'Home Depot Inc.',
    'CVX': 'Chevron Corporation',
    'LLY': 'Eli Lilly and Company',
    'ABBV': 'AbbVie Inc.',
    'AVGO': 'Broadcom Inc.',
    'XOM': 'Exxon Mobil Corporation',
    'TMO': 'Thermo Fisher Scientific',
    'COST': 'Costco Wholesale Corporation'
  }

  const queryUpper = query.toUpperCase()
  
  // Exact stock symbol match
  if (popularStocks[queryUpper] && !seenSymbols.has(queryUpper)) {
    results.push({
      symbol: queryUpper,
      name: popularStocks[queryUpper],
      type: 'stock',
      price: 0,
      change: 0,
      changePercent: 0
    })
    seenSymbols.add(queryUpper)
  }

  // Partial symbol matches
  for (const [symbol, name] of Object.entries(popularStocks)) {
    if (symbol.includes(queryUpper) && symbol !== queryUpper && !seenSymbols.has(symbol)) {
      results.push({
        symbol,
        name,
        type: 'stock',
        price: 0,
        change: 0,
        changePercent: 0
      })
      seenSymbols.add(symbol)
    }
  }

  // Company name search
  for (const [symbol, name] of Object.entries(popularStocks)) {
    if (name.toLowerCase().includes(query.toLowerCase()) && !seenSymbols.has(symbol)) {
      results.push({
        symbol,
        name,
        type: 'stock',
        price: 0,
        change: 0,
        changePercent: 0
      })
      seenSymbols.add(symbol)
    }
  }

  // Finnhub stock search (if we have capacity)
  if (FINNHUB_API_KEY && cache.canMakeRequest('FINNHUB') && results.length < 6) {
    try {
      cache.recordRequest('FINNHUB')
      const response = await fetch(
        `${FINNHUB_BASE_URL}/search?q=${query}&token=${FINNHUB_API_KEY}`
      )
      const data = await response.json()
      
      if (data.result) {
        for (const match of data.result.slice(0, 3)) {
          if (!seenSymbols.has(match.symbol)) {
            results.push({
              symbol: match.symbol,
              name: match.description || match.displaySymbol,
              type: 'stock',
              price: 0,
              change: 0,
              changePercent: 0
            })
            seenSymbols.add(match.symbol)
          }
        }
      }
    } catch (error) {
      console.error('Error searching stocks with Finnhub:', error)
    }
  }

  // Crypto search with CoinGecko
  if (cache.canMakeRequest('COINGECKO') && results.length < 8) {
    try {
      const response = await fetch(`${COINGECKO_BASE_URL}/search?query=${query}`)
      const data = await response.json()
      
      if (data.coins) {
        for (const coin of data.coins.slice(0, 5)) {
          const symbol = coin.symbol.toUpperCase()
          const name = coin.name
          
          // Enhanced filtering of tokenized stocks and wrapped assets
          const isTokenizedStock = name.toLowerCase().includes('tokenized') ||
                                  name.toLowerCase().includes('xstock') ||
                                  name.toLowerCase().includes('twin asset') ||
                                  name.toLowerCase().includes('dinari') ||
                                  name.toLowerCase().includes('wrapped') ||
                                  name.toLowerCase().includes('synthetic') ||
                                  symbol.includes('.D') ||
                                  symbol.startsWith('I') && popularStocks[symbol.substring(1)] ||
                                  symbol.endsWith('X') && popularStocks[symbol.slice(0, -1)] ||
                                  symbol.endsWith('USD')

          if (!isTokenizedStock && !seenSymbols.has(symbol)) {
            results.push({
              symbol,
              name,
              type: 'crypto',
              price: 0,
              change: 0,
              changePercent: 0
            })
            seenSymbols.add(symbol)
          }
        }
      }
    } catch (error) {
      console.error('Error searching crypto:', error)
    }
  }

  // Cache results for 5 minutes
  const finalResults = results.slice(0, 10)
  cache.set(cacheKey, finalResults, 300000, 'search_combined')
  
  return finalResults
}

export async function getMarketMovers(type: 'stock' | 'crypto'): Promise<{ gainers: MarketMover[], losers: MarketMover[] }> {
  const cacheKey = `market_movers_${type}`
  const cached = cache.get<{ gainers: MarketMover[], losers: MarketMover[] }>(cacheKey)
  if (cached) return cached

  let result = { gainers: [] as MarketMover[], losers: [] as MarketMover[] }

  try {
    if (type === 'stock') {
      // First, try Yahoo Finance market movers (most reliable)
      if (canScrape('yahoo_market_movers', 10)) {
        try {
          const yahooMovers = await scrapeYahooMarketMovers()
          if (yahooMovers.gainers.length > 0 || yahooMovers.losers.length > 0) {
            result = yahooMovers
            cache.set(cacheKey, result, 300000, 'yahoo_finance') // Cache for 5 minutes
            return result
          }
        } catch (error) {
          console.error('Error fetching Yahoo market movers:', error)
        }
      }

      // Fallback: Use Finnhub top gainers/losers if available
      if (FINNHUB_API_KEY && cache.canMakeRequest('FINNHUB')) {
        try {
          cache.recordRequest('FINNHUB')
          
          // Get market data for popular stocks and sort them
          const popularStocks = [
            'AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX', 
            'AMD', 'ADBE', 'CRM', 'ORCL', 'IBM', 'INTC', 'PYPL', 'SHOP', 
            'UBER', 'SNAP', 'SQ', 'ZM', 'ROKU', 'GME', 'AMC', 'F', 'GE',
            'JPM', 'BAC', 'V', 'MA', 'DIS', 'KO', 'PEP', 'MCD', 'NKE', 'WMT'
          ]

          const quotes = await Promise.all(
            popularStocks.slice(0, 20).map(async (symbol) => {
              try {
                const quote = await getStockQuote(symbol)
                return quote
              } catch {
                return null
              }
            })
          )

          const validQuotes = quotes.filter(q => q !== null) as Asset[]
          
          if (validQuotes.length > 0) {
            const sorted = validQuotes.sort((a, b) => b.changePercent - a.changePercent)
            
            result = {
              gainers: sorted.slice(0, 8).map(asset => ({
                symbol: asset.symbol,
                name: asset.name,
                price: asset.price,
                change: asset.change,
                changePercent: asset.changePercent,
                volume: asset.volume
              })),
              losers: sorted.slice(-8).reverse().map(asset => ({
                symbol: asset.symbol,
                name: asset.name,
                price: asset.price,
                change: asset.change,
                changePercent: asset.changePercent,
                volume: asset.volume
              }))
            }
          }
        } catch (error) {
          console.error('Error fetching stock movers with Finnhub:', error)
        }
      }
    } else {
      // Crypto market movers using CoinGecko
      if (cache.canMakeRequest('COINGECKO')) {
        try {
          const [gainersResponse, losersResponse] = await Promise.all([
            fetch(`${COINGECKO_BASE_URL}/coins/markets?vs_currency=usd&order=percent_change_24h_desc&per_page=10&page=1&sparkline=false`),
            fetch(`${COINGECKO_BASE_URL}/coins/markets?vs_currency=usd&order=percent_change_24h_asc&per_page=10&page=1&sparkline=false`)
          ])

          const gainersData = await gainersResponse.json()
          const losersData = await losersResponse.json()

          if (Array.isArray(gainersData) && Array.isArray(losersData)) {
            result = {
              gainers: gainersData
                .filter((coin: any) => coin.price_change_percentage_24h > 0)
                .slice(0, 8)
                .map((coin: any) => ({
                  symbol: coin.symbol.toUpperCase(),
                  name: coin.name,
                  price: coin.current_price,
                  change: coin.price_change_24h || 0,
                  changePercent: coin.price_change_percentage_24h || 0,
                  volume: coin.total_volume
                })),
              losers: losersData
                .filter((coin: any) => coin.price_change_percentage_24h < 0)
                .slice(0, 8)
                .map((coin: any) => ({
                  symbol: coin.symbol.toUpperCase(),
                  name: coin.name,
                  price: coin.current_price,
                  change: coin.price_change_24h || 0,
                  changePercent: coin.price_change_percentage_24h || 0,
                  volume: coin.total_volume
                }))
            }
          }
        } catch (error) {
          console.error('Error fetching crypto market movers:', error)
        }
      }
    }

    // Cache results for 5 minutes
    cache.set(cacheKey, result, 300000, type === 'stock' ? 'combined_stock' : 'coingecko')
    return result
  } catch (error) {
    console.error('Error fetching market movers:', error)
    return { gainers: [], losers: [] }
  }
}

export async function getChartData(symbol: string, type: 'stock' | 'crypto', interval: string = 'daily'): Promise<ChartData[]> {
  const cacheKey = `chart_${type}_${symbol}_${interval}`
  const cached = cache.get<ChartData[]>(cacheKey)
  if (cached) return cached

  try {
    if (type === 'stock') {
      const response = await fetch(
        `${ALPHA_VANTAGE_BASE_URL}?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`
      )
      const data = await response.json()

      if (data['Error Message']) {
        return []
      }

      const timeSeries = data['Time Series (Daily)']
      if (!timeSeries) return []

      const chartData: ChartData[] = Object.entries(timeSeries)
        .slice(0, 30) // Last 30 days
        .map(([date, values]: [string, any]) => ({
          timestamp: date,
          open: parseFloat(values['1. open']),
          high: parseFloat(values['2. high']),
          low: parseFloat(values['3. low']),
          close: parseFloat(values['4. close']),
          volume: parseInt(values['5. volume'])
        }))
        .reverse()

      cache.set(cacheKey, chartData, 300000) // Cache for 5 minutes
      return chartData
    } else {
      // For crypto, we'll use a simplified approach with CoinGecko
      const coinId = symbol.toLowerCase() === 'btc' ? 'bitcoin' : 
                     symbol.toLowerCase() === 'eth' ? 'ethereum' : 
                     symbol.toLowerCase()

      const response = await fetch(
        `${COINGECKO_BASE_URL}/coins/${coinId}/ohlc?vs_currency=usd&days=30`
      )
      const data = await response.json()

      if (!Array.isArray(data)) return []

      const chartData: ChartData[] = data.map((item: number[]) => ({
        timestamp: new Date(item[0]).toISOString().split('T')[0],
        open: item[1],
        high: item[2],
        low: item[3],
        close: item[4],
        volume: 0 // CoinGecko OHLC doesn't include volume
      }))

      cache.set(cacheKey, chartData, 300000) // Cache for 5 minutes
      return chartData
    }
  } catch (error) {
    console.error('Error fetching chart data:', error)
    return []
  }
}

export async function getNews(symbols?: string[]): Promise<NewsArticle[]> {
  const cacheKey = `news_${symbols?.join(',') || 'general'}`
  const cached = cache.get<NewsArticle[]>(cacheKey)
  if (cached) return cached

  const allArticles: NewsArticle[] = []
  const seenUrls = new Set<string>()

  // Try News API first for general financial news
  if (NEWS_API_KEY && cache.canMakeRequest('NEWS_API') && (!symbols || symbols.length === 0)) {
    try {
      cache.recordRequest('NEWS_API')
      
      const response = await fetch(
        `${NEWS_API_BASE_URL}/everything?q=stock%20market%20OR%20finance%20OR%20economy&language=en&sortBy=publishedAt&pageSize=20&apiKey=${NEWS_API_KEY}`
      )
      const data = await response.json()

      if (data.articles) {
        for (const article of data.articles) {
          if (!seenUrls.has(article.url)) {
            allArticles.push({
              id: article.url,
              title: article.title,
              summary: article.description,
              url: article.url,
              source: article.source?.name || 'Unknown',
              author: article.author,
              publishedAt: new Date(article.publishedAt),
              symbols: [],
              sentiment: 0 // Will be enhanced with sentiment analysis
            })
            seenUrls.add(article.url)
          }
        }
      }
    } catch (error) {
      console.error('Error fetching from News API:', error)
    }
  }

  // Try Alpha Vantage News API for symbol-specific news or as fallback
  if (ALPHA_VANTAGE_API_KEY && cache.canMakeRequest('ALPHA_VANTAGE')) {
    try {
      cache.recordRequest('ALPHA_VANTAGE')
      
      const symbolParam = symbols && symbols.length > 0 ? `&topics=${symbols.join(',')}` : ''
      const response = await fetch(
        `${ALPHA_VANTAGE_BASE_URL}?function=NEWS_SENTIMENT&apikey=${ALPHA_VANTAGE_API_KEY}${symbolParam}&limit=20`
      )
      const data = await response.json()

      if (data.feed) {
        for (const item of data.feed) {
          if (!seenUrls.has(item.url)) {
            allArticles.push({
              id: item.url,
              title: item.title,
              summary: item.summary,
              url: item.url,
              source: item.source,
              author: item.authors?.[0],
              publishedAt: new Date(item.time_published),
              symbols: item.ticker_sentiment?.map((t: any) => t.ticker) || [],
              sentiment: item.overall_sentiment_score
            })
            seenUrls.add(item.url)
          }
        }
      }
    } catch (error) {
      console.error('Error fetching Alpha Vantage news:', error)
    }
  }

  // Try Finnhub News API for additional coverage
  if (FINNHUB_API_KEY && cache.canMakeRequest('FINNHUB') && symbols && symbols.length > 0) {
    try {
      cache.recordRequest('FINNHUB')
      
      for (const symbol of symbols.slice(0, 3)) { // Limit to 3 symbols to avoid rate limits
        const response = await fetch(
          `${FINNHUB_BASE_URL}/company-news?symbol=${symbol}&from=${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}&to=${new Date().toISOString().split('T')[0]}&token=${FINNHUB_API_KEY}`
        )
        const data = await response.json()

        if (Array.isArray(data)) {
          for (const item of data.slice(0, 5)) { // Limit to 5 articles per symbol
            if (!seenUrls.has(item.url)) {
              allArticles.push({
                id: item.url,
                title: item.headline,
                summary: item.summary,
                url: item.url,
                source: item.source,
                author: '',
                publishedAt: new Date(item.datetime * 1000),
                symbols: [symbol],
                sentiment: 0 // Finnhub doesn't provide sentiment in basic plan
              })
              seenUrls.add(item.url)
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching Finnhub news:', error)
    }
  }

  // Sort articles by publish date (newest first) and limit results
  const sortedArticles = allArticles
    .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())
    .slice(0, 25) // Limit to 25 most recent articles

  cache.set(cacheKey, sortedArticles, 600000, 'news_combined') // Cache for 10 minutes
  return sortedArticles
}

// Enhanced news function that includes sentiment analysis
export async function getEnhancedNews(symbols?: string[]): Promise<NewsArticle[]> {
  const articles = await getNews(symbols)
  
  // For articles without sentiment, we could integrate with our AI analysis
  // to provide sentiment scores, but for now we'll return the articles as-is
  return articles
}

// Add function to get comprehensive asset data combining all sources
export async function getComprehensiveAssetData(symbol: string, type: 'stock' | 'crypto'): Promise<{
  quote: Asset | null
  news: NewsArticle[]
  sentiment: any
  confidence: number
}> {
  const [quote, news, aggregatedData] = await Promise.all([
    type === 'stock' ? getStockQuote(symbol) : getCryptoQuote(symbol),
    getNews([symbol]),
    aggregateMarketData(symbol, type)
  ])

  return {
    quote,
    news: news.slice(0, 10),
    sentiment: aggregatedData.sentiment,
    confidence: aggregatedData.confidence
  }
}
