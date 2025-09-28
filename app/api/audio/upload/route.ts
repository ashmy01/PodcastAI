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
    
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const episodeId = formData.get('episodeId') as string;

    if (!file || !episodeId) {
      return NextResponse.json({ message: 'File and episode ID are required' }, { status: 400 });
    }

    // Verify episode ownership
    const episode = await Episode.findById(episodeId);
    if (!episode) {
      return NextResponse.json({ message: 'Episode not found' }, { status: 404 });
    }

    if (episode.owner !== walletAddress) {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 });
    }

    // Validate audio file
    const validation = await audioService.validateAudioFile(file);
    if (!validation.valid) {
      return NextResponse.json({ message: validation.error }, { status: 400 });
    }

    // Upload audio file
    const audioUrl = await audioService.uploadAudioFile(episodeId, file);

    // Get metadata
    const metadata = await audioService.getAudioMetadata(audioUrl);

    // Update episode
    episode.audioUrl = audioUrl;
    await episode.save();

    return NextResponse.json({
      audioUrl,
      metadata,
      message: 'Audio uploaded successfully'
    });

  } catch (error: any) {
    console.error('Audio upload error:', error);
    return NextResponse.json({ 
      message: 'Audio upload failed', 
      error: error.message 
    }, { status: 500 });
  }
}