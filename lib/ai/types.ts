// Core AI service interfaces and types

export interface Campaign {
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
  payoutPerView: number;
  duration: number;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  contractAddress?: string;
  createdAt: Date;
  updatedAt: Date;
  
  // AI-specific fields
  aiMatchingEnabled: boolean;
  contentGenerationRules: ContentRule[];
  verificationCriteria: VerificationCriteria;
  qualityThreshold: number;
}

export interface ContentRule {
  type: 'mention_frequency' | 'tone' | 'placement' | 'duration';
  value: string | number;
  required: boolean;
}

export interface VerificationCriteria {
  minQualityScore: number;
  requiredElements: string[];
  complianceChecks: string[];
  naturalness: number;
}

export interface PodcastAI {
  id: string;
  title: string;
  description: string;
  concept: string;
  tone: string;
  frequency: string;
  length: string;
  characters: Character[];
  topics: string[];
  owner: string;
  
  // AI-specific additions
  monetizationEnabled: boolean;
  adPreferences: AdPreferences;
  exclusivityAgreements: string[];
  aiContentEnabled: boolean;
  qualityScore: number;
  audienceProfile: AudienceProfile;
  contentThemes: string[];
  averageEngagement: number;
}

export interface Character {
  name: string;
  personality: string;
  gender: 'male' | 'female' | 'neutral';
  voice: string;
}

export interface AdPreferences {
  allowedCategories: string[];
  blockedBrands: string[];
  maxAdsPerEpisode: number;
  preferredAdPlacement: AdPlacement[];
  minimumPayoutRate: number;
}

export interface AudienceProfile {
  demographics: {
    ageRange: string;
    interests: string[];
    location: string[];
  };
  engagement: {
    averageListenTime: number;
    completionRate: number;
    interactionRate: number;
  };
}

export interface AdPlacement {
  id: string;
  campaignId: string;
  podcastId: string;
  episodeId: string;
  adContent: AdContent;
  verificationResult?: VerificationResult;
  viewCount: number;
  totalPayout: number;
  status: 'pending' | 'verified' | 'rejected' | 'paid';
  createdAt: Date;
  verifiedAt?: Date;
  
  // AI tracking
  generationModel: string;
  verificationModel: string;
  qualityScore: number;
  userFeedback: UserFeedback[];
}

export interface AdContent {
  script: string;
  placement: 'intro' | 'mid-roll' | 'outro' | 'natural';
  duration: number;
  requiredElements: string[];
  styleNotes: string[];
}

export interface VerificationResult {
  verified: boolean;
  qualityScore: number;
  complianceScore: number;
  requirementsMet: boolean[];
  feedback: string[];
  improvementSuggestions: string[];
  timestamp: Date;
}

export interface UserFeedback {
  userId: string;
  rating: number;
  comment: string;
  timestamp: Date;
}

export interface PodcastMatch {
  podcastId: string;
  compatibilityScore: number;
  estimatedReach: number;
  suggestedBudgetAllocation: number;
  matchingReasons: string[];
  confidence: number;
}

export interface MatchingFeedback {
  campaignId: string;
  podcastId: string;
  actualPerformance: number;
  expectedPerformance: number;
  userSatisfaction: number;
}

export interface ComplianceResult {
  compliant: boolean;
  violations: string[];
  severity: 'low' | 'medium' | 'high';
  suggestions: string[];
}

export interface QualityScore {
  overall: number;
  naturalness: number;
  relevance: number;
  engagement: number;
  compliance: number;
  breakdown: {
    [key: string]: number;
  };
}

export interface CampaignMetrics {
  totalViews: number;
  totalSpent: number;
  averageQualityScore: number;
  conversionRate: number;
  audienceReach: number;
  engagementRate: number;
  clickThroughRate: number;
  costPerView: number;
}

export interface ViewData {
  episodeId: string;
  userId: string;
  timestamp: Date;
  duration: number;
  completed: boolean;
  ipAddress: string;
  userAgent: string;
}

export interface PayoutResult {
  transactionHash: string;
  creatorPayout: number;
  platformFee: number;
  totalViews: number;
  success: boolean;
  gasUsed?: number;
  error?: string;
}

export interface EarningsBreakdown {
  totalEarnings: number;
  creatorShare: number;
  platformFee: number;
  viewCount: number;
  payoutRate: number;
}