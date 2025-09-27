import { AIPayoutService } from '../services/payout-service';
import { AIVerificationAgent } from '../ai/verification-agent';
import { AIDatabaseService } from '../ai/database-service';
import { createContractService } from '../web3/contract-service';

export class AIAutomationJobs {
  private payoutService = new AIPayoutService();
  private verificationAgent = new AIVerificationAgent();
  private dbService = new AIDatabaseService();
  private contractService = createContractService();

  // Job to process pending verifications
  async processPendingVerifications(): Promise<void> {
    try {
      console.log('Starting pending verification processing...');
      
      const { AdPlacement } = await import('../models/AdPlacement');
      const pendingPlacements = await AdPlacement.find({ 
        status: 'pending' 
      }).limit(10); // Process in batches

      for (const placement of pendingPlacements) {
        try {
          const verificationResult = await this.verificationAgent.verifyAdPlacement(
            placement.episodeId,
            placement.campaignId
          );

          if (verificationResult.verified) {
            // Call smart contract
            const txHash = await this.contractService.verifyAdPlacement(
              parseInt(placement.campaignId),
              placement.podcastId
            );

            await this.dbService.updateAdPlacementStatus(
              placement._id.toString(),
              'verified',
              verificationResult
            );

            console.log(`Verified ad placement ${placement._id}, tx: ${txHash}`);
          } else {
            await this.dbService.updateAdPlacementStatus(
              placement._id.toString(),
              'rejected',
              verificationResult
            );

            console.log(`Rejected ad placement ${placement._id}`);
          }

          // Add delay between verifications
          await new Promise(resolve => setTimeout(resolve, 2000));

        } catch (error) {
          console.error(`Error verifying placement ${placement._id}:`, error);
          // Continue with next placement
        }
      }

      console.log(`Processed ${pendingPlacements.length} pending verifications`);
    } catch (error) {
      console.error('Error in pending verification processing:', error);
    }
  }

  // Job to process automated payouts
  async processAutomatedPayouts(): Promise<void> {
    try {
      await this.payoutService.processAutomatedPayouts();
    } catch (error) {
      console.error('Error in automated payout job:', error);
    }
  }

  // Job to detect and handle fraud
  async detectAndHandleFraud(): Promise<void> {
    try {
      console.log('Starting fraud detection...');
      
      const { Episode } = await import('../models/Episode');
      const recentEpisodes = await Episode.find({
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Last 24 hours
        hasAds: true
      });

      let fraudDetected = 0;

      for (const episode of recentEpisodes) {
        const isFraud = await this.payoutService.detectViewFraud(episode._id.toString());
        
        if (isFraud) {
          fraudDetected++;
          
          // Flag episode and associated ad placements
          const placements = await this.dbService.getAdPlacementsByEpisode(episode._id.toString());
          
          for (const placement of placements) {
            if (placement.status === 'verified') {
              await this.dbService.updateAdPlacementStatus(
                placement._id.toString(),
                'rejected',
                { 
                  verified: false,
                  qualityScore: 0,
                  complianceScore: 0,
                  requirementsMet: [],
                  feedback: ['Flagged for potential view fraud'],
                  improvementSuggestions: ['Review view patterns'],
                  timestamp: new Date()
                }
              );
            }
          }

          console.log(`Flagged episode ${episode._id} for potential fraud`);
        }
      }

      console.log(`Fraud detection complete: ${fraudDetected} episodes flagged`);
    } catch (error) {
      console.error('Error in fraud detection job:', error);
    }
  }

