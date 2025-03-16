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

    // Check if script is already loaded
    if (document.getElementById("spotify-player")) {
      if (window.Spotify) {
        initializePlayer(accessToken)
      }
      return
    }

    const script = document.createElement("script")
    script.id = "spotify-player"
    script.src = "https://sdk.scdn.co/spotify-player.js"
    script.async = true
    document.body.appendChild(script)

    window.onSpotifyWebPlaybackSDKReady = () => {
      console.log("Spotify Web Playback SDK Ready")
      initializePlayer(accessToken)
    }

    return () => {
      if (player) {
        player.disconnect()
      }
    }
  }, [accessToken])

  // Initialize the Spotify Web Player
  const initializePlayer = useCallback(
    (token: string) => {
      console.log("Initializing Spotify Web Player...")

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

        // Transfer playback to this device immediately
        transferPlayback(token, device_id)
          .then(() => {
            console.log("Playback transferred to web player")
            onPlayerReady()
          })
          .catch((err) => {
            console.error("Error transferring playback:", err)
            onError("Failed to transfer playback to web player")
          })
      })

      // Not Ready
      spotifyPlayer.addListener("not_ready", ({ device_id }: { device_id: string }) => {
        console.log("Device has gone offline:", device_id)
        setDeviceId(null)
      })

      // Player State Changed
      spotifyPlayer.addListener("player_state_changed", (state: any) => {
        if (!state) {
          console.log("No player state available")
          return
        }

        console.log("Player state changed:", {
          track: state.track_window.current_track.name,
          paused: state.paused,
          position: state.position,
          duration: state.duration,
        })

        onPlayerStateChanged(state)
      })

      // Connect the player
      console.log("Connecting to Spotify...")
      spotifyPlayer
        .connect()
        .then((success: boolean) => {
          if (success) {
            console.log("Connected to Spotify successfully")
          } else {
            console.error("Failed to connect to Spotify")
            onError("Failed to connect to Spotify")
          }
        })
        .catch((err: any) => {
          console.error("Error connecting to Spotify:", err)
          onError(`Error connecting to Spotify: ${err.message || "Unknown error"}`)
        })

      setPlayer(spotifyPlayer)
    },
    [onError, onPlayerReady, onPlayerStateChanged, toast],
  )

  // Transfer playback to this device
  const transferPlayback = async (token: string, deviceId: string) => {
    try {
      console.log("Transferring playback to device:", deviceId)

      const response = await fetch("https://api.spotify.com/v1/me/player", {
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

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Error transferring playback:", response.status, errorText)
        throw new Error(`Failed to transfer playback: ${response.status} ${response.statusText}`)
      }

      return true
    } catch (error) {
      console.error("Error transferring playback:", error)
      throw error
    }
  }

  // Control playback based on props
  useEffect(() => {
    if (!player || !deviceId || !accessToken) return

    const handlePlayback = async () => {
      try {
        if (isPlaying && currentTrackUri) {
          // Check if this is a fallback track
          if (currentTrackUri.includes("fallback")) {
            console.error("Cannot play fallback track:", currentTrackUri)
            toast({
              title: "Playback Error",
              description:
                "This track cannot be played because it's a fallback track. Please create a new mood with real Spotify tracks.",
              variant: "destructive",
            })
            return
          }

          console.log("Playing track:", currentTrackUri)

          // Play the track on the web player
          await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              uris: [currentTrackUri],
            }),
          }).then((response) => {
            if (!response.ok) {
              return response.text().then((text) => {
                console.error("Playback error response:", text)
                throw new Error(`Failed to play track: ${response.status} ${response.statusText}`)
              })
            }
          })
        } else if (!isPlaying && player) {
          console.log("Pausing playback")
          player.pause()
        }
      } catch (error) {
        console.error("Error controlling playback:", error)
        toast({
          title: "Playback Error",
          description: "Failed to control playback. Please try again.",
          variant: "destructive",
        })
      }
    }

    handlePlayback()
  }, [currentTrackUri, isPlaying, player, deviceId, accessToken, toast])

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

