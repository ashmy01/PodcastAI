import { ethers } from 'ethers';
import { PayoutResult, ViewData } from '../ai/types';

// Contract ABI - extracted from the Solidity contract
const CONTRACT_ABI = [
  "function verifyAdPlacement(uint256 _campaignId, string calldata _podcastId) external",
  "function processViews(uint256 _campaignId, string calldata _podcastId, uint256 _viewCount) external",
  "function getCampaign(uint256 _campaignId) external view returns (address brand, uint256 budget, uint256 remainingBudget, uint256 payoutPerView, bool active)",
  "function getPodcast(string calldata _podcastId) external view returns (address creator, bool verified, uint256 monthlyFee, bool subscriptionEnabled)",
  "function getAdPlacement(uint256 _campaignId, string calldata _podcastId) external view returns (bool verified, uint256 totalViews, uint256 totalPaidOut)",
  "event AdVerified(uint256 indexed campaignId, string indexed podcastId)",
  "event ViewPayout(uint256 indexed campaignId, string indexed podcastId, uint256 views, uint256 totalPayout)"
];

export interface ContractConfig {
  contractAddress: string;
  privateKey: string;
  rpcUrl: string;
  gasLimit?: number;
  gasPrice?: string;
}

export class Web3ContractService {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private contract: ethers.Contract;
  private config: ContractConfig;

  constructor(config: ContractConfig) {
    this.config = {
      gasLimit: 500000,
      gasPrice: '20000000000', // 20 gwei
      ...config
    };

    this.provider = new ethers.JsonRpcProvider(this.config.rpcUrl);
    this.wallet = new ethers.Wallet(this.config.privateKey, this.provider);
    this.contract = new ethers.Contract(
      this.config.contractAddress,
      CONTRACT_ABI,
      this.wallet
    );
  }

  async verifyAdPlacement(campaignId: number, podcastId: string): Promise<string> {
    try {
      console.log(`Verifying ad placement for campaign ${campaignId}, podcast ${podcastId}`);
      
      const tx = await this.contract.verifyAdPlacement(campaignId, podcastId, {
        gasLimit: this.config.gasLimit,
        gasPrice: this.config.gasPrice
      });

      console.log(`Verification transaction sent: ${tx.hash}`);
      const receipt = await tx.wait();
      
      console.log(`Ad placement verified. Gas used: ${receipt.gasUsed}`);
      return tx.hash;

    } catch (error) {
      console.error('Error verifying ad placement:', error);
      throw new Error(`Failed to verify ad placement: ${error}`);
    }
  }

