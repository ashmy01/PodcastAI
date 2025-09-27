import { BaseAIService } from './base-ai-service';
import { getAIServiceConfig } from './config';
import { 
  MatchingAgent, 
  CampaignAnalysis, 
  PodcastProfile 
} from './interfaces';
import { 
  Campaign, 
  PodcastAI, 
  PodcastMatch, 
  MatchingFeedback 
} from './types';

export class AIMatchingAgent extends BaseAIService implements MatchingAgent {
  constructor() {
    super(getAIServiceConfig('matching'));
  }

  protected getServiceType(): 'matching' {
    return 'matching';
  }

  async findMatches(campaignId: string): Promise<PodcastMatch[]> {
    try {
      // This would typically fetch from database
      const campaign = await this.getCampaignById(campaignId);
      const podcasts = await this.getEligiblePodcasts(campaign);
      
      const matches: PodcastMatch[] = [];
      
      for (const podcast of podcasts) {
        const compatibilityScore = await this.scoreCompatibility(campaign, podcast);
        
        if (compatibilityScore >= 0.5) { // Minimum threshold
          const match: PodcastMatch = {
            podcastId: podcast.id,
            compatibilityScore,
            estimatedReach: this.estimateReach(podcast),
            suggestedBudgetAllocation: this.calculateBudgetAllocation(campaign, podcast, compatibilityScore),
            matchingReasons: await this.generateMatchingReasons(campaign, podcast, compatibilityScore),
            confidence: this.calculateConfidence(compatibilityScore, podcast)
          };
          
          matches.push(match);
        }
      }
      
      // Sort by compatibility score and return top matches
      return matches
        .sort((a, b) => b.compatibilityScore - a.compatibilityScore)
        .slice(0, 10);
        
    } catch (error) {
      console.error('Error finding matches:', error);
      throw error;
    }
  }

  async scoreCompatibility(campaign: Campaign, podcast: PodcastAI): Promise<number> {
    const prompt = `
    Analyze the compatibility between this brand campaign and podcast for advertising placement.
    
    CAMPAIGN:
    - Brand: ${campaign.brandName}
    - Product: ${campaign.productName}
    - Category: ${campaign.category}
    - Target Audience: ${campaign.targetAudience.join(', ')}
    - Description: ${campaign.description}
    - Requirements: ${campaign.requirements.join(', ')}
    
    PODCAST:
    - Title: ${podcast.title}
    - Description: ${podcast.description}
    - Tone: ${podcast.tone}
    - Topics: ${podcast.topics.join(', ')}
    - Content Themes: ${podcast.contentThemes?.join(', ') || 'Not specified'}
    - Audience Profile: ${JSON.stringify(podcast.audienceProfile)}
    - Quality Score: ${podcast.qualityScore}
    
    Evaluate compatibility based on:
    1. Audience alignment (40%)
    2. Content relevance (30%)
    3. Brand-podcast fit (20%)
    4. Quality and engagement (10%)
    
    Return ONLY a decimal score between 0.0 and 1.0, where:
    - 0.9-1.0: Perfect match
    - 0.7-0.8: Very good match
    - 0.5-0.6: Good match
    - 0.3-0.4: Fair match
    - 0.0-0.2: Poor match
    `;

    try {
      const response = await this.generateContent(prompt);
      const score = parseFloat(response.trim());
      
      if (isNaN(score) || score < 0 || score > 1) {
        console.warn('Invalid compatibility score, using fallback calculation');
        return this.calculateFallbackCompatibility(campaign, podcast);
      }
      
      return score;
    } catch (error) {
      console.error('Error scoring compatibility:', error);
      return this.calculateFallbackCompatibility(campaign, podcast);
    }
  }

  async updateMatchingModel(feedbackData: MatchingFeedback[]): Promise<void> {
    // In a production system, this would update the AI model with feedback
    console.log(`Updating matching model with ${feedbackData.length} feedback entries`);
    
    // For now, we'll log the feedback for analysis
    const avgPerformance = feedbackData.reduce((sum, feedback) => 
      sum + (feedback.actualPerformance / feedback.expectedPerformance), 0) / feedbackData.length;
    
    console.log(`Average performance ratio: ${avgPerformance}`);
    
    // Store feedback for future model training
    await this.storeFeedbackData(feedbackData);
  }

