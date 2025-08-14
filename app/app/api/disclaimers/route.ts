
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { disclaimerType, version = '1.0' } = await request.json()

    if (!disclaimerType) {
      return NextResponse.json({ error: 'Disclaimer type is required' }, { status: 400 })
    }

    // Get user's IP address and user agent
    const forwardedFor = request.headers.get('x-forwarded-for')
    const ipAddress = forwardedFor ? forwardedFor.split(',')[0] : request.ip
    const userAgent = request.headers.get('user-agent') || undefined

    const disclaimer = await prisma.financialDisclaimer.create({
      data: {
        userId: session.user.id,
        disclaimerType,
        version,
        content: getDisclaimerContent(disclaimerType),
        ipAddress,
        userAgent,
      },
    })

    // Update user's disclaimer acceptance status
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        hasAcceptedDisclaimer: true,
        disclaimerAcceptedAt: new Date(),
      },
    })

    return NextResponse.json({ success: true, disclaimer })
  } catch (error) {
    console.error('Error recording disclaimer:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function getDisclaimerContent(type: string): string {
  switch (type) {
    case 'login':
      return 'I acknowledge that trading involves substantial risk and that AiiA provides educational content only.'
    case 'trading':
      return 'I understand the risks associated with trading and accept responsibility for my investment decisions.'
    case 'investment':
      return 'I understand that past performance does not guarantee future results and that investments can lose value.'
    default:
      return 'I acknowledge the risks and disclaimers associated with using AiiA.'
  }
}
