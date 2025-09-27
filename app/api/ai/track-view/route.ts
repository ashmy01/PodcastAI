import { NextRequest, NextResponse } from 'next/server';
import { AIPayoutService } from '@/lib/services/payout-service';

export async function POST(req: NextRequest) {
  try {
    const { episodeId, userId, duration, completed } = await req.json();

    if (!episodeId || !userId) {
      return NextResponse.json({ 
        message: 'Episode ID and User ID are required' 
      }, { status: 400 });
    }

    // Get client IP and user agent for fraud detection
    const clientIP = req.headers.get('x-forwarded-for') || 
                    req.headers.get('x-real-ip') || 
                    'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    const payoutService = new AIPayoutService();
    
    // Validate the view data for fraud detection
    const viewData = [{
      episodeId,
      userId,
      timestamp: new Date(),
      duration: duration || 0,
      completed: completed || false,
      ipAddress: clientIP,
      userAgent
    }];

    const validViews = await payoutService.validateViewAuthenticity(viewData);
    
    if (validViews.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'View failed fraud detection',
        tracked: false
      }, { status: 400 });
    }

    // Track the view
    await payoutService.trackView(episodeId, userId);

    // Check if this triggers any automated payouts
    // (In production, this might be done via a background job)
    try {
      await payoutService.processAutomatedPayouts();
    } catch (payoutError) {
      console.error('Error in automated payout processing:', payoutError);
      // Don't fail the view tracking if payout processing fails
    }

    return NextResponse.json({
      success: true,
      message: 'View tracked successfully',
      tracked: true,
      fraudCheck: 'passed'
    });

  } catch (error: any) {
    console.error('Error tracking view:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to track view',
      error: error.message
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const episodeId = searchParams.get('episodeId');

    if (!episodeId) {
      return NextResponse.json({ 
        message: 'Episode ID is required' 
      }, { status: 400 });
    }

    // Get episode view statistics
    const { Episode } = await import('@/lib/models/Episode');
    const episode = await Episode.findById(episodeId);

    if (!episode) {
      return NextResponse.json({ 
        message: 'Episode not found' 
      }, { status: 404 });
    }

    // Check for potential fraud
    const payoutService = new AIPayoutService();
    const fraudDetected = await payoutService.detectViewFraud(episodeId);

    return NextResponse.json({
      success: true,
      episodeId,
      totalViews: episode.totalViews,
      totalEarnings: episode.totalEarnings,
      hasAds: episode.hasAds,
      adCount: episode.adCount,
      fraudDetected,
      earningsPerView: episode.totalViews > 0 ? episode.totalEarnings / episode.totalViews : 0
    });

  } catch (error: any) {
    console.error('Error fetching view statistics:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch view statistics',
      error: error.message
    }, { status: 500 });
  }
}