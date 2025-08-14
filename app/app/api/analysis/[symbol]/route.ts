
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { 
  getStockQuote, 
  getCryptoQuote, 
  getChartData, 
  getNews, 
  getComprehensiveAssetData,
  getEnhancedNews 
} from '@/lib/market-data'
import { aggregateMarketData, scrapeSocialSentiment } from '@/lib/web-scraping'

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { symbol: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') as 'stock' | 'crypto'
    const refresh = searchParams.get('refresh') === 'true'
    const symbol = params.symbol.toUpperCase()

    if (!type || !['stock', 'crypto'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid or missing type parameter' },
        { status: 400 }
      )
    }

    // Check for existing analysis (if not refreshing)
    if (!refresh) {
      const existingAnalysis = await prisma.aIAnalysis.findUnique({
        where: {
          symbol_type: {
            symbol,
            type
          }
        }
      })

      if (existingAnalysis && existingAnalysis.expiresAt > new Date()) {
        return NextResponse.json({
          analysis: {
            ...existingAnalysis,
            lastUpdated: existingAnalysis.createdAt
          }
        })
      }
    }

    // Generate new AI analysis
    const analysis = await generateAIAnalysis(symbol, type)

    if (!analysis) {
      return NextResponse.json(
        { error: 'Failed to generate analysis' },
        { status: 500 }
      )
    }

    return NextResponse.json({ analysis })
  } catch (error) {
    console.error('Analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to generate analysis' },
      { status: 500 }
    )
  }
}

