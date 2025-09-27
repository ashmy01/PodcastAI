import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Create Podcast",
  description: "Create a new AI-powered podcast with natural language descriptions",
}

export default function CreateLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
