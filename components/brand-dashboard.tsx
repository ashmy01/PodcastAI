"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { 
  TrendingUpIcon, 
  TrendingDownIcon, 
  EyeIcon, 
  MousePointerClickIcon,
  DollarSignIcon,
  StarIcon,
  PlayIcon,
  PauseIcon,
  SettingsIcon
} from "lucide-react"

interface Campaign {
  _id: string;
  brandName: string;
  productName: string;
  category: string;
  status: string;
  budget: number;
  totalSpent: number;
  analytics?: {
    totalViews: number;
    clickThroughRate: number;
    averageQualityScore: number;
    conversionRate: number;
  };
}

interface BrandDashboardProps {
  walletAddress: string;
}

export function BrandDashboard({ walletAddress }: BrandDashboardProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    fetchCampaigns();
  }, [walletAddress]);

  const fetchCampaigns = async () => {
    try {
      const response = await fetch('/api/campaigns', {
        headers: {
          'Authorization': `Bearer ${walletAddress}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setCampaigns(data.campaigns);
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCampaignAnalytics = async (campaignId: string) => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/analytics?details=true`, {
        headers: {
          'Authorization': `Bearer ${walletAddress}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const toggleCampaignStatus = async (campaignId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    
    try {
      const response = await fetch(`/api/campaigns/${campaignId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${walletAddress}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (response.ok) {
        fetchCampaigns(); // Refresh campaigns
      }
    } catch (error) {
      console.error('Error updating campaign status:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const calculateTotalMetrics = () => {
    return campaigns.reduce((acc, campaign) => {
      const analytics = campaign.analytics;
      return {
        totalViews: acc.totalViews + (analytics?.totalViews || 0),
        totalSpent: acc.totalSpent + (campaign.totalSpent || 0),
        totalBudget: acc.totalBudget + campaign.budget,
        avgQuality: acc.avgQuality + (analytics?.averageQualityScore || 0),
        avgCTR: acc.avgCTR + (analytics?.clickThroughRate || 0),
        count: acc.count + 1
      };
    }, { totalViews: 0, totalSpent: 0, totalBudget: 0, avgQuality: 0, avgCTR: 0, count: 0 });
  };

  const totalMetrics = calculateTotalMetrics();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <EyeIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMetrics.totalViews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Across {campaigns.length} campaigns
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <DollarSignIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalMetrics.totalSpent)}</div>
            <p className="text-xs text-muted-foreground">
              {((totalMetrics.totalSpent / totalMetrics.totalBudget) * 100).toFixed(1)}% of budget used
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Quality Score</CardTitle>
            <StarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalMetrics.count > 0 ? (totalMetrics.avgQuality / totalMetrics.count).toFixed(2) : '0.00'}
            </div>
            <p className="text-xs text-muted-foreground">
              AI-verified ad quality
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg CTR</CardTitle>
            <MousePointerClickIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalMetrics.count > 0 ? ((totalMetrics.avgCTR / totalMetrics.count) * 100).toFixed(2) : '0.00'}%
            </div>
            <p className="text-xs text-muted-foreground">
              Click-through rate
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="campaigns" className="space-y-4">
        <TabsList>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="optimization">Optimization</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Your Campaigns</h3>
            <Button>
              <PlusIcon className="w-4 h-4 mr-2" />
              Create Campaign
            </Button>
          </div>

          <div className="grid gap-4">
            {campaigns.map((campaign) => (
              <Card key={campaign._id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{campaign.productName}</CardTitle>
                      <CardDescription>{campaign.brandName} • {campaign.category}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(campaign.status)}>
                        {campaign.status.toUpperCase()}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleCampaignStatus(campaign._id, campaign.status)}
                      >
                        {campaign.status === 'active' ? (
                          <PauseIcon className="w-4 h-4" />
                        ) : (
                          <PlayIcon className="w-4 h-4" />
                        )}
                      </Button>
                      <Button variant="outline" size="sm">
                        <SettingsIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Budget</p>
                      <p className="font-medium">{formatCurrency(campaign.budget)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Spent</p>
                      <p className="font-medium">{formatCurrency(campaign.totalSpent || 0)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Views</p>
                      <p className="font-medium">{(campaign.analytics?.totalViews || 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Quality</p>
                      <p className="font-medium">{(campaign.analytics?.averageQualityScore || 0).toFixed(2)}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Budget Usage</span>
                      <span>{((campaign.totalSpent || 0) / campaign.budget * 100).toFixed(1)}%</span>
                    </div>
                    <Progress value={(campaign.totalSpent || 0) / campaign.budget * 100} />
                  </div>

                  <div className="flex justify-between items-center mt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setSelectedCampaign(campaign._id);
                        fetchCampaignAnalytics(campaign._id);
                      }}
                    >
                      View Details
                    </Button>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>CTR: {((campaign.analytics?.clickThroughRate || 0) * 100).toFixed(2)}%</span>
                      <span>•</span>
                      <span>Conv: {((campaign.analytics?.conversionRate || 0) * 100).toFixed(2)}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {analytics && (
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Trends</CardTitle>
                  <CardDescription>Views and engagement over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={analytics.detailedBreakdown?.performanceByDay || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="views" stroke="#8884d8" />
                      <Line type="monotone" dataKey="engagement" stroke="#82ca9d" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Quality Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Excellent', value: analytics.detailedBreakdown?.qualityDistribution?.excellent || 0 },
                            { name: 'Good', value: analytics.detailedBreakdown?.qualityDistribution?.good || 0 },
                            { name: 'Fair', value: analytics.detailedBreakdown?.qualityDistribution?.fair || 0 },
                            { name: 'Poor', value: analytics.detailedBreakdown?.qualityDistribution?.poor || 0 },
                          ]}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {[
                            { name: 'Excellent', value: analytics.detailedBreakdown?.qualityDistribution?.excellent || 0 },
                            { name: 'Good', value: analytics.detailedBreakdown?.qualityDistribution?.good || 0 },
                            { name: 'Fair', value: analytics.detailedBreakdown?.qualityDistribution?.fair || 0 },
                            { name: 'Poor', value: analytics.detailedBreakdown?.qualityDistribution?.poor || 0 },
                          ].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={['#00C49F', '#FFBB28', '#FF8042', '#FF6B6B'][index]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Placement Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Verified</span>
                        <Badge variant="secondary">{analytics.detailedBreakdown?.verifiedPlacements || 0}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Pending</span>
                        <Badge variant="outline">{analytics.detailedBreakdown?.pendingPlacements || 0}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Rejected</span>
                        <Badge variant="destructive">{analytics.detailedBreakdown?.rejectedPlacements || 0}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Paid</span>
                        <Badge variant="default">{analytics.detailedBreakdown?.paidPlacements || 0}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="optimization" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Optimization Suggestions</CardTitle>
              <CardDescription>Improve your campaign performance with AI insights</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUpIcon className="w-4 h-4 text-green-600" />
                    <span className="font-medium">Improve Targeting</span>
                    <Badge variant="outline">High Impact</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Consider expanding to podcasts with similar audience demographics to increase reach by 25-40%.
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <StarIcon className="w-4 h-4 text-blue-600" />
                    <span className="font-medium">Optimize Content Quality</span>
                    <Badge variant="outline">Medium Impact</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Refine content generation rules to improve naturalness and increase quality scores by 15-20%.
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSignIcon className="w-4 h-4 text-orange-600" />
                    <span className="font-medium">Budget Reallocation</span>
                    <Badge variant="outline">Low Impact</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Shift budget from underperforming placements to high-quality matches to improve ROI.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}