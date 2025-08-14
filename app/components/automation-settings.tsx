
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from '@/hooks/use-toast'
import { 
  Bot, 
  Shield, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  AlertTriangle,
  Settings,
  CheckCircle,
  XCircle
} from 'lucide-react'

interface AutomationSettings {
  aiTradingEnabled: boolean
  buyThreshold: number
  sellThreshold: number
  maxDailyTrades: number
  maxPositionSize: number
  riskTolerance: 'low' | 'medium' | 'high'
  requireManualConfirmation: boolean
  stopLossEnabled: boolean
  stopLossPercentage: number
  takeProfitEnabled: boolean
  takeProfitPercentage: number
  allowedSymbols: string[]
  blockedSymbols: string[]
  tradingHours: {
    enabled: boolean
    start: string
    end: string
  }
}

const defaultSettings: AutomationSettings = {
  aiTradingEnabled: false,
  buyThreshold: 75,
  sellThreshold: 25,
  maxDailyTrades: 5,
  maxPositionSize: 1000,
  riskTolerance: 'medium',
  requireManualConfirmation: true,
  stopLossEnabled: true,
  stopLossPercentage: 10,
  takeProfitEnabled: false,
  takeProfitPercentage: 20,
  allowedSymbols: [],
  blockedSymbols: [],
  tradingHours: {
    enabled: true,
    start: '09:30',
    end: '16:00'
  }
}

