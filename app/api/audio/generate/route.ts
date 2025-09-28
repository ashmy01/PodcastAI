import { NextRequest, NextResponse } from 'next/server';
import { AudioService } from '@/lib/services/audio-service';
import { requireAuth, extractWalletAddress } from '@/lib/auth-middleware';
import { Episode } from '@/lib/models/Episode';
import dbConnect from '@/lib/db';

const audioService = new AudioService();

export async function POST(req: NextRequest) {
  // Check authentication
  const authError = requireAuth(req);
  if (authError) return authError;

  const walletAddress = extractWalletAddress(req);
  if (!walletAddress) {
    return NextResponse.json({ message: 'Wallet address is required' }, { status: 401 });
  }

  try {
    await dbConnect();
    
    const { episodeId, options } = await req.json();

    if (!episodeId || !options) {
      return NextResponse.json({ message: 'Episode ID and options are required' }, { status: 400 });
    }

    // Verify episode ownership
    const episode = await Episode.findById(episodeId);
    if (!episode) {
      return NextResponse.json({ message: 'Episode not found' }, { status: 404 });
    }

    if (episode.owner !== walletAddress) {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 });
    }

    // Generate audio
    const result = await audioService.generateEpisodeAudio(episodeId, options);

    // Update episode with audio URL
    episode.audioUrl = result.url;
    await episode.save();

    return NextResponse.json({
      audioUrl: result.url,
      metadata: result.metadata,
      message: 'Audio generated successfully'
    });

  } catch (error: any) {
    console.error('Audio generation error:', error);
    return NextResponse.json({ 
      message: 'Audio generation failed', 
      error: error.message 
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const episodeId = searchParams.get('episodeId');

  if (!episodeId) {
    return NextResponse.json({ message: 'Episode ID is required' }, { status: 400 });
  }

  try {
    await dbConnect();
    
    const episode = await Episode.findById(episodeId);
    if (!episode) {
      return NextResponse.json({ message: 'Episode not found' }, { status: 404 });
    }

    if (!episode.audioUrl) {
      return NextResponse.json({ message: 'No audio available for this episode' }, { status: 404 });
    }

    // Get audio metadata
    const metadata = await audioService.getAudioMetadata(episode.audioUrl);

    return NextResponse.json({
      audioUrl: episode.audioUrl,
      metadata
    });

  } catch (error: any) {
    console.error('Audio retrieval error:', error);
    return NextResponse.json({ 
      message: 'Failed to retrieve audio', 
      error: error.message 
    }, { status: 500 });
  }
}