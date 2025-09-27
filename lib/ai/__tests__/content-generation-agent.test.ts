import { AIContentGenerationAgent } from '../content-generation-agent';
import { Campaign, PodcastAI, AdContent } from '../types';

// Mock the base AI service
jest.mock('../base-ai-service');

describe('AIContentGenerationAgent', () => {
  let contentAgent: AIContentGenerationAgent;
  let mockCampaign: Campaign;
  let mockPodcast: PodcastAI;

  beforeEach(() => {
    contentAgent = new AIContentGenerationAgent();
    
    mockCampaign = {
      id: 'campaign-1',
      brandId: 'brand-1',
      brandName: 'TechFlow Solutions',
      productName: 'AI Code Assistant Pro',
      description: 'Revolutionary AI-powered coding assistant for developers',
      category: 'Technology',
      targetAudience: ['Developers', 'Software Engineers'],
      requirements: ['Mention product benefits', 'Include discount code PODCAST20'],
      budget: 5000,
      currency: 'USDC',
      payoutPerView: 0.01,
      duration: 30,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      aiMatchingEnabled: true,
      contentGenerationRules: [
        { type: 'mention_frequency', value: 2, required: true },
        { type: 'tone', value: 'conversational', required: true }
      ],
      verificationCriteria: {
        minQualityScore: 0.7,
        requiredElements: ['product mention', 'discount code'],
        complianceChecks: ['appropriate content'],
        naturalness: 0.6
      },
      qualityThreshold: 0.7
    };

    mockPodcast = {
      id: 'podcast-1',
      title: 'Tech Talk Daily',
      description: 'Daily discussions about technology and software development',
      concept: 'Technology news and insights',
      tone: 'Professional and conversational',
      frequency: 'Daily',
      length: '30 minutes',
      characters: [
        {
          name: 'Alex',
          personality: 'Tech-savvy host who loves trying new tools',
          gender: 'neutral',
          voice: 'Puck'
        },
        {
          name: 'Sam',
          personality: 'Practical developer focused on productivity',
          gender: 'female',
          voice: 'Kore'
        }
      ],
      topics: ['Technology', 'Software Development', 'AI', 'Programming'],
      owner: '0x123...',
      monetizationEnabled: true,
      adPreferences: {
        allowedCategories: ['Technology'],
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
      contentThemes: ['Technology', 'Software Development'],
      averageEngagement: 0.7,
      totalViews: 5000,
      totalEarnings: 250
    };
  });

  describe('generateAdContent', () => {
    it('should generate valid ad content for a campaign and podcast', async () => {
      const mockAdContent = {
        script: 'Alex: Hey Sam, speaking of productivity tools, have you tried the new AI Code Assistant Pro from TechFlow Solutions?\n\nSam: Actually yes! It\'s been a game-changer for my development workflow. The AI suggestions are incredibly accurate.\n\nAlex: And our listeners can get 20% off with code PODCAST20. It really does help you write better code faster.',
        placement: 'mid-roll',
        duration: 45,
        requiredElements: ['product mention', 'discount code'],
        styleNotes: ['conversational', 'natural transition']
      };

      const mockGenerateContent = jest.fn()
        .mockResolvedValueOnce(JSON.stringify(mockAdContent))
        .mockResolvedValueOnce(JSON.stringify({
          compliant: true,
          violations: [],
          severity: 'low',
          suggestions: []
        }));

      (contentAgent as any).generateContent = mockGenerateContent;

      const result = await contentAgent.generateAdContent(mockPodcast, mockCampaign);

      expect(result).toEqual(mockAdContent);
      expect(result.script).toContain('AI Code Assistant Pro');
      expect(result.script).toContain('PODCAST20');
      expect(result.placement).toBe('mid-roll');
    });

    it('should throw error when generated content fails compliance', async () => {
      const mockAdContent = {
        script: 'This is guaranteed to make you rich instantly!',
        placement: 'mid-roll',
        duration: 30,
        requiredElements: [],
        styleNotes: []
      };

      const mockGenerateContent = jest.fn()
        .mockResolvedValueOnce(JSON.stringify(mockAdContent))
        .mockResolvedValueOnce(JSON.stringify({
          compliant: false,
          violations: ['Misleading claims'],
          severity: 'high',
          suggestions: []
        }));

      (contentAgent as any).generateContent = mockGenerateContent;

      await expect(contentAgent.generateAdContent(mockPodcast, mockCampaign))
        .rejects.toThrow('Generated content failed compliance');
    });

    it('should validate required input fields', async () => {
      const invalidPodcast = { ...mockPodcast, title: '' };

      await expect(contentAgent.generateAdContent(invalidPodcast, mockCampaign))
        .rejects.toThrow();
    });
  });

  describe('embedAdInScript', () => {
    it('should embed ad content into existing script', async () => {
      const originalScript = `Alex: Welcome back to Tech Talk Daily!

Sam: Today we're discussing the latest trends in AI development.

Alex: It's fascinating how AI is transforming every industry.

Sam: Absolutely. The pace of innovation is incredible.

Alex: That wraps up today's episode. Thanks for listening!`;

      const adContent: AdContent = {
        script: 'Alex: Speaking of AI tools, have you tried AI Code Assistant Pro?\nSam: Yes! It\'s amazing for productivity.',
        placement: 'mid-roll',
        duration: 30,
        requiredElements: ['product mention'],
        styleNotes: ['natural transition']
      };

      const mockEmbeddedScript = `Alex: Welcome back to Tech Talk Daily!

Sam: Today we're discussing the latest trends in AI development.

[AD START]
Alex: Speaking of AI tools, have you tried AI Code Assistant Pro?
Sam: Yes! It's amazing for productivity.
[AD END]

Alex: It's fascinating how AI is transforming every industry.

Sam: Absolutely. The pace of innovation is incredible.

Alex: That wraps up today's episode. Thanks for listening!`;

      const mockGenerateContent = jest.fn().mockResolvedValue(mockEmbeddedScript);
      (contentAgent as any).generateContent = mockGenerateContent;

      const result = await contentAgent.embedAdInScript(originalScript, adContent);

      expect(result).toContain('[AD START]');
      expect(result).toContain('[AD END]');
      expect(result).toContain('AI Code Assistant Pro');
    });

    it('should use fallback embedding when AI fails', async () => {
      const originalScript = 'Line 1\nLine 2\nLine 3\nLine 4';
      const adContent: AdContent = {
        script: 'Ad content here',
        placement: 'mid-roll',
        duration: 30,
        requiredElements: [],
        styleNotes: []
      };

      const mockGenerateContent = jest.fn().mockRejectedValue(new Error('AI service error'));
      (contentAgent as any).generateContent = mockGenerateContent;

      const result = await contentAgent.embedAdInScript(originalScript, adContent);

      expect(result).toContain('[AD START]');
      expect(result).toContain('[AD END]');
      expect(result).toContain('Ad content here');
    });
  });

  describe('validateContentCompliance', () => {
    it('should validate compliant content', async () => {
      const compliantContent = 'This is a natural mention of our sponsor, AI Code Assistant Pro. It helps developers write better code.';
      
      const mockComplianceResult = {
        compliant: true,
        violations: [],
        severity: 'low' as const,
        suggestions: []
      };

      const mockGenerateContent = jest.fn().mockResolvedValue(JSON.stringify(mockComplianceResult));
      (contentAgent as any).generateContent = mockGenerateContent;

      const result = await contentAgent.validateContentCompliance(compliantContent);

      expect(result.compliant).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('should identify non-compliant content', async () => {
      const nonCompliantContent = 'This guaranteed miracle product will make you rich instantly!';
      
      const mockComplianceResult = {
        compliant: false,
        violations: ['Misleading claims', 'No disclosure'],
        severity: 'high' as const,
        suggestions: ['Remove misleading claims', 'Add sponsor disclosure']
      };

      const mockGenerateContent = jest.fn().mockResolvedValue(JSON.stringify(mockComplianceResult));
      (contentAgent as any).generateContent = mockGenerateContent;

      const result = await contentAgent.validateContentCompliance(nonCompliantContent);

      expect(result.compliant).toBe(false);
      expect(result.violations).toContain('Misleading claims');
      expect(result.severity).toBe('high');
    });

    it('should use fallback compliance check when AI fails', async () => {
      const content = 'This guaranteed miracle product will make you rich!';

      const mockGenerateContent = jest.fn().mockRejectedValue(new Error('AI service error'));
      (contentAgent as any).generateContent = mockGenerateContent;

      const result = await contentAgent.validateContentCompliance(content);

      expect(result.compliant).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);
    });
  });

  describe('optimizeForStyle', () => {
    it('should optimize content to match podcast style', async () => {
      const originalContent = 'Buy our product now! It\'s the best!';
      const optimizedContent = 'Alex: You know, I\'ve been using this tool lately and it\'s really improved my workflow.\nSam: That sounds interesting! What makes it special?';

      const mockGenerateContent = jest.fn().mockResolvedValue(optimizedContent);
      (contentAgent as any).generateContent = mockGenerateContent;

      const result = await contentAgent.optimizeForStyle(originalContent, mockPodcast);

      expect(result).toBe(optimizedContent);
      expect(result).toContain('Alex:');
      expect(result).toContain('Sam:');
    });

    it('should return original content when optimization fails', async () => {
      const originalContent = 'Original content here';

      const mockGenerateContent = jest.fn().mockRejectedValue(new Error('AI service error'));
      (contentAgent as any).generateContent = mockGenerateContent;

      const result = await contentAgent.optimizeForStyle(originalContent, mockPodcast);

      expect(result).toBe(originalContent);
    });
  });

  describe('generateVariations', () => {
    it('should generate multiple variations of ad content', async () => {
      const baseContent: AdContent = {
        script: 'Original ad script',
        placement: 'mid-roll',
        duration: 30,
        requiredElements: ['product mention'],
        styleNotes: ['conversational']
      };

      const mockGenerateContent = jest.fn()
        .mockResolvedValueOnce('Variation 1 script')
        .mockResolvedValueOnce('Variation 2 script')
        .mockResolvedValueOnce('Variation 3 script');

      (contentAgent as any).generateContent = mockGenerateContent;

      const variations = await contentAgent.generateVariations(baseContent, 3);

      expect(variations).toHaveLength(3);
      expect(variations[0].script).toBe('Variation 1 script');
      expect(variations[1].script).toBe('Variation 2 script');
      expect(variations[2].script).toBe('Variation 3 script');
      
      // Should maintain other properties
      variations.forEach(variation => {
        expect(variation.placement).toBe(baseContent.placement);
        expect(variation.duration).toBe(baseContent.duration);
        expect(variation.requiredElements).toEqual(baseContent.requiredElements);
      });
    });

    it('should handle errors gracefully and continue with other variations', async () => {
      const baseContent: AdContent = {
        script: 'Original ad script',
        placement: 'mid-roll',
        duration: 30,
        requiredElements: [],
        styleNotes: []
      };

      const mockGenerateContent = jest.fn()
        .mockResolvedValueOnce('Variation 1 script')
        .mockRejectedValueOnce(new Error('AI service error'))
        .mockResolvedValueOnce('Variation 3 script');

      (contentAgent as any).generateContent = mockGenerateContent;

      const variations = await contentAgent.generateVariations(baseContent, 3);

      expect(variations).toHaveLength(2); // Should skip the failed one
      expect(variations[0].script).toBe('Variation 1 script');
      expect(variations[1].script).toBe('Variation 3 script');
    });
  });

  describe('private helper methods', () => {
    it('should parse ad content response correctly', () => {
      const mockResponse = JSON.stringify({
        script: 'Test script',
        placement: 'mid-roll',
        duration: 45,
        requiredElements: ['element1'],
        styleNotes: ['note1']
      });

      const result = (contentAgent as any).parseAdContentResponse(mockResponse);

      expect(result.script).toBe('Test script');
      expect(result.placement).toBe('mid-roll');
      expect(result.duration).toBe(45);
    });

    it('should handle invalid JSON response', () => {
      const invalidResponse = 'Not valid JSON';

      expect(() => {
        (contentAgent as any).parseAdContentResponse(invalidResponse);
      }).toThrow('Failed to parse AI response');
    });

    it('should cleanup embedded script properly', () => {
      const messyScript = '```javascript\nSome code\n```\n\n\nExtra lines\n\n\n';
      const cleaned = (contentAgent as any).cleanupEmbeddedScript(messyScript);

      expect(cleaned).not.toContain('```');
      expect(cleaned).not.toMatch(/\n{3,}/);
    });

    it('should perform fallback compliance check', () => {
      const problematicContent = 'This guaranteed miracle product will make you rich instantly!';
      const result = (contentAgent as any).fallbackComplianceCheck(problematicContent);

      expect(result.compliant).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);
      expect(result.violations.some(v => v.includes('guaranteed'))).toBe(true);
    });

    it('should estimate speaking duration correctly', () => {
      const script = 'This is a test script with exactly twenty words to test the duration estimation function properly and accurately.';
      const duration = (contentAgent as any).estimateSpeakingDuration(script);

      expect(duration).toBeGreaterThan(0);
      expect(typeof duration).toBe('number');
    });
  });
});