  // Job to update analytics and metrics
  async updateAnalyticsMetrics(): Promise<void> {
    try {
      console.log('Updating analytics metrics...');
      
      const { Campaign } = await import('../models/Campaign');
      const { CampaignAnalytics } = await import('../models/CampaignAnalytics');
      
      const activeCampaigns = await Campaign.find({ status: 'active' });

      for (const campaign of activeCampaigns) {
        try {
          const analytics = await this.dbService.getCampaignAnalytics(campaign._id.toString());
          
          if (analytics) {
            // Create or update daily analytics record
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            await CampaignAnalytics.findOneAndUpdate(
              {
                campaignId: campaign._id.toString(),
                date: today
              },
              {
                campaignId: campaign._id.toString(),
                date: today,
                views: analytics.totalViews,
                uniqueListeners: Math.floor(analytics.totalViews * 0.8), // Estimate
                engagementRate: analytics.averageQualityScore,
                conversionRate: analytics.conversionRate,
                qualityScore: analytics.averageQualityScore,
                spend: campaign.totalSpent || 0,
                revenue: 0, // Would need to track actual conversions
                impressions: analytics.totalImpressions,
                clicks: analytics.totalClicks,
                conversions: analytics.totalConversions,
                averageListenTime: 1800, // Estimate 30 minutes
                completionRate: 0.75, // Estimate
                costPerView: analytics.totalViews > 0 ? (campaign.totalSpent || 0) / analytics.totalViews : 0,
                costPerClick: analytics.totalClicks > 0 ? (campaign.totalSpent || 0) / analytics.totalClicks : 0,
                costPerConversion: analytics.totalConversions > 0 ? (campaign.totalSpent || 0) / analytics.totalConversions : 0,
                matchingAccuracy: 0.8, // Would need to track actual performance vs predictions
                contentQualityScore: analytics.averageQualityScore,
                verificationAccuracy: 0.9, // Would need to track verification accuracy
                userSatisfactionScore: 0.7, // Would need user feedback
                adNaturalnessScore: analytics.averageQualityScore,
                brandMentionQuality: analytics.averageQualityScore,
                audienceRelevanceScore: 0.8 // Would need audience analysis
              },
              { upsert: true }
            );
          }
        } catch (error) {
          console.error(`Error updating analytics for campaign ${campaign._id}:`, error);
        }
      }

      console.log(`Updated analytics for ${activeCampaigns.length} campaigns`);
    } catch (error) {
      console.error('Error in analytics update job:', error);
    }
  }

  // Job to clean up old data
  async cleanupOldData(): Promise<void> {
    try {
      console.log('Starting data cleanup...');
      
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      // Clean up old rejected ad placements
      const { AdPlacement } = await import('../models/AdPlacement');
      const deletedPlacements = await AdPlacement.deleteMany({
        status: 'rejected',
        createdAt: { $lt: thirtyDaysAgo }
      });

      // Clean up old analytics data (keep 90 days)
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      const { CampaignAnalytics } = await import('../models/CampaignAnalytics');
      const deletedAnalytics = await CampaignAnalytics.deleteMany({
        date: { $lt: ninetyDaysAgo }
      });

      console.log(`Cleanup complete: ${deletedPlacements.deletedCount} placements, ${deletedAnalytics.deletedCount} analytics records`);
    } catch (error) {
      console.error('Error in data cleanup job:', error);
    }
  }

  // Master job runner
  async runAllJobs(): Promise<void> {
    console.log('Starting AI automation jobs...');
    
    try {
      await Promise.allSettled([
        this.processPendingVerifications(),
        this.processAutomatedPayouts(),
        this.detectAndHandleFraud(),
        this.updateAnalyticsMetrics()
      ]);
      
      // Run cleanup less frequently
      if (Math.random() < 0.1) { // 10% chance
        await this.cleanupOldData();
      }
      
      console.log('AI automation jobs completed');
    } catch (error) {
      console.error('Error running automation jobs:', error);
    }
  }
}

// Singleton instance
let automationJobs: AIAutomationJobs | null = null;

export function getAutomationJobs(): AIAutomationJobs {
  if (!automationJobs) {
    automationJobs = new AIAutomationJobs();
  }
  return automationJobs;
}

// Function to start periodic job execution
export function startAutomationJobs(intervalMinutes: number = 5): NodeJS.Timeout {
  const jobs = getAutomationJobs();
  
  console.log(`Starting AI automation jobs with ${intervalMinutes} minute interval`);
  
  return setInterval(async () => {
    await jobs.runAllJobs();
  }, intervalMinutes * 60 * 1000);
}