import { generateAudio, generate } from "./generate";
import { Episode } from './models/Episode';
import { IPodcast } from "./models/Podcast";
import { Campaign } from './models/Campaign';
import { AdPlacement } from './models/AdPlacement';
import { parseUntilJson } from "./parseUntilJson";
import { AIMatchingAgent } from './ai/matching-agent';
import { AIContentGenerationAgent } from './ai/content-generation-agent';
import { AIVerificationAgent } from './ai/verification-agent';
import { validateAIConfig } from './ai/config';
import { PodcastAI, Campaign as ICampaign, AdContent } from './ai/types';

interface PipelineOptions {
  enableAIAds?: boolean;
  maxAdsPerEpisode?: number;
  skipVerification?: boolean;
}

interface GeneratedEpisodeResult {
  episode: any;
  adPlacements: any[];
  matchedCampaigns: ICampaign[];
}

function parseGeneratedScript(script: string): { summary: string, script: string, title: string, characters: any[] } {
    try {
        const parsed = parseUntilJson(script);
        return {
            summary: parsed.summary || '',
            script: parsed.script || '',
            title: parsed.title || 'Untitled Episode',
            characters: parsed.characters || [],
        };
    } catch (error) {
        console.error("Failed to parse generated script:", error);
        // Fallback for non-JSON script
        return {
            summary: "A new episode.",
            script: script,
            title: "Untitled Episode",
            characters: [],
        };
    }
}

export class AIEnhancedPipeline {
  private matchingAgent: AIMatchingAgent;
  private contentAgent: AIContentGenerationAgent;
  private verificationAgent: AIVerificationAgent;

  constructor() {
    validateAIConfig();
    this.matchingAgent = new AIMatchingAgent();
    this.contentAgent = new AIContentGenerationAgent();
    this.verificationAgent = new AIVerificationAgent();
  }

  async runPipeline(podcast: IPodcast, options: PipelineOptions = {}): Promise<GeneratedEpisodeResult> {
    const {
      enableAIAds = true,
      maxAdsPerEpisode = 2,
      skipVerification = false
    } = options;

    console.log(`Generating AI-enhanced episode for: ${podcast.title}`);

    try {
      // Step 1: Generate base episode content
      const baseEpisode = await this.generateBaseEpisode(podcast);
      
      // Step 2: Find and match campaigns (if AI ads enabled)
      let matchedCampaigns: ICampaign[] = [];
      let adPlacements: any[] = [];
      
      if (enableAIAds && podcast.monetizationEnabled) {
        matchedCampaigns = await this.findMatchingCampaigns(podcast, maxAdsPerEpisode);
        
        if (matchedCampaigns.length > 0) {
          // Step 3: Generate and embed ads
          const { enhancedScript, placements } = await this.generateAndEmbedAds(
            baseEpisode.script,
            podcast,
            matchedCampaigns
          );
          
          baseEpisode.script = enhancedScript;
          adPlacements = placements;
          
          // Step 4: Verify ad placements (if not skipped)
          if (!skipVerification) {
            await this.verifyAdPlacements(adPlacements);
          }
        }
      }
      
      // Step 5: Generate audio with embedded ads
      const audioId = await generateAudio(
        baseEpisode.script, 
        podcast.characters.map(c => ({ name: c.name, voice: c.voice }))
      );
      const audioUrl = `/audio/${audioId}.wav`;

      // Step 6: Save episode and ad placements
      const savedEpisode = await this.saveEpisodeWithAds(
        podcast,
        baseEpisode,
        audioUrl,
        adPlacements
      );

      console.log(`AI-enhanced episode "${savedEpisode.title}" generated with ${adPlacements.length} ad placements`);

      return {
        episode: savedEpisode,
        adPlacements,
        matchedCampaigns
      };

    } catch (error) {
      console.error('Error in AI-enhanced pipeline:', error);
      
      // Fallback to basic pipeline without ads
      console.log('Falling back to basic episode generation...');
      const fallbackEpisode = await this.generateBasicEpisode(podcast);
      
      return {
        episode: fallbackEpisode,
        adPlacements: [],
        matchedCampaigns: []
      };
    }
  }

