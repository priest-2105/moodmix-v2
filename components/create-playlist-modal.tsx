"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"
import { getRecommendations, getPlaylistTracks } from "@/lib/spotify"
import { saveMood, saveMoodTracks } from "@/lib/supabase/moods"
import type { Playlist } from "@/types/spotify"

interface CreatePlaylistModalProps {
  isOpen: boolean
  onClose: () => void
  accessToken: string | null
  userId: string | undefined
  existingPlaylists: Playlist[]
  onMoodCreated: (mood: any) => void
}

const moodTypes = [
  { id: "happy", name: "Happy", params: { min_valence: 0.7, target_energy: 0.8 }, color: "#FFD700" },
  { id: "sad", name: "Sad", params: { max_valence: 0.3, target_energy: 0.4 }, color: "#6495ED" },
  { id: "energetic", name: "Energetic", params: { min_energy: 0.8, target_tempo: 150 }, color: "#FF4500" },
  { id: "relaxed", name: "Relaxed", params: { max_energy: 0.4, target_acousticness: 0.8 }, color: "#98FB98" },
  { id: "focused", name: "Focused", params: { target_instrumentalness: 0.5, max_speechiness: 0.3 }, color: "#9370DB" },
]

// Generate mood images based on type
const getMoodImageUrl = (moodType: string) => {
  const mood = moodTypes.find((m) => m.id === moodType)
  if (!mood) return "/placeholder.svg?height=400&width=400"

  // In a real app, you'd have actual images for each mood
  // For now, we'll use a colored placeholder
  return `/placeholder.svg?height=400&width=400&text=${mood.name}&bgcolor=${mood.color.substring(1)}`
}

export default function CreatePlaylistModal({
  isOpen,
  onClose,
  accessToken,
  userId,
  existingPlaylists,
  onMoodCreated,
}: CreatePlaylistModalProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [selectedMood, setSelectedMood] = useState("happy")
  const [sourceType, setSourceType] = useState("random")
  const [sourcePlaylist, setSourcePlaylist] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!accessToken || !userId) {
      setError("You must be logged in to create a mood")
      return
    }

    if (!name.trim()) {
      setError("Please enter a mood name")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      // Get tracks based on mood
      const selectedMoodParams = moodTypes.find((m) => m.id === selectedMood)?.params || {}
      let tracks: any[] = []

      if (sourceType === "existing" && sourcePlaylist) {
        // Get tracks from existing playlist
        console.log("Getting tracks from existing playlist:", sourcePlaylist)
        const playlistTracks = await getPlaylistTracks(accessToken, sourcePlaylist)

        if (playlistTracks && playlistTracks.items) {
          tracks = playlistTracks.items.map((item: any) => item.track).slice(0, 20)
        }
      } else {
        // Get recommendations based on mood
        try {
          console.log("Getting recommendations for mood:", selectedMood)
          const recommendations = await getRecommendations(accessToken, {
            seed_genres: getMoodGenres(selectedMood),
            limit: 20,
            ...selectedMoodParams,
          })

          if (recommendations && recommendations.tracks) {
            tracks = recommendations.tracks
          }
        } catch (recError) {
          console.error("Error getting recommendations:", recError)
          // Fallback to a sample track if recommendations fail
          tracks = [
            {
              id: "sample-track",
              uri: "spotify:track:4iV5W9uYEdYUVa79Axb7Rh", // Random track URI
              name: "Sample Track",
              artists: [{ name: "Sample Artist" }],
              album: {
                name: "Sample Album",
                images: [{ url: "/placeholder.svg?height=200&width=200" }],
              },
            },
          ]
        }
      }

      if (tracks.length === 0) {
        throw new Error("No tracks found for this mood. Please try a different selection.")
      }

      // Save mood to Supabase
      console.log("Saving mood to Supabase")
      const moodData = await saveMood(userId, {
        name,
        description: description || `${name} - A ${moodTypes.find((m) => m.id === selectedMood)?.name} mood`,
        mood_type: selectedMood,
        image_url: getMoodImageUrl(selectedMood),
      })

      // Save tracks to Supabase
      console.log("Saving tracks to Supabase")
      const trackData = tracks.map((track) => ({
        track_id: track.id,
        track_uri: track.uri,
        track_name: track.name,
        artist_name: track.artists.map((a: any) => a.name).join(", "),
        album_name: track.album?.name,
        album_image_url: track.album?.images?.[0]?.url || "/placeholder.svg?height=200&width=200",
      }))

      await saveMoodTracks(moodData.id, trackData)

      // Update UI
      onMoodCreated({
        ...moodData,
        tracks: trackData,
      })

      // Close modal
      onClose()
    } catch (err) {
      console.error("Error creating mood:", err)
      setError(`Failed to create mood: ${err instanceof Error ? err.message : "Unknown error"}`)
    } finally {
      setIsLoading(false)
    }
  }

  const getMoodGenres = (mood: string): string[] => {
    switch (mood) {
      case "happy":
        return ["pop", "happy", "dance"]
      case "sad":
        return ["sad", "indie", "singer-songwriter"]
      case "energetic":
        return ["edm", "rock", "workout"]
      case "relaxed":
        return ["chill", "ambient", "sleep"]
      case "focused":
        return ["study", "classical", "instrumental"]
      default:
        return ["pop"]
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Mood Collection</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Mood Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Chill Vibes"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A collection of songs for relaxing..."
              className="resize-none"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Select Mood Type</Label>
            <Select value={selectedMood} onValueChange={setSelectedMood}>
              <SelectTrigger>
                <SelectValue placeholder="Select a mood" />
              </SelectTrigger>
              <SelectContent>
                {moodTypes.map((mood) => (
                  <SelectItem key={mood.id} value={mood.id}>
                    {mood.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Source</Label>
            <RadioGroup value={sourceType} onValueChange={setSourceType}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="random" id="random" />
                <Label htmlFor="random">Generate songs based on mood</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="existing" id="existing" />
                <Label htmlFor="existing">Use songs from existing playlist</Label>
              </div>
            </RadioGroup>
          </div>

          {sourceType === "existing" && (
            <div className="space-y-2">
              <Label htmlFor="sourcePlaylist">Source Playlist</Label>
              <Select
                value={sourcePlaylist}
                onValueChange={setSourcePlaylist}
                disabled={existingPlaylists.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a playlist" />
                </SelectTrigger>
                <SelectContent>
                  {existingPlaylists.map((playlist) => (
                    <SelectItem key={playlist.id} value={playlist.id}>
                      {playlist.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-[#00FFFF] text-black hover:bg-[#00FFFF]/80">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Mood"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

