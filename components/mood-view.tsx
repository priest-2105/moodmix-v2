"use client"

import { useState, useEffect } from "react"
import { Play, Pause, Clock, Heart, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/components/ui/use-toast"
import { getMoodTracks } from "@/lib/supabase/moods"
import { formatDuration } from "@/lib/spotify-client"

interface MoodViewProps {
  mood: any
  accessToken: string | null
  onTrackPlay: (track: any) => void
}

export default function MoodView({ mood, accessToken, onTrackPlay }: MoodViewProps) {
  const [tracks, setTracks] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [dominantColor, setDominantColor] = useState("rgba(128, 128, 128, 0.7)")
  const { toast } = useToast()

  useEffect(() => {
    const fetchTracks = async () => {
      setIsLoading(true)
      try {
        const moodTracks = await getMoodTracks(mood.id)
        console.log(`Fetched ${moodTracks.length} tracks for mood ${mood.name}`)

        // Log the first track to verify structure
        if (moodTracks.length > 0) {
          console.log("Sample track from mood:", {
            id: moodTracks[0].track_id,
            name: moodTracks[0].track_name,
            artist: moodTracks[0].artist_name,
            album: moodTracks[0].album_name,
          })
        }

        // Convert mood tracks to a format similar to Spotify tracks
        const formattedTracks = moodTracks.map((track) => ({
          id: track.track_id,
          uri: track.track_uri,
          name: track.track_name,
          artists: [{ name: track.artist_name }],
          album: {
            name: track.album_name || "Unknown Album",
            images: [{ url: track.album_image_url || "/placeholder.svg?height=200&width=200" }],
          },
          duration_ms: 180000, // Default duration of 3 minutes
          added_at: track.added_at,
        }))

        setTracks(formattedTracks)

        if (formattedTracks.length === 0) {
          toast({
            title: "No tracks found",
            description: "This mood doesn't have any tracks. Try creating a new mood.",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Error fetching mood tracks:", error)
        toast({
          title: "Error",
          description: "Failed to load mood tracks. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (mood?.id) {
      fetchTracks()
      extractDominantColor()
    }
  }, [mood?.id, toast])

  const extractDominantColor = () => {
    // Extract color from mood type or image
    const moodTypeColors: Record<string, string> = {
      happy: "rgba(255, 215, 0, 0.8)", // Gold
      sad: "rgba(100, 149, 237, 0.8)", // Cornflower Blue
      energetic: "rgba(255, 69, 0, 0.8)", // Red-Orange
      relaxed: "rgba(152, 251, 152, 0.8)", // Pale Green
      focused: "rgba(147, 112, 219, 0.8)", // Medium Purple
      default: "rgba(0, 255, 255, 0.8)", // Cyan (default)
    }

    setDominantColor(moodTypeColors[mood.mood_type] || moodTypeColors.default)
  }

  const handlePlay = (index: number) => {
    if (currentTrackIndex === index && isPlaying) {
      setIsPlaying(false)
    } else {
      setCurrentTrackIndex(index)
      setIsPlaying(true)

      // Log the track being played
      console.log("Playing track:", {
        id: tracks[index].id,
        name: tracks[index].name,
        uri: tracks[index].uri,
        artists: tracks[index].artists?.map((a: any) => a.name).join(", "),
      })

      // Check if the track has a valid URI before playing
      if (!tracks[index].uri || tracks[index].uri.includes("fallback")) {
        toast({
          title: "Playback Error",
          description:
            "This track cannot be played because it's a fallback track. Please create a new mood to get playable tracks.",
          variant: "destructive",
        })
      }

      onTrackPlay(tracks[index])
    }
  }

  const handlePlayAll = () => {
    if (tracks.length > 0) {
      if (currentTrackIndex !== null && isPlaying) {
        setIsPlaying(false)
      } else {
        setCurrentTrackIndex(0)
        setIsPlaying(true)
        onTrackPlay(tracks[0])
      }
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
            src={mood.image_url || `/placeholder.svg?height=200&width=200&text=${mood.name}`}
            alt={mood.name}
            className="h-52 w-52 shadow-2xl"
          />
          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold uppercase">Mood</span>
            <h1 className="text-7xl font-bold text-white">{mood.name}</h1>
            <div className="flex items-center gap-1 mt-4 text-sm">
              <span className="text-white/70">
                {mood.description || `A ${mood.mood_type} mood`} • {tracks.length} songs, {totalDurationFormatted}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Playback controls */}
      <div className="bg-black/30 p-6 flex items-center gap-4">
        <Button
          className={`w-14 h-14 rounded-full ${isPlaying && currentTrackIndex !== null ? "bg-white" : "bg-[#00FFFF]"} text-black hover:bg-opacity-80 flex items-center justify-center`}
          onClick={handlePlayAll}
          disabled={tracks.length === 0}
        >
          {isPlaying && currentTrackIndex !== null ? <Pause className="h-7 w-7" /> : <Play className="h-7 w-7" />}
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
            <div>Artist</div>
            <div className="flex items-center">
              <Clock className="h-4 w-4" />
            </div>
          </div>

          {/* Table rows */}
          {isLoading ? (
            <div className="py-4 text-center text-white/60">Loading tracks...</div>
          ) : tracks.length === 0 ? (
            <div className="py-4 text-center text-white/60">No tracks found for this mood</div>
          ) : (
            <div className="divide-y divide-white/5">
              {tracks.map((track, index) => (
                <div
                  key={`${track.id}-${index}`}
                  className={`grid grid-cols-[auto_1fr_auto_auto] gap-4 px-4 py-3 text-white/80 hover:bg-white/10 cursor-pointer ${
                    currentTrackIndex === index ? "bg-white/10" : ""
                  }`}
                  onClick={() => handlePlay(index)}
                >
                  <div className="w-8 text-center flex items-center justify-center">
                    {currentTrackIndex === index ? (
                      isPlaying ? (
                        <span className="w-4 h-4 text-[#00FFFF] animate-pulse">▶</span>
                      ) : (
                        <span className="w-4 h-4 text-white">❚❚</span>
                      )
                    ) : (
                      <div className="group relative">
                        <span className="text-white/60 group-hover:opacity-0">{index + 1}</span>
                        <Play className="h-4 w-4 absolute top-0 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className={`font-medium ${currentTrackIndex === index ? "text-[#00FFFF]" : ""}`}>
                      {track.name}
                    </span>
                    <span className="text-sm text-white/60">{track.album?.name}</span>
                  </div>
                  <div className="text-white/60 text-sm">{track.artists?.map((a: any) => a.name).join(", ")}</div>
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

