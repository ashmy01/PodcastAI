import { NextRequest, NextResponse } from 'next/server';
import { SmartContractService } from '@/lib/services/smart-contract-service';
import { requireAuth, extractWalletAddress } from '@/lib/auth-middleware';

const contractService = new SmartContractService();

export async function GET(req: NextRequest) {
  // Check authentication
  const authError = requireAuth(req);
  if (authError) return authError;

  const walletAddress = extractWalletAddress(req);
  if (!walletAddress) {
    return NextResponse.json({ message: 'Wallet address is required' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const currency = searchParams.get('currency') || 'ETH';

  try {
    // Get wallet balance
    const balance = await contractService.getWalletBalance(walletAddress, currency);
    
    // Get recent transactions (payout history)
    const payoutHistory = await contractService.getPayoutHistory(walletAddress);
    
    return NextResponse.json({
      address: walletAddress,
      formattedAddress: contractService.formatAddress(walletAddress),
      balance,
      formattedBalance: contractService.formatCurrency(balance, currency),
      currency,
      recentTransactions: payoutHistory.slice(0, 5) // Last 5 transactions
    });

  } catch (error: any) {
    console.error('Wallet info error:', error);
    return NextResponse.json({ 
      message: 'Failed to fetch wallet information', 
      error: error.message 
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { action } = await req.json();

    switch (action) {
      case 'connect':
        // Connect wallet
        const address = await contractService.connectWallet();
        return NextResponse.json({
          address,
          formattedAddress: contractService.formatAddress(address),
          message: 'Wallet connected successfully'
        });

      case 'disconnect':
        // Disconnect wallet (client-side action, just return success)
        return NextResponse.json({
          message: 'Wallet disconnected successfully'
        });

      default:
        return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
    }

  } catch (error: any) {
    console.error('Wallet action error:', error);
    return NextResponse.json({ 
      message: 'Wallet action failed', 
      error: error.message 
    }, { status: 500 });
  }
}