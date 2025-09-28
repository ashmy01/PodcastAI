import { NextRequest, NextResponse } from 'next/server';
import { SmartContractService } from '@/lib/services/smart-contract-service';
import { requireAuth, extractWalletAddress } from '@/lib/auth-middleware';
import { Campaign } from '@/lib/models/Campaign';
import dbConnect from '@/lib/db';

const contractService = new SmartContractService();

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const campaignId = params.id;
    
    // Get contract details for the campaign
    const contractDetails = await contractService.getCampaignContract(campaignId);
    
    // Get escrow balance
    const escrowBalance = await contractService.getEscrowBalance(contractDetails.address);
    
    return NextResponse.json({
      contract: contractDetails,
      escrowBalance,
      formattedBalance: contractService.formatCurrency(escrowBalance, contractDetails.currency)
    });

  } catch (error: any) {
    console.error('Contract details error:', error);
    return NextResponse.json({ 
      message: 'Failed to fetch contract details', 
      error: error.message 
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  // Check authentication
  const authError = requireAuth(req);
  if (authError) return authError;

  const walletAddress = extractWalletAddress(req);
  if (!walletAddress) {
    return NextResponse.json({ message: 'Wallet address is required' }, { status: 401 });
  }

  try {
    await dbConnect();
    
    const campaignId = params.id;
    const { action, amount } = await req.json();

    // Verify campaign ownership
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return NextResponse.json({ message: 'Campaign not found' }, { status: 404 });
    }

    if (campaign.brandId !== walletAddress) {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 });
    }

    let result;
    
    switch (action) {
      case 'create':
        // Create new contract for campaign
        const contractAddress = await contractService.createCampaignContract(campaign);
        
        // Update campaign with contract address
        campaign.contractAddress = contractAddress;
        await campaign.save();
        
        result = { contractAddress, message: 'Contract created successfully' };
        break;

      case 'updateStatus':
        const { status } = await req.json();
        const txHash = await contractService.updateCampaignStatus(campaign.contractAddress!, status);
        result = { transactionHash: txHash, message: 'Status updated successfully' };
        break;

      case 'withdraw':
        if (!amount) {
          return NextResponse.json({ message: 'Amount is required for withdrawal' }, { status: 400 });
        }
        const withdrawTxHash = await contractService.withdrawFunds(campaign.contractAddress!, amount);
        result = { transactionHash: withdrawTxHash, message: 'Withdrawal initiated successfully' };
        break;

      default:
        return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Contract action error:', error);
    return NextResponse.json({ 
      message: 'Contract action failed', 
      error: error.message 
    }, { status: 500 });
  }
}