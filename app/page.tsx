"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Plus, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { getSpotifyToken, getUserProfile, getUserPlaylists, getRecentlyPlayedTracks } from "@/lib/spotify"
import { Toaster } from "@/components/ui/toaster"
import LoginModal from "@/components/login-modal"
import CreatePlaylistModal from "@/components/create-playlist-modal"
import PlaylistCard from "@/components/playlist-card"
import MusicPlayer from "@/components/music-player"
import Sidebar from "@/components/sidebar"
import PlaylistView from "@/components/playlist-view"
import UserProfileButton from "@/components/user-profile-button"
import ContentModal from "@/components/content-modal"
import type { Playlist, SpotifyUser } from "@/types/spotify"
import { saveUserPreferences } from "@/lib/supabase/user"
import { createClient } from "@/lib/supabase/client"
import { useNavigationHistory } from "@/hooks/use-navigation-history"
import SearchBar from "@/components/search-bar"
import SearchResults from "@/components/search-results"
import { toast } from "@/components/ui/use-toast"
import { getUserMoods } from "@/lib/supabase/moods"

// Dummy data for mood types
const moodTypes = [
  { id: "happy", name: "Happy" },
  { id: "sad", name: "Sad" },
  { id: "energetic", name: "Energetic" },
  { id: "relaxed", name: "Relaxed" },
  // Add more mood types as needed
]

// Dummy function to get mood image URL
const getMoodImageUrl = (moodType: string) => {
  // Replace with your actual logic to fetch mood image URLs
  return `/images/moods/${moodType}.svg`
}

