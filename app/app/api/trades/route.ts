
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getStockQuote, getCryptoQuote } from '@/lib/market-data'
import { getAlpacaTrades, validateAlpacaCredentials } from '@/lib/alpaca'

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

        const alpacaTrades = await getAlpacaTrades(alpacaConfig)
        
        return NextResponse.json({ 
          trades: alpacaTrades,
          source: 'alpaca'
        })
      } catch (error) {
        console.error('Error fetching Alpaca trades, falling back to simulated:', error)
        // Fall through to simulated trades below
      }
    }

    // Fallback to simulated trades
    const trades = await prisma.trade.findMany({
      where: { userId: session.user.id },
      orderBy: { executedAt: 'desc' }
    })

    return NextResponse.json({ 
      trades,
      source: 'simulated'
    })
  } catch (error) {
    console.error('Trades fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch trades' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { 
      symbol, 
      side, 
      quantity, 
      orderType = 'market',
      limitPrice,
      stopPrice,
      timeInForce = 'day',
      dollarAmount,
      useDollarAmount = false,
      confidenceScore,
      aiRecommendation,
      currentPrice,
      // Legacy fields for backward compatibility
      type = 'stock',
      action,
      price
    } = await request.json()

    // Handle both new and legacy API formats
    const effectiveSide = side || action
    const effectiveType = type

    if (!symbol || !effectiveSide || (!quantity && !dollarAmount)) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (!['stock', 'crypto'].includes(effectiveType) || !['buy', 'sell'].includes(effectiveSide)) {
      return NextResponse.json(
        { error: 'Invalid type or side' },
        { status: 400 }
      )
    }

    // Validate order type
    if (!['market', 'limit', 'stop', 'stop_limit'].includes(orderType)) {
      return NextResponse.json(
        { error: 'Invalid order type' },
        { status: 400 }
      )
    }

    // Validate time in force
    if (!['day', 'gtc', 'ioc', 'fok'].includes(timeInForce)) {
      return NextResponse.json(
        { error: 'Invalid time in force' },
        { status: 400 }
      )
    }

    // Validate prices for limit and stop orders
    if ((orderType === 'limit' || orderType === 'stop_limit') && (!limitPrice || limitPrice <= 0)) {
      return NextResponse.json(
        { error: 'Limit price is required and must be greater than 0 for limit orders' },
        { status: 400 }
      )
    }

    if ((orderType === 'stop' || orderType === 'stop_limit') && (!stopPrice || stopPrice <= 0)) {
      return NextResponse.json(
        { error: 'Stop price is required and must be greater than 0 for stop orders' },
        { status: 400 }
      )
    }

    // Get user to check for Alpaca credentials and account tier
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        subscription: true
      }
    })

    // Determine account tier
    const accountTier = user?.subscription?.tier || 'free'
    
    // Account tier restrictions
    if (accountTier === 'free') {
      if (orderType === 'stop' || orderType === 'stop_limit') {
        return NextResponse.json(
          { error: 'Stop orders are only available for Pro and Admin accounts' },
          { status: 403 }
        )
      }
      if (dollarAmount && dollarAmount > 1000) {
        return NextResponse.json(
          { error: 'Free accounts are limited to $1,000 per trade' },
          { status: 403 }
        )
      }
    } else if (accountTier === 'pro') {
      if (dollarAmount && dollarAmount > 10000) {
        return NextResponse.json(
          { error: 'Pro accounts are limited to $10,000 per trade' },
          { status: 403 }
        )
      }
    }

    // Calculate effective quantity and price
    const effectivePrice = currentPrice || price || (effectiveType === 'stock' 
      ? (await getStockQuote(symbol))?.price
      : (await getCryptoQuote(symbol))?.price)

    if (!effectivePrice) {
      return NextResponse.json(
        { error: 'Unable to get current price' },
        { status: 400 }
      )
    }

    const effectiveQuantity = useDollarAmount ? Math.floor(dollarAmount! / effectivePrice) : quantity

    if (effectiveQuantity <= 0) {
      return NextResponse.json(
        { error: 'Invalid quantity calculated' },
        { status: 400 }
      )
    }

    // If user has Alpaca credentials and it's a stock trade, use Alpaca
    if (user?.alpacaApiKey && user?.alpacaSecret && effectiveType === 'stock') {
      try {
        const { executeAlpacaTrade, validateAlpacaCredentials } = await import('@/lib/alpaca')
        
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

        // Execute trade through Alpaca (note: Alpaca integration currently supports market and limit orders only)
        const alpacaOrderType = (orderType === 'market' || orderType === 'limit') ? orderType : 'market'
        const alpacaPrice = orderType === 'limit' ? limitPrice : undefined
        
        const result = await executeAlpacaTrade(
          alpacaConfig,
          symbol,
          effectiveSide,
          effectiveQuantity,
          alpacaOrderType,
          alpacaPrice
        )

        if (!result.success) {
          return NextResponse.json(
            { error: result.error || 'Failed to execute trade' },
            { status: 400 }
          )
        }

        // Create notification
        await prisma.notification.create({
          data: {
            userId: session.user.id,
            title: 'Trade Executed (Alpaca)',
            message: `Successfully ${effectiveSide === 'buy' ? 'bought' : 'sold'} ${effectiveQuantity} ${symbol} via Alpaca`,
            type: 'trade',
            data: { orderId: result.orderId, source: 'alpaca' }
          }
        })

        return NextResponse.json({ 
          orderId: result.orderId,
          source: 'alpaca',
          message: 'Trade executed successfully via Alpaca',
          tradeDetails: {
            symbol,
            side: effectiveSide,
            quantity: effectiveQuantity,
            price: effectivePrice,
            orderType,
            estimatedValue: effectiveQuantity * effectivePrice
          }
        }, { status: 201 })
      } catch (error) {
        console.error('Error executing Alpaca trade, falling back to simulated:', error)
        // Fall through to simulated trading below
      }
    }

    // Fallback to simulated trading (enhanced logic)
    // Get current portfolio
    const portfolio = await prisma.portfolio.findUnique({
      where: { userId: session.user.id }
    })

    if (!portfolio) {
      return NextResponse.json(
        { error: 'Portfolio not found' },
        { status: 404 }
      )
    }

    const totalValue = effectiveQuantity * effectivePrice
    const fee = Math.max(1, totalValue * 0.001) // 0.1% fee, minimum $1

    // Check if user has enough cash for buy orders
    if (effectiveSide === 'buy' && portfolio.cashBalance < (totalValue + fee)) {
      return NextResponse.json(
        { error: 'Insufficient cash balance' },
        { status: 400 }
      )
    }

    // For sell orders, check if user has enough shares
    if (effectiveSide === 'sell') {
      const existingTrades = await prisma.trade.findMany({
        where: {
          userId: session.user.id,
          symbol,
          type: effectiveType,
          status: 'completed'
        }
      })

      let currentPosition = 0
      for (const trade of existingTrades) {
        if (trade.action === 'buy') {
          currentPosition += trade.quantity
        } else {
          currentPosition -= trade.quantity
        }
      }

      if (currentPosition < effectiveQuantity) {
        return NextResponse.json(
          { error: 'Insufficient shares to sell' },
          { status: 400 }
        )
      }
    }

    // Determine trade status based on order type
    let tradeStatus: 'pending' | 'completed' = 'completed'
    let executionPrice = effectivePrice

    // For limit orders, check if they can be executed immediately
    if (orderType === 'limit') {
      if (effectiveSide === 'buy' && limitPrice! < effectivePrice) {
        tradeStatus = 'pending'
        executionPrice = limitPrice!
      } else if (effectiveSide === 'sell' && limitPrice! > effectivePrice) {
        tradeStatus = 'pending'
        executionPrice = limitPrice!
      } else {
        executionPrice = limitPrice!
      }
    }

    // For stop orders, they would normally be pending until triggered
    if (orderType === 'stop' || orderType === 'stop_limit') {
      tradeStatus = 'pending'
      executionPrice = stopPrice!
    }

    // Create the enhanced trade record
    const trade = await prisma.trade.create({
      data: {
        userId: session.user.id,
        symbol: symbol.toUpperCase(),
        type: effectiveType,
        action: effectiveSide,
        quantity: effectiveQuantity,
        price: executionPrice,
        totalValue,
        fee,
        status: tradeStatus,
        orderType,
        limitPrice,
        stopPrice,
        timeInForce
      }
    })

    // Update portfolio cash balance only for completed trades
    if (tradeStatus === 'completed') {
      const newCashBalance = effectiveSide === 'buy' 
        ? portfolio.cashBalance - (totalValue + fee)
        : portfolio.cashBalance + (totalValue - fee)

      await prisma.portfolio.update({
        where: { userId: session.user.id },
        data: {
          cashBalance: newCashBalance
        }
      })
    }

    // Create notification
    await prisma.notification.create({
      data: {
        userId: session.user.id,
        title: `Trade ${tradeStatus === 'completed' ? 'Executed' : 'Placed'} (Simulated)`,
        message: tradeStatus === 'completed' 
          ? `Successfully ${effectiveSide === 'buy' ? 'bought' : 'sold'} ${effectiveQuantity} ${symbol} at $${executionPrice}`
          : `${orderType.toUpperCase()} order placed for ${effectiveQuantity} ${symbol}`,
        type: 'trade',
        data: { 
          tradeId: trade.id, 
          source: 'simulated',
          orderType,
          aiRecommendation: aiRecommendation || null,
          confidenceScore: confidenceScore || null
        }
      }
    })

    return NextResponse.json({ 
      trade,
      source: 'simulated',
      message: tradeStatus === 'completed' 
        ? 'Trade executed successfully'
        : `${orderType.toUpperCase()} order placed successfully`,
      tradeDetails: {
        symbol,
        side: effectiveSide,
        quantity: effectiveQuantity,
        price: executionPrice,
        orderType,
        estimatedValue: totalValue
      }
    }, { status: 201 })
  } catch (error) {
    console.error('Trade creation error:', error)
    return NextResponse.json(
      { error: 'Failed to execute trade' },
      { status: 500 }
    )
  }
}
