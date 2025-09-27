import { NextRequest, NextResponse } from 'next/server';
import { AIVerificationAgent } from '@/lib/ai/verification-agent';
import { createContractService } from '@/lib/web3/contract-service';
import { AIDatabaseService } from '@/lib/ai/database-service';
import { requireAuth, extractWalletAddress } from '@/lib/auth-middleware';

export async function POST(req: NextRequest) {
  // Check authentication
  const authError = requireAuth(req);
  if (authError) return authError;

  const walletAddress = extractWalletAddress(req);
  if (!walletAddress) {
    return NextResponse.json({ message: 'Wallet address is required' }, { status: 401 });
  }

  try {
    const { episodeId, campaignId } = await req.json();

    if (!episodeId || !campaignId) {
      return NextResponse.json({ 
        message: 'Episode ID and Campaign ID are required' 
      }, { status: 400 });
    }

    // Initialize services
    const verificationAgent = new AIVerificationAgent();
    const contractService = createContractService();
    const dbService = new AIDatabaseService();

    // Verify the ad placement using AI
    const verificationResult = await verificationAgent.verifyAdPlacement(episodeId, campaignId);

    if (verificationResult.verified) {
      try {
        // Call smart contract to verify the ad placement
        const txHash = await contractService.verifyAdPlacement(
          parseInt(campaignId),
          episodeId
        );

        // Update database with verification result
        const placements = await dbService.getAdPlacementsByEpisode(episodeId);
        const placement = placements.find(p => p.campaignId === campaignId);
        
        if (placement) {
          await dbService.updateAdPlacementStatus(
            placement._id.toString(),
            'verified',
            verificationResult
          );
        }

        return NextResponse.json({
          success: true,
          verified: true,
          transactionHash: txHash,
          verificationResult,
          message: 'Ad placement verified successfully'
        });

      } catch (contractError) {
        console.error('Smart contract verification failed:', contractError);
        
        // Still update database with AI verification result
        const placements = await dbService.getAdPlacementsByEpisode(episodeId);
        const placement = placements.find(p => p.campaignId === campaignId);
        
        if (placement) {
          await dbService.updateAdPlacementStatus(
            placement._id.toString(),
            'pending',
            verificationResult
          );
        }

        return NextResponse.json({
          success: false,
          verified: true,
          verificationResult,
          error: 'AI verification passed but smart contract call failed',
          message: 'Verification pending - will retry smart contract call'
        }, { status: 500 });
      }

    } else {
      // Ad placement failed verification
      const placements = await dbService.getAdPlacementsByEpisode(episodeId);
      const placement = placements.find(p => p.campaignId === campaignId);
      
      if (placement) {
        await dbService.updateAdPlacementStatus(
          placement._id.toString(),
          'rejected',
          verificationResult
        );
      }

      return NextResponse.json({
        success: false,
        verified: false,
        verificationResult,
        message: 'Ad placement failed verification'
      }, { status: 400 });
    }

  } catch (error: any) {
    console.error('Error in ad verification:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to verify ad placement',
      error: error.message
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  // Check authentication
  const authError = requireAuth(req);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(req.url);
    const episodeId = searchParams.get('episodeId');
    const campaignId = searchParams.get('campaignId');

    if (!episodeId || !campaignId) {
      return NextResponse.json({ 
        message: 'Episode ID and Campaign ID are required' 
      }, { status: 400 });
    }

    const dbService = new AIDatabaseService();
    const placements = await dbService.getAdPlacementsByEpisode(episodeId);
    const placement = placements.find(p => p.campaignId === campaignId);

    if (!placement) {
      return NextResponse.json({ 
        message: 'Ad placement not found' 
      }, { status: 404 });
    }

    return NextResponse.json({
      placement: {
        id: placement._id,
        campaignId: placement.campaignId,
        podcastId: placement.podcastId,
        episodeId: placement.episodeId,
        status: placement.status,
        qualityScore: placement.qualityScore,
        verificationResult: placement.verificationResult,
        viewCount: placement.viewCount,
        totalPayout: placement.totalPayout,
        createdAt: placement.createdAt,
        verifiedAt: placement.verifiedAt
      }
    });

  } catch (error: any) {
    console.error('Error fetching ad placement:', error);
    return NextResponse.json({
      message: 'Failed to fetch ad placement',
      error: error.message
    }, { status: 500 });
  }
}