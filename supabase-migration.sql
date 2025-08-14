
-- ====================================================
-- AiiA Database Migration to Supabase PostgreSQL
-- Generated from Prisma Schema
-- ====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ====================================================
-- Core Authentication Tables (NextAuth.js)
-- ====================================================

-- Users table
CREATE TABLE "User" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    name TEXT,
    email TEXT UNIQUE NOT NULL,
    password TEXT,
    "emailVerified" TIMESTAMPTZ,
    image TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- User settings
    theme TEXT NOT NULL DEFAULT 'dark',
    "alpacaApiKey" TEXT,
    "alpacaSecret" TEXT,
    "isLiveTrading" BOOLEAN NOT NULL DEFAULT false,
    
    -- Account tier and subscription
    "accountTier" TEXT NOT NULL DEFAULT 'Free',
    "subscriptionId" TEXT,
    "subscriptionStatus" TEXT,
    "subscriptionEndsAt" TIMESTAMPTZ,
    
    -- Onboarding and disclaimers
    "hasCompletedOnboarding" BOOLEAN NOT NULL DEFAULT false,
    "hasAcceptedDisclaimer" BOOLEAN NOT NULL DEFAULT false,
    "disclaimerAcceptedAt" TIMESTAMPTZ,
    
    -- Automation settings
    "aiTradingEnabled" BOOLEAN NOT NULL DEFAULT false,
    "automationSettings" JSONB,
    "riskTolerance" TEXT NOT NULL DEFAULT 'medium'
);

-- Accounts table (OAuth providers)
CREATE TABLE "Account" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "userId" TEXT NOT NULL,
    type TEXT NOT NULL,
    provider TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    refresh_token TEXT,
    access_token TEXT,
    expires_at INTEGER,
    token_type TEXT,
    scope TEXT,
    id_token TEXT,
    session_state TEXT,
    
    CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE(provider, "providerAccountId")
);

-- Sessions table
CREATE TABLE "Session" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "sessionToken" TEXT UNIQUE NOT NULL,
    "userId" TEXT NOT NULL,
    expires TIMESTAMPTZ NOT NULL,
    
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Verification tokens table
CREATE TABLE "VerificationToken" (
    identifier TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires TIMESTAMPTZ NOT NULL,
    
    UNIQUE(identifier, token)
);

-- ====================================================
-- Investment & Trading Tables
-- ====================================================

-- Portfolio table
CREATE TABLE "Portfolio" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "userId" TEXT NOT NULL,
    "totalValue" DOUBLE PRECISION NOT NULL DEFAULT 10000,
    "cashBalance" DOUBLE PRECISION NOT NULL DEFAULT 10000,
    "totalReturn" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "dailyReturn" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT "Portfolio_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE("userId")
);

-- Watchlist table
CREATE TABLE "Watchlist" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "userId" TEXT NOT NULL,
    symbol TEXT NOT NULL,
    type TEXT NOT NULL,
    name TEXT NOT NULL,
    "addedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT "Watchlist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE("userId", symbol)
);

-- Trades table
CREATE TABLE "Trade" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "userId" TEXT NOT NULL,
    symbol TEXT NOT NULL,
    type TEXT NOT NULL,
    action TEXT NOT NULL,
    quantity DOUBLE PRECISION NOT NULL,
    price DOUBLE PRECISION NOT NULL,
    "totalValue" DOUBLE PRECISION NOT NULL,
    fee DOUBLE PRECISION NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'completed',
    "orderType" TEXT,
    "limitPrice" DOUBLE PRECISION,
    "stopPrice" DOUBLE PRECISION,
    "timeInForce" TEXT,
    "executedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT "Trade_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Alerts table
CREATE TABLE "Alert" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "userId" TEXT NOT NULL,
    symbol TEXT NOT NULL,
    type TEXT NOT NULL,
    condition TEXT NOT NULL,
    "targetPrice" DOUBLE PRECISION NOT NULL,
    "currentPrice" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    triggered BOOLEAN NOT NULL DEFAULT false,
    message TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "triggeredAt" TIMESTAMPTZ,
    
    CONSTRAINT "Alert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- ====================================================
-- Market Data & Analysis Tables
-- ====================================================

-- Market data table
CREATE TABLE "MarketData" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    symbol TEXT NOT NULL,
    type TEXT NOT NULL,
    price DOUBLE PRECISION NOT NULL,
    change DOUBLE PRECISION NOT NULL,
    "changePercent" DOUBLE PRECISION NOT NULL,
    volume DOUBLE PRECISION,
    "marketCap" DOUBLE PRECISION,
    "high24h" DOUBLE PRECISION,
    "low24h" DOUBLE PRECISION,
    "lastUpdated" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(symbol, type)
);

