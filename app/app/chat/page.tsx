
'use client'

import { AIAssistant } from '@/components/ai-assistant'

export default function ChatPage() {
  return (
    <div className="container mx-auto max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">AI Assistant</h1>
        <p className="text-muted-foreground">
          Get personalized investment insights and analysis from our AI assistant
        </p>
      </div>
      
      <AIAssistant />
    </div>
  )
}
