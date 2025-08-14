
'use client'

import { useState } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { validateEmail, validatePassword } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { LoginDisclaimerModal } from '@/components/login-disclaimer-modal'
import Image from 'next/image'

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showDisclaimer, setShowDisclaimer] = useState(false)
  const [hasAcceptedDisclaimer, setHasAcceptedDisclaimer] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!validateEmail(email)) {
      toast({
        title: 'Invalid Email',
        description: 'Please enter a valid email address',
        variant: 'destructive',
      })
      return
    }

    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
      toast({
        title: 'Invalid Password',
        description: passwordValidation.message,
        variant: 'destructive',
      })
      return
    }

    if (!isLogin && !name.trim()) {
      toast({
        title: 'Name Required',
        description: 'Please enter your name',
        variant: 'destructive',
      })
      return
    }

    // Show disclaimer modal if not accepted
    if (!hasAcceptedDisclaimer) {
      setShowDisclaimer(true)
      return
    }

    await performAuth()
  }

  const performAuth = async () => {
    setLoading(true)

    try {
      if (!isLogin) {
        // Sign up
        const response = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, name })
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.message || 'Signup failed')
        }

        toast({
          title: 'Account Created',
          description: 'Your account has been created successfully',
        })

        // Auto-login after signup
        const result = await signIn('credentials', {
          email,
          password,
          redirect: false,
        })

        if (result?.error) {
          throw new Error('Login failed after signup')
        }

        // Record disclaimer acceptance
        await recordDisclaimerAcceptance()
        
        router.push('/dashboard')
      } else {
        // Sign in
        const result = await signIn('credentials', {
          email,
          password,
          redirect: false,
        })

        if (result?.error) {
          throw new Error('Invalid email or password')
        }

        // Record disclaimer acceptance
        await recordDisclaimerAcceptance()

        router.push('/dashboard')
      }
    } catch (error) {
      toast({
        title: isLogin ? 'Login Failed' : 'Signup Failed',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const recordDisclaimerAcceptance = async () => {
    try {
      await fetch('/api/disclaimers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          disclaimerType: 'login',
          version: '1.0'
        })
      })
    } catch (error) {
      console.error('Error recording disclaimer acceptance:', error)
    }
  }

  const handleAcceptDisclaimer = async () => {
    setHasAcceptedDisclaimer(true)
    setShowDisclaimer(false)
    await performAuth()
  }

  const handleDeclineDisclaimer = () => {
    setShowDisclaimer(false)
    toast({
      title: 'Disclaimer Required',
      description: 'You must accept the disclaimer to continue',
      variant: 'destructive',
    })
  }

  const toggleMode = () => {
    setIsLogin(!isLogin)
    setEmail('')
    setPassword('')
    setName('')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo and Title */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="relative w-[432px] h-32">
              <Image
                src="/LOGO-AiiA-Login.png"
                alt="AiiA Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>
          <p className="text-muted-foreground">
            Your intelligent investment companion
          </p>
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">
              {isLogin ? 'Welcome back to AiiA5' : 'Create account'}
            </CardTitle>
            <CardDescription className="text-center">
              {isLogin 
                ? 'Sign in to your investment dashboard' 
                : 'Start your AI-powered investment journey'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required={!isLogin}
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLogin ? 'Sign In' : 'Create Account'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                {isLogin ? "Don't have an account?" : "Already have an account?"}
                <Button
                  variant="link"
                  className="ml-1 p-0 h-auto text-primary"
                  onClick={toggleMode}
                >
                  {isLogin ? 'Sign up' : 'Sign in'}
                </Button>
              </p>
            </div>

            {/* Demo Account Info */}
            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground text-center mb-2">
                Demo Account for Testing:
              </p>
              <div className="text-xs text-center space-y-1">
                <p><strong>Email:</strong> john@doe.com</p>
                <p><strong>Password:</strong> johndoe123</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Login Disclaimer Modal */}
      <LoginDisclaimerModal
        isOpen={showDisclaimer}
        onAccept={handleAcceptDisclaimer}
        onDecline={handleDeclineDisclaimer}
      />
    </div>
  )
}
