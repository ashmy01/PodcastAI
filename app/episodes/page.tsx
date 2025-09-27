"use client"

import { useState } from "react"
import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useAudioPlayer } from "@/components/audio-player-provider"
import {
  PlayIcon,
  DotsHorizontalIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  ClockIcon,
  EyeOpenIcon,
  Pencil1Icon,
  TrashIcon,
} from "@radix-ui/react-icons"

// Mock data for episodes
const mockEpisodes = [
  {
    id: 1,
    title: "The Future of AI in Healthcare",
    podcast: "Tech Talk Weekly",
    status: "published",
    publishDate: "2024-01-15",
    duration: "24:30",
    plays: 1247,
    description: "Exploring how artificial intelligence is revolutionizing medical diagnosis and treatment.",
  },
  {
    id: 2,
    title: "Quantum Computing Breakthroughs",
    podcast: "AI Insights",
    status: "published",
    publishDate: "2024-01-12",
    duration: "18:45",
    plays: 892,
    description: "Latest developments in quantum computing and their implications for the future.",
  },
  {
    id: 3,
    title: "Building a Successful Startup",
    podcast: "Startup Stories",
    status: "scheduled",
    publishDate: "2024-01-20",
    duration: "32:15",
    plays: 0,
    description: "Lessons learned from successful entrepreneurs about building and scaling startups.",
  },
  {
    id: 4,
    title: "Machine Learning Ethics",
    podcast: "Tech Talk Weekly",
    status: "draft",
    publishDate: "2024-01-18",
    duration: "21:20",
    plays: 0,
    description: "Discussing the ethical implications of machine learning and AI decision-making.",
  },
  {
    id: 5,
    title: "The Rise of Edge Computing",
    podcast: "AI Insights",
    status: "published",
    publishDate: "2024-01-10",
    duration: "26:10",
    plays: 1534,
    description: "How edge computing is changing the landscape of data processing and IoT.",
  },
]

const statusColors = {
  published: "bg-green-100 text-green-800",
  scheduled: "bg-blue-100 text-blue-800",
  draft: "bg-gray-100 text-gray-800",
}

export default function Episodes() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [podcastFilter, setPodcastFilter] = useState("all")
  const { playEpisode } = useAudioPlayer()

  const episodesForPlayer = mockEpisodes.map((ep) => ({
    id: ep.id,
    title: ep.title,
    podcast: ep.podcast,
    duration: ep.duration,
    description: ep.description,
    audioUrl: `/placeholder-audio-${ep.id}.mp3`,
  }))

  const handlePlayEpisode = (episode: (typeof mockEpisodes)[0]) => {
    const playerEpisode = {
      id: episode.id,
      title: episode.title,
      podcast: episode.podcast,
      duration: episode.duration,
      description: episode.description,
      audioUrl: `/placeholder-audio-${episode.id}.mp3`,
    }
    playEpisode(playerEpisode, episodesForPlayer)
  }

  const filteredEpisodes = mockEpisodes.filter((episode) => {
    const matchesSearch =
      episode.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      episode.podcast.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || episode.status === statusFilter
    const matchesPodcast = podcastFilter === "all" || episode.podcast === podcastFilter

    return matchesSearch && matchesStatus && matchesPodcast
  })

  const uniquePodcasts = Array.from(new Set(mockEpisodes.map((ep) => ep.podcast)))

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Episodes</h1>
          <p className="text-muted-foreground">Manage all your AI-generated podcast episodes across all shows</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Episodes</p>
                  <p className="text-2xl font-bold">{mockEpisodes.length}</p>
                </div>
                <PlayIcon className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Published</p>
                  <p className="text-2xl font-bold">{mockEpisodes.filter((ep) => ep.status === "published").length}</p>
                </div>
                <EyeOpenIcon className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Scheduled</p>
                  <p className="text-2xl font-bold">{mockEpisodes.filter((ep) => ep.status === "scheduled").length}</p>
                </div>
                <CalendarIcon className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Plays</p>
                  <p className="text-2xl font-bold">
                    {mockEpisodes.reduce((sum, ep) => sum + ep.plays, 0).toLocaleString()}
                  </p>
                </div>
                <ClockIcon className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search episodes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>

              <Select value={podcastFilter} onValueChange={setPodcastFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Podcast" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Podcasts</SelectItem>
                  {uniquePodcasts.map((podcast) => (
                    <SelectItem key={podcast} value={podcast}>
                      {podcast}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Episodes Table */}
        <Card>
          <CardHeader>
            <CardTitle>Episodes ({filteredEpisodes.length})</CardTitle>
            <CardDescription>Manage your podcast episodes, view analytics, and control publishing</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Episode</TableHead>
                  <TableHead>Podcast</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Publish Date</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Plays</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEpisodes.map((episode) => (
                  <TableRow key={episode.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{episode.title}</p>
                        <p className="text-sm text-muted-foreground line-clamp-1">{episode.description}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{episode.podcast}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[episode.status as keyof typeof statusColors]}>
                        {episode.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{episode.publishDate}</TableCell>
                    <TableCell>{episode.duration}</TableCell>
                    <TableCell>{episode.plays.toLocaleString()}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <DotsHorizontalIcon className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="gap-2" onClick={() => handlePlayEpisode(episode)}>
                            <PlayIcon className="w-4 h-4" />
                            Play
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2">
                            <EyeOpenIcon className="w-4 h-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2">
                            <Pencil1Icon className="w-4 h-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2 text-destructive">
                            <TrashIcon className="w-4 h-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {filteredEpisodes.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No episodes found matching your criteria.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
