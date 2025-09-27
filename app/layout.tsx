import type React from "react"
import type { Metadata } from "next"
import { Source_Sans_3, Roboto_Mono, Playfair_Display } from "next/font/google"
import "./globals.css"
import { cn } from "@/lib/utils"
import { V0Provider } from "@/lib/context"
import dynamic from "next/dynamic"
import { AudioPlayerProvider } from "@/components/audio-player-provider"
import { WagmiProviderWrapper } from "@/components/providers/wagmi-provider"
import { Toaster } from "sonner"

const V0Setup = dynamic(() => import("@/components/v0-setup"))

const sourceSans = Source_Sans_3({
  variable: "--font-source-sans",
  subsets: ["latin"],
})

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
})

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair-display",
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
})

const isV0 = process.env["VERCEL_URL"]?.includes("vusercontent.net") ?? false

export const metadata: Metadata = {
  title: {
    template: "%s | PodcastAI",
    default: "PodcastAI",
  },
  description:
    "Create dynamic AI-powered podcasts with natural language. Generate multi-character conversations, auto-refresh content, and produce high-quality audio with just a simple description.",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
  <body className={cn(sourceSans.variable, robotoMono.variable, playfairDisplay.variable, "font-sans")}> 
        <WagmiProviderWrapper>
          <V0Provider isV0={isV0}>
            <AudioPlayerProvider>
              {children}
              {isV0 && <V0Setup />}
              <Toaster position="top-right" richColors />
            </AudioPlayerProvider>
          </V0Provider>
        </WagmiProviderWrapper>
      </body>
    </html>
  )
}
