
export interface User {
  id: string;
  name?: string;
  email: string;
  image?: string;
  theme: string;
  alpacaApiKey?: string;
  alpacaSecret?: string;
  isLiveTrading: boolean;
}

export interface Asset {
  symbol: string;
  name: string;
  type: 'stock' | 'crypto';
  price: number;
  change: number;
  changePercent: number;
  volume?: number;
  marketCap?: number;
  high24h?: number;
  low24h?: number;
}

export interface AIAnalysis {
  symbol: string;
  type: 'stock' | 'crypto';
  recommendation: 'buy' | 'sell' | 'hold';
  confidence: number;
  reasoning: string;
  technicalScore?: number;
  fundamentalScore?: number;
  sentimentScore?: number;
  riskLevel?: 'low' | 'medium' | 'high';
  targetPrice?: number;
  stopLoss?: number;
  lastUpdated: Date;
}

export interface Trade {
  id: string;
  symbol: string;
  type: 'stock' | 'crypto';
  action: 'buy' | 'sell';
  quantity: number;
  price: number;
  totalValue: number;
  fee: number;
  status: 'pending' | 'completed' | 'cancelled' | 'rejected';
  executedAt: Date;
  orderType?: 'market' | 'limit' | 'stop' | 'stop_limit';
  limitPrice?: number;
  stopPrice?: number;
  timeInForce?: 'day' | 'gtc' | 'ioc' | 'fok';
}

// Enhanced trade data for comprehensive trade modal
export interface TradeData {
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  orderType: 'market' | 'limit' | 'stop' | 'stop_limit';
  limitPrice?: number;
  stopPrice?: number;
  timeInForce: 'day' | 'gtc' | 'ioc' | 'fok';
  dollarAmount?: number;
  useDollarAmount: boolean;
  confidenceScore?: number;
  aiRecommendation?: string;
  currentPrice?: number;
}

// Trade modal props interfaces
export interface TradeEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  symbol: string;
  side: 'buy' | 'sell';
  currentPrice: number;
  onTrade: (tradeData: TradeData) => Promise<void>;
  analysis?: {
    recommendation: string;
    confidence: number;
    reasons?: string[];
    timeHorizon?: string;
    riskLevel?: 'low' | 'medium' | 'high';
  };
  currentPosition?: Position | null;
  accountTier?: 'free' | 'pro' | 'admin';
}

export interface TradeConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  isSuccess: boolean;
  tradeDetails?: {
    symbol: string;
    side: 'buy' | 'sell';
    quantity: number;
    price?: number;
    orderType?: string;
    estimatedValue?: number;
  };
}

export interface Portfolio {
  totalValue: number;
  cashBalance: number;
  totalReturn: number;
  dailyReturn: number;
  positions: Position[];
}

export interface Position {
  symbol: string;
  name: string;
  type: 'stock' | 'crypto';
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  totalValue: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
}

export interface Alert {
  id: string;
  symbol: string;
  type: 'stock' | 'crypto';
  condition: 'above' | 'below';
  targetPrice: number;
  currentPrice?: number;
  isActive: boolean;
  triggered: boolean;
  message?: string;
  createdAt: Date;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'alert' | 'trade' | 'news' | 'system';
  data?: any;
  read: boolean;
  createdAt: Date;
}

export interface NewsArticle {
  id: string;
  title: string;
  summary?: string;
  url: string;
  source: string;
  author?: string;
  publishedAt: Date;
  symbols: string[];
  sentiment?: number;
}

export interface MarketMover {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume?: number;
}

export interface ChartData {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  cached?: boolean;
}
