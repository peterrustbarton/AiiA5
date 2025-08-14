
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { validateAlpacaCredentials } from '@/lib/alpaca'

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        alpacaApiKey: true,
        alpacaSecret: true,
        isLiveTrading: true
      }
    })

    return NextResponse.json({
      hasAlpacaKeys: !!(user?.alpacaApiKey && user?.alpacaSecret),
      alpacaApiKey: user?.alpacaApiKey ? `${user.alpacaApiKey.slice(0, 8)}...` : null, // Masked for security
      isLiveTrading: user?.isLiveTrading || false
    })
  } catch (error) {
    console.error('Error fetching API keys:', error)
    return NextResponse.json(
      { error: 'Failed to fetch API keys' },
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

    const { alpacaApiKey, alpacaSecret } = await request.json()

    if (!alpacaApiKey || !alpacaSecret) {
      return NextResponse.json(
        { error: 'Both Alpaca API key and secret are required' },
        { status: 400 }
      )
    }

    // Validate the credentials before saving
    try {
      const isValid = await validateAlpacaCredentials({
        key: alpacaApiKey,
        secret: alpacaSecret,
        paper: true
      })

      if (!isValid) {
        return NextResponse.json(
          { error: 'Invalid Alpaca API credentials. Please check your keys.' },
          { status: 400 }
        )
      }
    } catch (error) {
      return NextResponse.json(
        { error: 'Failed to validate Alpaca credentials. Please verify your keys are correct.' },
        { status: 400 }
      )
    }

    // Update user with Alpaca credentials
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        alpacaApiKey,
        alpacaSecret,
        isLiveTrading: false // Always start with paper trading
      }
    })

    return NextResponse.json({ 
      message: 'Alpaca API keys validated and saved successfully',
      paperTrading: true,
      success: true
    })
  } catch (error) {
    console.error('Error saving API keys:', error)
    return NextResponse.json(
      { error: 'Failed to save API keys' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { alpacaApiKey, alpacaSecret, isLiveTrading } = await request.json()

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        alpacaApiKey: alpacaApiKey || null,
        alpacaSecret: alpacaSecret || null,
        isLiveTrading: isLiveTrading ?? false
      }
    })

    return NextResponse.json({ message: 'API keys updated successfully' })
  } catch (error) {
    console.error('API keys update error:', error)
    return NextResponse.json(
      { error: 'Failed to update API keys' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Remove Alpaca credentials
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        alpacaApiKey: null,
        alpacaSecret: null,
        isLiveTrading: false
      }
    })

    return NextResponse.json({ 
      message: 'Alpaca API keys removed successfully',
      success: true
    })
  } catch (error) {
    console.error('Error removing API keys:', error)
    return NextResponse.json(
      { error: 'Failed to remove API keys' },
      { status: 500 }
    )
  }
}