  private async generateBaseEpisode(podcast: IPodcast) {
    const previousEpisodes = await Episode.find({ podcast: podcast._id })
      .sort({ createdAt: -1 })
      .limit(5);

    const history = previousEpisodes.map(ep => ({
      title: ep.title,
      summary: ep.summary,
    }));

    const prompt = `
      You are an AI podcast script generator.
      Podcast Title: ${podcast.title}
      Podcast Concept: ${podcast.concept}
      Tone: ${podcast.tone}
      Topics: ${podcast.topics.join(', ')}

      Characters:
      ${podcast.characters.map(c => `- ${c.name}: ${c.personality} (Voice: ${c.voice})`).join('\n')}

      Previous Episodes (for context, avoid repetition):
      ${history.length > 0 ? history.map(h => `- ${h.title}: ${h.summary}`).join('\n') : 'None'}

      Please generate a new podcast script of approximately ${podcast.length} length.
      The script should be engaging and maintain consistent character personalities.
      
      IMPORTANT: Leave natural conversation breaks where advertisements could be seamlessly integrated.
      Use transition phrases like "speaking of...", "by the way...", "that reminds me..." to create ad-friendly moments.
      
      Output the result as a single JSON object with the following fields:
      - "summary": A brief, one-sentence summary of the episode.
      - "title": A catchy title for this episode.
      - "script": The full script in the format:
          <CHARACTER_NAME>: <DIALOGUE>
          <CHARACTER_NAME>: <DIALOGUE>
      - "characters": An array of objects with "name" and "voice" for each character in the script.
    `;

    const generatedJson = await generate(prompt);
    return parseGeneratedScript(generatedJson);
  }

  private async findMatchingCampaigns(podcast: IPodcast, maxAds: number): Promise<ICampaign[]> {
    try {
      // Convert podcast to AI format
      const aiPodcast = this.convertToAIPodcast(podcast);
      
      // Get active campaigns from database
      const activeCampaigns = await Campaign.find({ 
        status: 'active',
        aiMatchingEnabled: true,
        $expr: { $gt: [{ $subtract: ['$budget', '$totalSpent'] }, '$payoutPerView'] } // Has remaining budget
      }).limit(20); // Limit for performance

      const matchedCampaigns: ICampaign[] = [];

      for (const campaign of activeCampaigns) {
        if (matchedCampaigns.length >= maxAds) break;

        // Check if podcast can accept this campaign
        if (!podcast.canAcceptAd || !podcast.canAcceptAd(campaign.category, campaign.brandName)) {
          continue;
        }

        try {
          // Use AI matching to score compatibility
          const compatibilityScore = await this.matchingAgent.scoreCompatibility(
            this.convertToCampaignType(campaign),
            aiPodcast
          );

          if (compatibilityScore >= 0.5) { // Minimum threshold
            matchedCampaigns.push(this.convertToCampaignType(campaign));
            console.log(`Matched campaign ${campaign.brandName} with score ${compatibilityScore.toFixed(2)}`);
          }
        } catch (matchError) {
          console.error(`Error scoring compatibility for campaign ${campaign._id}:`, matchError);
          // Continue with other campaigns
        }
      }

      console.log(`Found ${matchedCampaigns.length} matching campaigns for ${podcast.title}`);
      return matchedCampaigns;

    } catch (error) {
      console.error('Error finding matching campaigns:', error);
      return [];
    }
  }

  private async generateAndEmbedAds(
    baseScript: string,
    podcast: IPodcast,
    campaigns: ICampaign[]
  ): Promise<{ enhancedScript: string; placements: any[] }> {
    let enhancedScript = baseScript;
    const placements: any[] = [];

    const aiPodcast = this.convertToAIPodcast(podcast);

    for (const campaign of campaigns) {
      try {
        // Generate ad content
        const adContent = await this.contentAgent.generateAdContent(aiPodcast, campaign);
        
        // Embed ad in script
        enhancedScript = await this.contentAgent.embedAdInScript(enhancedScript, adContent);
        
        // Create ad placement record
        const placement = {
          campaignId: campaign.id,
          podcastId: podcast._id.toString(),
          episodeId: '', // Will be set after episode is saved
          adContent,
          status: 'pending',
          generationModel: 'gemini-1.5-flash',
          qualityScore: 0,
          userFeedback: []
        };

        placements.push(placement);
        
        console.log(`Generated and embedded ad for campaign: ${campaign.brandName}`);

      } catch (error) {
        console.error(`Error generating ad for campaign ${campaign.id}:`, error);
        // Continue with other campaigns
      }
    }

    return { enhancedScript, placements };
  }

  private async verifyAdPlacements(placements: any[]): Promise<void> {
    for (const placement of placements) {
      try {
        // For now, we'll do basic verification since we don't have episode ID yet
        const complianceResult = await this.contentAgent.validateContentCompliance(
          placement.adContent.script
        );

        if (complianceResult.compliant) {
          placement.status = 'verified';
          placement.qualityScore = 0.8; // Default good score for compliant content
        } else {
          placement.status = 'rejected';
          placement.qualityScore = 0.3;
          console.warn(`Ad placement rejected for campaign ${placement.campaignId}:`, complianceResult.violations);
        }

      } catch (error) {
        console.error(`Error verifying ad placement for campaign ${placement.campaignId}:`, error);
        placement.status = 'pending'; // Keep as pending if verification fails
      }
    }
  }

