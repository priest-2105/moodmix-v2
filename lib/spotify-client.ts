
const CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID
const REDIRECT_URI = typeof window !== "undefined" ? `${window.location.origin}` : "http://localhost:3000"

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
]

export function getSpotifyAuthUrl() {
  const params = new URLSearchParams({
    client_id: CLIENT_ID as string,
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

console.log('Client ID:', process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID)