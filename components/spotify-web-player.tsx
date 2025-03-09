"use client"

import { useState, useEffect, useCallback } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

interface SpotifyWebPlayerProps {
  accessToken: string | null
  currentTrackUri: string | null
  isPlaying: boolean
  onPlayerStateChanged: (state: any) => void
  onPlayerReady: () => void
  onError: (error: string) => void
}

declare global {
  interface Window {
    Spotify: any
    onSpotifyWebPlaybackSDKReady: () => void
  }
}

export default function SpotifyWebPlayer({
  accessToken,
  currentTrackUri,
  isPlaying,
  onPlayerStateChanged,
  onPlayerReady,
  onError,
}: SpotifyWebPlayerProps) {
  const [player, setPlayer] = useState<any>(null)
  const [deviceId, setDeviceId] = useState<string | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)
  const { toast } = useToast()

  // Load Spotify Web Playback SDK script
  useEffect(() => {
    if (!accessToken) return

    const script = document.createElement("script")
    script.src = "https://sdk.scdn.co/spotify-player.js"
    script.async = true
    document.body.appendChild(script)

    window.onSpotifyWebPlaybackSDKReady = () => {
      initializePlayer(accessToken)
    }

    return () => {
      document.body.removeChild(script)
      if (player) {
        player.disconnect()
      }
    }
  }, [accessToken])

  // Initialize the Spotify Web Player
  const initializePlayer = useCallback(
    (token: string) => {
      const spotifyPlayer = new window.Spotify.Player({
        name: "Moodmix Web Player",
        getOAuthToken: (cb: (token: string) => void) => {
          cb(token)
        },
        volume: 0.5,
      })

      // Error handling
      spotifyPlayer.addListener("initialization_error", ({ message }: { message: string }) => {
        console.error("Initialization error:", message)
        onError(`Player initialization failed: ${message}`)
        setIsInitializing(false)
      })

      spotifyPlayer.addListener("authentication_error", ({ message }: { message: string }) => {
        console.error("Authentication error:", message)
        onError("Authentication failed. Please log in again.")
        setIsInitializing(false)
      })

      spotifyPlayer.addListener("account_error", ({ message }: { message: string }) => {
        console.error("Account error:", message)
        onError("Premium account required for playback.")
        setIsInitializing(false)
      })

      spotifyPlayer.addListener("playback_error", ({ message }: { message: string }) => {
        console.error("Playback error:", message)
        toast({
          title: "Playback Error",
          description: message,
          variant: "destructive",
        })
      })

      // Ready
      spotifyPlayer.addListener("ready", ({ device_id }: { device_id: string }) => {
        console.log("Spotify Web Player ready with device ID:", device_id)
        setDeviceId(device_id)
        setIsInitializing(false)
        onPlayerReady()

        // Transfer playback to this device
        transferPlayback(token, device_id)
      })

      // Not Ready
      spotifyPlayer.addListener("not_ready", ({ device_id }: { device_id: string }) => {
        console.log("Device has gone offline:", device_id)
        setDeviceId(null)
      })

      // Player State Changed
      spotifyPlayer.addListener("player_state_changed", (state: any) => {
        if (!state) return
        onPlayerStateChanged(state)
      })

      // Connect the player
      spotifyPlayer.connect()
      setPlayer(spotifyPlayer)
    },
    [onError, onPlayerReady, onPlayerStateChanged],
  )

  // Transfer playback to this device
  const transferPlayback = async (token: string, deviceId: string) => {
    try {
      await fetch("https://api.spotify.com/v1/me/player", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          device_ids: [deviceId],
          play: false,
        }),
      })
    } catch (error) {
      console.error("Error transferring playback:", error)
    }
  }

  // Control playback based on props
  useEffect(() => {
    if (!player || !deviceId || !accessToken || !currentTrackUri) return

    const playTrack = async () => {
      try {
        await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            uris: [currentTrackUri],
          }),
        })
      } catch (error) {
        console.error("Error playing track:", error)
        toast({
          title: "Playback Error",
          description: "Failed to play the selected track. Please try again.",
          variant: "destructive",
        })
      }
    }

    if (isPlaying && currentTrackUri) {
      playTrack()
    } else if (!isPlaying && player) {
      player.pause()
    }
  }, [currentTrackUri, isPlaying, player, deviceId, accessToken])

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center p-4 text-white/70">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        <span>Connecting to Spotify...</span>
      </div>
    )
  }

  return null // This component doesn't render anything visible
}

// Helper function to convert track object to Spotify URI
export function getTrackUri(track: any): string {
  if (!track) return ""
  if (track.uri) return track.uri
  if (track.id) return `spotify:track:${track.id}`
  return ""
}

