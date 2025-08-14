
import { NextRequest, NextResponse } from 'next/server'
import { getNews } from '@/lib/market-data'

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const symbols = searchParams.get('symbols')?.split(',') || []

    const articles = await getNews(symbols.length > 0 ? symbols : undefined)

    return NextResponse.json({ articles })
  } catch (error) {
    console.error('News fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch news' },
      { status: 500 }
    )
  }
}
