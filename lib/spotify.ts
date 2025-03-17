"use server"

// lib/spotify.ts - Server-side functions with 'use server' directive

// Only use environment variables, never hardcode credentials
const CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID || ""
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET || ""
const REDIRECT_URI = "http://localhost:3000/callback"

// Improve error handling in getSpotifyToken
export async function getSpotifyToken(code: string) {
  try {
    if (!code) {
      throw new Error("Authorization code is required")
    }

    if (!CLIENT_ID || !CLIENT_SECRET) {
      console.error("Missing Spotify credentials:", {
        hasClientId: !!CLIENT_ID,
        hasClientSecret: !!CLIENT_SECRET,
      })
      throw new Error("Spotify API credentials are missing")
    }

    console.log("Starting token exchange with code:", code.substring(0, 10) + "...")
    console.log("Using redirect URI:", REDIRECT_URI)

    const params = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: REDIRECT_URI,
    })

    console.log("Making request to Spotify token endpoint...")

    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64")}`,
      },
      body: params.toString(),
    })

    console.log("Token response status:", response.status, response.statusText)

    if (!response.ok) {
      let errorText = "Unknown error"
      try {
        errorText = await response.text()
        console.error("Token error response body:", errorText)
      } catch (e) {
        console.error("Could not read error response body")
      }

      throw new Error(`Failed to get Spotify token: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const data = await response.json()
    console.log("Token exchange successful, received token type:", data.token_type)
    console.log("Token expires in:", data.expires_in, "seconds")

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

// Update the getUserPlaylists function to handle pagination and get all playlists
export async function getUserPlaylists(accessToken: string) {
  try {
    if (!accessToken) {
      throw new Error("Access token is required")
    }

    console.log("Getting user playlists with token:", accessToken.substring(0, 5) + "...")

    // First request to get initial playlists and total count
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
    let allPlaylists = data.items || []
    const total = data.total || 0

    console.log(`Initial playlists fetch: ${allPlaylists.length} of ${total} total`)

    // If there are more playlists, fetch them with pagination
    if (total > 50) {
      const additionalRequests = []
      for (let offset = 50; offset < total; offset += 50) {
        additionalRequests.push(
          fetch(`https://api.spotify.com/v1/me/playlists?limit=50&offset=${offset}`, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }).then((res) => res.json()),
        )
      }

      const additionalResults = await Promise.all(additionalRequests)
      for (const result of additionalResults) {
        if (result.items) {
          allPlaylists = [...allPlaylists, ...result.items]
        }
      }
    }

    console.log("User playlists success, count:", allPlaylists.length)
    return allPlaylists
  } catch (error) {
    console.error("Error in getUserPlaylists:", error)
    throw error
  }
}

export async function getPlaylistTracks(accessToken: string, playlistId: string) {
  try {
    // First request to get initial tracks and total count
    const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=50`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to get playlist tracks: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    let allTracks = data.items || []
    const total = data.total || 0

    // If there are more tracks, fetch them with pagination
    if (total > 50) {
      const additionalRequests = []
      for (let offset = 50; offset < total; offset += 50) {
        additionalRequests.push(
          fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=50&offset=${offset}`, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }).then((res) => res.json()),
        )
      }

      const additionalResults = await Promise.all(additionalRequests)
      for (const result of additionalResults) {
        if (result.items) {
          allTracks = [...allTracks, ...result.items]
        }
      }
    }

    return { items: allTracks, total }
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
    if (!accessToken) {
      console.error("No access token provided for recommendations")
      throw new Error("Access token is required")
    }

    // Make sure we have valid seed values
    if (!params.seed_genres && !params.seed_artists && !params.seed_tracks) {
      console.error("Missing seed values for recommendations")
      // Provide fallback seed genres if none are provided
      params.seed_genres = "pop,rock,electronic,hip-hop,r-n-b"
    }

    // Ensure seed_genres is properly formatted (no spaces, lowercase)
    if (params.seed_genres) {
      params.seed_genres = params.seed_genres.toLowerCase().replace(/\s+/g, "")
    }

    // Ensure we're requesting a good number of tracks
    if (!params.limit || params.limit < 5) {
      params.limit = 20
    }

    const queryParams = new URLSearchParams()

    Object.entries(params).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        queryParams.append(key, (value as string[]).join(","))
      } else if (value !== undefined && value !== null) {
        queryParams.append(key, value as string)
      }
    })

    console.log("Getting recommendations with params:", Object.fromEntries(queryParams.entries()))

    // Make a direct fetch request to the Spotify API
    const response = await fetch(`https://api.spotify.com/v1/recommendations?${queryParams.toString()}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Recommendations error response:", errorText)
      throw new Error(`Failed to get recommendations: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    // Validate the response data
    if (!data.tracks || !Array.isArray(data.tracks)) {
      console.error("Invalid recommendations response:", data)
      throw new Error("Invalid recommendations response from Spotify")
    }

    console.log("Recommendations success, count:", data.tracks.length)

    // Log detailed information about the first few tracks
    if (data.tracks.length > 0) {
      console.log(
        "First 3 recommended tracks:",
        data.tracks.slice(0, 3).map((track) => ({
          id: track.id,
          name: track.name,
          uri: track.uri,
          artists: track.artists?.map((a: any) => a.name).join(", "),
          album: track.album?.name,
          albumImage: track.album?.images?.[0]?.url,
        })),
      )
    } else {
      console.warn("No tracks returned from recommendations API")
    }

    return data
  } catch (error) {
    console.error("Error in getRecommendations:", error)

    // Instead of returning fallback tracks, throw the error to be handled by the caller
    throw error
  }
}

export async function getRecentlyPlayedTracks(accessToken: string) {
  try {
    const response = await fetch("https://api.spotify.com/v1/me/player/recently-played?limit=50", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Recently played tracks error response:", errorText)

      // If we get a 403, it's likely a permissions issue
      if (response.status === 403) {
        throw new Error(
          `Failed to get recently played tracks: ${response.status} ${response.statusText} - You may need to re-authenticate with the 'user-read-recently-played' scope`,
        )
      }

      throw new Error(`Failed to get recently played tracks: ${response.status} ${response.statusText}`)
    }

    return response.json()
  } catch (error) {
    console.error("Error in getRecentlyPlayedTracks:", error)
    throw error
  }
}

