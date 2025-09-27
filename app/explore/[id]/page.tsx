"use client"

import { useParams, useRouter } from "next/navigation"
import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeftIcon, SpeakerLoudIcon, PlayIcon, PersonIcon, ClockIcon, CalendarIcon } from "@radix-ui/react-icons"
import Link from "next/link"
import { InlineAudioPlayer } from "@/components/inline-audio-player"

// Mock data for individual podcast (in a real app, this would come from an API)
const mockPodcastData = {
  "1": {
    id: "1",
    title: "AI After Dark",
    description: "Two AI hosts debate the latest tech news with humor and insight",
    concept: "A weekly podcast where two AI hosts debate the latest tech news. One is a cautious skeptic, the other a wild optimist. They dive deep into AI developments, tech controversies, and future predictions with wit and wisdom.",
    tone: "humorous",
    frequency: "weekly",
    length: "medium",
    characters: [
      { 
        name: "Alex", 
        personality: "Cautious skeptic who questions everything and loves to play devil's advocate", 
        gender: "male",
        bio: "Alex is the voice of reason in the chaos of tech hype. With a background in cybersecurity, Alex always asks the tough questions about privacy, ethics, and unintended consequences."
      },
      { 
        name: "Zara", 
        personality: "Wild optimist who sees potential everywhere and gets excited about possibilities", 
        gender: "female",
        bio: "Zara is a futurist at heart, always looking for the next breakthrough that could change the world. Her infectious enthusiasm balances Alex's skepticism perfectly."
      }
    ],
    topics: ["AI", "Technology", "Future", "Innovation", "Ethics", "Privacy"],
    episodes: [
      {
        id: "e1",
        title: "The Great AI Debate: Friend or Foe?",
        summary: "Alex and Zara clash over whether AI will save humanity or doom us all. They discuss recent AI breakthroughs, potential risks, and why we should (or shouldn't) be worried.",
        audioUrl: "/demo-audio.mp3",
        duration: "15:32",
        publishedAt: "2024-01-15"
      },
      {
        id: "e2", 
        title: "ChatGPT vs. The World: Who's Winning?",
        summary: "The hosts dive into the AI chatbot wars, comparing different models and discussing what makes a good AI assistant.",
        audioUrl: "/demo-audio.mp3",
        duration: "18:45",
        publishedAt: "2024-01-08"
      },
      {
        id: "e3",
        title: "Self-Driving Cars: Are We There Yet?",
        summary: "Alex questions the safety of autonomous vehicles while Zara argues they're the future of transportation.",
        audioUrl: "/demo-audio.mp3", 
        duration: "22:15",
        publishedAt: "2024-01-01"
      }
    ],
    createdAt: "2023-12-01",
    followers: 1247,
    totalEpisodes: 12
  }
}

export default function PodcastDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { id } = params

  const podcast = mockPodcastData[id as keyof typeof mockPodcastData]

  if (!podcast) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-6 py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Podcast Not Found</h1>
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
                    {podcast.followers.toLocaleString()} followers
                  </div>
                  <div className="flex items-center gap-1">
                    <SpeakerLoudIcon className="w-4 h-4" />
                    {podcast.totalEpisodes} episodes
                  </div>
                  <div className="flex items-center gap-1">
                    <CalendarIcon className="w-4 h-4" />
                    {podcast.frequency} releases
                  </div>
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
              </CardContent>
            </Card>

            {/* Episodes */}
            <Card>
              <CardHeader>
                <CardTitle>Episodes</CardTitle>
                <CardDescription>Latest episodes from {podcast.title}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {podcast.episodes.map((episode, index) => (
                  <div key={episode.id} className="border rounded-lg p-4 bg-muted/20">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium mb-1">{episode.title}</h4>
                        <p className="text-sm text-muted-foreground mb-2">{episode.summary}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Episode {podcast.episodes.length - index}</span>
                          <span>{episode.duration}</span>
                          <span>{new Date(episode.publishedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Audio Player */}
                    <div className="mt-3">
                      <InlineAudioPlayer src={episode.audioUrl} />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* AI Hosts */}
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
                    <p className="text-xs text-muted-foreground">{character.bio}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Create Your Own CTA */}
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg">Inspired?</CardTitle>
                <CardDescription>Create your own AI podcast just like this one</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" asChild>
                  <Link href="/">
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