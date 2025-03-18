import { createClient } from "@supabase/supabase-js"
import { validate as uuidValidate, version as uuidVersion } from "uuid"

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// MoodTrack interface
interface MoodTrack {
  mood_id: string
  track_id: string
  track_uri: string
  track_name: string
  artist_name: string
  album_name: string | null
  album_image_url: string | null
  duration_ms?: number // Make duration_ms optional
  added_at?: string // Optional because Supabase can handle the default
}

// UUID validation function
function isValidUUID(uuid: string) {
  if (!uuidValidate(uuid)) {
    return false
  }
  if (uuidVersion(uuid) !== 4) {
    return false
  }
  return true
}

export async function saveMoodTracks(moodId: string, tracks: Omit<MoodTrack, "mood_id" | "added_at">[]) {
  const supabase = createClient(supabaseUrl, supabaseKey)

  // Validate moodId is a valid UUID
  if (!isValidUUID(moodId)) {
    console.error("Invalid mood ID format. Expected UUID, got:", moodId)
    throw new Error("Invalid mood ID format. Must be a valid UUID.")
  }

  // Log the tracks we're about to save
  console.log(`Preparing to save ${tracks.length} tracks for mood ID: ${moodId}`)
  if (tracks.length > 0) {
    console.log("First track sample:", JSON.stringify(tracks[0], null, 2))
  }

  // Filter out any fallback tracks
  const validTracks = tracks.filter((track) => {
    const isFallback = track.track_id.includes("fallback") || track.track_uri.includes("fallback")
    if (isFallback) {
      console.warn("Skipping fallback track:", track.track_name)
      return false
    }
    return true
  })

  if (validTracks.length === 0) {
    throw new Error("No valid tracks to save. All tracks were fallback tracks.")
  }

  // Ensure all required fields are present and properly formatted
  const tracksWithMoodId = validTracks.map((track) => {
    // Create a base object without duration_ms
    const trackData: any = {
      mood_id: moodId,
      track_id: track.track_id || `unknown-${Date.now()}`,
      track_uri: track.track_uri || `spotify:track:unknown-${Date.now()}`,
      track_name: track.track_name || "Unknown Track",
      artist_name: track.artist_name || "Unknown Artist",
      album_name: track.album_name || null,
      album_image_url: track.album_image_url || null,
      // Let Supabase handle the added_at timestamp with its default value
    }

    // Only add duration_ms if it exists in the track
    if (track.duration_ms) {
      try {
        trackData.duration_ms = track.duration_ms
      } catch (e) {
        console.warn("Could not add duration_ms to track data, column might not exist yet:", e)
      }
    }

    return trackData
  })

  try {
    // For large track lists, we might need to batch the inserts
    if (tracksWithMoodId.length > 20) {
      console.log("Large track list detected, batching inserts")
      const batches = []
      for (let i = 0; i < tracksWithMoodId.length; i += 20) {
        const batch = tracksWithMoodId.slice(i, i + 20)
        batches.push(batch)
      }

      for (const [index, batch] of batches.entries()) {
        console.log(`Inserting batch ${index + 1} of ${batches.length}`)
        const { error } = await supabase.from("mood_tracks").insert(batch)
        if (error) {
          console.error(`Error in batch ${index + 1}:`, error)
          throw error
        }
      }

      return tracksWithMoodId
    } else {
      const { data, error } = await supabase.from("mood_tracks").insert(tracksWithMoodId).select()

      if (error) {
        console.error("Error saving mood tracks:", error)
        throw error
      }

      return data
    }
  } catch (err) {
    console.error("Exception in saveMoodTracks:", err)
    throw err
  }
}

export async function saveMood(userId: string, moodData: any) {
  const supabase = createClient(supabaseUrl, supabaseKey)

  const { data, error } = await supabase
    .from("moods")
    .upsert({
      user_id: userId,
      ...moodData,
    })
    .select()

  if (error) {
    console.error("Error saving mood:", error)
    throw error
  }

  return data[0]
}

export async function getMoodTracks(moodId: string) {
  const supabase = createClient(supabaseUrl, supabaseKey)

  const { data, error } = await supabase.from("mood_tracks").select("*").eq("mood_id", moodId)

  if (error) {
    console.error("Error getting mood tracks:", error)
    return []
  }

  return data
}

export async function getUserMoods(userId: string) {
  const supabase = createClient(supabaseUrl, supabaseKey)

  const { data, error } = await supabase.from("moods").select("*").eq("user_id", userId)

  if (error) {
    console.error("Error getting user moods:", error)
    return []
  }

  return data
}

export async function deleteMood(moodId: string) {
  const supabase = createClient(supabaseUrl, supabaseKey)

  // First delete all tracks associated with this mood
  const { error: tracksError } = await supabase.from("mood_tracks").delete().eq("mood_id", moodId)

  if (tracksError) {
    console.error("Error deleting mood tracks:", tracksError)
    throw tracksError
  }

  // Then delete the mood itself
  const { error } = await supabase.from("moods").delete().eq("id", moodId)

  if (error) {
    console.error("Error deleting mood:", error)
    throw error
  }

  return true
}

