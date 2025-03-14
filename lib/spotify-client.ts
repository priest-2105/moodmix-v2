// lib/spotify-client.ts - Client-side functions (no 'use server' directive)

// Only use environment variables, never hardcode credentials
const CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID || ""

// Update the REDIRECT_URI to match what's in your Spotify Developer Dashboard
const REDIRECT_URI = "http://localhost:3000/callback"

// Make sure to include the streaming scope for Web Playback SDK
const SCOPES = [
  "user-read-private",
  "user-read-email",
  "playlist-read-private",
  "playlist-read-collaborative",
  "playlist-modify-public",
  "playlist-modify-private",
  "user-library-read",
  "user-library-modify",
  "user-top-read",
  "user-read-playback-state",
  "user-modify-playback-state",
  "streaming", // Add this scope for Web Playback SDK
]

export function getSpotifyAuthUrl() {
  // Check if CLIENT_ID is available
  if (!CLIENT_ID) {
    console.error("Spotify Client ID is missing. Please check your environment variables.")
    return "#error-missing-client-id"
  }

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: "code",
    redirect_uri: REDIRECT_URI,
    scope: SCOPES.join(" "),
    show_dialog: "true",
  })

  return `https://accounts.spotify.com/authorize?${params.toString()}`
}

// Client-side player controls and other client-only functions can go here
export function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  return `${minutes}:${seconds.toString().padStart(2, "0")}`
}

