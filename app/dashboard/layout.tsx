import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Manage your AI-powered podcasts and view analytics",
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
