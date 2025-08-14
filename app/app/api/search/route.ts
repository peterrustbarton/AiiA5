
import { NextRequest, NextResponse } from 'next/server'
import { searchAssets } from '@/lib/market-data'

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    if (!query || query.length < 2) {
      return NextResponse.json({ assets: [] })
    }

    const assets = await searchAssets(query)

    return NextResponse.json({ assets })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { error: 'Failed to search assets' },
      { status: 500 }
    )
  }
}
