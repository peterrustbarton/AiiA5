
import { NextRequest, NextResponse } from 'next/server'
import { getComprehensiveAssetData } from '@/lib/market-data'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { symbol: string } }
) {
  try {
    const { symbol } = params
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') as 'stock' | 'crypto' || 'stock'

    if (!symbol) {
      return NextResponse.json({ error: 'Symbol is required' }, { status: 400 })
    }

    const data = await getComprehensiveAssetData(symbol, type)

    if (!data) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching asset:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
