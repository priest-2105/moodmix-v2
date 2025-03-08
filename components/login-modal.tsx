"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { getSpotifyAuthUrl } from "@/lib/spotify-client" // Updated import
import { Music2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Check if user is authenticated
  useEffect(() => {
    const token = localStorage.getItem("spotify_access_token")
    setIsAuthenticated(!!token)
  }, [])

  const handleLogin = () => {
    setIsLoading(true)
    setError(null)

    const authUrl = getSpotifyAuthUrl()

    // Check if there was an error generating the auth URL
    if (authUrl.includes("error")) {
      setError(
        "Failed to generate Spotify authorization URL. Please check if the Spotify Client ID is properly configured.",
      )
      setIsLoading(false)
      return
    }

    window.location.href = authUrl
  }

  // Prevent closing the modal if not authenticated
  const handleOpenChange = (open: boolean) => {
    // Only allow closing if authenticated
    if (isAuthenticated) {
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-md bg-[#121212] border-[#333] text-white"
        hideCloseButton={!isAuthenticated}
        onEscapeKeyDown={(e) => {
          if (!isAuthenticated) {
            e.preventDefault()
          }
        }}
        onInteractOutside={(e) => {
          if (!isAuthenticated) {
            e.preventDefault()
          }
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white">Welcome to Moodmix</DialogTitle>
          <DialogDescription className="text-gray-400">
            Connect your Spotify account to access your playlists and create mood-based collections.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-6 py-6">
          <div className="flex justify-center">
            <Music2 className="h-20 w-20 text-[#00FFFF]" />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <p className="text-center text-gray-400">
            Create personalized playlists based on your mood and discover new music tailored to your taste.
          </p>
          <Button
            onClick={handleLogin}
            className="w-full py-6 bg-[#00FFFF] hover:bg-[#00FFFF]/80 text-black text-lg font-bold"
            disabled={isLoading}
          >
            {isLoading ? "Connecting..." : "Connect with Spotify"}
          </Button>
          <p className="text-xs text-center text-gray-500">
            By connecting, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}