  async analyzeCampaign(campaign: Campaign): Promise<CampaignAnalysis> {
    const prompt = `
    Analyze this brand campaign for podcast advertising matching:
    
    CAMPAIGN DETAILS:
    - Brand: ${campaign.brandName}
    - Product: ${campaign.productName}
    - Category: ${campaign.category}
    - Target Audience: ${campaign.targetAudience.join(', ')}
    - Description: ${campaign.description}
    - Budget: ${campaign.budget} ${campaign.currency}
    - Requirements: ${campaign.requirements.join(', ')}
    
    Provide analysis in this JSON format:
    {
      "keyFeatures": ["feature1", "feature2", "feature3"],
      "targetDemographics": ["demo1", "demo2"],
      "contentRequirements": ["req1", "req2"],
      "budgetEfficiency": 0.8,
      "competitiveAnalysis": ["insight1", "insight2"]
    }
    
    Focus on:
    1. Key product features that should be highlighted
    2. Primary target demographics
    3. Content requirements for effective promotion
    4. Budget efficiency score (0-1)
    5. Competitive landscape insights
    `;

    try {
      const response = await this.generateContent(prompt);
      return JSON.parse(response);
    } catch (error) {
      console.error('Error analyzing campaign:', error);
      return this.generateFallbackCampaignAnalysis(campaign);
    }
  }

  async profilePodcast(podcast: PodcastAI): Promise<PodcastProfile> {
    const prompt = `
    Create a detailed profile for this podcast for advertising matching:
    
    PODCAST DETAILS:
    - Title: ${podcast.title}
    - Description: ${podcast.description}
    - Concept: ${podcast.concept}
    - Tone: ${podcast.tone}
    - Topics: ${podcast.topics.join(', ')}
    - Characters: ${podcast.characters.map(c => `${c.name} (${c.personality})`).join(', ')}
    - Quality Score: ${podcast.qualityScore}
    - Average Engagement: ${podcast.averageEngagement}
    - Total Views: ${podcast.totalViews}
    
    Provide analysis in this JSON format:
    {
      "contentThemes": ["theme1", "theme2", "theme3"],
      "audienceDemographics": ["demo1", "demo2"],
      "engagementMetrics": {
        "averageViews": 1000,
        "completionRate": 0.8,
        "interactionRate": 0.3
      },
      "monetizationReadiness": 0.7,
      "brandCompatibility": ["category1", "category2"]
    }
    
    Analyze:
    1. Main content themes and topics
    2. Likely audience demographics
    3. Engagement performance metrics
    4. Readiness for monetization (0-1)
    5. Compatible brand categories
    `;

    try {
      const response = await this.generateContent(prompt);
      return JSON.parse(response);
    } catch (error) {
      console.error('Error profiling podcast:', error);
      return this.generateFallbackPodcastProfile(podcast);
    }
  }

  private calculateFallbackCompatibility(campaign: Campaign, podcast: PodcastAI): number {
    let score = 0;
    
    // Audience alignment (40%)
    const audienceMatch = this.calculateAudienceAlignment(campaign, podcast);
    score += audienceMatch * 0.4;
    
    // Content relevance (30%)
    const contentMatch = this.calculateContentRelevance(campaign, podcast);
    score += contentMatch * 0.3;
    
    // Brand-podcast fit (20%)
    const brandFit = this.calculateBrandFit(campaign, podcast);
    score += brandFit * 0.2;
    
    // Quality and engagement (10%)
    const qualityScore = podcast.qualityScore * podcast.averageEngagement;
    score += qualityScore * 0.1;
    
    return Math.min(Math.max(score, 0), 1);
  }

  private calculateAudienceAlignment(campaign: Campaign, podcast: PodcastAI): number {
    // Simple keyword matching for audience alignment
    const campaignAudience = campaign.targetAudience.join(' ').toLowerCase();
    const podcastTopics = podcast.topics.join(' ').toLowerCase();
    const podcastDescription = podcast.description.toLowerCase();
    
    let matches = 0;
    const audienceKeywords = campaignAudience.split(' ');
    
    for (const keyword of audienceKeywords) {
      if (podcastTopics.includes(keyword) || podcastDescription.includes(keyword)) {
        matches++;
      }
    }
    
    return Math.min(matches / audienceKeywords.length, 1);
  }

  private calculateContentRelevance(campaign: Campaign, podcast: PodcastAI): number {
    // Check category alignment
    const categoryMatch = podcast.topics.some(topic => 
      topic.toLowerCase().includes(campaign.category.toLowerCase()) ||
      campaign.category.toLowerCase().includes(topic.toLowerCase())
    ) ? 0.5 : 0;
    
    // Check description relevance
    const descriptionMatch = this.calculateTextSimilarity(
      campaign.description.toLowerCase(),
      podcast.description.toLowerCase()
    );
    
    return Math.min(categoryMatch + descriptionMatch, 1);
  }

  private calculateBrandFit(campaign: Campaign, podcast: PodcastAI): number {
    // Check if brand is blocked
    if (podcast.adPreferences?.blockedBrands?.includes(campaign.brandName)) {
      return 0;
    }
    
    // Check if category is allowed
    if (podcast.adPreferences?.allowedCategories?.length > 0) {
      return podcast.adPreferences.allowedCategories.includes(campaign.category) ? 1 : 0.2;
    }
    
    // Default fit based on tone and content
    const toneCompatibility = this.calculateToneCompatibility(campaign, podcast);
    return toneCompatibility;
  }

