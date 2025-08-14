
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

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        aiTradingEnabled: true,
        automationSettings: true,
        riskTolerance: true,
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      settings: {
        aiTradingEnabled: user.aiTradingEnabled,
        riskTolerance: user.riskTolerance,
        ...(user.automationSettings as any || {})
      }
    })
  } catch (error) {
    console.error('Get automation settings error:', error)
    return NextResponse.json(
      { error: 'Failed to load automation settings' },
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

    const { settings } = await request.json()

    if (!settings) {
      return NextResponse.json(
        { error: 'Settings data required' },
        { status: 400 }
      )
    }

    // Extract specific fields that are stored in User model
    const { aiTradingEnabled, riskTolerance, ...automationSettings } = settings

    // Update user settings
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        aiTradingEnabled: Boolean(aiTradingEnabled),
        riskTolerance: riskTolerance || 'medium',
        automationSettings: automationSettings as any,
        updatedAt: new Date(),
      }
    })

    return NextResponse.json({ 
      success: true,
      settings: {
        aiTradingEnabled: updatedUser.aiTradingEnabled,
        riskTolerance: updatedUser.riskTolerance,
        ...(updatedUser.automationSettings as any || {})
      }
    })
  } catch (error) {
    console.error('Save automation settings error:', error)
    return NextResponse.json(
      { error: 'Failed to save automation settings' },
      { status: 500 }
    )
  }
}
