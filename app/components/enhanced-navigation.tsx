
'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import Image from 'next/image'
import { 
  Home, 
  Search, 
  TrendingUp, 
  Briefcase, 
  Bell, 
  Settings,
  User,
  LogOut,
  Info,
  MessageCircle,
  CreditCard,
  Bot,
  Menu,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { AccountTierBadge } from '@/components/account-tier-badge'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'

const navItems = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/analyze', label: 'Analyze', icon: Search },
  { href: '/market-movers', label: 'Market', icon: TrendingUp },
  { href: '/portfolio', label: 'Portfolio', icon: Briefcase },
  { href: '/notifications', label: 'Alerts', icon: Bell },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function BottomNavigation() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 lg:hidden">
      <div className="mx-auto max-w-sm">
        <div className="flex items-center justify-around py-2">
          {navItems.slice(0, 5).map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition-colors',
                  isActive
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                <Icon className={cn('h-5 w-5', isActive && 'text-primary')} />
                <span className="text-xs font-medium">{label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}

export function SideNavigation() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [isOpen, setIsOpen] = useState(false)

  const handleSignOut = () => {
    signOut({ callbackUrl: '/login' })
  }

  const userTier = (session?.user as any)?.accountTier || 'Free'

  const NavigationContent = () => (
    <>
      <div className="flex items-center justify-center h-16 border-b border-border px-4">
        <div className="relative w-[324px] h-12">
          <Image
            src="/aiia-logo.png"
            alt="AiiA Logo"
            fill
            className="object-contain"
            priority
          />
        </div>
      </div>
      
      <div className="flex-1 flex flex-col space-y-2 p-4">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors',
                isActive
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
              onClick={() => setIsOpen(false)}
            >
              <Icon className={cn('h-5 w-5', isActive && 'text-primary')} />
              <span className="font-medium">{label}</span>
            </Link>
          )
        })}

        {/* AI Assistant */}
        <Link
          href="/chat"
          className={cn(
            'flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors',
            pathname === '/chat'
              ? 'text-primary bg-primary/10'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          )}
          onClick={() => setIsOpen(false)}
        >
          <MessageCircle className={cn('h-5 w-5', pathname === '/chat' && 'text-primary')} />
          <span className="font-medium">AI Assistant</span>
        </Link>

        {/* About AiiA */}
        <Link
          href="/about"
          className={cn(
            'flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors',
            pathname === '/about'
              ? 'text-primary bg-primary/10'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          )}
          onClick={() => setIsOpen(false)}
        >
          <Info className={cn('h-5 w-5', pathname === '/about' && 'text-primary')} />
          <span className="font-medium">About AiiA</span>
        </Link>
      </div>

      {/* User Section */}
      {session?.user && (
        <div className="border-t border-border p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {session.user.name || session.user.email}
                </p>
                <AccountTierBadge tier={userTier as any} />
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <User className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/settings" onClick={() => setIsOpen(false)}>
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                {userTier === 'Free' && (
                  <DropdownMenuItem asChild>
                    <Link href="/settings?tab=subscription" onClick={() => setIsOpen(false)}>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Upgrade to Pro
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild>
                  <Link href="/settings?tab=automation" onClick={() => setIsOpen(false)}>
                    <Bot className="h-4 w-4 mr-2" />
                    AI Trading
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )}
    </>
  )

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-card border-r border-border">
        <NavigationContent />
      </nav>

      {/* Mobile Navigation */}
      <div className="lg:hidden">
        <div className="flex items-center justify-between p-4 bg-card border-b border-border">
          <div className="relative w-32 h-8">
            <Image
              src="/aiia-logo.png"
              alt="AiiA Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <div className="flex flex-col h-full">
                <NavigationContent />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </>
  )
}
