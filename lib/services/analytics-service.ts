import { AnalyticsService } from '../ai/interfaces';
import { CampaignMetrics, CampaignInsights, PerformancePrediction, AudienceAnalytics, CompetitorInsight } from '../ai/types';
import { AIDatabaseService } from '../ai/database-service';
import { CampaignAnalytics } from '../models/CampaignAnalytics';

export class AIAnalyticsService implements AnalyticsService {
  private dbService = new AIDatabaseService();

  async trackCampaignPerformance(campaignId: string): Promise<CampaignMetrics> {
    try {
      const analytics = await this.dbService.getCampaignAnalytics(campaignId);
      
      if (!analytics) {
        return {
          totalViews: 0,
          totalSpent: 0,
          averageQualityScore: 0,
          conversionRate: 0,
          audienceReach: 0,
          engagementRate: 0,
          clickThroughRate: 0,
          costPerView: 0
        };
      }

      return {
        totalViews: analytics.totalViews,
        totalSpent: analytics.totalSpent || 0,
        averageQualityScore: analytics.averageQualityScore,
        conversionRate: analytics.conversionRate,
        audienceReach: analytics.totalViews * 0.8, // Estimate unique listeners
        engagementRate: analytics.averageQualityScore, // Use quality as proxy
        clickThroughRate: analytics.clickThroughRate,
        costPerView: analytics.totalViews > 0 ? (analytics.totalSpent || 0) / analytics.totalViews : 0
      };
    } catch (error) {
      console.error('Error tracking campaign performance:', error);
      throw error;
    }
  }

  async generateInsights(campaignId: string): Promise<CampaignInsights> {
    try {
      // Get historical data for trends
      const historicalData = await CampaignAnalytics.find({ campaignId })
        .sort({ date: -1 })
        .limit(30);

      const performanceTrends = this.calculatePerformanceTrends(historicalData);
      const contentQualityTrends = this.calculateQualityTrends(historicalData);
      
      // Generate optimization suggestions
      const optimizationSuggestions = await this.generateOptimizationSuggestions(campaignId, historicalData);
      
      // Get competitor analysis (simplified)
      const competitorAnalysis = await this.getCompetitorAnalysis(campaignId);

      return {
        performanceTrends,
        audienceEngagement: this.calculateAverageEngagement(historicalData),
        contentQualityTrends,
        optimizationSuggestions,
        competitorAnalysis
      };
    } catch (error) {
      console.error('Error generating insights:', error);
      throw error;
    }
  }

  async predictPerformance(campaign: any, podcast: any): Promise<PerformancePrediction> {
    try {
      // Simple prediction model based on historical data
      const baseViews = podcast.totalViews || 100;
      const qualityMultiplier = (podcast.qualityScore || 0.5) * 2;
      const engagementMultiplier = (podcast.averageEngagement || 0.5) * 1.5;
      
      const expectedViews = Math.floor(baseViews * qualityMultiplier * engagementMultiplier * 0.1);
      const expectedEngagement = (podcast.averageEngagement || 0.5) * 0.9; // Slightly lower for ads
      const expectedConversion = expectedViews * 0.02; // 2% conversion rate estimate

      return {
        expectedViews,
        expectedEngagement,
        expectedConversion,
        confidenceInterval: [expectedViews * 0.7, expectedViews * 1.3],
        riskFactors: this.identifyRiskFactors(campaign, podcast)
      };
    } catch (error) {
      console.error('Error predicting performance:', error);
      throw error;
    }
  }

  async getAudienceAnalytics(podcastId: string): Promise<AudienceAnalytics> {
    try {
      const { Podcast } = await import('../models/Podcast');
      const podcast = await Podcast.findById(podcastId);
      
      if (!podcast) {
        throw new Error('Podcast not found');
      }

      // Extract demographics from audience profile
      const demographics = podcast.audienceProfile?.demographics || {};
      const engagement = podcast.audienceProfile?.engagement || {};

      return {
        demographics: this.processDemographics(demographics),
        interests: this.processInterests(podcast.topics),
        engagementPatterns: this.calculateEngagementPatterns(engagement),
        retentionRate: engagement.completionRate || 0.5,
        growthRate: this.calculateGrowthRate(podcast)
      };
    } catch (error) {
      console.error('Error getting audience analytics:', error);
      throw error;
    }
  }

  private calculatePerformanceTrends(historicalData: any[]): { [date: string]: number } {
    const trends: { [date: string]: number } = {};
    
    historicalData.forEach(data => {
      const dateKey = data.date.toISOString().split('T')[0];
      trends[dateKey] = data.views || 0;
    });

    return trends;
  }

