import { AIMatchingAgent } from '../matching-agent';
import { Campaign, PodcastAI } from '../types';

// Mock the base AI service
jest.mock('../base-ai-service');

describe('AIMatchingAgent', () => {
  let matchingAgent: AIMatchingAgent;
  let mockCampaign: Campaign;
  let mockPodcast: PodcastAI;

  beforeEach(() => {
    matchingAgent = new AIMatchingAgent();
    
    mockCampaign = {
      id: 'campaign-1',
      brandId: 'brand-1',
      brandName: 'TechFlow Solutions',
      productName: 'AI Code Assistant Pro',
      description: 'Revolutionary AI-powered coding assistant for developers',
      category: 'Technology',
      targetAudience: ['Developers', 'Software Engineers', 'Tech Enthusiasts'],
      requirements: ['Mention product benefits', 'Include discount code'],
      budget: 5000,
      currency: 'USDC',
      payoutPerView: 0.01,
      duration: 30,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      aiMatchingEnabled: true,
      contentGenerationRules: [],
      verificationCriteria: {
        minQualityScore: 0.7,
        requiredElements: ['product mention'],
        complianceChecks: ['appropriate content'],
        naturalness: 0.6
      },
      qualityThreshold: 0.7
    };

    mockPodcast = {
      id: 'podcast-1',
      title: 'Tech Talk Daily',
      description: 'Daily discussions about the latest in technology and software development',
      concept: 'Technology news and insights',
      tone: 'Professional and informative',
      frequency: 'Daily',
      length: '30 minutes',
      characters: [
        {
          name: 'Alex',
          personality: 'Tech-savvy host',
          gender: 'neutral',
          voice: 'Puck'
        }
      ],
      topics: ['Technology', 'Software Development', 'AI', 'Programming'],
      owner: '0x123...',
      monetizationEnabled: true,
      adPreferences: {
        allowedCategories: ['Technology', 'Software'],
        blockedBrands: [],
        maxAdsPerEpisode: 2,
        preferredAdPlacement: ['mid-roll'],
        minimumPayoutRate: 0.005
      },
      exclusivityAgreements: [],
      aiContentEnabled: true,
      qualityScore: 0.8,
      audienceProfile: {
        demographics: {
          ageRange: '25-45',
          interests: ['Technology', 'Programming'],
          location: ['US', 'Europe']
        },
        engagement: {
          averageListenTime: 1800,
          completionRate: 0.75,
          interactionRate: 0.4
        }
      },
      contentThemes: ['Technology', 'Software Development', 'AI'],
      averageEngagement: 0.7,
      totalViews: 5000,
      totalEarnings: 250
    };
  });

  describe('scoreCompatibility', () => {
    it('should return high compatibility score for well-matched campaign and podcast', async () => {
      // Mock the AI response
      const mockGenerateContent = jest.fn().mockResolvedValue('0.85');
      (matchingAgent as any).generateContent = mockGenerateContent;

      const score = await matchingAgent.scoreCompatibility(mockCampaign, mockPodcast);

      expect(score).toBe(0.85);
      expect(mockGenerateContent).toHaveBeenCalledWith(expect.stringContaining('TechFlow Solutions'));
    });

    it('should use fallback calculation when AI response is invalid', async () => {
      // Mock invalid AI response
      const mockGenerateContent = jest.fn().mockResolvedValue('invalid');
      (matchingAgent as any).generateContent = mockGenerateContent;

      const score = await matchingAgent.scoreCompatibility(mockCampaign, mockPodcast);

      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(1);
    });

    it('should return low score for incompatible campaign and podcast', async () => {
      const incompatiblePodcast = {
        ...mockPodcast,
        topics: ['Cooking', 'Recipes'],
        contentThemes: ['Food', 'Lifestyle'],
        adPreferences: {
          ...mockPodcast.adPreferences,
          blockedBrands: ['TechFlow Solutions']
        }
      };

      // Mock low compatibility response
      const mockGenerateContent = jest.fn().mockResolvedValue('0.15');
      (matchingAgent as any).generateContent = mockGenerateContent;

      const score = await matchingAgent.scoreCompatibility(mockCampaign, incompatiblePodcast);

      expect(score).toBe(0.15);
    });
  });

  describe('analyzeCampaign', () => {
    it('should analyze campaign and return structured data', async () => {
      const mockAnalysis = {
        keyFeatures: ['AI-powered', 'Code assistance', 'Developer tools'],
        targetDemographics: ['Developers', 'Software Engineers'],
        contentRequirements: ['Technical discussion', 'Product demonstration'],
        budgetEfficiency: 0.8,
        competitiveAnalysis: ['Strong market position', 'Unique AI features']
      };

      const mockGenerateContent = jest.fn().mockResolvedValue(JSON.stringify(mockAnalysis));
      (matchingAgent as any).generateContent = mockGenerateContent;

      const analysis = await matchingAgent.analyzeCampaign(mockCampaign);

      expect(analysis).toEqual(mockAnalysis);
      expect(analysis.keyFeatures).toContain('AI-powered');
      expect(analysis.budgetEfficiency).toBe(0.8);
    });

    it('should return fallback analysis when AI fails', async () => {
      const mockGenerateContent = jest.fn().mockRejectedValue(new Error('AI service error'));
      (matchingAgent as any).generateContent = mockGenerateContent;

      const analysis = await matchingAgent.analyzeCampaign(mockCampaign);

      expect(analysis.keyFeatures).toContain(mockCampaign.productName);
      expect(analysis.targetDemographics).toEqual(mockCampaign.targetAudience);
      expect(analysis.budgetEfficiency).toBe(0.6);
    });
  });

  describe('profilePodcast', () => {
    it('should profile podcast and return structured data', async () => {
      const mockProfile = {
        contentThemes: ['Technology', 'Software Development'],
        audienceDemographics: ['Tech professionals', 'Developers'],
        engagementMetrics: {
          averageViews: 5000,
          completionRate: 0.75,
          interactionRate: 0.4
        },
        monetizationReadiness: 0.8,
        brandCompatibility: ['Technology', 'Software', 'Developer Tools']
      };

      const mockGenerateContent = jest.fn().mockResolvedValue(JSON.stringify(mockProfile));
      (matchingAgent as any).generateContent = mockGenerateContent;

      const profile = await matchingAgent.profilePodcast(mockPodcast);

      expect(profile).toEqual(mockProfile);
      expect(profile.monetizationReadiness).toBe(0.8);
      expect(profile.brandCompatibility).toContain('Technology');
    });

    it('should return fallback profile when AI fails', async () => {
      const mockGenerateContent = jest.fn().mockRejectedValue(new Error('AI service error'));
      (matchingAgent as any).generateContent = mockGenerateContent;

      const profile = await matchingAgent.profilePodcast(mockPodcast);

      expect(profile.contentThemes).toEqual(mockPodcast.topics);
      expect(profile.engagementMetrics.averageViews).toBe(mockPodcast.totalViews);
      expect(profile.monetizationReadiness).toBe(mockPodcast.qualityScore);
    });
  });

  describe('updateMatchingModel', () => {
    it('should process feedback data for model improvement', async () => {
      const feedbackData = [
        {
          campaignId: 'campaign-1',
          podcastId: 'podcast-1',
          actualPerformance: 0.8,
          expectedPerformance: 0.7,
          userSatisfaction: 0.9
        }
      ];

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const mockStoreFeedback = jest.fn().mockResolvedValue(undefined);
      (matchingAgent as any).storeFeedbackData = mockStoreFeedback;

      await matchingAgent.updateMatchingModel(feedbackData);

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Updating matching model'));
      expect(mockStoreFeedback).toHaveBeenCalledWith(feedbackData);

      consoleSpy.mockRestore();
    });
  });

  describe('private methods', () => {
    it('should calculate audience alignment correctly', () => {
      const alignment = (matchingAgent as any).calculateAudienceAlignment(mockCampaign, mockPodcast);
      
      expect(alignment).toBeGreaterThan(0);
      expect(alignment).toBeLessThanOrEqual(1);
    });

    it('should calculate content relevance correctly', () => {
      const relevance = (matchingAgent as any).calculateContentRelevance(mockCampaign, mockPodcast);
      
      expect(relevance).toBeGreaterThan(0);
      expect(relevance).toBeLessThanOrEqual(1);
    });

    it('should calculate brand fit correctly', () => {
      const fit = (matchingAgent as any).calculateBrandFit(mockCampaign, mockPodcast);
      
      expect(fit).toBeGreaterThan(0);
      expect(fit).toBeLessThanOrEqual(1);
    });

    it('should return 0 brand fit for blocked brands', () => {
      const blockedPodcast = {
        ...mockPodcast,
        adPreferences: {
          ...mockPodcast.adPreferences,
          blockedBrands: ['TechFlow Solutions']
        }
      };

      const fit = (matchingAgent as any).calculateBrandFit(mockCampaign, blockedPodcast);
      
      expect(fit).toBe(0);
    });

    it('should estimate reach based on views and engagement', () => {
      const reach = (matchingAgent as any).estimateReach(mockPodcast);
      
      expect(reach).toBeGreaterThan(mockPodcast.totalViews);
      expect(typeof reach).toBe('number');
    });

    it('should calculate budget allocation based on compatibility and reach', () => {
      const allocation = (matchingAgent as any).calculateBudgetAllocation(mockCampaign, mockPodcast, 0.8);
      
      expect(allocation).toBeGreaterThan(0);
      expect(allocation).toBeLessThanOrEqual(mockCampaign.budget * 0.3);
    });
  });
});