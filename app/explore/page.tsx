"use client"

import { useEffect, useState } from "react"
import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SpeakerLoudIcon, PlayIcon, PersonIcon, ClockIcon } from "@radix-ui/react-icons"
import Link from "next/link"
import { InlineAudioPlayer } from "@/components/inline-audio-player"


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
  followerCount?: number;
  episodeCount?: number;
  latestEpisode?: Episode;
}

export default function ExplorePage() {
  const [selectedCategory, setSelectedCategory] = useState("All")
  
  // Mock data for demonstration
  const mockPodcasts: Podcast[] = [
    {
      _id: "1",
      title: "Tech Talk Daily",
      description: "Daily discussions about the latest in technology and AI",
      concept: "A daily tech podcast with AI hosts discussing current events",
      tone: "professional",
      frequency: "daily",
      length: "30 minutes",
      topics: ["Technology", "AI", "Innovation"],
      characters: [
        { name: "Alex", personality: "Analytical and curious", gender: "male" },
        { name: "Sam", personality: "Enthusiastic and knowledgeable", gender: "female" }
      ],
      episodes: [
        {
          _id: "ep1",
          title: "The Future of AI in 2024",
          summary: "Exploring the latest developments in artificial intelligence",
          audioUrl: "/demo-audio.mp3",
          createdAt: "2024-01-15T10:00:00Z"
        }
      ],
      owner: "0x123...",
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-15T10:00:00Z",
      totalViews: 1250,
      qualityScore: 0.85,
      followerCount: 450,
      episodeCount: 15
    },
    {
      _id: "2",
      title: "Comedy Corner",
      description: "Hilarious conversations and jokes from AI comedians",
      concept: "Comedy podcast with witty AI hosts",
      tone: "humorous",
      frequency: "weekly",
      length: "45 minutes",
      topics: ["Comedy", "Entertainment", "Pop Culture"],
      characters: [
        { name: "Jester", personality: "Witty and sarcastic", gender: "male" },
        { name: "Luna", personality: "Playful and clever", gender: "female" }
      ],
      episodes: [
        {
          _id: "ep2",
          title: "Why AI Can't Tell Dad Jokes",
          summary: "A humorous take on AI limitations in comedy",
          audioUrl: "/demo-audio.mp3",
          createdAt: "2024-01-10T15:00:00Z"
        }
      ],
      owner: "0x456...",
      createdAt: "2024-01-05T00:00:00Z",
      updatedAt: "2024-01-10T15:00:00Z",
      totalViews: 890,
      qualityScore: 0.78,
      followerCount: 320,
      episodeCount: 8
    },
    {
      _id: "3",
      title: "Learning Lab",
      description: "Educational content made engaging by AI tutors",
      concept: "Educational podcast with AI teachers",
      tone: "educational",
      frequency: "biweekly",
      length: "60 minutes",
      topics: ["Education", "Science", "History"],
      characters: [
        { name: "Professor Oak", personality: "Wise and patient", gender: "male" },
        { name: "Dr. Nova", personality: "Energetic and inspiring", gender: "female" }
      ],
      episodes: [
        {
          _id: "ep3",
          title: "The Science of Learning",
          summary: "How our brains process and retain information",
          audioUrl: "/demo-audio.mp3",
          createdAt: "2024-01-08T12:00:00Z"
        }
      ],
      owner: "0x789...",
      createdAt: "2024-01-03T00:00:00Z",
      updatedAt: "2024-01-08T12:00:00Z",
      totalViews: 2100,
      qualityScore: 0.92,
      followerCount: 680,
      episodeCount: 12
    }
  ]

  // Get unique categories from podcasts
  const categories = ["All", ...Array.from(new Set(mockPodcasts.flatMap(p => p.topics))).sort()]

  // Filter podcasts by category
  const filteredPodcasts = mockPodcasts.filter(podcast => {
    if (selectedCategory === "All") return true
    return podcast.topics.some(topic => topic.toLowerCase().includes(selectedCategory.toLowerCase()))
  })

  const getToneColor = (tone: string) => {
    switch (tone) {
      case "humorous": return "bg-yellow-100 text-yellow-800"
      case "educational": return "bg-blue-100 text-blue-800"
      case "casual": return "bg-green-100 text-green-800"
      case "professional": return "bg-purple-100 text-purple-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getFrequencyIcon = (frequency: string) => {
    switch (frequency) {
      case "daily": return "🗓️"
      case "weekly": return "📅"
      case "biweekly": return "📆"
      case "monthly": return "🗓"
      default: return "⏰"
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-6 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-br from-primary to-primary/70 text-transparent bg-clip-text mb-4">
            Explore AI Podcasts
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover amazing AI-generated podcasts created by our community. Listen to unique conversations, debates, and discussions on topics you love.
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "ghost"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className="rounded-full"
            >
              {category}
            </Button>
          ))}
        </div>

        {/* Podcasts Grid */}
        {filteredPodcasts.length === 0 ? (
          <div className="text-center py-12">
            <SpeakerLoudIcon className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No podcasts in this category</h3>
            <p className="text-muted-foreground mb-6">Try selecting a different category</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPodcasts.map((podcast) => {
              const latestEpisode = podcast.episodes && podcast.episodes.length > 0 
                ? podcast.episodes[podcast.episodes.length - 1] 
                : null;
              
              return (
              <Card key={podcast._id} className="group hover:shadow-2xl hover:shadow-primary/20 transition-all duration-500 ease-out border-border/50 bg-card/50 backdrop-blur-sm hover:scale-105 hover:-translate-y-2 hover:bg-card/80 cursor-pointer transform-gpu">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2 group-hover:text-primary transition-all duration-300 group-hover:scale-105">
                      {podcast.title}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {podcast.description}
                    </CardDescription>
                  </div>
                  <div className="ml-4">
                    <SpeakerLoudIcon className="w-6 h-6 text-primary group-hover:scale-110 group-hover:rotate-12 transition-all duration-300" />
                  </div>
                </div>

                {/* Podcast Meta */}
                <div className="flex flex-wrap gap-2 mt-3">
                  <Badge variant="secondary" className={`${getToneColor(podcast.tone)} group-hover:scale-105 transition-transform duration-200`}>
                    {podcast.tone}
                  </Badge>
                  <Badge variant="outline" className="text-xs group-hover:scale-105 transition-transform duration-200 delay-75">
                    {getFrequencyIcon(podcast.frequency)} {podcast.frequency}
                  </Badge>
                  <Badge variant="outline" className="text-xs group-hover:scale-105 transition-transform duration-200 delay-100">
                    <ClockIcon className="w-3 h-3 mr-1" />
                    {podcast.length}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Characters */}
                {podcast.characters && podcast.characters.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                      <PersonIcon className="w-4 h-4" />
                      AI Hosts
                    </h4>
                    <div className="space-y-1">
                      {podcast.characters.map((character, index) => (
                        <div key={index} className="text-xs text-muted-foreground">
                          <span className="font-medium">{character.name}:</span> {character.personality}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Topics */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Topics</h4>
                  <div className="flex flex-wrap gap-1">
                    {podcast.topics.slice(0, 3).map((topic, index) => (
                      <Badge key={topic} variant="secondary" className={`text-xs group-hover:scale-105 transition-transform duration-200`} style={{ transitionDelay: `${index * 50}ms` }}>
                        {topic}
                      </Badge>
                    ))}
                    {podcast.topics.length > 3 && (
                      <Badge variant="secondary" className="text-xs group-hover:scale-105 transition-transform duration-200 delay-150">
                        +{podcast.topics.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Latest Episode */}
                {latestEpisode && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Latest Episode</h4>
                    <div className="bg-muted/30 rounded-lg p-3 space-y-2 group-hover:bg-muted/50 transition-all duration-300">
                      <div className="text-sm font-medium">{latestEpisode.title}</div>
                      <div className="text-xs text-muted-foreground">{latestEpisode.summary}</div>
                      <div className="text-xs text-muted-foreground">
                        Created: {new Date(latestEpisode.createdAt).toLocaleDateString()}
                      </div>

                      {/* Audio Player */}
                      {latestEpisode.audioUrl && (
                        <div className="mt-2">
                          <InlineAudioPlayer src={latestEpisode.audioUrl} />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Episode Count and Stats */}
                <div className="text-xs text-muted-foreground space-y-1">
                  <div className="flex justify-between">
                    <span>Episodes:</span>
                    <span>{podcast.episodeCount || podcast.episodes?.length || 0}</span>
                  </div>
                  {podcast.followerCount && (
                    <div className="flex justify-between">
                      <span>Followers:</span>
                      <span>{podcast.followerCount.toLocaleString()}</span>
                    </div>
                  )}
                  {podcast.totalViews && (
                    <div className="flex justify-between">
                      <span>Total Views:</span>
                      <span>{podcast.totalViews.toLocaleString()}</span>
                    </div>
                  )}
                  {podcast.qualityScore && (
                    <div className="flex justify-between">
                      <span>Quality Score:</span>
                      <span>★{podcast.qualityScore.toFixed(1)}</span>
                    </div>
                  )}
                  {podcast.totalEarnings && (
                    <div className="flex justify-between">
                      <span>Earnings:</span>
                      <span>${podcast.totalEarnings.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2 opacity-80 group-hover:opacity-100 transition-all duration-300">
                  <Button size="sm" className="flex-1 group-hover:scale-105 transition-transform duration-200" asChild>
                    <Link href={`/podcasts/${podcast._id}`}>
                      <PlayIcon className="w-4 h-4 mr-1" />
                      View
                    </Link>
                  </Button>
                  <Button size="sm" variant="ghost" className="flex-1 group-hover:scale-105 transition-transform duration-200 group-hover:border-primary/50" asChild>
                    <Link href={`/episodes?podcast=${podcast._id}`}>
                      <SpeakerLoudIcon className="w-4 h-4 mr-1" />
                      Episodes
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
              );
            })}
          </div>
        )}

        {/* Call to Action */}
        <div className="text-center mt-16 py-12 bg-gradient-to-r from-primary/5 to-primary/10 rounded-2xl">
          <h2 className="text-2xl font-bold mb-4">Ready to Create Your Own?</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Join our community and create your own AI-powered podcast. It's easier than you think!
          </p>
          <Button size="lg" asChild>
            <Link href="/podcasts">
              <SpeakerLoudIcon className="w-5 h-5 mr-2" />
              Get Started
            </Link>
          </Button>
        </div>
      </main>
    </div>
  )
}