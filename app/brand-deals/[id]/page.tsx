"use client"

import { useParams, useRouter } from "next/navigation"
import { useState } from "react"
import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { 
  ArrowLeftIcon, 
  CheckCircledIcon, 
  CalendarIcon,
  StarIcon,
  ExternalLinkIcon,
  PersonIcon,
  ClockIcon,
  InfoCircledIcon
} from "@radix-ui/react-icons"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"
import { DollarSign, Loader2 } from "lucide-react"

// Mock data for individual brand deal
const mockBrandDealData = {
  "1": {
    id: "1",
    brandName: "TechFlow Solutions",
    productName: "AI Code Assistant Pro",
    description: "Revolutionary AI-powered coding assistant that helps developers write better code faster. Perfect for tech podcasts discussing developer tools and AI productivity. Our tool integrates seamlessly with popular IDEs and provides real-time suggestions, code completion, and bug detection.",
    budget: "5.0",
    currency: "ETH",
    category: "Technology",
    targetAudience: "Developers, Tech Enthusiasts, Software Engineers",
    requirements: [
      "Mention product in 2-3 episodes over the campaign period",
      "Discuss AI coding benefits and personal experience",
      "Include discount code: PODCAST20 for 20% off",
      "Share at least one social media post about the product",
      "Provide analytics report at campaign end"
    ],
    duration: "30 days",
    status: "active",
    applicants: 12,
    createdAt: "2024-01-15",
    brandLogo: "🚀",
    tags: ["AI", "Developer Tools", "Productivity", "SaaS"],
    website: "https://techflow-solutions.com",
    
    // Contract details
    contractAddress: "0x1234...5678",
    escrowEnabled: true,
    autoRelease: false,
    exclusivity: false,
    contentApproval: true,
    
    // Campaign progress
    progress: 65,
    milestonesCompleted: 2,
    totalMilestones: 3,
    
    // Applications
    applications: [
      {
        id: "app1",
        podcasterName: "Tech Talk Daily",
        podcastTitle: "Daily Tech Insights",
        followers: 15000,
        avgListeners: 8500,
        status: "pending",
        appliedAt: "2024-01-16"
      },
      {
        id: "app2", 
        podcasterName: "Code & Coffee",
        podcastTitle: "Morning Dev Sessions",
        followers: 22000,
        avgListeners: 12000,
        status: "approved",
        appliedAt: "2024-01-14"
      }
    ]
  }
}

