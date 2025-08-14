
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    // Verify recommendation belongs to user
    const recommendation = await prisma.recommendation.findFirst({
      where: {
        id,
        userId: session.user.id
      }
    })

    if (!recommendation) {
      return NextResponse.json({ error: 'Recommendation not found' }, { status: 404 })
    }

    // Mark as viewed if not already viewed
    if (!recommendation.viewedAt) {
      await prisma.recommendation.update({
        where: { id },
        data: { viewedAt: new Date() }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Mark recommendation as viewed error:', error)
    return NextResponse.json(
      { error: 'Failed to mark as viewed' },
      { status: 500 }
    )
  }
}
