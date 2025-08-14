import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create demo user with hashed password (Admin privileges)
  const hashedPassword = await bcrypt.hash('johndoe123', 12)
  
  const demoUser = await prisma.user.upsert({
    where: { email: 'john@doe.com' },
    update: {},
    create: {
      email: 'john@doe.com',
      name: 'John Doe',
      password: hashedPassword,
      theme: 'dark',
      accountTier: 'Admin',
      hasCompletedOnboarding: true,
      hasAcceptedDisclaimer: true,
      disclaimerAcceptedAt: new Date(),
      // Demo Alpaca keys (these are fake for demo purposes)
      alpacaApiKey: 'DEMO_KEY_123',
      alpacaSecret: 'DEMO_SECRET_456',
      isLiveTrading: false,
      aiTradingEnabled: true,
      riskTolerance: 'medium',
      automationSettings: {
        buyThreshold: 75,
        sellThreshold: 25,
        maxDailyTrades: 5,
        maxPositionSize: 1000,
        requireManualConfirmation: false,
        stopLossEnabled: true,
        stopLossPercentage: 10,
        takeProfitEnabled: true,
        takeProfitPercentage: 20,
        allowedSymbols: [],
        blockedSymbols: [],
        tradingHours: {
          enabled: true,
          start: '09:30',
          end: '16:00'
        }
      }
    },
  })

  console.log('✅ Demo admin user created:', demoUser.email)

  // Create additional demo users for different tiers
  const proUser = await prisma.user.upsert({
    where: { email: 'pro@demo.com' },
    update: {},
    create: {
      email: 'pro@demo.com',
      name: 'Pro Demo User',
      password: hashedPassword,
      theme: 'dark',
      accountTier: 'Pro',
      hasCompletedOnboarding: true,
      hasAcceptedDisclaimer: true,
      disclaimerAcceptedAt: new Date(),
      aiTradingEnabled: true,
      riskTolerance: 'high',
    },
  })

  const freeUser = await prisma.user.upsert({
    where: { email: 'free@demo.com' },
    update: {},
    create: {
      email: 'free@demo.com',
      name: 'Free Demo User',
      password: hashedPassword,
      theme: 'light',
      accountTier: 'Free',
      hasCompletedOnboarding: false,
      hasAcceptedDisclaimer: true,
      disclaimerAcceptedAt: new Date(),
      aiTradingEnabled: false,
      riskTolerance: 'low',
    },
  })

  console.log('✅ Additional demo users created')

  // Create portfolio for demo users
  const adminPortfolio = await prisma.portfolio.upsert({
    where: { userId: demoUser.id },
    update: {},
    create: {
      userId: demoUser.id,
      totalValue: 50000,
      cashBalance: 25000,
      totalReturn: 5000,
      dailyReturn: 250,
    },
  })

  const proPortfolio = await prisma.portfolio.upsert({
    where: { userId: proUser.id },
    update: {},
    create: {
      userId: proUser.id,
      totalValue: 25000,
      cashBalance: 12000,
      totalReturn: 2500,
      dailyReturn: 125,
    },
  })

  const freePortfolio = await prisma.portfolio.upsert({
    where: { userId: freeUser.id },
    update: {},
    create: {
      userId: freeUser.id,
      totalValue: 10000,
      cashBalance: 8500,
      totalReturn: 150,
      dailyReturn: 25,
    },
  })

  console.log('✅ Demo portfolios created')

  // Create subscriptions for Pro user
  const proSubscription = await prisma.subscription.create({
    data: {
      userId: proUser.id,
      plan: 'pro',
      status: 'active',
      amount: 29,
      currency: 'USD',
      interval: 'monthly',
      endsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
    }
  })

  console.log('✅ Demo subscriptions created')

  // Create sample watchlist items for all users
  const watchlistItems = [
    { symbol: 'AAPL', type: 'stock', name: 'Apple Inc.' },
    { symbol: 'GOOGL', type: 'stock', name: 'Alphabet Inc.' },
    { symbol: 'TSLA', type: 'stock', name: 'Tesla Inc.' },
    { symbol: 'MSFT', type: 'stock', name: 'Microsoft Corporation' },
    { symbol: 'AMZN', type: 'stock', name: 'Amazon.com Inc.' },
    { symbol: 'BTC', type: 'crypto', name: 'Bitcoin' },
    { symbol: 'ETH', type: 'crypto', name: 'Ethereum' },
  ]

  const users = [demoUser, proUser, freeUser]
  for (const user of users) {
    const itemsForUser = user.accountTier === 'Free' ? watchlistItems.slice(0, 5) : watchlistItems
    
    for (const item of itemsForUser) {
      await prisma.watchlist.upsert({
        where: {
          userId_symbol: {
            userId: user.id,
            symbol: item.symbol,
          },
        },
        update: {},
        create: {
          userId: user.id,
          symbol: item.symbol,
          type: item.type as 'stock' | 'crypto',
          name: item.name,
        },
      })
    }
  }

  console.log('✅ Sample watchlist items created')

  // Create sample trades for all users
  const trades = [
    {
      symbol: 'AAPL',
      type: 'stock',
      action: 'buy',
      quantity: 10,
      price: 150.00,
      totalValue: 1500.00,
    },
    {
      symbol: 'GOOGL',
      type: 'stock', 
      action: 'buy',
      quantity: 5,
      price: 2800.00,
      totalValue: 14000.00,
    },
    {
      symbol: 'TSLA',
      type: 'stock',
      action: 'sell',
      quantity: 3,
      price: 250.00,
      totalValue: 750.00,
    },
    {
      symbol: 'BTC',
      type: 'crypto',
      action: 'buy',
      quantity: 0.1,
      price: 45000.00,
      totalValue: 4500.00,
    },
    {
      symbol: 'ETH',
      type: 'crypto',
      action: 'buy',
      quantity: 2,
      price: 3000.00,
      totalValue: 6000.00,
    },
  ]

  for (const user of users) {
    const tradesForUser = user.accountTier === 'Free' ? trades.slice(0, 3) : trades
    
    for (const trade of tradesForUser) {
      await prisma.trade.create({
        data: {
          userId: user.id,
          symbol: trade.symbol,
          type: trade.type as 'stock' | 'crypto',
          action: trade.action as 'buy' | 'sell',
          quantity: trade.quantity,
          price: trade.price,
          totalValue: trade.totalValue,
          executedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random time in last 7 days
        },
      })
    }
  }

  console.log('✅ Sample trades created')

  // Create sample alerts
  const alerts = [
    {
      symbol: 'AAPL',
      type: 'stock',
      condition: 'above',
      targetPrice: 160.00,
      currentPrice: 150.00,
      message: 'Apple stock reached target price',
    },
    {
      symbol: 'BTC',
      type: 'crypto',
      condition: 'below',
      targetPrice: 40000.00,
      currentPrice: 45000.00,
      message: 'Bitcoin dropped below target',
    },
    {
      symbol: 'TSLA',
      type: 'stock',
      condition: 'above',
      targetPrice: 300.00,
      currentPrice: 250.00,
      message: 'Tesla stock price alert',
    },
  ]

  for (const user of users) {
    for (const alert of alerts) {
      await prisma.alert.create({
        data: {
          userId: user.id,
          symbol: alert.symbol,
          type: alert.type as 'stock' | 'crypto',
          condition: alert.condition as 'above' | 'below',
          targetPrice: alert.targetPrice,
          currentPrice: alert.currentPrice,
          message: alert.message,
        },
      })
    }
  }

  console.log('✅ Sample alerts created')

  // Create sample AI recommendations
  const recommendations = [
    {
      symbol: 'AAPL',
      type: 'stock',
      recommendation: 'buy',
      confidence: 85,
      reasoning: 'Strong quarterly earnings, positive analyst sentiment, and robust product pipeline suggest continued growth potential.',
      targetPrice: 165.00,
      stopLoss: 140.00,
      priority: 'high',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
    {
      symbol: 'TSLA',
      type: 'stock',
      recommendation: 'hold',
      confidence: 65,
      reasoning: 'Mixed signals from recent production data and regulatory concerns. Recommend waiting for clearer direction.',
      targetPrice: 280.00,
      stopLoss: 220.00,
      priority: 'medium',
      expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days
    },
    {
      symbol: 'BTC',
      type: 'crypto',
      recommendation: 'buy',
      confidence: 78,
      reasoning: 'Institutional adoption continues, regulatory clarity improving, and technical indicators show bullish momentum.',
      targetPrice: 50000.00,
      stopLoss: 38000.00,
      priority: 'high',
      expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
    },
  ]

  for (const user of users) {
    for (const rec of recommendations) {
      await prisma.recommendation.create({
        data: {
          userId: user.id,
          symbol: rec.symbol,
          type: rec.type as 'stock' | 'crypto',
          recommendation: rec.recommendation as 'buy' | 'sell' | 'hold',
          confidence: rec.confidence,
          reasoning: rec.reasoning,
          targetPrice: rec.targetPrice,
          stopLoss: rec.stopLoss,
          priority: rec.priority as 'low' | 'medium' | 'high',
          expiresAt: rec.expiresAt,
        },
      })
    }
  }

  console.log('✅ Sample AI recommendations created')

  // Create sample AI analyses
  const analyses = [
    {
      symbol: 'AAPL',
      type: 'stock',
      recommendation: 'buy',
      confidence: 85,
      reasoning: 'Apple shows strong fundamentals with excellent revenue growth, expanding services segment, and innovative product pipeline. Technical indicators suggest continued upward momentum.',
      technicalScore: 82,
      fundamentalScore: 88,
      sentimentScore: 79,
      riskLevel: 'low',
      targetPrice: 165.00,
      stopLoss: 140.00,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    },
    {
      symbol: 'TSLA',
      type: 'stock',
      recommendation: 'hold',
      confidence: 65,
      reasoning: 'Tesla faces mixed signals with production challenges offset by strong EV market position. Regulatory environment remains uncertain.',
      technicalScore: 68,
      fundamentalScore: 62,
      sentimentScore: 65,
      riskLevel: 'high',
      targetPrice: 280.00,
      stopLoss: 220.00,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    },
    {
      symbol: 'BTC',
      type: 'crypto',
      recommendation: 'buy',
      confidence: 78,
      reasoning: 'Bitcoin benefits from increasing institutional adoption and improving regulatory clarity. Technical patterns indicate potential breakout.',
      technicalScore: 85,
      sentimentScore: 71,
      riskLevel: 'medium',
      targetPrice: 50000.00,
      stopLoss: 38000.00,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    },
  ]

  for (const analysis of analyses) {
    await prisma.aIAnalysis.upsert({
      where: {
        symbol_type: {
          symbol: analysis.symbol,
          type: analysis.type as 'stock' | 'crypto',
        },
      },
      update: {
        recommendation: analysis.recommendation as 'buy' | 'sell' | 'hold',
        confidence: analysis.confidence,
        reasoning: analysis.reasoning,
        technicalScore: analysis.technicalScore,
        fundamentalScore: analysis.fundamentalScore,
        sentimentScore: analysis.sentimentScore,
        riskLevel: analysis.riskLevel as 'low' | 'medium' | 'high',
        targetPrice: analysis.targetPrice,
        stopLoss: analysis.stopLoss,
        expiresAt: analysis.expiresAt,
      },
      create: {
        symbol: analysis.symbol,
        type: analysis.type as 'stock' | 'crypto',
        recommendation: analysis.recommendation as 'buy' | 'sell' | 'hold',
        confidence: analysis.confidence,
        reasoning: analysis.reasoning,
        technicalScore: analysis.technicalScore,
        fundamentalScore: analysis.fundamentalScore,
        sentimentScore: analysis.sentimentScore,
        riskLevel: analysis.riskLevel as 'low' | 'medium' | 'high',
        targetPrice: analysis.targetPrice,
        stopLoss: analysis.stopLoss,
        expiresAt: analysis.expiresAt,
      },
    })
  }

  console.log('✅ Sample AI analyses created')

  // Create sample chat messages
  const chatMessages = [
    {
      userId: demoUser.id,
      message: 'What are the current market trends?',
      response: 'Current market trends show a mixed sentiment with technology stocks showing resilience while energy sector faces volatility. Key factors include interest rate expectations and geopolitical tensions. I recommend focusing on companies with strong fundamentals and diversifying across sectors.',
    },
    {
      userId: demoUser.id,
      message: 'Should I invest in Apple stock?',
      response: 'Apple (AAPL) shows strong fundamentals with consistent revenue growth and a robust ecosystem. However, consider your risk tolerance and portfolio diversification. The stock appears to have good long-term prospects, but always conduct your own research and consider consulting with a financial advisor.',
    },
  ]

  for (const msg of chatMessages) {
    await prisma.chatMessage.create({
      data: msg,
    })
  }

  console.log('✅ Sample chat messages created')

  // Create system settings
  const systemSettings = [
    { key: 'app_version', value: '2.0.0' },
    { key: 'maintenance_mode', value: 'false' },
    { key: 'max_free_watchlist_items', value: '5' },
    { key: 'max_pro_watchlist_items', value: '100' },
    { key: 'ai_analysis_cache_hours', value: '1' },
  ]

  for (const setting of systemSettings) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    })
  }

  console.log('✅ System settings created')

  console.log('🎉 Database seeding completed successfully!')
  console.log('')
  console.log('Demo account credentials:')
  console.log('Admin: john@doe.com / johndoe123')
  console.log('Pro: pro@demo.com / johndoe123')
  console.log('Free: free@demo.com / johndoe123')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })