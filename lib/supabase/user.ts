"use server"

import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.SUPABASE_URL as string
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string

export async function saveUserPreferences(supabase: any, userId: string, preferences: any) {
  console.log("Saving user preferences to Supabase:", {
    userId,
    fields: Object.keys(preferences),
  })

  
  const { data, error } = await supabase
    .from("users")
    .upsert({
      id: userId,
      ...preferences,
    })
    .select()

  if (error) {
    console.error("Error saving user preferences:", error)
    throw error
  }

  return data
}

export async function getUserPreferences(userId: string) {
  const supabase = createClient(supabaseUrl, supabaseKey)

  const { data, error } = await supabase.from("users").select("*").eq("id", userId).single()

  if (error) {
    console.error("Error getting user preferences:", error)
    return null
  }

  return data
}

