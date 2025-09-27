import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Podcast } from '@/lib/models/Podcast';
import { runPipeline } from '@/lib/pipeline';
import { extractWalletAddress, requireAuth } from '@/lib/auth-middleware';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    await dbConnect();

    // Check authentication
    const authError = requireAuth(req);
    if (authError) return authError;

    const walletAddress = extractWalletAddress(req);
    if (!walletAddress) {
        return NextResponse.json({ message: 'Wallet address is required' }, { status: 401 });
    }

    const podcastId = params.id;

    try {
        const podcast = await Podcast.findById(podcastId);
        if (!podcast) {
            return NextResponse.json({ message: 'Podcast not found' }, { status: 404 });
        }

        // Check if the podcast belongs to the authenticated user
        if (podcast.owner !== walletAddress) {
            return NextResponse.json({ message: 'Access denied. You do not own this podcast.' }, { status: 403 });
        }

        const episode = await runPipeline(podcast);

        return NextResponse.json(episode, { status: 201 });
    } catch (error: any) {
        console.error('Failed to generate episode:', error);
        return NextResponse.json({ message: 'Failed to generate episode', error: error.message }, { status: 500 });
    }
}
