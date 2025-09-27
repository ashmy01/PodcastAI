import { AIVerificationAgent } from '../verification-agent';
import { QualityScore, ComplianceResult } from '../types';

// Mock the base AI service
jest.mock('../base-ai-service');

describe('AIVerificationAgent', () => {
  let verificationAgent: AIVerificationAgent;

  beforeEach(() => {
    verificationAgent = new AIVerificationAgent();
  });

  describe('analyzeContentQuality', () => {
    it('should analyze content quality and return valid scores', async () => {
      const content = `
        Alex: Welcome back to Tech Talk Daily!
        
        [AD START]
        Sam: Speaking of productivity tools, I've been using AI Code Assistant Pro lately.
        Alex: Oh really? How's it working for you?
        Sam: It's been amazing! Really helps with code completion and bug detection. 
        Alex: That sounds great. Our listeners can check it out with code PODCAST20 for 20% off.
        [AD END]
        
        Alex: Now, let's dive into today's main topic about machine learning trends.
      `;

      const requirements = ['Mention product benefits', 'Include discount code'];

      const mockQualityScore: QualityScore = {
        overall: 0.85,
        naturalness: 0.9,
        relevance: 0.8,
        engagement: 0.85,
        compliance: 0.9,
        breakdown: {
          ad_integration: 0.9,
          character_consistency: 0.8,
          flow_disruption: 0.1,
          message_clarity: 0.9,
          call_to_action: 0.8
        }
      };

      const mockGenerateContent = jest.fn().mockResolvedValue(JSON.stringify(mockQualityScore));
      (verificationAgent as any).generateContent = mockGenerateContent;

      const result = await verificationAgent.analyzeContentQuality(content, requirements);

      expect(result).toEqual(mockQualityScore);
      expect(result.overall).toBe(0.85);
      expect(result.naturalness).toBe(0.9);
      expect(mockGenerateContent).toHaveBeenCalledWith(expect.stringContaining('NATURALNESS'));
    });

    it('should use fallback quality score when AI fails', async () => {
      const content = 'Test content with [AD START] and [AD END] markers';
      const requirements = ['Test requirement'];

      const mockGenerateContent = jest.fn().mockRejectedValue(new Error('AI service error'));
      (verificationAgent as any).generateContent = mockGenerateContent;

      const result = await verificationAgent.analyzeContentQuality(content, requirements);

      expect(result.overall).toBeGreaterThan(0);
      expect(result.overall).toBeLessThanOrEqual(1);
      expect(result.naturalness).toBeGreaterThan(0);
      expect(result.relevance).toBeGreaterThan(0);
      expect(result.engagement).toBeGreaterThan(0);
      expect(result.compliance).toBeGreaterThan(0);
    });

    it('should handle invalid AI response format', async () => {
      const content = 'Test content';
      const requirements = ['Test requirement'];

      const mockGenerateContent = jest.fn().mockResolvedValue('Invalid JSON response');
      (verificationAgent as any).generateContent = mockGenerateContent;

      const result = await verificationAgent.analyzeContentQuality(content, requirements);

      // Should fall back to generated quality score
      expect(typeof result.overall).toBe('number');
      expect(result.overall).toBeGreaterThanOrEqual(0);
      expect(result.overall).toBeLessThanOrEqual(1);
    });
  });

  describe('validateCompliance', () => {
    it('should validate compliant content', async () => {
      const compliantContent = `
        Alex: This episode is sponsored by TechFlow Solutions.
        Sam: Their AI Code Assistant Pro has been really helpful for my development work.
        Alex: It's a great tool that helps developers write better code more efficiently.
      `;

      const mockComplianceResult: ComplianceResult = {
        compliant: true,
        violations: [],
        severity: 'low',
        suggestions: []
      };

      const mockGenerateContent = jest.fn().mockResolvedValue(JSON.stringify(mockComplianceResult));
      (verificationAgent as any).generateContent = mockGenerateContent;

      const result = await verificationAgent.validateCompliance(compliantContent);

      expect(result.compliant).toBe(true);
      expect(result.violations).toHaveLength(0);
      expect(result.severity).toBe('low');
    });

    it('should identify non-compliant content', async () => {
      const nonCompliantContent = `
        This guaranteed miracle product will make you rich instantly!
        Buy now or miss out forever!
      `;

      const mockComplianceResult: ComplianceResult = {
        compliant: false,
        violations: ['Misleading claims', 'No disclosure', 'Excessive promotion'],
        severity: 'high',
        suggestions: ['Remove misleading claims', 'Add sponsor disclosure', 'Tone down promotional language']
      };

      const mockGenerateContent = jest.fn().mockResolvedValue(JSON.stringify(mockComplianceResult));
      (verificationAgent as any).generateContent = mockGenerateContent;

      const result = await verificationAgent.validateCompliance(nonCompliantContent);

      expect(result.compliant).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);
      expect(result.severity).toBe('high');
      expect(result.suggestions.length).toBeGreaterThan(0);
    });

    it('should use fallback compliance check when AI fails', async () => {
      const content = 'This guaranteed miracle product will make you rich!';

      const mockGenerateContent = jest.fn().mockRejectedValue(new Error('AI service error'));
      (verificationAgent as any).generateContent = mockGenerateContent;

      const result = await verificationAgent.validateCompliance(content);

      expect(result.compliant).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);
      expect(result.violations.some(v => v.includes('guaranteed'))).toBe(true);
    });
  });

  describe('checkRequirements', () => {
    it('should check if requirements are met in content', async () => {
      const content = `
        Alex: Today we're talking about AI Code Assistant Pro from TechFlow Solutions.
        Sam: It really helps with productivity and code quality.
        Alex: Use code PODCAST20 for 20% off your subscription.
      `;

      const requirements = [
        'Mention product name',
        'Include discount code PODCAST20',
        'Discuss product benefits'
      ];

      const mockGenerateContent = jest.fn()
        .mockResolvedValueOnce('true')  // Product name mentioned
        .mockResolvedValueOnce('true')  // Discount code included
        .mockResolvedValueOnce('true'); // Benefits discussed

      (verificationAgent as any).generateContent = mockGenerateContent;

      const result = await verificationAgent.checkRequirements(content, requirements);

      expect(result).toEqual([true, true, true]);
      expect(mockGenerateContent).toHaveBeenCalledTimes(3);
    });

    it('should handle mixed requirement fulfillment', async () => {
      const content = 'Basic content without all requirements';
      const requirements = ['Requirement 1', 'Requirement 2', 'Requirement 3'];

      const mockGenerateContent = jest.fn()
        .mockResolvedValueOnce('true')
        .mockResolvedValueOnce('false')
        .mockResolvedValueOnce('true');

      (verificationAgent as any).generateContent = mockGenerateContent;

      const result = await verificationAgent.checkRequirements(content, requirements);

      expect(result).toEqual([true, false, true]);
    });

    it('should use fallback requirement check when AI fails', async () => {
      const content = 'Content with AI Code Assistant Pro and PODCAST20 discount code';
      const requirements = ['Mention AI Code Assistant Pro', 'Include PODCAST20'];

      const mockGenerateContent = jest.fn().mockRejectedValue(new Error('AI service error'));
      (verificationAgent as any).generateContent = mockGenerateContent;

      const result = await verificationAgent.checkRequirements(content, requirements);

      expect(result).toHaveLength(2);
      expect(result[0]).toBe(true); // Should find "AI Code Assistant Pro"
      expect(result[1]).toBe(true); // Should find "PODCAST20"
    });
  });

  describe('scoreNaturalness', () => {
    it('should score naturalness of ad integration', async () => {
      const content = `
        Alex: Speaking of development tools, I've been trying out this new AI assistant.
        Sam: Oh really? What's it like?
        Alex: It's called AI Code Assistant Pro, and it's been really helpful.
      `;

      const podcastStyle = 'Conversational and technical';

      const mockGenerateContent = jest.fn().mockResolvedValue('0.85');
      (verificationAgent as any).generateContent = mockGenerateContent;

      const result = await verificationAgent.scoreNaturalness(content, podcastStyle);

      expect(result).toBe(0.85);
      expect(mockGenerateContent).toHaveBeenCalledWith(expect.stringContaining('naturalness'));
    });

    it('should use fallback naturalness calculation when AI fails', async () => {
      const content = 'Content with [AD START] natural transition speaking of tools [AD END]';
      const podcastStyle = 'Conversational';

      const mockGenerateContent = jest.fn().mockRejectedValue(new Error('AI service error'));
      (verificationAgent as any).generateContent = mockGenerateContent;

      const result = await verificationAgent.scoreNaturalness(content, podcastStyle);

      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThanOrEqual(1);
    });

    it('should handle invalid naturalness score from AI', async () => {
      const content = 'Test content';
      const podcastStyle = 'Test style';

      const mockGenerateContent = jest.fn().mockResolvedValue('invalid_score');
      (verificationAgent as any).generateContent = mockGenerateContent;

      const result = await verificationAgent.scoreNaturalness(content, podcastStyle);

      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(1);
    });
  });

  describe('private helper methods', () => {
    it('should validate quality score structure', () => {
      const validScore: QualityScore = {
        overall: 0.8,
        naturalness: 0.9,
        relevance: 0.7,
        engagement: 0.8,
        compliance: 0.9,
        breakdown: {}
      };

      const isValid = (verificationAgent as any).isValidQualityScore(validScore);
      expect(isValid).toBe(true);
    });

    it('should reject invalid quality score structure', () => {
      const invalidScore = {
        overall: 1.5, // Invalid: > 1
        naturalness: 0.9,
        relevance: 0.7
        // Missing required fields
      };

      const isValid = (verificationAgent as any).isValidQualityScore(invalidScore);
      expect(isValid).toBe(false);
    });

    it('should generate appropriate feedback', () => {
      const qualityScore: QualityScore = {
        overall: 0.6,
        naturalness: 0.5,
        relevance: 0.7,
        engagement: 0.6,
        compliance: 0.8,
        breakdown: {}
      };

      const complianceResult: ComplianceResult = {
        compliant: true,
        violations: [],
        severity: 'low',
        suggestions: []
      };

      const requirementsMet = [true, false, true];

      const feedback = (verificationAgent as any).generateFeedback(
        qualityScore, 
        complianceResult, 
        requirementsMet
      );

      expect(feedback.length).toBeGreaterThan(0);
      expect(feedback.some(f => f.includes('naturalness'))).toBe(true);
      expect(feedback.some(f => f.includes('requirements'))).toBe(true);
    });

    it('should generate improvement suggestions', () => {
      const qualityScore: QualityScore = {
        overall: 0.6,
        naturalness: 0.5,
        relevance: 0.6,
        engagement: 0.5,
        compliance: 0.8,
        breakdown: {
          flow_disruption: 0.4,
          message_clarity: 0.6
        }
      };

      const complianceResult: ComplianceResult = {
        compliant: false,
        violations: ['Missing disclosure'],
        severity: 'medium',
        suggestions: ['Add sponsor disclosure']
      };

      const suggestions = (verificationAgent as any).generateImprovementSuggestions(
        qualityScore, 
        complianceResult
      );

      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some(s => s.includes('transitions'))).toBe(true);
      expect(suggestions.some(s => s.includes('disclosure'))).toBe(true);
    });

    it('should perform basic requirement check', () => {
      const content = 'This content mentions AI Code Assistant Pro and includes benefits';
      const requirement = 'Mention AI Code Assistant Pro product benefits';

      const result = (verificationAgent as any).basicRequirementCheck(content, requirement);
      expect(result).toBe(true);
    });

    it('should check for transition words', () => {
      const contentWithTransitions = 'Speaking of tools, by the way, this is great';
      const contentWithoutTransitions = 'This is just regular content';

      const hasTransitions1 = (verificationAgent as any).checkForTransitionWords(contentWithTransitions);
      const hasTransitions2 = (verificationAgent as any).checkForTransitionWords(contentWithoutTransitions);

      expect(hasTransitions1).toBe(true);
      expect(hasTransitions2).toBe(false);
    });

    it('should detect problematic content', () => {
      const problematicContent = 'This guaranteed miracle solution will work 100% effectively';
      const cleanContent = 'This helpful tool can improve your productivity';

      const hasProblems1 = (verificationAgent as any).hasProblematicContent(problematicContent);
      const hasProblems2 = (verificationAgent as any).hasProblematicContent(cleanContent);

      expect(hasProblems1).toBe(true);
      expect(hasProblems2).toBe(false);
    });

    it('should calculate fallback naturalness score', () => {
      const naturalContent = '[AD START] Speaking of tools, this is great [AD END]';
      const unnaturalContent = 'BUY NOW! LIMITED TIME! ORDER TODAY!';

      const score1 = (verificationAgent as any).calculateFallbackNaturalness(naturalContent);
      const score2 = (verificationAgent as any).calculateFallbackNaturalness(unnaturalContent);

      expect(score1).toBeGreaterThan(score2);
      expect(score1).toBeLessThanOrEqual(1);
      expect(score2).toBeGreaterThanOrEqual(0);
    });
  });
});