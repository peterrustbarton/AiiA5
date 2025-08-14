
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { planId } = await request.json()

    if (!planId) {
      return NextResponse.json(
        { error: 'Plan ID is required' },
        { status: 400 }
      )
    }

    const planConfig = {
      'free': { amount: 0, interval: 'forever', tier: 'Free' },
      'pro': { amount: 29, interval: 'monthly', tier: 'Pro' },
      'pro-yearly': { amount: 290, interval: 'yearly', tier: 'Pro' }
    }

    const plan = planConfig[planId as keyof typeof planConfig]
    if (!plan) {
      return NextResponse.json(
        { error: 'Invalid plan ID' },
        { status: 400 }
      )
    }

    // Cancel existing active subscription
    await prisma.subscription.updateMany({
      where: {
        userId: session.user.id,
        status: 'active'
      },
      data: {
        status: 'cancelled',
        cancelledAt: new Date()
      }
    })

    let subscription = null
    let endsAt = null

    // Create new subscription (if not free plan)
    if (planId !== 'free') {
      endsAt = new Date()
      if (plan.interval === 'monthly') {
        endsAt.setMonth(endsAt.getMonth() + 1)
      } else if (plan.interval === 'yearly') {
        endsAt.setFullYear(endsAt.getFullYear() + 1)
      }

      subscription = await prisma.subscription.create({
        data: {
          userId: session.user.id,
          plan: planId,
          status: 'active',
          amount: plan.amount,
          currency: 'USD',
          interval: plan.interval,
          endsAt
        }
      })
    }

    // Update user account tier
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        accountTier: plan.tier,
        subscriptionId: subscription?.id,
        subscriptionStatus: subscription?.status || null,
        subscriptionEndsAt: endsAt,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ 
      success: true, 
      subscription 
    })
  } catch (error) {
    console.error('Create subscription error:', error)
    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    )
  }
}
