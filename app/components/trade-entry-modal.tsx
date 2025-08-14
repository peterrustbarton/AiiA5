
'use client'

import React, { useState, useEffect } from 'react'
import { X, ShoppingCart, DollarSign, AlertTriangle, Info, TrendingUp, TrendingDown, Bot } from 'lucide-react'
import { TradeEntryModalProps, TradeData } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { cn } from '@/lib/utils'

export function TradeEntryModal({ 
  isOpen, 
  onClose, 
  symbol, 
  side, 
  currentPrice, 
  onTrade,
  analysis,
  currentPosition,
  accountTier = 'free'
}: TradeEntryModalProps) {
  const [quantity, setQuantity] = useState<number>(1)
  const [dollarAmount, setDollarAmount] = useState<number>(100)
  const [useDollarAmount, setUseDollarAmount] = useState<boolean>(false)
  const [orderType, setOrderType] = useState<'market' | 'limit' | 'stop' | 'stop_limit'>('market')
  const [limitPrice, setLimitPrice] = useState<number>(currentPrice)
  const [stopPrice, setStopPrice] = useState<number>(currentPrice * 0.95)
  const [timeInForce, setTimeInForce] = useState<'day' | 'gtc' | 'ioc' | 'fok'>('day')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuantity(1)
      setDollarAmount(100)
      setUseDollarAmount(false)
      setOrderType('market')
      setLimitPrice(currentPrice)
      setStopPrice(currentPrice * (side === 'buy' ? 1.05 : 0.95))
      setTimeInForce('day')
      setIsSubmitting(false)
      setError(null)
    }
  }, [isOpen, currentPrice, side])

  // Calculate estimated values
  const estimatedShares = useDollarAmount ? Math.floor(dollarAmount / currentPrice) : quantity
  const estimatedCost = useDollarAmount ? dollarAmount : quantity * currentPrice
  const estimatedFee = Math.max(1, estimatedCost * 0.001)

  // Format position info
  const positionInfo = currentPosition ? {
    shares: parseFloat(currentPosition.quantity.toString()).toLocaleString(),
    value: currentPosition.totalValue.toFixed(2),
    unrealizedPnL: currentPosition.unrealizedPnL
  } : null

  // Account tier restrictions
  const hasAdvancedOrders = accountTier === 'pro' || accountTier === 'admin'
  const maxDollarAmount = accountTier === 'free' ? 1000 : accountTier === 'pro' ? 10000 : 100000

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      // Validation
      if (useDollarAmount && dollarAmount <= 0) {
        throw new Error('Dollar amount must be greater than 0')
      }
      if (useDollarAmount && dollarAmount > maxDollarAmount) {
        throw new Error(`${accountTier.toUpperCase()} accounts are limited to $${maxDollarAmount.toLocaleString()} per trade`)
      }
      if (!useDollarAmount && quantity <= 0) {
        throw new Error('Quantity must be greater than 0')
      }
      if ((orderType === 'limit' || orderType === 'stop_limit') && limitPrice <= 0) {
        throw new Error('Limit price must be greater than 0')
      }
      if ((orderType === 'stop' || orderType === 'stop_limit') && stopPrice <= 0) {
        throw new Error('Stop price must be greater than 0')
      }
      if (!hasAdvancedOrders && (orderType === 'stop' || orderType === 'stop_limit')) {
        throw new Error('Stop orders are only available for Pro and Admin accounts')
      }

      const tradeData: TradeData = {
        symbol,
        side,
        quantity: useDollarAmount ? estimatedShares : quantity,
        orderType,
        limitPrice: (orderType === 'limit' || orderType === 'stop_limit') ? limitPrice : undefined,
        stopPrice: (orderType === 'stop' || orderType === 'stop_limit') ? stopPrice : undefined,
        timeInForce,
        dollarAmount: useDollarAmount ? dollarAmount : undefined,
        useDollarAmount,
        confidenceScore: analysis?.confidence,
        aiRecommendation: analysis?.recommendation,
        currentPrice
      }

      await onTrade(tradeData)
      onClose()
    } catch (error: any) {
      setError(error.message || 'Failed to place trade')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  const sideColor = side === 'buy' ? 'emerald' : 'red'
  const SideIcon = side === 'buy' ? ShoppingCart : TrendingDown

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#0B1426] border border-[#1E293B] rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center">
              <div className={cn(
                "p-3 rounded-full mr-4",
                side === 'buy' ? 'bg-emerald-500/20' : 'bg-red-500/20'
              )}>
                <SideIcon className={cn(
                  "h-6 w-6",
                  side === 'buy' ? 'text-emerald-400' : 'text-red-400'
                )} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {side.toUpperCase()} {symbol}
                </h2>
                <p className="text-gray-400">
                  Current Price: <span className="text-white font-medium">${currentPrice.toFixed(2)}</span>
                </p>
                {analysis && (
                  <div className="flex items-center gap-2 mt-1">
                    <Bot className="h-4 w-4 text-blue-400" />
                    <p className="text-sm text-gray-400">
                      AI: <span className="text-blue-400">{analysis.recommendation}</span> 
                      <span className="text-white ml-1">({(analysis.confidence * 100).toFixed(0)}% confidence)</span>
                      {analysis.timeHorizon && <span className="text-gray-400 ml-1">• {analysis.timeHorizon}</span>}
                    </p>
                  </div>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-gray-400 hover:text-white hover:bg-[#1E293B]"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>

          {/* Account Tier Badge */}
          <div className="mb-4">
            <Badge variant={accountTier === 'free' ? 'secondary' : accountTier === 'pro' ? 'default' : 'destructive'}>
              {accountTier.toUpperCase()} Account
            </Badge>
            {accountTier === 'free' && (
              <p className="text-sm text-yellow-400 mt-1">
                Upgrade to Pro for advanced order types and higher limits
              </p>
            )}
          </div>

          {/* Current Position Display */}
          {positionInfo && (
            <Card className="mb-6 bg-[#1E293B] border-[#334155]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-blue-400">Current Position</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">{positionInfo.shares} shares</span>
                  <span className="text-white font-medium">${positionInfo.value}</span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-gray-400 text-sm">Unrealized P&L</span>
                  <span className={cn(
                    "font-medium text-sm",
                    positionInfo.unrealizedPnL >= 0 ? 'text-emerald-400' : 'text-red-400'
                  )}>
                    {positionInfo.unrealizedPnL >= 0 ? '+' : ''}${positionInfo.unrealizedPnL.toFixed(2)}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {error && (
            <Alert className="mb-4 bg-red-500/20 border-red-500/30">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-300">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Quantity or Dollar Amount */}
            <div className="space-y-4">
              <Label className="text-white font-medium">Order Size</Label>
              <RadioGroup
                value={useDollarAmount ? 'dollars' : 'shares'}
                onValueChange={(value) => setUseDollarAmount(value === 'dollars')}
                className="flex gap-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="shares" id="shares" />
                  <Label htmlFor="shares" className="text-gray-300">Number of Shares</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="dollars" id="dollars" />
                  <Label htmlFor="dollars" className="text-gray-300">Dollar Amount</Label>
                </div>
              </RadioGroup>

              {useDollarAmount ? (
                <div>
                  <Label className="text-gray-300">Dollar Amount</Label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">$</span>
                    <Input
                      type="number"
                      value={dollarAmount}
                      onChange={(e) => setDollarAmount(Number(e.target.value))}
                      className="pl-8 bg-[#1E293B] border-[#334155] text-white"
                      min="1"
                      max={maxDollarAmount}
                      step="0.01"
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Estimated shares: <span className="text-white">{estimatedShares.toLocaleString()}</span>
                    {accountTier === 'free' && (
                      <span className="text-yellow-400 ml-2">Max: $1,000</span>
                    )}
                  </p>
                </div>
              ) : (
                <div>
                  <Label className="text-gray-300">Number of Shares</Label>
                  <Input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="mt-1 bg-[#1E293B] border-[#334155] text-white"
                    min="1"
                    step="1"
                    required
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Estimated cost: <span className="text-white">${estimatedCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </p>
                </div>
              )}
            </div>

            {/* Order Type */}
            <div>
              <Label className="text-gray-300">Order Type</Label>
              <Select value={orderType} onValueChange={(value: any) => setOrderType(value)}>
                <SelectTrigger className="mt-1 bg-[#1E293B] border-[#334155] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1E293B] border-[#334155]">
                  <SelectItem value="market">Market Order</SelectItem>
                  <SelectItem value="limit">Limit Order</SelectItem>
                  {hasAdvancedOrders && <SelectItem value="stop">Stop Order</SelectItem>}
                  {hasAdvancedOrders && <SelectItem value="stop_limit">Stop Limit Order</SelectItem>}
                </SelectContent>
              </Select>
              <div className="mt-1 text-xs text-gray-400">
                {orderType === 'market' && 'Execute immediately at current market price'}
                {orderType === 'limit' && 'Execute only at specified price or better'}
                {orderType === 'stop' && 'Trigger market order when stop price is reached'}
                {orderType === 'stop_limit' && 'Trigger limit order when stop price is reached'}
              </div>
            </div>

            {/* Limit Price */}
            {(orderType === 'limit' || orderType === 'stop_limit') && (
              <div>
                <Label className="text-gray-300">Limit Price</Label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">$</span>
                  <Input
                    type="number"
                    value={limitPrice}
                    onChange={(e) => setLimitPrice(Number(e.target.value))}
                    className="pl-8 bg-[#1E293B] border-[#334155] text-white"
                    min="0.01"
                    step="0.01"
                    required
                  />
                </div>
              </div>
            )}

            {/* Stop Price */}
            {(orderType === 'stop' || orderType === 'stop_limit') && (
              <div>
                <Label className="text-gray-300">Stop Price</Label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">$</span>
                  <Input
                    type="number"
                    value={stopPrice}
                    onChange={(e) => setStopPrice(Number(e.target.value))}
                    className="pl-8 bg-[#1E293B] border-[#334155] text-white"
                    min="0.01"
                    step="0.01"
                    required
                  />
                </div>
              </div>
            )}

            {/* Time in Force */}
            <div>
              <Label className="text-gray-300">Time in Force</Label>
              <Select value={timeInForce} onValueChange={(value: any) => setTimeInForce(value)}>
                <SelectTrigger className="mt-1 bg-[#1E293B] border-[#334155] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1E293B] border-[#334155]">
                  <SelectItem value="day">Day (Good for Day)</SelectItem>
                  <SelectItem value="gtc">GTC (Good Till Canceled)</SelectItem>
                  <SelectItem value="ioc">IOC (Immediate or Cancel)</SelectItem>
                  <SelectItem value="fok">FOK (Fill or Kill)</SelectItem>
                </SelectContent>
              </Select>
              <div className="mt-1 text-xs text-gray-400">
                {timeInForce === 'day' && 'Order expires at end of trading day'}
                {timeInForce === 'gtc' && 'Order remains active until filled or canceled'}
                {timeInForce === 'ioc' && 'Fill immediately, cancel any unfilled portion'}
                {timeInForce === 'fok' && 'Fill entire order immediately or cancel'}
              </div>
            </div>

            {/* AI Analysis Display */}
            {analysis && (
              <Card className="bg-blue-500/20 border-blue-500/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-blue-400 flex items-center gap-2">
                    <Bot className="h-4 w-4" />
                    AI Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-300">Recommendation:</span>
                      <Badge variant={analysis.recommendation === 'buy' ? 'default' : analysis.recommendation === 'sell' ? 'destructive' : 'secondary'}>
                        {analysis.recommendation.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Confidence:</span>
                      <span className="text-white">{(analysis.confidence * 100).toFixed(0)}%</span>
                    </div>
                    {analysis.riskLevel && (
                      <div className="flex justify-between">
                        <span className="text-gray-300">Risk Level:</span>
                        <Badge variant={analysis.riskLevel === 'low' ? 'default' : analysis.riskLevel === 'medium' ? 'secondary' : 'destructive'}>
                          {analysis.riskLevel.toUpperCase()}
                        </Badge>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Order Summary */}
            <Card className="bg-[#1E293B] border-[#334155]">
              <CardHeader className="pb-3">
                <CardTitle className="text-white">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-300">Action:</span>
                  <span className={cn(
                    "font-medium",
                    side === 'buy' ? 'text-emerald-400' : 'text-red-400'
                  )}>
                    {side.toUpperCase()} {symbol}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Shares:</span>
                  <span className="text-white font-medium">{estimatedShares.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Order Type:</span>
                  <span className="text-white font-medium capitalize">{orderType.replace('_', ' ')}</span>
                </div>
                {(orderType === 'limit' || orderType === 'stop_limit') && (
                  <div className="flex justify-between">
                    <span className="text-gray-300">Limit Price:</span>
                    <span className="text-white font-medium">${limitPrice.toFixed(2)}</span>
                  </div>
                )}
                {(orderType === 'stop' || orderType === 'stop_limit') && (
                  <div className="flex justify-between">
                    <span className="text-gray-300">Stop Price:</span>
                    <span className="text-white font-medium">${stopPrice.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-300">Time in Force:</span>
                  <span className="text-white font-medium">{timeInForce.toUpperCase()}</span>
                </div>
                <Separator className="bg-[#334155]" />
                <div className="flex justify-between">
                  <span className="text-gray-300">Estimated Value:</span>
                  <span className="text-white font-bold">${estimatedCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Est. Fee:</span>
                  <span className="text-gray-400">${estimatedFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-[#334155] pt-2">
                  <span className="text-gray-300">Total:</span>
                  <span className="text-white font-bold">${(estimatedCost + estimatedFee).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </CardContent>
            </Card>

            {/* Risk Warning */}
            <Alert className="bg-yellow-500/20 border-yellow-500/30">
              <Info className="h-4 w-4 text-yellow-400" />
              <AlertDescription className="text-yellow-200">
                <p className="font-medium mb-1">Trading Risk Warning</p>
                <p className="text-sm">
                  All trading involves risk. Market orders execute immediately but price may vary. 
                  Limit orders may not execute if price conditions aren't met. Consider your risk tolerance carefully.
                </p>
              </AlertDescription>
            </Alert>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-[#334155]">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
                className="border-[#334155] text-gray-300 hover:bg-[#1E293B]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className={cn(
                  "flex items-center gap-2 font-medium",
                  side === 'buy' 
                    ? 'bg-emerald-600 hover:bg-emerald-700' 
                    : 'bg-red-600 hover:bg-red-700'
                )}
              >
                <SideIcon className="h-4 w-4" />
                {isSubmitting ? 'Placing Order...' : `${side.toUpperCase()} ${symbol}`}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
