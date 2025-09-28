import { NextRequest, NextResponse } from 'next/server';
import { CampaignDataService } from '@/lib/services/campaign-data-service';
import { MediaService } from '@/lib/services/media-service';

const campaignService = new CampaignDataService();
const mediaService = new MediaService();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'active';
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build filters
    const filters = {
      status,
      limit,
      offset,
      ...(category && { category })
    };

    // Get campaigns using the service
    const campaigns = await campaignService.getActiveCampaigns(filters);

    // Enhance campaigns with brand logos and additional data
    const enhancedCampaigns = campaigns.map(campaign => ({
      ...campaign,
      brandLogo: mediaService.generateBrandLogo(campaign.brandName),
      applicants: campaign.applicants || 0,
      analytics: campaign.analytics || {
        totalImpressions: 0,
        totalClicks: 0,
        clickThroughRate: 0,
        conversionRate: 0
      }
    }));

    // Calculate pagination info
    const total = enhancedCampaigns.length; // In a real app, this would be a separate count query
    const hasMore = offset + limit < total;

    return NextResponse.json({
      campaigns: enhancedCampaigns,
      pagination: {
        total,
        limit,
        offset,
        hasMore
      }
    });

  } catch (error: any) {
    console.error('Error fetching public campaigns:', error);
    return NextResponse.json({
      message: 'Failed to fetch campaigns',
      error: error.message,
      code: 'CAMPAIGNS_FETCH_ERROR'
    }, { status: 500 });
  }
}