"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Plus, ChevronLeft, ChevronRight, Loader2, Play, Menu } from "lucide-react"
import { getSpotifyToken, getUserProfile, getUserPlaylists, getRecentlyPlayedTracks } from "@/lib/spotify"
import { Toaster } from "@/components/ui/toaster"
import LoginModal from "@/components/login-modal"
import CreatePlaylistModal from "@/components/create-playlist-modal"
import PlaylistCard from "@/components/playlist-card"
import MusicPlayer from "@/components/music-player"
import Sidebar from "@/components/sidebar"
import PlaylistView from "@/components/playlist-view"
import MoodView from "@/components/mood-view"
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
import SpotifyWebPlayer from "@/components/spotify-web-player"
import { useMobile } from "@/hooks/use-mobile"

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
  const isMobile = useMobile(1024) // Use 1024px as breakpoint for tablets

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [isCreatePlaylistModalOpen, setIsCreatePlaylistModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingPlaylists, setIsLoadingPlaylists] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [user, setUser] = useState<SpotifyUser | null>(null)
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null)
  const [selectedMood, setSelectedMood] = useState<any | null>(null)
  const [currentlyPlaying, setCurrentlyPlaying] = useState<any>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showPlaylistView, setShowPlaylistView] = useState(false)
  const [showMoodView, setShowMoodView] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

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

  // Add a ref to access the SpotifyWebPlayer methods
  const spotifyPlayerRef = useRef<any>(null)

  // Toggle sidebar function
  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => !prev)
  }, [])

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
            if (userProfile && userProfile.id) {
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
            }

            // Load user playlists
            try {
              setIsLoadingPlaylists(true)
              const userPlaylists = await getUserPlaylists(tokenResponse.access_token)
              console.log(`Loaded ${userPlaylists.length} playlists from Spotify`)
              setPlaylists(userPlaylists)

              // If we didn't get any playlists, show a message
              if (userPlaylists.length === 0) {
                toast({
                  title: "No playlists found",
                  description: "We couldn't find any playlists in your Spotify account.",
                  variant: "default",
                })
              }
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
    setSelectedMood(null)
    setShowPlaylistView(true)
    setShowMoodView(false)
    setIsSearching(false)
    navigation.navigate({ type: "playlist", id: playlist.id, data: playlist })
    // Scroll to top when selecting a playlist
    window.scrollTo(0, 0)
  }

  const handleMoodSelect = (mood: any) => {
    setSelectedMood(mood)
    setSelectedPlaylist(null)
    setShowMoodView(true)
    setShowPlaylistView(false)
    setIsSearching(false)
    navigation.navigate({ type: "mood", id: mood.id, data: mood })
    // Scroll to top when selecting a mood
    window.scrollTo(0, 0)
  }

  const handleBackToHome = () => {
    setShowPlaylistView(false)
    setShowMoodView(false)
    setIsSearching(false)
    navigation.navigate({ type: "home" })
  }

  const handleTrackPlay = (track: any) => {
    setCurrentlyPlaying(track)
    setIsPlaying(true)
  }

  // Update the handlePlayerStateChange function to store the player reference
  const handlePlayerStateChange = useCallback(
    (state: any, playerInstance: any) => {
      setPlayerState(state)

      // Store the player instance reference if provided
      if (playerInstance && spotifyPlayerRef.current !== playerInstance) {
        spotifyPlayerRef.current = playerInstance
      }

      // Sync the UI play state with the actual Spotify player state
      // Only update if there's a mismatch to avoid loops
      if (state && state.paused !== undefined && isPlaying !== !state.paused) {
        console.log("Syncing play state from Spotify:", !state.paused)
        setIsPlaying(!state.paused)
      }

      // If we're in a playlist or mood view, let those components handle the state
      // This prevents unexpected pauses when navigating between tracks
      if (showPlaylistView || showMoodView) {
        return
      }

      // If we're on the home page, update the currently playing track if needed
      if (state && state.track_window && state.track_window.current_track) {
        const spotifyTrack = state.track_window.current_track

        // Only update if it's a different track
        if (!currentlyPlaying || currentlyPlaying.uri !== spotifyTrack.uri) {
          const formattedTrack = {
            id: spotifyTrack.id,
            uri: spotifyTrack.uri,
            name: spotifyTrack.name,
            artists: spotifyTrack.artists,
            album: spotifyTrack.album,
            duration_ms: state.duration,
          }
          setCurrentlyPlaying(formattedTrack)
        }
      }
    },
    [isPlaying, showPlaylistView, showMoodView, currentlyPlaying],
  )

  // Update the handlePlayPause function to use the player reference
  const handlePlayPause = useCallback(() => {
    setIsPlaying(!isPlaying)

    // If we have a player reference, use it to control playback
    if (spotifyPlayerRef.current && spotifyPlayerRef.current.player) {
      try {
        if (isPlaying) {
          spotifyPlayerRef.current.player.pause()
        } else {
          spotifyPlayerRef.current.player.resume()
        }
      } catch (error) {
        console.error("Error controlling playback:", error)
      }
    }
  }, [isPlaying])

  // Add a function to handle volume changes
  const handleVolumeChange = useCallback((volume: number) => {
    if (spotifyPlayerRef.current && spotifyPlayerRef.current.setVolume) {
      spotifyPlayerRef.current.setVolume(volume)
    }
  }, [])

  const handleNext = useCallback(() => {
    if (selectedPlaylist && showPlaylistView) {
      // Let the PlaylistView component handle next
      return
    } else if (selectedMood && showMoodView) {
      // Let the MoodView component handle next
      return
    } else if (currentlyPlaying) {
      // If we're on the home page but a track is playing, we can't navigate
      toast({
        title: "Navigation limited",
        description: "Next track navigation is only available in playlist or mood view.",
      })
    }
  }, [selectedPlaylist, showPlaylistView, selectedMood, showMoodView, currentlyPlaying])

  const handlePrevious = useCallback(() => {
    if (selectedPlaylist && showPlaylistView) {
      // Let the PlaylistView component handle previous
      return
    } else if (selectedMood && showMoodView) {
      // Let the MoodView component handle previous
      return
    } else if (currentlyPlaying) {
      // If we're on the home page but a track is playing, we can't navigate
      toast({
        title: "Navigation limited",
        description: "Previous track navigation is only available in playlist or mood view.",
      })
    }
  }, [selectedPlaylist, showPlaylistView, selectedMood, showMoodView, currentlyPlaying])

  const handleLogout = () => {
    localStorage.removeItem("spotify_access_token")
    localStorage.removeItem("spotify_refresh_token")
    localStorage.removeItem("spotify_token_expiry")
    setIsAuthenticated(false)
    setAccessToken(null)
    setUser(null)
    setPlaylists([])
    setSelectedPlaylist(null)
    setSelectedMood(null)
    setCurrentlyPlaying(null)
    setIsPlaying(false)
    setShowPlaylistView(false)
    setShowMoodView(false)
    setIsLoginModalOpen(true)
  }

  const handleCloseLoginModal = () => {
    if (isAuthenticated) {
      setIsLoginModalOpen(false)
    }
  }

  // Function to load recent artists, albums, and podcasts
  const loadRecentContent = async (type: "artists" | "albums" | "podcasts") => {
    if (!accessToken) return

    setIsLoadingContent(true)
    try {
      if (type === "artists") {
        // Fetch user's top artists
        const response = await fetch("https://api.spotify.com/v1/me/top/artists?limit=20&time_range=short_term", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch top artists: ${response.status}`)
        }

        const data = await response.json()

        if (data.items && data.items.length > 0) {
          const artistItems = data.items.map((artist: any) => ({
            id: artist.id,
            name: artist.name,
            imageUrl: artist.images?.[0]?.url || "/placeholder.svg?height=200&width=200",
            description: `${artist.followers?.total?.toLocaleString() || "0"} followers`,
            type: "artist",
          }))

          setArtists(artistItems)
          console.log(`Loaded ${artistItems.length} artists from Spotify`)
        } else {
          // Fallback to recently played tracks if no top artists
          const recentlyPlayed = await getRecentlyPlayedTracks(accessToken)

          if (recentlyPlayed.items && recentlyPlayed.items.length > 0) {
            const uniqueArtists = Array.from(
              new Map(
                recentlyPlayed.items
                  .flatMap((item: any) => item.track.artists)
                  .map((artist: any) => [
                    artist.id,
                    {
                      id: artist.id,
                      name: artist.name,
                      imageUrl: "/placeholder.svg?height=200&width=200", // Spotify doesn't provide artist images in this endpoint
                      type: "artist",
                    },
                  ]),
              ).values(),
            )
            setArtists(uniqueArtists.slice(0, 10))
          } else {
            throw new Error("No artists found")
          }
        }
      } else if (type === "albums") {
        // First try to get user's saved albums
        const savedAlbumsResponse = await fetch("https://api.spotify.com/v1/me/albums?limit=20", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })

        if (savedAlbumsResponse.ok) {
          const savedAlbumsData = await savedAlbumsResponse.json()

          if (savedAlbumsData.items && savedAlbumsData.items.length > 0) {
            const albumItems = savedAlbumsData.items.map((item: any) => ({
              id: item.album.id,
              name: item.album.name,
              imageUrl: item.album.images?.[0]?.url || "/placeholder.svg?height=200&width=200",
              description: item.album.artists.map((a: any) => a.name).join(", "),
              type: "album",
            }))

            setAlbums(albumItems)
            console.log(`Loaded ${albumItems.length} saved albums from Spotify`)
            return
          }
        }

        // Fallback to recently played tracks if no saved albums
        const recentlyPlayed = await getRecentlyPlayedTracks(accessToken)

        if (recentlyPlayed.items && recentlyPlayed.items.length > 0) {
          const uniqueAlbums = Array.from(
            new Map(
              recentlyPlayed.items.map((item: any) => [
                item.track.album.id,
                {
                  id: item.track.album.id,
                  name: item.track.album.name,
                  imageUrl: item.track.album.images?.[0]?.url || "/placeholder.svg?height=200&width=200",
                  description: item.track.artists.map((a: any) => a.name).join(", "),
                  type: "album",
                },
              ]),
            ).values(),
          )

          setAlbums(uniqueAlbums)
          console.log(`Loaded ${uniqueAlbums.length} albums from recently played tracks`)
        } else {
          throw new Error("No albums found")
        }
      } else if (type === "podcasts") {
        // Fetch user's saved shows (podcasts)
        const response = await fetch("https://api.spotify.com/v1/me/shows?limit=20", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })

        if (!response.ok) {
          // If we get a 403, it might be a permissions issue
          if (response.status === 403) {
            throw new Error(
              "You may need to re-authenticate with the 'user-library-read' scope to access your podcasts",
            )
          }
          throw new Error(`Failed to fetch podcasts: ${response.status}`)
        }

        const data = await response.json()

        if (data.items && data.items.length > 0) {
          const podcastItems = data.items.map((item: any) => ({
            id: item.show.id,
            name: item.show.name,
            imageUrl: item.show.images?.[0]?.url || "/placeholder.svg?height=200&width=200",
            description: item.show.publisher || item.show.description?.substring(0, 50) + "..." || "",
            type: "podcast",
          }))

          setPodcasts(podcastItems)
          console.log(`Loaded ${podcastItems.length} podcasts from Spotify`)
        } else {
          // Try to get featured podcasts if user has no saved shows
          const featuredResponse = await fetch("https://api.spotify.com/v1/browse/featured-playlists?limit=10", {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          })

          if (featuredResponse.ok) {
            const featuredData = await featuredResponse.json()

            if (featuredData.playlists?.items && featuredData.playlists.items.length > 0) {
              // Use featured playlists as a fallback
              const featuredItems = featuredData.playlists.items
                .filter((item: any) => item.description.toLowerCase().includes("podcast"))
                .map((item: any) => ({
                  id: item.id,
                  name: item.name,
                  imageUrl: item.images?.[0]?.url || "/placeholder.svg?height=200&width=200",
                  description: item.description || "",
                  type: "podcast",
                }))

              if (featuredItems.length > 0) {
                setPodcasts(featuredItems)
                console.log(`Loaded ${featuredItems.length} featured podcast playlists`)
                return
              }
            }
          }

          throw new Error("No podcasts found")
        }
      }
    } catch (error) {
      console.error(`Error in loadRecentContent for ${type}:`, error)
      toast({
        title: `Error Loading ${type}`,
        description: error instanceof Error ? error.message : `We couldn't load your ${type}. Please try again.`,
        variant: "destructive",
      })

      // Set minimal fallback data
      if (type === "artists") {
        setArtists([
          {
            id: "fallback-1",
            name: "No artists found",
            imageUrl: "/placeholder.svg?height=200&width=200",
            description: "Try listening to more music to see your top artists",
            type: "artist",
          },
        ])
      } else if (type === "albums") {
        setAlbums([
          {
            id: "fallback-1",
            name: "No albums found",
            imageUrl: "/placeholder.svg?height=200&width=200",
            description: "Try saving some albums to your library",
            type: "album",
          },
        ])
      } else if (type === "podcasts") {
        setPodcasts([
          {
            id: "fallback-1",
            name: "No podcasts found",
            imageUrl: "/placeholder.svg?height=200&width=200",
            description: "Try saving some podcasts to your library",
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
    // Close sidebar on mobile after search click
    if (isMobile) {
      setIsSidebarOpen(false)
    }
  }

  // Function to handle sidebar moods click
  const handleSidebarMoodsClick = () => {
    setIsMoodsModalOpen(true)
    // Close sidebar on mobile after moods click
    if (isMobile) {
      setIsSidebarOpen(false)
    }

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
          mood_type: mood.mood_type,
          created_at: mood.created_at,
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
    // Close sidebar on mobile after artists click
    if (isMobile) {
      setIsSidebarOpen(false)
    }
  }

  // Function to handle sidebar albums click
  const handleSidebarAlbumsClick = () => {
    setIsAlbumsModalOpen(true)
    loadRecentContent("albums")
    // Close sidebar on mobile after albums click
    if (isMobile) {
      setIsSidebarOpen(false)
    }
  }

  // Function to handle sidebar radio click
  const handleSidebarRadioClick = () => {
    setIsRadioModalOpen(true)
    loadRecentContent("podcasts")
    // Close sidebar on mobile after radio click
    if (isMobile) {
      setIsSidebarOpen(false)
    }
  }

  // Create an overlay for mobile sidebar
  const SidebarOverlay = () => {
    if (!isMobile || !isSidebarOpen) return null

    return <div className="fixed inset-0 bg-black/70 z-10" onClick={toggleSidebar} />
  }

  return (
    <div className="h-screen bg-[#1a1a1a] text-white overflow-hidden">
      <div className={`flex h-full ${isLoginModalOpen ? "blur-sm" : ""}`}>
        {/* Sidebar for desktop or when open on mobile */}
        <Sidebar
          playlists={playlists}
          onPlaylistSelect={handlePlaylistSelect}
          onMoodsClick={handleSidebarMoodsClick}
          onSearchClick={handleSidebarSearchClick}
          onArtistsClick={handleSidebarArtistsClick}
          onAlbumsClick={handleSidebarAlbumsClick}
          onRadioClick={handleSidebarRadioClick}
          isLoadingPlaylists={isLoadingPlaylists}
          isOpen={isSidebarOpen}
          onToggle={toggleSidebar}
        />

        {/* Overlay for mobile sidebar */}
        <SidebarOverlay />

        <main className="flex-1 overflow-hidden">
          <div className="h-full flex flex-col">
            <header className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-2">
                {/* Menu button for mobile */}
                {isMobile && (
                  <Button variant="ghost" size="icon" className="text-white mr-2" onClick={toggleSidebar}>
                    <Menu className="h-6 w-6" />
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white"
                  onClick={() => {
                    const prevState = navigation.back()
                    if (prevState.type === "home") {
                      setShowPlaylistView(false)
                      setShowMoodView(false)
                      setIsSearching(false)
                    } else if (prevState.type === "playlist" && prevState.data) {
                      setSelectedPlaylist(prevState.data)
                      setSelectedMood(null)
                      setShowPlaylistView(true)
                      setShowMoodView(false)
                      setIsSearching(false)
                    } else if (prevState.type === "mood" && prevState.data) {
                      setSelectedMood(prevState.data)
                      setSelectedPlaylist(null)
                      setShowMoodView(true)
                      setShowPlaylistView(false)
                      setIsSearching(false)
                    } else if (prevState.type === "search") {
                      setIsSearching(true)
                      setShowPlaylistView(false)
                      setShowMoodView(false)
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
                      setShowMoodView(false)
                      setIsSearching(false)
                    } else if (nextState.type === "playlist" && nextState.data) {
                      setSelectedPlaylist(nextState.data)
                      setSelectedMood(null)
                      setShowPlaylistView(true)
                      setShowMoodView(false)
                      setIsSearching(false)
                    } else if (nextState.type === "mood" && nextState.data) {
                      setSelectedMood(nextState.data)
                      setSelectedPlaylist(null)
                      setShowMoodView(true)
                      setShowPlaylistView(false)
                      setIsSearching(false)
                    } else if (nextState.type === "search") {
                      setIsSearching(true)
                      setShowPlaylistView(false)
                      setShowMoodView(false)
                      setSearchQuery(nextState.id || "")
                    }
                  }}
                  disabled={!navigation.canGoForward}
                >
                  <ChevronRight className={`h-6 w-6 ${!navigation.canGoForward ? "opacity-50" : ""}`} />
                </Button>

                {isAuthenticated && (
                  <div className={`ml-4 ${isMobile ? "w-full max-w-[200px]" : "w-64"}`}>
                    <SearchBar
                      ref={searchInputRef}
                      onSearch={(query) => {
                        setSearchQuery(query)
                        if (query) {
                          setIsSearching(true)
                          setShowPlaylistView(false)
                          setShowMoodView(false)
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
                  {!isMobile && (
                    <Button
                      variant="outline"
                      className="bg-[#00FFFF] text-black border-0 hover:bg-[#00FFFF]/80"
                      onClick={() => setIsCreatePlaylistModalOpen(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Mood
                    </Button>
                  )}

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
                    onMoodSelect={(moodName) => {
                      // Find the mood by name or create a placeholder
                      const mood = moods.find((m) => m.name.toLowerCase() === moodName.toLowerCase()) || {
                        id: `temp-${Date.now()}`,
                        name: moodName,
                        mood_type: moodName.toLowerCase(),
                        description: `${moodName} mood`,
                      }
                      handleMoodSelect(mood)
                    }}
                    selectedPlaylistId={selectedPlaylist?.id}
                  />
                ) : showPlaylistView && selectedPlaylist ? (
                  <>
                    <PlaylistView playlist={selectedPlaylist} accessToken={accessToken} onTrackPlay={handleTrackPlay} />
                    {accessToken && (
                      <SpotifyWebPlayer
                        accessToken={accessToken}
                        currentTrackUri={currentlyPlaying?.uri}
                        isPlaying={isPlaying}
                        onPlayerStateChanged={(state, player) => handlePlayerStateChange(state, player)}
                        onPlayerReady={() => console.log("Player ready in PlaylistView")}
                        onError={(error) => {
                          console.error("Player error in PlaylistView:", error)
                          toast({
                            title: "Player Error",
                            description: error,
                            variant: "destructive",
                          })
                        }}
                      />
                    )}
                  </>
                ) : showMoodView && selectedMood ? (
                  <>
                    <MoodView mood={selectedMood} accessToken={accessToken} onTrackPlay={handleTrackPlay} />
                    {accessToken && (
                      <SpotifyWebPlayer
                        accessToken={accessToken}
                        currentTrackUri={currentlyPlaying?.uri}
                        isPlaying={isPlaying}
                        onPlayerStateChanged={(state, player) => handlePlayerStateChange(state, player)}
                        onPlayerReady={() => console.log("Player ready in MoodView")}
                        onError={(error) => {
                          console.error("Player error in MoodView:", error)
                          toast({
                            title: "Player Error",
                            description: error,
                            variant: "destructive",
                          })
                        }}
                      />
                    )}
                  </>
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
                      {/* Mobile Create Mood button */}
                      {isMobile && (
                        <div className="flex justify-center mb-4">
                          <Button
                            className="bg-[#00FFFF] text-black border-0 hover:bg-[#00FFFF]/80 w-full max-w-xs"
                            onClick={() => setIsCreatePlaylistModalOpen(true)}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Create Mood
                          </Button>
                        </div>
                      )}

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

                      {moods.length > 0 && (
                        <section>
                          <div className="flex items-center justify-between mb-4">
                            <h2 className="text-2xl font-bold">Your Moods</h2>
                            <Button
                              variant="ghost"
                              className="text-white/70 hover:text-white"
                              onClick={handleSidebarMoodsClick}
                            >
                              See All
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {moods.slice(0, 4).map((mood) => (
                              <div
                                key={mood.id}
                                className="group relative aspect-square overflow-hidden rounded-md cursor-pointer transition-all hover:scale-[1.02]"
                                onClick={() => handleMoodSelect(mood)}
                              >
                                <img
                                  src={mood.imageUrl || `/placeholder.svg?height=400&width=400&text=${mood.name}`}
                                  alt={mood.name}
                                  className="object-cover w-full h-full"
                                />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="absolute bottom-0 left-0 right-0 p-4">
                                  <span className="inline-block px-2 py-1 mb-2 text-xs font-medium bg-[#00FFFF] text-black rounded">
                                    {mood.mood_type?.toUpperCase() || "MOOD"}
                                  </span>
                                  <h3 className="text-lg font-bold text-white line-clamp-1">{mood.name}</h3>
                                  <p className="text-sm text-white/70 line-clamp-2">
                                    {mood.description || `A ${mood.mood_type} mood collection`}
                                  </p>
                                </div>
                                <button
                                  className="absolute right-4 bottom-4 h-10 w-10 rounded-full bg-[#00FFFF] text-black opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleMoodSelect(mood)
                                  }}
                                >
                                  <Play className="h-5 w-5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </section>
                      )}

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
            playlistId={selectedPlaylist?.id || selectedMood?.id || ""}
            accessToken={accessToken}
            onTrackPlay={handleTrackPlay}
            currentTrack={currentlyPlaying}
            isPlaying={isPlaying}
            onPlayPause={handlePlayPause}
            onNext={handleNext}
            onPrevious={handlePrevious}
            playerState={playerState}
            onVolumeChange={handleVolumeChange}
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
              mood_type: newMood.mood_type,
              created_at: newMood.created_at,
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
          handleMoodSelect(item)
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

