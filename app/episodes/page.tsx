"use client"

import { useState, useEffect } from "react"
import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useAudioPlayer } from "@/components/audio-player-provider"
import { useAuth } from "@/lib/auth-context"
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

interface Episode {
  _id: string;
  title: string;
  summary: string;
  audioUrl: string;
  totalViews: number;
  hasAds: boolean;
  adCount: number;
  totalEarnings: number;
  createdAt: string;
  podcast: {
    _id: string;
    title: string;
  };
}

const statusColors = {
  published: "bg-green-100 text-green-800",
  scheduled: "bg-blue-100 text-blue-800",
  draft: "bg-gray-100 text-gray-800",
}

export default function Episodes() {
  const { address, isAuthenticated } = useAuth()
  const [episodes, setEpisodes] = useState<Episode[]>([])
  const [podcasts, setPodcasts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [podcastFilter, setPodcastFilter] = useState("all")
  const { playEpisode } = useAudioPlayer()

  useEffect(() => {
    if (isAuthenticated && address) {
      fetchEpisodesAndPodcasts()
    }
  }, [isAuthenticated, address])

  const fetchEpisodesAndPodcasts = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Fetch podcasts first
      const podcastsResponse = await fetch('/api/podcasts', {
        headers: {
          'Authorization': `Bearer ${address}`,
        },
      })
      
      if (podcastsResponse.ok) {
        const podcastsData = await podcastsResponse.json()
        setPodcasts(podcastsData || [])
        
        // Fetch all episodes for all podcasts
        const allEpisodes: Episode[] = []
        
        for (const podcast of podcastsData || []) {
          try {
            const episodesResponse = await fetch(`/api/podcasts/${podcast._id}/episodes`, {
              headers: {
                'Authorization': `Bearer ${address}`,
              },
            })
            
            if (episodesResponse.ok) {
              const episodesData = await episodesResponse.json()
              const episodesWithPodcast = (episodesData.episodes || []).map((episode: any) => ({
                ...episode,
                podcast: {
                  _id: podcast._id,
                  title: podcast.title
                }
              }))
              allEpisodes.push(...episodesWithPodcast)
            }
          } catch (episodeError) {
            console.error(`Error fetching episodes for podcast ${podcast._id}:`, episodeError)
          }
        }
        
        setEpisodes(allEpisodes)
      } else {
        throw new Error('Failed to fetch podcasts')
      }
    } catch (err) {
      console.error('Error fetching data:', err)
      setError('Failed to load episodes')
      setEpisodes([])
      setPodcasts([])
    } finally {
      setLoading(false)
    }
  }

  const handlePlayEpisode = (episode: Episode) => {
    const playerEpisode = {
      id: episode._id,
      title: episode.title,
      podcast: episode.podcast.title,
      duration: "Unknown", // We don't store duration separately
      description: episode.summary,
      audioUrl: episode.audioUrl,
    }
    
    const episodesForPlayer = episodes.map((ep) => ({
      id: ep._id,
      title: ep.title,
      podcast: ep.podcast.title,
      duration: "Unknown",
      description: ep.summary,
      audioUrl: ep.audioUrl,
    }))
    
    playEpisode(playerEpisode, episodesForPlayer)
  }

  const getEpisodeStatus = (episode: Episode) => {
    // Since we don't have explicit status, determine based on data
    if (episode.audioUrl && episode.title) {
      return 'published'
    }
    return 'draft'
  }

  const filteredEpisodes = episodes.filter((episode) => {
    const matchesSearch =
      episode.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      episode.podcast.title.toLowerCase().includes(searchTerm.toLowerCase())
    const episodeStatus = getEpisodeStatus(episode)
    const matchesStatus = statusFilter === "all" || episodeStatus === statusFilter
    const matchesPodcast = podcastFilter === "all" || episode.podcast.title === podcastFilter

    return matchesSearch && matchesStatus && matchesPodcast
  })

  const uniquePodcasts = Array.from(new Set(episodes.map((ep) => ep.podcast.title)))

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Episodes</h1>
          <p className="text-muted-foreground">Manage all your AI-generated podcast episodes across all shows</p>
        </div>

        {!isAuthenticated ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground mb-4">Please connect your wallet to view your episodes.</p>
              <Button>Connect Wallet</Button>
            </CardContent>
          </Card>
        ) : loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading episodes...</p>
          </div>
        ) : error ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={fetchEpisodesAndPodcasts}>Try Again</Button>
            </CardContent>
          </Card>
        ) : (
          <>
        

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Episodes</p>
                  <p className="text-2xl font-bold">{episodes.length}</p>
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
                  <p className="text-2xl font-bold">{episodes.filter((ep) => getEpisodeStatus(ep) === "published").length}</p>
                </div>
                <EyeOpenIcon className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Drafts</p>
                  <p className="text-2xl font-bold">{episodes.filter((ep) => getEpisodeStatus(ep) === "draft").length}</p>
                </div>
                <CalendarIcon className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Views</p>
                  <p className="text-2xl font-bold">
                    {episodes.reduce((sum, ep) => sum + (ep.totalViews || 0), 0).toLocaleString()}
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
                  placeholder="Search by episode title, topic, or content..."
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
                {filteredEpisodes.map((episode) => {
                  const episodeStatus = getEpisodeStatus(episode)
                  return (
                    <TableRow key={episode._id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{episode.title}</p>
                          <p className="text-sm text-muted-foreground line-clamp-1">{episode.summary}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{episode.podcast.title}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[episodeStatus as keyof typeof statusColors]}>
                          {episodeStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(episode.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>~30 min</TableCell>
                      <TableCell>{(episode.totalViews || 0).toLocaleString()}</TableCell>
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
                  )
                })}
              </TableBody>
            </Table>

            {filteredEpisodes.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No episodes found matching your criteria.</p>
              </div>
            )}
          </CardContent>
        </Card>
          </>
        )}
      </main>
    </div>
  )
}
