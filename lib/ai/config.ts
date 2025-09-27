import { AIServiceConfig } from './base-ai-service';

export const AI_CONFIG = {
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  DEFAULT_MODEL: 'gemini-1.5-flash',
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
  
  // Service-specific configurations
  MATCHING_SERVICE: {
    model: 'gemini-1.5-flash',
    maxRetries: 3,
    retryDelay: 1000,
  },
  
  GENERATION_SERVICE: {
    model: 'gemini-1.5-flash',
    maxRetries: 2,
    retryDelay: 2000,
  },
  
  VERIFICATION_SERVICE: {
    model: 'gemini-1.5-flash',
    maxRetries: 3,
    retryDelay: 1500,
  },
  
  // Quality thresholds
  MIN_QUALITY_SCORE: 0.7,
  MIN_COMPLIANCE_SCORE: 0.8,
  MIN_NATURALNESS_SCORE: 0.6,
  
  // Performance limits
  MAX_CONCURRENT_REQUESTS: 10,
  REQUEST_TIMEOUT: 30000,
  
  // Content safety
  CONTENT_FILTERS: [
    'inappropriate',
    'misleading',
    'harmful',
    'spam',
    'offensive'
  ],
  
  // Matching parameters
  MATCHING_THRESHOLD: 0.5,
  MAX_MATCHES_PER_CAMPAIGN: 10,
  
  // Generation parameters
  MAX_AD_DURATION: 60, // seconds
  MIN_AD_DURATION: 15, // seconds
  MAX_ADS_PER_EPISODE: 3,
} as const;

export function getAIServiceConfig(service: 'matching' | 'generation' | 'verification'): AIServiceConfig {
  const baseConfig = {
    apiKey: AI_CONFIG.GEMINI_API_KEY,
    maxRetries: AI_CONFIG.MAX_RETRIES,
    retryDelay: AI_CONFIG.RETRY_DELAY,
  };

  switch (service) {
    case 'matching':
      return { ...baseConfig, ...AI_CONFIG.MATCHING_SERVICE };
    case 'generation':
      return { ...baseConfig, ...AI_CONFIG.GENERATION_SERVICE };
    case 'verification':
      return { ...baseConfig, ...AI_CONFIG.VERIFICATION_SERVICE };
    default:
      return { ...baseConfig, model: AI_CONFIG.DEFAULT_MODEL };
  }
}

export function validateAIConfig(): void {
  if (!AI_CONFIG.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY environment variable is required');
  }
}