"use client"

import { useState, useEffect } from "react"
import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BackpackIcon,
  PlusIcon
} from "@radix-ui/react-icons"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { Badge } from "@/components/ui/badge"
import { CampaignApiClient } from "@/lib/api/campaign-api-client"
import { MediaApiClient } from "@/lib/api/media-api-client"
import { ErrorBoundary, CampaignErrorFallback } from "@/components/error-boundary"







export default function BrandDealsPage() {
  const { isAuthenticated, address } = useAuth()
  const [activeTab, setActiveTab] = useState("browse")
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [myCampaigns, setMyCampaigns] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const campaignApiClient = new CampaignApiClient()

  useEffect(() => {
    if (activeTab === "browse") {
      fetchActiveCampaigns()
    } else if (isAuthenticated && address && activeTab === "my-deals") {
      fetchMyCampaigns()
    }
  }, [isAuthenticated, address, activeTab])

  const fetchActiveCampaigns = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await campaignApiClient.getPublicCampaigns({
        status: 'active',
        limit: 20
      })
      setCampaigns(response.campaigns)
    } catch (error: any) {
      console.error('Error fetching active campaigns:', error)
      setError(error.message || 'Failed to load campaigns')
      setCampaigns([])
    } finally {
      setLoading(false)
    }
  }

  const retryFetchCampaigns = () => {
    fetchActiveCampaigns()
  }

  const fetchMyCampaigns = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await campaignApiClient.getUserCampaigns({
        limit: 20
      }, address || undefined);
      setMyCampaigns(response.campaigns || []);
    } catch (error: any) {
      console.error('Error fetching campaigns:', error);
      setError(error.message || 'Failed to load your campaigns')
      setMyCampaigns([]);
    } finally {
      setLoading(false);
    }
  }

  const retryFetchMyCampaigns = () => {
    fetchMyCampaigns()
  }






  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-6 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-br from-primary to-primary/70 text-transparent bg-clip-text mb-4">
            Brand Partnership Hub
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Connect brands with podcast creators through secure Web3 contracts. Stake budgets, track performance, and build authentic partnerships.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="browse" className="gap-2">
              <BackpackIcon className="w-4 h-4" />
              Browse Deals
            </TabsTrigger>
            <TabsTrigger value="create" className="gap-2">
              <PlusIcon className="w-4 h-4" />
              Create Deal
            </TabsTrigger>
            <TabsTrigger value="my-deals" className="gap-2">
              <BackpackIcon className="w-4 h-4" />
              My Deals
            </TabsTrigger>
          </TabsList>



          {/* Browse Deals Tab */}
          <TabsContent value="browse">
            <ErrorBoundary fallback={CampaignErrorFallback}>
            <div className="max-w-6xl mx-auto">
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-2">Active Brand Partnerships</h2>
                <p className="text-muted-foreground">
                  Discover brand partnership opportunities and apply to campaigns that match your content
                </p>
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p>Loading brand deals...</p>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <div className="text-red-500 mb-4">⚠️</div>
                  <h3 className="text-lg font-semibold mb-2">Failed to Load Campaigns</h3>
                  <p className="text-muted-foreground mb-6">{error}</p>
                  <div className="flex gap-4 justify-center">
                    <Button onClick={retryFetchCampaigns} disabled={loading}>
                      {loading ? 'Retrying...' : 'Try Again'}
                    </Button>
                    <Button variant="ghost" onClick={() => setActiveTab("create")}>
                      Create Deal Instead
                    </Button>
                  </div>
                </div>
              ) : campaigns.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {campaigns.map((campaign) => (
                    <Card key={campaign._id} className="group hover:shadow-lg transition-all duration-300">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="text-2xl">{campaign.brandLogo || '🚀'}</div>
                            <div>
                              <CardTitle className="text-lg">{campaign.brandName}</CardTitle>
                              <CardDescription>{campaign.productName}</CardDescription>
                            </div>
                          </div>
                          <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>
                            {campaign.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {campaign.description}
                        </p>
                        
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Budget:</span>
                          <span className="font-semibold text-green-600">
                            {campaign.budget} {campaign.currency}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Category:</span>
                          <Badge variant="secondary">{campaign.category}</Badge>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Applications:</span>
                          <span>{campaign.applicants || 0}</span>
                        </div>

                        {campaign.analytics && (
                          <div className="pt-2 border-t">
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="text-center">
                                <div className="font-semibold">{campaign.analytics.totalImpressions.toLocaleString()}</div>
                                <div className="text-muted-foreground">Impressions</div>
                              </div>
                              <div className="text-center">
                                <div className="font-semibold">{(campaign.analytics.clickThroughRate * 100).toFixed(1)}%</div>
                                <div className="text-muted-foreground">CTR</div>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        <Button className="w-full" asChild>
                          <Link href={`/brand-deals/${campaign._id}`}>
                            View Details
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <BackpackIcon className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Active Deals</h3>
                  <p className="text-muted-foreground mb-6">
                    No brand partnerships are currently available
                  </p>
                  <Button onClick={() => setActiveTab("create")}>
                    Create the First Deal
                  </Button>
                </div>
              )}
            </div>
            </ErrorBoundary>
          </TabsContent>

          {/* Create Deal Tab */}
          <TabsContent value="create">
            <Card className="max-w-4xl mx-auto">
              <CardHeader>
                <CardTitle className="text-2xl">Create Brand Deal</CardTitle>
                <CardDescription>
                  Set up a new brand partnership with Web3 budget staking
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <BackpackIcon className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Create Your Brand Deal</h3>
                  <p className="text-muted-foreground mb-6">
                    Connect your wallet to create and stake budget for brand partnerships
                  </p>
                  <Button size="lg" asChild>
                    <Link href="/brand-deals/create">
                      <PlusIcon className="w-5 h-5 mr-2" />
                      Start Creating
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* My Deals Tab */}
          <TabsContent value="my-deals">
            <ErrorBoundary fallback={CampaignErrorFallback}>
            <Card className="max-w-4xl mx-auto">
              <CardHeader>
                <CardTitle className="text-2xl">My Brand Deals</CardTitle>
                <CardDescription>
                  Manage your active partnerships and campaigns
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isAuthenticated ? (
                  loading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                      <p>Loading your campaigns...</p>
                    </div>
                  ) : error ? (
                    <div className="text-center py-12">
                      <div className="text-red-500 mb-4">⚠️</div>
                      <h3 className="text-lg font-semibold mb-2">Failed to Load Your Campaigns</h3>
                      <p className="text-muted-foreground mb-6">{error}</p>
                      <div className="flex gap-4 justify-center">
                        <Button onClick={retryFetchMyCampaigns} disabled={loading}>
                          {loading ? 'Retrying...' : 'Try Again'}
                        </Button>
                        <Button variant="ghost" onClick={() => setActiveTab("create")}>
                          Create New Deal
                        </Button>
                      </div>
                    </div>
                  ) : myCampaigns.length > 0 ? (
                    <div className="space-y-4">
                      {myCampaigns.map((campaign) => (
                        <Card key={campaign._id} className="p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="text-xl">{campaign.brandLogo || '🚀'}</span>
                                <div>
                                  <h3 className="font-semibold text-lg">{campaign.productName}</h3>
                                  <p className="text-muted-foreground">{campaign.brandName} • {campaign.category}</p>
                                </div>
                              </div>
                              <p className="text-sm mt-2 text-muted-foreground">{campaign.description.slice(0, 150)}...</p>
                              
                              {/* Campaign Stats */}
                              <div className="grid grid-cols-3 gap-4 mt-4 p-3 bg-muted/30 rounded-lg">
                                <div className="text-center">
                                  <div className="font-semibold">{campaign.totalSpent || 0}</div>
                                  <div className="text-xs text-muted-foreground">Spent</div>
                                </div>
                                <div className="text-center">
                                  <div className="font-semibold">{campaign.totalViews || 0}</div>
                                  <div className="text-xs text-muted-foreground">Views</div>
                                </div>
                                <div className="text-center">
                                  <div className="font-semibold">{campaign.matchedPodcasts?.length || 0}</div>
                                  <div className="text-xs text-muted-foreground">Matches</div>
                                </div>
                              </div>
                            </div>
                            <div className="text-right ml-4">
                              <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>
                                {campaign.status.toUpperCase()}
                              </Badge>
                              <p className="text-sm text-muted-foreground mt-2">
                                Budget: {campaign.budget} {campaign.currency}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Remaining: {(campaign.budget - (campaign.totalSpent || 0)).toFixed(2)}
                              </p>
                            </div>
                          </div>
                          <div className="flex justify-between items-center mt-4 pt-4 border-t">
                            <div className="text-sm text-muted-foreground">
                              Created: {new Date(campaign.createdAt).toLocaleDateString()}
                            </div>
                            <div className="flex gap-2">
                              <Button variant="secondary" size="sm" asChild>
                                <Link href={`/brand-deals/${campaign._id}/edit`}>
                                  Edit
                                </Link>
                              </Button>
                              <Button variant="ghost" size="sm" asChild>
                                <Link href={`/brand-deals/${campaign._id}`}>
                                  View Details
                                </Link>
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <BackpackIcon className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Active Deals</h3>
                      <p className="text-muted-foreground mb-6">
                        You haven't created any brand deals yet
                      </p>
                      <div className="flex gap-4 justify-center">
                        <Button onClick={() => setActiveTab("create")}>
                          Create Deal
                        </Button>
                      </div>
                    </div>
                  )
                ) : (
                  <div className="text-center py-12">
                    <h3 className="text-lg font-semibold mb-2">Connect Your Wallet</h3>
                    <p className="text-muted-foreground mb-6">
                      Connect your wallet to view and manage your brand deals
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
            </ErrorBoundary>
          </TabsContent>
        </Tabs>

        {/* Call to Action */}
        <div className="text-center mt-16 py-12 bg-gradient-to-r from-primary/5 to-primary/10 rounded-2xl">
          <h2 className="text-2xl font-bold mb-4">Ready to Partner with Brands?</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Join our Web3-powered brand partnership ecosystem and monetize your podcast content.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" onClick={() => setActiveTab("create")}>
              <PlusIcon className="w-5 h-5 mr-2" />
              Create Deal
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}