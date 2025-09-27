import { NextRequest, NextResponse } from 'next/server';
import { AIPayoutService } from '@/lib/services/payout-service';
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
    const { campaignId, podcastId } = await req.json();

    if (!campaignId || !podcastId) {
      return NextResponse.json({ 
        message: 'Campaign ID and Podcast ID are required' 
      }, { status: 400 });
    }

    const payoutService = new AIPayoutService();
    
    // Process the payout
    const result = await payoutService.processPayouts(campaignId, podcastId);

    if (result.success) {
      return NextResponse.json({
        success: true,
        result,
        message: `Payout processed successfully. Creator earned: ${result.creatorPayout} ETH`
      });
    } else {
      return NextResponse.json({
        success: false,
        result,
        message: result.error || 'Payout processing failed'
      }, { status: 400 });
    }

  } catch (error: any) {
    console.error('Error processing payout:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to process payout',
      error: error.message
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  // Check authentication
  const authError = requireAuth(req);
  if (authError) return authError;

  const walletAddress = extractWalletAddress(req);
  if (!walletAddress) {
    return NextResponse.json({ message: 'Wallet address is required' }, { status: 401 });
  }

  try {
    const payoutService = new AIPayoutService();
    
    // Get creator earnings
    const earnings = await payoutService.getCreatorEarnings(walletAddress);

    return NextResponse.json({
      success: true,
      earnings,
      message: 'Creator earnings retrieved successfully'
    });

  } catch (error: any) {
    console.error('Error fetching creator earnings:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch creator earnings',
      error: error.message
    }, { status: 500 });
  }
}