export default function BrandDealDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { id } = params
  const { address, isAuthenticated } = useAuth()
  const [isApplying, setIsApplying] = useState(false)

  const deal = mockBrandDealData[id as keyof typeof mockBrandDealData]

  if (!deal) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-6 py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Brand Deal Not Found</h1>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800"
      case "pending": return "bg-yellow-100 text-yellow-800"
      case "approved": return "bg-blue-100 text-blue-800"
      case "completed": return "bg-purple-100 text-purple-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const handleApply = async () => {
    if (!isAuthenticated) {
      toast.error("Please connect your wallet to apply")
      return
    }

    setIsApplying(true)
    try {
      // Simulate application process
      toast.loading("Submitting application...", { id: "apply" })
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast.success("Application submitted successfully!", { id: "apply" })
    } catch (error) {
      toast.error("Failed to submit application")
    } finally {
      setIsApplying(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-6 py-8">
        {/* Back Button */}
        <Button variant="ghost" onClick={() => router.back()} className="mb-6">
          <ArrowLeftIcon className="w-4 h-4 mr-2" />
          Back to Brand Deals
        </Button>

        {/* Brand Deal Header */}
        <Card className="mb-8 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-3xl">{deal.brandLogo}</span>
                  <div>
                    <CardTitle className="text-3xl font-bold">{deal.brandName}</CardTitle>
                    <CardDescription className="text-xl font-medium text-foreground">
                      {deal.productName}
                    </CardDescription>
                  </div>
                </div>
                
                {/* Status and Meta */}
                <div className="flex flex-wrap gap-3 items-center mb-4">
                  <Badge className={getStatusColor(deal.status)}>
                    {deal.status.toUpperCase()}
                  </Badge>
                  <Badge variant="outline">{deal.category}</Badge>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <PersonIcon className="w-4 h-4" />
                    {deal.applicants} applicants
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <ClockIcon className="w-4 h-4" />
                    {deal.duration}
                  </div>
                </div>

                {/* Budget */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-green-800">Total Budget Staked</span>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-green-600" />
                      <span className="text-2xl font-bold text-green-800">{deal.budget} {deal.currency}</span>
                    </div>
                  </div>
                  <div className="text-sm text-green-700 mt-1">
                    Contract: {deal.contractAddress} | Escrow: {deal.escrowEnabled ? "Enabled" : "Disabled"}
                  </div>
                </div>
              </div>
              
              <div className="ml-6 space-y-2">
                <Button size="lg" onClick={handleApply} disabled={isApplying}>
                  {isApplying ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Applying...
                    </>
                  ) : (
                    "Apply for Deal"
                  )}
                </Button>
                {deal.website && (
                  <Button size="lg" variant="ghost" asChild>
                    <Link href={deal.website} target="_blank">
                      <ExternalLinkIcon className="w-4 h-4 mr-2" />
                      Visit Website
                    </Link>
                  </Button>
                )}  
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>About This Campaign</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed mb-4">{deal.description}</p>
                
                <div className="mb-4">
                  <h4 className="font-medium mb-2">Target Audience</h4>
                  <p className="text-sm text-muted-foreground">{deal.targetAudience}</p>
                </div>

                {/* Tags */}
                <div>
                  <h4 className="font-medium mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {deal.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Requirements */}
            <Card>
              <CardHeader>
                <CardTitle>Campaign Requirements</CardTitle>
                <CardDescription>What you need to do to complete this campaign</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {deal.requirements.map((req, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircledIcon className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{req}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Campaign Progress (if user is participating) */}
            <Card>
              <CardHeader>
                <CardTitle>Campaign Progress</CardTitle>
                <CardDescription>Track milestone completion and payments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Overall Progress</span>
                      <span>{deal.progress}%</span>
                    </div>
                    <Progress value={deal.progress} className="h-2" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Milestones Completed</span>
                      <p className="font-medium">{deal.milestonesCompleted} / {deal.totalMilestones}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Funds Released</span>
                      <p className="font-medium">{((deal.progress / 100) * parseFloat(deal.budget)).toFixed(2)} {deal.currency}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contract Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <InfoCircledIcon className="w-5 h-5" />
                  Smart Contract
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm">
                  <span className="text-muted-foreground">Contract Address:</span>
                  <p className="font-mono text-xs break-all">{deal.contractAddress}</p>
                </div>
                
                <Separator />
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Escrow Enabled:</span>
                    <Badge variant={deal.escrowEnabled ? "default" : "secondary"}>
                      {deal.escrowEnabled ? "Yes" : "No"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Auto-Release:</span>
                    <Badge variant={deal.autoRelease ? "default" : "secondary"}>
                      {deal.autoRelease ? "Yes" : "No"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Content Approval:</span>
                    <Badge variant={deal.contentApproval ? "default" : "secondary"}>
                      {deal.contentApproval ? "Required" : "Not Required"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Exclusivity:</span>
                    <Badge variant={deal.exclusivity ? "destructive" : "secondary"}>
                      {deal.exclusivity ? "Exclusive" : "Non-Exclusive"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Applications */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Applications</CardTitle>
                <CardDescription>Other podcasters who applied</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {deal.applications.slice(0, 3).map((app) => (
                  <div key={app.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{app.podcasterName}</p>
                      <p className="text-xs text-muted-foreground">{app.podcastTitle}</p>
                      <p className="text-xs text-muted-foreground">{app.followers.toLocaleString()} followers</p>
                    </div>
                    <Badge className={getStatusColor(app.status)} variant="secondary">
                      {app.status}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Apply CTA */}
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg">Ready to Apply?</CardTitle>
                <CardDescription>Join this brand partnership campaign</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" onClick={handleApply} disabled={isApplying}>
                  {isApplying ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Applying...
                    </>
                  ) : (
                    <>
                      <StarIcon className="w-4 h-4 mr-2" />
                      Apply Now
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Connect your wallet to apply for this campaign
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}