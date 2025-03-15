"use server"

import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string

export interface MoodData {
  id?: string
  user_id: string
  name: string
  description?: string | null
  mood_type: string
  image_url?: string | null
  created_at?: string
}

export interface MoodTrack {
  id?: string
  mood_id: string
  track_id: string
  track_uri: string
  track_name: string
  artist_name: string
  album_name?: string | null
  album_image_url?: string | null
  added_at?: string
}

// Helper function to validate UUID format
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

export async function saveMood(userId: string, moodData: Omit<MoodData, "user_id">) {
  const supabase = createClient(supabaseUrl, supabaseKey)

  // Log the exact data we're sending to Supabase
  const moodToInsert = {
    user_id: userId, // Use Spotify ID directly
    name: moodData.name,
    description: moodData.description || null,
    mood_type: moodData.mood_type || "custom",
    image_url: moodData.image_url || null,
    // Let Supabase handle the created_at timestamp with its default value
  }

  console.log("Saving mood with exact data:", JSON.stringify(moodToInsert, null, 2))

  try {
    const { data, error } = await supabase.from("moods").insert(moodToInsert).select().single()

    if (error) {
      console.error("Error saving mood:", error)
      throw error
    }

    return data
  } catch (err) {
    console.error("Exception in saveMood:", err)
    throw err
  }
}

export async function saveMoodTracks(moodId: string, tracks: Omit<MoodTrack, "mood_id" | "added_at">[]) {
  const supabase = createClient(supabaseUrl, supabaseKey)

  // Validate moodId is a valid UUID
  if (!isValidUUID(moodId)) {
    console.error("Invalid mood ID format. Expected UUID, got:", moodId)
    throw new Error("Invalid mood ID format. Must be a valid UUID.")
  }

  // Ensure all required fields are present and properly formatted
  const tracksWithMoodId = tracks.map((track) => ({
    mood_id: moodId,
    track_id: track.track_id || `unknown-${Date.now()}`,
    track_uri: track.track_uri || `spotify:track:unknown-${Date.now()}`,
    track_name: track.track_name || "Unknown Track",
    artist_name: track.artist_name || "Unknown Artist",
    album_name: track.album_name || null,
    album_image_url: track.album_image_url || null,
    // Let Supabase handle the added_at timestamp with its default value
  }))

  console.log(`Saving ${tracksWithMoodId.length} tracks for mood ID: ${moodId}`)
  console.log("First track sample:", JSON.stringify(tracksWithMoodId[0], null, 2))

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

export async function getUserMoods(userId: string) {
  const supabase = createClient(supabaseUrl, supabaseKey)

  console.log(`Getting moods for Spotify ID ${userId}`)

  try {
    const { data, error } = await supabase
      .from("moods")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error getting user moods:", error)
      return []
    }

    return data || []
  } catch (err) {
    console.error("Exception in getUserMoods:", err)
    return []
  }
}

export async function getMoodTracks(moodId: string) {
  const supabase = createClient(supabaseUrl, supabaseKey)

  // Validate moodId is a valid UUID
  if (!isValidUUID(moodId)) {
    console.error("Invalid mood ID format in getMoodTracks. Expected UUID, got:", moodId)
    return []
  }

  try {
    const { data, error } = await supabase
      .from("mood_tracks")
      .select("*")
      .eq("mood_id", moodId)
      .order("added_at", { ascending: false })

    if (error) {
      console.error("Error getting mood tracks:", error)
      return []
    }

    return data || []
  } catch (err) {
    console.error("Exception in getMoodTracks:", err)
    return []
  }
}

