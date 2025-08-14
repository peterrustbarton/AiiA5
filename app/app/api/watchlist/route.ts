
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getStockQuote, getCryptoQuote } from '@/lib/market-data'

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const watchlistItems = await prisma.watchlist.findMany({
      where: { userId: session.user.id },
      orderBy: { addedAt: 'desc' }
    })

    // Fetch current prices for watchlist items
    const watchlistWithPrices = await Promise.all(
      watchlistItems.map(async (item) => {
        const asset = item.type === 'stock' 
          ? await getStockQuote(item.symbol)
          : await getCryptoQuote(item.symbol)

        return {
          ...item,
          price: asset?.price || 0,
          change: asset?.change || 0,
          changePercent: asset?.changePercent || 0,
          volume: asset?.volume || 0,
          marketCap: asset?.marketCap || 0
        }
      })
    )

    return NextResponse.json({ watchlist: watchlistWithPrices })
  } catch (error) {
    console.error('Watchlist fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch watchlist' },
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

    const { symbol, type, name } = await request.json()

    if (!symbol || !type || !['stock', 'crypto'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid parameters' },
        { status: 400 }
      )
    }

    // Check if already in watchlist
    const existing = await prisma.watchlist.findUnique({
      where: {
        userId_symbol: {
          userId: session.user.id,
          symbol: symbol.toUpperCase()
        }
      }
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Asset already in watchlist' },
        { status: 400 }
      )
    }

    const watchlistItem = await prisma.watchlist.create({
      data: {
        userId: session.user.id,
        symbol: symbol.toUpperCase(),
        type,
        name: name || symbol.toUpperCase()
      }
    })

    return NextResponse.json({ watchlistItem }, { status: 201 })
  } catch (error) {
    console.error('Watchlist add error:', error)
    return NextResponse.json(
      { error: 'Failed to add to watchlist' },
      { status: 500 }
    )
  }
}
