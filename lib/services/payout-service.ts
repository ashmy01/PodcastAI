import { PayoutService } from '../ai/interfaces';
import { ViewData, PayoutResult, EarningsBreakdown, CreatorEarnings } from '../ai/types';
import { createContractService } from '../web3/contract-service';
import { AIDatabaseService } from '../ai/database-service';

export class AIPayoutService implements PayoutService {
  private contractService = createContractService();
  private dbService = new AIDatabaseService();

  async trackView(episodeId: string, userId: string): Promise<void> {
    try {
      // Update episode view count
      await this.dbService.updateEpisodeViews(episodeId, 1);
      
      // Update ad placement view counts for this episode
      const adPlacements = await this.dbService.getAdPlacementsByEpisode(episodeId);
      
      for (const placement of adPlacements) {
        if (placement.status === 'verified') {
          await this.dbService.updateAdPlacementViews(placement._id.toString(), 1);
        }
      }

      console.log(`Tracked view for episode ${episodeId} by user ${userId}`);
    } catch (error) {
      console.error('Error tracking view:', error);
      throw error;
    }
  }

  async processPayouts(campaignId: string, podcastId: string): Promise<PayoutResult> {
    try {
      // Get ad placements for this campaign and podcast
      const placements = await this.dbService.getAdPlacementsByCampaign(campaignId);
      const podcastPlacements = placements.filter(p => p.podcastId === podcastId && p.status === 'verified');
      
      if (podcastPlacements.length === 0) {
        throw new Error('No verified ad placements found for payout processing');
      }

      // Calculate total views to process
      let totalViews = 0;
      for (const placement of podcastPlacements) {
        // Only process views that haven't been paid out yet
        const unpaidViews = placement.viewCount - (placement.totalPaidOut || 0);
        totalViews += unpaidViews;
      }

      if (totalViews === 0) {
        return {
          transactionHash: '',
          creatorPayout: 0,
          platformFee: 0,
          totalViews: 0,
          success: true,
          error: 'No new views to process'
        };
      }

      // Process payout through smart contract
      const result = await this.contractService.processViews(
        parseInt(campaignId),
        podcastId,
        totalViews
      );

      if (result.success) {
        // Update campaign spending
        await this.dbService.updateCampaignSpending(campaignId, result.creatorPayout + result.platformFee);
        
        // Update ad placement payout tracking
        for (const placement of podcastPlacements) {
          const placementViews = placement.viewCount - (placement.totalPaidOut || 0);
          if (placementViews > 0) {
            await this.dbService.updateAdPlacementStatus(placement._id.toString(), 'paid');
          }
        }
      }

      return result;
    } catch (error) {
      console.error('Error processing payouts:', error);
      return {
        transactionHash: '',
        creatorPayout: 0,
        platformFee: 0,
        totalViews: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async validateViewAuthenticity(viewData: ViewData[]): Promise<ViewData[]> {
    return this.contractService.validateViewAuthenticity(viewData);
  }

  async calculateEarnings(views: number, payoutRate: number): Promise<EarningsBreakdown> {
    const totalEarnings = views * payoutRate;
    const platformFee = totalEarnings * 0.05; // 5% platform fee
    const creatorShare = totalEarnings - platformFee;

    return {
      totalEarnings,
      creatorShare,
      platformFee,
      viewCount: views,
      payoutRate
    };
  }

  async getCreatorEarnings(creatorId: string): Promise<CreatorEarnings> {
    try {
      // Get all podcasts owned by creator
      const { Podcast } = await import('../models/Podcast');
      const podcasts = await Podcast.find({ owner: creatorId });
      
      let totalEarnings = 0;
      let pendingPayouts = 0;
      let completedPayouts = 0;
      let activeCampaigns = 0;
      const monthlyEarnings: { [month: string]: number } = {};

      for (const podcast of podcasts) {
        const analytics = await this.dbService.getPodcastAnalytics(podcast._id.toString());
        if (analytics) {
          totalEarnings += analytics.totalEarnings;
        }

        // Get ad placements for this podcast
        const placements = await this.dbService.getAdPlacementsByEpisode(''); // This needs to be fixed to get by podcast
        
        for (const placement of placements) {
          if (placement.status === 'verified') {
            pendingPayouts += placement.viewCount * 0.01; // Estimate based on average payout rate
          } else if (placement.status === 'paid') {
            completedPayouts += placement.totalPayout || 0;
          }
          
          if (placement.status === 'verified' || placement.status === 'pending') {
            activeCampaigns++;
          }

          // Calculate monthly earnings
          const month = new Date(placement.createdAt).toISOString().slice(0, 7); // YYYY-MM format
          if (!monthlyEarnings[month]) {
            monthlyEarnings[month] = 0;
          }
          monthlyEarnings[month] += placement.totalPayout || 0;
        }
      }

      const averagePayoutRate = totalEarnings > 0 ? totalEarnings / podcasts.length : 0;

      return {
        totalEarnings,
        pendingPayouts,
        completedPayouts,
        activeCampaigns,
        averagePayoutRate,
        monthlyEarnings
      };
    } catch (error) {
      console.error('Error getting creator earnings:', error);
      return {
        totalEarnings: 0,
        pendingPayouts: 0,
        completedPayouts: 0,
        activeCampaigns: 0,
        averagePayoutRate: 0,
        monthlyEarnings: {}
      };
    }
  }

  // Batch processing for efficiency
  async processBatchPayouts(payouts: Array<{ campaignId: string; podcastId: string }>): Promise<PayoutResult[]> {
    const results: PayoutResult[] = [];
    
    for (const payout of payouts) {
      try {
        const result = await this.processPayouts(payout.campaignId, payout.podcastId);
        results.push(result);
        
        // Add delay between transactions to avoid nonce issues
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Error processing batch payout for campaign ${payout.campaignId}:`, error);
        results.push({
          transactionHash: '',
          creatorPayout: 0,
          platformFee: 0,
          totalViews: 0,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return results;
  }

  // Automated payout processing
  async processAutomatedPayouts(): Promise<void> {
    try {
      console.log('Starting automated payout processing...');
      
      // Find all verified ad placements with unpaid views
      const { AdPlacement } = await import('../models/AdPlacement');
      const placements = await AdPlacement.find({
        status: 'verified',
        viewCount: { $gt: 0 }
      });

      // Group by campaign and podcast
      const payoutGroups = new Map<string, { campaignId: string; podcastId: string; totalViews: number }>();
      
      for (const placement of placements) {
        const key = `${placement.campaignId}_${placement.podcastId}`;
        const unpaidViews = placement.viewCount - (placement.totalPaidOut || 0);
        
        if (unpaidViews > 0) {
          if (!payoutGroups.has(key)) {
            payoutGroups.set(key, {
              campaignId: placement.campaignId,
              podcastId: placement.podcastId,
              totalViews: 0
            });
          }
          
          const group = payoutGroups.get(key)!;
          group.totalViews += unpaidViews;
        }
      }

      // Process payouts for groups with sufficient views (minimum threshold)
      const minViewsForPayout = 10; // Minimum views before processing payout
      const payoutsToProcess = Array.from(payoutGroups.values())
        .filter(group => group.totalViews >= minViewsForPayout);

      console.log(`Processing ${payoutsToProcess.length} automated payouts`);

      const results = await this.processBatchPayouts(payoutsToProcess);
      const successfulPayouts = results.filter(r => r.success).length;
      
      console.log(`Automated payout processing complete: ${successfulPayouts}/${results.length} successful`);
    } catch (error) {
      console.error('Error in automated payout processing:', error);
    }
  }

  // View fraud detection
  async detectViewFraud(episodeId: string, timeWindow: number = 3600000): Promise<boolean> {
    try {
      // This is a simplified fraud detection - in production would be more sophisticated
      const { Episode } = await import('../models/Episode');
      const episode = await Episode.findById(episodeId);
      
      if (!episode) return false;

      // Check for suspicious view patterns
      const recentViews = episode.totalViews; // In production, would track timestamped views
      const episodeAge = Date.now() - episode.createdAt.getTime();
      
      // Flag if views are disproportionately high for episode age
      const maxExpectedViews = Math.max(100, episodeAge / (1000 * 60 * 60) * 50); // 50 views per hour max
      
      if (recentViews > maxExpectedViews) {
        console.warn(`Potential view fraud detected for episode ${episodeId}: ${recentViews} views in ${episodeAge}ms`);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error detecting view fraud:', error);
      return false;
    }
  }
}