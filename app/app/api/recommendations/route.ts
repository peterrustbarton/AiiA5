
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status') || 'active'
    const symbol = searchParams.get('symbol')
    const type = searchParams.get('type')

    const where = {
      userId: session.user.id,
      status,
      ...(symbol && { symbol: symbol.toUpperCase() }),
      ...(type && { type })
    }

    const recommendations = await prisma.recommendation.findMany({
      where,
      orderBy: [
        { priority: 'desc' },
        { confidence: 'desc' },
        { createdAt: 'desc' }
      ],
      take: limit
    })

    return NextResponse.json({ recommendations })
  } catch (error) {
    console.error('Get recommendations error:', error)
    return NextResponse.json(
      { error: 'Failed to load recommendations' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()

    if (!data.symbol || !data.type || !data.recommendation) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Set expiration date (default 7 days)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    const recommendation = await prisma.recommendation.create({
      data: {
        userId: session.user.id,
        symbol: data.symbol.toUpperCase(),
        type: data.type,
        recommendation: data.recommendation,
        confidence: data.confidence || 50,
        reasoning: data.reasoning || '',
        targetPrice: data.targetPrice,
        stopLoss: data.stopLoss,
        priority: data.priority || 'medium',
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : expiresAt,
      }
    })

    return NextResponse.json({ 
      success: true, 
      recommendation 
    })
  } catch (error) {
    console.error('Create recommendation error:', error)
    return NextResponse.json(
      { error: 'Failed to create recommendation' },
      { status: 500 }
    )
  }
}
