import mongoose, { Schema, Document } from 'mongoose';
import { Campaign as ICampaign, ContentRule, VerificationCriteria } from '../ai/types';

export interface CampaignDocument extends ICampaign, Document {}

const ContentRuleSchema = new Schema({
  type: {
    type: String,
    enum: ['mention_frequency', 'tone', 'placement', 'duration'],
    required: true
  },
  value: {
    type: Schema.Types.Mixed,
    required: true
  },
  required: {
    type: Boolean,
    default: true
  }
});

const VerificationCriteriaSchema = new Schema({
  minQualityScore: {
    type: Number,
    required: true,
    min: 0,
    max: 1
  },
  requiredElements: [{
    type: String,
    required: true
  }],
  complianceChecks: [{
    type: String,
    required: true
  }],
  naturalness: {
    type: Number,
    required: true,
    min: 0,
    max: 1
  }
});

const CampaignSchema = new Schema({
  brandId: {
    type: String,
    required: true,
    index: true
  },
  brandName: {
    type: String,
    required: true
  },
  productName: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    index: true
  },
  targetAudience: [{
    type: String,
    required: true
  }],
  requirements: [{
    type: String,
    required: true
  }],
  budget: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    required: true,
    enum: ['ETH', 'USDC', 'USDT', 'PYUSD']
  },
  payoutPerView: {
    type: Number,
    required: true,
    min: 0
  },
  duration: {
    type: Number,
    required: true,
    min: 1
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'completed', 'cancelled'],
    default: 'active',
    index: true
  },
  contractAddress: {
    type: String,
    index: true
  },
  
  // AI-specific fields
  aiMatchingEnabled: {
    type: Boolean,
    default: true
  },
  contentGenerationRules: [ContentRuleSchema],
  verificationCriteria: {
    type: VerificationCriteriaSchema,
    required: true
  },
  qualityThreshold: {
    type: Number,
    required: true,
    min: 0,
    max: 1,
    default: 0.7
  },
  
  // Analytics fields
  totalViews: {
    type: Number,
    default: 0
  },
  totalSpent: {
    type: Number,
    default: 0
  },
  averageQualityScore: {
    type: Number,
    default: 0
  },
  matchedPodcasts: [{
    podcastId: String,
    matchScore: Number,
    status: {
      type: String,
      enum: ['matched', 'accepted', 'rejected', 'completed']
    },
    matchedAt: Date
  }]
}, {
  timestamps: true
});

// Indexes for performance
CampaignSchema.index({ brandId: 1, status: 1 });
CampaignSchema.index({ category: 1, status: 1 });
CampaignSchema.index({ aiMatchingEnabled: 1, status: 1 });
CampaignSchema.index({ createdAt: -1 });

// Virtual for remaining budget
CampaignSchema.virtual('remainingBudget').get(function() {
  return this.budget - this.totalSpent;
});

// Methods
CampaignSchema.methods.isActive = function() {
  return this.status === 'active' && this.remainingBudget > 0;
};

CampaignSchema.methods.canAffordViews = function(viewCount: number) {
  return this.remainingBudget >= (viewCount * this.payoutPerView);
};

export const Campaign = mongoose.models.Campaign || mongoose.model<CampaignDocument>('Campaign', CampaignSchema);