  private calculateToneCompatibility(campaign: Campaign, podcast: PodcastAI): number {
    // Simple tone matching logic
    const professionalTones = ['professional', 'educational', 'informative'];
    const casualTones = ['casual', 'conversational', 'friendly'];
    const entertainingTones = ['entertaining', 'humorous', 'fun'];
    
    const podcastTone = podcast.tone.toLowerCase();
    
    // Tech/business products fit better with professional tones
    if (['technology', 'finance', 'education'].includes(campaign.category.toLowerCase())) {
      return professionalTones.some(tone => podcastTone.includes(tone)) ? 0.8 : 0.4;
    }
    
    // Consumer products fit better with casual/entertaining tones
    if (['lifestyle', 'entertainment', 'food'].includes(campaign.category.toLowerCase())) {
      return [...casualTones, ...entertainingTones].some(tone => podcastTone.includes(tone)) ? 0.8 : 0.4;
    }
    
    return 0.6; // Default compatibility
  }

  private calculateTextSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.split(' ').filter(word => word.length > 3));
    const words2 = new Set(text2.split(' ').filter(word => word.length > 3));
    
    const intersection = new Set([...words1].filter(word => words2.has(word)));
    const union = new Set([...words1, ...words2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  private estimateReach(podcast: PodcastAI): number {
    // Estimate based on total views and engagement
    const baseReach = podcast.totalViews || 100;
    const engagementMultiplier = 1 + (podcast.averageEngagement || 0);
    return Math.floor(baseReach * engagementMultiplier);
  }

  private calculateBudgetAllocation(campaign: Campaign, podcast: PodcastAI, compatibilityScore: number): number {
    const baseAllocation = campaign.budget * 0.1; // 10% base allocation
    const scoreMultiplier = compatibilityScore;
    const reachMultiplier = Math.min(this.estimateReach(podcast) / 1000, 2); // Cap at 2x
    
    return Math.min(baseAllocation * scoreMultiplier * reachMultiplier, campaign.budget * 0.3);
  }

  private async generateMatchingReasons(campaign: Campaign, podcast: PodcastAI, score: number): Promise<string[]> {
    const reasons: string[] = [];
    
    if (score > 0.8) {
      reasons.push('Excellent audience alignment');
      reasons.push('High content relevance');
    } else if (score > 0.6) {
      reasons.push('Good audience match');
      reasons.push('Relevant content themes');
    } else {
      reasons.push('Potential audience overlap');
      reasons.push('Compatible content style');
    }
    
    if (podcast.qualityScore > 0.7) {
      reasons.push('High-quality content');
    }
    
    if (podcast.averageEngagement > 0.6) {
      reasons.push('Strong audience engagement');
    }
    
    return reasons;
  }

  private calculateConfidence(compatibilityScore: number, podcast: PodcastAI): number {
    let confidence = compatibilityScore;
    
    // Adjust based on data quality
    if (podcast.totalViews > 1000) confidence += 0.1;
    if (podcast.qualityScore > 0.7) confidence += 0.1;
    if (podcast.audienceProfile?.engagement?.completionRate > 0.7) confidence += 0.1;
    
    return Math.min(confidence, 1);
  }

  private generateFallbackCampaignAnalysis(campaign: Campaign): CampaignAnalysis {
    return {
      keyFeatures: [campaign.productName, campaign.category],
      targetDemographics: campaign.targetAudience,
      contentRequirements: campaign.requirements,
      budgetEfficiency: 0.6,
      competitiveAnalysis: [`${campaign.category} market analysis needed`]
    };
  }

  private generateFallbackPodcastProfile(podcast: PodcastAI): PodcastProfile {
    return {
      contentThemes: podcast.topics,
      audienceDemographics: ['General audience'],
      engagementMetrics: {
        averageViews: podcast.totalViews || 100,
        completionRate: podcast.audienceProfile?.engagement?.completionRate || 0.5,
        interactionRate: podcast.averageEngagement || 0.3
      },
      monetizationReadiness: podcast.qualityScore || 0.5,
      brandCompatibility: [podcast.topics[0] || 'General']
    };
  }

  private async storeFeedbackData(feedbackData: MatchingFeedback[]): Promise<void> {
    // In production, store in database for model training
    console.log('Storing feedback data for future model improvements');
  }

  private async getCampaignById(campaignId: string): Promise<Campaign> {
    const { AIDatabaseService } = await import('./database-service');
    const dbService = new AIDatabaseService();
    const campaign = await dbService.getCampaignById(campaignId);
    if (!campaign) {
      throw new Error(`Campaign not found: ${campaignId}`);
    }
    return campaign;
  }

  private async getEligiblePodcasts(campaign: Campaign): Promise<PodcastAI[]> {
    const { AIDatabaseService } = await import('./database-service');
    const dbService = new AIDatabaseService();
    return dbService.getEligiblePodcasts(campaign);
  }
}