
'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Crown, Star, Shield, Zap, Unlock } from 'lucide-react'
import Link from 'next/link'

interface AccountTierBadgeProps {
  tier: 'Free' | 'Pro' | 'Admin'
  className?: string
  showUpgrade?: boolean
}

export function AccountTierBadge({ tier, className, showUpgrade = false }: AccountTierBadgeProps) {
  const getTierConfig = (tier: string) => {
    switch (tier) {
      case 'Admin':
        return {
          icon: Crown,
          color: 'bg-gradient-to-r from-purple-500 to-pink-500',
          textColor: 'text-white',
          label: 'Admin'
        }
      case 'Pro':
        return {
          icon: Star,
          color: 'bg-gradient-to-r from-blue-500 to-cyan-500',
          textColor: 'text-white',
          label: 'Pro'
        }
      default:
        return {
          icon: Shield,
          color: 'bg-muted',
          textColor: 'text-muted-foreground',
          label: 'Free'
        }
    }
  }

  const config = getTierConfig(tier)
  const Icon = config.icon

  return (
    <div className={className}>
      <Badge className={`${config.color} ${config.textColor} border-0`}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
      {showUpgrade && tier === 'Free' && (
        <Button variant="outline" size="sm" className="ml-2" asChild>
          <Link href="/settings?tab=subscription">
            <Zap className="h-3 w-3 mr-1" />
            Upgrade
          </Link>
        </Button>
      )}
    </div>
  )
}

export function TierRestrictedContent({ 
  requiredTier, 
  userTier, 
  children,
  fallback 
}: {
  requiredTier: 'Pro' | 'Admin'
  userTier: 'Free' | 'Pro' | 'Admin'
  children: React.ReactNode
  fallback?: React.ReactNode
}) {
  const tierOrder = { 'Free': 0, 'Pro': 1, 'Admin': 2 }
  const hasAccess = tierOrder[userTier] >= tierOrder[requiredTier]

  if (hasAccess) {
    return <>{children}</>
  }

  if (fallback) {
    return <>{fallback}</>
  }

  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-8">
        <Unlock className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">
          {requiredTier} Feature
        </h3>
        <p className="text-muted-foreground text-center mb-4">
          This feature requires a {requiredTier} account. Upgrade to unlock advanced capabilities.
        </p>
        <Button asChild>
          <Link href="/settings?tab=subscription">
            <Zap className="h-4 w-4 mr-2" />
            Upgrade to {requiredTier}
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}

export const TIER_FEATURES = {
  Free: [
    'Basic AI analysis',
    'Paper trading',
    'Market data access',
    'Basic portfolio tracking',
    '5 watchlist items'
  ],
  Pro: [
    'Advanced AI analysis with confidence breakdown',
    'Automated trading (paper & live)',
    'Real-time alerts & notifications',
    'Advanced portfolio analytics',
    'Unlimited watchlist',
    'Priority customer support',
    'Advanced charting tools'
  ],
  Admin: [
    'All Pro features',
    'System administration access',
    'User management',
    'Advanced analytics dashboard',
    'API access',
    'Custom integrations'
  ]
}