  async processViews(campaignId: number, podcastId: string, viewCount: number): Promise<PayoutResult> {
    try {
      console.log(`Processing ${viewCount} views for campaign ${campaignId}, podcast ${podcastId}`);
      
      // Check if ad placement is verified first
      const placement = await this.getAdPlacement(campaignId, podcastId);
      if (!placement.verified) {
        throw new Error('Ad placement must be verified before processing payouts');
      }

      // Get campaign details to calculate payout
      const campaign = await this.getCampaign(campaignId);
      if (!campaign.active) {
        throw new Error('Campaign is not active');
      }

      const totalPayout = BigInt(campaign.payoutPerView) * BigInt(viewCount);
      if (campaign.remainingBudget < totalPayout) {
        throw new Error('Insufficient campaign budget for payout');
      }

      // Execute the transaction
      const tx = await this.contract.processViews(campaignId, podcastId, viewCount, {
        gasLimit: this.config.gasLimit,
        gasPrice: this.config.gasPrice
      });

      console.log(`Payout transaction sent: ${tx.hash}`);
      const receipt = await tx.wait();

      // Calculate payout breakdown (5% platform fee)
      const totalPayoutNumber = Number(ethers.formatEther(totalPayout));
      const platformFee = totalPayoutNumber * 0.05;
      const creatorPayout = totalPayoutNumber - platformFee;

      const result: PayoutResult = {
        transactionHash: tx.hash,
        creatorPayout,
        platformFee,
        totalViews: viewCount,
        success: true,
        gasUsed: Number(receipt.gasUsed)
      };

      console.log(`Views processed successfully. Creator payout: ${creatorPayout}, Platform fee: ${platformFee}`);
      return result;

    } catch (error) {
      console.error('Error processing views:', error);
      
      return {
        transactionHash: '',
        creatorPayout: 0,
        platformFee: 0,
        totalViews: viewCount,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async getCampaign(campaignId: number): Promise<{
    brand: string;
    budget: bigint;
    remainingBudget: bigint;
    payoutPerView: bigint;
    active: boolean;
  }> {
    try {
      const result = await this.contract.getCampaign(campaignId);
      return {
        brand: result[0],
        budget: result[1],
        remainingBudget: result[2],
        payoutPerView: result[3],
        active: result[4]
      };
    } catch (error) {
      console.error('Error fetching campaign:', error);
      throw error;
    }
  }

  async getPodcast(podcastId: string): Promise<{
    creator: string;
    verified: boolean;
    monthlyFee: bigint;
    subscriptionEnabled: boolean;
  }> {
    try {
      const result = await this.contract.getPodcast(podcastId);
      return {
        creator: result[0],
        verified: result[1],
        monthlyFee: result[2],
        subscriptionEnabled: result[3]
      };
    } catch (error) {
      console.error('Error fetching podcast:', error);
      throw error;
    }
  }

  async getAdPlacement(campaignId: number, podcastId: string): Promise<{
    verified: boolean;
    totalViews: bigint;
    totalPaidOut: bigint;
  }> {
    try {
      const result = await this.contract.getAdPlacement(campaignId, podcastId);
      return {
        verified: result[0],
        totalViews: result[1],
        totalPaidOut: result[2]
      };
    } catch (error) {
      console.error('Error fetching ad placement:', error);
      throw error;
    }
  }

  async validateViewAuthenticity(viewData: ViewData[]): Promise<ViewData[]> {
    // Basic fraud detection - in production this would be more sophisticated
    const validViews: ViewData[] = [];
    const seenIPs = new Set<string>();
    const seenUsers = new Set<string>();

    for (const view of viewData) {
      let isValid = true;

      // Check for duplicate IPs (simple bot detection)
      if (seenIPs.has(view.ipAddress)) {
        console.warn(`Duplicate IP detected: ${view.ipAddress}`);
        isValid = false;
      }

      // Check for duplicate users in short time frame
      const userKey = `${view.userId}_${Math.floor(view.timestamp.getTime() / (1000 * 60 * 5))}`; // 5-minute windows
      if (seenUsers.has(userKey)) {
        console.warn(`Duplicate user view in short timeframe: ${view.userId}`);
        isValid = false;
      }

      // Check if view duration is reasonable
      if (view.duration < 10) { // Less than 10 seconds
        console.warn(`Suspiciously short view duration: ${view.duration}s`);
        isValid = false;
      }

      // Check user agent for bot patterns
      if (this.isSuspiciousUserAgent(view.userAgent)) {
        console.warn(`Suspicious user agent: ${view.userAgent}`);
        isValid = false;
      }

      if (isValid) {
        validViews.push(view);
        seenIPs.add(view.ipAddress);
        seenUsers.add(userKey);
      }
    }

    console.log(`Validated ${validViews.length}/${viewData.length} views`);
    return validViews;
  }

  private isSuspiciousUserAgent(userAgent: string): boolean {
    const botPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /curl/i,
      /wget/i,
      /python/i,
      /requests/i
    ];

    return botPatterns.some(pattern => pattern.test(userAgent));
  }

  async estimateGas(method: string, params: any[]): Promise<bigint> {
    try {
      switch (method) {
        case 'verifyAdPlacement':
          return await this.contract.verifyAdPlacement.estimateGas(...params);
        case 'processViews':
          return await this.contract.processViews.estimateGas(...params);
        default:
          return BigInt(this.config.gasLimit || 500000);
      }
    } catch (error) {
      console.error('Error estimating gas:', error);
      return BigInt(this.config.gasLimit || 500000);
    }
  }

  async getCurrentGasPrice(): Promise<bigint> {
    try {
      const feeData = await this.provider.getFeeData();
      return feeData.gasPrice || BigInt(this.config.gasPrice || '20000000000');
    } catch (error) {
      console.error('Error fetching gas price:', error);
      return BigInt(this.config.gasPrice || '20000000000');
    }
  }

  async getBalance(): Promise<string> {
    try {
      const balance = await this.provider.getBalance(this.wallet.address);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('Error fetching balance:', error);
      return '0';
    }
  }

  // Event listening methods
  setupEventListeners(): void {
    this.contract.on('AdVerified', (campaignId, podcastId, event) => {
      console.log(`Ad verified event: Campaign ${campaignId}, Podcast ${podcastId}`);
      this.handleAdVerifiedEvent(campaignId, podcastId, event);
    });

    this.contract.on('ViewPayout', (campaignId, podcastId, views, totalPayout, event) => {
      console.log(`View payout event: Campaign ${campaignId}, Podcast ${podcastId}, Views: ${views}, Payout: ${totalPayout}`);
      this.handleViewPayoutEvent(campaignId, podcastId, views, totalPayout, event);
    });
  }

  private async handleAdVerifiedEvent(campaignId: bigint, podcastId: string, event: any): Promise<void> {
    try {
      // Update database with verification status
      const { AIDatabaseService } = await import('../ai/database-service');
      const dbService = new AIDatabaseService();
      
      const placements = await dbService.getAdPlacementsByCampaign(campaignId.toString());
      const placement = placements.find(p => p.podcastId === podcastId);
      
      if (placement) {
        await dbService.updateAdPlacementStatus(placement._id, 'verified');
      }
    } catch (error) {
      console.error('Error handling AdVerified event:', error);
    }
  }

  private async handleViewPayoutEvent(
    campaignId: bigint, 
    podcastId: string, 
    views: bigint, 
    totalPayout: bigint, 
    event: any
  ): Promise<void> {
    try {
      // Update database with payout information
      const { AIDatabaseService } = await import('../ai/database-service');
      const dbService = new AIDatabaseService();
      
      const placements = await dbService.getAdPlacementsByCampaign(campaignId.toString());
      const placement = placements.find(p => p.podcastId === podcastId);
      
      if (placement) {
        await dbService.updateAdPlacementStatus(placement._id, 'paid');
        
        // Update episode earnings
        if (placement.episodeId) {
          const payoutAmount = Number(ethers.formatEther(totalPayout)) * 0.95; // Creator's share
          await dbService.updateEpisodeEarnings(placement.episodeId, payoutAmount);
        }
      }
    } catch (error) {
      console.error('Error handling ViewPayout event:', error);
    }
  }

  removeEventListeners(): void {
    this.contract.removeAllListeners();
  }
}

// Factory function to create contract service with environment config
export function createContractService(): Web3ContractService {
  const config: ContractConfig = {
    contractAddress: process.env.CONTRACT_ADDRESS || '',
    privateKey: process.env.PRIVATE_KEY || '',
    rpcUrl: process.env.RPC_URL || process.env.NEXT_PUBLIC_RPC_URL || 'https://polygon-mainnet.g.alchemy.com/v2/demo',
    gasLimit: parseInt(process.env.GAS_LIMIT || '500000'),
    gasPrice: process.env.GAS_PRICE || '20000000000'
  };

  if (!config.contractAddress) {
    console.warn('CONTRACT_ADDRESS not set, using demo address');
    config.contractAddress = '0x1234567890123456789012345678901234567890'; // Demo address
  }

  if (!config.privateKey) {
    console.warn('PRIVATE_KEY not set, contract interactions will fail');
    config.privateKey = '0x0000000000000000000000000000000000000000000000000000000000000001'; // Demo key
  }

  return new Web3ContractService(config);
}