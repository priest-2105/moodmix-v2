"use server"

// lib/spotify.ts - Server-side functions with 'use server' directive

const CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID || ""
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET || ""
// Update the REDIRECT_URI to match what's in spotify-client.ts
const REDIRECT_URI = "http://localhost:3000/callback"

// Improve error handling in getSpotifyToken
export async function getSpotifyToken(code: string) {
  try {
    const params = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: REDIRECT_URI,
    })

    console.log("Requesting token with params:", params.toString())

    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64")}`,
      },
      body: params.toString(),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Token error response:", errorText)
      throw new Error(`Failed to get Spotify token: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    console.log("Token response success:", { access_token: "REDACTED", expires_in: data.expires_in })
    return data
  } catch (error) {
    console.error("Error in getSpotifyToken:", error)
    throw error
  }
}

// Improve error handling in getUserProfile
export async function getUserProfile(accessToken: string) {
  try {
    if (!accessToken) {
      throw new Error("Access token is required")
    }

    console.log("Getting user profile with token:", accessToken.substring(0, 5) + "...")

    const response = await fetch("https://api.spotify.com/v1/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("User profile error response:", errorText)
      throw new Error(`Failed to get user profile: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    console.log("User profile success:", { id: data.id, display_name: data.display_name })
    return data
  } catch (error) {
    console.error("Error in getUserProfile:", error)
    throw error
  }
}

// Improve error handling in getUserPlaylists
export async function getUserPlaylists(accessToken: string) {
  try {
    if (!accessToken) {
      throw new Error("Access token is required")
    }

    console.log("Getting user playlists with token:", accessToken.substring(0, 5) + "...")

    const response = await fetch("https://api.spotify.com/v1/me/playlists?limit=50", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("User playlists error response:", errorText)
      throw new Error(`Failed to get user playlists: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    console.log("User playlists success, count:", data.items.length)
    return data.items
  } catch (error) {
    console.error("Error in getUserPlaylists:", error)
    throw error
  }
}

export async function getPlaylistTracks(accessToken: string, playlistId: string) {
  try {
    const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to get playlist tracks: ${response.status} ${response.statusText}`)
    }

    return response.json()
  } catch (error) {
    console.error("Error in getPlaylistTracks:", error)
    throw error
  }
}

export async function getTrack(accessToken: string, trackId: string) {
  try {
    const response = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to get track: ${response.status} ${response.statusText}`)
    }

    return response.json()
  } catch (error) {
    console.error("Error in getTrack:", error)
    throw error
  }
}

export async function createPlaylist(
  accessToken: string,
  userId: string,
  data: { name: string; description?: string },
) {
  try {
    const response = await fetch(`https://api.spotify.com/v1/users/${userId}/playlists`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: data.name,
        description: data.description || "",
        public: true,
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to create playlist: ${response.status} ${response.statusText}`)
    }

    return response.json()
  } catch (error) {
    console.error("Error in createPlaylist:", error)
    throw error
  }
}

export async function addTracksToPlaylist(accessToken: string, playlistId: string, trackUris: string[]) {
  try {
    const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        uris: trackUris,
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to add tracks to playlist: ${response.status} ${response.statusText}`)
    }

    return response.json()
  } catch (error) {
    console.error("Error in addTracksToPlaylist:", error)
    throw error
  }
}

export async function getRecommendations(accessToken: string, params: any) {
  try {
    const queryParams = new URLSearchParams()

    Object.entries(params).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        queryParams.append(key, (value as string[]).join(","))
      } else {
        queryParams.append(key, value as string)
      }
    })

    const response = await fetch(`https://api.spotify.com/v1/recommendations?${queryParams.toString()}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to get recommendations: ${response.status} ${response.statusText}`)
    }

    return response.json()
  } catch (error) {
    console.error("Error in getRecommendations:", error)
    throw error
  }
}

