"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Upload } from "lucide-react"
import { Slider } from "@/components/ui/slider"
import { getRecommendations, getPlaylistTracks, searchTracks } from "@/lib/spotify"
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
  const [trackCount, setTrackCount] = useState(20) // Default to 20 tracks
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [customImage, setCustomImage] = useState<string | null>(null)
  const [useCustomImage, setUseCustomImage] = useState(false)
  const { toast } = useToast()

  // Test function to directly check Spotify API
  const testSpotifyRecommendations = async () => {
    if (!accessToken) {
      console.error("No access token available for testing")
      return
    }

    try {
      console.log("Testing direct Spotify API call for recommendations...")

      // Simple parameters for testing
      const testParams = {
        seed_genres: "pop,rock",
        limit: 5,
        market: "US",
      }

      const response = await fetch(
        `https://api.spotify.com/v1/recommendations?${new URLSearchParams(testParams).toString()}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      )

      if (!response.ok) {
        console.error("Test API call failed:", response.status, response.statusText)
        const errorText = await response.text()
        console.error("Error response:", errorText)
        return
      }

      const data = await response.json()
      console.log("Direct API test successful, received tracks:", data.tracks?.length)

      if (data.tracks && data.tracks.length > 0) {
        console.log("Sample track from direct API:", {
          id: data.tracks[0].id,
          name: data.tracks[0].name,
          uri: data.tracks[0].uri,
          artists: data.tracks[0].artists?.map((a: any) => a.name).join(", "),
        })
      }
    } catch (error) {
      console.error("Error in direct API test:", error)
    }
  }

  // Call this function when the modal opens
  useEffect(() => {
    if (isOpen && accessToken) {
      testSpotifyRecommendations()
    }
  }, [isOpen, accessToken])

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

          if (playlistTracks && playlistTracks.items && playlistTracks.items.length > 0) {
            tracks = playlistTracks.items.map((item: any) => item.track).slice(0, trackCount)
            console.log(`Got ${tracks.length} tracks from playlist`)

            // Log the first track to verify structure
            if (tracks.length > 0) {
              console.log("Sample track from playlist:", {
                id: tracks[0].id,
                name: tracks[0].name,
                artists: tracks[0].artists?.map((a: any) => a.name).join(", "),
                album: tracks[0].album?.name,
              })
            }
          } else {
            setError("No tracks found in the selected playlist.")
            setIsLoading(false)
            return
          }
        } catch (playlistError) {
          console.error("Error getting playlist tracks:", playlistError)
          setError("Could not retrieve tracks from the selected playlist. Please try again.")
          setIsLoading(false)
          return
        }
      } else {
        // Get recommendations based on mood
        try {
          console.log("Getting recommendations for mood:", selectedMood)

          // Try to get recommendations first
          let recommendationSuccess = false

          try {
            // Prepare parameters based on mood type
            const moodParams = moodTypes.find((m) => m.id === selectedMood)?.params || {}

            // Add more parameters for better recommendations
            const recommendationParams = {
              seed_genres: getMoodGenres(selectedMood).join(","),
              limit: Math.min(trackCount, 30), // Request the number of tracks the user wants, max 30
              ...moodParams,
              market: "US", // Add market parameter for better results
            }

            console.log("Recommendation parameters:", recommendationParams)

            const recommendations = await getRecommendations(accessToken || "", recommendationParams)

            if (recommendations && recommendations.tracks && recommendations.tracks.length > 0) {
              tracks = recommendations.tracks
              console.log(`Got ${tracks.length} recommended tracks`)
              recommendationSuccess = true
            }
          } catch (recError) {
            console.error("Recommendations API failed, will try search API instead:", recError)
          }

          // If recommendations failed, try search API as fallback
          if (!recommendationSuccess) {
            console.log("Using search API as fallback")

            // Build search query based on mood
            const searchQuery = buildSearchQueryForMood(selectedMood)
            console.log("Search query:", searchQuery)

            try {
              const searchResults = await searchTracks(accessToken || "", searchQuery, trackCount)

              if (searchResults && searchResults.length > 0) {
                tracks = searchResults
                console.log(`Got ${tracks.length} tracks from search`)

                // Log the first track to verify structure
                if (tracks.length > 0) {
                  console.log("Sample track from search:", {
                    id: tracks[0].id,
                    name: tracks[0].name,
                    uri: tracks[0].uri,
                    artists: tracks[0].artists?.map((a: any) => a.name).join(", "),
                    album: tracks[0].album?.name,
                  })
                }
              } else {
                throw new Error("No tracks found from search")
              }
            } catch (searchError) {
              console.error("Search API also failed:", searchError)
              throw new Error("Both recommendation and search APIs failed to find tracks")
            }
          }

          if (tracks.length === 0) {
            setError("No tracks found. Please try different mood settings.")
            setIsLoading(false)
            return
          }
        } catch (error) {
          console.error("Error getting tracks:", error)
          setError("Failed to get tracks. Please try again later.")
          setIsLoading(false)
          return
        }
      }

      if (tracks.length === 0) {
        setError("No tracks found. Please try different settings.")
        setIsLoading(false)
        return
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

        // Prepare track data - ensure we're using the actual track data
        const trackData = tracks.map((track) => {
          // Check if this is a fallback track
          const isFallback = track.id.includes("fallback") || track.uri.includes("fallback")

          if (isFallback) {
            console.warn("Detected fallback track:", track.name)
          } else {
            console.log("Processing real Spotify track:", {
              id: track.id,
              name: track.name,
              uri: track.uri,
            })
          }

          return {
            track_id: track.id,
            track_uri: track.uri,
            track_name: track.name,
            artist_name: track.artists ? track.artists.map((a: any) => a.name).join(", ") : "Unknown Artist",
            album_name: track.album?.name || null,
            album_image_url: track.album?.images?.[0]?.url || null,
          }
        })

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
          description: `Your "${name}" mood has been created successfully with ${trackData.length} tracks.`,
        })

        // Close modal
        onClose()

        // Reset form
        setName("")
        setDescription("")
        setSelectedMood("happy")
        setSourceType("random")
        setSourcePlaylist("")
        setTrackCount(20)
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

  // Function to build a search query based on mood
  const buildSearchQueryForMood = (mood: string): string => {
    switch (mood) {
      case "happy":
        return "genre:pop genre:dance mood:happy"
      case "sad":
        return "genre:indie genre:folk mood:sad"
      case "energetic":
        return "genre:edm genre:rock mood:energetic"
      case "relaxed":
        return "genre:ambient genre:chill mood:relaxed"
      case "focused":
        return "genre:classical genre:instrumental mood:focus"
      default:
        return "genre:pop"
    }
  }

  const getMoodGenres = (mood: string): string[] => {
    switch (mood) {
      case "happy":
        return ["pop", "dance", "disco", "funk", "happy"]
      case "sad":
        return ["sad", "indie", "singer-songwriter", "piano", "folk"]
      case "energetic":
        return ["edm", "rock", "dance", "electronic", "work-out"]
      case "relaxed":
        return ["chill", "ambient", "sleep", "acoustic", "jazz"]
      case "focused":
        return ["study", "classical", "piano", "ambient", "electronic"]
      default:
        return ["pop", "rock", "electronic"]
    }
  }

  const getFallbackTracks = (count: number) => {
    // Create fallback tracks with the requested count
    return Array.from({ length: count }, (_, i) => ({
      id: `fallback-${Math.random().toString(36).substring(2, 9)}`,
      uri: `spotify:track:fallback-${Math.random().toString(36).substring(2, 9)}`,
      name: `Fallback Track ${i + 1}`,
      artists: [{ name: "Fallback Artist" }],
      album: {
        name: "Fallback Album",
        images: [{ url: "/placeholder.svg?height=200&width=200" }],
      },
    }))
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
            <Label>Number of Tracks: {trackCount}</Label>
            <Slider value={[trackCount]} min={5} max={30} step={1} onValueChange={(value) => setTrackCount(value[0])} />
            <p className="text-xs text-muted-foreground">Select between 5 and 30 tracks for your mood</p>
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
                <SelectContent className="max-h-[300px]">
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

