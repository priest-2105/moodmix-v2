"use client"

import { useState, useEffect } from "react"
import { Play, Clock, Heart, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { Playlist } from "@/types/spotify"
import { getPlaylistTracks } from "@/lib/spotify"
import { formatDuration } from "@/lib/spotify-client"

interface PlaylistViewProps {
  playlist: Playlist
  accessToken: string | null
  onTrackPlay: (track: any) => void
}

export default function PlaylistView({ playlist, accessToken, onTrackPlay }: PlaylistViewProps) {
  const [tracks, setTracks] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [dominantColor, setDominantColor] = useState("rgba(128, 128, 128, 0.7)")

  useEffect(() => {
    const fetchTracks = async () => {
      if (!accessToken) return

      setIsLoading(true)
      try {
        const tracksData = await getPlaylistTracks(accessToken, playlist.id)
        setTracks(tracksData.items.map((item: any) => item.track))
      } catch (error) {
        console.error("Error fetching tracks:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (playlist?.id && accessToken) {
      fetchTracks()
      extractDominantColor()
    }
  }, [playlist?.id, accessToken])

  const extractDominantColor = () => {
    // In a real app, you would use a library like color-thief or similar
    // For simplicity, we'll just set a color based on the playlist ID
    const colors = [
      "rgba(180, 60, 60, 0.8)", // red
      "rgba(60, 120, 180, 0.8)", // blue
      "rgba(60, 180, 120, 0.8)", // green
      "rgba(180, 120, 60, 0.8)", // orange
      "rgba(120, 60, 180, 0.8)", // purple
    ]

    // Use the last character of the playlist ID to select a color
    const colorIndex = Number.parseInt(playlist.id.slice(-1), 16) % colors.length
    setDominantColor(colors[colorIndex])
  }

  const handlePlay = (index: number) => {
    setCurrentTrackIndex(index)
    setIsPlaying(true)
    onTrackPlay(tracks[index])
  }

  const handlePlayAll = () => {
    if (tracks.length > 0) {
      setCurrentTrackIndex(0)
      setIsPlaying(true)
      onTrackPlay(tracks[0])
    }
  }

  const totalDuration = tracks.reduce((acc, track) => acc + (track.duration_ms || 0), 0)
  const totalDurationFormatted = formatDuration(totalDuration)

  return (
    <div className="flex flex-col h-full">
      {/* Header with background gradient using dominant color */}
      <div
        className="relative flex items-end p-8 h-[340px]"
        style={{
          background: `linear-gradient(to bottom, ${dominantColor}, rgba(0, 0, 0, 0.9))`,
        }}
      >
        <div className="flex items-end gap-6 z-10">
          <img
            src={playlist.images?.[0]?.url || "/placeholder.svg?height=200&width=200"}
            alt={playlist.name}
            className="h-52 w-52 shadow-2xl"
          />
          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold uppercase">Playlist</span>
            <h1 className="text-7xl font-bold text-white">{playlist.name}</h1>
            <div className="flex items-center gap-1 mt-4 text-sm">
              <span className="font-semibold">{playlist.owner?.display_name}</span>
              <span className="text-white/70">
                • {tracks.length} songs, {totalDurationFormatted}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Playback controls */}
      <div className="bg-black/30 p-6 flex items-center gap-4">
        <Button
          className="w-14 h-14 rounded-full bg-[#00FFFF] text-black hover:bg-[#00FFFF]/80 flex items-center justify-center"
          onClick={handlePlayAll}
        >
          <Play className="h-7 w-7" />
        </Button>
        <Button variant="ghost" size="icon" className="text-white/70 hover:text-white">
          <Heart className="h-6 w-6" />
        </Button>
        <Button variant="ghost" size="icon" className="text-white/70 hover:text-white">
          <MoreHorizontal className="h-6 w-6" />
        </Button>
      </div>

      {/* Tracks list */}
      <ScrollArea className="flex-1">
        <div className="p-6">
          {/* Table header */}
          <div className="grid grid-cols-[auto_1fr_auto_auto] gap-4 px-4 py-2 text-sm font-medium text-white/60 border-b border-white/10">
            <div className="w-8 text-center">#</div>
            <div>Title</div>
            <div>Plays</div>
            <div className="flex items-center">
              <Clock className="h-4 w-4" />
            </div>
          </div>

          {/* Table rows */}
          {isLoading ? (
            <div className="py-4 text-center text-white/60">Loading tracks...</div>
          ) : (
            <div className="divide-y divide-white/5">
              {tracks.map((track, index) => (
                <div
                  key={track.id}
                  className={`grid grid-cols-[auto_1fr_auto_auto] gap-4 px-4 py-2 text-white/80 hover:bg-white/10 cursor-pointer ${
                    currentTrackIndex === index ? "bg-white/10" : ""
                  }`}
                  onClick={() => handlePlay(index)}
                >
                  <div className="w-8 text-center flex items-center justify-center">
                    {currentTrackIndex === index && isPlaying ? (
                      <span className="w-4 h-4 text-[#00FFFF] animate-pulse">▶</span>
                    ) : (
                      <span className="text-white/60">{index + 1}</span>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium">{track.name}</span>
                    <span className="text-sm text-white/60">{track.artists?.map((a: any) => a.name).join(", ")}</span>
                  </div>
                  <div className="text-white/60 text-sm">{Math.floor(Math.random() * 1000000).toLocaleString()}</div>
                  <div className="text-white/60 text-sm">{formatDuration(track.duration_ms)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

