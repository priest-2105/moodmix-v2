"use server"

import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string

export async function savePlaylistPreference(supabase: any, userId: string, playlistData: any) {
  const { data, error } = await supabase
    .from("playlists")
    .upsert({
      user_id: userId,
      ...playlistData,
    })
    .select()

  if (error) {
    console.error("Error saving playlist preference:", error)
    throw error
  }

  return data
}

export async function getPlaylistPreferences(userId: string) {
  const supabase = createClient(supabaseUrl, supabaseKey)

  const { data, error } = await supabase.from("playlists").select("*").eq("user_id", userId)

  if (error) {
    console.error("Error getting playlist preferences:", error)
    return []
  }

  return data
}

