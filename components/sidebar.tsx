"use client"

import { useState, useEffect } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Home, Search, Music2, Radio, User2, Disc3, X } from "lucide-react"
import type { Playlist } from "@/types/spotify"
import { cn } from "@/lib/utils"
import { useMobile } from "@/hooks/use-mobile"

interface SidebarProps {
  playlists?: Playlist[]
  onPlaylistSelect?: (playlist: Playlist) => void
  onMoodsClick?: () => void
  onSearchClick?: () => void
  onArtistsClick?: () => void
  onAlbumsClick?: () => void
  onRadioClick?: () => void
  isLoadingPlaylists?: boolean
  isOpen?: boolean
  onToggle?: () => void
}

export default function Sidebar({
  playlists = [],
  onPlaylistSelect,
  onMoodsClick,
  onSearchClick,
  onArtistsClick,
  onAlbumsClick,
  onRadioClick,
  isLoadingPlaylists = false,
  isOpen = true,
  onToggle,
}: SidebarProps) {
  const [showAllPlaylists, setShowAllPlaylists] = useState(false)
  const isMobile = useMobile(1024) // Use 1024px as breakpoint for tablets
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile)

  // Update sidebar state when isOpen prop changes
  useEffect(() => {
    setIsSidebarOpen(isMobile ? isOpen : true)
  }, [isOpen, isMobile])

  // Update sidebar state when screen size changes
  useEffect(() => {
    setIsSidebarOpen(!isMobile)
  }, [isMobile])

  const handlePlaylistClick = (playlist: Playlist) => {
    if (onPlaylistSelect) {
      onPlaylistSelect(playlist)
      // Close sidebar on mobile after selection
      if (isMobile && onToggle) {
        onToggle()
      }
    }
  }

  const handleNavClick = (callback?: () => void) => {
    if (callback) {
      callback()
      // Close sidebar on mobile after navigation
      if (isMobile && onToggle) {
        onToggle()
      }
    }
  }

  const displayedPlaylists = showAllPlaylists ? playlists : playlists.slice(0, 5)

  // If sidebar is closed on mobile, don't render the content
  if (isMobile && !isSidebarOpen) {
    return null
  }

  return (
    <div
      className={cn(
        "bg-black flex flex-col h-full transition-all duration-300 z-20",
        isMobile ? "fixed left-0 top-0 bottom-0 w-64" : "w-60",
      )}
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
          <img src="logo.png" alt="Moodmix" height={50} width={50} />
            {/* <Music2 className="h-8 w-8" /> */}
            {/* <span className="text-xl font-bold">Moodmix</span> */}
          </div>
          {isMobile && (
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={onToggle}>
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>

        <div className="space-y-1">
          <Button
            variant="ghost"
            size="lg"
            className="w-full justify-start text-white hover:bg-white/10 bg-[#00FFFF]/10 border-l-4 border-[#00FFFF]"
            onClick={() => handleNavClick()}
          >
            <Home className="mr-3 h-5 w-5 text-[#00FFFF]" />
            Home
          </Button>
          <Button
            variant="ghost"
            size="lg"
            className="w-full justify-start text-white hover:bg-white/10"
            onClick={() => handleNavClick(onSearchClick)}
          >
            <Search className="mr-3 h-5 w-5" />
            Search
          </Button>
          <Button
            variant="ghost"
            size="lg"
            className="w-full justify-start text-white hover:bg-white/10"
            onClick={() => handleNavClick(onMoodsClick)}
          >
            <Radio className="mr-3 h-5 w-5" />
            Your Moods
          </Button>
        </div>

        <div className="mt-8 space-y-4">
          <div className="px-3">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold tracking-tight">Your Playlists</h2>
              <Button
                variant="ghost"
                size="sm"
                className="p-0 h-auto text-gray-400 hover:text-white"
                onClick={() => setShowAllPlaylists(!showAllPlaylists)}
              >
                {showAllPlaylists ? "Show Less" : "See All"}
              </Button>
            </div>
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-1">
                {isLoadingPlaylists ? (
                  <div className="py-4 flex flex-col gap-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="flex items-center gap-2 animate-pulse">
                        <div className="h-8 w-8 rounded bg-white/10"></div>
                        <div className="h-4 w-32 bg-white/10 rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : displayedPlaylists.length > 0 ? (
                  displayedPlaylists.map((playlist) => (
                    <Button
                      key={playlist.id}
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start font-normal text-white/70 hover:text-white hover:bg-white/10"
                      onClick={() => handlePlaylistClick(playlist)}
                    >
                      <div className="flex items-center w-full overflow-hidden">
                        {playlist.images && playlist.images[0] && (
                          <img
                            src={playlist.images[0].url || "/placeholder.svg"}
                            alt={playlist.name}
                            className="h-8 w-8 rounded mr-2 flex-shrink-0"
                          />
                        )}
                        <span className="truncate">{playlist.name}</span>
                      </div>
                    </Button>
                  ))
                ) : (
                  <div className="text-sm text-gray-400 py-2">No playlists found</div>
                )}
              </div>
            </ScrollArea>
          </div>

          <div className="px-3">
            <h2 className="mb-2 text-lg font-semibold tracking-tight">Discover</h2>
            <div className="space-y-1">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-white/70 hover:text-white hover:bg-white/10"
                onClick={() => handleNavClick(onRadioClick)}
              >
                <Radio className="mr-3 h-4 w-4" />
                Radio
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-white/70 hover:text-white hover:bg-white/10"
                onClick={() => handleNavClick(onArtistsClick)}
              >
                <User2 className="mr-3 h-4 w-4" />
                Artists
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-white/70 hover:text-white hover:bg-white/10"
                onClick={() => handleNavClick(onAlbumsClick)}
              >
                <Disc3 className="mr-3 h-4 w-4" />
                Albums
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