async function generateAIAnalysis(symbol: string, type: 'stock' | 'crypto') {
  try {
    // Gather comprehensive data from multiple sources
    const [comprehensiveData, chartData, socialSentiment, aggregatedMarketData] = await Promise.all([
      getComprehensiveAssetData(symbol, type),
      getChartData(symbol, type),
      type === 'stock' ? scrapeSocialSentiment(symbol) : null,
      aggregateMarketData(symbol, type)
    ])

    if (!comprehensiveData.quote) {
      throw new Error('Asset data not found')
    }

    const asset = comprehensiveData.quote
    const news = comprehensiveData.news
    const sentiment = comprehensiveData.sentiment
    
    // Calculate enhanced confidence score based on data sources and quality
    const dataSourcesAvailable = [
      asset ? 1 : 0,
      news.length > 0 ? 1 : 0,
      chartData.length > 0 ? 1 : 0,
      sentiment.length > 0 ? 1 : 0,
      socialSentiment ? 1 : 0
    ].reduce((a, b) => a + b, 0)

    // Enhanced analysis data with multiple sources
    const analysisData = {
      symbol,
      type,
      // Market data
      currentPrice: asset.price,
      change24h: asset.changePercent,
      volume: asset.volume,
      marketCap: asset.marketCap,
      high24h: asset.high24h,
      low24h: asset.low24h,
      
      // Technical analysis data
      chartData: chartData.slice(-60), // Last 60 data points for better analysis
      volatility: calculateVolatility(chartData),
      trendDirection: calculateTrend(chartData),
      supportResistance: calculateSupportResistance(chartData),
      
      // News and sentiment data
      news: news.slice(0, 15), // Recent 15 news articles
      socialSentiment: socialSentiment,
      aggregatedSentiment: sentiment,
      newsCount: news.length,
      avgNewsSentiment: news.reduce((sum, article) => sum + (article.sentiment || 0), 0) / Math.max(news.length, 1),
      
      // Data quality indicators
      dataSourcesCount: dataSourcesAvailable,
      dataFreshness: Date.now() - Math.max(...news.map(n => n.publishedAt.getTime()), Date.now() - 24 * 60 * 60 * 1000),
      overallDataConfidence: comprehensiveData.confidence
    }

    // Enhanced AI analysis prompt
    const systemPrompt = `You are a senior financial analyst with expertise in ${type === 'stock' ? 'equity' : 'cryptocurrency'} analysis. You have access to comprehensive market data from multiple sources including real-time prices, technical indicators, news sentiment, and social media sentiment.

Your analysis should provide:
1. Overall recommendation (buy/sell/hold)
2. Confidence score (0-100) - Consider data quality, market conditions, and analysis certainty
3. Technical analysis score (0-100) - Based on price action, volume, trends, and indicators
4. ${type === 'stock' ? 'Fundamental analysis score (0-100) - Based on company fundamentals and market position' : 'Market momentum score (0-100) - Based on adoption, development activity, and market dynamics'}
5. Sentiment analysis score (0-100) - Based on news sentiment and social media sentiment
6. Risk assessment (low/medium/high)
7. Target price (conservative estimate)
8. Stop loss recommendation (risk management)
9. Detailed reasoning (2-3 paragraphs explaining your analysis)

Analysis Factors to Consider:
- Technical indicators and price trends
- Volume analysis and market momentum
- News sentiment and market reaction
- Social media sentiment (if available)
- Market volatility and risk factors
- ${type === 'stock' ? 'Company fundamentals and sector performance' : 'Network activity and adoption metrics'}
- Overall market conditions

Important: Base your confidence score on the quality and quantity of available data. Higher data source count and fresher data should increase confidence.

Respond with raw JSON only. Do not include code blocks, markdown, or any other formatting.`

    // Call AI analysis endpoint
    const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ABACUSAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: `Analyze this ${type} with comprehensive market data: ${JSON.stringify(analysisData, null, 2)}`
          }
        ],
        response_format: { type: "json_object" }
      })
    })

    if (!response.ok) {
      throw new Error(`AI analysis request failed: ${response.status}`)
    }

    const aiResponse = await response.json()
    let analysisResult

    try {
      // Clean and parse the JSON response
      const cleanedContent = aiResponse.choices[0].message.content
        .replace(/```json\s*|\s*```/g, '')
        .replace(/,(\s*[}\]])/g, '$1')
        .trim()
      
      analysisResult = JSON.parse(cleanedContent)
    } catch (parseError) {
      console.error('JSON parsing error:', parseError)
      console.error('Raw content:', aiResponse.choices[0].message.content)
      throw new Error('Failed to parse AI analysis response')
    }

    // Enhanced confidence calculation considering multiple factors
    const baseConfidence = analysisResult.confidence || 50
    const dataQualityBoost = Math.min(25, dataSourcesAvailable * 5) // Up to 25 points for data sources
    const volumeBoost = asset.volume && asset.volume > 1000000 ? 5 : 0
    const newsBoost = news.length > 5 ? 5 : news.length
    const sentimentBoost = sentiment.length > 0 ? 5 : 0
    const volatilityPenalty = Math.abs(asset.changePercent) > 10 ? -5 : 0

    const finalConfidence = Math.min(98, Math.max(20, 
      baseConfidence + dataQualityBoost + volumeBoost + newsBoost + sentimentBoost + volatilityPenalty
    ))

    // Save enhanced analysis to database
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 1) // Expire in 1 hour

    const savedAnalysis = await prisma.aIAnalysis.upsert({
      where: {
        symbol_type: {
          symbol,
          type
        }
      },
      update: {
        recommendation: analysisResult.recommendation || 'hold',
        confidence: finalConfidence,
        reasoning: analysisResult.reasoning || 'Analysis completed based on comprehensive market data from multiple sources.',
        technicalScore: analysisResult.technicalScore || analysisResult.technical_score || 50,
        fundamentalScore: type === 'stock' ? (analysisResult.fundamentalScore || analysisResult.fundamental_score || 50) : null,
        sentimentScore: analysisResult.sentimentScore || analysisResult.sentiment_score || 50,
        riskLevel: analysisResult.riskLevel || analysisResult.risk_level || 'medium',
        targetPrice: analysisResult.targetPrice || analysisResult.target_price || null,
        stopLoss: analysisResult.stopLoss || analysisResult.stop_loss || null,
        dataSource: {
          ...analysisData,
          enhancedAnalysis: true,
          dataSourcesUsed: dataSourcesAvailable,
          confidenceFactors: {
            baseConfidence,
            dataQualityBoost,
            volumeBoost,
            newsBoost,
            sentimentBoost,
            volatilityPenalty,
            finalConfidence
          }
        } as any,
        expiresAt
      },
      create: {
        symbol,
        type,
        recommendation: analysisResult.recommendation || 'hold',
        confidence: finalConfidence,
        reasoning: analysisResult.reasoning || 'Analysis completed based on comprehensive market data from multiple sources.',
        technicalScore: analysisResult.technicalScore || analysisResult.technical_score || 50,
        fundamentalScore: type === 'stock' ? (analysisResult.fundamentalScore || analysisResult.fundamental_score || 50) : null,
        sentimentScore: analysisResult.sentimentScore || analysisResult.sentiment_score || 50,
        riskLevel: analysisResult.riskLevel || analysisResult.risk_level || 'medium',
        targetPrice: analysisResult.targetPrice || analysisResult.target_price || null,
        stopLoss: analysisResult.stopLoss || analysisResult.stop_loss || null,
        dataSource: {
          ...analysisData,
          enhancedAnalysis: true,
          dataSourcesUsed: dataSourcesAvailable,
          confidenceFactors: {
            baseConfidence,
            dataQualityBoost,
            volumeBoost,
            newsBoost,
            sentimentBoost,
            volatilityPenalty,
            finalConfidence
          }
        } as any,
        expiresAt
      }
    })

    return {
      ...savedAnalysis,
      lastUpdated: savedAnalysis.createdAt
    }
  } catch (error) {
    console.error('AI analysis generation error:', error)
    return null
  }
}

// Helper functions for technical analysis
function calculateVolatility(chartData: any[]): number {
  if (chartData.length < 2) return 0
  
  const returns = chartData.slice(1).map((current, index) => {
    const previous = chartData[index]
    return (current.close - previous.close) / previous.close
  })
  
  const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length
  const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length
  
  return Math.sqrt(variance) * 100 // Convert to percentage
}

function calculateTrend(chartData: any[]): string {
  if (chartData.length < 10) return 'neutral'
  
  const recent = chartData.slice(-10)
  const older = chartData.slice(-20, -10)
  
  const recentAvg = recent.reduce((sum, data) => sum + data.close, 0) / recent.length
  const olderAvg = older.reduce((sum, data) => sum + data.close, 0) / older.length
  
  const change = (recentAvg - olderAvg) / olderAvg
  
  if (change > 0.02) return 'bullish'
  if (change < -0.02) return 'bearish'
  return 'neutral'
}

function calculateSupportResistance(chartData: any[]): { support: number, resistance: number } {
  if (chartData.length < 20) return { support: 0, resistance: 0 }
  
  const prices = chartData.map(data => data.close)
  const sortedPrices = [...prices].sort((a, b) => a - b)
  
  return {
    support: sortedPrices[Math.floor(sortedPrices.length * 0.2)], // 20th percentile
    resistance: sortedPrices[Math.floor(sortedPrices.length * 0.8)] // 80th percentile
  }
}
