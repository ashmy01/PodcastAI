"use client"

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Navigation } from '@/components/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { InlineAudioPlayer } from '../../../components/inline-audio-player';
import { IPodcast } from '@/lib/models/Podcast';
import { IEpisode } from '@/lib/models/Episode';
import { ReloadIcon } from '@radix-ui/react-icons';
import { ProtectedRoute } from '@/components/protected-route';
import { useAuth } from '@/lib/auth-context';
import { authenticatedFetch } from '@/lib/api-client';

// We need to define a type for the populated podcast
type PopulatedPodcast = Omit<IPodcast, 'episodes'> & {
  episodes: IEpisode[];
};

export default function PodcastPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  const { address } = useAuth();

  const [podcast, setPodcast] = useState<PopulatedPodcast | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  const fetchPodcast = async () => {
    if (!id || !address) return;
    setIsLoading(true);
    try {
      const response = await authenticatedFetch(`/api/podcasts/${id}`, {}, address);
      if (response.ok) {
        const data = await response.json();
        setPodcast(data);
      } else {
        console.error("Failed to fetch podcast");
        router.push('/dashboard');
      }
    } catch (error) {
      console.error("Error fetching podcast:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPodcast();
  }, [id, address]);

  const handleGenerateEpisode = async () => {
    if (!id || !address) return;
    setIsGenerating(true);
    try {
      const response = await authenticatedFetch(`/api/podcasts/${id}/generate`, {
        method: 'POST',
      }, address);

      if (response.ok) {
        // Successfully generated, now refetch the podcast to get the new episode
        await fetchPodcast();
      } else {
        const errorData = await response.json();
        console.error("Failed to generate episode:", errorData.message);
      }
    } catch (error) {
      console.error("Error generating episode:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading && !podcast) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
          <p>Loading podcast...</p>
        </div>
      </ProtectedRoute>
    );
  }

  if (!podcast) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
          <p>Podcast not found.</p>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background text-foreground">
        <Navigation />

      <main className="container mx-auto px-4 py-12">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-4xl font-bold">{podcast.title}</CardTitle>
            <CardDescription>{podcast.concept}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
              <div><strong>Tone:</strong> {podcast.tone}</div>
              <div><strong>Frequency:</strong> {podcast.frequency}</div>
              <div><strong>Length:</strong> {podcast.length}</div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Episodes</h2>
          <Button onClick={handleGenerateEpisode} disabled={isGenerating}>
            {isGenerating && <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />}
            {isGenerating ? 'Generating...' : 'Generate New Episode'}
          </Button>
        </div>

        <div className="space-y-6">
          {podcast.episodes && podcast.episodes.length > 0 ? (
            [...podcast.episodes].sort((a, b) => new Date((b as any).createdAt).getTime() - new Date((a as any).createdAt).getTime()).map((episode) => (
              <Card key={(episode as any)._id.toString()}>
                <CardHeader>
                  <CardTitle>{episode.title}</CardTitle>
                  <CardDescription>{episode.summary}</CardDescription>
                </CardHeader>
                <CardContent>
                  <InlineAudioPlayer src={episode.audioUrl} />
                  <details className="mt-4">
                    <summary className="cursor-pointer text-sm font-medium">View Script</summary>
                    <div className="mt-2 p-4 bg-muted rounded-md text-sm whitespace-pre-wrap">
                      {episode.script}
                    </div>
                  </details>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-12">
              <h3 className="text-lg font-semibold">No episodes yet!</h3>
              <p className="text-muted-foreground mb-4">
                Click the button above to generate your first episode.
              </p>
            </div>
          )}
        </div>
      </main>
      </div>
    </ProtectedRoute>
  );
}
