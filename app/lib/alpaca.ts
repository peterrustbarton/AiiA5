
import Alpaca from '@alpacahq/alpaca-trade-api'
import { Position, Portfolio, Trade } from './types'

export interface AlpacaConfig {
  key: string
  secret: string
  paper: boolean
}

export function createAlpacaClient(config: AlpacaConfig): Alpaca {
  return new Alpaca({
    credentials: {
      key: config.key,
      secret: config.secret,
      paper: config.paper
    }
  })
}

export async function getAlpacaPortfolio(config: AlpacaConfig): Promise<Portfolio | null> {
  try {
    const alpaca = createAlpacaClient(config)
    
    // Get account information
    const account = await alpaca.getAccount()
    
    // Get positions
    const positions = await alpaca.getPositions()
    
    const formattedPositions: Position[] = positions.map((position: any) => {
      const quantity = parseFloat(position.qty)
      const avgPrice = parseFloat(position.avg_cost)
      const currentPrice = parseFloat(position.market_value) / quantity
      const totalValue = parseFloat(position.market_value)
      const unrealizedPnL = parseFloat(position.unrealized_pl)
      const unrealizedPnLPercent = parseFloat(position.unrealized_plpc) * 100

      return {
        symbol: position.symbol,
        name: position.symbol, // Alpaca doesn't provide company name in positions
        type: 'stock' as const,
        quantity,
        avgPrice,
        currentPrice,
        totalValue,
        unrealizedPnL,
        unrealizedPnLPercent
      }
    })

    const totalValue = parseFloat(account.equity)
    const cashBalance = parseFloat(account.cash)
    const totalReturn = parseFloat(account.unrealized_pl)
    const dailyReturn = parseFloat(account.unrealized_plpc) * 100

    return {
      totalValue,
      cashBalance,
      totalReturn,
      dailyReturn,
      positions: formattedPositions
    }
  } catch (error) {
    console.error('Error fetching Alpaca portfolio:', error)
    return null
  }
}

export async function getAlpacaTrades(config: AlpacaConfig, limit: number = 50): Promise<Trade[]> {
  try {
    const alpaca = createAlpacaClient(config)
    
    // Get orders (trades)
    const orders = await alpaca.getOrders({
      status: 'all',
      limit: limit,
      direction: 'desc',
      until: null,
      after: null,
      nested: null,
      symbols: null
    })

    const formattedTrades: Trade[] = orders.map((order: any) => ({
      id: order.id,
      symbol: order.symbol,
      type: 'stock' as const,
      action: order.side as 'buy' | 'sell',
      quantity: parseFloat(order.qty),
      price: parseFloat(order.filled_avg_price || order.limit_price || 0),
      totalValue: parseFloat(order.filled_qty || order.qty) * parseFloat(order.filled_avg_price || order.limit_price || 0),
      fee: 0, // Alpaca doesn't charge commissions for stocks
      status: order.status === 'filled' ? 'completed' as const : 
              order.status === 'canceled' ? 'cancelled' as const : 'pending' as const,
      executedAt: new Date(order.filled_at || order.created_at)
    }))

    return formattedTrades
  } catch (error) {
    console.error('Error fetching Alpaca trades:', error)
    return []
  }
}

export async function executeAlpacaTrade(
  config: AlpacaConfig,
  symbol: string,
  action: 'buy' | 'sell',
  quantity: number,
  orderType: 'market' | 'limit' = 'market',
  limitPrice?: number
): Promise<{ success: boolean; orderId?: string; error?: string }> {
  try {
    const alpaca = createAlpacaClient(config)
    
    const orderParams: any = {
      symbol: symbol.toUpperCase(),
      qty: quantity,
      side: action,
      type: orderType,
      time_in_force: 'day'
    }

    if (orderType === 'limit' && limitPrice) {
      orderParams.limit_price = limitPrice
    }

    const order = await alpaca.createOrder(orderParams)
    
    return {
      success: true,
      orderId: order.id
    }
  } catch (error: any) {
    console.error('Error executing Alpaca trade:', error)
    return {
      success: false,
      error: error.message || 'Failed to execute trade'
    }
  }
}

export async function getAlpacaQuote(config: AlpacaConfig, symbol: string): Promise<{ price: number; change: number; changePercent: number } | null> {
  try {
    const alpaca = createAlpacaClient(config)
    
    // Get latest quote
    const quote = await alpaca.getLatestTrade(symbol)
    const bars = alpaca.getBarsV2(symbol, {
      start: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      end: new Date(),
      timeframe: '1Day'
    })

    const currentPrice = (quote as any).Price || 0
    let previousClose = currentPrice
    
    // Get previous close from bars - convert async generator to array
    const barsArray: any[] = []
    for await (const bar of bars) {
      barsArray.push(bar)
    }
    
    if (barsArray.length >= 2) {
      previousClose = barsArray[barsArray.length - 2].c
    }

    const change = currentPrice - previousClose
    const changePercent = (change / previousClose) * 100

    return {
      price: currentPrice,
      change,
      changePercent
    }
  } catch (error) {
    console.error('Error getting Alpaca quote:', error)
    return null
  }
}

export async function validateAlpacaCredentials(config: AlpacaConfig): Promise<boolean> {
  try {
    const alpaca = createAlpacaClient(config)
    await alpaca.getAccount()
    return true
  } catch (error) {
    console.error('Error validating Alpaca credentials:', error)
    return false
  }
}
