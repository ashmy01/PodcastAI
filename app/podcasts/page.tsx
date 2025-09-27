"use client"

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

// Mock data for podcasts
const mockPodcasts = [
  {
    id: 1,
    title: "Tech Talk Weekly",
    description: "Weekly discussions about the latest in technology and AI",
    episodes: 12,
    totalPlays: 15420,
    avgRating: 4.8,
    frequency: "Weekly",
    nextEpisode: "2024-01-22",
    status: "active",
    hosts: ["Alex", "Sam"],
    categories: ["Technology", "AI", "Innovation"],
    recentEpisodes: [
      { title: "The Future of AI in Healthcare", plays: 1247, date: "2024-01-15" },
      { title: "Machine Learning Ethics", plays: 892, date: "2024-01-08" },
      { title: "Quantum Computing Basics", plays: 1534, date: "2024-01-01" },
    ],
  },
  {
    id: 2,
    title: "AI Insights",
    description: "Deep dives into artificial intelligence breakthroughs",
    episodes: 8,
    totalPlays: 9830,
    avgRating: 4.6,
    frequency: "Bi-weekly",
    nextEpisode: "2024-01-25",
    status: "active",
    hosts: ["Dr. Chen", "Maya"],
    categories: ["AI", "Research", "Science"],
    recentEpisodes: [
      { title: "Quantum Computing Breakthroughs", plays: 892, date: "2024-01-12" },
      { title: "The Rise of Edge Computing", plays: 1534, date: "2024-01-10" },
      { title: "Neural Networks Explained", plays: 743, date: "2024-01-03" },
    ],
  },
  {
    id: 3,
    title: "Startup Stories",
    description: "Inspiring entrepreneurship stories and lessons",
    episodes: 4,
    totalPlays: 3240,
    avgRating: 4.9,
    frequency: "Monthly",
    nextEpisode: "2024-02-01",
    status: "active",
    hosts: ["Jordan", "Riley"],
    categories: ["Business", "Entrepreneurship", "Startups"],
    recentEpisodes: [
      { title: "Building a Successful Startup", plays: 1120, date: "2024-01-05" },
      { title: "Funding Your Dream", plays: 890, date: "2023-12-15" },
      { title: "From Idea to IPO", plays: 1230, date: "2023-11-20" },
    ],
  },
]

export default function Podcasts() {
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

        {/* Podcasts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {mockPodcasts.map((podcast) => (
            <Card key={podcast.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <SpeakerLoudIcon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{podcast.title}</CardTitle>
                      <Badge variant="outline" className="mt-1">
                        {podcast.status}
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
                      <p className="text-2xl font-bold text-primary">{podcast.episodes}</p>
                      <p className="text-xs text-muted-foreground">Episodes</p>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <p className="text-2xl font-bold text-secondary">{podcast.totalPlays.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Total Plays</p>
                    </div>
                  </div>

                  {/* Hosts */}
                  <div>
                    <p className="text-sm font-medium mb-2 flex items-center gap-2">
                      <PersonIcon className="w-4 h-4" />
                      Hosts
                    </p>
                    <div className="flex gap-2">
                      {podcast.hosts.map((host) => (
                        <Badge key={host} variant="secondary">
                          {host}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Categories */}
                  <div>
                    <p className="text-sm font-medium mb-2">Categories</p>
                    <div className="flex flex-wrap gap-1">
                      {podcast.categories.map((category) => (
                        <Badge key={category} variant="outline" className="text-xs">
                          {category}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Schedule */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                      <span>{podcast.frequency}</span>
                    </div>
                    <span className="text-muted-foreground">Next: {podcast.nextEpisode}</span>
                  </div>

                  {/* Recent Episodes */}
                  <div>
                    <p className="text-sm font-medium mb-2">Recent Episodes</p>
                    <div className="space-y-2">
                      {podcast.recentEpisodes.slice(0, 2).map((episode, index) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <div className="flex-1 min-w-0">
                            <p className="truncate font-medium">{episode.title}</p>
                            <p className="text-xs text-muted-foreground">{episode.date}</p>
                          </div>
                          <div className="flex items-center gap-2 ml-2">
                            <span className="text-xs text-muted-foreground">{episode.plays}</span>
                            <Button variant="ghost" size="sm">
                              <PlayIcon className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Rating:</span>
                      <span className="text-sm text-primary font-bold">{podcast.avgRating}/5.0</span>
                    </div>
                    <Progress value={podcast.avgRating * 20} className="w-16 h-2" />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mt-6">
                  <Button variant="outline" size="sm" className="flex-1 gap-2 bg-transparent">
                    <BarChartIcon className="w-4 h-4" />
                    Analytics
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 gap-2 bg-transparent">
                    <PlayIcon className="w-4 h-4" />
                    Episodes
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {mockPodcasts.length === 0 && (
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
      </main>
    </div>
  )
}
