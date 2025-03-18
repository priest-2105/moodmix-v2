"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Play, Pause, SkipForward, SkipBack, Volume2, Volume1, VolumeX } from "lucide-react"
import { formatDuration } from "@/lib/spotify-client"
import { useToast } from "@/components/ui/use-toast"

interface MusicPlayerProps {
  playlistId: string
  accessToken: string
  onTrackPlay: (track: any) => void
  currentTrack: any
  isPlaying: boolean
  onPlayPause: () => void
  onNext: () => void
  onPrevious: () => void
  playerState?: any
  onVolumeChange?: (volume: number) => void
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
  onVolumeChange,
}: MusicPlayerProps) {
  const [volume, setVolume] = useState(0.7)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isSeeking, setIsSeeking] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [previousVolume, setPreviousVolume] = useState(0.7)
  const progressInterval = useRef<NodeJS.Timeout | null>(null)
  const lastUpdateTime = useRef<number>(Date.now())
  const lastPosition = useRef<number>(0)
  const { toast } = useToast()
  const trackChangeTime = useRef<number>(Date.now())
  const isTrackLoading = useRef<boolean>(false)
  const volumeChangeTimeout = useRef<NodeJS.Timeout | null>(null)

  // Initialize volume from player state
  useEffect(() => {
    if (playerState?.device?.volume_percent !== undefined) {
      const spotifyVolume = playerState.device.volume_percent / 100
      if (Math.abs(spotifyVolume - volume) > 0.05) {
        setVolume(spotifyVolume)
        setPreviousVolume(spotifyVolume)
      }
    }
  }, [playerState?.device?.volume_percent])

  // Update progress and duration from player state
  useEffect(() => {
    if (playerState && !isSeeking) {
      // Update duration from player state
      if (playerState.duration) {
        setDuration(playerState.duration)
      }

      // Update progress from player state
      if (playerState.position !== undefined) {
        setProgress(playerState.position)
        lastPosition.current = playerState.position
        lastUpdateTime.current = Date.now()
      }
    }
  }, [playerState, isSeeking])

  // Track when the current track changes
  useEffect(() => {
    if (currentTrack) {
      trackChangeTime.current = Date.now()
      isTrackLoading.current = true

      // Set a timeout to consider the track loaded after 2 seconds
      const loadingTimeout = setTimeout(() => {
        isTrackLoading.current = false
      }, 2000)

      return () => clearTimeout(loadingTimeout)
    }
  }, [currentTrack])

  // Update progress bar when playing
  useEffect(() => {
    // Clear any existing interval
    if (progressInterval.current) {
      clearInterval(progressInterval.current)
      progressInterval.current = null
    }

    if (isPlaying && !isSeeking && !isTrackLoading.current) {
      // Start a new interval to update progress
      progressInterval.current = setInterval(() => {
        // Calculate elapsed time since last update from Spotify
        const now = Date.now()
        const elapsed = now - lastUpdateTime.current

        // Calculate new position based on elapsed time
        const estimatedPosition = lastPosition.current + elapsed

        if (estimatedPosition < duration) {
          setProgress(estimatedPosition)
        } else if (duration > 0) {
          // Track ended
          setProgress(duration)
          clearInterval(progressInterval.current!)
          progressInterval.current = null

          // Auto-play next track when current track ends
          if (now - trackChangeTime.current > 3000) {
            // Only if track has been playing for at least 3 seconds
            onNext()
          }
        }
      }, 50) // Update more frequently (50ms) for smoother progress
    }

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current)
        progressInterval.current = null
      }
    }
  }, [isPlaying, duration, isSeeking, onNext])

  // Set duration when current track changes
  useEffect(() => {
    if (currentTrack) {
      // Set duration from track metadata
      setDuration(currentTrack.duration_ms || 0)

      // Reset progress when track changes
      if (!playerState) {
        setProgress(0)
        lastPosition.current = 0
        lastUpdateTime.current = Date.now()
      }
    }
  }, [currentTrack, playerState])

  // Improved volume change handler with debouncing
  const handleVolumeChange = useCallback(
    (value: number[]) => {
      const newVolume = value[0]
      setVolume(newVolume)
      setPreviousVolume(newVolume)
      setIsMuted(newVolume === 0)

      // Clear any existing timeout
      if (volumeChangeTimeout.current) {
        clearTimeout(volumeChangeTimeout.current)
      }

      // Debounce volume changes to avoid too many API calls
      volumeChangeTimeout.current = setTimeout(() => {
        // Call the parent handler if provided
        if (onVolumeChange) {
          onVolumeChange(Math.round(newVolume * 100))
        }
      }, 100)
    },
    [onVolumeChange],
  )

  // Handle mute/unmute
  const handleMuteToggle = useCallback(() => {
    if (isMuted) {
      // Unmute - restore previous volume
      setIsMuted(false)
      setVolume(previousVolume > 0 ? previousVolume : 0.5)
      if (onVolumeChange) {
        onVolumeChange(Math.round(previousVolume * 100))
      }
    } else {
      // Mute - save current volume and set to 0
      setIsMuted(true)
      setPreviousVolume(volume)
      setVolume(0)
      if (onVolumeChange) {
        onVolumeChange(0)
      }
    }
  }, [isMuted, volume, previousVolume, onVolumeChange])

  const handleSeek = async (value: number[]) => {
    const seekTime = value[0]
    setIsSeeking(true)
    setProgress(seekTime)

    // Seek in Spotify player if we have access token
    if (accessToken) {
      try {
        const deviceId = playerState?.device?.id
        if (!deviceId) {
          console.warn("No device ID available for seeking")
          setIsSeeking(false)
          return
        }

        const response = await fetch(
          `https://api.spotify.com/v1/me/player/seek?position_ms=${Math.round(seekTime)}&device_id=${deviceId}`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
          },
        )

        if (!response.ok && response.status !== 204) {
          const errorText = await response.text()
          console.error("Error seeking:", response.status, errorText)
        } else {
          // Update our local tracking variables
          lastPosition.current = seekTime
          lastUpdateTime.current = Date.now()
        }
      } catch (error) {
        console.error("Error seeking:", error)
      } finally {
        setIsSeeking(false)
      }
    } else {
      setIsSeeking(false)
    }
  }

  // Sync with player state when it changes
  useEffect(() => {
    if (playerState) {
      // If the player state indicates a different play state than our local state,
      // update our local state to match
      if (playerState.paused !== undefined && isPlaying === playerState.paused) {
        console.log("Syncing play state from player:", !playerState.paused)
        // Notify parent component about the state change
        onPlayPause()
      }
    }
  }, [playerState, isPlaying, onPlayPause])

  // Improved play/pause handler with direct API call
  const handlePlayPauseAction = useCallback(() => {
    if (!accessToken) {
      console.warn("Cannot control playback: missing token")
      onPlayPause() // Still toggle the UI state
      return
    }

    const deviceId = playerState?.device?.id
    if (!deviceId) {
      console.warn("Cannot control playback: missing device ID")
      onPlayPause() // Still toggle the UI state
      return
    }

    const endpoint = isPlaying
      ? `https://api.spotify.com/v1/me/player/pause?device_id=${deviceId}`
      : `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`

    // Optimistically update UI
    onPlayPause()

    fetch(endpoint, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body:
        !isPlaying && currentTrack?.uri
          ? JSON.stringify({
              uris: [currentTrack.uri],
              position_ms: progress,
            })
          : undefined,
    })
      .then((response) => {
        if (!response.ok && response.status !== 204) {
          return response.text().then((text) => {
            throw new Error(`Failed to ${isPlaying ? "pause" : "play"}: ${response.status} ${text}`)
          })
        }
      })
      .catch((error) => {
        console.error("Playback control error:", error)
        // Revert UI state on error
        onPlayPause()
        toast({
          title: "Playback Error",
          description: error.message,
          variant: "destructive",
        })
      })
  }, [accessToken, isPlaying, onPlayPause, playerState?.device?.id, toast, currentTrack?.uri, progress])

  if (!currentTrack) return null

  return (
    <div className="flex items-center justify-between h-full px-2 md:px-4">
      {/* Track info */}
      <div className="flex items-center gap-2 md:gap-3 w-1/3">
        <img
          src={currentTrack.album?.images[0]?.url || "/placeholder.svg?height=56&width=56"}
          alt={currentTrack.album?.name || "Album cover"}
          className="h-10 w-10 md:h-14 md:w-14 rounded"
        />
        <div className="min-w-0">
          <p className="font-medium truncate text-sm md:text-base">{currentTrack.name}</p>
          <p className="text-xs md:text-sm text-muted-foreground truncate">
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
            onClick={handlePlayPauseAction}
            className="bg-white text-black hover:bg-white/80 h-8 w-8 rounded-full"
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>

          <Button size="icon" variant="ghost" onClick={onNext} className="text-white h-8 w-8">
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2 w-full max-w-md">
          <span className="text-xs text-white/70 w-8 text-right hidden sm:block">{formatDuration(progress)}</span>
          <Slider
            value={[progress]}
            min={0}
            max={duration || 100}
            step={1000}
            onValueChange={handleSeek}
            className="w-full"
          />
          <span className="text-xs text-white/70 w-8 hidden sm:block">{formatDuration(duration)}</span>
        </div>
      </div>

      {/* Volume control */}
      <div className="flex items-center gap-2 w-1/3 justify-end">
        <Button
          size="icon"
          variant="ghost"
          className="text-white h-8 w-8"
          onClick={handleMuteToggle}
          aria-label={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted || volume === 0 ? (
            <VolumeX className="h-4 w-4" />
          ) : volume < 0.5 ? (
            <Volume1 className="h-4 w-4" />
          ) : (
            <Volume2 className="h-4 w-4" />
          )}
        </Button>
        <Slider
          value={[volume]}
          min={0}
          max={1}
          step={0.01}
          onValueChange={handleVolumeChange}
          className="w-16 md:w-24 hidden sm:block"
          aria-label="Volume"
        />
      </div>
    </div>
  )
}