export function AutomationSettings() {
  const { data: session } = useSession()
  const [settings, setSettings] = useState<AutomationSettings>(defaultSettings)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [newSymbol, setNewSymbol] = useState('')

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/user/automation-settings')
      if (response.ok) {
        const data = await response.json()
        setSettings({ ...defaultSettings, ...data.settings })
      }
    } catch (error) {
      console.error('Failed to load automation settings:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const saveSettings = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/user/automation-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings })
      })

      if (response.ok) {
        toast({
          title: 'Settings Saved',
          description: 'Your automation settings have been updated successfully.',
        })
      } else {
        throw new Error('Failed to save settings')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save automation settings. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const updateNestedSetting = (parent: string, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [parent]: { ...(prev[parent as keyof typeof prev] as any), [key]: value }
    }))
  }

  const addSymbol = (listType: 'allowedSymbols' | 'blockedSymbols') => {
    if (!newSymbol.trim()) return
    
    const symbol = newSymbol.toUpperCase().trim()
    const currentList = settings[listType]
    
    if (!currentList.includes(symbol)) {
      updateSetting(listType, [...currentList, symbol])
      setNewSymbol('')
    }
  }

  const removeSymbol = (listType: 'allowedSymbols' | 'blockedSymbols', symbol: string) => {
    const currentList = settings[listType]
    updateSetting(listType, currentList.filter(s => s !== symbol))
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-muted rounded-lg"></div>
          <div className="h-48 bg-muted rounded-lg"></div>
          <div className="h-32 bg-muted rounded-lg"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* AI Trading Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            AI Trading Automation
          </CardTitle>
          <CardDescription>
            Enable AI-powered automated trading based on our analysis recommendations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Enable AI Trading</Label>
              <p className="text-sm text-muted-foreground">
                Allow AI to execute trades automatically based on confidence thresholds
              </p>
            </div>
            <Switch
              checked={settings.aiTradingEnabled}
              onCheckedChange={(checked) => updateSetting('aiTradingEnabled', checked)}
            />
          </div>

          {settings.aiTradingEnabled && (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                <div className="text-sm text-amber-800 dark:text-amber-200">
                  <p className="font-medium">High Risk Warning</p>
                  <p>Automated trading can result in significant losses. Monitor your account regularly.</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trading Thresholds */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Trading Thresholds
          </CardTitle>
          <CardDescription>
            Set confidence score thresholds for automatic buy and sell decisions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Buy Threshold (%)</Label>
              <Input
                type="number"
                min="50"
                max="100"
                value={settings.buyThreshold}
                onChange={(e) => updateSetting('buyThreshold', parseInt(e.target.value))}
                placeholder="75"
              />
              <p className="text-xs text-muted-foreground">
                Execute buy orders when AI confidence is above this threshold
              </p>
            </div>

            <div className="space-y-2">
              <Label>Sell Threshold (%)</Label>
              <Input
                type="number"
                min="0"
                max="50"
                value={settings.sellThreshold}
                onChange={(e) => updateSetting('sellThreshold', parseInt(e.target.value))}
                placeholder="25"
              />
              <p className="text-xs text-muted-foreground">
                Execute sell orders when AI confidence is below this threshold
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Risk Tolerance</Label>
            <Select value={settings.riskTolerance} onValueChange={(value) => updateSetting('riskTolerance', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low - Conservative trading</SelectItem>
                <SelectItem value="medium">Medium - Balanced approach</SelectItem>
                <SelectItem value="high">High - Aggressive trading</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Trade Limits & Risk Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Risk Management
          </CardTitle>
          <CardDescription>
            Configure trade limits and risk management rules
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Max Daily Trades</Label>
              <Input
                type="number"
                min="1"
                max="50"
                value={settings.maxDailyTrades}
                onChange={(e) => updateSetting('maxDailyTrades', parseInt(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label>Max Position Size ($)</Label>
              <Input
                type="number"
                min="100"
                step="100"
                value={settings.maxPositionSize}
                onChange={(e) => updateSetting('maxPositionSize', parseFloat(e.target.value))}
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Require Manual Confirmation</Label>
              <Switch
                checked={settings.requireManualConfirmation}
                onCheckedChange={(checked) => updateSetting('requireManualConfirmation', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Stop Loss Protection</Label>
                <p className="text-sm text-muted-foreground">Automatically sell if losses exceed threshold</p>
              </div>
              <Switch
                checked={settings.stopLossEnabled}
                onCheckedChange={(checked) => updateSetting('stopLossEnabled', checked)}
              />
            </div>

            {settings.stopLossEnabled && (
              <div className="ml-6 space-y-2">
                <Label>Stop Loss Percentage (%)</Label>
                <Input
                  type="number"
                  min="5"
                  max="50"
                  value={settings.stopLossPercentage}
                  onChange={(e) => updateSetting('stopLossPercentage', parseFloat(e.target.value))}
                />
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Take Profit</Label>
                <p className="text-sm text-muted-foreground">Automatically sell when profit target is reached</p>
              </div>
              <Switch
                checked={settings.takeProfitEnabled}
                onCheckedChange={(checked) => updateSetting('takeProfitEnabled', checked)}
              />
            </div>

            {settings.takeProfitEnabled && (
              <div className="ml-6 space-y-2">
                <Label>Take Profit Percentage (%)</Label>
                <Input
                  type="number"
                  min="5"
                  max="100"
                  value={settings.takeProfitPercentage}
                  onChange={(e) => updateSetting('takeProfitPercentage', parseFloat(e.target.value))}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Trading Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Trading Schedule
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Restrict Trading Hours</Label>
            <Switch
              checked={settings.tradingHours.enabled}
              onCheckedChange={(checked) => updateNestedSetting('tradingHours', 'enabled', checked)}
            />
          </div>

          {settings.tradingHours.enabled && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input
                  type="time"
                  value={settings.tradingHours.start}
                  onChange={(e) => updateNestedSetting('tradingHours', 'start', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>End Time</Label>
                <Input
                  type="time"
                  value={settings.tradingHours.end}
                  onChange={(e) => updateNestedSetting('tradingHours', 'end', e.target.value)}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Symbol Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Symbol Restrictions
          </CardTitle>
          <CardDescription>
            Manage which symbols can be traded automatically
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label className="text-base">Allowed Symbols</Label>
              <p className="text-sm text-muted-foreground mb-2">
                If specified, only these symbols will be traded. Leave empty to allow all.
              </p>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g. AAPL"
                  value={newSymbol}
                  onChange={(e) => setNewSymbol(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addSymbol('allowedSymbols')}
                />
                <Button onClick={() => addSymbol('allowedSymbols')} variant="outline">
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {settings.allowedSymbols.map(symbol => (
                  <Badge key={symbol} variant="secondary" className="flex items-center gap-1">
                    {symbol}
                    <XCircle 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => removeSymbol('allowedSymbols', symbol)}
                    />
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-base">Blocked Symbols</Label>
              <p className="text-sm text-muted-foreground mb-2">
                These symbols will never be traded automatically
              </p>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g. TSLA"
                  value={newSymbol}
                  onChange={(e) => setNewSymbol(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addSymbol('blockedSymbols')}
                />
                <Button onClick={() => addSymbol('blockedSymbols')} variant="outline">
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {settings.blockedSymbols.map(symbol => (
                  <Badge key={symbol} variant="destructive" className="flex items-center gap-1">
                    {symbol}
                    <XCircle 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => removeSymbol('blockedSymbols', symbol)}
                    />
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={saveSettings} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  )
}
