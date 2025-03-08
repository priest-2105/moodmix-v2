"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Plus, ChevronLeft, ChevronRight } from "lucide-react"
import { getSpotifyToken, getUserProfile, getUserPlaylists } from "@/lib/spotify" // Server functions
import LoginModal from "@/components/login-modal"
import CreatePlaylistModal from "@/components/create-playlist-modal"
import PlaylistCard from "@/components/playlist-card"
import MusicPlayer from "@/components/music-player"
import Sidebar from "@/components/sidebar"
import type { Playlist, SpotifyUser } from "@/types/spotify"
import { saveUserPreferences } from "@/lib/supabase/user"
import { createClient } from "@/lib/supabase/client"

export default function Home() {
  const searchParams = useSearchParams()
  const code = searchParams.get("code")

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [isCreatePlaylistModalOpen, setIsCreatePlaylistModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [user, setUser] = useState<SpotifyUser | null>(null)
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null)
  const [currentlyPlaying, setCurrentlyPlaying] = useState<any>(null)


  console.log('Client ID:', process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID)

  
  // Handle authentication flow
  useEffect(() => {
    const handleAuth = async () => {
      if (code) {
        setIsLoading(true)
        try {
          const tokenResponse = await getSpotifyToken(code)
          if (tokenResponse.access_token) {
            setAccessToken(tokenResponse.access_token)
            localStorage.setItem("spotify_access_token", tokenResponse.access_token)
            localStorage.setItem("spotify_refresh_token", tokenResponse.refresh_token)
            localStorage.setItem("spotify_token_expiry", (Date.now() + tokenResponse.expires_in * 1000).toString())
            setIsAuthenticated(true)
            setIsLoginModalOpen(false) // Close the login modal after successful authentication

            // Get user profile
            const userProfile = await getUserProfile(tokenResponse.access_token)
            setUser(userProfile)

            // Save user to Supabase
            const supabase = createClient()
            await saveUserPreferences(supabase, userProfile.id, {
              last_login: new Date().toISOString(),
              display_name: userProfile.display_name,
              email: userProfile.email,
            })

            // Load user playlists
            const userPlaylists = await getUserPlaylists(tokenResponse.access_token)
            setPlaylists(userPlaylists)
          }
        } catch (error) {
          console.error("Authentication error:", error)
        } finally {
          setIsLoading(false)
          // Remove code from URL to prevent re-authentication on refresh
          window.history.replaceState({}, document.title, window.location.pathname)
        }
      }
    }

    // Check if we already have a valid token
    const storedToken = localStorage.getItem("spotify_access_token")
    const tokenExpiry = localStorage.getItem("spotify_token_expiry")

    if (storedToken && tokenExpiry && Number.parseInt(tokenExpiry) > Date.now()) {
      setAccessToken(storedToken)
      setIsAuthenticated(true)
      setIsLoginModalOpen(false) // Ensure login modal is closed if already authenticated

      // Load user data and playlists
      const loadUserData = async () => {
        setIsLoading(true)
        try {
          const userProfile = await getUserProfile(storedToken)
          setUser(userProfile)

          const userPlaylists = await getUserPlaylists(storedToken)
          setPlaylists(userPlaylists)
        } catch (error) {
          console.error("Error loading user data:", error)
          // Token might be invalid, clear and re-authenticate
          localStorage.removeItem("spotify_access_token")
          localStorage.removeItem("spotify_refresh_token")
          localStorage.removeItem("spotify_token_expiry")
          setIsAuthenticated(false)
          setAccessToken(null)
          setIsLoginModalOpen(true) // Show login modal if authentication fails
        } finally {
          setIsLoading(false)
        }
      }

      loadUserData()
    } else if (code) {
      handleAuth()
    } else {
      // No token and no code, ensure login modal is shown
      setIsLoginModalOpen(true)
    }
  }, [code])

  // Categorize playlists
  const recentPlaylists = playlists.slice(0, 5)
  const oldPlaylists = playlists.slice(Math.max(0, playlists.length - 5))

  const handlePlaylistSelect = (playlist: Playlist) => {
    setSelectedPlaylist(playlist)
  }

  const handleLogout = () => {
    localStorage.removeItem("spotify_access_token")
    localStorage.removeItem("spotify_refresh_token")
    localStorage.removeItem("spotify_token_expiry")
    setIsAuthenticated(false)
    setAccessToken(null)
    setUser(null)
    setPlaylists([])
    setSelectedPlaylist(null)
    setCurrentlyPlaying(null)
    setIsLoginModalOpen(true) // Show login modal after logout
  }

  // Function to close login modal - will only work if authenticated
  const handleCloseLoginModal = () => {
    if (isAuthenticated) {
      setIsLoginModalOpen(false)
    }
  }

  return (
    <div className="h-screen bg-[#1a1a1a] text-white overflow-hidden">
      <div className={`flex h-full ${isLoginModalOpen ? "blur-sm" : ""}`}>
        <Sidebar />

        <main className="flex-1 overflow-hidden">
          <div className="px-6 py-4">
            <header className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="text-white">
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button variant="ghost" size="icon" className="text-white">
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </div>

              {isAuthenticated ? (
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    className="bg-[#00FFFF] text-black border-0 hover:bg-[#00FFFF]/80"
                    onClick={() => setIsCreatePlaylistModalOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Playlist
                  </Button>
                  <Button
                    variant="outline"
                    className="bg-white/10 text-white border-0 hover:bg-white/20"
                    onClick={handleLogout}
                  >
                    Logout
                  </Button>
                </div>
              ) : (
                <Button onClick={() => setIsLoginModalOpen(true)} className="bg-white text-black hover:bg-white/90">
                  Login with Spotify
                </Button>
              )}
            </header>

            <ScrollArea className="h-[calc(100vh-8rem)]">
              {isAuthenticated && (
                <div className="space-y-8 pb-8">
                  <section>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-2xl font-bold">New For You</h2>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" className="text-white">
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-white">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {playlists.slice(0, 4).map((playlist) => (
                        <PlaylistCard
                          key={playlist.id}
                          playlist={playlist}
                          onClick={() => handlePlaylistSelect(playlist)}
                          isSelected={selectedPlaylist?.id === playlist.id}
                          label="NEW FOR YOU"
                        />
                      ))}
                    </div>
                  </section>

                  <section>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-2xl font-bold">Recently Played</h2>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" className="text-white">
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-white">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {recentPlaylists.map((playlist) => (
                        <PlaylistCard
                          key={playlist.id}
                          playlist={playlist}
                          onClick={() => handlePlaylistSelect(playlist)}
                          isSelected={selectedPlaylist?.id === playlist.id}
                        />
                      ))}
                    </div>
                  </section>

                  <section>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-2xl font-bold">Made For You</h2>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" className="text-white">
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-white">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {playlists.slice(-4).map((playlist) => (
                        <PlaylistCard
                          key={playlist.id}
                          playlist={playlist}
                          onClick={() => handlePlaylistSelect(playlist)}
                          isSelected={selectedPlaylist?.id === playlist.id}
                          label="BASED ON YOUR LIKES"
                        />
                      ))}
                    </div>
                  </section>
                </div>
              )}
            </ScrollArea>
          </div>
        </main>
      </div>

      {selectedPlaylist && (
        <div
          className={`fixed bottom-0 left-0 right-0 h-20 bg-[#282828] border-t border-white/10 ${isLoginModalOpen ? "blur-sm" : ""}`}
        >
          <MusicPlayer playlistId={selectedPlaylist.id} accessToken={accessToken} onTrackPlay={setCurrentlyPlaying} />
        </div>
      )}

      <LoginModal isOpen={isLoginModalOpen} onClose={handleCloseLoginModal} />

      <CreatePlaylistModal
        isOpen={isCreatePlaylistModalOpen}
        onClose={() => setIsCreatePlaylistModalOpen(false)}
        accessToken={accessToken}
        userId={user?.id}
        existingPlaylists={playlists}
        onPlaylistCreated={(newPlaylist) => {
          setPlaylists([newPlaylist, ...playlists])
          setSelectedPlaylist(newPlaylist)
        }}
      />
    </div>
  )
}

