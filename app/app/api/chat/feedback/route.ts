
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { messageId, feedback } = await request.json()

    if (!messageId || !feedback) {
      return NextResponse.json({ error: 'Message ID and feedback are required' }, { status: 400 })
    }

    if (!['helpful', 'not_helpful'].includes(feedback)) {
      return NextResponse.json({ error: 'Invalid feedback value' }, { status: 400 })
    }

    // Update the chat message with feedback
    const updatedMessage = await prisma.chatMessage.update({
      where: {
        id: messageId,
        userId: session.user.id, // Ensure user can only update their own messages
      },
      data: {
        feedback,
      },
    })

    return NextResponse.json({ success: true, message: updatedMessage })
  } catch (error) {
    console.error('Error updating chat feedback:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