  private async saveEpisodeWithAds(
    podcast: IPodcast,
    episodeData: any,
    audioUrl: string,
    adPlacements: any[]
  ) {
    // Save episode first
    const newEpisode = new Episode({
      podcast: podcast._id,
      title: episodeData.title,
      summary: episodeData.summary,
      script: episodeData.script,
      audioUrl,
      owner: podcast.owner,
      hasAds: adPlacements.length > 0,
      adCount: adPlacements.length
    });

    await newEpisode.save();

    // Update ad placements with episode ID and save them
    for (const placementData of adPlacements) {
      placementData.episodeId = newEpisode._id.toString();
      
      const adPlacement = new AdPlacement(placementData);
      await adPlacement.save();
    }

    // Update podcast
    podcast.episodes.push(newEpisode._id);
    await podcast.save();

    return newEpisode;
  }

  private async generateBasicEpisode(podcast: IPodcast) {
    // Fallback to original pipeline logic
    const previousEpisodes = await Episode.find({ podcast: podcast._id })
      .sort({ createdAt: -1 })
      .limit(5);

    const history = previousEpisodes.map(ep => ({
      title: ep.title,
      summary: ep.summary,
    }));

    const prompt = `
      You are an AI podcast script generator.
      Podcast Title: ${podcast.title}
      Podcast Concept: ${podcast.concept}
      Tone: ${podcast.tone}
      Topics: ${podcast.topics.join(', ')}

      Characters:
      ${podcast.characters.map(c => `- ${c.name}: ${c.personality} (Voice: ${c.voice})`).join('\n')}

      Previous Episodes (for context, avoid repetition):
      ${history.length > 0 ? history.map(h => `- ${h.title}: ${h.summary}`).join('\n') : 'None'}

      Please generate a new podcast script of approximately ${podcast.length} length.
      
      Output the result as a single JSON object with the following fields:
      - "summary": A brief, one-sentence summary of the episode.
      - "title": A catchy title for this episode.
      - "script": The full script in the format:
          <CHARACTER_NAME>: <DIALOGUE>
          <CHARACTER_NAME>: <DIALOGUE>
      - "characters": An array of objects with "name" and "voice" for each character in the script.
    `;

    const generatedJson = await generate(prompt);
    const { summary, script, title } = parseGeneratedScript(generatedJson);
    
    const audioId = await generateAudio(script, podcast.characters.map(c => ({ name: c.name, voice: c.voice })));
    const audioUrl = `/audio/${audioId}.wav`;

    const newEpisode = new Episode({
      podcast: podcast._id,
      title: title || "Untitled Episode",
      summary,
      script,
      audioUrl,
      owner: podcast.owner,
      hasAds: false,
      adCount: 0
    });

    await newEpisode.save();

    podcast.episodes.push(newEpisode._id);
    await podcast.save();

    return newEpisode;
  }

  private convertToAIPodcast(podcast: IPodcast): PodcastAI {
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
      monetizationEnabled: (podcast as any).monetizationEnabled || false,
      adPreferences: (podcast as any).adPreferences || {
        allowedCategories: [],
        blockedBrands: [],
        maxAdsPerEpisode: 2,
        preferredAdPlacement: ['mid-roll'],
        minimumPayoutRate: 0.001
      },
      exclusivityAgreements: (podcast as any).exclusivityAgreements || [],
      aiContentEnabled: (podcast as any).aiContentEnabled !== false,
      qualityScore: (podcast as any).qualityScore || 0.5,
      audienceProfile: (podcast as any).audienceProfile || {
        demographics: { ageRange: '', interests: [], location: [] },
        engagement: { averageListenTime: 0, completionRate: 0, interactionRate: 0 }
      },
      contentThemes: (podcast as any).contentThemes || podcast.topics,
      averageEngagement: (podcast as any).averageEngagement || 0.5,
      totalViews: (podcast as any).totalViews || 0,
      totalEarnings: (podcast as any).totalEarnings || 0
    };
  }

  private convertToCampaignType(campaign: any): ICampaign {
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
}

// Backward compatibility - enhanced version of the original function
export async function runPipeline(podcast: IPodcast, options?: PipelineOptions) {
  const pipeline = new AIEnhancedPipeline();
  const result = await pipeline.runPipeline(podcast, options);
  return result.episode;
}

// New function that returns full results including ad data
export async function runEnhancedPipeline(podcast: IPodcast, options?: PipelineOptions): Promise<GeneratedEpisodeResult> {
  const pipeline = new AIEnhancedPipeline();
  return pipeline.runPipeline(podcast, options);
}