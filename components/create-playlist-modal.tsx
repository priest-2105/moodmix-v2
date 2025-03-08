"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { createPlaylist, addTracksToPlaylist, getRecommendations } from "@/lib/spotify"
import { createClient } from "@/lib/supabase/client"
import { savePlaylistPreference } from "@/lib/supabase/playlist"
import type { Playlist } from "@/types/spotify"

interface CreatePlaylistModalProps {
  isOpen: boolean
  onClose: () => void
  accessToken: string | null
  userId: string | undefined
  existingPlaylists: Playlist[]
  onPlaylistCreated: (playlist: Playlist) => void
}

const moods = [
  { id: "happy", name: "Happy", params: { min_valence: 0.7, target_energy: 0.8 } },
  { id: "sad", name: "Sad", params: { max_valence: 0.3, target_energy: 0.4 } },
  { id: "energetic", name: "Energetic", params: { min_energy: 0.8, target_tempo: 150 } },
  { id: "relaxed", name: "Relaxed", params: { max_energy: 0.4, target_acousticness: 0.8 } },
  { id: "focused", name: "Focused", params: { target_instrumentalness: 0.5, max_speechiness: 0.3 } },
]

export default function CreatePlaylistModal({
  isOpen,
  onClose,
  accessToken,
  userId,
  existingPlaylists,
  onPlaylistCreated,
}: CreatePlaylistModalProps) {
  const [name, setName] = useState("")
  const [selectedMood, setSelectedMood] = useState("happy")
  const [sourceType, setSourceType] = useState("random")
  const [sourcePlaylist, setSourcePlaylist] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!accessToken || !userId) {
      setError("You must be logged in to create a playlist")
      return
    }

    if (!name.trim()) {
      setError("Please enter a playlist name")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      // Create empty playlist
      const newPlaylist = await createPlaylist(accessToken, userId, {
        name,
        description: `${name} - A ${moods.find((m) => m.id === selectedMood)?.name} mood playlist`,
      })

      // Get tracks based on mood
      const selectedMoodParams = moods.find((m) => m.id === selectedMood)?.params || {}

      let trackUris: string[] = []

      if (sourceType === "existing" && sourcePlaylist) {
        // Get tracks from existing playlist and filter by mood
        // In a real app, you'd analyze the audio features of these tracks
        // and filter based on the mood parameters
        // For simplicity, we'll just use the first 10 tracks
        const selectedPlaylistObj = existingPlaylists.find((p) => p.id === sourcePlaylist)
        if (selectedPlaylistObj && selectedPlaylistObj.tracks && selectedPlaylistObj.tracks.items) {
          trackUris = selectedPlaylistObj.tracks.items.slice(0, 10).map((item) => item.track.uri)
        }
      } else {
        // Get recommendations based on mood
        const recommendations = await getRecommendations(accessToken, {
          seed_genres: getMoodGenres(selectedMood),
          limit: 20,
          ...selectedMoodParams,
        })

        trackUris = recommendations.tracks.map((track) => track.uri)
      }

      // Add tracks to playlist
      if (trackUris.length > 0) {
        await addTracksToPlaylist(accessToken, newPlaylist.id, trackUris)
      }

      // Save playlist preference to Supabase
      const supabase = createClient()
      await savePlaylistPreference(supabase, userId, {
        playlist_id: newPlaylist.id,
        playlist_name: name,
        mood: selectedMood,
        created_at: new Date().toISOString(),
      })

      // Update UI
      onPlaylistCreated({
        ...newPlaylist,
        tracks: { items: [] }, // Initialize with empty tracks
      })

      // Close modal
      onClose()
    } catch (err) {
      console.error("Error creating playlist:", err)
      setError("Failed to create playlist. Please try again.")
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
          <DialogTitle>Create Mood Playlist</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Playlist Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Awesome Playlist"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Select Mood</Label>
            <Select value={selectedMood} onValueChange={setSelectedMood}>
              <SelectTrigger>
                <SelectValue placeholder="Select a mood" />
              </SelectTrigger>
              <SelectContent>
                {moods.map((mood) => (
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
                <Label htmlFor="random">Generate random songs based on mood</Label>
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
                "Create Playlist"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

