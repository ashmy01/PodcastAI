"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts'
import { 
  DollarSignIcon, 
  TrendingUpIcon, 
  EyeIcon, 
  PlayIcon,
  StarIcon,
  SettingsIcon,
  BellIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon
} from "lucide-react"

interface CreatorDashboardProps {
  walletAddress: string;
}

interface Podcast {
  _id: string;
  title: string;
  description: string;
  monetizationEnabled: boolean;
  totalViews: number;
  totalEarnings: number;
  qualityScore: number;
  adPreferences: {
    allowedCategories: string[];
    maxAdsPerEpisode: number;
    minimumPayoutRate: number;
  };
}

interface AdPlacement {
  _id: string;
  campaignId: string;
  episodeId: string;
  status: string;
  qualityScore: number;
  viewCount: number;
  totalPayout: number;
  createdAt: string;
}

export function CreatorDashboard({ walletAddress }: CreatorDashboardProps) {
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [earnings, setEarnings] = useState<any>(null);
  const [adPlacements, setAdPlacements] = useState<AdPlacement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPodcast, setSelectedPodcast] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, [walletAddress]);

  const fetchDashboardData = async () => {
    try {
      // Fetch podcasts
      const podcastsResponse = await fetch('/api/podcasts', {
        headers: {
          'Authorization': `Bearer ${walletAddress}`,
        },
      });
      
      if (podcastsResponse.ok) {
        const podcastsData = await podcastsResponse.json();
        setPodcasts(podcastsData || []);
      } else {
        console.error('Failed to fetch podcasts:', podcastsResponse.statusText);
        setPodcasts([]);
      }

      // Fetch earnings
      const earningsResponse = await fetch('/api/ai/process-payout', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${walletAddress}`,
        },
      });
      
      if (earningsResponse.ok) {
        const earningsData = await earningsResponse.json();
        setEarnings(earningsData.earnings || {
          totalEarnings: 0,
          pendingPayouts: 0,
          completedPayouts: 0,
          activeCampaigns: 0,
          averagePayoutRate: 0,
          monthlyEarnings: {}
        });
      } else {
        console.error('Failed to fetch earnings:', earningsResponse.statusText);
        setEarnings({
          totalEarnings: 0,
          pendingPayouts: 0,
          completedPayouts: 0,
          activeCampaigns: 0,
          averagePayoutRate: 0,
          monthlyEarnings: {}
        });
      }

      // Fetch ad placements for this creator
      try {
        const placementsResponse = await fetch(`/api/ai/placements?owner=${walletAddress}`, {
          headers: {
            'Authorization': `Bearer ${walletAddress}`,
          },
        });
        
        if (placementsResponse.ok) {
          const placementsData = await placementsResponse.json();
          setAdPlacements(placementsData.placements || []);
        }
      } catch (placementError) {
        console.error('Error fetching ad placements:', placementError);
        setAdPlacements([]);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setPodcasts([]);
      setEarnings({
        totalEarnings: 0,
        pendingPayouts: 0,
        completedPayouts: 0,
        activeCampaigns: 0,
        averagePayoutRate: 0,
        monthlyEarnings: {}
      });
      setAdPlacements([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleMonetization = async (podcastId: string, enabled: boolean) => {
    try {
      const response = await fetch(`/api/podcasts/${podcastId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${walletAddress}`,
        },
        body: JSON.stringify({ monetizationEnabled: enabled }),
      });
      
      if (response.ok) {
        fetchDashboardData(); // Refresh data
      }
    } catch (error) {
      console.error('Error toggling monetization:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'text-green-600';
      case 'pending': return 'text-yellow-600';
      case 'rejected': return 'text-red-600';
      case 'paid': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified': return <CheckCircleIcon className="w-4 h-4" />;
      case 'pending': return <ClockIcon className="w-4 h-4" />;
      case 'rejected': return <XCircleIcon className="w-4 h-4" />;
      case 'paid': return <DollarSignIcon className="w-4 h-4" />;
      default: return <ClockIcon className="w-4 h-4" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 4,
    }).format(amount);
  };

  const totalMetrics = podcasts.reduce((acc, podcast) => ({
    totalViews: acc.totalViews + (podcast.totalViews || 0),
    totalEarnings: acc.totalEarnings + (podcast.totalEarnings || 0),
    monetizedPodcasts: acc.monetizedPodcasts + (podcast.monetizationEnabled ? 1 : 0),
    avgQuality: acc.avgQuality + (podcast.qualityScore || 0)
  }), { totalViews: 0, totalEarnings: 0, monetizedPodcasts: 0, avgQuality: 0 });

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
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <DollarSignIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalMetrics.totalEarnings)}</div>
            <p className="text-xs text-muted-foreground">
              {earnings?.pendingPayouts ? `${formatCurrency(earnings.pendingPayouts)} pending` : 'All up to date'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <EyeIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMetrics.totalViews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Across {podcasts.length} podcasts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
            <PlayIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{earnings?.activeCampaigns || 0}</div>
            <p className="text-xs text-muted-foreground">
              Currently running
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
              {podcasts.length > 0 ? (totalMetrics.avgQuality / podcasts.length).toFixed(2) : '0.00'}
            </div>
            <p className="text-xs text-muted-foreground">
              AI-verified quality
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="podcasts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="podcasts">My Podcasts</TabsTrigger>
          <TabsTrigger value="earnings">Earnings</TabsTrigger>
          <TabsTrigger value="placements">Ad Placements</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="podcasts" className="space-y-4">
          <div className="grid gap-4">
            {podcasts.map((podcast) => (
              <Card key={podcast._id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{podcast.title}</CardTitle>
                      <CardDescription className="line-clamp-2">{podcast.description}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center space-x-2">
                        <label htmlFor={`monetization-${podcast._id}`} className="text-sm font-medium">
                          Monetization
                        </label>
                        <Switch
                          id={`monetization-${podcast._id}`}
                          checked={podcast.monetizationEnabled}
                          onCheckedChange={(checked) => toggleMonetization(podcast._id, checked)}
                        />
                      </div>
                      <Button variant="outline" size="sm">
                        <SettingsIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Views</p>
                      <p className="font-medium">{(podcast.totalViews || 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Earnings</p>
                      <p className="font-medium">{formatCurrency(podcast.totalEarnings || 0)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Quality Score</p>
                      <p className="font-medium">{(podcast.qualityScore || 0).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Max Ads/Episode</p>
                      <p className="font-medium">{podcast.adPreferences?.maxAdsPerEpisode || 2}</p>
                    </div>
                  </div>

                  {podcast.monetizationEnabled && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Monetization Readiness</span>
                        <span>{Math.min(100, (podcast.qualityScore || 0) * 100).toFixed(0)}%</span>
                      </div>
                      <Progress value={Math.min(100, (podcast.qualityScore || 0) * 100)} />
                    </div>
                  )}

                  <div className="flex justify-between items-center mt-4">
                    <div className="flex flex-wrap gap-1">
                      {podcast.adPreferences?.allowedCategories?.slice(0, 3).map((category) => (
                        <Badge key={category} variant="secondary" className="text-xs">
                          {category}
                        </Badge>
                      ))}
                      {(podcast.adPreferences?.allowedCategories?.length || 0) > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{(podcast.adPreferences?.allowedCategories?.length || 0) - 3} more
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Min Rate: {formatCurrency(podcast.adPreferences?.minimumPayoutRate || 0.001)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="earnings" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Earnings Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Total Earnings</span>
                  <span className="font-bold text-lg">{formatCurrency(earnings?.totalEarnings || 0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Pending Payouts</span>
                  <span className="font-medium text-yellow-600">{formatCurrency(earnings?.pendingPayouts || 0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Completed Payouts</span>
                  <span className="font-medium text-green-600">{formatCurrency(earnings?.completedPayouts || 0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Average Payout Rate</span>
                  <span className="font-medium">{formatCurrency(earnings?.averagePayoutRate || 0)}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monthly Earnings</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={Object.entries(earnings?.monthlyEarnings || {}).map(([month, amount]) => ({
                    month,
                    earnings: amount
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Earnings']} />
                    <Bar dataKey="earnings" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Earnings Trends</CardTitle>
              <CardDescription>Track your monetization performance over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={Object.entries(earnings?.monthlyEarnings || {}).map(([month, amount]) => ({
                  month,
                  earnings: amount
                }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Earnings']} />
                  <Line type="monotone" dataKey="earnings" stroke="#8884d8" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="placements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Ad Placements</CardTitle>
              <CardDescription>Track your ad performance and payouts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {adPlacements.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <PlayIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No ad placements yet</p>
                    <p className="text-sm">Enable monetization on your podcasts to start earning</p>
                  </div>
                ) : (
                  adPlacements.map((placement) => (
                    <div key={placement._id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`${getStatusColor(placement.status)}`}>
                          {getStatusIcon(placement.status)}
                        </div>
                        <div>
                          <p className="font-medium">Campaign {placement.campaignId.slice(-8)}</p>
                          <p className="text-sm text-muted-foreground">
                            Episode {placement.episodeId.slice(-8)} • {new Date(placement.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(placement.totalPayout)}</p>
                        <p className="text-sm text-muted-foreground">
                          {placement.viewCount} views • Quality: {placement.qualityScore.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Monetization Preferences</CardTitle>
              <CardDescription>Configure your ad preferences and payout settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-medium mb-3">Notification Settings</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BellIcon className="w-4 h-4" />
                      <span>New campaign matches</span>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DollarSignIcon className="w-4 h-4" />
                      <span>Payout notifications</span>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <StarIcon className="w-4 h-4" />
                      <span>Quality score updates</span>
                    </div>
                    <Switch />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-3">Default Ad Preferences</h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium">Maximum ads per episode</label>
                    <select className="w-full mt-1 p-2 border rounded-md">
                      <option value="1">1 ad</option>
                      <option value="2" selected>2 ads</option>
                      <option value="3">3 ads</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Minimum payout rate</label>
                    <input 
                      type="number" 
                      step="0.0001" 
                      defaultValue="0.001"
                      className="w-full mt-1 p-2 border rounded-md"
                    />
                  </div>
                </div>
              </div>

              <Button className="w-full">
                Save Preferences
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}