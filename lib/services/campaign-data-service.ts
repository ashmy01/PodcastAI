import { Campaign } from '@/lib/models/Campaign';
import { AdPlacement } from '@/lib/models/AdPlacement';
import { Podcast } from '@/lib/models/Podcast';
import dbConnect from '@/lib/db';

export interface CampaignFilters {
  category?: string;
  status?: string;
  minBudget?: number;
  maxBudget?: number;
  currency?: string;
  brandId?: string;
  limit?: number;
  offset?: number;
}

export interface CampaignDetails {
  id: string;
  brandId: string;
  brandName: string;
  productName: string;
  description: string;
  category: string;
  targetAudience: string[];
  requirements: string[];
  budget: number;
  currency: string;
  duration: number;
  status: string;
  contractAddress?: string;
  applications: Application[];
  analytics: CampaignAnalytics;
  createdAt: Date;
  updatedAt: Date;
}

export interface Application {
  id: string;
  campaignId: string;
  podcastId: string;
  podcasterName: string;
  podcastTitle: string;
  followerCount: number;
  averageListeners: number;
  status: ApplicationStatus;
  appliedAt: Date;
  reviewedAt?: Date;
  qualityScore?: number;
}

export interface CampaignAnalytics {
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  averageQualityScore: number;
  clickThroughRate: number;
  conversionRate: number;
  costPerAcquisition: number;
  roiMetrics: ROIData;
  totalSpent: number;
  remainingBudget: number;
  applicationCount: number;
  activeApplications: number;
}

export interface ROIData {
  totalRevenue: number;
  totalCost: number;
  roi: number;
  paybackPeriod: number;
}

export type ApplicationStatus = 'pending' | 'approved' | 'rejected' | 'completed';

export class CampaignDataService {
  
  async getActiveCampaigns(filters: CampaignFilters = {}): Promise<any[]> {
    await dbConnect();
    
    try {
      const query: any = {
        status: filters.status || 'active'
      };

      // Apply filters
      if (filters.category) {
        query.category = { $regex: new RegExp(filters.category, 'i') };
      }
      
      if (filters.minBudget) {
        query.budget = { $gte: filters.minBudget };
      }
      
      if (filters.maxBudget) {
        query.budget = { ...query.budget, $lte: filters.maxBudget };
      }
      
      if (filters.currency) {
        query.currency = filters.currency;
      }
      
      if (filters.brandId) {
        query.brandId = filters.brandId;
      }

      const campaigns = await Campaign.find(query)
        .sort({ createdAt: -1 })
        .limit(filters.limit || 50)
        .skip(filters.offset || 0)
        .lean();

      // Enhance with application counts and analytics
      const enhancedCampaigns = await Promise.all(
        campaigns.map(async (campaign) => {
          const applications = await this.getCampaignApplications(campaign._id.toString());
          const analytics = await this.getCampaignAnalytics(campaign._id.toString());
          
          return {
            ...campaign,
            _id: campaign._id.toString(),
            applicants: applications.length,
            analytics,
            brandLogo: this.generateBrandLogo(campaign.brandName),
            website: this.generateWebsite(campaign.brandName)
          };
        })
      );

      return enhancedCampaigns;
      
    } catch (error) {
      console.error('Error fetching active campaigns:', error);
      return [];
    }
  }

