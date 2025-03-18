"use client"

import { useState, useEffect, useCallback, useRef } from "react"
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
  const [isPlayerReady, setIsPlayerReady] = useState(false)
  const [lastStateUpdate, setLastStateUpdate] = useState<number>(0)
  const pendingPlayRequest = useRef<{ uri: string; play: boolean } | null>(null)
  const { toast } = useToast()
  const playerState = useRef<any>(null)

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
            setIsPlayerReady(true)
            onPlayerReady()

            // Process any pending play request
            if (pendingPlayRequest.current) {
              console.log("Processing pending play request:", pendingPlayRequest.current)
              const { uri, play } = pendingPlayRequest.current
              playTrack(uri, play, token, device_id, spotifyPlayer)
              pendingPlayRequest.current = null
            }
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
        setIsPlayerReady(false)
      })

      // Player State Changed
      spotifyPlayer.addListener("player_state_changed", (state: any) => {
        if (!state) {
          console.log("No player state available")
          return
        }

        // Throttle state updates to avoid excessive re-renders
        const now = Date.now()
        if (now - lastStateUpdate > 100) {
          // Only process state updates every 100ms
          setLastStateUpdate(now)

          console.log("Player state changed:", {
            track: state.track_window.current_track.name,
            paused: state.paused,
            position: state.position,
            duration: state.duration,
          })

          // Enhance the state with additional information
          const enhancedState = {
            ...state,
            // Add any additional properties needed
            timestamp: now,
          }

          // Only update the player state if it's a significant change
          // This helps prevent unexpected pauses
          const isSignificantChange =
            !playerState.current ||
            playerState.current?.track_window?.current_track?.uri !== state.track_window?.current_track?.uri ||
            Math.abs(playerState.current?.position - state.position) > 3000 // More than 3 seconds difference

          if (isSignificantChange) {
            onPlayerStateChanged(enhancedState)
            playerState.current = state
          } else if (playerState.current?.paused !== state.paused) {
            // Always update if play/pause state changes
            onPlayerStateChanged(enhancedState)
            playerState.current = state
          }
        }
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
    [onError, onPlayerReady, onPlayerStateChanged, toast, lastStateUpdate],
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

  // Function to play a track
  const playTrack = async (uri: string, shouldPlay: boolean, token: string, deviceId: string, playerInstance: any) => {
    try {
      if (shouldPlay) {
        console.log("Playing track:", uri)

        // Get current player state to check if we're already playing this track
        const state = await playerInstance.getCurrentState()
        const isCurrentTrack = state && state.track_window.current_track && state.track_window.current_track.uri === uri

        if (isCurrentTrack && state.paused) {
          // If it's the same track but paused, just resume
          console.log("Resuming current track")
          await playerInstance.resume()
        } else if (!isCurrentTrack) {
          // If it's a different track, play it
          console.log("Playing new track via API")
          const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              uris: [uri],
              position_ms: 0, // Start from the beginning
            }),
          })

          if (!response.ok) {
            const errorText = await response.text()
            console.error("Playback error response:", response.status, errorText)
            throw new Error(`Failed to play track: ${response.status} ${response.statusText}`)
          }

          // After starting a new track, make sure we're not paused
          setTimeout(() => {
            playerInstance.resume().catch((err: any) => {
              console.error("Error ensuring playback:", err)
            })
          }, 500)
        } else if (isCurrentTrack && !state.paused) {
          // Track is already playing, do nothing
          console.log("Track is already playing")
        }
      } else {
        console.log("Pausing playback")
        await playerInstance.pause()
      }
    } catch (error) {
      console.error("Error in playTrack:", error)
      throw error
    }
  }

  // Control playback based on props
  useEffect(() => {
    if (!accessToken || !currentTrackUri) return

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

    // If player is not ready, store the request for later
    if (!isPlayerReady || !player || !deviceId) {
      console.log("Player not ready, storing play request for later:", { uri: currentTrackUri, play: isPlaying })
      pendingPlayRequest.current = { uri: currentTrackUri, play: isPlaying }
      return
    }

    // Player is ready, play the track
    playTrack(currentTrackUri, isPlaying, accessToken, deviceId, player).catch((error) => {
      console.error("Error controlling playback:", error)
      toast({
        title: "Playback Error",
        description: "Failed to control playback. Please try again.",
        variant: "destructive",
      })
    })
  }, [currentTrackUri, isPlaying, isPlayerReady, player, deviceId, accessToken, toast])

  // Add a polling mechanism to keep the player state updated
  useEffect(() => {
    if (!player || !isPlayerReady) return

    const pollInterval = setInterval(() => {
      player.getCurrentState().then((state: any) => {
        if (state) {
          onPlayerStateChanged(state)
        }
      })
    }, 500) // Poll every 500ms for more accurate updates

    return () => clearInterval(pollInterval)
  }, [player, onPlayerStateChanged, isPlayerReady])

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

