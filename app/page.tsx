"use client"

import { useState, useEffect, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Plus, ChevronLeft, ChevronRight } from "lucide-react"
import { getSpotifyToken, getUserProfile, getUserPlaylists } from "@/lib/spotify"
import { Toaster } from "@/components/ui/toaster"
import LoginModal from "@/components/login-modal"
import CreatePlaylistModal from "@/components/create-playlist-modal"
import PlaylistCard from "@/components/playlist-card"
import MusicPlayer from "@/components/music-player"
import Sidebar from "@/components/sidebar"
import PlaylistView from "@/components/playlist-view"
import UserProfileButton from "@/components/user-profile-button"
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
  const [isPlaying, setIsPlaying] = useState(false)
  const [showPlaylistView, setShowPlaylistView] = useState(false)

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
            setIsLoginModalOpen(false)

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
      setIsLoginModalOpen(false)

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
          localStorage.removeItem("spotify_access_token")
          localStorage.removeItem("spotify_refresh_token")
          localStorage.removeItem("spotify_token_expiry")
          setIsAuthenticated(false)
          setAccessToken(null)
          setIsLoginModalOpen(true)
        } finally {
          setIsLoading(false)
        }
      }

      loadUserData()
    } else if (code) {
      handleAuth()
    } else {
      setIsLoginModalOpen(true)
    }
  }, [code])

  // Categorize playlists
  const recentPlaylists = playlists.slice(0, 5)
  const oldPlaylists = playlists.slice(Math.max(0, playlists.length - 5))

  const handlePlaylistSelect = (playlist: Playlist) => {
    setSelectedPlaylist(playlist)
    setShowPlaylistView(true)
    // Scroll to top when selecting a playlist
    window.scrollTo(0, 0)
  }

  const handleBackToHome = () => {
    setShowPlaylistView(false)
  }

  const handleTrackPlay = (track: any) => {
    setCurrentlyPlaying(track)
    setIsPlaying(true)
  }

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  const handleNext = useCallback(() => {
    // This would be implemented with the actual Spotify SDK
    // For now, we'll just toggle the play state
    console.log("Next track")
  }, [])

  const handlePrevious = useCallback(() => {
    // This would be implemented with the actual Spotify SDK
    // For now, we'll just toggle the play state
    console.log("Previous track")
  }, [])

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
    setIsPlaying(false)
    setShowPlaylistView(false)
    setIsLoginModalOpen(true)
  }

  const handleCloseLoginModal = () => {
    if (isAuthenticated) {
      setIsLoginModalOpen(false)
    }
  }

  return (
    <div className="h-screen bg-[#1a1a1a] text-white overflow-hidden">
      <div className={`flex h-full ${isLoginModalOpen ? "blur-sm" : ""}`}>
        <Sidebar playlists={playlists} onPlaylistSelect={handlePlaylistSelect} />

        <main className="flex-1 overflow-hidden">
          <div className="h-full flex flex-col">
            <header className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white"
                  onClick={showPlaylistView ? handleBackToHome : undefined}
                >
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

                  <UserProfileButton user={user} onLogout={handleLogout} />
                </div>
              ) : (
                <Button onClick={() => setIsLoginModalOpen(true)} className="bg-white text-black hover:bg-white/90">
                  Login with Spotify
                </Button>
              )}
            </header>

            {isAuthenticated && (
              <div className="flex-1 overflow-hidden">
                {showPlaylistView && selectedPlaylist ? (
                  <PlaylistView playlist={selectedPlaylist} accessToken={accessToken} onTrackPlay={handleTrackPlay} />
                ) : (
                  <ScrollArea className="h-full">
                    <div className="space-y-8 p-6">
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
                  </ScrollArea>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {currentlyPlaying && (
        <div
          className={`fixed bottom-0 left-0 right-0 h-20 bg-[#282828] border-t border-white/10 ${
            isLoginModalOpen ? "blur-sm" : ""
          }`}
        >
          <MusicPlayer
            playlistId={selectedPlaylist?.id || ""}
            accessToken={accessToken}
            onTrackPlay={handleTrackPlay}
            currentTrack={currentlyPlaying}
            isPlaying={isPlaying}
            onPlayPause={handlePlayPause}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
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

      <Toaster />
    </div>
  )
}

