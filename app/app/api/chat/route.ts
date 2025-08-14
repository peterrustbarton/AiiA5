
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

    const { message } = await request.json()

    if (!message || !message.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // For now, we'll use a simple AI response generator
    // In a real implementation, this would connect to an LLM API
    const response = await generateAIResponse(message)

    // Save the chat message to database
    const chatMessage = await prisma.chatMessage.create({
      data: {
        userId: session.user.id,
        message: message.trim(),
        response,
      },
    })

    return NextResponse.json({
      id: chatMessage.id,
      response,
      createdAt: chatMessage.createdAt,
    })
  } catch (error) {
    console.error('Error processing chat message:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function generateAIResponse(message: string): Promise<string> {
  // Simple keyword-based responses for demo purposes
  // In a real implementation, this would use an LLM API
  const lowerMessage = message.toLowerCase()

  if (lowerMessage.includes('portfolio') || lowerMessage.includes('balance')) {
    return 'I can help you understand your portfolio performance. Your portfolio value includes your cash balance plus the current value of all your positions. Would you like me to explain how to interpret your portfolio metrics?'
  }

  if (lowerMessage.includes('buy') || lowerMessage.includes('sell') || lowerMessage.includes('trade')) {
    return 'I can help you understand trading concepts. Remember to always do your own research before making investment decisions. Consider factors like risk tolerance, time horizon, and diversification. Would you like me to explain any specific trading concepts?'
  }

  if (lowerMessage.includes('risk') || lowerMessage.includes('safe')) {
    return 'Risk management is crucial in investing. Generally, higher potential returns come with higher risk. Consider diversifying your portfolio, setting stop-losses, and only investing what you can afford to lose. What specific risk-related questions do you have?'
  }

  if (lowerMessage.includes('analysis') || lowerMessage.includes('ai') || lowerMessage.includes('recommendation')) {
    return 'My AI analysis considers multiple factors including technical indicators, fundamental data, and market sentiment. However, these are educational insights only and should not be considered financial advice. Always conduct your own research and consider consulting with a qualified financial advisor.'
  }

  if (lowerMessage.includes('stock') || lowerMessage.includes('equity')) {
    return 'Stocks represent ownership in companies. When evaluating stocks, consider factors like the company\'s financial health, growth prospects, valuation metrics, and industry trends. Would you like me to explain any specific stock analysis concepts?'
  }

  if (lowerMessage.includes('crypto') || lowerMessage.includes('bitcoin') || lowerMessage.includes('ethereum')) {
    return 'Cryptocurrencies are highly volatile digital assets. They can experience significant price swings and regulatory changes. If you\'re interested in crypto, start with small amounts and thoroughly research the technology and risks involved. Note that crypto trading requires a Pro subscription.'
  }

  if (lowerMessage.includes('help') || lowerMessage.includes('how')) {
    return 'I\'m here to help you learn about investing and trading concepts. I can explain portfolio management, risk assessment, market analysis, and trading strategies. What specific topic would you like to learn about?'
  }

  // Default response
  return 'I understand you\'re asking about investing and trading. I\'m here to provide educational information about financial markets, portfolio management, and trading concepts. Please remember that I provide educational content only and not financial advice. What specific topic would you like to explore?'
}
