import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "My Podcasts",
  description: "Manage your AI-powered podcast series and track performance",
}

export default function PodcastsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
