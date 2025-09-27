import { BaseAIService } from './base-ai-service';
import { getAIServiceConfig } from './config';
import { ContentGenerationAgent } from './interfaces';
import { 
  PodcastAI, 
  Campaign, 
  AdContent, 
  ComplianceResult 
} from './types';

export class AIContentGenerationAgent extends BaseAIService implements ContentGenerationAgent {
  constructor() {
    super(getAIServiceConfig('generation'));
  }

  protected getServiceType(): 'generation' {
    return 'generation';
  }

  async generateAdContent(podcast: PodcastAI, campaign: Campaign): Promise<AdContent> {
    this.validateInput(podcast, ['title', 'characters', 'tone']);
    this.validateInput(campaign, ['brandName', 'productName', 'description', 'requirements']);

    const prompt = this.buildContentGenerationPrompt(podcast, campaign);
    
    try {
      const response = await this.generateContent(prompt);
      const adContent = this.parseAdContentResponse(response);
      
      // Validate the generated content
      const compliance = await this.validateContentCompliance(adContent.script);
      if (!compliance.compliant) {
        throw new Error(`Generated content failed compliance: ${compliance.violations.join(', ')}`);
      }
      
      return adContent;
    } catch (error) {
      console.error('Error generating ad content:', error);
      throw error;
    }
  }

  async embedAdInScript(script: string, adContent: AdContent): Promise<string> {
    const prompt = `
    You are an expert podcast script editor. Your task is to seamlessly integrate an advertisement into an existing podcast script while maintaining natural conversation flow.

    ORIGINAL SCRIPT:
    ${script}

    AD CONTENT TO EMBED:
    ${adContent.script}

    PLACEMENT TYPE: ${adContent.placement}
    STYLE NOTES: ${adContent.styleNotes.join(', ')}

    INSTRUCTIONS:
    1. Find the most natural insertion point based on the placement type
    2. Ensure smooth transitions before and after the ad
    3. Maintain the original characters' voices and personalities
    4. Make the ad feel like a natural part of the conversation
    5. Add appropriate transition phrases if needed

    PLACEMENT GUIDELINES:
    - intro: Place near the beginning after initial greetings
    - mid-roll: Place at a natural break in the middle of the content
    - outro: Place near the end before final wrap-up
    - natural: Find the most contextually relevant moment

    Return the complete script with the ad seamlessly integrated. Mark the ad section with [AD START] and [AD END] comments for tracking purposes.
    `;

    try {
      const response = await this.generateContent(prompt);
      return this.cleanupEmbeddedScript(response);
    } catch (error) {
      console.error('Error embedding ad in script:', error);
      // Fallback: simple insertion
      return this.fallbackEmbedAd(script, adContent);
    }
  }

  async validateContentCompliance(content: string): Promise<ComplianceResult> {
    const prompt = `
    Analyze this advertising content for compliance with advertising standards and platform policies:

    CONTENT:
    ${content}

    Check for:
    1. Misleading claims or false information
    2. Inappropriate language or content
    3. Proper disclosure of advertising relationship
    4. Compliance with advertising regulations
    5. Respectful and inclusive language
    6. No spam or overly promotional language

    Return a JSON response in this format:
    {
      "compliant": true/false,
      "violations": ["violation1", "violation2"],
      "severity": "low/medium/high",
      "suggestions": ["suggestion1", "suggestion2"]
    }
    `;

    try {
      const response = await this.generateContent(prompt);
      return JSON.parse(response);
    } catch (error) {
      console.error('Error validating compliance:', error);
      return this.fallbackComplianceCheck(content);
    }
  }

  async optimizeForStyle(content: string, podcast: PodcastAI): Promise<string> {
    const prompt = `
    Optimize this advertising content to match the specific style and tone of this podcast:

    PODCAST DETAILS:
    - Title: ${podcast.title}
    - Tone: ${podcast.tone}
    - Characters: ${podcast.characters.map(c => `${c.name} (${c.personality})`).join(', ')}
    - Topics: ${podcast.topics.join(', ')}

    CONTENT TO OPTIMIZE:
    ${content}

    OPTIMIZATION GOALS:
    1. Match the podcast's conversational tone and style
    2. Use vocabulary and phrases consistent with the show
    3. Ensure character voices remain authentic
    4. Maintain natural flow and pacing
    5. Keep the advertising message clear but not intrusive

    Return the optimized content that feels like it naturally belongs in this podcast.
    `;

    try {
      const response = await this.generateContent(prompt);
      return response.trim();
    } catch (error) {
      console.error('Error optimizing content for style:', error);
      return content; // Return original if optimization fails
    }
  }

  async generateVariations(baseContent: AdContent, count: number): Promise<AdContent[]> {
    const variations: AdContent[] = [];
    
    for (let i = 0; i < count; i++) {
      const prompt = `
      Create a variation of this advertising content while maintaining the same key message and requirements:

      ORIGINAL CONTENT:
      ${baseContent.script}

      REQUIREMENTS TO MAINTAIN:
      ${baseContent.requiredElements.join(', ')}

      VARIATION ${i + 1} INSTRUCTIONS:
      - Keep the same core message and required elements
      - Change the wording, structure, and approach
      - Maintain the same tone and style
      - Ensure it's still natural and engaging
      - Make it feel fresh and different from the original

      Return only the new script content.
      `;

      try {
        const response = await this.generateContent(prompt);
        const variation: AdContent = {
          ...baseContent,
          script: response.trim()
        };
        variations.push(variation);
      } catch (error) {
        console.error(`Error generating variation ${i + 1}:`, error);
        // Continue with other variations
      }
    }

    return variations;
  }

