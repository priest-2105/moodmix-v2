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
import { Loader2, Upload } from "lucide-react"
import { getRecommendations, getPlaylistTracks } from "@/lib/spotify"
import { saveMood, saveMoodTracks } from "@/lib/supabase/moods"
import type { Playlist } from "@/types/spotify"
import { useToast } from "@/components/ui/use-toast"

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

  // Generate a colored placeholder based on the mood type
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
  const [customImage, setCustomImage] = useState<string | null>(null)
  const [useCustomImage, setUseCustomImage] = useState(false)
  const { toast } = useToast()

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // For simplicity, we'll use a data URL
      // In a production app, you'd upload this to a storage service
      const reader = new FileReader()
      reader.onload = (event) => {
        setCustomImage(event.target?.result as string)
        setUseCustomImage(true)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!userId) {
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
        try {
          const playlistTracks = await getPlaylistTracks(accessToken || "", sourcePlaylist)

          if (playlistTracks && playlistTracks.items) {
            tracks = playlistTracks.items.map((item: any) => item.track).slice(0, 20)
          }
        } catch (playlistError) {
          console.error("Error getting playlist tracks:", playlistError)
          // Continue with fallback tracks
          tracks = getFallbackTracks()
        }
      } else {
        // Get recommendations based on mood
        try {
          console.log("Getting recommendations for mood:", selectedMood)
          const recommendations = await getRecommendations(accessToken || "", {
            seed_genres: getMoodGenres(selectedMood),
            limit: 20,
            ...selectedMoodParams,
          })

          if (recommendations && recommendations.tracks) {
            tracks = recommendations.tracks
          }
        } catch (recError) {
          console.error("Error getting recommendations:", recError)
          // Fallback to sample tracks
          tracks = getFallbackTracks()
        }
      }

      if (tracks.length === 0) {
        tracks = getFallbackTracks()
      }

      // Determine image URL
      const imageUrl = useCustomImage && customImage ? customImage : getMoodImageUrl(selectedMood)

      // Prepare mood data
      const moodData = {
        name: name.trim(),
        description: description.trim() || `${name} - A ${moodTypes.find((m) => m.id === selectedMood)?.name} mood`,
        mood_type: selectedMood,
        image_url: imageUrl,
      }

      // Save mood to Supabase
      console.log("Saving mood to Supabase with data:", { userId, ...moodData })

      try {
        // Save the mood
        const savedMood = await saveMood(userId, moodData)

        if (!savedMood || !savedMood.id) {
          throw new Error("Failed to save mood - no ID returned")
        }

        console.log("Mood saved successfully with ID:", savedMood.id)

        // Prepare track data
        const trackData = tracks.map((track) => ({
          track_id: track.id || `unknown-${Math.random().toString(36).substring(2, 9)}`,
          track_uri: track.uri || `spotify:track:unknown-${Math.random().toString(36).substring(2, 9)}`,
          track_name: track.name || "Unknown Track",
          artist_name: track.artists ? track.artists.map((a: any) => a.name).join(", ") : "Unknown Artist",
          album_name: track.album?.name || null,
          album_image_url: track.album?.images?.[0]?.url || null,
        }))

        // Save tracks to Supabase
        console.log(`Saving ${trackData.length} tracks for mood ID: ${savedMood.id}`)
        await saveMoodTracks(savedMood.id, trackData)

        // Update UI
        onMoodCreated({
          ...savedMood,
          tracks: trackData,
        })

        // Show success toast
        toast({
          title: "Mood Created",
          description: `Your "${name}" mood has been created successfully.`,
        })

        // Close modal
        onClose()

        // Reset form
        setName("")
        setDescription("")
        setSelectedMood("happy")
        setSourceType("random")
        setSourcePlaylist("")
        setCustomImage(null)
        setUseCustomImage(false)
      } catch (dbError) {
        console.error("Database error:", dbError)
        setError(`Database error: ${dbError instanceof Error ? dbError.message : "Unknown error"}`)

        // Show error toast
        toast({
          title: "Error Creating Mood",
          description: "There was a problem saving your mood to the database.",
          variant: "destructive",
        })
      }
    } catch (err) {
      console.error("Error creating mood:", err)
      setError(`Failed to create mood: ${err instanceof Error ? err.message : "Unknown error"}`)

      // Show error toast
      toast({
        title: "Error",
        description: "Failed to create mood. Please try again.",
        variant: "destructive",
      })
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

  const getFallbackTracks = () => {
    return [
      {
        id: `unknown-${Math.random().toString(36).substring(2, 9)}`,
        uri: `spotify:track:unknown-${Math.random().toString(36).substring(2, 9)}`,
        name: "Fallback Track 1",
        artists: [{ name: "Fallback Artist" }],
        album: {
          name: "Fallback Album",
          images: [{ url: "/placeholder.svg?height=200&width=200" }],
        },
      },
      {
        id: `unknown-${Math.random().toString(36).substring(2, 9)}`,
        uri: `spotify:track:unknown-${Math.random().toString(36).substring(2, 9)}`,
        name: "Fallback Track 2",
        artists: [{ name: "Fallback Artist" }],
        album: {
          name: "Fallback Album",
          images: [{ url: "/placeholder.svg?height=200&width=200" }],
        },
      },
    ]
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
            <Label>Mood Image</Label>
            <div className="flex items-center gap-4">
              <div className="relative w-24 h-24 rounded overflow-hidden border border-white/20">
                <img
                  src={useCustomImage && customImage ? customImage : getMoodImageUrl(selectedMood)}
                  alt="Mood cover"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="image-upload" className="cursor-pointer">
                  <div className="flex items-center gap-2 p-2 border border-dashed border-white/30 rounded hover:bg-white/5 transition-colors">
                    <Upload className="h-4 w-4" />
                    <span>Upload custom image</span>
                  </div>
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </Label>
                {customImage && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="mt-2 text-xs text-red-400 hover:text-red-300"
                    onClick={() => {
                      setCustomImage(null)
                      setUseCustomImage(false)
                    }}
                  >
                    Remove custom image
                  </Button>
                )}
              </div>
            </div>
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

