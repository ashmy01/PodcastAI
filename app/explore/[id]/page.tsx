"use client"

import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeftIcon, SpeakerLoudIcon, PlayIcon, PersonIcon, ClockIcon, CalendarIcon } from "@radix-ui/react-icons"
import Link from "next/link"
import { InlineAudioPlayer } from "@/components/inline-audio-player"
import { PodcastDataService, PodcastAnalytics } from "@/lib/services/podcast-data-service"
import { MediaService } from "@/lib/services/media-service"

interface Episode {
  _id: string;
  title: string;
  summary: string;
  audioUrl: string;
  createdAt: string;
}

interface Podcast {
  _id: string;
  title: string;
  description: string;
  concept: string;
  tone: string;
  frequency: string;
  length: string;
  topics: string[];
  characters: Array<{
    name: string;
    personality: string;
    gender: string;
  }>;
  episodes: Episode[];
  owner: string;
  createdAt: string;
  updatedAt: string;
  monetizationEnabled?: boolean;
  totalViews?: number;
  totalEarnings?: number;
  qualityScore?: number;
  analytics?: PodcastAnalytics;
  followerCount?: number;
  episodeCount?: number;
}

export default function PodcastDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { id } = params
  const [podcast, setPodcast] = useState<Podcast | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const podcastService = new PodcastDataService()
  const mediaService = new MediaService()

  useEffect(() => {
    if (id) {
      fetchPodcast()
    }
  }, [id])

  const fetchPodcast = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Use the enhanced data service to get podcast with analytics
      const data = await podcastService.getPodcastById(id as string)
      
      if (data) {
        setPodcast(data)
      } else {
        setPodcast(null)
        setError('Podcast not found')
      }
    } catch (error) {
      console.error('Error fetching podcast:', error)
      setError('Error loading podcast')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-6 py-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading podcast...</p>
        </div>
      </div>
    )
  }

  if (error || !podcast) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-6 py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">{error || 'Podcast Not Found'}</h1>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    )
  }

  const getToneColor = (tone: string) => {
    switch (tone) {
      case "humorous": return "bg-yellow-100 text-yellow-800"
      case "educational": return "bg-blue-100 text-blue-800"
      case "casual": return "bg-green-100 text-green-800"
      case "professional": return "bg-purple-100 text-purple-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-6 py-8">
        {/* Back Button */}
        <Button variant="ghost" onClick={() => router.back()} className="mb-6">
          <ArrowLeftIcon className="w-4 h-4 mr-2" />
          Back to Explore
        </Button>

        {/* Podcast Header */}
        <Card className="mb-8 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-4xl font-bold mb-4">{podcast.title}</CardTitle>
                <CardDescription className="text-lg mb-4">{podcast.description}</CardDescription>
                
                {/* Stats */}
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-1">
                    <PersonIcon className="w-4 h-4" />
                    {(podcast.analytics?.followerCount || podcast.followerCount || 0).toLocaleString()} followers
                  </div>
                  <div className="flex items-center gap-1">
                    <SpeakerLoudIcon className="w-4 h-4" />
                    {podcast.analytics?.episodeCount || podcast.episodes?.length || 0} episodes
                  </div>
                  <div className="flex items-center gap-1">
                    <CalendarIcon className="w-4 h-4" />
                    {podcast.frequency} releases
                  </div>
                  <div className="flex items-center gap-1">
                    👁️ {(podcast.analytics?.totalViews || podcast.totalViews || 0).toLocaleString()} views
                  </div>
                  {podcast.analytics?.totalEarnings && (
                    <div className="flex items-center gap-1">
                      💰 ${podcast.analytics.totalEarnings.toFixed(2)} earned
                    </div>
                  )}
                  {(podcast.qualityScore || podcast.analytics?.averageEngagement) && (
                    <div className="flex items-center gap-1">
                      ⭐ {(podcast.qualityScore || podcast.analytics?.averageEngagement || 0).toFixed(1)} rating
                    </div>
                  )}
                  {podcast.analytics?.monthlyGrowth !== undefined && (
                    <div className="flex items-center gap-1">
                      📈 {podcast.analytics.monthlyGrowth > 0 ? '+' : ''}{podcast.analytics.monthlyGrowth}% growth
                    </div>
                  )}
                </div>

                {/* Meta Badges */}
                <div className="flex flex-wrap gap-2">
                  <Badge className={getToneColor(podcast.tone)}>
                    {podcast.tone}
                  </Badge>
                  <Badge variant="outline">
                    <ClockIcon className="w-3 h-3 mr-1" />
                    {podcast.length} episodes
                  </Badge>
                </div>
              </div>
              
              <div className="ml-6">
                <Button size="lg" className="mb-2">
                  <PlayIcon className="w-5 h-5 mr-2" />
                  Follow Podcast
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* About */}
            <Card>
              <CardHeader>
                <CardTitle>About This Podcast</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">{podcast.concept}</p>
                
                {/* Topics */}
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Topics Covered</h4>
                  <div className="flex flex-wrap gap-2">
                    {podcast.topics.map((topic) => (
                      <Badge key={topic} variant="secondary">
                        {topic}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Analytics Summary */}
                {podcast.analytics && (
                  <div className="mt-6 p-4 bg-muted/30 rounded-lg">
                    <h4 className="font-medium mb-3">Performance Metrics</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="text-center">
                        <div className="font-semibold text-lg">{podcast.analytics.totalViews.toLocaleString()}</div>
                        <div className="text-muted-foreground">Total Views</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-lg">{(podcast.analytics.averageEngagement * 100).toFixed(1)}%</div>
                        <div className="text-muted-foreground">Engagement</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-lg">{podcast.analytics.followerCount.toLocaleString()}</div>
                        <div className="text-muted-foreground">Followers</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-lg">${podcast.analytics.earningsPerView.toFixed(4)}</div>
                        <div className="text-muted-foreground">Per View</div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Episodes */}
            <Card>
              <CardHeader>
                <CardTitle>Episodes</CardTitle>
                <CardDescription>Latest episodes from {podcast.title}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {podcast.episodes && podcast.episodes.length > 0 ? (
                  podcast.episodes.map((episode, index) => (
                    <div key={episode._id} className="border rounded-lg p-4 bg-muted/20">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-medium mb-1">{episode.title}</h4>
                          <p className="text-sm text-muted-foreground mb-2">{episode.summary}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>Episode {podcast.episodes.length - index}</span>
                            <span>{new Date(episode.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Audio Player */}
                      {episode.audioUrl && (
                        <div className="mt-3">
                          <InlineAudioPlayer src={episode.audioUrl} />
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <SpeakerLoudIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No episodes available yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* AI Hosts */}
            {podcast.characters && podcast.characters.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PersonIcon className="w-5 h-5" />
                    AI Hosts
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {podcast.characters.map((character, index) => (
                    <div key={index} className="p-3 rounded-lg bg-muted/30">
                      <h4 className="font-medium mb-1">{character.name}</h4>
                      <p className="text-sm text-muted-foreground mb-2">{character.personality}</p>
                      <Badge variant="outline" className="text-xs">
                        {character.gender}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Top Episodes */}
            {podcast.analytics?.topEpisodes && podcast.analytics.topEpisodes.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Top Episodes</CardTitle>
                  <CardDescription>Most popular episodes by views</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {podcast.analytics.topEpisodes.slice(0, 3).map((episode, index) => (
                    <div key={episode.id} className="flex items-center justify-between p-2 bg-muted/20 rounded">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{episode.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {episode.views.toLocaleString()} views • {episode.duration}
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        #{index + 1}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Audience Demographics */}
            {podcast.analytics?.audienceDemographics && (
              <Card>
                <CardHeader>
                  <CardTitle>Audience</CardTitle>
                  <CardDescription>Who listens to this podcast</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="text-sm font-medium mb-1">Age Range</div>
                    <div className="text-sm text-muted-foreground">
                      {podcast.analytics.audienceDemographics.ageRange || 'Not specified'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium mb-1">Top Interests</div>
                    <div className="flex flex-wrap gap-1">
                      {podcast.analytics.audienceDemographics.interests.slice(0, 3).map((interest) => (
                        <Badge key={interest} variant="outline" className="text-xs">
                          {interest}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium mb-1">Top Locations</div>
                    <div className="text-sm text-muted-foreground">
                      {podcast.analytics.audienceDemographics.location.slice(0, 3).join(', ') || 'Global'}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Create Your Own CTA */}
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg">Inspired?</CardTitle>
                <CardDescription>Create your own AI podcast just like this one</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" asChild>
                  <Link href="/podcasts">
                    <SpeakerLoudIcon className="w-4 h-4 mr-2" />
                    Start Creating
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}