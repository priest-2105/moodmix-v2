"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Play, Pause, SkipForward, SkipBack, Volume2, Volume1, VolumeX } from "lucide-react"
import { formatDuration } from "@/lib/spotify-client"
import { getPlaylistTracks } from "@/lib/spotify"

interface MusicPlayerProps {
  playlistId: string
  accessToken: string | null
  onTrackPlay: (track: any) => void
}

export default function MusicPlayer({ playlistId, accessToken, onTrackPlay }: MusicPlayerProps) {
  const [tracks, setTracks] = useState<any[]>([])
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.7)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (playlistId && accessToken) {
      fetchTracks()
    }

    // Create audio element
    audioRef.current = new Audio()
    audioRef.current.volume = volume

    // Event listeners
    const audio = audioRef.current
    audio.addEventListener("timeupdate", handleTimeUpdate)
    audio.addEventListener("ended", handleTrackEnd)
    audio.addEventListener("loadedmetadata", handleMetadataLoaded)

    return () => {
      if (audio) {
        audio.pause()
        audio.removeEventListener("timeupdate", handleTimeUpdate)
        audio.removeEventListener("ended", handleTrackEnd)
        audio.removeEventListener("loadedmetadata", handleMetadataLoaded)
      }
    }
  }, [playlistId, accessToken])

  const fetchTracks = async () => {
    if (!accessToken) return

    try {
      const tracksData = await getPlaylistTracks(accessToken, playlistId)
      setTracks(tracksData.items.map((item: any) => item.track))
    } catch (error) {
      console.error("Error fetching tracks:", error)
    }
  }

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime * 1000) // Convert to ms to match Spotify
    }
  }

  const handleMetadataLoaded = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration * 1000) // Convert to ms to match Spotify
    }
  }

  const handleTrackEnd = () => {
    handleNext()
  }

  const handlePlayPause = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
    } else {
      audio.play().catch((error) => {
        console.error("Error playing audio:", error)
      })
    }

    setIsPlaying(!isPlaying)
  }

  const handlePrevious = () => {
    if (currentTrackIndex !== null && tracks.length > 0) {
      const prevIndex = (currentTrackIndex - 1 + tracks.length) % tracks.length
      setCurrentTrackIndex(prevIndex)
      loadTrack(tracks[prevIndex])
    }
  }

  const handleNext = () => {
    if (currentTrackIndex !== null && tracks.length > 0) {
      const nextIndex = (currentTrackIndex + 1) % tracks.length
      setCurrentTrackIndex(nextIndex)
      loadTrack(tracks[nextIndex])
    }
  }

  const handleSeek = (value: number[]) => {
    const audio = audioRef.current
    if (!audio) return

    const seekTime = value[0]
    audio.currentTime = seekTime / 1000 // Convert ms to seconds
    setCurrentTime(seekTime)
  }

  const handleVolumeChange = (value: number[]) => {
    const audio = audioRef.current
    if (!audio) return

    const newVolume = value[0]
    audio.volume = newVolume
    setVolume(newVolume)
  }

  const loadTrack = (track: any) => {
    const audio = audioRef.current
    if (!audio) return

    // In a real app, you'd get the preview_url or streaming URL
    // For now, we'll simulate with the preview_url if available
    if (track.preview_url) {
      audio.src = track.preview_url
      audio.play().catch((error) => {
        console.error("Error playing track:", error)
      })
      setIsPlaying(true)
      onTrackPlay(track)
    } else {
      console.warn("No preview URL available for this track")
      // Try next track
      handleNext()
    }
  }

  const currentTrack = currentTrackIndex !== null ? tracks[currentTrackIndex] : null

  return (
    <div className="flex items-center justify-between h-full px-4">
      {/* Track info */}
      <div className="flex items-center gap-3 w-1/3">
        {currentTrack && (
          <>
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
          </>
        )}
      </div>

      {/* Player controls */}
      <div className="flex flex-col items-center gap-1 w-1/3">
        <div className="flex items-center gap-2">
          <Button size="icon" variant="ghost" onClick={handlePrevious} className="text-white h-8 w-8">
            <SkipBack className="h-4 w-4" />
          </Button>

          <Button
            size="icon"
            onClick={handlePlayPause}
            className="bg-white text-black hover:bg-white/80 h-8 w-8 rounded-full"
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>

          <Button size="icon" variant="ghost" onClick={handleNext} className="text-white h-8 w-8">
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2 w-full max-w-md">
          <span className="text-xs text-white/70 w-8 text-right">{formatDuration(currentTime)}</span>
          <Slider
            value={[currentTime]}
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

