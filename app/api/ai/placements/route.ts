import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { AdPlacement } from '@/lib/models/AdPlacement';
import { Episode } from '@/lib/models/Episode';
import { requireAuth, extractWalletAddress } from '@/lib/auth-middleware';

export async function GET(req: NextRequest) {
  await dbConnect();

  // Check authentication
  const authError = requireAuth(req);
  if (authError) return authError;

  const walletAddress = extractWalletAddress(req);
  if (!walletAddress) {
    return NextResponse.json({ message: 'Wallet address is required' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const owner = searchParams.get('owner');
    const episodeId = searchParams.get('episodeId');
    const campaignId = searchParams.get('campaignId');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Build query based on parameters
    let query: any = {};

    if (owner) {
      // Find episodes owned by this user first
      const episodes = await Episode.find({ owner }).select('_id');
      const episodeIds = episodes.map(ep => ep._id.toString());
      query.episodeId = { $in: episodeIds };
    }

    if (episodeId) {
      query.episodeId = episodeId;
    }

    if (campaignId) {
      query.campaignId = campaignId;
    }

    if (status) {
      query.status = status;
    }

    // Fetch ad placements
    const placements = await AdPlacement.find(query)
      .sort({ createdAt: -1 })
      .limit(limit);

    // Get additional details for each placement
    const detailedPlacements = await Promise.all(
      placements.map(async (placement) => {
        try {
          // Get episode details
          const episode = await Episode.findById(placement.episodeId).select('title podcast');
          
          return {
            id: placement._id,
            campaignId: placement.campaignId,
            podcastId: placement.podcastId,
            episodeId: placement.episodeId,
            episodeTitle: episode?.title || 'Unknown Episode',
            status: placement.status,
            qualityScore: placement.qualityScore,
            viewCount: placement.viewCount,
            totalPayout: placement.totalPayout,
            impressions: placement.impressions,
            clicks: placement.clicks,
            conversions: placement.conversions,
            createdAt: placement.createdAt,
            verifiedAt: placement.verifiedAt,
            adContent: {
              placement: placement.adContent?.placement,
              duration: placement.adContent?.duration
            }
          };
        } catch (error) {
          console.error(`Error fetching details for placement ${placement._id}:`, error);
          return {
            id: placement._id,
            campaignId: placement.campaignId,
            podcastId: placement.podcastId,
            episodeId: placement.episodeId,
            episodeTitle: 'Unknown Episode',
            status: placement.status,
            qualityScore: placement.qualityScore,
            viewCount: placement.viewCount,
            totalPayout: placement.totalPayout,
            impressions: placement.impressions || 0,
            clicks: placement.clicks || 0,
            conversions: placement.conversions || 0,
            createdAt: placement.createdAt,
            verifiedAt: placement.verifiedAt,
            adContent: {
              placement: placement.adContent?.placement || 'mid-roll',
              duration: placement.adContent?.duration || 30
            }
          };
        }
      })
    );

    // Calculate summary statistics
    const summary = {
      totalPlacements: detailedPlacements.length,
      verifiedPlacements: detailedPlacements.filter(p => p.status === 'verified').length,
      pendingPlacements: detailedPlacements.filter(p => p.status === 'pending').length,
      rejectedPlacements: detailedPlacements.filter(p => p.status === 'rejected').length,
      paidPlacements: detailedPlacements.filter(p => p.status === 'paid').length,
      totalViews: detailedPlacements.reduce((sum, p) => sum + p.viewCount, 0),
      totalEarnings: detailedPlacements.reduce((sum, p) => sum + p.totalPayout, 0),
      averageQuality: detailedPlacements.length > 0 
        ? detailedPlacements.reduce((sum, p) => sum + p.qualityScore, 0) / detailedPlacements.length 
        : 0
    };

    return NextResponse.json({
      placements: detailedPlacements,
      summary,
      total: detailedPlacements.length
    });

  } catch (error: any) {
    console.error('Error fetching ad placements:', error);
    return NextResponse.json({
      message: 'Failed to fetch ad placements',
      error: error.message
    }, { status: 500 });
  }
}