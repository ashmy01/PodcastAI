import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Campaign } from '@/lib/models/Campaign';
import { CampaignAnalytics } from '@/lib/models/CampaignAnalytics';
import { requireAuth, extractWalletAddress } from '@/lib/auth-middleware';
import { AIDatabaseService } from '@/lib/ai/database-service';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  await dbConnect();

  // Check authentication
  const authError = requireAuth(req);
  if (authError) return authError;

  const walletAddress = extractWalletAddress(req);
  if (!walletAddress) {
    return NextResponse.json({ message: 'Wallet address is required' }, { status: 401 });
  }

  try {
    const campaignId = params.id;
    const { searchParams } = new URL(req.url);
    const timeRange = searchParams.get('timeRange') || '30'; // days
    const includeDetails = searchParams.get('details') === 'true';

    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return NextResponse.json({ message: 'Campaign not found' }, { status: 404 });
    }

    // Check ownership
    if (campaign.brandId !== walletAddress) {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 });
    }

    const dbService = new AIDatabaseService();

    // Get current analytics summary
    const currentAnalytics = await dbService.getCampaignAnalytics(campaignId);

    // Get historical analytics
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(timeRange));

    const historicalAnalytics = await CampaignAnalytics.find({
      campaignId,
      date: { $gte: startDate }
    }).sort({ date: 1 });

    // Calculate trends
    const trends = this.calculateTrends(historicalAnalytics);

    // Get detailed breakdown if requested
    let detailedBreakdown = null;
    if (includeDetails) {
      const adPlacements = await dbService.getAdPlacementsByCampaign(campaignId);
      
      detailedBreakdown = {
        totalPlacements: adPlacements.length,
        verifiedPlacements: adPlacements.filter(p => p.status === 'verified').length,
        rejectedPlacements: adPlacements.filter(p => p.status === 'rejected').length,
        pendingPlacements: adPlacements.filter(p => p.status === 'pending').length,
        paidPlacements: adPlacements.filter(p => p.status === 'paid').length,
        
        placementsByPodcast: this.groupPlacementsByPodcast(adPlacements),
        qualityDistribution: this.calculateQualityDistribution(adPlacements),
        performanceByDay: this.calculateDailyPerformance(historicalAnalytics)
      };
    }

    return NextResponse.json({
      campaignId,
      currentAnalytics,
      trends,
      historicalData: historicalAnalytics,
      detailedBreakdown,
      timeRange: parseInt(timeRange),
      generatedAt: new Date()
    });

  } catch (error: any) {
    console.error('Failed to fetch campaign analytics:', error);
    return NextResponse.json({ 
      message: 'Failed to fetch campaign analytics', 
      error: error.message 
    }, { status: 500 });
  }
}

// Helper method to calculate trends
function calculateTrends(historicalData: any[]): any {
  if (historicalData.length < 2) {
    return {
      viewsTrend: 0,
      engagementTrend: 0,
      qualityTrend: 0,
      spendTrend: 0
    };
  }

  const recent = historicalData.slice(-7); // Last 7 days
  const previous = historicalData.slice(-14, -7); // Previous 7 days

  const recentAvg = {
    views: recent.reduce((sum, d) => sum + d.views, 0) / recent.length,
    engagement: recent.reduce((sum, d) => sum + d.engagementRate, 0) / recent.length,
    quality: recent.reduce((sum, d) => sum + d.qualityScore, 0) / recent.length,
    spend: recent.reduce((sum, d) => sum + d.spend, 0) / recent.length
  };

  const previousAvg = {
    views: previous.reduce((sum, d) => sum + d.views, 0) / previous.length,
    engagement: previous.reduce((sum, d) => sum + d.engagementRate, 0) / previous.length,
    quality: previous.reduce((sum, d) => sum + d.qualityScore, 0) / previous.length,
    spend: previous.reduce((sum, d) => sum + d.spend, 0) / previous.length
  };

  return {
    viewsTrend: previousAvg.views > 0 ? ((recentAvg.views - previousAvg.views) / previousAvg.views) * 100 : 0,
    engagementTrend: previousAvg.engagement > 0 ? ((recentAvg.engagement - previousAvg.engagement) / previousAvg.engagement) * 100 : 0,
    qualityTrend: previousAvg.quality > 0 ? ((recentAvg.quality - previousAvg.quality) / previousAvg.quality) * 100 : 0,
    spendTrend: previousAvg.spend > 0 ? ((recentAvg.spend - previousAvg.spend) / previousAvg.spend) * 100 : 0
  };
}

// Helper method to group placements by podcast
function groupPlacementsByPodcast(placements: any[]): any[] {
  const grouped = placements.reduce((acc, placement) => {
    const podcastId = placement.podcastId;
    if (!acc[podcastId]) {
      acc[podcastId] = {
        podcastId,
        totalPlacements: 0,
        totalViews: 0,
        totalPayout: 0,
        averageQuality: 0,
        statuses: { pending: 0, verified: 0, rejected: 0, paid: 0 }
      };
    }
    
    acc[podcastId].totalPlacements++;
    acc[podcastId].totalViews += placement.viewCount || 0;
    acc[podcastId].totalPayout += placement.totalPayout || 0;
    acc[podcastId].averageQuality += placement.qualityScore || 0;
    acc[podcastId].statuses[placement.status]++;
    
    return acc;
  }, {});

  // Calculate averages and return as array
  return Object.values(grouped).map((group: any) => ({
    ...group,
    averageQuality: group.totalPlacements > 0 ? group.averageQuality / group.totalPlacements : 0
  }));
}

// Helper method to calculate quality distribution
function calculateQualityDistribution(placements: any[]): any {
  const distribution = {
    excellent: 0, // 0.8-1.0
    good: 0,      // 0.6-0.8
    fair: 0,      // 0.4-0.6
    poor: 0       // 0.0-0.4
  };

  placements.forEach(placement => {
    const quality = placement.qualityScore || 0;
    if (quality >= 0.8) distribution.excellent++;
    else if (quality >= 0.6) distribution.good++;
    else if (quality >= 0.4) distribution.fair++;
    else distribution.poor++;
  });

  return distribution;
}

// Helper method to calculate daily performance
function calculateDailyPerformance(historicalData: any[]): any[] {
  return historicalData.map(data => ({
    date: data.date,
    views: data.views,
    engagement: data.engagementRate,
    quality: data.qualityScore,
    spend: data.spend,
    ctr: data.impressions > 0 ? (data.clicks / data.impressions) * 100 : 0,
    conversionRate: data.clicks > 0 ? (data.conversions / data.clicks) * 100 : 0
  }));
}