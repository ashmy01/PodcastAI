"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import { AudioPlayer } from "./audio-player"

interface Episode {
  id: number
  title: string
  podcast: string
  duration: string
  audioUrl?: string
  description: string
}

interface AudioPlayerContextType {
  currentEpisode: Episode | null
  playlist: Episode[]
  playEpisode: (episode: Episode, playlist?: Episode[]) => void
  closePlayer: () => void
}

const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(undefined)

export function AudioPlayerProvider({ children }: { children: ReactNode }) {
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null)
  const [playlist, setPlaylist] = useState<Episode[]>([])

  const playEpisode = (episode: Episode, newPlaylist: Episode[] = []) => {
    setCurrentEpisode(episode)
    setPlaylist(newPlaylist.length > 0 ? newPlaylist : [episode])
  }

  const closePlayer = () => {
    setCurrentEpisode(null)
    setPlaylist([])
  }

  const handleEpisodeChange = (episode: Episode) => {
    setCurrentEpisode(episode)
  }

  return (
    <AudioPlayerContext.Provider value={{ currentEpisode, playlist, playEpisode, closePlayer }}>
      {children}
      <AudioPlayer
        episode={currentEpisode}
        playlist={playlist}
        onClose={closePlayer}
        onEpisodeChange={handleEpisodeChange}
      />
    </AudioPlayerContext.Provider>
  )
}

export function useAudioPlayer() {
  const context = useContext(AudioPlayerContext)
  if (context === undefined) {
    throw new Error("useAudioPlayer must be used within an AudioPlayerProvider")
  }
  return context
}
