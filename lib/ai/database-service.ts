import { Campaign } from '../models/Campaign';
import { Podcast } from '../models/Podcast';
import { Episode } from '../models/Episode';
import { AdPlacement } from '../models/AdPlacement';
import { Campaign as ICampaign, PodcastAI } from './types';

export class AIDatabaseService {
  
  // Campaign methods
  async getCampaignById(campaignId: string): Promise<ICampaign | null> {
    try {
      const campaign = await Campaign.findById(campaignId);
      if (!campaign) return null;
      
      return this.convertCampaignToAIType(campaign);
    } catch (error) {
      console.error('Error fetching campaign:', error);
      return null;
    }
  }

  async getActiveCampaigns(limit: number = 20): Promise<ICampaign[]> {
    try {
      const campaigns = await Campaign.find({
        status: 'active',
        aiMatchingEnabled: true
      }).limit(limit);
      
      return campaigns.map(campaign => this.convertCampaignToAIType(campaign));
    } catch (error) {
      console.error('Error fetching active campaigns:', error);
      return [];
    }
  }

  async getCampaignRequirements(campaignId: string): Promise<string[]> {
    try {
      const campaign = await Campaign.findById(campaignId);
      return campaign?.requirements || [];
    } catch (error) {
      console.error('Error fetching campaign requirements:', error);
      return [];
    }
  }

  // Podcast methods
  async getPodcastById(podcastId: string): Promise<PodcastAI | null> {
    try {
      const podcast = await Podcast.findById(podcastId);
      if (!podcast) return null;
      
      return this.convertPodcastToAIType(podcast);
    } catch (error) {
      console.error('Error fetching podcast:', error);
      return null;
    }
  }

  async getEligiblePodcasts(campaign: ICampaign, limit: number = 50): Promise<PodcastAI[]> {
    try {
      const query: any = {
        monetizationEnabled: true,
        aiContentEnabled: true
      };

      // Filter by allowed categories if specified
      if (campaign.category) {
        query.$or = [
          { 'adPreferences.allowedCategories': { $in: [campaign.category] } },
          { 'adPreferences.allowedCategories': { $size: 0 } } // No restrictions
        ];
      }

      // Exclude podcasts that block this brand
      query['adPreferences.blockedBrands'] = { $ne: campaign.brandName };

      const podcasts = await Podcast.find(query).limit(limit);
      
      return podcasts.map(podcast => this.convertPodcastToAIType(podcast));
    } catch (error) {
      console.error('Error fetching eligible podcasts:', error);
      return [];
    }
  }

  // Episode methods
  async getEpisodeContent(episodeId: string): Promise<string> {
    try {
      const episode = await Episode.findById(episodeId);
      return episode?.script || '';
    } catch (error) {
      console.error('Error fetching episode content:', error);
      return '';
    }
  }

  async updateEpisodeViews(episodeId: string, viewCount: number = 1): Promise<void> {
    try {
      await Episode.findByIdAndUpdate(episodeId, {
        $inc: { totalViews: viewCount }
      });
    } catch (error) {
      console.error('Error updating episode views:', error);
    }
  }

  async updateEpisodeEarnings(episodeId: string, earnings: number): Promise<void> {
    try {
      await Episode.findByIdAndUpdate(episodeId, {
        $inc: { totalEarnings: earnings }
      });
    } catch (error) {
      console.error('Error updating episode earnings:', error);
    }
  }

  // Ad Placement methods
  async createAdPlacement(placementData: any): Promise<string> {
    try {
      const placement = new AdPlacement(placementData);
      await placement.save();
      return placement._id.toString();
    } catch (error) {
      console.error('Error creating ad placement:', error);
      throw error;
    }
  }

  async updateAdPlacementStatus(placementId: string, status: string, verificationResult?: any): Promise<void> {
    try {
      const updateData: any = { status };
      
      if (verificationResult) {
        updateData.verificationResult = verificationResult;
        updateData.verifiedAt = new Date();
      }

      await AdPlacement.findByIdAndUpdate(placementId, updateData);
    } catch (error) {
      console.error('Error updating ad placement status:', error);
    }
  }

  async getAdPlacementsByEpisode(episodeId: string): Promise<any[]> {
    try {
      return await AdPlacement.find({ episodeId });
    } catch (error) {
      console.error('Error fetching ad placements:', error);
      return [];
    }
  }

  async getAdPlacementsByCampaign(campaignId: string): Promise<any[]> {
    try {
      return await AdPlacement.find({ campaignId });
    } catch (error) {
      console.error('Error fetching campaign ad placements:', error);
      return [];
    }
  }

  async updateAdPlacementViews(placementId: string, viewCount: number = 1): Promise<void> {
    try {
      await AdPlacement.findByIdAndUpdate(placementId, {
        $inc: { 
          viewCount: viewCount,
          impressions: viewCount
        },
        lastViewedAt: new Date()
      });
    } catch (error) {
      console.error('Error updating ad placement views:', error);
    }
  }

