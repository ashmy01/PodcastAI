import { BaseAIService } from './base-ai-service';
import { getAIServiceConfig } from './config';
import { VerificationAgent } from './interfaces';
import { 
  VerificationResult, 
  QualityScore, 
  ComplianceResult 
} from './types';

export class AIVerificationAgent extends BaseAIService implements VerificationAgent {
  constructor() {
    super(getAIServiceConfig('verification'));
  }

  protected getServiceType(): 'verification' {
    return 'verification';
  }

  async verifyAdPlacement(episodeId: string, campaignId: string): Promise<VerificationResult> {
    try {
      // Fetch episode content and campaign requirements
      const episodeContent = await this.getEpisodeContent(episodeId);
      const campaignRequirements = await this.getCampaignRequirements(campaignId);
      
      // Perform comprehensive verification
      const qualityScore = await this.analyzeContentQuality(episodeContent, campaignRequirements);
      const complianceResult = await this.validateCompliance(episodeContent);
      const requirementsMet = await this.checkRequirements(episodeContent, campaignRequirements);
      
      const verified = qualityScore.overall >= 0.7 && 
                      complianceResult.compliant && 
                      requirementsMet.every(met => met);

      const result: VerificationResult = {
        verified,
        qualityScore: qualityScore.overall,
        complianceScore: complianceResult.compliant ? 1.0 : 0.5,
        requirementsMet,
        feedback: this.generateFeedback(qualityScore, complianceResult, requirementsMet),
        improvementSuggestions: this.generateImprovementSuggestions(qualityScore, complianceResult),
        timestamp: new Date()
      };

      return result;
    } catch (error) {
      console.error('Error verifying ad placement:', error);
      throw error;
    }
  }

  async analyzeContentQuality(content: string, requirements: string[]): Promise<QualityScore> {
    const prompt = `
    Analyze the quality of this podcast episode content with embedded advertising:

    CONTENT:
    ${content}

    REQUIREMENTS:
    ${requirements.join('\n')}

    Evaluate the content on these dimensions (score 0.0 to 1.0):

    1. NATURALNESS: How naturally the ad integrates with the content
    2. RELEVANCE: How relevant the ad is to the podcast topic and audience
    3. ENGAGEMENT: How engaging and interesting the ad content is
    4. COMPLIANCE: How well it follows advertising standards and guidelines
    5. REQUIREMENT FULFILLMENT: How well it meets the specified requirements

    Return a JSON response in this format:
    {
      "overall": 0.85,
      "naturalness": 0.9,
      "relevance": 0.8,
      "engagement": 0.85,
      "compliance": 0.9,
      "breakdown": {
        "ad_integration": 0.9,
        "character_consistency": 0.8,
        "flow_disruption": 0.1,
        "message_clarity": 0.9,
        "call_to_action": 0.8
      }
    }

    Consider:
    - Does the ad feel like a natural part of the conversation?
    - Are the characters staying true to their personalities?
    - Is the transition smooth before and after the ad?
    - Is the advertising message clear but not overly promotional?
    - Does it provide value to the listeners?
    `;

    try {
      const response = await this.generateContent(prompt);
      const parsed = JSON.parse(response);
      
      // Validate the response structure
      if (!this.isValidQualityScore(parsed)) {
        throw new Error('Invalid quality score response format');
      }
      
      return parsed;
    } catch (error) {
      console.error('Error analyzing content quality:', error);
      return this.generateFallbackQualityScore(content, requirements);
    }
  }

  async validateCompliance(content: string): Promise<ComplianceResult> {
    const prompt = `
    Analyze this podcast content for advertising compliance and safety:

    CONTENT:
    ${content}

    Check for compliance with:
    1. FTC advertising disclosure requirements
    2. Platform content policies
    3. Truthful and non-misleading claims
    4. Appropriate language and tone
    5. Respect for audience and inclusivity
    6. No spam or excessive promotion

    Return a JSON response:
    {
      "compliant": true/false,
      "violations": ["violation1", "violation2"],
      "severity": "low/medium/high",
      "suggestions": ["suggestion1", "suggestion2"]
    }

    Be thorough but fair in your assessment. Minor issues should be noted but not necessarily cause non-compliance.
    `;

    try {
      const response = await this.generateContent(prompt);
      return JSON.parse(response);
    } catch (error) {
      console.error('Error validating compliance:', error);
      return this.generateFallbackComplianceResult(content);
    }
  }

  async checkRequirements(content: string, requirements: string[]): Promise<boolean[]> {
    const results: boolean[] = [];
    
    for (const requirement of requirements) {
      const prompt = `
      Check if this specific requirement is met in the podcast content:

      REQUIREMENT: ${requirement}

      CONTENT:
      ${content}

      Analyze whether the requirement is fulfilled. Consider:
      - Is the requirement explicitly mentioned or addressed?
      - Is it integrated naturally into the content?
      - Does it meet the spirit of the requirement, not just the letter?

      Return only "true" or "false" based on whether the requirement is met.
      `;

      try {
        const response = await this.generateContent(prompt);
        const met = response.trim().toLowerCase() === 'true';
        results.push(met);
      } catch (error) {
        console.error(`Error checking requirement "${requirement}":`, error);
        // Fallback: basic text search
        results.push(this.basicRequirementCheck(content, requirement));
      }
    }

    return results;
  }

