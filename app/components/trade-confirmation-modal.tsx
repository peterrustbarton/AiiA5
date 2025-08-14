
'use client'

import React from 'react'
import { X, CheckCircle, AlertCircle, ShoppingCart, TrendingDown, Bot, DollarSign } from 'lucide-react'
import { TradeConfirmationModalProps } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export function TradeConfirmationModal({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  isSuccess, 
  tradeDetails 
}: TradeConfirmationModalProps) {
  if (!isOpen) return null

  const IconComponent = isSuccess ? CheckCircle : AlertCircle
  const iconColor = isSuccess ? 'text-emerald-400' : 'text-red-400'
  const bgColor = isSuccess ? 'bg-emerald-500/20' : 'bg-red-500/20'
  const borderColor = isSuccess ? 'border-emerald-500/30' : 'border-red-500/30'
  const buttonColor = isSuccess ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#0B1426] border border-[#1E293B] rounded-xl shadow-2xl max-w-md w-full transform transition-all">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center">
              <IconComponent className={cn("h-6 w-6 mr-3", iconColor)} />
              <h2 className="text-xl font-bold text-white">{title}</h2>
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

          {/* Content */}
          <Card className={cn("mb-4", bgColor, borderColor)}>
            <CardContent className="p-4">
              <div className="flex items-center mb-3">
                <div className={cn(
                  "p-2 rounded-full mr-3",
                  isSuccess ? 'bg-emerald-500/30' : 'bg-red-500/30'
                )}>
                  {tradeDetails?.side === 'buy' ? (
                    <ShoppingCart className={cn("h-5 w-5", iconColor)} />
                  ) : (
                    <TrendingDown className={cn("h-5 w-5", iconColor)} />
                  )}
                </div>
                <div>
                  <p className="text-white font-medium">{message}</p>
                </div>
              </div>

              {/* Trade Details */}
              {tradeDetails && isSuccess && (
                <div className="bg-[#1E293B] rounded-lg p-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Symbol:</span>
                    <span className="font-semibold text-white">{tradeDetails.symbol}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Action:</span>
                    <Badge variant={tradeDetails.side === 'buy' ? 'default' : 'destructive'}>
                      {tradeDetails.side.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Quantity:</span>
                    <span className="font-semibold text-white">{tradeDetails.quantity.toLocaleString()} shares</span>
                  </div>
                  {tradeDetails.orderType && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Order Type:</span>
                      <span className="font-semibold text-white capitalize">{tradeDetails.orderType.replace('_', ' ')}</span>
                    </div>
                  )}
                  {tradeDetails.price && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Price:</span>
                      <span className="font-semibold text-white">${tradeDetails.price.toFixed(2)}</span>
                    </div>
                  )}
                  {tradeDetails.estimatedValue && (
                    <div className="flex justify-between text-sm border-t border-[#334155] pt-2">
                      <span className="text-gray-400">Total Value:</span>
                      <span className="font-bold text-white">${tradeDetails.estimatedValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Error Details */}
              {!isSuccess && (
                <div className="bg-[#1E293B] rounded-lg p-3 mt-3">
                  <p className="text-red-300 text-sm">
                    Please try again or contact support if the issue persists.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Success Tips */}
          {isSuccess && (
            <Card className="bg-blue-500/20 border-blue-500/30 mb-4">
              <CardContent className="p-3">
                <div className="flex items-start">
                  <Bot className="h-4 w-4 text-blue-400 mt-0.5 mr-2 flex-shrink-0" />
                  <div className="text-sm text-blue-200">
                    <p className="font-medium mb-1">AI Tip</p>
                    <p>
                      Your order has been placed successfully. Monitor your portfolio for updates and consider setting alerts for price movements.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="border-[#334155] text-gray-300 hover:bg-[#1E293B]"
            >
              Close
            </Button>
            <Button
              onClick={onClose}
              className={cn("text-white font-medium", buttonColor)}
            >
              {isSuccess ? 'Great!' : 'Understood'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
