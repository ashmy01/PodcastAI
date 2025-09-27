import mongoose, { Schema, Document } from 'mongoose';
import { AdPlacement as IAdPlacement, AdContent, VerificationResult, UserFeedback } from '../ai/types';

export interface AdPlacementDocument extends IAdPlacement, Document {}

const AdContentSchema = new Schema({
  script: {
    type: String,
    required: true
  },
  placement: {
    type: String,
    enum: ['intro', 'mid-roll', 'outro', 'natural'],
    required: true
  },
  duration: {
    type: Number,
    required: true,
    min: 15,
    max: 120
  },
  requiredElements: [{
    type: String,
    required: true
  }],
  styleNotes: [{
    type: String
  }]
});

const VerificationResultSchema = new Schema({
  verified: {
    type: Boolean,
    required: true
  },
  qualityScore: {
    type: Number,
    required: true,
    min: 0,
    max: 1
  },
  complianceScore: {
    type: Number,
    required: true,
    min: 0,
    max: 1
  },
  requirementsMet: [{
    type: Boolean,
    required: true
  }],
  feedback: [{
    type: String
  }],
  improvementSuggestions: [{
    type: String
  }],
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const UserFeedbackSchema = new Schema({
  userId: {
    type: String,
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const AdPlacementSchema = new Schema({
  campaignId: {
    type: String,
    required: true,
    index: true
  },
  podcastId: {
    type: String,
    required: true,
    index: true
  },
  episodeId: {
    type: String,
    required: true,
    index: true
  },
  adContent: {
    type: AdContentSchema,
    required: true
  },
  verificationResult: {
    type: VerificationResultSchema
  },
  viewCount: {
    type: Number,
    default: 0,
    min: 0
  },
  totalPayout: {
    type: Number,
    default: 0,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'verified', 'rejected', 'paid'],
    default: 'pending',
    index: true
  },
  verifiedAt: {
    type: Date
  },
  
  // AI tracking
  generationModel: {
    type: String,
    required: true
  },
  verificationModel: {
    type: String
  },
  qualityScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 1
  },
  userFeedback: [UserFeedbackSchema],
  
  // Performance tracking
  impressions: {
    type: Number,
    default: 0
  },
  clicks: {
    type: Number,
    default: 0
  },
  conversions: {
    type: Number,
    default: 0
  },
  
  // Metadata
  generatedAt: {
    type: Date,
    default: Date.now
  },
  lastViewedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Compound indexes for performance
AdPlacementSchema.index({ campaignId: 1, status: 1 });
AdPlacementSchema.index({ podcastId: 1, status: 1 });
AdPlacementSchema.index({ episodeId: 1, status: 1 });
AdPlacementSchema.index({ status: 1, createdAt: -1 });
AdPlacementSchema.index({ qualityScore: -1 });

// Virtual for click-through rate
AdPlacementSchema.virtual('clickThroughRate').get(function() {
  return this.impressions > 0 ? this.clicks / this.impressions : 0;
});

// Virtual for conversion rate
AdPlacementSchema.virtual('conversionRate').get(function() {
  return this.clicks > 0 ? this.conversions / this.clicks : 0;
});

// Virtual for average user rating
AdPlacementSchema.virtual('averageRating').get(function() {
  if (this.userFeedback.length === 0) return 0;
  const sum = this.userFeedback.reduce((acc, feedback) => acc + feedback.rating, 0);
  return sum / this.userFeedback.length;
});

// Methods
AdPlacementSchema.methods.isVerified = function() {
  return this.status === 'verified' && this.verificationResult?.verified === true;
};

AdPlacementSchema.methods.canProcessPayout = function() {
  return this.isVerified() && this.viewCount > 0 && this.status !== 'paid';
};

AdPlacementSchema.methods.addView = function() {
  this.viewCount += 1;
  this.impressions += 1;
  this.lastViewedAt = new Date();
};

AdPlacementSchema.methods.addClick = function() {
  this.clicks += 1;
};

AdPlacementSchema.methods.addConversion = function() {
  this.conversions += 1;
};

AdPlacementSchema.methods.addUserFeedback = function(userId: string, rating: number, comment?: string) {
  this.userFeedback.push({
    userId,
    rating,
    comment,
    timestamp: new Date()
  });
};

export const AdPlacement = mongoose.models.AdPlacement || mongoose.model<AdPlacementDocument>('AdPlacement', AdPlacementSchema);