  private calculateQualityTrends(historicalData: any[]): { [date: string]: number } {
    const trends: { [date: string]: number } = {};
    
    historicalData.forEach(data => {
      const dateKey = data.date.toISOString().split('T')[0];
      trends[dateKey] = data.qualityScore || 0;
    });

    return trends;
  }

  private calculateAverageEngagement(historicalData: any[]): number {
    if (historicalData.length === 0) return 0;
    
    const totalEngagement = historicalData.reduce((sum, data) => sum + (data.engagementRate || 0), 0);
    return totalEngagement / historicalData.length;
  }

  private async generateOptimizationSuggestions(campaignId: string, historicalData: any[]): Promise<string[]> {
    const suggestions: string[] = [];
    
    if (historicalData.length === 0) {
      suggestions.push('Campaign needs more data for analysis');
      return suggestions;
    }

    const latestData = historicalData[0];
    const avgQuality = this.calculateAverageEngagement(historicalData);

    if (avgQuality < 0.6) {
      suggestions.push('Consider improving ad content quality and naturalness');
    }

    if (latestData.clickThroughRate < 0.02) {
      suggestions.push('Optimize call-to-action and ad placement for better engagement');
    }

    if (latestData.conversionRate < 0.01) {
      suggestions.push('Review targeting criteria and audience alignment');
    }

    return suggestions;
  }

  private async getCompetitorAnalysis(campaignId: string): Promise<CompetitorInsight[]> {
    // Simplified competitor analysis
    const { Campaign } = await import('../models/Campaign');
    const campaign = await Campaign.findById(campaignId);
    
    if (!campaign) return [];

    // Find similar campaigns in the same category
    const similarCampaigns = await Campaign.find({
      category: campaign.category,
      _id: { $ne: campaignId },
      status: 'active'
    }).limit(5);

    const insights: CompetitorInsight[] = [];

    for (const competitor of similarCampaigns) {
      const analytics = await this.dbService.getCampaignAnalytics(competitor._id.toString());
      
      if (analytics) {
        insights.push({
          brandName: competitor.brandName,
          marketShare: 0.1, // Simplified
          averageSpend: analytics.totalSpent || 0,
          performanceMetrics: {
            totalViews: analytics.totalViews,
            totalSpent: analytics.totalSpent || 0,
            averageQualityScore: analytics.averageQualityScore,
            conversionRate: analytics.conversionRate,
            audienceReach: analytics.totalViews * 0.8,
            engagementRate: analytics.averageQualityScore,
            clickThroughRate: analytics.clickThroughRate,
            costPerView: analytics.totalViews > 0 ? (analytics.totalSpent || 0) / analytics.totalViews : 0
          }
        });
      }
    }

    return insights;
  }

  private identifyRiskFactors(campaign: any, podcast: any): string[] {
    const riskFactors: string[] = [];

    if (podcast.qualityScore < 0.5) {
      riskFactors.push('Low podcast quality score');
    }

    if (podcast.totalViews < 100) {
      riskFactors.push('Limited audience reach');
    }

    if (campaign.budget < campaign.payoutPerView * 100) {
      riskFactors.push('Limited budget for sustained campaign');
    }

    if (!podcast.monetizationEnabled) {
      riskFactors.push('Podcast monetization not enabled');
    }

    return riskFactors;
  }

  private processDemographics(demographics: any): { [key: string]: number } {
    // Convert demographics to percentage distribution
    const processed: { [key: string]: number } = {};
    
    if (demographics.ageRange) {
      processed[demographics.ageRange] = 1.0;
    }

    if (demographics.location && Array.isArray(demographics.location)) {
      const locationWeight = 1.0 / demographics.location.length;
      demographics.location.forEach((loc: string) => {
        processed[loc] = locationWeight;
      });
    }

    return processed;
  }

  private processInterests(topics: string[]): { [key: string]: number } {
    const interests: { [key: string]: number } = {};
    const weight = 1.0 / topics.length;
    
    topics.forEach(topic => {
      interests[topic] = weight;
    });

    return interests;
  }

  private calculateEngagementPatterns(engagement: any): { [timeSlot: string]: number } {
    // Simplified engagement patterns
    return {
      'morning': 0.3,
      'afternoon': 0.4,
      'evening': 0.3
    };
  }

  private calculateGrowthRate(podcast: any): number {
    // Simplified growth rate calculation
    const baseGrowth = 0.05; // 5% monthly growth
    const qualityBonus = (podcast.qualityScore || 0.5) * 0.1;
    const engagementBonus = (podcast.averageEngagement || 0.5) * 0.05;
    
    return baseGrowth + qualityBonus + engagementBonus;
  }
}