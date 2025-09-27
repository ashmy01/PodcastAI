import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Campaign } from '@/lib/models/Campaign';
import { requireAuth, extractWalletAddress } from '@/lib/auth-middleware';
import { AIDatabaseService } from '@/lib/ai/database-service';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  await dbConnect();

  // Check authentication
  const authError = requireAuth(req);
  if (authError) return authError;

  const walletAddress = extractWalletAddress(req);
  if (!walletAddress) {
    return NextResponse.json({ message: 'Wallet address is required' }, { status: 401 });
  }

  try {
    const campaignId = params.id;
    const campaign = await Campaign.findById(campaignId);

    if (!campaign) {
      return NextResponse.json({ message: 'Campaign not found' }, { status: 404 });
    }

    // Check ownership
    if (campaign.brandId !== walletAddress) {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 });
    }

    // Get detailed analytics
    const dbService = new AIDatabaseService();
    const analytics = await dbService.getCampaignAnalytics(campaignId);
    const adPlacements = await dbService.getAdPlacementsByCampaign(campaignId);

    return NextResponse.json({
      campaign: campaign.toObject(),
      analytics,
      adPlacements: adPlacements.map(placement => ({
        id: placement._id,
        podcastId: placement.podcastId,
        episodeId: placement.episodeId,
        status: placement.status,
        qualityScore: placement.qualityScore,
        viewCount: placement.viewCount,
        totalPayout: placement.totalPayout,
        createdAt: placement.createdAt,
        verifiedAt: placement.verifiedAt
      }))
    });

  } catch (error: any) {
    console.error('Failed to fetch campaign:', error);
    return NextResponse.json({ 
      message: 'Failed to fetch campaign', 
      error: error.message 
    }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  await dbConnect();

  // Check authentication
  const authError = requireAuth(req);
  if (authError) return authError;

  const walletAddress = extractWalletAddress(req);
  if (!walletAddress) {
    return NextResponse.json({ message: 'Wallet address is required' }, { status: 401 });
  }

  try {
    const campaignId = params.id;
    const updates = await req.json();

    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return NextResponse.json({ message: 'Campaign not found' }, { status: 404 });
    }

    // Check ownership
    if (campaign.brandId !== walletAddress) {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 });
    }

    // Only allow certain fields to be updated
    const allowedUpdates = [
      'description',
      'targetAudience',
      'requirements',
      'status',
      'aiMatchingEnabled',
      'contentGenerationRules',
      'verificationCriteria',
      'qualityThreshold'
    ];

    const updateData: any = {};
    for (const key of allowedUpdates) {
      if (updates[key] !== undefined) {
        updateData[key] = updates[key];
      }
    }

    const updatedCampaign = await Campaign.findByIdAndUpdate(
      campaignId,
      updateData,
      { new: true, runValidators: true }
    );

    return NextResponse.json({
      campaign: updatedCampaign,
      message: 'Campaign updated successfully'
    });

  } catch (error: any) {
    console.error('Failed to update campaign:', error);
    return NextResponse.json({ 
      message: 'Failed to update campaign', 
      error: error.message 
    }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  await dbConnect();

  // Check authentication
  const authError = requireAuth(req);
  if (authError) return authError;

  const walletAddress = extractWalletAddress(req);
  if (!walletAddress) {
    return NextResponse.json({ message: 'Wallet address is required' }, { status: 401 });
  }

  try {
    const campaignId = params.id;
    const campaign = await Campaign.findById(campaignId);

    if (!campaign) {
      return NextResponse.json({ message: 'Campaign not found' }, { status: 404 });
    }

    // Check ownership
    if (campaign.brandId !== walletAddress) {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 });
    }

    // Only allow deletion if campaign is not active or has no ad placements
    const dbService = new AIDatabaseService();
    const adPlacements = await dbService.getAdPlacementsByCampaign(campaignId);
    
    if (campaign.status === 'active' && adPlacements.length > 0) {
      return NextResponse.json({ 
        message: 'Cannot delete active campaign with existing ad placements. Please pause the campaign first.' 
      }, { status: 400 });
    }

    // Soft delete by setting status to cancelled
    campaign.status = 'cancelled';
    await campaign.save();

    return NextResponse.json({
      message: 'Campaign cancelled successfully'
    });

  } catch (error: any) {
    console.error('Failed to delete campaign:', error);
    return NextResponse.json({ 
      message: 'Failed to delete campaign', 
      error: error.message 
    }, { status: 500 });
  }
}