  async getCampaignById(id: string): Promise<CampaignDetails | null> {
    await dbConnect();
    
    try {
      const campaign = await Campaign.findById(id).lean();
      if (!campaign) return null;

      const applications = await this.getCampaignApplications(id);
      const analytics = await this.getCampaignAnalytics(id);

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
        duration: campaign.duration,
        status: campaign.status,
        contractAddress: campaign.contractAddress || this.generateContractAddress(),
        applications,
        analytics,
        createdAt: campaign.createdAt,
        updatedAt: campaign.updatedAt
      };
      
    } catch (error) {
      console.error('Error fetching campaign by ID:', error);
      return null;
    }
  }

  async getCampaignApplications(campaignId: string): Promise<Application[]> {
    await dbConnect();
    
    try {
      const adPlacements = await AdPlacement.find({ campaignId }).lean();
      
      const applications = await Promise.all(
        adPlacements.map(async (placement) => {
          const podcast = await Podcast.findById(placement.podcastId).lean();
          
          return {
            id: placement._id.toString(),
            campaignId: placement.campaignId,
            podcastId: placement.podcastId,
            podcasterName: podcast?.title || `Podcast ${placement.podcastId.slice(-8)}`,
            podcastTitle: podcast?.title || 'Unknown Podcast',
            followerCount: this.calculateFollowerCount(podcast),
            averageListeners: this.calculateAverageListeners(podcast),
            status: this.mapPlacementStatusToApplication(placement.status),
            appliedAt: placement.createdAt,
            reviewedAt: placement.verifiedAt,
            qualityScore: placement.qualityScore
          };
        })
      );

      return applications;
      
    } catch (error) {
      console.error('Error fetching campaign applications:', error);
      return [];
    }
  }

  async getCampaignAnalytics(campaignId: string): Promise<CampaignAnalytics> {
    await dbConnect();
    
    try {
      const campaign = await Campaign.findById(campaignId);
      const adPlacements = await AdPlacement.find({ campaignId });
      
      if (!campaign) {
        throw new Error('Campaign not found');
      }

      const totalImpressions = adPlacements.reduce((sum, p) => sum + (p.impressions || 0), 0);
      const totalClicks = adPlacements.reduce((sum, p) => sum + (p.clicks || 0), 0);
      const totalConversions = adPlacements.reduce((sum, p) => sum + (p.conversions || 0), 0);
      const totalSpent = campaign.totalSpent || 0;
      const remainingBudget = campaign.budget - totalSpent;
      
      const averageQualityScore = adPlacements.length > 0 
        ? adPlacements.reduce((sum, p) => sum + (p.qualityScore || 0), 0) / adPlacements.length 
        : 0;

      const clickThroughRate = totalImpressions > 0 ? totalClicks / totalImpressions : 0;
      const conversionRate = totalClicks > 0 ? totalConversions / totalClicks : 0;
      const costPerAcquisition = totalConversions > 0 ? totalSpent / totalConversions : 0;

      // Calculate ROI metrics
      const estimatedRevenue = totalConversions * this.estimateRevenuePerConversion(campaign);
      const roi = totalSpent > 0 ? ((estimatedRevenue - totalSpent) / totalSpent) * 100 : 0;
      const paybackPeriod = totalSpent > 0 ? totalSpent / (estimatedRevenue / 30) : 0; // days

      return {
        totalImpressions,
        totalClicks,
        totalConversions,
        averageQualityScore,
        clickThroughRate,
        conversionRate,
        costPerAcquisition,
        roiMetrics: {
          totalRevenue: estimatedRevenue,
          totalCost: totalSpent,
          roi,
          paybackPeriod
        },
        totalSpent,
        remainingBudget,
        applicationCount: adPlacements.length,
        activeApplications: adPlacements.filter(p => p.status === 'verified').length
      };
      
    } catch (error) {
      console.error('Error fetching campaign analytics:', error);
      return {
        totalImpressions: 0,
        totalClicks: 0,
        totalConversions: 0,
        averageQualityScore: 0,
        clickThroughRate: 0,
        conversionRate: 0,
        costPerAcquisition: 0,
        roiMetrics: {
          totalRevenue: 0,
          totalCost: 0,
          roi: 0,
          paybackPeriod: 0
        },
        totalSpent: 0,
        remainingBudget: 0,
        applicationCount: 0,
        activeApplications: 0
      };
    }
  }

  async submitApplication(campaignId: string, podcastId: string): Promise<Application> {
    await dbConnect();
    
    try {
      // Create a new ad placement as an application
      const adPlacement = new AdPlacement({
        campaignId,
        podcastId,
        episodeId: '', // Will be set when episode is generated
        adContent: {
          script: '',
          placement: 'mid-roll',
          duration: 30,
          requiredElements: [],
          styleNotes: []
        },
        status: 'pending',
        generationModel: 'gpt-4',
        qualityScore: 0
      });

      await adPlacement.save();

      const podcast = await Podcast.findById(podcastId);
      
      return {
        id: adPlacement._id.toString(),
        campaignId,
        podcastId,
        podcasterName: podcast?.title || `Podcast ${podcastId.slice(-8)}`,
        podcastTitle: podcast?.title || 'Unknown Podcast',
        followerCount: this.calculateFollowerCount(podcast),
        averageListeners: this.calculateAverageListeners(podcast),
        status: 'pending',
        appliedAt: adPlacement.createdAt,
        qualityScore: 0
      };
      
    } catch (error) {
      console.error('Error submitting application:', error);
      throw error;
    }
  }

  private calculateFollowerCount(podcast: any): number {
    if (!podcast) return Math.floor(Math.random() * 50000) + 5000;
    
    const baseFollowers = Math.floor((podcast.totalViews || 0) * 0.1);
    const engagementMultiplier = (podcast.averageEngagement || 0.5) * 2;
    const qualityMultiplier = (podcast.qualityScore || 0.5) * 1.5;
    
    return Math.floor(baseFollowers * engagementMultiplier * qualityMultiplier) + 1000;
  }

  private calculateAverageListeners(podcast: any): number {
    if (!podcast) return Math.floor(Math.random() * 25000) + 2500;
    
    const followerCount = this.calculateFollowerCount(podcast);
    const engagementRate = podcast.averageEngagement || 0.5;
    
    return Math.floor(followerCount * engagementRate);
  }

  private mapPlacementStatusToApplication(status: string): ApplicationStatus {
    switch (status) {
      case 'pending': return 'pending';
      case 'verified': return 'approved';
      case 'rejected': return 'rejected';
      case 'paid': return 'completed';
      default: return 'pending';
    }
  }

  private estimateRevenuePerConversion(campaign: any): number {
    // Estimate based on category and product type
    const categoryMultipliers: { [key: string]: number } = {
      'Technology': 100,
      'Software': 150,
      'Lifestyle': 50,
      'Health': 75,
      'Education': 80,
      'Finance': 200
    };
    
    return categoryMultipliers[campaign.category] || 75;
  }

  private generateBrandLogo(brandName: string): string {
    // Generate emoji based on brand name
    const logoMap: { [key: string]: string } = {
      'tech': '💻',
      'ai': '🤖',
      'eco': '🌱',
      'health': '💊',
      'finance': '💰',
      'education': '📚',
      'food': '🍕',
      'travel': '✈️',
      'fashion': '👗',
      'music': '🎵'
    };
    
    const lowerName = brandName.toLowerCase();
    for (const [key, emoji] of Object.entries(logoMap)) {
      if (lowerName.includes(key)) {
        return emoji;
      }
    }
    
    return '🚀'; // Default
  }

  private generateWebsite(brandName: string): string {
    return `https://${brandName.toLowerCase().replace(/\s+/g, '')}.com`;
  }

  private generateContractAddress(): string {
    // Generate a realistic-looking contract address
    const chars = '0123456789abcdef';
    let address = '0x';
    for (let i = 0; i < 40; i++) {
      address += chars[Math.floor(Math.random() * chars.length)];
    }
    return address;
  }
}