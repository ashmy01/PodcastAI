"use client"

import { useParams, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
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
import { CampaignDataService } from "@/lib/services/campaign-data-service"
import { SmartContractService } from "@/lib/services/smart-contract-service"
import { MediaService } from "@/lib/services/media-service"

export default function BrandDealDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { id } = params
  const { address, isAuthenticated } = useAuth()
  const [isApplying, setIsApplying] = useState(false)
  const [deal, setDeal] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const campaignService = new CampaignDataService()
  const contractService = new SmartContractService()
  const mediaService = new MediaService()

  useEffect(() => {
    fetchCampaignDetails()
  }, [id])

  const fetchCampaignDetails = async () => {
    try {
      setLoading(true)
      
      // Use the enhanced campaign service to get full details
      const campaignDetails = await campaignService.getCampaignById(id as string)
      
      if (campaignDetails) {
        // Get contract details
        const contractDetails = await contractService.getCampaignContract(id as string)
        
        setDeal({
          ...campaignDetails,
          brandLogo: mediaService.generateBrandLogo(campaignDetails.brandName),
          website: `https://${campaignDetails.brandName.toLowerCase().replace(/\s+/g, '')}.com`,
          contractDetails,
          
          // Calculate progress based on real analytics
          progress: campaignDetails.analytics.totalImpressions > 0 
            ? Math.min(100, (campaignDetails.analytics.totalImpressions / 10000) * 100)
            : 0,
          milestonesCompleted: campaignDetails.analytics.activeApplications,
          totalMilestones: Math.max(1, Math.ceil(campaignDetails.duration / 10)),
          
          // Format target audience
          targetAudience: Array.isArray(campaignDetails.targetAudience) 
            ? campaignDetails.targetAudience.join(', ')
            : campaignDetails.targetAudience,
          
          // Format duration
          duration: `${campaignDetails.duration} days`,
          
          // Add tags
          tags: [campaignDetails.category],
          
          // Format dates
          createdAt: new Date(campaignDetails.createdAt).toLocaleDateString(),
          
          // Use real application count
          applicants: campaignDetails.analytics.applicationCount,
          
          // Contract details from service
          contractAddress: contractDetails.address,
          escrowEnabled: contractDetails.escrowEnabled,
          autoRelease: contractDetails.autoRelease,
          exclusivity: contractDetails.exclusivity,
          contentApproval: contractDetails.contentApproval,
          
          // Use real applications from campaign details
          applications: campaignDetails.applications
        });
      } else {
        setDeal(null);
      }
    } catch (error) {
      console.error('Error fetching campaign details:', error);
      setDeal(null);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-6 py-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4">Loading campaign details...</p>
        </div>
      </div>
    )
  }

  if (!deal) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-6 py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Campaign Not Found</h1>
          <p className="text-muted-foreground mb-6">The campaign you're looking for doesn't exist or has been removed.</p>
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

    if (!address) {
      toast.error("Wallet address not found")
      return
    }

    setIsApplying(true)
    try {
      toast.loading("Submitting application...", { id: "apply" })
      
      // Use the campaign service to submit application
      const application = await campaignService.submitApplication(id as string, address)
      
      // Update the deal with the new application
      setDeal((prev: any) => ({
        ...prev,
        applications: [...(prev.applications || []), application],
        applicants: (prev.applicants || 0) + 1
      }))
      
      toast.success("Application submitted successfully!", { id: "apply" })
    } catch (error) {
      console.error('Error submitting application:', error)
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
                    Contract: {contractService.formatAddress(deal.contractAddress)} | Escrow: {deal.escrowEnabled ? "Enabled" : "Disabled"}
                  </div>
                  {deal.analytics && (
                    <div className="grid grid-cols-3 gap-4 mt-3 pt-3 border-t border-green-200">
                      <div className="text-center">
                        <div className="font-semibold text-green-800">{contractService.formatCurrency(deal.analytics.totalSpent, deal.currency)}</div>
                        <div className="text-xs text-green-600">Spent</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-green-800">{contractService.formatCurrency(deal.analytics.remainingBudget, deal.currency)}</div>
                        <div className="text-xs text-green-600">Remaining</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-green-800">{deal.analytics.roiMetrics.roi.toFixed(1)}%</div>
                        <div className="text-xs text-green-600">ROI</div>
                      </div>
                    </div>
                  )}
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
                    {deal.tags.map((tag: any) => (
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
                  {deal.requirements.map((req: any, index: any) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircledIcon className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{req}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Campaign Analytics */}
            <Card>
              <CardHeader>
                <CardTitle>Campaign Performance</CardTitle>
                <CardDescription>Real-time analytics and metrics</CardDescription>
              </CardHeader>
              <CardContent>
                {deal.analytics ? (
                  <div className="space-y-6">
                    {/* Progress Bar */}
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Campaign Progress</span>
                        <span>{deal.progress.toFixed(1)}%</span>
                      </div>
                      <Progress value={deal.progress} className="h-2" />
                    </div>
                    
                    {/* Key Metrics Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-muted/30 rounded-lg">
                        <div className="font-semibold text-lg">{deal.analytics.totalImpressions.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">Impressions</div>
                      </div>
                      <div className="text-center p-3 bg-muted/30 rounded-lg">
                        <div className="font-semibold text-lg">{deal.analytics.totalClicks.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">Clicks</div>
                      </div>
                      <div className="text-center p-3 bg-muted/30 rounded-lg">
                        <div className="font-semibold text-lg">{(deal.analytics.clickThroughRate * 100).toFixed(2)}%</div>
                        <div className="text-xs text-muted-foreground">CTR</div>
                      </div>
                      <div className="text-center p-3 bg-muted/30 rounded-lg">
                        <div className="font-semibold text-lg">{deal.analytics.totalConversions}</div>
                        <div className="text-xs text-muted-foreground">Conversions</div>
                      </div>
                    </div>
                    
                    {/* Financial Metrics */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Active Applications</span>
                        <p className="font-medium">{deal.analytics.activeApplications} / {deal.analytics.applicationCount}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Avg Quality Score</span>
                        <p className="font-medium">{deal.analytics.averageQualityScore.toFixed(2)}/1.0</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Cost per Acquisition</span>
                        <p className="font-medium">{contractService.formatCurrency(deal.analytics.costPerAcquisition, deal.currency)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Conversion Rate</span>
                        <p className="font-medium">{(deal.analytics.conversionRate * 100).toFixed(2)}%</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <div className="text-sm">No analytics data available yet</div>
                  </div>
                )}
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
                <CardTitle>Applications ({deal.applications?.length || 0})</CardTitle>
                <CardDescription>Podcasters who applied for this campaign</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {deal.applications && deal.applications.length > 0 ? (
                  deal.applications.slice(0, 5).map((app: any) => (
                    <div key={app.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{app.podcasterName}</p>
                        <p className="text-xs text-muted-foreground">{app.podcastTitle}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                          <span>{app.followerCount.toLocaleString()} followers</span>
                          <span>{app.averageListeners.toLocaleString()} avg listeners</span>
                          {app.qualityScore && (
                            <span>★{app.qualityScore.toFixed(1)} quality</span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Applied: {app.appliedAt}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge className={getStatusColor(app.status)} variant="secondary">
                          {app.status}
                        </Badge>
                        {app.reviewedAt && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Reviewed: {app.reviewedAt}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <div className="text-sm">No applications yet</div>
                    <div className="text-xs mt-1">Be the first to apply!</div>
                  </div>
                )}
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