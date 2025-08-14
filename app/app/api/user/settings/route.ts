
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

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        name: true,
        email: true,
        theme: true,
        alpacaApiKey: true,
        alpacaSecret: true,
        isLiveTrading: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      settings: {
        ...user,
        // Mask sensitive data
        alpacaApiKey: user.alpacaApiKey ? '***' + user.alpacaApiKey.slice(-4) : '',
        alpacaSecret: user.alpacaSecret ? '***' + user.alpacaSecret.slice(-4) : ''
      }
    })
  } catch (error) {
    console.error('User settings fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user settings' },
      { status: 500 }
    )
  }
}
