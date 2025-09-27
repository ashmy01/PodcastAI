import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Campaign } from '@/lib/models/Campaign';
import { requireAuth, extractWalletAddress } from '@/lib/auth-middleware';
import { AIMatchingAgent } from '@/lib/ai/matching-agent';

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

    if (!campaign.aiMatchingEnabled) {
      return NextResponse.json({ 
        message: 'AI matching is not enabled for this campaign' 
      }, { status: 400 });
    }

    // Find matches using AI
    const matchingAgent = new AIMatchingAgent();
    const matches = await matchingAgent.findMatches(campaignId);

    // Get additional details for each match
    const { Podcast } = await import('@/lib/models/Podcast');
    const detailedMatches = await Promise.all(
      matches.map(async (match) => {
        try {
          const podcast = await Podcast.findById(match.podcastId);
          return {
            ...match,
            podcast: podcast ? {
              id: podcast._id,
              title: podcast.title,
              description: podcast.description,
              owner: podcast.owner,
              topics: podcast.topics,
              totalViews: podcast.totalViews || 0,
              qualityScore: podcast.qualityScore || 0.5,
              averageEngagement: podcast.averageEngagement || 0.5
            } : null
          };
        } catch (error) {
          console.error(`Error fetching podcast details for ${match.podcastId}:`, error);
          return {
            ...match,
            podcast: null
          };
        }
      })
    );

    return NextResponse.json({
      campaignId,
      matches: detailedMatches.filter(match => match.podcast !== null),
      totalMatches: detailedMatches.length,
      message: 'Matches found successfully'
    });

  } catch (error: any) {
    console.error('Failed to find campaign matches:', error);
    return NextResponse.json({ 
      message: 'Failed to find campaign matches', 
      error: error.message 
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
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
    const { podcastId, action } = await req.json();

    if (!podcastId || !action) {
      return NextResponse.json({ 
        message: 'Podcast ID and action are required' 
      }, { status: 400 });
    }

    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return NextResponse.json({ message: 'Campaign not found' }, { status: 404 });
    }

    // Check ownership
    if (campaign.brandId !== walletAddress) {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 });
    }

    // Handle different actions
    switch (action) {
      case 'accept':
        // Add to matched podcasts
        const existingMatch = campaign.matchedPodcasts.find(
          (match: any) => match.podcastId === podcastId
        );

        if (existingMatch) {
          existingMatch.status = 'accepted';
          existingMatch.matchedAt = new Date();
        } else {
          // Get compatibility score
          const matchingAgent = new AIMatchingAgent();
          const { Podcast } = await import('@/lib/models/Podcast');
          const podcast = await Podcast.findById(podcastId);
          
          if (!podcast) {
            return NextResponse.json({ message: 'Podcast not found' }, { status: 404 });
          }

          const score = await matchingAgent.scoreCompatibility(
            campaign.toObject(),
            podcast.toObject()
          );

          campaign.matchedPodcasts.push({
            podcastId,
            matchScore: score,
            status: 'accepted',
            matchedAt: new Date()
          });
        }
        break;

      case 'reject':
        // Update status to rejected
        const matchToReject = campaign.matchedPodcasts.find(
          (match: any) => match.podcastId === podcastId
        );

        if (matchToReject) {
          matchToReject.status = 'rejected';
        } else {
          campaign.matchedPodcasts.push({
            podcastId,
            matchScore: 0,
            status: 'rejected',
            matchedAt: new Date()
          });
        }
        break;

      default:
        return NextResponse.json({ 
          message: 'Invalid action. Use "accept" or "reject"' 
        }, { status: 400 });
    }

    await campaign.save();

    return NextResponse.json({
      message: `Podcast ${action}ed successfully`,
      matchedPodcasts: campaign.matchedPodcasts
    });

  } catch (error: any) {
    console.error('Failed to update campaign match:', error);
    return NextResponse.json({ 
      message: 'Failed to update campaign match', 
      error: error.message 
    }, { status: 500 });
  }
}