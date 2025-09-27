import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Podcast } from '@/lib/models/Podcast';
import { Episode } from '@/lib/models/Episode';
import { runPipeline } from '@/lib/pipeline';

export async function GET() {
  console.log('Cron job started');
  await dbConnect();

  try {
    const podcasts = await Podcast.find({}).populate({
      path: 'episodes',
      options: { sort: { createdAt: -1 }, limit: 1 }
    });

    const generationPromises = podcasts.map(async (podcast) => {
      if (!podcast.frequency) {
        return; // Skip podcasts with no frequency set
      }

      const now = new Date();
      const lastEpisodeDate = podcast.episodes.length > 0 ? new Date((podcast.episodes[0] as any).createdAt) : null;

      let shouldGenerate = false;
      if (!lastEpisodeDate) {
        shouldGenerate = true; // Always generate if there are no episodes
      } else {
        const timeDiff = now.getTime() - lastEpisodeDate.getTime();
        const daysDiff = timeDiff / (1000 * 3600 * 24);

        switch (podcast.frequency) {
          case 'daily':
            if (daysDiff >= 1) shouldGenerate = true;
            break;
          case 'weekly':
            if (daysDiff >= 7) shouldGenerate = true;
            break;
          case 'biweekly':
            if (daysDiff >= 14) shouldGenerate = true;
            break;
          case 'monthly':
            if (daysDiff >= 30) shouldGenerate = true;
            break;
        }
      }

      if (shouldGenerate) {
        console.log(`Generating scheduled episode for: ${podcast.title}`);
        try {
          await runPipeline(podcast);
          console.log(`Successfully generated episode for: ${podcast.title}`);
        } catch (error) {
          console.error(`Failed to generate episode for ${podcast.title}:`, error);
        }
      }
    });

    await Promise.all(generationPromises);

    console.log('Cron job finished');
    return NextResponse.json({ message: 'Cron job executed successfully' });

  } catch (error) {
    console.error('Error in cron job:', error);
    return NextResponse.json({ message: 'Cron job failed' }, { status: 500 });
  }
}
