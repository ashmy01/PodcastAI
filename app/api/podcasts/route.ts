import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Podcast } from '@/lib/models/Podcast';
import { Episode } from '@/lib/models/Episode';
import { extractWalletAddress, requireAuth } from '@/lib/auth-middleware';

const maleVoices = ["Puck", "Enceladus", "Iapetus", "Algieba", "Algenib", "Zubenelgenubi"];
const femaleVoices = ["Zephyr", "Kore", "Gacrux", "Sulafat", "Leda", "Aoede"];

function getRandomVoice(gender: 'male' | 'female' | 'neutral', usedVoices: string[]): string {
    const voices = gender === 'male' ? maleVoices : femaleVoices;
    const availableVoices = voices.filter(v => !usedVoices.includes(v));
    if (availableVoices.length === 0) {
        // Fallback if all voices are used
        return voices[Math.floor(Math.random() * voices.length)];
    }
    return availableVoices[Math.floor(Math.random() * availableVoices.length)];
}

export async function POST(req: NextRequest) {
    await dbConnect();

    // Check authentication
    const authError = requireAuth(req);
    if (authError) return authError;

    const walletAddress = extractWalletAddress(req);
    if (!walletAddress) {
        return NextResponse.json({ message: 'Wallet address is required' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { title, description, concept, tone, frequency, length, characters, topics } = body;

        const usedVoices: string[] = [];
        const charactersWithVoices = characters.map((char: { name: string; personality: string; gender: 'male' | 'female' | 'neutral' }) => {
            const voice = getRandomVoice(char.gender, usedVoices);
            usedVoices.push(voice);
            return { ...char, voice };
        });

        const newPodcast = new Podcast({
            title,
            description,
            concept,
            tone,
            frequency,
            length,
            characters: charactersWithVoices,
            topics,
            owner: walletAddress, // Associate with wallet address
        });

        const savedPodcast = await newPodcast.save();
        return NextResponse.json(savedPodcast, { status: 201 });
    } catch (error) {
        console.error('Failed to create podcast:', error);
        return NextResponse.json({ message: 'Failed to create podcast', error: error.message }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    await dbConnect();

    // Check authentication
    const authError = requireAuth(req);
    if (authError) return authError;

    const walletAddress = extractWalletAddress(req);
    if (!walletAddress) {
        return NextResponse.json({ message: 'Wallet address is required' }, { status: 401 });
    }

    try {
        // Only return podcasts owned by the authenticated wallet
        const podcasts = await Podcast.find({ owner: walletAddress }).populate('episodes');
        return NextResponse.json(podcasts);
    } catch (error) {
        console.error('Failed to fetch podcasts:', error);
        return NextResponse.json({ message: 'Failed to fetch podcasts', error: error.message }, { status: 500 });
    }
}
