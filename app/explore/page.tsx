"use client"

import { useEffect, useState } from "react"
import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SpeakerLoudIcon, PlayIcon, PersonIcon, ClockIcon } from "@radix-ui/react-icons"
import Link from "next/link"
import { InlineAudioPlayer } from "@/components/inline-audio-player"

// Mock data for public podcasts (in a real app, this would come from an API)
const mockPodcasts = [
  {
    id: "1",
    title: "AI After Dark",
    description: "Two AI hosts debate the latest tech news with humor and insight",
    concept: "A weekly podcast where two AI hosts debate the latest tech news. One is a cautious skeptic, the other a wild optimist.",
    tone: "humorous",
    frequency: "weekly",
    length: "medium",
    characters: [
      { name: "Alex", personality: "Cautious skeptic who questions everything", gender: "male" },
      { name: "Zara", personality: "Wild optimist who sees potential everywhere", gender: "female" }
    ],
    topics: ["AI", "Technology", "Future", "Innovation"],
    episodes: [
      {
        id: "e1",
        title: "The Great AI Debate: Friend or Foe?",
        summary: "Alex and Zara clash over whether AI will save humanity or doom us all.",
        audioUrl: "/demo-audio.mp3",
        duration: "15:32"
      }
    ],
    createdAt: "2024-01-15"
  },
  {
    id: "2",
    title: "Cosmic Conversations",
    description: "Exploring the mysteries of the universe with AI-powered discussions",
    concept: "Two AI astronomers discuss space discoveries, theories, and the search for extraterrestrial life.",
    tone: "educational",
    frequency: "biweekly",
    length: "long",
    characters: [
      { name: "Dr. Nova", personality: "Brilliant astrophysicist with endless curiosity", gender: "female" },
      { name: "Professor Stellar", personality: "Wise space philosopher who connects cosmos to life", gender: "male" }
    ],
    topics: ["Space", "Astronomy", "Physics", "Universe"],
    episodes: [
      {
        id: "e2",
        title: "Black Holes: The Universe's Greatest Mystery",
        summary: "Dr. Nova and Professor Stellar dive deep into the enigmatic world of black holes.",
        audioUrl: "/demo-audio.mp3",
        duration: "28:45"
      }
    ],
    createdAt: "2024-01-10"
  },
  {
    id: "3",
    title: "The Startup Chronicles",
    description: "AI entrepreneurs share their journey through the startup world",
    concept: "Two AI startup founders discuss the ups and downs of building a company from scratch.",
    tone: "casual",
    frequency: "weekly",
    length: "short",
    characters: [
      { name: "Maya", personality: "Energetic founder who loves taking risks", gender: "female" },
      { name: "Sam", personality: "Analytical co-founder who focuses on metrics", gender: "male" }
    ],
    topics: ["Startups", "Business", "Entrepreneurship", "Innovation"],
    episodes: [
      {
        id: "e3",
        title: "From Idea to MVP in 30 Days",
        summary: "Maya and Sam share their rapid prototyping journey and lessons learned.",
        audioUrl: "/demo-audio.mp3",
        duration: "12:18"
      }
    ],
    createdAt: "2024-01-08"
  }
]

export default function ExplorePage() {
  const [podcasts, setPodcasts] = useState(mockPodcasts)
  const [selectedCategory, setSelectedCategory] = useState("All")

  const categories = ["All", "Technology", "Science", "Business", "Entertainment", "Education"]

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
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className="rounded-full"
            >
              {category}
            </Button>
          ))}
        </div>

        {/* Podcasts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {podcasts.map((podcast) => (
            <Card key={podcast.id} className="group hover:shadow-2xl hover:shadow-primary/20 transition-all duration-500 ease-out border-border/50 bg-card/50 backdrop-blur-sm hover:scale-105 hover:-translate-y-2 hover:bg-card/80 cursor-pointer transform-gpu">
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
                {podcast.episodes.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Latest Episode</h4>
                    <div className="bg-muted/30 rounded-lg p-3 space-y-2 group-hover:bg-muted/50 transition-all duration-300">
                      <div className="text-sm font-medium">{podcast.episodes[0].title}</div>
                      <div className="text-xs text-muted-foreground">{podcast.episodes[0].summary}</div>
                      <div className="text-xs text-muted-foreground">Duration: {podcast.episodes[0].duration}</div>

                      {/* Demo Audio Player */}
                      <div className="mt-2">
                        <InlineAudioPlayer src="/demo-audio.mp3" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2 opacity-80 group-hover:opacity-100 transition-all duration-300">
                  <Button size="sm" className="flex-1 group-hover:scale-105 transition-transform duration-200" asChild>
                    <Link href={`/explore/${podcast.id}`}>
                      <PlayIcon className="w-4 h-4 mr-1" />
                      Listen
                    </Link>
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1 group-hover:scale-105 transition-transform duration-200 group-hover:border-primary/50">
                    <SpeakerLoudIcon className="w-4 h-4 mr-1" />
                    Follow
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16 py-12 bg-gradient-to-r from-primary/5 to-primary/10 rounded-2xl">
          <h2 className="text-2xl font-bold mb-4">Ready to Create Your Own?</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Join our community and create your own AI-powered podcast. It's easier than you think!
          </p>
          <Button size="lg" asChild>
            <Link href="create/">
              <SpeakerLoudIcon className="w-5 h-5 mr-2" />
              Get Started
            </Link>
          </Button>
        </div>
      </main>
    </div>
  )
}