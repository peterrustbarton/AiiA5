
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getStockQuote, getCryptoQuote } from '@/lib/market-data'
import { getAlpacaPortfolio, validateAlpacaCredentials } from '@/lib/alpaca'

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user to check for Alpaca credentials
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    // If user has Alpaca credentials, use Alpaca data
    if (user?.alpacaApiKey && user?.alpacaSecret) {
      try {
        const alpacaConfig = {
          key: user.alpacaApiKey,
          secret: user.alpacaSecret,
          paper: true // Always use paper trading for safety
        }

        // Validate credentials first
        const isValid = await validateAlpacaCredentials(alpacaConfig)
        if (!isValid) {
          throw new Error('Invalid Alpaca credentials')
        }

        const alpacaPortfolio = await getAlpacaPortfolio(alpacaConfig)
        
        if (alpacaPortfolio) {
          return NextResponse.json({
            ...alpacaPortfolio,
            source: 'alpaca' // Indicate data source
          })
        }
      } catch (error) {
        console.error('Error fetching Alpaca portfolio, falling back to simulated:', error)
        // Fall through to simulated portfolio below
      }
    }

    // Fallback to simulated portfolio (existing logic)
    // Get or create portfolio
    let portfolio = await prisma.portfolio.findUnique({
      where: { userId: session.user.id }
    })

    if (!portfolio) {
      portfolio = await prisma.portfolio.create({
        data: {
          userId: session.user.id,
          totalValue: 10000,
          cashBalance: 10000,
          totalReturn: 0,
          dailyReturn: 0,
        }
      })
    }

    // Get all trades to calculate positions
    const trades = await prisma.trade.findMany({
      where: { 
        userId: session.user.id,
        status: 'completed'
      },
      orderBy: { executedAt: 'desc' }
    })

    // Calculate current positions
    const positionsMap = new Map()
    
    for (const trade of trades) {
      const key = `${trade.symbol}-${trade.type}`
      const existing = positionsMap.get(key) || {
        symbol: trade.symbol,
        type: trade.type,
        quantity: 0,
        totalCost: 0,
        avgPrice: 0
      }

      if (trade.action === 'buy') {
        existing.quantity += trade.quantity
        existing.totalCost += trade.totalValue
      } else {
        existing.quantity -= trade.quantity
        existing.totalCost -= (trade.quantity * existing.avgPrice)
      }

      if (existing.quantity > 0) {
        existing.avgPrice = existing.totalCost / existing.quantity
        positionsMap.set(key, existing)
      } else {
        positionsMap.delete(key)
      }
    }

    // Get current prices for positions and calculate portfolio value
    const positions = []
    let totalPositionValue = 0

    for (const position of positionsMap.values()) {
      const asset = position.type === 'stock' 
        ? await getStockQuote(position.symbol)
        : await getCryptoQuote(position.symbol)

      if (asset) {
        const currentValue = position.quantity * asset.price
        const unrealizedPnL = currentValue - (position.quantity * position.avgPrice)
        const unrealizedPnLPercent = (unrealizedPnL / (position.quantity * position.avgPrice)) * 100

        positions.push({
          symbol: position.symbol,
          name: asset.name,
          type: position.type,
          quantity: position.quantity,
          avgPrice: position.avgPrice,
          currentPrice: asset.price,
          totalValue: currentValue,
          unrealizedPnL,
          unrealizedPnLPercent
        })

        totalPositionValue += currentValue
      }
    }

    const currentTotalValue = portfolio.cashBalance + totalPositionValue
    const totalReturn = ((currentTotalValue - 10000) / 10000) * 100

    // Update portfolio in database
    await prisma.portfolio.update({
      where: { userId: session.user.id },
      data: {
        totalValue: currentTotalValue,
        totalReturn,
        // dailyReturn would need historical data to calculate properly
      }
    })

    return NextResponse.json({
      totalValue: currentTotalValue,
      cashBalance: portfolio.cashBalance,
      totalReturn,
      dailyReturn: portfolio.dailyReturn, // Using stored value for now
      positions,
      source: 'simulated' // Indicate data source
    })
  } catch (error) {
    console.error('Portfolio fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch portfolio' },
      { status: 500 }
    )
  }
}
