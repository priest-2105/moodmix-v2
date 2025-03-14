"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { getSpotifyToken } from "@/lib/spotify"

export default function CallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState("Initializing...")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Check if searchParams is available
        if (!searchParams) {
          console.error("Search params not available")
          setStatus("Error: Search params not available")
          setError("Search params not available")
          return
        }

        const code = searchParams.get("code")
        const authError = searchParams.get("error")

        if (authError) {
          console.error("Spotify auth error:", authError)
          setStatus(`Error: ${authError}`)
          setError(authError)
          setTimeout(() => router.push("/?auth_error=" + encodeURIComponent(authError)), 3000)
          return
        }

        if (!code) {
          console.error("No code provided in callback")
          setStatus("Error: No authorization code provided")
          setError("No authorization code provided")
          setTimeout(() => router.push("/?auth_error=no_code"), 3000)
          return
        }

        // Log the code (first few characters for security)
        console.log("Received authorization code:", code.substring(0, 10) + "...")
        setStatus("Exchanging authorization code for access token...")

        try {
          // Get the token
          const tokenResponse = await getSpotifyToken(code)

          if (tokenResponse.access_token) {
            // Store the token in localStorage
            localStorage.setItem("spotify_access_token", tokenResponse.access_token)
            localStorage.setItem("spotify_refresh_token", tokenResponse.refresh_token || "")
            localStorage.setItem("spotify_token_expiry", (Date.now() + tokenResponse.expires_in * 1000).toString())

            setStatus("Authentication successful! Redirecting...")
            console.log("Token exchange successful, redirecting to home page")

            setTimeout(() => router.push("/"), 1000)
          } else {
            console.error("No access token in response")
            setStatus("Error: No access token received")
            setError("No access token received from Spotify")
            setTimeout(() => router.push("/?auth_error=no_token"), 3000)
          }
        } catch (tokenError) {
          console.error("Error exchanging code for token:", tokenError)
          setStatus("Error exchanging code for token")
          setError(tokenError instanceof Error ? tokenError.message : String(tokenError))
          setTimeout(() => router.push("/?auth_error=" + encodeURIComponent(String(tokenError))), 3000)
        }
      } catch (callbackError) {
        console.error("Unexpected error in callback:", callbackError)
        setStatus("Unexpected error")
        setError(callbackError instanceof Error ? callbackError.message : String(callbackError))
        setTimeout(() => router.push("/?auth_error=unexpected_error"), 3000)
      }
    }

    handleCallback()
  }, [searchParams, router])

  return (
    <div className="h-screen bg-[#1a1a1a] text-white flex items-center justify-center">
      <div className="text-center max-w-md p-6 bg-[#282828] rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold mb-4">Spotify Authentication</h1>
        <p className="mb-4">{status}</p>

        {error ? (
          <div className="bg-red-900/50 p-4 rounded-md mb-4 text-left">
            <h3 className="font-bold mb-2">Error Details:</h3>
            <p className="text-sm break-words">{error}</p>
          </div>
        ) : (
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00FFFF] mx-auto mb-4"></div>
        )}

        <p className="text-sm text-gray-400">
          {error
            ? "You'll be redirected to the login page in a few seconds..."
            : "Please wait while we complete the authentication process..."}
        </p>
      </div>
    </div>
  )
}

