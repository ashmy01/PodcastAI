import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Campaign } from '@/lib/models/Campaign';
import { requireAuth, extractWalletAddress } from '@/lib/auth-middleware';
import { AIMatchingAgent } from '@/lib/ai/matching-agent';
import { AIDatabaseService } from '@/lib/ai/database-service';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
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
    const campaign = await Campaign.findById(campaignId);

    if (!campaign) {
      return NextResponse.json({ message: 'Campaign not found' }, { status: 404 });
    }

    // Check ownership
    if (campaign.brandId !== walletAddress) {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 });
    }

    const dbService = new AIDatabaseService();
    const matchingAgent = new AIMatchingAgent();

    // Get current campaign analytics
    const analytics = await dbService.getCampaignAnalytics(campaignId);
    const adPlacements = await dbService.getAdPlacementsByCampaign(campaignId);

    // Generate optimization suggestions
    const suggestions = await generateOptimizationSuggestions(
      campaign,
      analytics,
      adPlacements,
      matchingAgent
    );

    return NextResponse.json({
      campaignId,
      currentPerformance: {
        totalViews: analytics?.totalViews || 0,
        averageQualityScore: analytics?.averageQualityScore || 0,
        clickThroughRate: analytics?.clickThroughRate || 0,
        conversionRate: analytics?.conversionRate || 0,
        totalSpend: campaign.totalSpent || 0,
        remainingBudget: campaign.budget - (campaign.totalSpent || 0)
      },
      optimizationSuggestions: suggestions,
      generatedAt: new Date()
    });

  } catch (error: any) {
    console.error('Failed to generate optimization suggestions:', error);
    return NextResponse.json({ 
      message: 'Failed to generate optimization suggestions', 
      error: error.message 
    }, { status: 500 });
  }
}

async function generateOptimizationSuggestions(
  campaign: any,
  analytics: any,
  adPlacements: any[],
  matchingAgent: AIMatchingAgent
): Promise<any[]> {
  const suggestions: any[] = [];

  // Performance-based suggestions
  if (analytics) {
    // Low quality score suggestion
    if (analytics.averageQualityScore < 0.6) {
      suggestions.push({
        type: 'quality_improvement',
        priority: 'high',
        title: 'Improve Ad Quality',
        description: 'Your ads have a low average quality score. Consider refining your content generation rules.',
        actionItems: [
          'Review and update content generation rules',
          'Ensure requirements are clear and specific',
          'Consider increasing quality threshold',
          'Review rejected placements for common issues'
        ],
        expectedImpact: 'Increase quality score by 20-30%'
      });
    }

    // Low engagement suggestion
    if (analytics.clickThroughRate < 0.02) { // Less than 2% CTR
      suggestions.push({
        type: 'engagement_optimization',
        priority: 'medium',
        title: 'Boost Engagement',
        description: 'Your click-through rate is below average. Consider optimizing ad content and targeting.',
        actionItems: [
          'Test different call-to-action phrases',
          'Improve audience targeting',
          'Consider more engaging content formats',
          'Review successful placements for patterns'
        ],
        expectedImpact: 'Increase CTR by 50-100%'
      });
    }

    // Budget optimization
    const costPerView = analytics.totalViews > 0 ? (campaign.totalSpent || 0) / analytics.totalViews : 0;
    if (costPerView > campaign.payoutPerView * 2) {
      suggestions.push({
        type: 'budget_optimization',
        priority: 'high',
        title: 'Optimize Budget Allocation',
        description: 'Your cost per view is higher than expected. Consider adjusting payout rates or targeting.',
        actionItems: [
          'Review payout per view rate',
          'Focus on higher-performing podcasts',
          'Pause underperforming placements',
          'Negotiate better rates with top performers'
        ],
        expectedImpact: 'Reduce cost per view by 25-40%'
      });
    }
  }

  // Targeting suggestions
  const verifiedPlacements = adPlacements.filter(p => p.status === 'verified');
  const rejectedPlacements = adPlacements.filter(p => p.status === 'rejected');

  if (rejectedPlacements.length > verifiedPlacements.length) {
    suggestions.push({
      type: 'targeting_improvement',
      priority: 'high',
      title: 'Improve Targeting Accuracy',
      description: 'Many of your ad placements are being rejected. Consider refining your targeting criteria.',
      actionItems: [
        'Review rejected placements for common patterns',
        'Refine target audience criteria',
        'Update content requirements',
        'Consider working with higher-quality podcasts'
      ],
      expectedImpact: 'Increase approval rate by 30-50%'
    });
  }

  // Matching suggestions
  if (campaign.aiMatchingEnabled) {
    try {
      const newMatches = await matchingAgent.findMatches(campaign._id.toString());
      const highQualityMatches = newMatches.filter(m => m.compatibilityScore > 0.8);
      
      if (highQualityMatches.length > 0) {
        suggestions.push({
          type: 'new_opportunities',
          priority: 'medium',
          title: 'New High-Quality Matches Available',
          description: `Found ${highQualityMatches.length} new high-quality podcast matches for your campaign.`,
          actionItems: [
            'Review new podcast matches',
            'Accept high-compatibility matches',
            'Consider expanding to similar podcasts',
            'Test with small budget allocation first'
          ],
          expectedImpact: 'Expand reach by 20-40%',
          data: {
            newMatches: highQualityMatches.slice(0, 5) // Top 5 matches
          }
        });
      }
    } catch (error) {
      console.error('Error finding new matches for optimization:', error);
    }
  }

  // Content optimization suggestions
  const lowQualityPlacements = adPlacements.filter(p => p.qualityScore < 0.5);
  if (lowQualityPlacements.length > 0) {
    suggestions.push({
      type: 'content_optimization',
      priority: 'medium',
      title: 'Optimize Ad Content',
      description: 'Some ad placements have low quality scores. Consider improving content generation.',
      actionItems: [
        'Review low-quality placements',
        'Update content generation rules',
        'Add more specific style guidelines',
        'Consider A/B testing different approaches'
      ],
      expectedImpact: 'Improve average quality by 15-25%'
    });
  }

  // Seasonal/timing suggestions
  const now = new Date();
  const campaignAge = now.getTime() - campaign.createdAt.getTime();
  const daysRunning = Math.floor(campaignAge / (1000 * 60 * 60 * 24));

  if (daysRunning > 7 && analytics?.totalViews < 100) {
    suggestions.push({
      type: 'performance_boost',
      priority: 'high',
      title: 'Low Performance Alert',
      description: 'Your campaign has been running for a week but has low view counts.',
      actionItems: [
        'Review and expand target audience',
        'Increase payout per view rate',
        'Consider more popular podcast categories',
        'Review campaign messaging and appeal'
      ],
      expectedImpact: 'Increase views by 100-200%'
    });
  }

  // Budget utilization suggestions
  const budgetUtilization = (campaign.totalSpent || 0) / campaign.budget;
  if (budgetUtilization < 0.1 && daysRunning > 3) {
    suggestions.push({
      type: 'budget_utilization',
      priority: 'medium',
      title: 'Low Budget Utilization',
      description: 'Your campaign is using budget slowly. Consider increasing activity.',
      actionItems: [
        'Increase payout per view rate',
        'Expand targeting criteria',
        'Accept more podcast matches',
        'Consider premium podcast placements'
      ],
      expectedImpact: 'Increase campaign velocity by 50-100%'
    });
  }

  // Sort suggestions by priority
  const priorityOrder = { high: 3, medium: 2, low: 1 };
  suggestions.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);

  return suggestions;
}