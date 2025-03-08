
const CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID || ""

// Add console log to debug
console.log("Client ID:", CLIENT_ID)

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
  // Check if CLIENT_ID is available
  if (!CLIENT_ID) {
    console.error("Spotify Client ID is missing. Please check your environment variables.")
    // You could show an error message to the user here
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

