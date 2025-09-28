"use client"

import { useState, useEffect } from "react"
import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  SpeakerLoudIcon,
  PlayIcon,
  PersonIcon,
  CalendarIcon,
  BarChartIcon,
  GearIcon,
  PlusIcon,
} from "@radix-ui/react-icons"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"

interface Podcast {
  _id: string;
  title: string;
  description: string;
  frequency: string;
  topics: string[];
  characters: Array<{
    name: string;
    personality: string;
    voice: string;
    gender: string;
  }>;
  episodes: any[];
  totalViews: number;
  totalEarnings: number;
  qualityScore: number;
  monetizationEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Episode {
  _id: string;
  title: string;
  totalViews: number;
  createdAt: string;
}

export default function Podcasts() {
  const { address, isAuthenticated } = useAuth()
  const [podcasts, setPodcasts] = useState<Podcast[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    if (isAuthenticated && address) {
      fetchPodcasts()
    }
  }, [isAuthenticated, address])

  const fetchPodcasts = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/podcasts', {
        headers: {
          'Authorization': `Bearer ${address}`,
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        setPodcasts(data || [])
      } else {
        throw new Error('Failed to fetch podcasts')
      }
    } catch (err) {
      console.error('Error fetching podcasts:', err)
      setError('Failed to load podcasts')
      setPodcasts([])
    } finally {
      setLoading(false)
    }
  }

  const getNextEpisodeDate = (frequency: string, lastEpisodeDate?: string) => {
    const baseDate = lastEpisodeDate ? new Date(lastEpisodeDate) : new Date()
    const nextDate = new Date(baseDate)
    
    switch (frequency.toLowerCase()) {
      case 'daily':
        nextDate.setDate(nextDate.getDate() + 1)
        break
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + 7)
        break
      case 'bi-weekly':
      case 'biweekly':
        nextDate.setDate(nextDate.getDate() + 14)
        break
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + 1)
        break
      default:
        nextDate.setDate(nextDate.getDate() + 7) // Default to weekly
    }
    
    return nextDate.toLocaleDateString()
  }

  const calculateRating = (qualityScore: number) => {
    return Math.min(5, Math.max(1, qualityScore * 5))
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-6 py-8">
          <div className="text-center py-12">
            <SpeakerLoudIcon className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
            <p className="text-muted-foreground mb-6">
              Please connect your wallet to view and manage your podcasts
            </p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">My Podcasts</h1>
            <p className="text-muted-foreground">Manage your AI-powered podcast series and track their performance</p>
          </div>
          <Link href="/create">
            <Button className="gap-2">
              <PlusIcon className="w-4 h-4" />
              Create New Podcast
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading your podcasts...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <SpeakerLoudIcon className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Error Loading Podcasts</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchPodcasts}>Try Again</Button>
          </div>
        ) : (
          <>
            {/* Podcasts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {podcasts.map((podcast) => (
                <Card key={podcast._id} className="flex flex-col">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                          <SpeakerLoudIcon className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{podcast.title}</CardTitle>
                          <Badge variant="outline" className="mt-1">
                            {podcast.monetizationEnabled ? 'monetized' : 'free'}
                          </Badge>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <GearIcon className="w-4 h-4" />
                      </Button>
                    </div>
                    <CardDescription className="mt-2">{podcast.description}</CardDescription>
                  </CardHeader>

                  <CardContent className="flex-1">
                    <div className="space-y-4">
                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 bg-muted/50 rounded-lg">
                          <p className="text-2xl font-bold text-primary">{podcast.episodes?.length || 0}</p>
                          <p className="text-xs text-muted-foreground">Episodes</p>
                        </div>
                        <div className="text-center p-3 bg-muted/50 rounded-lg">
                          <p className="text-2xl font-bold text-primary">{(podcast.totalViews || 0).toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">Total Views</p>
                        </div>
                      </div>

                      {/* Earnings (if monetized) */}
                      {podcast.monetizationEnabled && (
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <p className="text-lg font-bold text-green-600">${(podcast.totalEarnings || 0).toFixed(2)}</p>
                          <p className="text-xs text-green-600">Total Earnings</p>
                        </div>
                      )}

                      {/* Hosts */}
                      <div>
                        <p className="text-sm font-medium mb-2 flex items-center gap-2">
                          <PersonIcon className="w-4 h-4" />
                          AI Hosts
                        </p>
                        <div className="flex gap-2 flex-wrap">
                          {podcast.characters?.slice(0, 3).map((character, index) => (
                            <Badge key={index} variant="secondary">
                              {character.name}
                            </Badge>
                          )) || <span className="text-xs text-muted-foreground">No characters defined</span>}
                        </div>
                      </div>

                      {/* Topics */}
                      <div>
                        <p className="text-sm font-medium mb-2">Topics</p>
                        <div className="flex flex-wrap gap-1">
                          {podcast.topics?.slice(0, 3).map((topic, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {topic}
                            </Badge>
                          )) || <span className="text-xs text-muted-foreground">No topics defined</span>}
                          {podcast.topics && podcast.topics.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{podcast.topics.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Schedule */}
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                          <span>{podcast.frequency}</span>
                        </div>
                        <span className="text-muted-foreground">
                          Next: {getNextEpisodeDate(podcast.frequency, podcast.updatedAt)}
                        </span>
                      </div>

                      {/* Quality Score */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">Quality:</span>
                          <span className="text-sm text-primary font-bold">
                            {calculateRating(podcast.qualityScore || 0.5).toFixed(1)}/5.0
                          </span>
                        </div>
                        <Progress value={(podcast.qualityScore || 0.5) * 100} className="w-16 h-2" />
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 mt-6">
                      <Button variant="ghost" size="sm" className="flex-1 gap-2 bg-transparent">
                        <BarChartIcon className="w-4 h-4" />
                        Analytics
                      </Button>
                      <Button variant="ghost" size="sm" className="flex-1 gap-2 bg-transparent" asChild>
                        <Link href={`/podcasts/${podcast._id}/episodes`}>
                          <PlayIcon className="w-4 h-4" />
                          Episodes
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {podcasts.length === 0 && (
              <Card className="text-center py-12">
                <CardContent>
                  <SpeakerLoudIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No podcasts yet</h3>
                  <p className="text-muted-foreground mb-4">Create your first AI-powered podcast to get started</p>
                  <Link href="/create">
                    <Button className="gap-2">
                      <PlusIcon className="w-4 h-4" />
                      Create Your First Podcast
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </main>
    </div>
  )
}
