import { NextRequest, NextResponse } from 'next/server';
import { MediaService } from '@/lib/services/media-service';
import { requireAuth, extractWalletAddress } from '@/lib/auth-middleware';

const mediaService = new MediaService();

export async function POST(req: NextRequest) {
  // Check authentication
  const authError = requireAuth(req);
  if (authError) return authError;

  const walletAddress = extractWalletAddress(req);
  if (!walletAddress) {
    return NextResponse.json({ message: 'Wallet address is required' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string;
    const entityId = formData.get('entityId') as string;

    if (!file) {
      return NextResponse.json({ message: 'No file provided' }, { status: 400 });
    }

    if (!type || !entityId) {
      return NextResponse.json({ message: 'Type and entityId are required' }, { status: 400 });
    }

    let uploadUrl: string;

    switch (type) {
      case 'podcast-artwork':
        if (!mediaService.isValidImageFile(file)) {
          return NextResponse.json({ message: 'Invalid image file' }, { status: 400 });
        }
        uploadUrl = await mediaService.uploadPodcastArtwork(file, entityId);
        break;

      case 'brand-logo':
        if (!mediaService.isValidImageFile(file)) {
          return NextResponse.json({ message: 'Invalid image file' }, { status: 400 });
        }
        uploadUrl = await mediaService.uploadBrandLogo(file, entityId);
        break;

      case 'episode-audio':
        if (!mediaService.isValidAudioFile(file)) {
          return NextResponse.json({ message: 'Invalid audio file' }, { status: 400 });
        }
        const buffer = Buffer.from(await file.arrayBuffer());
        uploadUrl = await mediaService.storeEpisodeAudio(entityId, buffer);
        break;

      default:
        return NextResponse.json({ message: 'Invalid upload type' }, { status: 400 });
    }

    // Get metadata
    const metadata = await mediaService.getAssetMetadata(entityId, type as any);

    return NextResponse.json({
      url: uploadUrl,
      metadata,
      message: 'File uploaded successfully'
    });

  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ 
      message: 'Upload failed', 
      error: error.message 
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');
  const entityId = searchParams.get('entityId');

  if (!type || !entityId) {
    return NextResponse.json({ message: 'Type and entityId are required' }, { status: 400 });
  }

  try {
    let url: string;

    switch (type) {
      case 'podcast-artwork':
        url = mediaService.getPodcastArtworkUrl(entityId);
        break;

      case 'brand-logo':
        url = await mediaService.getBrandLogo(entityId);
        break;

      case 'episode-audio':
        url = await mediaService.getAudioUrl(entityId);
        break;

      case 'user-avatar':
        url = await mediaService.generateUserAvatar(entityId);
        break;

      default:
        return NextResponse.json({ message: 'Invalid asset type' }, { status: 400 });
    }

    return NextResponse.json({ url });

  } catch (error: any) {
    console.error('Asset retrieval error:', error);
    return NextResponse.json({ 
      message: 'Failed to retrieve asset', 
      error: error.message 
    }, { status: 500 });
  }
}