-- AI Analysis table
CREATE TABLE "AIAnalysis" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    symbol TEXT NOT NULL,
    type TEXT NOT NULL,
    recommendation TEXT NOT NULL,
    confidence INTEGER NOT NULL,
    reasoning TEXT NOT NULL,
    "technicalScore" INTEGER,
    "fundamentalScore" INTEGER,
    "sentimentScore" INTEGER,
    "riskLevel" TEXT,
    "targetPrice" DOUBLE PRECISION,
    "stopLoss" DOUBLE PRECISION,
    "dataSource" JSONB,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "expiresAt" TIMESTAMPTZ NOT NULL,
    
    UNIQUE(symbol, type)
);

-- News articles table
CREATE TABLE "NewsArticle" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    title TEXT NOT NULL,
    summary TEXT,
    content TEXT,
    url TEXT UNIQUE NOT NULL,
    source TEXT NOT NULL,
    author TEXT,
    "publishedAt" TIMESTAMPTZ NOT NULL,
    symbols TEXT[] NOT NULL DEFAULT '{}',
    sentiment DOUBLE PRECISION,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Recommendations table
CREATE TABLE "Recommendation" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "userId" TEXT NOT NULL,
    symbol TEXT NOT NULL,
    type TEXT NOT NULL,
    recommendation TEXT NOT NULL,
    confidence INTEGER NOT NULL,
    reasoning TEXT NOT NULL,
    "targetPrice" DOUBLE PRECISION,
    "stopLoss" DOUBLE PRECISION,
    priority TEXT NOT NULL DEFAULT 'medium',
    status TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "expiresAt" TIMESTAMPTZ NOT NULL,
    "viewedAt" TIMESTAMPTZ,
    "executedAt" TIMESTAMPTZ,
    
    CONSTRAINT "Recommendation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- ====================================================
-- Communication & Notifications Tables
-- ====================================================

-- Notifications table
CREATE TABLE "Notification" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "userId" TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL,
    data JSONB,
    read BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Chat messages table (AI Assistant)
CREATE TABLE "ChatMessage" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "userId" TEXT NOT NULL,
    message TEXT NOT NULL,
    response TEXT NOT NULL,
    context JSONB,
    feedback TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Financial disclaimers table
CREATE TABLE "FinancialDisclaimer" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "userId" TEXT NOT NULL,
    "disclaimerType" TEXT NOT NULL,
    version TEXT NOT NULL DEFAULT '1.0',
    content TEXT NOT NULL,
    "acceptedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "ipAddress" TEXT,
    "userAgent" TEXT
);

-- ====================================================
-- Subscription & System Tables
-- ====================================================

-- Subscriptions table
CREATE TABLE "Subscription" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "userId" TEXT UNIQUE NOT NULL,
    tier TEXT NOT NULL DEFAULT 'free',
    plan TEXT NOT NULL,
    status TEXT NOT NULL,
    amount DOUBLE PRECISION NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    interval TEXT NOT NULL,
    "startedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "endsAt" TIMESTAMPTZ,
    "cancelledAt" TIMESTAMPTZ,
    metadata JSONB,
    
    CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- System settings table
CREATE TABLE "SystemSetting" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ====================================================
-- Database Indexes for Performance
-- ====================================================

-- User indexes
CREATE INDEX "User_email_idx" ON "User"(email);
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- Account indexes
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- Session indexes
CREATE INDEX "Session_userId_idx" ON "Session"("userId");
CREATE INDEX "Session_sessionToken_idx" ON "Session"("sessionToken");

-- Portfolio indexes
CREATE INDEX "Portfolio_userId_idx" ON "Portfolio"("userId");

-- Watchlist indexes
CREATE INDEX "Watchlist_userId_idx" ON "Watchlist"("userId");
CREATE INDEX "Watchlist_symbol_idx" ON "Watchlist"(symbol);

-- Trade indexes
CREATE INDEX "Trade_userId_idx" ON "Trade"("userId");
CREATE INDEX "Trade_symbol_idx" ON "Trade"(symbol);
CREATE INDEX "Trade_createdAt_idx" ON "Trade"("createdAt");

-- Alert indexes
CREATE INDEX "Alert_userId_idx" ON "Alert"("userId");
CREATE INDEX "Alert_symbol_idx" ON "Alert"(symbol);
CREATE INDEX "Alert_isActive_idx" ON "Alert"("isActive");

-- Market data indexes
CREATE INDEX "MarketData_symbol_idx" ON "MarketData"(symbol);
CREATE INDEX "MarketData_type_changePercent_idx" ON "MarketData"(type, "changePercent");
CREATE INDEX "MarketData_lastUpdated_idx" ON "MarketData"("lastUpdated");

