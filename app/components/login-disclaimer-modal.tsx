
'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Checkbox } from '@/components/ui/checkbox'
import { AlertTriangle, Shield, TrendingUp, DollarSign } from 'lucide-react'

interface LoginDisclaimerModalProps {
  isOpen: boolean
  onAccept: () => void
  onDecline: () => void
}

export function LoginDisclaimerModal({ isOpen, onAccept, onDecline }: LoginDisclaimerModalProps) {
  const [hasReadTerms, setHasReadTerms] = useState(false)
  const [hasReadRisks, setHasReadRisks] = useState(false)

  const canAccept = hasReadTerms && hasReadRisks

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-primary" />
            <span>Financial Disclaimer & Risk Warning</span>
          </DialogTitle>
          <DialogDescription>
            Please read and acknowledge the following important information before using AiiA
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="px-6 max-h-[60vh]">
          <div className="space-y-6 py-4">
            {/* Risk Warning */}
            <div className="border border-destructive/20 rounded-lg p-4 bg-destructive/5">
              <div className="flex items-center space-x-2 mb-3">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <h3 className="font-semibold text-destructive">Important Risk Warning</h3>
              </div>
              <div className="space-y-2 text-sm">
                <p>
                  <strong>Trading and investing in financial markets involves substantial risk of loss.</strong> 
                  You should carefully consider whether such trading is suitable for you in light of your 
                  financial condition and ability to bear financial risks.
                </p>
                <p>
                  Past performance is not indicative of future results. The value of investments can go 
                  down as well as up, and you may lose all or more than your initial investment.
                </p>
              </div>
            </div>

            {/* AI Analysis Disclaimer */}
            <div className="border border-primary/20 rounded-lg p-4 bg-primary/5">
              <div className="flex items-center space-x-2 mb-3">
                <TrendingUp className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-primary">AI Analysis Disclaimer</h3>
              </div>
              <div className="space-y-2 text-sm">
                <p>
                  AiiA's AI-powered analysis and recommendations are provided for informational purposes 
                  only and should not be considered as financial advice or investment recommendations.
                </p>
                <p>
                  Our AI algorithms analyze market data, news, and technical indicators, but cannot 
                  predict market movements with certainty. Always conduct your own research and consider 
                  consulting with a qualified financial advisor before making investment decisions.
                </p>
              </div>
            </div>

            {/* Terms of Service */}
            <div className="border border-muted rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <DollarSign className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-semibold">Terms of Service</h3>
              </div>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  By using AiiA, you acknowledge and agree to the following:
                </p>
                <ul className="space-y-1 ml-4">
                  <li>• You are solely responsible for your investment decisions</li>
                  <li>• AiiA is not a licensed investment advisor or broker-dealer</li>
                  <li>• All trading is conducted through integrated third-party platforms</li>
                  <li>• You must comply with all applicable laws and regulations</li>
                  <li>• AiiA reserves the right to modify or discontinue services</li>
                  <li>• You agree to use the platform in accordance with our terms</li>
                </ul>
              </div>
            </div>

            {/* Data and Privacy */}
            <div className="border border-muted rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <Shield className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-semibold">Data and Privacy</h3>
              </div>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  We collect and process your data to provide our services, including:
                </p>
                <ul className="space-y-1 ml-4">
                  <li>• Portfolio tracking and analysis</li>
                  <li>• Personalized AI recommendations</li>
                  <li>• Market data and news aggregation</li>
                  <li>• Account management and security</li>
                </ul>
                <p>
                  Your data is protected according to our Privacy Policy and applicable data protection laws.
                </p>
              </div>
            </div>

            {/* Demo Account Notice */}
            <div className="border border-blue-200 rounded-lg p-4 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-800">
              <h3 className="font-semibold mb-2 text-blue-900 dark:text-blue-100">Demo Account Information</h3>
              <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                <p>
                  This application includes demo accounts for testing purposes. Demo trading uses 
                  simulated money and real market data, but no actual financial transactions occur.
                </p>
                <p>
                  Demo performance may not reflect real trading results due to factors such as 
                  market liquidity, execution speed, and emotional factors in live trading.
                </p>
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="p-6 pt-4 border-t">
          <div className="space-y-4">
            {/* Checkboxes */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="terms"
                  checked={hasReadTerms}
                  onCheckedChange={(checked) => setHasReadTerms(checked === true)}
                />
                <label htmlFor="terms" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  I have read and understand the terms of service and privacy policy
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="risks"
                  checked={hasReadRisks}
                  onCheckedChange={(checked) => setHasReadRisks(checked === true)}
                />
                <label htmlFor="risks" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  I acknowledge the risks involved in trading and investing, and understand that AiiA provides educational content only
                </label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <Button
                onClick={onDecline}
                variant="outline"
                className="flex-1"
              >
                Decline
              </Button>
              <Button
                onClick={onAccept}
                disabled={!canAccept}
                className="flex-1"
              >
                Accept & Continue
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
