"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Play, Pause, SkipForward, SkipBack, Volume2, Volume1, VolumeX } from "lucide-react"
import { formatDuration } from "@/lib/spotify-client"
import { useToast } from "@/components/ui/use-toast"

interface MusicPlayerProps {
  playlistId: string
  accessToken: string | null
  onTrackPlay: (track: any) => void
  currentTrack: any
  isPlaying: boolean
  onPlayPause: () => void
  onNext: () => void
  onPrevious: () => void
}

export default function MusicPlayer({
  playlistId,
  accessToken,
  onTrackPlay,
  currentTrack,
  isPlaying,
  onPlayPause,
  onNext,
  onPrevious,
}: MusicPlayerProps) {
  const [volume, setVolume] = useState(0.7)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const progressInterval = useRef<NodeJS.Timeout | null>(null)
  const { toast } = useToast()

  // Update progress bar
  useEffect(() => {
    if (isPlaying) {
      // Clear any existing interval
      if (progressInterval.current) {
        clearInterval(progressInterval.current)
      }

      // Start a new interval to update progress
      const startTime = Date.now() - progress
      progressInterval.current = setInterval(() => {
        const newProgress = Date.now() - startTime
        if (newProgress < duration) {
          setProgress(newProgress)
        } else {
          // Track ended
          setProgress(duration)
          clearInterval(progressInterval.current!)
        }
      }, 1000)
    } else if (progressInterval.current) {
      // Clear interval when paused
      clearInterval(progressInterval.current)
    }

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current)
      }
    }
  }, [isPlaying, duration, progress])

  // Set duration when current track changes
  useEffect(() => {
    if (currentTrack) {
      setDuration(currentTrack.duration_ms || 0)
      setProgress(0)
    }
  }, [currentTrack])

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0]
    setVolume(newVolume)

    // In a real implementation, you would update the Spotify player volume
    // This would be done through the Spotify Web Playback SDK
  }

  const handleSeek = (value: number[]) => {
    const seekTime = value[0]
    setProgress(seekTime)

    // In a real implementation, you would seek the Spotify player
    // This would be done through the Spotify Web Playback SDK
  }

  if (!currentTrack) return null

  return (
    <div className="flex items-center justify-between h-full px-4">
      {/* Track info */}
      <div className="flex items-center gap-3 w-1/3">
        <img
          src={currentTrack.album?.images[0]?.url || "/placeholder.svg?height=56&width=56"}
          alt={currentTrack.album?.name || "Album cover"}
          className="h-14 w-14 rounded"
        />
        <div className="min-w-0">
          <p className="font-medium truncate">{currentTrack.name}</p>
          <p className="text-sm text-muted-foreground truncate">
            {currentTrack.artists?.map((a: any) => a.name).join(", ")}
          </p>
        </div>
      </div>

      {/* Player controls */}
      <div className="flex flex-col items-center gap-1 w-1/3">
        <div className="flex items-center gap-2">
          <Button size="icon" variant="ghost" onClick={onPrevious} className="text-white h-8 w-8">
            <SkipBack className="h-4 w-4" />
          </Button>

          <Button
            size="icon"
            onClick={onPlayPause}
            className="bg-white text-black hover:bg-white/80 h-8 w-8 rounded-full"
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>

          <Button size="icon" variant="ghost" onClick={onNext} className="text-white h-8 w-8">
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2 w-full max-w-md">
          <span className="text-xs text-white/70 w-8 text-right">{formatDuration(progress)}</span>
          <Slider
            value={[progress]}
            min={0}
            max={duration || 100}
            step={1000}
            onValueChange={handleSeek}
            className="w-full"
          />
          <span className="text-xs text-white/70 w-8">{formatDuration(duration)}</span>
        </div>
      </div>

      {/* Volume control */}
      <div className="flex items-center gap-2 w-1/3 justify-end">
        <Button size="icon" variant="ghost" className="text-white h-8 w-8">
          {volume === 0 ? (
            <VolumeX className="h-4 w-4" />
          ) : volume < 0.5 ? (
            <Volume1 className="h-4 w-4" />
          ) : (
            <Volume2 className="h-4 w-4" />
          )}
        </Button>
        <Slider value={[volume]} min={0} max={1} step={0.01} onValueChange={handleVolumeChange} className="w-24" />
      </div>
    </div>
  )
}

