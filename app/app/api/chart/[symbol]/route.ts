
import { NextRequest, NextResponse } from 'next/server'
import { getChartData } from '@/lib/market-data'

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { symbol: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') as 'stock' | 'crypto'
    const interval = searchParams.get('interval') || 'daily'
    const symbol = params.symbol

    if (!type || !['stock', 'crypto'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid or missing type parameter' },
        { status: 400 }
      )
    }

    const data = await getChartData(symbol, type, interval)

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Chart data error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch chart data' },
      { status: 500 }
    )
  }
}
