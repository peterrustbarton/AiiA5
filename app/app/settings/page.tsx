'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/hooks/use-toast'
import { Settings, User, DollarSign, Shield, Bell, Bot, CreditCard } from 'lucide-react'
import { AutomationSettings } from '@/components/automation-settings'
import { SubscriptionManagement } from '@/components/subscription-management'
import { AccountTierBadge } from '@/components/account-tier-badge'

export default function SettingsPage() {
  const { data: session, update } = useSession()
  const searchParams = useSearchParams()
  const defaultTab = searchParams.get('tab') || 'general'
  
  const [activeTab, setActiveTab] = useState(defaultTab)
  const [settings, setSettings] = useState({
    name: '',
    email: '',
    theme: 'dark',
    alpacaApiKey: '',
    alpacaSecret: '',
    isLiveTrading: false,
    notifications: {
      email: true,
      push: true,
      priceAlerts: true,
      newsAlerts: false,
    }
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (session?.user) {
      setSettings({
        name: session.user.name || '',
        email: session.user.email || '',
        theme: (session.user as any)?.theme || 'dark',
        alpacaApiKey: (session.user as any)?.alpacaApiKey || '',
        alpacaSecret: (session.user as any)?.alpacaSecret || '',
        isLiveTrading: (session.user as any)?.isLiveTrading || false,
        notifications: {
          email: true,
          push: true,
          priceAlerts: true,
          newsAlerts: false,
        }
      })
    }
  }, [session])

  useEffect(() => {
    if (defaultTab !== activeTab) {
      setActiveTab(defaultTab)
    }
  }, [defaultTab])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      })

      if (response.ok) {
        // Update the session
        await update()
        toast({
          title: 'Settings saved',
          description: 'Your settings have been updated successfully.',
        })
      } else {
        throw new Error('Failed to save settings')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save settings. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }))
  }

  const handleNotificationChange = (field: string, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      notifications: { ...prev.notifications, [field]: value }
    }))
  }

  const userTier = (session?.user as any)?.accountTier || 'Free'

  return (
    <div className="container mx-auto max-w-4xl">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground">
              Manage your account settings and preferences
            </p>
          </div>
          <AccountTierBadge tier={userTier as any} showUpgrade={true} />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="trading">Trading</TabsTrigger>
          <TabsTrigger value="automation">AI Trading</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="subscription">Subscription</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
              <CardDescription>
                Update your personal information and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={settings.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Your full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={settings.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="your@email.com"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="theme">Theme</Label>
                <Select value={settings.theme} onValueChange={(value) => handleInputChange('theme', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Onboarding Help */}
          <Card>
            <CardHeader>
              <CardTitle>Getting Started</CardTitle>
              <CardDescription>
                Complete these steps to get the most out of AiiA
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Connect Alpaca Account</h4>
                    <p className="text-sm text-muted-foreground">Enable live trading capabilities</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setActiveTab('trading')}
                  >
                    Setup
                  </Button>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Configure AI Trading</h4>
                    <p className="text-sm text-muted-foreground">Set up automated trading preferences</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setActiveTab('automation')}
                  >
                    Configure
                  </Button>
                </div>
                
                {userTier === 'Free' && (
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Upgrade to Pro</h4>
                      <p className="text-sm text-muted-foreground">Unlock advanced features and automation</p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setActiveTab('subscription')}
                    >
                      Upgrade
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trading" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Alpaca Integration
              </CardTitle>
              <CardDescription>
                Connect your Alpaca account for live trading capabilities
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <h4 className="font-medium mb-2">How to get Alpaca API keys:</h4>
                  <ol className="text-sm space-y-1 list-decimal list-inside text-blue-800 dark:text-blue-200">
                    <li>Sign up for a free account at <a href="https://alpaca.markets" target="_blank" rel="noopener noreferrer" className="underline">alpaca.markets</a></li>
                    <li>Complete account verification</li>
                    <li>Navigate to the API section in your dashboard</li>
                    <li>Generate new API keys (Paper Trading recommended for beginners)</li>
                    <li>Copy and paste your keys below</li>
                  </ol>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="alpacaApiKey">Alpaca API Key</Label>
                  <Input
                    id="alpacaApiKey"
                    type="password"
                    value={settings.alpacaApiKey}
                    onChange={(e) => handleInputChange('alpacaApiKey', e.target.value)}
                    placeholder="Your Alpaca API key (Paper Trading)"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="alpacaSecret">Alpaca Secret Key</Label>
                  <Input
                    id="alpacaSecret"
                    type="password"
                    value={settings.alpacaSecret}
                    onChange={(e) => handleInputChange('alpacaSecret', e.target.value)}
                    placeholder="Your Alpaca secret key"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Live Trading Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable live trading with real money (requires valid live trading Alpaca keys)
                    </p>
                  </div>
                  <Switch
                    checked={settings.isLiveTrading}
                    onCheckedChange={(checked) => handleInputChange('isLiveTrading', checked)}
                  />
                </div>

                {settings.isLiveTrading && (
                  <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-800 dark:text-red-200">
                      <strong>Warning:</strong> Live trading mode uses real money. Ensure you understand the risks involved.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="automation" className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <Bot className="h-5 w-5" />
            <h2 className="text-xl font-semibold">AI Trading Automation</h2>
          </div>
          
          {userTier === 'Free' ? (
            <Card>
              <CardContent className="text-center py-8">
                <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  AI Trading Automation - Pro Feature
                </h3>
                <p className="text-muted-foreground mb-4">
                  Upgrade to Pro to unlock automated trading with AI-powered strategies
                </p>
                <Button onClick={() => setActiveTab('subscription')}>
                  Upgrade to Pro
                </Button>
              </CardContent>
            </Card>
          ) : (
            <AutomationSettings />
          )}
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Choose how you want to be notified about important updates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications via email
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.email}
                    onCheckedChange={(checked) => handleNotificationChange('email', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive push notifications in your browser
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.push}
                    onCheckedChange={(checked) => handleNotificationChange('push', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Price Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when your watchlist items hit target prices
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.priceAlerts}
                    onCheckedChange={(checked) => handleNotificationChange('priceAlerts', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">News Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications about relevant market news
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.newsAlerts}
                    onCheckedChange={(checked) => handleNotificationChange('newsAlerts', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Settings
              </CardTitle>
              <CardDescription>
                Manage your account security and authentication
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <Button variant="outline" className="w-full">
                  Change Password
                </Button>
                
                <Button variant="outline" className="w-full">
                  Enable Two-Factor Authentication
                </Button>
                
                <Button variant="outline" className="w-full">
                  Download Account Data
                </Button>
                
                <Button variant="destructive" className="w-full">
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscription" className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="h-5 w-5" />
            <h2 className="text-xl font-semibold">Subscription Management</h2>
          </div>
          
          <SubscriptionManagement />
        </TabsContent>
      </Tabs>

      {activeTab !== 'automation' && activeTab !== 'subscription' && (
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      )}
    </div>
  )
}