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

        if (!title || !description || !concept || !tone || !frequency || !length) {
            return NextResponse.json({ 
                message: 'Missing required fields: title, description, concept, tone, frequency, length' 
            }, { status: 400 });
        }

        const usedVoices: string[] = [];
        const charactersWithVoices = characters
            .filter((char: any) => char.name && char.personality) 
            .map((char: { name: string; personality: string; gender: 'male' | 'female' | 'neutral' }) => {
                const voice = getRandomVoice(char.gender, usedVoices);
                usedVoices.push(voice);
                return { ...char, voice };
            });

        if (charactersWithVoices.length === 0) {
            return NextResponse.json({ 
                message: 'At least one character with name and personality is required' 
            }, { status: 400 });
        }

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
            
            // Initialize AI-specific fields
            monetizationEnabled: false,
            aiContentEnabled: true,
            qualityScore: 0.5,
            contentThemes: topics,
            averageEngagement: 0.5,
            totalViews: 0,
            totalEarnings: 0,
            adPreferences: {
                allowedCategories: [],
                blockedBrands: [],
                maxAdsPerEpisode: 2,
                preferredAdPlacement: ['mid-roll'],
                minimumPayoutRate: 0.001
            },
            audienceProfile: {
                demographics: {
                    ageRange: '',
                    interests: topics,
                    location: []
                },
                engagement: {
                    averageListenTime: 0,
                    completionRate: 0,
                    interactionRate: 0
                }
            }
        });

        const savedPodcast = await newPodcast.save();
        return NextResponse.json(savedPodcast, { status: 201 });
    } catch (error: any) {
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
    } catch (error: any) {
        console.error('Failed to fetch podcasts:', error);
        return NextResponse.json({ message: 'Failed to fetch podcasts', error: error.message }, { status: 500 });
    }
}
