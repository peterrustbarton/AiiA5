
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from '@/components/providers'
import { Toaster } from '@/components/ui/toaster'
import { BottomNavigation, SideNavigation } from '@/components/enhanced-navigation'
import { AIAssistantTrigger } from '@/components/ai-assistant-modal'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AiiA - AI Investment Assistant',
  description: 'Your intelligent investment companion powered by AI',
  keywords: ['investment', 'AI', 'stocks', 'crypto', 'portfolio', 'trading'],
  authors: [{ name: 'AiiA Team' }],
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <Providers>
          <div className="min-h-screen bg-background">
            <SideNavigation />
            <main className="lg:ml-64 pb-20 lg:pb-0">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
                {children}
              </div>
            </main>
            <BottomNavigation />
            <AIAssistantTrigger />
          </div>
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
