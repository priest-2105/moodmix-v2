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
  playerState?: any // Add this prop to receive player state
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
  playerState,
}: MusicPlayerProps) {
  const [volume, setVolume] = useState(0.7)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isSeeking, setIsSeeking] = useState(false)
  const progressInterval = useRef<NodeJS.Timeout | null>(null)
  const { toast } = useToast()

  // Update progress and duration from player state
  useEffect(() => {
    if (playerState && !isSeeking) {
      setProgress(playerState.position || 0)
      setDuration(playerState.duration || 0)
    }
  }, [playerState, isSeeking])

  // Update progress bar when playing
  useEffect(() => {
    if (isPlaying && !isSeeking) {
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
  }, [isPlaying, duration, progress, isSeeking])

  // Set duration when current track changes
  useEffect(() => {
    if (currentTrack) {
      setDuration(currentTrack.duration_ms || 0)
      if (!playerState) {
        setProgress(0)
      }
    }
  }, [currentTrack, playerState])

  const handleVolumeChange = async (value: number[]) => {
    const newVolume = value[0]
    setVolume(newVolume)

    // Update Spotify player volume if we have access token
    if (accessToken) {
      try {
        await fetch("https://api.spotify.com/v1/me/player/volume", {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            volume_percent: Math.round(newVolume * 100),
          }),
        })
      } catch (error) {
        console.error("Error setting volume:", error)
      }
    }
  }

  const handleSeek = async (value: number[]) => {
    const seekTime = value[0]
    setIsSeeking(true)
    setProgress(seekTime)

    // Seek in Spotify player if we have access token
    if (accessToken) {
      try {
        await fetch("https://api.spotify.com/v1/me/player/seek", {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          params: {
            position_ms: Math.round(seekTime),
          },
        })
      } catch (error) {
        console.error("Error seeking:", error)
      } finally {
        setIsSeeking(false)
      }
    } else {
      setIsSeeking(false)
    }
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

