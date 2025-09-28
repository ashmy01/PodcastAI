import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Episode } from '@/lib/models/Episode';
import { Podcast } from '@/lib/models/Podcast';
import { extractWalletAddress, requireAuth } from '@/lib/auth-middleware';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  await dbConnect();

  // Check authentication
  const authError = requireAuth(request);
  if (authError) return authError;

  const walletAddress = extractWalletAddress(request);
  if (!walletAddress) {
    return NextResponse.json({ message: 'Wallet address is required' }, { status: 401 });
  }

  try {
    const podcastId = params.id;

    // Verify the podcast belongs to the authenticated user
    const podcast = await Podcast.findOne({ _id: podcastId, owner: walletAddress });
    if (!podcast) {
      return NextResponse.json({ message: 'Podcast not found or access denied' }, { status: 404 });
    }

    // Fetch episodes for this podcast
    const episodes = await Episode.find({ podcast: podcastId })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ episodes });
  } catch (error: any) {
    console.error('Failed to fetch episodes:', error);
    return NextResponse.json(
      { message: 'Failed to fetch episodes', error: error.message },
      { status: 500 }
    );
  }
}