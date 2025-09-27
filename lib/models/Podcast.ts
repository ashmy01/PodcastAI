import mongoose, { Document, Schema } from 'mongoose';
import { AdPreferences, AudienceProfile } from '../ai/types';

export interface ICharacter extends Document {
  name: string;
  personality: string;
  voice: string;
  gender: string;
}

export interface IPodcast extends Document {
  title: string;
  description: string;
  concept: string;
  tone: string;
  frequency: string;
  length: string;
  characters: ICharacter[];
  topics: string[];
  episodes: mongoose.Schema.Types.ObjectId[];
  owner: string; // wallet address
  
  // AI-specific additions
  monetizationEnabled: boolean;
  adPreferences: AdPreferences;
  exclusivityAgreements: string[];
  aiContentEnabled: boolean;
  qualityScore: number;
  audienceProfile: AudienceProfile;
  contentThemes: string[];
  averageEngagement: number;
  totalViews: number;
  totalEarnings: number;
}

const CharacterSchema: Schema = new Schema({
  name: { type: String, required: true },
  personality: { type: String, required: true },
  voice: { type: String, required: true },
  gender: { type: String, required: true },
});

const AdPreferencesSchema = new Schema({
  allowedCategories: [{
    type: String,
    required: true
  }],
  blockedBrands: [{
    type: String
  }],
  maxAdsPerEpisode: {
    type: Number,
    default: 2,
    min: 0,
    max: 5
  },
  preferredAdPlacement: [{
    type: String,
    enum: ['intro', 'mid-roll', 'outro', 'natural']
  }],
  minimumPayoutRate: {
    type: Number,
    default: 0.001,
    min: 0
  }
});

const AudienceProfileSchema = new Schema({
  demographics: {
    ageRange: String,
    interests: [String],
    location: [String]
  },
  engagement: {
    averageListenTime: {
      type: Number,
      default: 0
    },
    completionRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 1
    },
    interactionRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 1
    }
  }
});

const PodcastSchema: Schema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  concept: { type: String, required: true },
  tone: { type: String, required: true },
  frequency: { type: String, required: true },
  length: { type: String, required: true },
  characters: [CharacterSchema],
  topics: [{ type: String }],
  episodes: [{ type: Schema.Types.ObjectId, ref: 'Episode' }],
  owner: { type: String, required: true }, // wallet address
  
  // AI-specific additions
  monetizationEnabled: {
    type: Boolean,
    default: false
  },
  adPreferences: {
    type: AdPreferencesSchema,
    default: () => ({
      allowedCategories: [],
      blockedBrands: [],
      maxAdsPerEpisode: 2,
      preferredAdPlacement: ['mid-roll'],
      minimumPayoutRate: 0.001
    })
  },
  exclusivityAgreements: [{
    type: String
  }],
  aiContentEnabled: {
    type: Boolean,
    default: true
  },
  qualityScore: {
    type: Number,
    default: 0.5,
    min: 0,
    max: 1
  },
  audienceProfile: {
    type: AudienceProfileSchema,
    default: () => ({
      demographics: {
        ageRange: '',
        interests: [],
        location: []
      },
      engagement: {
        averageListenTime: 0,
        completionRate: 0,
        interactionRate: 0
      }
    })
  },
  contentThemes: [{
    type: String
  }],
  averageEngagement: {
    type: Number,
    default: 0,
    min: 0,
    max: 1
  },
  totalViews: {
    type: Number,
    default: 0
  },
  totalEarnings: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

// Indexes for AI features
PodcastSchema.index({ owner: 1, monetizationEnabled: 1 });
PodcastSchema.index({ 'adPreferences.allowedCategories': 1 });
PodcastSchema.index({ contentThemes: 1 });
PodcastSchema.index({ qualityScore: -1 });
PodcastSchema.index({ averageEngagement: -1 });

// Virtual for monetization readiness
PodcastSchema.virtual('monetizationReadiness').get(function() {
  if (!this.monetizationEnabled) return 0;
  
  let score = 0;
  score += this.qualityScore * 0.4;
  score += this.averageEngagement * 0.3;
  score += (this.totalViews > 100 ? 0.2 : (this.totalViews / 100) * 0.2);
  score += (this.adPreferences.allowedCategories.length > 0 ? 0.1 : 0);
  
  return Math.min(score, 1);
});

// Methods
PodcastSchema.methods.canAcceptAd = function(category: string, brandName: string) {
  if (!this.monetizationEnabled || !this.aiContentEnabled) return false;
  
  // Check blocked brands
  if (this.adPreferences.blockedBrands.includes(brandName)) return false;
  
  // Check allowed categories (if specified)
  if (this.adPreferences.allowedCategories.length > 0) {
    return this.adPreferences.allowedCategories.includes(category);
  }
  
  return true;
};

PodcastSchema.methods.updateEngagementMetrics = function(views: number, completionRate: number) {
  this.totalViews += views;
  this.audienceProfile.engagement.completionRate = 
    (this.audienceProfile.engagement.completionRate + completionRate) / 2;
  this.averageEngagement = this.audienceProfile.engagement.completionRate;
};

export const Podcast = mongoose.models.Podcast || mongoose.model<IPodcast>('Podcast', PodcastSchema);
