import mongoose, { Schema, Document } from 'mongoose';

export interface CampaignAnalyticsDocument extends Document {
  campaignId: string;
  date: Date;
  views: number;
  uniqueListeners: number;
  engagementRate: number;
  conversionRate: number;
  qualityScore: number;
  spend: number;
  revenue: number;
  
  // AI performance metrics
  matchingAccuracy: number;
  contentQualityScore: number;
  verificationAccuracy: number;
  userSatisfactionScore: number;
  
  // Detailed metrics
  impressions: number;
  clicks: number;
  conversions: number;
  averageListenTime: number;
  completionRate: number;
  
  // Cost metrics
  costPerView: number;
  costPerClick: number;
  costPerConversion: number;
  
  // Quality metrics
  adNaturalnessScore: number;
  brandMentionQuality: number;
  audienceRelevanceScore: number;
}

const CampaignAnalyticsSchema = new Schema({
  campaignId: {
    type: String,
    required: true,
    index: true
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  views: {
    type: Number,
    default: 0,
    min: 0
  },
  uniqueListeners: {
    type: Number,
    default: 0,
    min: 0
  },
  engagementRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 1
  },
  conversionRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 1
  },
  qualityScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 1
  },
  spend: {
    type: Number,
    default: 0,
    min: 0
  },
  revenue: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // AI performance metrics
  matchingAccuracy: {
    type: Number,
    default: 0,
    min: 0,
    max: 1
  },
  contentQualityScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 1
  },
  verificationAccuracy: {
    type: Number,
    default: 0,
    min: 0,
    max: 1
  },
  userSatisfactionScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 1
  },
  
  // Detailed metrics
  impressions: {
    type: Number,
    default: 0,
    min: 0
  },
  clicks: {
    type: Number,
    default: 0,
    min: 0
  },
  conversions: {
    type: Number,
    default: 0,
    min: 0
  },
  averageListenTime: {
    type: Number,
    default: 0,
    min: 0
  },
  completionRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 1
  },
  
  // Cost metrics
  costPerView: {
    type: Number,
    default: 0,
    min: 0
  },
  costPerClick: {
    type: Number,
    default: 0,
    min: 0
  },
  costPerConversion: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Quality metrics
  adNaturalnessScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 1
  },
  brandMentionQuality: {
    type: Number,
    default: 0,
    min: 0,
    max: 1
  },
  audienceRelevanceScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 1
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
CampaignAnalyticsSchema.index({ campaignId: 1, date: -1 });
CampaignAnalyticsSchema.index({ date: -1 });
CampaignAnalyticsSchema.index({ campaignId: 1, qualityScore: -1 });

// Virtual for click-through rate
CampaignAnalyticsSchema.virtual('clickThroughRate').get(function() {
  return this.impressions > 0 ? this.clicks / this.impressions : 0;
});

// Virtual for return on ad spend (ROAS)
CampaignAnalyticsSchema.virtual('returnOnAdSpend').get(function() {
  return this.spend > 0 ? this.revenue / this.spend : 0;
});

// Static methods for aggregation
CampaignAnalyticsSchema.statics.getCampaignSummary = function(campaignId: string, startDate?: Date, endDate?: Date) {
  const matchStage: any = { campaignId };
  
  if (startDate || endDate) {
    matchStage.date = {};
    if (startDate) matchStage.date.$gte = startDate;
    if (endDate) matchStage.date.$lte = endDate;
  }
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$campaignId',
        totalViews: { $sum: '$views' },
        totalUniqueListeners: { $sum: '$uniqueListeners' },
        totalSpend: { $sum: '$spend' },
        totalRevenue: { $sum: '$revenue' },
        totalImpressions: { $sum: '$impressions' },
        totalClicks: { $sum: '$clicks' },
        totalConversions: { $sum: '$conversions' },
        avgEngagementRate: { $avg: '$engagementRate' },
        avgQualityScore: { $avg: '$qualityScore' },
        avgUserSatisfaction: { $avg: '$userSatisfactionScore' },
        avgCompletionRate: { $avg: '$completionRate' },
        days: { $sum: 1 }
      }
    },
    {
      $addFields: {
        overallCTR: {
          $cond: [
            { $gt: ['$totalImpressions', 0] },
            { $divide: ['$totalClicks', '$totalImpressions'] },
            0
          ]
        },
        overallConversionRate: {
          $cond: [
            { $gt: ['$totalClicks', 0] },
            { $divide: ['$totalConversions', '$totalClicks'] },
            0
          ]
        },
        avgCostPerView: {
          $cond: [
            { $gt: ['$totalViews', 0] },
            { $divide: ['$totalSpend', '$totalViews'] },
            0
          ]
        },
        returnOnAdSpend: {
          $cond: [
            { $gt: ['$totalSpend', 0] },
            { $divide: ['$totalRevenue', '$totalSpend'] },
            0
          ]
        }
      }
    }
  ]);
};

CampaignAnalyticsSchema.statics.getPerformanceTrends = function(campaignId: string, days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.aggregate([
    {
      $match: {
        campaignId,
        date: { $gte: startDate }
      }
    },
    {
      $sort: { date: 1 }
    },
    {
      $project: {
        date: 1,
        views: 1,
        engagementRate: 1,
        qualityScore: 1,
        spend: 1,
        clickThroughRate: {
          $cond: [
            { $gt: ['$impressions', 0] },
            { $divide: ['$clicks', '$impressions'] },
            0
          ]
        }
      }
    }
  ]);
};

export const CampaignAnalytics = mongoose.models.CampaignAnalytics || mongoose.model<CampaignAnalyticsDocument>('CampaignAnalytics', CampaignAnalyticsSchema);