-- AI Analysis indexes
CREATE INDEX "AIAnalysis_symbol_idx" ON "AIAnalysis"(symbol);
CREATE INDEX "AIAnalysis_createdAt_idx" ON "AIAnalysis"("createdAt");
CREATE INDEX "AIAnalysis_expiresAt_idx" ON "AIAnalysis"("expiresAt");

-- News article indexes
CREATE INDEX "NewsArticle_publishedAt_idx" ON "NewsArticle"("publishedAt");
CREATE INDEX "NewsArticle_symbols_idx" ON "NewsArticle" USING GIN(symbols);
CREATE INDEX "NewsArticle_source_idx" ON "NewsArticle"(source);

-- Recommendation indexes
CREATE INDEX "Recommendation_userId_status_idx" ON "Recommendation"("userId", status);
CREATE INDEX "Recommendation_createdAt_idx" ON "Recommendation"("createdAt");
CREATE INDEX "Recommendation_symbol_idx" ON "Recommendation"(symbol);

-- Notification indexes
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");
CREATE INDEX "Notification_read_idx" ON "Notification"(read);

-- Chat message indexes
CREATE INDEX "ChatMessage_userId_idx" ON "ChatMessage"("userId");
CREATE INDEX "ChatMessage_createdAt_idx" ON "ChatMessage"("createdAt");

-- Financial disclaimer indexes
CREATE INDEX "FinancialDisclaimer_userId_idx" ON "FinancialDisclaimer"("userId");
CREATE INDEX "FinancialDisclaimer_disclaimerType_idx" ON "FinancialDisclaimer"("disclaimerType");

-- Subscription indexes
CREATE INDEX "Subscription_userId_idx" ON "Subscription"("userId");
CREATE INDEX "Subscription_status_idx" ON "Subscription"(status);

-- System setting indexes
CREATE INDEX "SystemSetting_key_idx" ON "SystemSetting"(key);

-- ====================================================
-- Create triggers for updated_at timestamps
-- ====================================================

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables with updatedAt columns
CREATE TRIGGER update_user_updated_at BEFORE UPDATE ON "User" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_portfolio_updated_at BEFORE UPDATE ON "Portfolio" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_setting_updated_at BEFORE UPDATE ON "SystemSetting" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ====================================================
-- Row Level Security (RLS) Setup
-- ====================================================

-- Enable RLS on user-specific tables
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Portfolio" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Watchlist" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Trade" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Alert" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Recommendation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ChatMessage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FinancialDisclaimer" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Subscription" ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (users can only access their own data)
CREATE POLICY "Users can view own profile" ON "User" FOR ALL USING (auth.uid()::text = id);
CREATE POLICY "Users can manage own portfolio" ON "Portfolio" FOR ALL USING (auth.uid()::text = "userId");
CREATE POLICY "Users can manage own watchlist" ON "Watchlist" FOR ALL USING (auth.uid()::text = "userId");
CREATE POLICY "Users can view own trades" ON "Trade" FOR ALL USING (auth.uid()::text = "userId");
CREATE POLICY "Users can manage own alerts" ON "Alert" FOR ALL USING (auth.uid()::text = "userId");
CREATE POLICY "Users can view own recommendations" ON "Recommendation" FOR ALL USING (auth.uid()::text = "userId");
CREATE POLICY "Users can view own notifications" ON "Notification" FOR ALL USING (auth.uid()::text = "userId");
CREATE POLICY "Users can view own chat messages" ON "ChatMessage" FOR ALL USING (auth.uid()::text = "userId");
CREATE POLICY "Users can view own disclaimers" ON "FinancialDisclaimer" FOR ALL USING (auth.uid()::text = "userId");
CREATE POLICY "Users can view own subscription" ON "Subscription" FOR ALL USING (auth.uid()::text = "userId");

-- Public read access for market data and news
CREATE POLICY "Public read access for market data" ON "MarketData" FOR SELECT USING (true);
CREATE POLICY "Public read access for AI analysis" ON "AIAnalysis" FOR SELECT USING (true);
CREATE POLICY "Public read access for news" ON "NewsArticle" FOR SELECT USING (true);

-- ====================================================
-- Initial System Settings
-- ====================================================

INSERT INTO "SystemSetting" (key, value) VALUES
('app_version', '2.0.0'),
('maintenance_mode', 'false'),
('trading_enabled', 'true'),
('ai_analysis_enabled', 'true'),
('max_watchlist_items', '50'),
('max_alerts_per_user', '20'),
('data_retention_days', '365'),
('rate_limit_requests_per_minute', '60');

-- ====================================================
-- Completion Message
-- ====================================================

-- Migration completed successfully
SELECT 'AiiA Database Migration to Supabase completed successfully!' as status;
