"use client"

import { useEffect, useState } from "react"
import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlusIcon, SpeakerLoudIcon } from "@radix-ui/react-icons"
import Link from "next/link"
import { IPodcast } from "@/lib/models/Podcast"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/lib/auth-context"
import { authenticatedFetch } from "@/lib/api-client"

export default function Dashboard() {
  const { address } = useAuth()
  const [podcasts, setPodcasts] = useState<IPodcast[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchPodcasts = async () => {
      if (!address) return
      
      try {
        const response = await authenticatedFetch('/api/podcasts', {}, address)
        if (response.ok) {
          const data = await response.json()
          setPodcasts(data)
        } else {
          console.error("Failed to fetch podcasts")
        }
      } catch (error) {
        console.error("Error fetching podcasts:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPodcasts()
  }, [address])

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Navigation />

      <main className="container mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back! Here's an overview of your AI-powered podcasts.</p>
          </div>
          <Link href="/create">
            <Button>
              <PlusIcon className="mr-2 h-4 w-4" /> Create New Podcast
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="text-center">
            <p>Loading podcasts...</p>
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Your Active Podcasts</CardTitle>
              <CardDescription>Manage and monitor your AI-generated podcast series</CardDescription>
            </CardHeader>
            <CardContent>
              {podcasts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {podcasts.map((podcast) => (
                    <div key={podcast._id} className="p-4 border rounded-lg bg-card">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                          <SpeakerLoudIcon className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{podcast.title}</h3>
                          <p className="text-sm text-muted-foreground">{podcast.episodes.length} episodes</p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {podcast.concept}
                      </p>
                      <div className="flex gap-2">
                        <Link href={`/podcasts/${podcast._id}`}>
                          <Button size="sm" variant="outline">
                            View
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <h3 className="text-lg font-semibold">No podcasts yet!</h3>
                  <p className="text-muted-foreground mb-4">Get started by creating your first AI-powered podcast.</p>
                  <Link href="/create">
                    <Button>
                      <PlusIcon className="mr-2 h-4 w-4" /> Create Podcast
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </main>
      </div>
    </ProtectedRoute>
  )
}