  private buildContentGenerationPrompt(podcast: PodcastAI, campaign: Campaign): string {
    return `
    You are an expert podcast advertising content creator. Generate natural, engaging ad content that seamlessly fits into this podcast.

    PODCAST CONTEXT:
    - Title: ${podcast.title}
    - Description: ${podcast.description}
    - Tone: ${podcast.tone}
    - Characters: ${podcast.characters.map(c => `${c.name} (${c.personality}, ${c.gender})`).join(', ')}
    - Topics: ${podcast.topics.join(', ')}
    - Average Episode Length: ${podcast.length}

    CAMPAIGN DETAILS:
    - Brand: ${campaign.brandName}
    - Product: ${campaign.productName}
    - Description: ${campaign.description}
    - Target Audience: ${campaign.targetAudience.join(', ')}
    - Requirements: ${campaign.requirements.join(', ')}

    CONTENT GENERATION RULES:
    ${campaign.contentGenerationRules.map(rule => `- ${rule.type}: ${rule.value}`).join('\n')}

    INSTRUCTIONS:
    1. Create ad content that feels like natural conversation between the podcast characters
    2. Maintain the authentic voice and personality of each character
    3. Integrate the product mention organically into the discussion
    4. Include all required elements from the campaign requirements
    5. Keep the tone consistent with the podcast's style
    6. Make it engaging and informative, not pushy or salesy
    7. Ensure the ad duration is appropriate (15-60 seconds when spoken)

    Return a JSON response in this exact format:
    {
      "script": "The actual dialogue/script content here",
      "placement": "mid-roll",
      "duration": 45,
      "requiredElements": ["element1", "element2"],
      "styleNotes": ["note1", "note2"]
    }

    The script should be written as natural dialogue between the characters, clearly indicating who is speaking.
    `;
  }

  private parseAdContentResponse(response: string): AdContent {
    try {
      const parsed = JSON.parse(response);
      
      // Validate required fields
      if (!parsed.script || !parsed.placement) {
        throw new Error('Invalid response format: missing required fields');
      }

      return {
        script: parsed.script,
        placement: parsed.placement || 'mid-roll',
        duration: parsed.duration || 30,
        requiredElements: parsed.requiredElements || [],
        styleNotes: parsed.styleNotes || []
      };
    } catch (error) {
      console.error('Error parsing ad content response:', error);
      throw new Error('Failed to parse AI response into valid ad content');
    }
  }

  private cleanupEmbeddedScript(script: string): string {
    // Remove any unwanted formatting or artifacts
    return script
      .replace(/```[a-z]*\n?/g, '') // Remove code block markers
      .replace(/\n{3,}/g, '\n\n') // Reduce excessive line breaks
      .trim();
  }

  private fallbackEmbedAd(script: string, adContent: AdContent): string {
    const lines = script.split('\n');
    let insertionPoint = Math.floor(lines.length / 2); // Default to middle

    switch (adContent.placement) {
      case 'intro':
        insertionPoint = Math.min(5, Math.floor(lines.length * 0.2));
        break;
      case 'outro':
        insertionPoint = Math.max(lines.length - 5, Math.floor(lines.length * 0.8));
        break;
      case 'mid-roll':
      case 'natural':
      default:
        insertionPoint = Math.floor(lines.length / 2);
        break;
    }

    // Insert ad content with markers
    lines.splice(insertionPoint, 0, 
      '',
      '[AD START]',
      adContent.script,
      '[AD END]',
      ''
    );

    return lines.join('\n');
  }

  private fallbackComplianceCheck(content: string): ComplianceResult {
    const violations: string[] = [];
    const suggestions: string[] = [];
    
    // Basic compliance checks
    const lowerContent = content.toLowerCase();
    
    // Check for potentially problematic content
    const problematicWords = ['guaranteed', 'miracle', 'instant', 'free money', 'get rich quick'];
    for (const word of problematicWords) {
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

    // Check length (basic spam detection)
    if (content.length > 1000) {
      violations.push('Content may be too long and promotional');
      suggestions.push('Consider shortening the content to be more concise');
    }

    return {
      compliant: violations.length === 0,
      violations,
      severity: violations.length > 2 ? 'high' : violations.length > 0 ? 'medium' : 'low',
      suggestions
    };
  }

  // Helper method to determine optimal ad placement
  private determineOptimalPlacement(podcast: PodcastAI, campaign: Campaign): AdContent['placement'] {
    // Check podcast preferences
    if (podcast.adPreferences?.preferredAdPlacement?.length > 0) {
      return podcast.adPreferences.preferredAdPlacement[0] as AdContent['placement'];
    }

    // Default based on podcast length and type
    const lengthMinutes = this.parseLengthToMinutes(podcast.length);
    
    if (lengthMinutes < 15) {
      return 'intro';
    } else if (lengthMinutes > 45) {
      return 'mid-roll';
    } else {
      return 'natural';
    }
  }

  private parseLengthToMinutes(length: string): number {
    const match = length.match(/(\d+)/);
    return match ? parseInt(match[1]) : 30; // Default to 30 minutes
  }

  // Helper method to estimate speaking duration
  private estimateSpeakingDuration(script: string): number {
    // Average speaking rate is about 150-160 words per minute
    const wordCount = script.split(/\s+/).length;
    return Math.ceil((wordCount / 155) * 60); // Convert to seconds
  }
}