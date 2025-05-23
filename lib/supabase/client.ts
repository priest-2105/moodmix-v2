"use client"

import { createClient as createSupabaseClient } from "@supabase/supabase-js"

export function createClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string,
  )
}

