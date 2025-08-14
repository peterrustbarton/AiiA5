
'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Bell, BellOff, Plus, Trash2, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react'
import { Alert, Notification } from '@/lib/types'
import { formatPrice, formatRelativeTime, formatDate } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

export default function NotificationsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [alertDialogOpen, setAlertDialogOpen] = useState(false)
  const [alertForm, setAlertForm] = useState({
    symbol: '',
    type: 'stock' as 'stock' | 'crypto',
    condition: 'above' as 'above' | 'below',
    targetPrice: ''
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user) {
      loadNotificationData()
    }
  }, [session])

  const loadNotificationData = async () => {
    try {
      setLoading(true)

      // Load alerts
      const alertsRes = await fetch('/api/alerts')
      if (alertsRes.ok) {
        const alertsData = await alertsRes.json()
        setAlerts(alertsData.alerts || [])
      }

      // Load notifications
      const notificationsRes = await fetch('/api/notifications')
      if (notificationsRes.ok) {
        const notificationsData = await notificationsRes.json()
        setNotifications(notificationsData.notifications || [])
      }
    } catch (error) {
      console.error('Error loading notification data:', error)
      toast({
        title: 'Error',
        description: 'Failed to load notifications',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAlert = async () => {
    if (!alertForm.symbol || !alertForm.targetPrice) {
      toast({
        title: 'Invalid Input',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      })
      return
    }

    try {
      const response = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: alertForm.symbol.toUpperCase(),
          type: alertForm.type,
          condition: alertForm.condition,
          targetPrice: parseFloat(alertForm.targetPrice)
        })
      })

      if (response.ok) {
        toast({
          title: 'Alert Created',
          description: `Price alert set for ${alertForm.symbol}`,
        })
        setAlertDialogOpen(false)
        setAlertForm({
          symbol: '',
          type: 'stock',
          condition: 'above',
          targetPrice: ''
        })
        loadNotificationData()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create alert')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create alert',
        variant: 'destructive',
      })
    }
  }

  const handleDeleteAlert = async (alertId: string) => {
    try {
      const response = await fetch(`/api/alerts/${alertId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast({
          title: 'Alert Deleted',
          description: 'Price alert has been removed',
        })
        loadNotificationData()
      } else {
        throw new Error('Failed to delete alert')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete alert',
        variant: 'destructive',
      })
    }
  }

  const handleToggleAlert = async (alertId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/alerts/${alertId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive })
      })

      if (response.ok) {
        toast({
          title: isActive ? 'Alert Disabled' : 'Alert Enabled',
          description: `Price alert has been ${isActive ? 'disabled' : 'enabled'}`,
        })
        loadNotificationData()
      } else {
        throw new Error('Failed to toggle alert')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update alert',
        variant: 'destructive',
      })
    }
  }

  const handleMarkNotificationRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ read: true })
      })

      if (response.ok) {
        loadNotificationData()
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const handleClearAllNotifications = async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'DELETE'
      })

      if (response.ok) {
        toast({
          title: 'Notifications Cleared',
          description: 'All notifications have been cleared',
        })
        loadNotificationData()
      } else {
        throw new Error('Failed to clear notifications')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to clear notifications',
        variant: 'destructive',
      })
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'alert':
        return <Bell className="h-5 w-5" />
      case 'trade':
        return <TrendingUp className="h-5 w-5" />
      case 'news':
        return <AlertTriangle className="h-5 w-5" />
      default:
        return <Bell className="h-5 w-5" />
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading notifications...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Notifications & Alerts</h1>
          <p className="text-muted-foreground">
            Manage your price alerts and view notifications
          </p>
        </div>
        <Dialog open={alertDialogOpen} onOpenChange={setAlertDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Alert
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Price Alert</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="symbol">Symbol</Label>
                  <Input
                    id="symbol"
                    placeholder="e.g., AAPL, BTC"
                    value={alertForm.symbol}
                    onChange={(e) => setAlertForm({...alertForm, symbol: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select value={alertForm.type} onValueChange={(value: 'stock' | 'crypto') => setAlertForm({...alertForm, type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="stock">Stock</SelectItem>
                      <SelectItem value="crypto">Crypto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="condition">Condition</Label>
                  <Select value={alertForm.condition} onValueChange={(value: 'above' | 'below') => setAlertForm({...alertForm, condition: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="above">Price Above</SelectItem>
                      <SelectItem value="below">Price Below</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="targetPrice">Target Price</Label>
                  <Input
                    id="targetPrice"
                    type="number"
                    step="any"
                    placeholder="0.00"
                    value={alertForm.targetPrice}
                    onChange={(e) => setAlertForm({...alertForm, targetPrice: e.target.value})}
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setAlertDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateAlert}>
                  Create Alert
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Notification Tabs */}
      <Tabs defaultValue="notifications" className="space-y-4">
        <TabsList>
          <TabsTrigger value="notifications">
            Notifications
            {notifications.filter(n => !n.read).length > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 text-xs">
                {notifications.filter(n => !n.read).length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="alerts">Price Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="notifications">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Notifications</CardTitle>
                <CardDescription>Your latest activity and alerts</CardDescription>
              </div>
              {notifications.length > 0 && (
                <Button variant="outline" size="sm" onClick={handleClearAllNotifications}>
                  Clear All
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {notifications.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No notifications yet</p>
                  <p className="text-sm">Your notifications will appear here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`flex items-start space-x-4 p-4 border rounded-lg cursor-pointer transition-colors ${
                        notification.read ? 'opacity-60' : 'bg-muted/20'
                      }`}
                      onClick={() => !notification.read && handleMarkNotificationRead(notification.id)}
                    >
                      <div className={`p-2 rounded-full ${
                        notification.type === 'alert' ? 'bg-yellow-500/10 text-yellow-500' :
                        notification.type === 'trade' ? 'bg-blue-500/10 text-blue-500' :
                        notification.type === 'news' ? 'bg-green-500/10 text-green-500' :
                        'bg-gray-500/10 text-gray-500'
                      }`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold">{notification.title}</h4>
                          <span className="text-xs text-muted-foreground">
                            {formatRelativeTime(notification.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{notification.message}</p>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-xs">
                            {notification.type}
                          </Badge>
                          {!notification.read && (
                            <Badge variant="destructive" className="text-xs">
                              New
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle>Price Alerts</CardTitle>
              <CardDescription>Manage your automated price notifications</CardDescription>
            </CardHeader>
            <CardContent>
              {alerts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No price alerts set</p>
                  <p className="text-sm">Create alerts to get notified when prices hit your targets</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {alerts.map((alert) => (
                    <div key={alert.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className={`p-2 rounded-full ${
                          alert.triggered ? 'bg-green-500/10 text-green-500' :
                          alert.isActive ? 'bg-blue-500/10 text-blue-500' :
                          'bg-gray-500/10 text-gray-500'
                        }`}>
                          {alert.condition === 'above' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold">{alert.symbol}</span>
                            <Badge variant={alert.type === 'stock' ? 'default' : 'secondary'}>
                              {alert.type}
                            </Badge>
                            <Badge variant={
                              alert.triggered ? 'success' :
                              alert.isActive ? 'default' :
                              'secondary'
                            }>
                              {alert.triggered ? 'Triggered' : alert.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Alert when price goes {alert.condition} {formatPrice(alert.targetPrice)}
                          </p>
                          {alert.currentPrice && (
                            <p className="text-xs text-muted-foreground">
                              Current: {formatPrice(alert.currentPrice)}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Created: {formatDate(alert.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleAlert(alert.id, alert.isActive)}
                        >
                          {alert.isActive ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteAlert(alert.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
