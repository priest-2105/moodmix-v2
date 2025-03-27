import { NextResponse } from "next/server";
import { env } from "../lib/env"; 

export async function GET() {
  return NextResponse.json({
    supabaseUrl: env.SUPABASE_URL,
    supabaseAnonKey: env.SUPABASE_SERVICE_ROLE_KEY,
    spotifyClientId: env.SPOTIFY_CLIENT_ID,
    spotifyClientSecret: env.SPOTIFY_CLIENT_SECRET,
  });
}