  // Analytics methods
  async getCampaignAnalytics(campaignId: string): Promise<any> {
    try {
      const placements = await AdPlacement.find({ campaignId });
      
      const totalViews = placements.reduce((sum, p) => sum + p.viewCount, 0);
      const totalImpressions = placements.reduce((sum, p) => sum + p.impressions, 0);
      const totalClicks = placements.reduce((sum, p) => sum + p.clicks, 0);
      const totalConversions = placements.reduce((sum, p) => sum + p.conversions, 0);
      const averageQuality = placements.length > 0 
        ? placements.reduce((sum, p) => sum + p.qualityScore, 0) / placements.length 
        : 0;

      return {
        totalViews,
        totalImpressions,
        totalClicks,
        totalConversions,
        averageQualityScore: averageQuality,
        clickThroughRate: totalImpressions > 0 ? totalClicks / totalImpressions : 0,
        conversionRate: totalClicks > 0 ? totalConversions / totalClicks : 0,
        placementCount: placements.length
      };
    } catch (error) {
      console.error('Error fetching campaign analytics:', error);
      return null;
    }
  }

  async getPodcastAnalytics(podcastId: string): Promise<any> {
    try {
      const episodes = await Episode.find({ podcast: podcastId });
      const placements = await AdPlacement.find({ podcastId });
      
      const totalViews = episodes.reduce((sum, e) => sum + e.totalViews, 0);
      const totalEarnings = episodes.reduce((sum, e) => sum + e.totalEarnings, 0);
      const totalAds = placements.length;
      const averageQuality = placements.length > 0
        ? placements.reduce((sum, p) => sum + p.qualityScore, 0) / placements.length
        : 0;

      return {
        totalViews,
        totalEarnings,
        totalAds,
        averageQualityScore: averageQuality,
        earningsPerView: totalViews > 0 ? totalEarnings / totalViews : 0,
        episodeCount: episodes.length
      };
    } catch (error) {
      console.error('Error fetching podcast analytics:', error);
      return null;
    }
  }

  // Conversion methods
  private convertCampaignToAIType(campaign: any): ICampaign {
    return {
      id: campaign._id.toString(),
      brandId: campaign.brandId,
      brandName: campaign.brandName,
      productName: campaign.productName,
      description: campaign.description,
      category: campaign.category,
      targetAudience: campaign.targetAudience,
      requirements: campaign.requirements,
      budget: campaign.budget,
      currency: campaign.currency,
      payoutPerView: campaign.payoutPerView,
      duration: campaign.duration,
      status: campaign.status,
      contractAddress: campaign.contractAddress,
      createdAt: campaign.createdAt,
      updatedAt: campaign.updatedAt,
      aiMatchingEnabled: campaign.aiMatchingEnabled,
      contentGenerationRules: campaign.contentGenerationRules || [],
      verificationCriteria: campaign.verificationCriteria,
      qualityThreshold: campaign.qualityThreshold
    };
  }

  private convertPodcastToAIType(podcast: any): PodcastAI {
    return {
      id: podcast._id.toString(),
      title: podcast.title,
      description: podcast.description,
      concept: podcast.concept,
      tone: podcast.tone,
      frequency: podcast.frequency,
      length: podcast.length,
      characters: podcast.characters,
      topics: podcast.topics,
      owner: podcast.owner,
      monetizationEnabled: podcast.monetizationEnabled || false,
      adPreferences: podcast.adPreferences || {
        allowedCategories: [],
        blockedBrands: [],
        maxAdsPerEpisode: 2,
        preferredAdPlacement: ['mid-roll'],
        minimumPayoutRate: 0.001
      },
      exclusivityAgreements: podcast.exclusivityAgreements || [],
      aiContentEnabled: podcast.aiContentEnabled !== false,
      qualityScore: podcast.qualityScore || 0.5,
      audienceProfile: podcast.audienceProfile || {
        demographics: { ageRange: '', interests: [], location: [] },
        engagement: { averageListenTime: 0, completionRate: 0, interactionRate: 0 }
      },
      contentThemes: podcast.contentThemes || podcast.topics,
      averageEngagement: podcast.averageEngagement || 0.5,
      totalViews: podcast.totalViews || 0,
      totalEarnings: podcast.totalEarnings || 0
    };
  }

  // Utility methods
  async updatePodcastEngagement(podcastId: string, engagementData: any): Promise<void> {
    try {
      await Podcast.findByIdAndUpdate(podcastId, {
        $set: {
          'audienceProfile.engagement': engagementData,
          averageEngagement: engagementData.completionRate || 0.5
        }
      });
    } catch (error) {
      console.error('Error updating podcast engagement:', error);
    }
  }

  async updateCampaignSpending(campaignId: string, amount: number): Promise<void> {
    try {
      await Campaign.findByIdAndUpdate(campaignId, {
        $inc: { totalSpent: amount }
      });
    } catch (error) {
      console.error('Error updating campaign spending:', error);
    }
  }
}