export default function Home() {
  const searchParams = useSearchParams()
  const code = searchParams.get("code")
  const searchInputRef = useRef<HTMLInputElement>(null)

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [isCreatePlaylistModalOpen, setIsCreatePlaylistModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingPlaylists, setIsLoadingPlaylists] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [user, setUser] = useState<SpotifyUser | null>(null)
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null)
  const [currentlyPlaying, setCurrentlyPlaying] = useState<any>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showPlaylistView, setShowPlaylistView] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)

  // Modal states
  const [isMoodsModalOpen, setIsMoodsModalOpen] = useState(false)
  const [isArtistsModalOpen, setIsArtistsModalOpen] = useState(false)
  const [isAlbumsModalOpen, setIsAlbumsModalOpen] = useState(false)
  const [isRadioModalOpen, setIsRadioModalOpen] = useState(false)

  // Content data
  const [moods, setMoods] = useState<any[]>([])
  const [artists, setArtists] = useState<any[]>([])
  const [albums, setAlbums] = useState<any[]>([])
  const [podcasts, setPodcasts] = useState<any[]>([])
  const [isLoadingContent, setIsLoadingContent] = useState(false)

  const [availableMoods] = useState([
    "Happy",
    "Sad",
    "Energetic",
    "Relaxed",
    "Focused",
    "Workout",
    "Party",
    "Chill",
    "Study",
    "Sleep",
    "Morning",
    "Evening",
    "Commute",
    "Travel",
    "Romantic",
  ])
  const navigation = useNavigationHistory({ type: "home" })

  // Add a state for player state
  const [playerState, setPlayerState] = useState<any>(null)

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
            localStorage.setItem("spotify_refresh_token", tokenResponse.refresh_token || "")
            localStorage.setItem("spotify_token_expiry", (Date.now() + tokenResponse.expires_in * 1000).toString())
            setIsAuthenticated(true)
            setIsLoginModalOpen(false)

            // Get user profile
            const userProfile = await getUserProfile(tokenResponse.access_token)
            setUser(userProfile)

            // Check if the user ID is a valid UUID before saving to Supabase
            const isValidUUID = (uuid) => {
              const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
              return uuidRegex.test(uuid)
            }

            if (userProfile && userProfile.id && isValidUUID(userProfile.id)) {
              // Save minimal user data to Supabase
              try {
                const supabase = createClient()
                // Only store non-sensitive information
                await saveUserPreferences(supabase, userProfile.id, {
                  last_login: new Date().toISOString(),
                  display_name: userProfile.display_name,
                  email: userProfile.email,
                  // We don't store tokens or passwords
                })
                console.log("Saved basic user profile to Supabase")
              } catch (supabaseError) {
                console.error("Supabase error:", supabaseError)
                // Continue even if Supabase fails - this is optional functionality
              }
            } else {
              console.error("Invalid user ID format from Spotify:", userProfile?.id)
              toast({
                title: "Warning",
                description: "Your user ID format is not compatible with our database. Some features may be limited.",
                variant: "destructive",
              })
            }

            // Load user playlists
            try {
              setIsLoadingPlaylists(true)
              const userPlaylists = await getUserPlaylists(tokenResponse.access_token)
              setPlaylists(userPlaylists)
            } catch (playlistsError) {
              console.error("Error loading playlists:", playlistsError)
              toast({
                title: "Error loading playlists",
                description: "We couldn't load your playlists. Some features may be limited.",
                variant: "destructive",
              })
            } finally {
              setIsLoadingPlaylists(false)
            }
          }
        } catch (error) {
          console.error("Authentication error:", error)
          toast({
            title: "Authentication Failed",
            description: error instanceof Error ? error.message : "An unknown error occurred",
            variant: "destructive",
          })
          setIsLoginModalOpen(true)
        } finally {
          setIsLoading(false)
          // Don't modify history if we're on the callback page
          if (window.location.pathname !== "/callback") {
            window.history.replaceState({}, document.title, window.location.pathname)
          }
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
        setIsLoadingPlaylists(true)
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
          setIsLoadingPlaylists(false)
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
    setIsSearching(false)
    navigation.navigate({ type: "playlist", id: playlist.id, data: playlist })
    // Scroll to top when selecting a playlist
    window.scrollTo(0, 0)
  }

  const handleMoodSelect = (mood: string) => {
    // In a real app, you would filter playlists by mood
    // For now, we'll just show a toast notification
    toast({
      title: `${mood} Mood Selected`,
      description: `Showing playlists with ${mood.toLowerCase()} mood`,
    })
    navigation.navigate({ type: "mood", id: mood })
    setIsSearching(false)
  }

  const handleBackToHome = () => {
    setShowPlaylistView(false)
    setIsSearching(false)
    navigation.navigate({ type: "home" })
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

  // Add a function to handle player state changes
  const handlePlayerStateChange = useCallback((state: any) => {
    setPlayerState(state)
  }, [])

  // Function to load recent artists, albums, and podcasts
  const loadRecentContent = async (type: "artists" | "albums" | "podcasts") => {
    if (!accessToken) return

    setIsLoadingContent(true)
    try {
      // Try to get recently played tracks, but handle errors gracefully
      let recentlyPlayed
      try {
        recentlyPlayed = await getRecentlyPlayedTracks(accessToken)
      } catch (error) {
        console.error(`Error loading ${type}:`, error)
        // Continue with fallback data
        recentlyPlayed = { items: [] }
      }

      if (type === "artists") {
        // If we have recently played tracks, extract artists
        if (recentlyPlayed.items && recentlyPlayed.items.length > 0) {
          const uniqueArtists = Array.from(
            new Map(
              recentlyPlayed.items
                .flatMap((item) => item.track.artists)
                .map((artist) => [
                  artist.id,
                  {
                    id: artist.id,
                    name: artist.name,
                    imageUrl: "/placeholder.svg?height=200&width=200",
                    type: "artist",
                  },
                ]),
            ).values(),
          )
          setArtists(uniqueArtists.slice(0, 10))
        } else {
          // Fallback: Provide sample artists
          setArtists([
            {
              id: "sample-1",
              name: "The Weeknd",
              imageUrl: "/placeholder.svg?height=200&width=200",
              type: "artist",
            },
            {
              id: "sample-2",
              name: "Dua Lipa",
              imageUrl: "/placeholder.svg?height=200&width=200",
              type: "artist",
            },
            {
              id: "sample-3",
              name: "Billie Eilish",
              imageUrl: "/placeholder.svg?height=200&width=200",
              type: "artist",
            },
            {
              id: "sample-4",
              name: "Drake",
              imageUrl: "/placeholder.svg?height=200&width=200",
              type: "artist",
            },
          ])
        }
      } else if (type === "albums") {
        // If we have recently played tracks, extract albums
        if (recentlyPlayed.items && recentlyPlayed.items.length > 0) {
          const uniqueAlbums = Array.from(
            new Map(
              recentlyPlayed.items.map((item) => [
                item.track.album.id,
                {
                  id: item.track.album.id,
                  name: item.track.album.name,
                  imageUrl: item.track.album.images?.[0]?.url || "/placeholder.svg?height=200&width=200",
                  description: item.track.artists.map((a) => a.name).join(", "),
                  type: "album",
                },
              ]),
            ).values(),
          )
          setAlbums(uniqueAlbums.slice(0, 10))
        } else {
          // Fallback: Provide sample albums
          setAlbums([
            {
              id: "sample-album-1",
              name: "After Hours",
              imageUrl: "/placeholder.svg?height=200&width=200",
              description: "The Weeknd",
              type: "album",
            },
            {
              id: "sample-album-2",
              name: "Future Nostalgia",
              imageUrl: "/placeholder.svg?height=200&width=200",
              description: "Dua Lipa",
              type: "album",
            },
            {
              id: "sample-album-3",
              name: "Happier Than Ever",
              imageUrl: "/placeholder.svg?height=200&width=200",
              description: "Billie Eilish",
              type: "album",
            },
          ])
        }
      } else if (type === "podcasts") {
        // For podcasts, we'll use placeholder data
        setPodcasts([
          {
            id: "podcast-1",
            name: "Music Decoded",
            imageUrl: "/placeholder.svg?height=200&width=200",
            description: "Exploring the science behind your favorite songs",
            type: "podcast",
          },
          {
            id: "podcast-2",
            name: "Artist Interviews",
            imageUrl: "/placeholder.svg?height=200&width=200",
            description: "Conversations with top musicians",
            type: "podcast",
          },
          {
            id: "podcast-3",
            name: "Music History",
            imageUrl: "/placeholder.svg?height=200&width=200",
            description: "The evolution of modern music",
            type: "podcast",
          },
        ])
      }
    } catch (error) {
      console.error(`Error in loadRecentContent for ${type}:`, error)
      toast({
        title: `Error Loading ${type}`,
        description: `We couldn't load your recent ${type}. Using sample data instead.`,
        variant: "destructive",
      })

      // Set fallback data based on type
      if (type === "artists") {
        setArtists([
          {
            id: "sample-1",
            name: "The Weeknd",
            imageUrl: "/placeholder.svg?height=200&width=200",
            type: "artist",
          },
          {
            id: "sample-2",
            name: "Dua Lipa",
            imageUrl: "/placeholder.svg?height=200&width=200",
            type: "artist",
          },
        ])
      } else if (type === "albums") {
        setAlbums([
          {
            id: "sample-album-1",
            name: "After Hours",
            imageUrl: "/placeholder.svg?height=200&width=200",
            description: "The Weeknd",
            type: "album",
          },
          {
            id: "sample-album-2",
            name: "Future Nostalgia",
            imageUrl: "/placeholder.svg?height=200&width=200",
            description: "Dua Lipa",
            type: "album",
          },
        ])
      } else if (type === "podcasts") {
        setPodcasts([
          {
            id: "podcast-1",
            name: "Music Decoded",
            imageUrl: "/placeholder.svg?height=200&width=200",
            description: "Exploring the science behind your favorite songs",
            type: "podcast",
          },
          {
            id: "podcast-2",
            name: "Artist Interviews",
            imageUrl: "/placeholder.svg?height=200&width=200",
            description: "Conversations with top musicians",
            type: "podcast",
          },
        ])
      }
    } finally {
      setIsLoadingContent(false)
    }
  }

  // Function to handle sidebar search click
  const handleSidebarSearchClick = () => {
    // Focus the search input in the header
    if (searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }

  // Function to handle sidebar moods click
  const handleSidebarMoodsClick = () => {
    setIsMoodsModalOpen(true)

    // Load user moods from Supabase
    const loadUserMoods = async () => {
      if (!user?.id) return

      setIsLoadingContent(true)
      try {
        const userMoods = await getUserMoods(user.id)

        // Transform the data for the ContentModal
        const moodItems = userMoods.map((mood) => ({
          id: mood.id,
          name: mood.name,
          imageUrl: mood.image_url || getMoodImageUrl(mood.mood_type),
          description: mood.description || `${moodTypes.find((m) => m.id === mood.mood_type)?.name || "Custom"} mood`,
          type: "mood",
        }))

        setMoods(moodItems)
      } catch (error) {
        console.error("Error loading moods:", error)
        toast({
          title: "Error Loading Moods",
          description: "We couldn't load your moods. Please try again.",
          variant: "destructive",
        })
        setMoods([])
      } finally {
        setIsLoadingContent(false)
      }
    }

    loadUserMoods()
  }

  // Function to handle sidebar artists click
  const handleSidebarArtistsClick = () => {
    setIsArtistsModalOpen(true)
    loadRecentContent("artists")
  }

  // Function to handle sidebar albums click
  const handleSidebarAlbumsClick = () => {
    setIsAlbumsModalOpen(true)
    loadRecentContent("albums")
  }

  // Function to handle sidebar radio click
  const handleSidebarRadioClick = () => {
    setIsRadioModalOpen(true)
    loadRecentContent("podcasts")
  }

  return (
    <div className="h-screen bg-[#1a1a1a] text-white overflow-hidden">
      <div className={`flex h-full ${isLoginModalOpen ? "blur-sm" : ""}`}>
        <Sidebar
          playlists={playlists}
          onPlaylistSelect={handlePlaylistSelect}
          onMoodsClick={handleSidebarMoodsClick}
          onSearchClick={handleSidebarSearchClick}
          onArtistsClick={handleSidebarArtistsClick}
          onAlbumsClick={handleSidebarAlbumsClick}
          onRadioClick={handleSidebarRadioClick}
          isLoadingPlaylists={isLoadingPlaylists}
        />

        <main className="flex-1 overflow-hidden">
          <div className="h-full flex flex-col">
            <header className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white"
                  onClick={() => {
                    const prevState = navigation.back()
                    if (prevState.type === "home") {
                      setShowPlaylistView(false)
                      setIsSearching(false)
                    } else if (prevState.type === "playlist" && prevState.data) {
                      setSelectedPlaylist(prevState.data)
                      setShowPlaylistView(true)
                      setIsSearching(false)
                    } else if (prevState.type === "search") {
                      setIsSearching(true)
                      setShowPlaylistView(false)
                      setSearchQuery(prevState.id || "")
                    }
                  }}
                  disabled={!navigation.canGoBack}
                >
                  <ChevronLeft className={`h-6 w-6 ${!navigation.canGoBack ? "opacity-50" : ""}`} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white"
                  onClick={() => {
                    const nextState = navigation.forward()
                    if (nextState.type === "home") {
                      setShowPlaylistView(false)
                      setIsSearching(false)
                    } else if (nextState.type === "playlist" && nextState.data) {
                      setSelectedPlaylist(nextState.data)
                      setShowPlaylistView(true)
                      setIsSearching(false)
                    } else if (nextState.type === "search") {
                      setIsSearching(true)
                      setShowPlaylistView(false)
                      setSearchQuery(nextState.id || "")
                    }
                  }}
                  disabled={!navigation.canGoForward}
                >
                  <ChevronRight className={`h-6 w-6 ${!navigation.canGoForward ? "opacity-50" : ""}`} />
                </Button>

                {isAuthenticated && (
                  <div className="ml-4 w-64">
                    <SearchBar
                      ref={searchInputRef}
                      onSearch={(query) => {
                        setSearchQuery(query)
                        if (query) {
                          setIsSearching(true)
                          if (navigation.current.type !== "search" || navigation.current.id !== query) {
                            navigation.navigate({ type: "search", id: query })
                          }
                        } else {
                          setIsSearching(false)
                        }
                      }}
                      placeholder="Search playlists and moods..."
                    />
                  </div>
                )}
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
                {isSearching ? (
                  <SearchResults
                    query={searchQuery}
                    playlists={playlists}
                    moods={availableMoods}
                    onPlaylistSelect={handlePlaylistSelect}
                    onMoodSelect={handleMoodSelect}
                    selectedPlaylistId={selectedPlaylist?.id}
                  />
                ) : showPlaylistView && selectedPlaylist ? (
                  <PlaylistView
                    playlist={selectedPlaylist}
                    accessToken={accessToken}
                    onTrackPlay={handleTrackPlay}
                    onPlayerStateChange={handlePlayerStateChange}
                  />
                ) : isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="flex flex-col items-center">
                      <Loader2 className="h-12 w-12 text-[#00FFFF] animate-spin mb-4" />
                      <p className="text-white/70">Loading your music...</p>
                    </div>
                  </div>
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
            playerState={playerState}
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
        onMoodCreated={(newMood) => {
          // Add the new mood to the moods array
          setMoods((prevMoods) => [
            {
              id: newMood.id,
              name: newMood.name,
              imageUrl: newMood.image_url,
              description: newMood.description,
              type: "mood",
            },
            ...prevMoods,
          ])

          toast({
            title: "Mood Created",
            description: `Your "${newMood.name}" mood has been created successfully.`,
          })
        }}
      />

      {/* Content Modals */}
      <ContentModal
        isOpen={isMoodsModalOpen}
        onClose={() => setIsMoodsModalOpen(false)}
        title="Your Moods"
        type="moods"
        items={moods}
        isLoading={isLoadingContent}
        onItemClick={(item) => {
          // Handle mood click
          setIsMoodsModalOpen(false)
          handleMoodSelect(item.name)
        }}
        onCreateClick={() => {
          setIsMoodsModalOpen(false)
          setIsCreatePlaylistModalOpen(true)
        }}
      />

      <ContentModal
        isOpen={isArtistsModalOpen}
        onClose={() => setIsArtistsModalOpen(false)}
        title="Recent Artists"
        type="artists"
        items={artists}
        isLoading={isLoadingContent}
        onItemClick={(item) => {
          // Handle artist click
          setIsArtistsModalOpen(false)
          toast({
            title: "Artist Selected",
            description: `You selected ${item.name}`,
          })
        }}
      />

      <ContentModal
        isOpen={isAlbumsModalOpen}
        onClose={() => setIsAlbumsModalOpen(false)}
        title="Recent Albums"
        type="albums"
        items={albums}
        isLoading={isLoadingContent}
        onItemClick={(item) => {
          // Handle album click
          setIsAlbumsModalOpen(false)
          toast({
            title: "Album Selected",
            description: `You selected ${item.name}`,
          })
        }}
      />

      <ContentModal
        isOpen={isRadioModalOpen}
        onClose={() => setIsRadioModalOpen(false)}
        title="Podcasts"
        type="podcasts"
        items={podcasts}
        isLoading={isLoadingContent}
        onItemClick={(item) => {
          // Handle podcast click
          setIsRadioModalOpen(false)
          toast({
            title: "Podcast Selected",
            description: `You selected ${item.name}`,
          })
        }}
      />

      <Toaster />
    </div>
  )
}

