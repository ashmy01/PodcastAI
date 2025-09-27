import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your account preferences and podcast settings",
}

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
