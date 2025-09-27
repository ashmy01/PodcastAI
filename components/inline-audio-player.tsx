"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "./ui/button"
import { Slider } from "./ui/slider"
import {
  PlayIcon,
  PauseIcon,
  SpeakerLoudIcon,
  SpeakerModerateIcon,
  SpeakerQuietIcon,
} from "@radix-ui/react-icons"

interface InlineAudioPlayerProps {
  src: string;
}

export function InlineAudioPlayer({ src }: InlineAudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(75)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateTime = () => setCurrentTime(audio.currentTime)
    const updateDuration = () => setDuration(audio.duration)

    audio.addEventListener("timeupdate", updateTime)
    audio.addEventListener("loadedmetadata", updateDuration)
    audio.addEventListener("ended", () => setIsPlaying(false))

    return () => {
      audio.removeEventListener("timeupdate", updateTime)
      audio.removeEventListener("loadedmetadata", updateDuration)
      audio.removeEventListener("ended", () => setIsPlaying(false))
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

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return "0:00";
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

  return (
    <div className="flex items-center gap-4 p-2 rounded-lg border bg-muted/50">
      <audio ref={audioRef} src={src} preload="metadata" />

      <Button onClick={togglePlay} size="icon" variant="ghost" className="!text-green-600 hover:!text-green-700 hover:!bg-green-50 border-green-200 hover:border-green-300">
        {isPlaying ? <PauseIcon className="w-5 h-5 text-green-600" /> : <PlayIcon className="w-5 h-5 text-green-600" />}
      </Button>

      <div className="flex items-center gap-2 flex-1">
        <span className="text-xs text-muted-foreground w-10">{formatTime(currentTime)}</span>
        <Slider value={[currentTime]} max={duration} step={1} onValueChange={handleSeek} className="flex-1" />
        <span className="text-xs text-muted-foreground w-10">{formatTime(duration)}</span>
      </div>

      <div className="flex items-center gap-2">
        <VolumeIcon className="w-5 h-5 text-muted-foreground" />
        <Slider value={[volume]} max={100} step={1} onValueChange={handleVolumeChange} className="w-20" />
      </div>
    </div>
  )
}
