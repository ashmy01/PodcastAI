"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "./ui/button"
import { Slider } from "./ui/slider"
import { Badge } from "./ui/badge"
import {
  PlayIcon,
  PauseIcon,
  TrackPreviousIcon,
  TrackNextIcon,
  SpeakerLoudIcon,
  SpeakerModerateIcon,
  SpeakerQuietIcon,
  Cross2Icon,
  ListBulletIcon,
} from "@radix-ui/react-icons"
import { cn } from "@/lib/utils"

interface Episode {
  id: number
  title: string
  podcast: string
  duration: string
  audioUrl?: string
  description: string
}

interface AudioPlayerProps {
  episode: Episode | null
  playlist: Episode[]
  onClose: () => void
  onEpisodeChange: (episode: Episode) => void
}

export function AudioPlayer({ episode, playlist, onClose, onEpisodeChange }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(75)
  const [showPlaylist, setShowPlaylist] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  // Mock audio duration parsing
  const parseDuration = (durationStr: string) => {
    const [minutes, seconds] = durationStr.split(":").map(Number)
    return minutes * 60 + seconds
  }

  useEffect(() => {
    if (episode) {
      setDuration(parseDuration(episode.duration))
    }
  }, [episode])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateTime = () => setCurrentTime(audio.currentTime)
    const updateDuration = () => setDuration(audio.duration)

    audio.addEventListener("timeupdate", updateTime)
    audio.addEventListener("loadedmetadata", updateDuration)
    audio.addEventListener("ended", handleNext)

    return () => {
      audio.removeEventListener("timeupdate", updateTime)
      audio.removeEventListener("loadedmetadata", updateDuration)
      audio.removeEventListener("ended", handleNext)
    }
  }, [])

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
    } else {
      audio.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleSeek = (value: number[]) => {
    const audio = audioRef.current
    if (!audio) return

    const newTime = value[0]
    audio.currentTime = newTime
    setCurrentTime(newTime)
  }

  const handleVolumeChange = (value: number[]) => {
    const audio = audioRef.current
    const newVolume = value[0]
    setVolume(newVolume)

    if (audio) {
      audio.volume = newVolume / 100
    }
  }

  const handlePrevious = () => {
    if (!episode) return
    const currentIndex = playlist.findIndex((ep) => ep.id === episode.id)
    if (currentIndex > 0) {
      onEpisodeChange(playlist[currentIndex - 1])
    }
  }

  const handleNext = () => {
    if (!episode) return
    const currentIndex = playlist.findIndex((ep) => ep.id === episode.id)
    if (currentIndex < playlist.length - 1) {
      onEpisodeChange(playlist[currentIndex + 1])
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const getVolumeIcon = () => {
    if (volume === 0) return SpeakerQuietIcon
    if (volume < 50) return SpeakerModerateIcon
    return SpeakerLoudIcon
  }

  const VolumeIcon = getVolumeIcon()

  if (!episode) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border shadow-lg">
      <audio ref={audioRef} src={episode.audioUrl || "/placeholder-audio.mp3"} />

      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center gap-4">
          {/* Episode Info */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <PlayIcon className="w-6 h-6 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium truncate">{episode.title}</p>
              <p className="text-sm text-muted-foreground truncate">
                <Badge variant="outline" className="mr-2">
                  {episode.podcast}
                </Badge>
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handlePrevious} disabled={playlist.length <= 1}>
              <TrackPreviousIcon className="w-4 h-4" />
            </Button>

            <Button onClick={togglePlay} size="sm" className="w-10 h-10 rounded-full">
              {isPlaying ? <PauseIcon className="w-4 h-4" /> : <PlayIcon className="w-4 h-4" />}
            </Button>

            <Button variant="ghost" size="sm" onClick={handleNext} disabled={playlist.length <= 1}>
              <TrackNextIcon className="w-4 h-4" />
            </Button>
          </div>

          {/* Progress */}
          <div className="hidden md:flex items-center gap-3 flex-1 max-w-md">
            <span className="text-xs text-muted-foreground w-10">{formatTime(currentTime)}</span>
            <Slider value={[currentTime]} max={duration} step={1} onValueChange={handleSeek} className="flex-1" />
            <span className="text-xs text-muted-foreground w-10">{formatTime(duration)}</span>
          </div>

          {/* Volume */}
          <div className="hidden lg:flex items-center gap-2">
            <VolumeIcon className="w-4 h-4 text-muted-foreground" />
            <Slider value={[volume]} max={100} step={1} onValueChange={handleVolumeChange} className="w-20" />
          </div>

          {/* Additional Controls */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPlaylist(!showPlaylist)}
              className={cn(showPlaylist && "bg-muted")}
            >
              <ListBulletIcon className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <Cross2Icon className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Mobile Progress */}
        <div className="md:hidden mt-2">
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">{formatTime(currentTime)}</span>
            <Slider value={[currentTime]} max={duration} step={1} onValueChange={handleSeek} className="flex-1" />
            <span className="text-xs text-muted-foreground">{formatTime(duration)}</span>
          </div>
        </div>
      </div>

      {/* Playlist */}
      {showPlaylist && (
        <div className="border-t border-border bg-card">
          <div className="container mx-auto px-4 py-3 max-h-64 overflow-y-auto">
            <h4 className="font-medium mb-3">Playlist ({playlist.length} episodes)</h4>
            <div className="space-y-2">
              {playlist.map((ep) => (
                <div
                  key={ep.id}
                  className={cn(
                    "flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors",
                    ep.id === episode.id && "bg-primary/10",
                  )}
                  onClick={() => onEpisodeChange(ep)}
                >
                  <div className="w-8 h-8 bg-primary/10 rounded flex items-center justify-center flex-shrink-0">
                    {ep.id === episode.id && isPlaying ? (
                      <PauseIcon className="w-3 h-3 text-primary" />
                    ) : (
                      <PlayIcon className="w-3 h-3 text-primary" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{ep.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {ep.podcast} • {ep.duration}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
