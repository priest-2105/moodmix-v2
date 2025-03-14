"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { getSpotifyToken } from "@/lib/spotify"

export default function CallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const handleCallback = async () => {
      // Check if searchParams is available
      if (!searchParams) {
        console.error("Search params not available")
        router.push("/?auth_error=no_search_params")
        return
      }

      const code = searchParams.get("code")
      const error = searchParams.get("error")

      if (error) {
        console.error("Spotify auth error:", error)
        router.push("/?auth_error=" + encodeURIComponent(error))
        return
      }

      if (!code) {
        console.error("No code provided in callback")
        router.push("/?auth_error=no_code")
        return
      }

      try {
        // Get the token
        const tokenResponse = await getSpotifyToken(code)

        if (tokenResponse.access_token) {
          // Store the token in localStorage
          localStorage.setItem("spotify_access_token", tokenResponse.access_token)
          localStorage.setItem("spotify_refresh_token", tokenResponse.refresh_token || "")
          localStorage.setItem("spotify_token_expiry", (Date.now() + tokenResponse.expires_in * 1000).toString())

          // Redirect to home page
          router.push("/")
        } else {
          console.error("No access token in response")
          router.push("/?auth_error=no_token")
        }
      } catch (error) {
        console.error("Error handling callback:", error)
        router.push("/?auth_error=" + encodeURIComponent(error instanceof Error ? error.message : String(error)))
      }
    }

    handleCallback()
  }, [searchParams, router])

  return (
    <div className="h-screen bg-[#1a1a1a] text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Connecting to Spotify...</h1>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00FFFF] mx-auto"></div>
      </div>
    </div>
  )
}

