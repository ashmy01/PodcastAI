import { 
  Campaign, 
  PodcastAI, 
  PodcastMatch, 
  MatchingFeedback,
  AdContent,
  ComplianceResult,
  VerificationResult,
  QualityScore,
  ViewData,
  PayoutResult,
  EarningsBreakdown,
  CampaignMetrics
} from './types';

// AI Matching Agent Interface
export interface MatchingAgent {
  findMatches(campaignId: string): Promise<PodcastMatch[]>;
  scoreCompatibility(campaign: Campaign, podcast: PodcastAI): Promise<number>;
  updateMatchingModel(feedbackData: MatchingFeedback[]): Promise<void>;
  analyzeCampaign(campaign: Campaign): Promise<CampaignAnalysis>;
  profilePodcast(podcast: PodcastAI): Promise<PodcastProfile>;
}

export interface CampaignAnalysis {
  keyFeatures: string[];
  targetDemographics: string[];
  contentRequirements: string[];
  budgetEfficiency: number;
  competitiveAnalysis: string[];
}

export interface PodcastProfile {
  contentThemes: string[];
  audienceDemographics: string[];
  engagementMetrics: {
    averageViews: number;
    completionRate: number;
    interactionRate: number;
  };
  monetizationReadiness: number;
  brandCompatibility: string[];
}

// AI Content Generation Agent Interface
export interface ContentGenerationAgent {
  generateAdContent(podcast: PodcastAI, campaign: Campaign): Promise<AdContent>;
  embedAdInScript(script: string, adContent: AdContent): Promise<string>;
  validateContentCompliance(content: string): Promise<ComplianceResult>;
  optimizeForStyle(content: string, podcast: PodcastAI): Promise<string>;
  generateVariations(baseContent: AdContent, count: number): Promise<AdContent[]>;
}

// AI Verification Agent Interface
export interface VerificationAgent {
  verifyAdPlacement(episodeId: string, campaignId: string): Promise<VerificationResult>;
  analyzeContentQuality(content: string, requirements: string[]): Promise<QualityScore>;
  validateCompliance(content: string): Promise<ComplianceResult>;
  checkRequirements(content: string, requirements: string[]): Promise<boolean[]>;
  scoreNaturalness(content: string, podcastStyle: string): Promise<number>;
}

// Campaign Service Interface
export interface CampaignService {
  createCampaign(campaignData: Partial<Campaign>): Promise<Campaign>;
  updateCampaignStatus(campaignId: string, status: Campaign['status']): Promise<void>;
  trackCampaignMetrics(campaignId: string): Promise<CampaignMetrics>;
  processBudgetAllocation(campaignId: string, allocation: BudgetAllocation): Promise<void>;
  getCampaignById(campaignId: string): Promise<Campaign | null>;
  getActiveCampaigns(): Promise<Campaign[]>;
}

export interface BudgetAllocation {
  podcastId: string;
  allocatedAmount: number;
  expectedViews: number;
  payoutRate: number;
}

// Payout Service Interface
export interface PayoutService {
  trackView(episodeId: string, userId: string): Promise<void>;
  processPayouts(campaignId: string, podcastId: string): Promise<PayoutResult>;
  validateViewAuthenticity(viewData: ViewData[]): Promise<ViewData[]>;
  calculateEarnings(views: number, payoutRate: number): Promise<EarningsBreakdown>;
  getCreatorEarnings(creatorId: string): Promise<CreatorEarnings>;
}

export interface CreatorEarnings {
  totalEarnings: number;
  pendingPayouts: number;
  completedPayouts: number;
  activeCampaigns: number;
  averagePayoutRate: number;
  monthlyEarnings: { [month: string]: number };
}

// Analytics Service Interface
export interface AnalyticsService {
  trackCampaignPerformance(campaignId: string): Promise<CampaignMetrics>;
  generateInsights(campaignId: string): Promise<CampaignInsights>;
  predictPerformance(campaign: Campaign, podcast: PodcastAI): Promise<PerformancePrediction>;
  getAudienceAnalytics(podcastId: string): Promise<AudienceAnalytics>;
}

export interface CampaignInsights {
  performanceTrends: { [date: string]: number };
  audienceEngagement: number;
  contentQualityTrends: { [date: string]: number };
  optimizationSuggestions: string[];
  competitorAnalysis: CompetitorInsight[];
}

export interface PerformancePrediction {
  expectedViews: number;
  expectedEngagement: number;
  expectedConversion: number;
  confidenceInterval: [number, number];
  riskFactors: string[];
}

export interface AudienceAnalytics {
  demographics: { [key: string]: number };
  interests: { [key: string]: number };
  engagementPatterns: { [timeSlot: string]: number };
  retentionRate: number;
  growthRate: number;
}

export interface CompetitorInsight {
  brandName: string;
  marketShare: number;
  averageSpend: number;
  performanceMetrics: CampaignMetrics;
}

// Notification Service Interface
export interface NotificationService {
  sendCampaignMatch(brandId: string, creatorId: string, matchDetails: PodcastMatch): Promise<void>;
  sendVerificationComplete(creatorId: string, verificationResult: VerificationResult): Promise<void>;
  sendPayoutProcessed(creatorId: string, payoutResult: PayoutResult): Promise<void>;
  sendCampaignAlert(brandId: string, alertType: string, details: any): Promise<void>;
}

// Quality Control Interface
export interface QualityControlAgent {
  monitorContentQuality(contentId: string): Promise<QualityReport>;
  detectAnomalies(metrics: any[]): Promise<Anomaly[]>;
  updateQualityModels(feedbackData: QualityFeedback[]): Promise<void>;
  generateQualityReport(timeRange: DateRange): Promise<SystemQualityReport>;
}

export interface QualityReport {
  contentId: string;
  overallScore: number;
  issues: QualityIssue[];
  recommendations: string[];
  timestamp: Date;
}

export interface QualityIssue {
  type: 'content' | 'compliance' | 'performance';
  severity: 'low' | 'medium' | 'high';
  description: string;
  suggestion: string;
}

export interface Anomaly {
  type: string;
  severity: number;
  description: string;
  affectedItems: string[];
  timestamp: Date;
}

export interface QualityFeedback {
  contentId: string;
  userRating: number;
  performanceMetrics: any;
  issues: string[];
  timestamp: Date;
}

export interface SystemQualityReport {
  overallHealth: number;
  servicePerformance: { [service: string]: number };
  qualityTrends: { [date: string]: number };
  issuesSummary: { [issueType: string]: number };
  recommendations: string[];
}

export interface DateRange {
  start: Date;
  end: Date;
}