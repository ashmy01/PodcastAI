import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Campaign } from '@/lib/models/Campaign';
import { requireAuth, extractWalletAddress } from '@/lib/auth-middleware';
import { AIMatchingAgent } from '@/lib/ai/matching-agent';
import { AIDatabaseService } from '@/lib/ai/database-service';
import { MediaService } from '@/lib/services/media-service';

export async function POST(req: NextRequest) {
  await dbConnect();

  const authError = requireAuth(req);
  if (authError) return authError;

  const walletAddress = extractWalletAddress(req);
  if (!walletAddress) {
    return NextResponse.json({ message: 'Wallet address is required' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      brandName,
      productName,
      description,
      category,
      targetAudience,
      requirements,
      budget,
      currency,
      payoutPerView,
      duration,
      aiMatchingEnabled = true,
      contentGenerationRules = [],
      verificationCriteria,
      qualityThreshold = 0.7
    } = body;

    if (!brandName || !productName || !description || !category || !budget || !payoutPerView) {
      return NextResponse.json({ 
        message: 'Missing required fields: brandName, productName, description, category, budget, payoutPerView' 
      }, { status: 400 });
    }
    const defaultVerificationCriteria = verificationCriteria || {
      minQualityScore: qualityThreshold,
      requiredElements: requirements || [],
      complianceChecks: ['appropriate content', 'proper disclosure'],
      naturalness: 0.6
    };

    const newCampaign = new Campaign({
      brandId: walletAddress,
      brandName,
      productName,
      description,
      category,
      targetAudience: Array.isArray(targetAudience) ? targetAudience : [targetAudience],
      requirements: Array.isArray(requirements) ? requirements : [requirements],
      budget,
      currency: currency || 'ETH',
      payoutPerView,
      duration: duration || 30,
      status: 'active',
      aiMatchingEnabled,
      contentGenerationRules,
      verificationCriteria: defaultVerificationCriteria,
      qualityThreshold
    });

    const savedCampaign = await newCampaign.save();

    let initialMatches = [];
    if (aiMatchingEnabled) {
      try {
        const matchingAgent = new AIMatchingAgent();
        initialMatches = await matchingAgent.findMatches(savedCampaign._id.toString());
      } catch (matchError) {
        console.error('Error finding initial matches:', matchError);
      }
    }

    return NextResponse.json({
      campaign: savedCampaign,
      initialMatches,
      message: 'Campaign created successfully'
    }, { status: 201 });

  } catch (error: any) {
    console.error('Failed to create campaign:', error);
    return NextResponse.json({ 
      message: 'Failed to create campaign', 
      error: error.message 
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  await dbConnect();

  const authError = requireAuth(req);
  if (authError) return authError;

  const walletAddress = extractWalletAddress(req);
  if (!walletAddress) {
    return NextResponse.json({ message: 'Wallet address is required' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const query: any = { brandId: walletAddress };
    if (status) query.status = status;
    if (category) query.category = category;
    const campaigns = await Campaign.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset);

    const total = await Campaign.countDocuments(query);

    const dbService = new AIDatabaseService();
    const mediaService = new MediaService();
    const campaignsWithAnalytics = await Promise.all(
      campaigns.map(async (campaign) => {
        try {
          const analytics = await dbService.getCampaignAnalytics(campaign._id.toString());
          const brandLogo = mediaService.generateBrandLogo(campaign.brandName);
          return {
            ...campaign.toObject(),
            analytics,
            brandLogo
          };
        } catch (error) {
          console.error(`Error fetching analytics for campaign ${campaign._id}:`, error);
          const brandLogo = mediaService.generateBrandLogo(campaign.brandName);
          return {
            ...campaign.toObject(),
            analytics: null,
            brandLogo
          };
        }
      })
    );

    return NextResponse.json({
      campaigns: campaignsWithAnalytics,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });

  } catch (error: any) {
    console.error('Failed to fetch campaigns:', error);
    return NextResponse.json({ 
      message: 'Failed to fetch campaigns', 
      error: error.message 
    }, { status: 500 });
  }
}