
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

    // Verify subscription belongs to user
    const subscription = await prisma.subscription.findFirst({
      where: {
        id,
        userId: session.user.id,
        status: 'active'
      }
    })

    if (!subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
    }

    // Cancel subscription (remains active until end of billing period)
    const updatedSubscription = await prisma.subscription.update({
      where: { id },
      data: {
        status: 'cancelled',
        cancelledAt: new Date()
      }
    })

    // Update user subscription status
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        subscriptionStatus: 'cancelled',
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ 
      success: true, 
      subscription: updatedSubscription 
    })
  } catch (error) {
    console.error('Cancel subscription error:', error)
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    )
  }
}
