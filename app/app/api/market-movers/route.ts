
import { NextRequest, NextResponse } from 'next/server'
import { getMarketMovers } from '@/lib/market-data'

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') as 'stock' | 'crypto'

    if (!type || !['stock', 'crypto'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid or missing type parameter' },
        { status: 400 }
      )
    }

    const movers = await getMarketMovers(type)

    return NextResponse.json(movers)
  } catch (error) {
    console.error('Market movers error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch market movers' },
      { status: 500 }
    )
  }
}
