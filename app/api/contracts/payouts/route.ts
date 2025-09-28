import { NextRequest, NextResponse } from 'next/server';
import { SmartContractService } from '@/lib/services/smart-contract-service';
import { requireAuth, extractWalletAddress } from '@/lib/auth-middleware';
import { AdPlacement } from '@/lib/models/AdPlacement';
import { Campaign } from '@/lib/models/Campaign';
import dbConnect from '@/lib/db';

const contractService = new SmartContractService();

export async function GET(req: NextRequest) {
  // Check authentication
  const authError = requireAuth(req);
  if (authError) return authError;

  const walletAddress = extractWalletAddress(req);
  if (!walletAddress) {
    return NextResponse.json({ message: 'Wallet address is required' }, { status: 401 });
  }

  try {
    // Get payout history for the wallet
    const payoutHistory = await contractService.getPayoutHistory(walletAddress);
    
    return NextResponse.json({
      payouts: payoutHistory,
      totalEarnings: payoutHistory.reduce((sum, payout) => sum + payout.amount, 0)
    });

  } catch (error: any) {
    console.error('Payout history error:', error);
    return NextResponse.json({ 
      message: 'Failed to fetch payout history', 
      error: error.message 
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  // Check authentication
  const authError = requireAuth(req);
  if (authError) return authError;

  const walletAddress = extractWalletAddress(req);
  if (!walletAddress) {
    return NextResponse.json({ message: 'Wallet address is required' }, { status: 401 });
  }

  try {
    await dbConnect();
    
    const { placementId, amount } = await req.json();

    if (!placementId || !amount) {
      return NextResponse.json({ message: 'Placement ID and amount are required' }, { status: 400 });
    }

    // Verify ad placement
    const placement = await AdPlacement.findById(placementId);
    if (!placement) {
      return NextResponse.json({ message: 'Ad placement not found' }, { status: 404 });
    }

    // Verify placement is verified and ready for payout
    if (placement.status !== 'verified') {
      return NextResponse.json({ message: 'Ad placement must be verified before payout' }, { status: 400 });
    }

    // Get campaign details
    const campaign = await Campaign.findById(placement.campaignId);
    if (!campaign) {
      return NextResponse.json({ message: 'Campaign not found' }, { status: 404 });
    }

    // Verify brand ownership
    if (campaign.brandId !== walletAddress) {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 });
    }

    // Process payment through smart contract
    const transactionHash = await contractService.processPayment(placementId, amount);

    // Update placement status
    placement.status = 'paid';
    placement.totalPayout = amount;
    await placement.save();

    // Update campaign spending
    campaign.totalSpent = (campaign.totalSpent || 0) + amount;
    await campaign.save();

    return NextResponse.json({
      transactionHash,
      amount,
      currency: campaign.currency,
      message: 'Payment processed successfully'
    });

  } catch (error: any) {
    console.error('Payout processing error:', error);
    return NextResponse.json({ 
      message: 'Payout processing failed', 
      error: error.message 
    }, { status: 500 });
  }
}