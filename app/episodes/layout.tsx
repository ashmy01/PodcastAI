import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Episodes",
  description: "Manage all your AI-generated podcast episodes",
}

export default function EpisodesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
