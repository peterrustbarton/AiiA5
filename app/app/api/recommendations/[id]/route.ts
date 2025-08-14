
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { status, executedAt } = await request.json()
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

    const updatedRecommendation = await prisma.recommendation.update({
      where: { id },
      data: {
        status: status || recommendation.status,
        executedAt: executedAt ? new Date(executedAt) : undefined,
      }
    })

    return NextResponse.json({ 
      success: true, 
      recommendation: updatedRecommendation 
    })
  } catch (error) {
    console.error('Update recommendation error:', error)
    return NextResponse.json(
      { error: 'Failed to update recommendation' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    await prisma.recommendation.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete recommendation error:', error)
    return NextResponse.json(
      { error: 'Failed to delete recommendation' },
      { status: 500 }
    )
  }
}
