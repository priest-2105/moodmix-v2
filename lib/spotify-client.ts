
const CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID || ""


const REDIRECT_URI = "http://localhost:3000/callback"


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
  "streaming", 
]

export function getSpotifyAuthUrl() {
  
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


export function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  return `${minutes}:${seconds.toString().padStart(2, "0")}`
}

