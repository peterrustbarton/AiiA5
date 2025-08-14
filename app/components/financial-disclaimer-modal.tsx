
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { AlertTriangle, Shield, TrendingDown, DollarSign } from 'lucide-react'

interface FinancialDisclaimerModalProps {
  isOpen: boolean
  onClose: () => void
  type: 'login' | 'trading' | 'investment'
  onAccept?: () => void
}

const disclaimerContent = {
  login: {
    title: 'Financial Disclaimer & Terms of Use',
    icon: Shield,
    content: `
## Important Financial Disclaimer

**Investment Risk Warning**
All investments involve substantial risk of loss. The value of your investments may go down as well as up, and you may lose some or all of your invested capital.

**AI Analysis Disclaimer**
- AiiA provides AI-powered analysis for educational purposes only
- Our recommendations are not guaranteed investment advice
- Past performance does not predict future results
- All trading decisions should be made at your own discretion

**Service Terms**
- Paper trading features are for educational simulation only
- Live trading requires your own broker account integration
- We do not handle actual funds or execute real trades
- Users are responsible for all trading decisions and outcomes

**Data Accuracy**
- Market data may be delayed or contain errors
- News and sentiment analysis are automated and may be inaccurate
- Always verify information from multiple sources before investing

By continuing, you acknowledge that you understand these risks and agree to use AiiA for educational purposes only.
    `
  },
  trading: {
    title: 'Trading Risk Warning',
    icon: TrendingDown,
    content: `
## High-Risk Trading Warning

**Immediate Risk Factors**
- You can lose money rapidly due to leverage and market volatility
- 70-90% of retail traders lose money when trading
- Never trade with money you cannot afford to lose
- Market conditions can change rapidly without warning

**AI Trading Automation Risks**
- Automated trading can execute trades without your direct control
- Technical failures may result in unintended trades
- Market gaps and slippage can cause significant losses
- Stop losses may not execute at intended prices during volatile periods

**Your Responsibilities**
- Monitor all automated trading activity regularly
- Set appropriate position sizes and risk limits
- Understand all order types before use
- Have adequate capital reserves for margin calls

**Regulatory Notice**
This platform is for educational purposes. Actual trading should only be done through regulated brokers.
    `
  },
  investment: {
    title: 'Investment Advisory Disclaimer',
    icon: DollarSign,
    content: `
## Investment Advisory Disclaimer

**Not Professional Investment Advice**
- AiiA is not a registered investment advisor
- Our AI analysis is for educational purposes only
- Consult with qualified financial professionals for investment advice
- We do not provide personalized investment recommendations

**Analysis Limitations**
- AI models may have biases or limitations
- Historical data may not predict future performance
- Market conditions change and models may become outdated
- External factors may not be captured in our analysis

**Portfolio Management**
- Diversification does not guarantee against loss
- Asset allocation should match your risk tolerance
- Regular portfolio review is essential
- Rebalancing may have tax implications

**Legal Disclaimer**
By using AiiA's investment analysis features, you acknowledge that all investment decisions are made independently and at your own risk.
    `
  }
}

export function FinancialDisclaimerModal({ 
  isOpen, 
  onClose, 
  type, 
  onAccept 
}: FinancialDisclaimerModalProps) {
  const { data: session } = useSession()
  const [hasReadFully, setHasReadFully] = useState(false)
  const [acknowledgeRisk, setAcknowledgeRisk] = useState(false)
  const [acknowledgeEducational, setAcknowledgeEducational] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const disclaimer = disclaimerContent[type]
  const Icon = disclaimer.icon

  const canAccept = hasReadFully && acknowledgeRisk && acknowledgeEducational

  useEffect(() => {
    if (!isOpen) {
      setHasReadFully(false)
      setAcknowledgeRisk(false)
      setAcknowledgeEducational(false)
    }
  }, [isOpen])

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget
    const scrolledToBottom = scrollTop + clientHeight >= scrollHeight - 10
    if (scrolledToBottom && !hasReadFully) {
      setHasReadFully(true)
    }
  }

  const handleAccept = async () => {
    if (!canAccept || !session?.user?.email) return

    setIsSubmitting(true)
    try {
      // Save disclaimer acceptance
      await fetch('/api/disclaimers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          disclaimerType: type,
          version: '1.0',
          content: disclaimer.content
        })
      })

      onAccept?.()
      onClose()
    } catch (error) {
      console.error('Failed to save disclaimer acceptance:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-amber-500" />
            {disclaimer.title}
          </DialogTitle>
          <DialogDescription>
            Please read and acknowledge the following important information before proceeding.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea 
          className="h-96 w-full rounded-md border p-4"
          onScrollCapture={handleScroll}
        >
          <div className="prose prose-sm dark:prose-invert max-w-none">
            {disclaimer.content.split('\n').map((line, index) => {
              if (line.startsWith('##')) {
                return <h3 key={index} className="text-lg font-semibold mt-4 mb-2">{line.slice(2)}</h3>
              }
              if (line.startsWith('**') && line.endsWith('**')) {
                return <h4 key={index} className="font-semibold mt-3 mb-1">{line.slice(2, -2)}</h4>
              }
              if (line.startsWith('-')) {
                return <li key={index} className="ml-4">{line.slice(1)}</li>
              }
              return line ? <p key={index} className="mb-2">{line}</p> : <br key={index} />
            })}
          </div>
        </ScrollArea>

        {!hasReadFully && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <AlertTriangle className="h-4 w-4" />
            Please scroll to the bottom to continue
          </div>
        )}

        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="acknowledge-risk" 
              checked={acknowledgeRisk}
              onCheckedChange={(checked) => setAcknowledgeRisk(checked === true)}
              disabled={!hasReadFully}
            />
            <label htmlFor="acknowledge-risk" className="text-sm">
              I acknowledge the financial risks and understand I may lose money
            </label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="acknowledge-educational" 
              checked={acknowledgeEducational}
              onCheckedChange={(checked) => setAcknowledgeEducational(checked === true)}
              disabled={!hasReadFully}
            />
            <label htmlFor="acknowledge-educational" className="text-sm">
              I understand this is for educational purposes and not professional advice
            </label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleAccept}
            disabled={!canAccept || isSubmitting}
          >
            {isSubmitting ? 'Accepting...' : 'Accept & Continue'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
