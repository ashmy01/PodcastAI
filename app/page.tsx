import { Background } from "@/components/background"
import { Footer } from "@/components/footer"
import { PodcastHero } from "@/components/podcast-hero"

export default function Home() {
  return (
    <main className="p-inset h-[100dvh] w-full">
      <div className="relative h-full w-full">
        <Background src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/alt-g7Cv2QzqL3k6ey3igjNYkM32d8Fld7.mp4" placeholder="/hero-background.png" />
        <PodcastHero />
        <Footer />
      </div>
    </main>
  )
}
