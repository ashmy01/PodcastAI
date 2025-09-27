import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Podcast } from '@/lib/models/Podcast';
import { Episode } from '@/lib/models/Episode';
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
    const podcast = await Podcast.findById(params.id).populate('episodes');
    if (!podcast) {
      return NextResponse.json({ message: 'Podcast not found' }, { status: 404 });
    }

    // Check if the podcast belongs to the authenticated user
    if (podcast.owner !== walletAddress) {
      return NextResponse.json({ message: 'Access denied. You do not own this podcast.' }, { status: 403 });
    }

    return NextResponse.json(podcast);
  } catch (error) {
    console.error('Failed to fetch podcast:', error);
    return NextResponse.json({ message: 'Failed to fetch podcast' }, { status: 500 });
  }
}
