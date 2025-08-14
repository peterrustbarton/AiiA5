
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from '@/hooks/use-toast'
import {
  Crown,
  Star,
  Shield,
  Check,
  X,
  CreditCard,
  Calendar,
  AlertTriangle,
  Zap,
  RefreshCw
} from 'lucide-react'
import { AccountTierBadge, TIER_FEATURES } from '@/components/account-tier-badge'

interface Subscription {
  id: string
  plan: string
  status: string
  amount: number
  currency: string
  interval: string
  startedAt: string
  endsAt?: string
  cancelledAt?: string
}

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    interval: 'forever',
    icon: Shield,
    description: 'Perfect for getting started with AI-powered investment analysis',
    features: TIER_FEATURES.Free,
    limitations: [
      'Basic AI analysis only',
      'Paper trading only',
      'Limited to 5 watchlist items',
      'Standard support'
    ]
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 29,
    interval: 'month',
    icon: Star,
    description: 'Advanced features for serious investors and active traders',
    features: TIER_FEATURES.Pro,
    popular: true
  },
  {
    id: 'pro-yearly',
    name: 'Pro (Annual)',
    price: 290,
    interval: 'year',
    icon: Star,
    description: 'Get 2 months free with annual billing',
    features: TIER_FEATURES.Pro,
    savings: 'Save $58/year'
  }
]

export function SubscriptionManagement() {
  const { data: session } = useSession()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    loadSubscription()
  }, [])

  const loadSubscription = async () => {
    try {
      const response = await fetch('/api/subscription')
      if (response.ok) {
        const data = await response.json()
        setSubscription(data.subscription)
      }
    } catch (error) {
      console.error('Failed to load subscription:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubscribe = async (planId: string) => {
    setIsProcessing(true)
    try {
      const response = await fetch('/api/subscription/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId })
      })

      if (response.ok) {
        const data = await response.json()
        
        // In a real implementation, this would redirect to a payment processor
        toast({
          title: 'Subscription Created',
          description: 'Your subscription has been activated successfully!',
        })
        
        await loadSubscription()
      } else {
        throw new Error('Failed to create subscription')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create subscription. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCancelSubscription = async () => {
    if (!subscription) return

    setIsProcessing(true)
    try {
      const response = await fetch(`/api/subscription/${subscription.id}/cancel`, {
        method: 'POST'
      })

      if (response.ok) {
        toast({
          title: 'Subscription Cancelled',
          description: 'Your subscription will remain active until the end of the billing period.',
        })
        
        await loadSubscription()
      } else {
        throw new Error('Failed to cancel subscription')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to cancel subscription. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const userTier = (session?.user as any)?.accountTier || 'Free'
  const isPro = userTier === 'Pro'

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-muted rounded-lg"></div>
          <div className="h-64 bg-muted rounded-lg"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Current Plan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <AccountTierBadge tier={userTier as any} />
              <div>
                <h3 className="font-semibold">{userTier} Plan</h3>
                {subscription && (
                  <p className="text-sm text-muted-foreground">
                    {subscription.status === 'active' ? 'Active' : 'Inactive'} • 
                    {subscription.interval === 'monthly' ? ' Monthly' : ' Annual'} • 
                    ${subscription.amount}/{subscription.interval === 'monthly' ? 'month' : 'year'}
                  </p>
                )}
              </div>
            </div>
            
            {subscription && subscription.status === 'active' && (
              <div className="text-right">
                <p className="text-sm text-muted-foreground">
                  {subscription.cancelledAt ? 'Expires' : 'Renews'} on
                </p>
                <p className="font-mono">
                  {new Date(subscription.endsAt || subscription.startedAt).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>

          {subscription?.cancelledAt && (
            <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                <div className="text-sm text-amber-800 dark:text-amber-200">
                  <p className="font-medium">Subscription Cancelled</p>
                  <p>Your subscription will remain active until {new Date(subscription.endsAt!).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Plan Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const Icon = plan.icon
          const isCurrentPlan = 
            (plan.id === 'free' && userTier === 'Free') ||
            (plan.id.startsWith('pro') && userTier === 'Pro')
          
          return (
            <Card key={plan.id} className={`relative ${plan.popular ? 'border-primary shadow-lg' : ''}`}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">
                    Most Popular
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center">
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="flex items-center justify-center gap-2">
                  {plan.name}
                  {plan.savings && (
                    <Badge variant="secondary" className="text-xs">
                      {plan.savings}
                    </Badge>
                  )}
                </CardTitle>
                <div className="text-3xl font-bold">
                  ${plan.price}
                  <span className="text-base font-normal text-muted-foreground">
                    /{plan.interval}
                  </span>
                </div>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                  
                  {plan.limitations?.map((limitation, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <X className="h-4 w-4 text-red-500 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">{limitation}</span>
                    </div>
                  ))}
                </div>
                
                <Separator />
                
                {isCurrentPlan ? (
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full" disabled>
                      <Check className="h-4 w-4 mr-2" />
                      Current Plan
                    </Button>
                    {subscription && subscription.status === 'active' && !subscription.cancelledAt && plan.id !== 'free' && (
                      <Button 
                        variant="destructive" 
                        className="w-full" 
                        onClick={handleCancelSubscription}
                        disabled={isProcessing}
                      >
                        {isProcessing ? (
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <X className="h-4 w-4 mr-2" />
                        )}
                        Cancel Subscription
                      </Button>
                    )}
                  </div>
                ) : (
                  <Button
                    className="w-full"
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={isProcessing}
                    variant={plan.popular ? 'default' : 'outline'}
                  >
                    {isProcessing ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Zap className="h-4 w-4 mr-2" />
                    )}
                    {plan.id === 'free' ? 'Downgrade' : 'Upgrade'} to {plan.name}
                  </Button>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Billing Information */}
      {subscription && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Billing Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-2">Subscription Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Plan:</span>
                    <span>{subscription.plan}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount:</span>
                    <span>${subscription.amount} {subscription.currency.toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Billing:</span>
                    <span className="capitalize">{subscription.interval}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant={subscription.status === 'active' ? 'default' : 'secondary'}>
                      {subscription.status}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Important Dates</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Started:</span>
                    <span>{new Date(subscription.startedAt).toLocaleDateString()}</span>
                  </div>
                  {subscription.endsAt && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {subscription.cancelledAt ? 'Expires:' : 'Next billing:'}
                      </span>
                      <span>{new Date(subscription.endsAt).toLocaleDateString()}</span>
                    </div>
                  )}
                  {subscription.cancelledAt && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cancelled:</span>
                      <span>{new Date(subscription.cancelledAt).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
