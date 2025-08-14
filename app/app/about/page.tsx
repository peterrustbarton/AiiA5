
'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Brain,
  TrendingUp,
  Shield,
  Users,
  Award,
  BarChart3,
  Zap,
  Globe,
  Mail,
  Phone,
  MapPin,
  Github,
  Twitter,
  Linkedin,
  ExternalLink,
  Star,
  CheckCircle,
  Target,
  Lightbulb,
  Rocket
} from 'lucide-react'

const teamMembers = [
  {
    name: "Alex Chen",
    role: "AI Research Lead",
    bio: "PhD in Machine Learning with 8+ years in financial AI systems",
    avatar: "AC"
  },
  {
    name: "Sarah Johnson",
    role: "Quantitative Analyst",
    bio: "Former Goldman Sachs quant with expertise in algorithmic trading",
    avatar: "SJ"
  },
  {
    name: "Michael Rodriguez",
    role: "Product Manager",
    bio: "10+ years building fintech products for retail investors",
    avatar: "MR"
  },
  {
    name: "Emily Zhang",
    role: "Data Scientist",
    bio: "Specialist in market sentiment analysis and behavioral finance",
    avatar: "EZ"
  }
]

const features = [
  {
    icon: Brain,
    title: "Advanced AI Analysis",
    description: "Multi-source AI analysis with confidence scoring and detailed reasoning"
  },
  {
    icon: TrendingUp,
    title: "Real-time Market Data",
    description: "Live market data from multiple sources with automated web scraping"
  },
  {
    icon: Shield,
    title: "Risk Management",
    description: "Comprehensive risk assessment with automated stop-loss and take-profit"
  },
  {
    icon: BarChart3,
    title: "Portfolio Analytics",
    description: "Advanced portfolio tracking with performance analysis and optimization"
  },
  {
    icon: Zap,
    title: "Automated Trading",
    description: "AI-powered automated trading with customizable risk parameters"
  },
  {
    icon: Globe,
    title: "Multi-Asset Support",
    description: "Stocks, cryptocurrencies, and ETFs with unified analysis framework"
  }
]

const milestones = [
  {
    year: "2023",
    title: "AiiA Founded",
    description: "Started with the vision to democratize AI-powered investment analysis"
  },
  {
    year: "2024",
    title: "Beta Launch",
    description: "Released beta version with basic AI analysis and paper trading"
  },
  {
    year: "2024",
    title: "Enhanced AI Engine",
    description: "Deployed advanced multi-source analysis with confidence scoring"
  },
  {
    year: "2025",
    title: "Pro Features",
    description: "Launched automated trading and advanced portfolio analytics"
  }
]

