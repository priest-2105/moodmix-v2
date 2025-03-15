"use server"

import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string

export interface MoodData {
  id?: string
  user_id: string
  name: string
  description?: string
  mood_type: string
  image_url?: string
  created_at?: string
}

export interface MoodTrack {
  id?: string
  mood_id: string
  track_id: string
  track_uri: string
  track_name: string
  artist_name: string
  album_name?: string
  album_image_url?: string
  added_at?: string
}

export async function saveMood(userId: string, moodData: Omit<MoodData, "user_id">) {
  const supabase = createClient(supabaseUrl, supabaseKey)

  const { data, error } = await supabase
    .from("moods")
    .insert({
      user_id: userId,
      ...moodData,
      created_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    console.error("Error saving mood:", error)
    throw error
  }

  return data
}

export async function saveMoodTracks(moodId: string, tracks: Omit<MoodTrack, "mood_id" | "added_at">[]) {
  const supabase = createClient(supabaseUrl, supabaseKey)

  const tracksWithMoodId = tracks.map((track) => ({
    mood_id: moodId,
    ...track,
    added_at: new Date().toISOString(),
  }))

  const { data, error } = await supabase.from("mood_tracks").insert(tracksWithMoodId).select()

  if (error) {
    console.error("Error saving mood tracks:", error)
    throw error
  }

  return data
}

export async function getUserMoods(userId: string) {
  const supabase = createClient(supabaseUrl, supabaseKey)

  const { data, error } = await supabase
    .from("moods")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error getting user moods:", error)
    return []
  }

  return data
}

export async function getMoodTracks(moodId: string) {
  const supabase = createClient(supabaseUrl, supabaseKey)

  const { data, error } = await supabase
    .from("mood_tracks")
    .select("*")
    .eq("mood_id", moodId)
    .order("added_at", { ascending: false })

  if (error) {
    console.error("Error getting mood tracks:", error)
    return []
  }

  return data
}

