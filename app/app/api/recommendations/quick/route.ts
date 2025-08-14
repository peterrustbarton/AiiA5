
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
    const symbol = searchParams.get('symbol')
    const type = searchParams.get('type')

    if (!symbol || !type) {
      return NextResponse.json(
        { error: 'Symbol and type are required' },
        { status: 400 }
      )
    }

    // Try to find existing recommendation first
    let recommendation = await prisma.recommendation.findFirst({
      where: {
        userId: session.user.id,
        symbol: symbol.toUpperCase(),
        type: type as 'stock' | 'crypto',
        status: 'active',
        expiresAt: { gt: new Date() }
      },
      orderBy: { createdAt: 'desc' }
    })

    // If no existing recommendation, try to get from AI analysis
    if (!recommendation) {
      try {
        const analysisResponse = await fetch(
          `${request.nextUrl.origin}/api/analysis/${symbol}?type=${type}`
        )
        
        if (analysisResponse.ok) {
          const analysisData = await analysisResponse.json()
          const analysis = analysisData.analysis

          if (analysis && analysis.recommendation !== 'hold' && analysis.confidence >= 60) {
            // Create new recommendation based on analysis
            const expiresAt = new Date()
            expiresAt.setDate(expiresAt.getDate() + 3) // Quick recommendations expire in 3 days

            recommendation = await prisma.recommendation.create({
              data: {
                userId: session.user.id,
                symbol: symbol.toUpperCase(),
                type: type as 'stock' | 'crypto',
                recommendation: analysis.recommendation,
                confidence: analysis.confidence,
                reasoning: analysis.reasoning,
                targetPrice: analysis.targetPrice,
                stopLoss: analysis.stopLoss,
                priority: analysis.confidence >= 80 ? 'high' : 'medium',
                expiresAt,
              }
            })
          }
        }
      } catch (error) {
        console.error('Failed to generate quick recommendation from analysis:', error)
      }
    }

    return NextResponse.json({ 
      recommendation: recommendation || null 
    })
  } catch (error) {
    console.error('Quick recommendation error:', error)
    return NextResponse.json(
      { error: 'Failed to get quick recommendation' },
      { status: 500 }
    )
  }
}
