import { NextRequest, NextResponse } from 'next/server';
import { MediaService } from '@/lib/services/media-service';

const mediaService = new MediaService();

export async function POST(req: NextRequest) {
  try {
    const { brandName, brandId } = await req.json();

    if (!brandName) {
      return NextResponse.json({
        message: 'Brand name is required',
        code: 'MISSING_BRAND_NAME'
      }, { status: 400 });
    }

    // Generate brand logo using the service
    const logoUrl = mediaService.generateBrandLogo(brandName);

    return NextResponse.json({
      url: logoUrl,
      message: 'Brand logo generated successfully'
    });

  } catch (error: any) {
    console.error('Error generating brand logo:', error);
    return NextResponse.json({
      message: 'Failed to generate brand logo',
      error: error.message,
      code: 'LOGO_GENERATION_ERROR'
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const brandName = searchParams.get('brandName');
    const brandId = searchParams.get('brandId');

    if (!brandName) {
      return NextResponse.json({
        message: 'Brand name is required',
        code: 'MISSING_BRAND_NAME'
      }, { status: 400 });
    }

    // Generate brand logo using the service
    const logoUrl = mediaService.generateBrandLogo(brandName);

    return NextResponse.json({
      url: logoUrl,
      message: 'Brand logo generated successfully'
    });

  } catch (error: any) {
    console.error('Error generating brand logo:', error);
    return NextResponse.json({
      message: 'Failed to generate brand logo',
      error: error.message,
      code: 'LOGO_GENERATION_ERROR'
    }, { status: 500 });
  }
}