  async scoreNaturalness(content: string, podcastStyle: string): Promise<number> {
    const prompt = `
    Score how naturally the advertising content integrates with this podcast's style:

    PODCAST STYLE: ${podcastStyle}

    CONTENT:
    ${content}

    Evaluate naturalness based on:
    1. Conversation flow and transitions
    2. Character voice consistency
    3. Tone matching
    4. Organic integration vs. forced insertion
    5. Listener experience disruption

    Return only a decimal score between 0.0 and 1.0, where:
    - 1.0 = Perfectly natural, seamless integration
    - 0.8 = Very natural with minor transitions
    - 0.6 = Mostly natural with some noticeable ad moments
    - 0.4 = Somewhat forced but acceptable
    - 0.2 = Obviously inserted, disrupts flow
    - 0.0 = Completely unnatural, jarring experience
    `;

    try {
      const response = await this.generateContent(prompt);
      const score = parseFloat(response.trim());
      
      if (isNaN(score) || score < 0 || score > 1) {
        console.warn('Invalid naturalness score, using fallback');
        return this.calculateFallbackNaturalness(content);
      }
      
      return score;
    } catch (error) {
      console.error('Error scoring naturalness:', error);
      return this.calculateFallbackNaturalness(content);
    }
  }

  private generateFeedback(
    qualityScore: QualityScore, 
    complianceResult: ComplianceResult, 
    requirementsMet: boolean[]
  ): string[] {
    const feedback: string[] = [];

    // Quality feedback
    if (qualityScore.overall >= 0.8) {
      feedback.push('Excellent overall quality with natural ad integration');
    } else if (qualityScore.overall >= 0.6) {
      feedback.push('Good quality with room for improvement in naturalness');
    } else {
      feedback.push('Quality needs improvement - ad integration feels forced');
    }

    // Naturalness feedback
    if (qualityScore.naturalness < 0.6) {
      feedback.push('Ad transitions could be smoother and more natural');
    }

    // Relevance feedback
    if (qualityScore.relevance < 0.6) {
      feedback.push('Ad content could be more relevant to the podcast topic');
    }

    // Engagement feedback
    if (qualityScore.engagement < 0.6) {
      feedback.push('Ad content could be more engaging for the audience');
    }

    // Compliance feedback
    if (!complianceResult.compliant) {
      feedback.push(`Compliance issues detected: ${complianceResult.violations.join(', ')}`);
    }

    // Requirements feedback
    const unmetRequirements = requirementsMet.filter(met => !met).length;
    if (unmetRequirements > 0) {
      feedback.push(`${unmetRequirements} campaign requirements not fully met`);
    }

    return feedback;
  }

  private generateImprovementSuggestions(
    qualityScore: QualityScore, 
    complianceResult: ComplianceResult
  ): string[] {
    const suggestions: string[] = [];

    // Quality-based suggestions
    if (qualityScore.naturalness < 0.7) {
      suggestions.push('Improve ad transitions with more natural conversation bridges');
      suggestions.push('Ensure character personalities remain consistent during ad segments');
    }

    if (qualityScore.relevance < 0.7) {
      suggestions.push('Better align ad content with podcast topics and audience interests');
      suggestions.push('Use more contextual examples that relate to the episode theme');
    }

    if (qualityScore.engagement < 0.7) {
      suggestions.push('Make ad content more conversational and less promotional');
      suggestions.push('Include personal experiences or stories to increase engagement');
    }

    // Compliance-based suggestions
    if (complianceResult.suggestions.length > 0) {
      suggestions.push(...complianceResult.suggestions);
    }

    // Breakdown-based suggestions
    if (qualityScore.breakdown?.flow_disruption > 0.3) {
      suggestions.push('Reduce flow disruption by improving pre and post-ad transitions');
    }

    if (qualityScore.breakdown?.message_clarity < 0.7) {
      suggestions.push('Clarify the advertising message while maintaining naturalness');
    }

    return suggestions;
  }

  private isValidQualityScore(score: any): score is QualityScore {
    return (
      typeof score === 'object' &&
      typeof score.overall === 'number' &&
      typeof score.naturalness === 'number' &&
      typeof score.relevance === 'number' &&
      typeof score.engagement === 'number' &&
      typeof score.compliance === 'number' &&
      score.overall >= 0 && score.overall <= 1 &&
      score.naturalness >= 0 && score.naturalness <= 1 &&
      score.relevance >= 0 && score.relevance <= 1 &&
      score.engagement >= 0 && score.engagement <= 1 &&
      score.compliance >= 0 && score.compliance <= 1
    );
  }

