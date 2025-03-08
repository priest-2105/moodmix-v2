"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Play, Pause, SkipForward, SkipBack, Shuffle, Repeat, Music, Trash2, GripVertical } from "lucide-react"
import { getPlaylistTracks } from "@/lib/spotify"

interface MusicPlayerProps {
  playlistId: string
  accessToken: string
  onTrackPlay: (track: any) => void
}

export default function MusicPlayer({ playlistId, accessToken, onTrackPlay }: MusicPlayerProps) {
  const [tracks, setTracks] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => {
    const fetchTracks = async () => {
      setIsLoading(true)
      try {
        const tracksData = await getPlaylistTracks(accessToken, playlistId)
        setTracks(tracksData.items.map((item: any) => item.track))
      } catch (error) {
        console.error("Error fetching tracks:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (playlistId && accessToken) {
      fetchTracks()
    }
  }, [playlistId, accessToken])

  const handlePlay = (index: number) => {
    setCurrentTrackIndex(index)
    setIsPlaying(true)
    onTrackPlay(tracks[index])
  }

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  const handleNext = () => {
    if (currentTrackIndex !== null && tracks.length > 0) {
      const nextIndex = (currentTrackIndex + 1) % tracks.length
      setCurrentTrackIndex(nextIndex)
      onTrackPlay(tracks[nextIndex])
    }
  }

  const handlePrevious = () => {
    if (currentTrackIndex !== null && tracks.length > 0) {
      const prevIndex = (currentTrackIndex - 1 + tracks.length) % tracks.length
      setCurrentTrackIndex(prevIndex)
      onTrackPlay(tracks[prevIndex])
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (tracks.length === 0) {
    return (
      <div className="text-center py-8">
        <Music className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No tracks in this playlist</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button size="icon" variant="outline" onClick={handlePrevious} disabled={currentTrackIndex === null}>
            <SkipBack className="h-4 w-4" />
          </Button>

          <Button
            size="icon"
            onClick={handlePlayPause}
            disabled={currentTrackIndex === null}
            className="bg-[#00FFFF] text-black hover:bg-[#00FFFF]/80"
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>

          <Button size="icon" variant="outline" onClick={handleNext} disabled={currentTrackIndex === null}>
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button size="icon" variant="ghost">
            <Shuffle className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost">
            <Repeat className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-2">
          {tracks.map((track, index) => (
            <div
              key={track.id}
              className={`flex items-center gap-3 p-2 rounded-md cursor-pointer hover:bg-accent ${
                currentTrackIndex === index ? "bg-[#00FFFF]/20 border-l-4 border-[#00FFFF]" : ""
              }`}
              onClick={() => handlePlay(index)}
            >
              <div className="flex-shrink-0">
                <img
                  src={track.album?.images[0]?.url || "/placeholder.svg?height=40&width=40"}
                  alt={track.album?.name || "Album cover"}
                  className="h-10 w-10 rounded"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{track.name}</p>
                <p className="text-sm text-muted-foreground truncate">
                  {track.artists?.map((a: any) => a.name).join(", ")}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button size="icon" variant="ghost" className="h-8 w-8">
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8 cursor-grab">
                  <GripVertical className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}

