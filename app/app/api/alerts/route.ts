
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const alerts = await prisma.alert.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ alerts })
  } catch (error) {
    console.error('Alerts fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch alerts' },
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

    const { symbol, type, condition, targetPrice } = await request.json()

    if (!symbol || !type || !condition || !targetPrice) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (!['stock', 'crypto'].includes(type) || !['above', 'below'].includes(condition)) {
      return NextResponse.json(
        { error: 'Invalid type or condition' },
        { status: 400 }
      )
    }

    const alert = await prisma.alert.create({
      data: {
        userId: session.user.id,
        symbol: symbol.toUpperCase(),
        type,
        condition,
        targetPrice: parseFloat(targetPrice),
        isActive: true,
        triggered: false
      }
    })

    return NextResponse.json({ alert }, { status: 201 })
  } catch (error) {
    console.error('Alert creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create alert' },
      { status: 500 }
    )
  }
}