  private generateFallbackQualityScore(content: string, requirements: string[]): QualityScore {
    // Basic quality assessment based on content analysis
    const contentLength = content.length;
    const hasAdMarkers = content.includes('[AD START]') && content.includes('[AD END]');
    const hasNaturalTransitions = this.checkForTransitionWords(content);
    const meetsBasicRequirements = this.basicRequirementsCheck(content, requirements);

    let naturalness = 0.5;
    if (hasAdMarkers && hasNaturalTransitions) naturalness = 0.7;
    if (!hasAdMarkers) naturalness = 0.3;

    let relevance = 0.5;
    if (meetsBasicRequirements > 0.7) relevance = 0.7;

    let engagement = 0.5;
    if (contentLength > 100 && contentLength < 500) engagement = 0.6;

    let compliance = 0.7; // Default to compliant unless obvious issues
    if (this.hasProblematicContent(content)) compliance = 0.3;

    const overall = (naturalness + relevance + engagement + compliance) / 4;

    return {
      overall,
      naturalness,
      relevance,
      engagement,
      compliance,
      breakdown: {
        ad_integration: naturalness,
        character_consistency: 0.6,
        flow_disruption: 1 - naturalness,
        message_clarity: engagement,
        call_to_action: relevance
      }
    };
  }

  private generateFallbackComplianceResult(content: string): ComplianceResult {
    const violations: string[] = [];
    const suggestions: string[] = [];

    // Check for common compliance issues
    const lowerContent = content.toLowerCase();
    
    // Check for misleading claims
    const misleadingWords = ['guaranteed', 'miracle', 'instant results', 'get rich quick'];
    for (const word of misleadingWords) {
      if (lowerContent.includes(word)) {
        violations.push(`Potentially misleading claim: "${word}"`);
        suggestions.push(`Consider rephrasing claims about "${word}" to be more accurate`);
      }
    }

    // Check for disclosure
    const hasDisclosure = lowerContent.includes('sponsor') || 
                         lowerContent.includes('advertisement') || 
                         lowerContent.includes('ad') ||
                         lowerContent.includes('partner');
    
    if (!hasDisclosure) {
      violations.push('Missing advertising disclosure');
      suggestions.push('Add clear disclosure that this is sponsored content');
    }

    // Check for excessive promotion
    if (content.length > 1000) {
      violations.push('Content may be too promotional');
      suggestions.push('Consider shortening promotional content');
    }

    return {
      compliant: violations.length === 0,
      violations,
      severity: violations.length > 2 ? 'high' : violations.length > 0 ? 'medium' : 'low',
      suggestions
    };
  }

  private basicRequirementCheck(content: string, requirement: string): boolean {
    const lowerContent = content.toLowerCase();
    const lowerRequirement = requirement.toLowerCase();
    
    // Extract key terms from requirement
    const keyTerms = lowerRequirement.split(/\s+/).filter(term => 
      term.length > 3 && !['the', 'and', 'for', 'with', 'that', 'this'].includes(term)
    );
    
    // Check if most key terms are present
    const foundTerms = keyTerms.filter(term => lowerContent.includes(term));
    return foundTerms.length / keyTerms.length >= 0.6;
  }

  private basicRequirementsCheck(content: string, requirements: string[]): number {
    if (requirements.length === 0) return 1;
    
    const metCount = requirements.filter(req => 
      this.basicRequirementCheck(content, req)
    ).length;
    
    return metCount / requirements.length;
  }

  private checkForTransitionWords(content: string): boolean {
    const transitionWords = [
      'speaking of', 'by the way', 'actually', 'you know', 'also',
      'meanwhile', 'before we continue', 'quick note', 'while we\'re on'
    ];
    
    const lowerContent = content.toLowerCase();
    return transitionWords.some(word => lowerContent.includes(word));
  }

  private hasProblematicContent(content: string): boolean {
    const problematicPatterns = [
      /guaranteed/i,
      /miracle/i,
      /instant.*money/i,
      /get.*rich.*quick/i,
      /100%.*effective/i
    ];
    
    return problematicPatterns.some(pattern => pattern.test(content));
  }

  private calculateFallbackNaturalness(content: string): number {
    let score = 0.5; // Base score
    
    // Check for ad markers (indicates structured integration)
    if (content.includes('[AD START]') && content.includes('[AD END]')) {
      score += 0.1;
    }
    
    // Check for transition words
    if (this.checkForTransitionWords(content)) {
      score += 0.2;
    }
    
    // Check for conversational elements
    if (content.includes(':') && content.includes('?')) {
      score += 0.1; // Has dialogue and questions
    }
    
    // Penalize if too promotional
    const promotionalWords = ['buy', 'purchase', 'order now', 'limited time'];
    const promotionalCount = promotionalWords.filter(word => 
      content.toLowerCase().includes(word)
    ).length;
    
    if (promotionalCount > 2) {
      score -= 0.2;
    }
    
    return Math.max(0, Math.min(1, score));
  }

  // Database integration methods
  private async getEpisodeContent(episodeId: string): Promise<string> {
    const { AIDatabaseService } = await import('./database-service');
    const dbService = new AIDatabaseService();
    return dbService.getEpisodeContent(episodeId);
  }

  private async getCampaignRequirements(campaignId: string): Promise<string[]> {
    const { AIDatabaseService } = await import('./database-service');
    const dbService = new AIDatabaseService();
    return dbService.getCampaignRequirements(campaignId);
  }
}