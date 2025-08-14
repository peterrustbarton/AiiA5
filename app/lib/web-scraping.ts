
// Web Scraping Utilities for Enhanced Market Data Collection
import { Asset, NewsArticle, MarketMover } from './types'

interface ScrapedData {
  source: string
  timestamp: number
  data: any
}

interface SentimentData {
  symbol: string
  sentiment: number
  confidence: number
  mentions: number
  source: string
}

// Yahoo Finance scraping utility
export async function scrapeYahooFinanceQuote(symbol: string): Promise<Asset | null> {
  try {
    // Using Yahoo Finance API endpoint (unofficial but widely used)
    const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`)
    const data = await response.json()
    
    if (!data.chart?.result?.[0]) {
      return null
    }

    const result = data.chart.result[0]
    const meta = result.meta
    const quote = result.indicators?.quote?.[0]
    
    if (!meta || !quote) {
      return null
    }

    const currentPrice = meta.regularMarketPrice || meta.previousClose
    const previousClose = meta.previousClose
    const change = currentPrice - previousClose
    const changePercent = (change / previousClose) * 100

    return {
      symbol: symbol.toUpperCase(),
      name: meta.longName || meta.shortName || symbol.toUpperCase(),
      type: 'stock',
      price: currentPrice,
      change,
      changePercent,
      volume: meta.regularMarketVolume,
      high24h: meta.regularMarketDayHigh,
      low24h: meta.regularMarketDayLow,
      marketCap: meta.marketCap
    }
  } catch (error) {
    console.error('Error scraping Yahoo Finance:', error)
    return null
  }
}

// Yahoo Finance market movers scraping
export async function scrapeYahooMarketMovers(): Promise<{ gainers: MarketMover[], losers: MarketMover[] }> {
  try {
    // Use Yahoo Finance screener API for top gainers and losers
    const gainersResponse = await fetch('https://query1.finance.yahoo.com/v1/finance/screener/predefined/saved?formatted=true&lang=en-US&region=US&corsDomain=finance.yahoo.com&scrIds=day_gainers')
    const losersResponse = await fetch('https://query1.finance.yahoo.com/v1/finance/screener/predefined/saved?formatted=true&lang=en-US&region=US&corsDomain=finance.yahoo.com&scrIds=day_losers')
    
    const gainersData = await gainersResponse.json()
    const losersData = await losersResponse.json()

    const gainers: MarketMover[] = gainersData.finance?.result?.[0]?.quotes?.slice(0, 10).map((quote: any) => ({
      symbol: quote.symbol,
      name: quote.longName || quote.shortName || quote.symbol,
      price: quote.regularMarketPrice?.raw || 0,
      change: quote.regularMarketChange?.raw || 0,
      changePercent: quote.regularMarketChangePercent?.raw || 0,
      volume: quote.regularMarketVolume?.raw || 0
    })) || []

    const losers: MarketMover[] = losersData.finance?.result?.[0]?.quotes?.slice(0, 10).map((quote: any) => ({
      symbol: quote.symbol,
      name: quote.longName || quote.shortName || quote.symbol,
      price: quote.regularMarketPrice?.raw || 0,
      change: quote.regularMarketChange?.raw || 0,
      changePercent: quote.regularMarketChangePercent?.raw || 0,
      volume: quote.regularMarketVolume?.raw || 0
    })) || []

    return { gainers, losers }
  } catch (error) {
    console.error('Error scraping Yahoo market movers:', error)
    return { gainers: [], losers: [] }
  }
}

// Yahoo Finance search functionality
export async function scrapeYahooFinanceSearch(query: string): Promise<Asset[]> {
  try {
    const response = await fetch(`https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&lang=en-US&region=US&quotesCount=10&newsCount=0`)
    const data = await response.json()
    
    if (!data.quotes) {
      return []
    }

    return data.quotes
      .filter((quote: any) => quote.typeDisp === 'Equity' || quote.typeDisp === 'ETF')
      .slice(0, 8)
      .map((quote: any) => ({
        symbol: quote.symbol,
        name: quote.longname || quote.shortname || quote.symbol,
        type: 'stock' as const,
        price: 0, // Will be fetched separately
        change: 0,
        changePercent: 0
      }))
  } catch (error) {
    console.error('Error scraping Yahoo Finance search:', error)
    return []
  }
}

// MarketWatch news scraping
export async function scrapeMarketWatchNews(symbols?: string[]): Promise<NewsArticle[]> {
  try {
    // For now, we'll use a news aggregation approach since direct scraping is complex
    // This is a simplified version - in production, you'd use proper scraping tools
    const news: NewsArticle[] = []
    
    // We'll enhance this with actual scraping in the future
    // For now, return empty array to avoid errors
    return news
  } catch (error) {
    console.error('Error scraping MarketWatch news:', error)
    return []
  }
}

// Social sentiment analysis (simplified version)
export async function scrapeSocialSentiment(symbol: string): Promise<SentimentData | null> {
  try {
    // This is a placeholder for social sentiment analysis
    // In a real implementation, you would:
    // 1. Scrape Reddit mentions from r/stocks, r/investing, etc.
    // 2. Analyze Twitter sentiment
    // 3. Process StockTwits data
    // 4. Use ML models for sentiment scoring
    
    // For now, return a mock sentiment score based on symbol popularity
    const popularStocks = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'META', 'NVDA']
    const isPopular = popularStocks.includes(symbol.toUpperCase())
    
    return {
      symbol: symbol.toUpperCase(),
      sentiment: isPopular ? Math.random() * 0.4 + 0.3 : Math.random() * 0.6 + 0.2, // 0.3-0.7 for popular, 0.2-0.8 for others
      confidence: isPopular ? Math.random() * 0.3 + 0.7 : Math.random() * 0.5 + 0.5, // Higher confidence for popular stocks
      mentions: isPopular ? Math.floor(Math.random() * 1000) + 100 : Math.floor(Math.random() * 100) + 10,
      source: 'social_media'
    }
  } catch (error) {
    console.error('Error analyzing social sentiment:', error)
    return null
  }
}

// Reddit sentiment analysis (placeholder)
export async function scrapeRedditSentiment(symbol: string): Promise<SentimentData | null> {
  try {
    // Placeholder for Reddit sentiment analysis
    // In production, this would:
    // 1. Search Reddit posts mentioning the symbol
    // 2. Analyze comment sentiment using NLP
    // 3. Weight by upvotes and comment engagement
    
    return {
      symbol: symbol.toUpperCase(),
      sentiment: Math.random() * 0.6 + 0.2, // Random sentiment between 0.2-0.8
      confidence: Math.random() * 0.4 + 0.5, // Confidence between 0.5-0.9
      mentions: Math.floor(Math.random() * 50) + 5,
      source: 'reddit'
    }
  } catch (error) {
    console.error('Error scraping Reddit sentiment:', error)
    return null
  }
}

// Comprehensive data aggregation function
export async function aggregateMarketData(symbol: string, type: 'stock' | 'crypto'): Promise<{
  prices: Asset[]
  sentiment: SentimentData[]
  confidence: number
}> {
  const results = {
    prices: [] as Asset[],
    sentiment: [] as SentimentData[],
    confidence: 0
  }

  try {
    if (type === 'stock') {
      // Try Yahoo Finance scraping
      const yahooData = await scrapeYahooFinanceQuote(symbol)
      if (yahooData) {
        results.prices.push(yahooData)
      }

      // Get social sentiment
      const socialSentiment = await scrapeSocialSentiment(symbol)
      if (socialSentiment) {
        results.sentiment.push(socialSentiment)
      }

      const redditSentiment = await scrapeRedditSentiment(symbol)
      if (redditSentiment) {
        results.sentiment.push(redditSentiment)
      }
    }

    // Calculate overall confidence based on data sources available
    const dataSourceCount = results.prices.length + results.sentiment.length
    results.confidence = Math.min(95, Math.max(30, dataSourceCount * 20 + Math.random() * 20))

    return results
  } catch (error) {
    console.error('Error aggregating market data:', error)
    return results
  }
}

// Data validation and sanitization
export function validateScrapedData(data: any, expectedType: string): boolean {
  try {
    switch (expectedType) {
      case 'asset':
        return data && 
               typeof data.symbol === 'string' && 
               typeof data.price === 'number' && 
               !isNaN(data.price)
      
      case 'sentiment':
        return data && 
               typeof data.sentiment === 'number' && 
               data.sentiment >= 0 && 
               data.sentiment <= 1
      
      default:
        return false
    }
  } catch {
    return false
  }
}

// Rate limiting for scraping operations
const scrapingRateLimits = new Map<string, number>()

export function canScrape(source: string, limitPerMinute: number = 10): boolean {
  const now = Date.now()
  const lastRequest = scrapingRateLimits.get(source) || 0
  const timeSinceLastRequest = now - lastRequest
  const minInterval = 60000 / limitPerMinute // ms between requests

  if (timeSinceLastRequest >= minInterval) {
    scrapingRateLimits.set(source, now)
    return true
  }

  return false
}
