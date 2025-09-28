import { NextRequest, NextResponse } from 'next/server';
import { MediaService } from '@/lib/services/media-service';

const mediaService = new MediaService();

export async function POST(req: NextRequest) {
  try {
    const { type, data } = await req.json();

    if (!type || !data) {
      return NextResponse.json({ message: 'Type and data are required' }, { status: 400 });
    }

    let generatedUrl: string;

    switch (type) {
      case 'podcast-avatar':
        if (!data.id || !data.title) {
          return NextResponse.json({ message: 'Podcast ID and title are required' }, { status: 400 });
        }
        generatedUrl = mediaService.generatePodcastAvatar(data);
        break;

      case 'brand-logo':
        if (!data.brandName) {
          return NextResponse.json({ message: 'Brand name is required' }, { status: 400 });
        }
        generatedUrl = mediaService.generateBrandLogo(data.brandName);
        break;

      case 'user-avatar':
        if (!data.walletAddress) {
          return NextResponse.json({ message: 'Wallet address is required' }, { status: 400 });
        }
        generatedUrl = await mediaService.generateUserAvatar(data.walletAddress, data.username);
        break;

      default:
        return NextResponse.json({ message: 'Invalid generation type' }, { status: 400 });
    }

    return NextResponse.json({
      url: generatedUrl,
      message: 'Asset generated successfully'
    });

  } catch (error: any) {
    console.error('Generation error:', error);
    return NextResponse.json({ 
      message: 'Generation failed', 
      error: error.message 
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');
  
  try {
    let examples: any = {};

    switch (type) {
      case 'podcast-avatars':
        examples = {
          geometric: 'https://api.dicebear.com/7.x/shapes/svg?seed=example1&backgroundColor=FF6B6B',
          abstract: 'https://api.dicebear.com/7.x/shapes/svg?seed=example2&backgroundColor=4ECDC4',
          minimal: 'https://api.dicebear.com/7.x/shapes/svg?seed=example3&backgroundColor=45B7D1'
        };
        break;

      case 'brand-logos':
        examples = {
          tech: '💻',
          ai: '🤖',
          health: '💊',
          finance: '💰',
          education: '📚',
          food: '🍕',
          travel: '✈️',
          fashion: '👗'
        };
        break;

      default:
        return NextResponse.json({ message: 'Invalid example type' }, { status: 400 });
    }

    return NextResponse.json({ examples });

  } catch (error: any) {
    console.error('Examples error:', error);
    return NextResponse.json({ 
      message: 'Failed to get examples', 
      error: error.message 
    }, { status: 500 });
  }
}