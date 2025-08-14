
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

    const { feedback } = await request.json()
    const { id } = params

    if (!feedback || !['helpful', 'not_helpful'].includes(feedback)) {
      return NextResponse.json(
        { error: 'Valid feedback is required' },
        { status: 400 }
      )
    }

    // Verify message belongs to user
    const message = await prisma.chatMessage.findFirst({
      where: {
        id,
        userId: session.user.id
      }
    })

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }

    const updatedMessage = await prisma.chatMessage.update({
      where: { id },
      data: { feedback }
    })

    return NextResponse.json({ 
      success: true, 
      message: updatedMessage 
    })
  } catch (error) {
    console.error('Chat feedback error:', error)
    return NextResponse.json(
      { error: 'Failed to record feedback' },
      { status: 500 }
    )
  }
}