export default function AboutPage() {
  const [activeTab, setActiveTab] = useState("overview")

  return (
    <div className="container mx-auto max-w-6xl py-8">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 mb-4">
          <Brain className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold">About AiiA</h1>
        </div>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Your AI-powered investment assistant that democratizes sophisticated financial analysis 
          and automated trading strategies for retail investors.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="technology">Technology</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="roadmap">Roadmap</TabsTrigger>
          <TabsTrigger value="contact">Contact</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-8">
          {/* Mission */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Our Mission
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-lg">
                To democratize sophisticated investment analysis by making institutional-grade 
                AI-powered financial tools accessible to individual investors worldwide.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <Shield className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <h3 className="font-semibold">Safety First</h3>
                  <p className="text-sm text-muted-foreground">
                    Comprehensive risk management and educational approach
                  </p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <Users className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <h3 className="font-semibold">Accessible</h3>
                  <p className="text-sm text-muted-foreground">
                    User-friendly interface for investors of all experience levels
                  </p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <Brain className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                  <h3 className="font-semibold">AI-Powered</h3>
                  <p className="text-sm text-muted-foreground">
                    Advanced machine learning for superior market analysis
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Key Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="text-center p-6">
                <div className="text-2xl font-bold text-primary">95%</div>
                <p className="text-sm text-muted-foreground">Analysis Accuracy</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="text-center p-6">
                <div className="text-2xl font-bold text-primary">10K+</div>
                <p className="text-sm text-muted-foreground">Active Users</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="text-center p-6">
                <div className="text-2xl font-bold text-primary">24/7</div>
                <p className="text-sm text-muted-foreground">Market Monitoring</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="text-center p-6">
                <div className="text-2xl font-bold text-primary">100+</div>
                <p className="text-sm text-muted-foreground">Data Sources</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="features" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Icon className="h-5 w-5" />
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="technology" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Technology Stack
              </CardTitle>
              <CardDescription>
                Built with cutting-edge technologies for reliability and performance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3">AI & Machine Learning</h3>
                  <div className="space-y-2">
                    <Badge variant="secondary">GPT-4.1-mini</Badge>
                    <Badge variant="secondary">TensorFlow</Badge>
                    <Badge variant="secondary">scikit-learn</Badge>
                    <Badge variant="secondary">Custom Neural Networks</Badge>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-3">Data Processing</h3>
                  <div className="space-y-2">
                    <Badge variant="secondary">Real-time APIs</Badge>
                    <Badge variant="secondary">Web Scraping</Badge>
                    <Badge variant="secondary">Multi-source Aggregation</Badge>
                    <Badge variant="secondary">Sentiment Analysis</Badge>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-3">Frontend</h3>
                  <div className="space-y-2">
                    <Badge variant="secondary">Next.js 14</Badge>
                    <Badge variant="secondary">React 18</Badge>
                    <Badge variant="secondary">TypeScript</Badge>
                    <Badge variant="secondary">Tailwind CSS</Badge>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-3">Backend & Infrastructure</h3>
                  <div className="space-y-2">
                    <Badge variant="secondary">PostgreSQL</Badge>
                    <Badge variant="secondary">Prisma ORM</Badge>
                    <Badge variant="secondary">NextAuth.js</Badge>
                    <Badge variant="secondary">Cloud Deployment</Badge>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-3">Security & Compliance</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">End-to-end encryption</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">SOC 2 compliance</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Financial disclaimers</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Risk management protocols</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {teamMembers.map((member, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="font-semibold text-primary">{member.avatar}</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{member.name}</h3>
                      <p className="text-sm text-primary mb-2">{member.role}</p>
                      <p className="text-sm text-muted-foreground">{member.bio}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="roadmap" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Rocket className="h-5 w-5" />
                Product Roadmap
              </CardTitle>
              <CardDescription>
                Our journey from inception to the future of AI-powered investing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {milestones.map((milestone, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 bg-primary rounded-full"></div>
                      {index < milestones.length - 1 && (
                        <div className="w-0.5 h-12 bg-border mt-2"></div>
                      )}
                    </div>
                    <div className="flex-1 pb-8">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline">{milestone.year}</Badge>
                        <h3 className="font-semibold">{milestone.title}</h3>
                      </div>
                      <p className="text-muted-foreground">{milestone.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="my-6" />

              <div>
                <h3 className="font-semibold mb-4">Coming Soon</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border border-dashed rounded-lg">
                    <h4 className="font-medium mb-1">Options Trading</h4>
                    <p className="text-sm text-muted-foreground">
                      Advanced options analysis and automated strategies
                    </p>
                  </div>
                  <div className="p-4 border border-dashed rounded-lg">
                    <h4 className="font-medium mb-1">Social Trading</h4>
                    <p className="text-sm text-muted-foreground">
                      Follow and copy successful traders' strategies
                    </p>
                  </div>
                  <div className="p-4 border border-dashed rounded-lg">
                    <h4 className="font-medium mb-1">Mobile App</h4>
                    <p className="text-sm text-muted-foreground">
                      Native iOS and Android applications
                    </p>
                  </div>
                  <div className="p-4 border border-dashed rounded-lg">
                    <h4 className="font-medium mb-1">API Access</h4>
                    <p className="text-sm text-muted-foreground">
                      Developer API for third-party integrations
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Get in Touch</CardTitle>
                <CardDescription>
                  We'd love to hear from you. Send us a message and we'll respond as soon as possible.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>support@aiia.ai</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>+1 (555) 123-4567</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>San Francisco, CA</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Follow Us</CardTitle>
                <CardDescription>
                  Stay updated with the latest news and features
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" className="w-full justify-start" asChild>
                  <a href="https://twitter.com/aiia_ai" target="_blank" rel="noopener noreferrer">
                    <Twitter className="h-4 w-4 mr-2" />
                    Follow us on Twitter
                    <ExternalLink className="h-3 w-3 ml-auto" />
                  </a>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <a href="https://linkedin.com/company/aiia-ai" target="_blank" rel="noopener noreferrer">
                    <Linkedin className="h-4 w-4 mr-2" />
                    Connect on LinkedIn
                    <ExternalLink className="h-3 w-3 ml-auto" />
                  </a>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <a href="https://github.com/aiia-ai" target="_blank" rel="noopener noreferrer">
                    <Github className="h-4 w-4 mr-2" />
                    View on GitHub
                    <ExternalLink className="h-3 w-3 ml-auto" />
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Legal & Compliance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  <strong>Investment Disclaimer:</strong> AiiA provides educational tools and analysis for informational purposes only. 
                  We are not a registered investment advisor. All investment decisions should be made independently and users should 
                  consult with qualified financial professionals before making investment decisions.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <Button variant="ghost" className="justify-start h-auto p-3" asChild>
                  <a href="/legal/privacy" target="_blank">
                    Privacy Policy
                    <ExternalLink className="h-3 w-3 ml-auto" />
                  </a>
                </Button>
                <Button variant="ghost" className="justify-start h-auto p-3" asChild>
                  <a href="/legal/terms" target="_blank">
                    Terms of Service
                    <ExternalLink className="h-3 w-3 ml-auto" />
                  </a>
                </Button>
                <Button variant="ghost" className="justify-start h-auto p-3" asChild>
                  <a href="/legal/risk" target="_blank">
                    Risk Disclosure
                    <ExternalLink className="h-3 w-3 ml-auto" />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
