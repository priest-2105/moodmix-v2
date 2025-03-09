"use client"

import { useState } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Home, Search, Music2, Radio, User2 } from "lucide-react"
import type { Playlist } from "@/types/spotify"

interface SidebarProps {
  playlists?: Playlist[]
  onPlaylistSelect?: (playlist: Playlist) => void
}

export default function Sidebar({ playlists = [], onPlaylistSelect }: SidebarProps) {
  const [showAllPlaylists, setShowAllPlaylists] = useState(false)
  const displayedPlaylists = showAllPlaylists ? playlists : playlists.slice(0, 5)

  const handlePlaylistClick = (playlist: Playlist) => {
    if (onPlaylistSelect) {
      onPlaylistSelect(playlist)
    }
  }

  return (
    <div className="w-60 bg-black flex flex-col h-full">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-8">
          <Music2 className="h-8 w-8" />
          <span className="text-xl font-bold">Moodmix</span>
        </div>

        <div className="space-y-1">
          <Button
            variant="ghost"
            size="lg"
            className="w-full justify-start text-white hover:bg-white/10 bg-[#00FFFF]/10 border-l-4 border-[#00FFFF]"
          >
            <Home className="mr-3 h-5 w-5 text-[#00FFFF]" />
            Home
          </Button>
          <Button variant="ghost" size="lg" className="w-full justify-start text-white hover:bg-white/10">
            <Search className="mr-3 h-5 w-5" />
            Search
          </Button>
          <Button variant="ghost" size="lg" className="w-full justify-start text-white hover:bg-white/10">
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
                {displayedPlaylists.map((playlist) => (
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
                ))}
                {playlists.length === 0 && <div className="text-sm text-gray-400 py-2">No playlists found</div>}
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
              >
                <Radio className="mr-3 h-4 w-4" />
                Radio
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-white/70 hover:text-white hover:bg-white/10"
              >
                <User2 className="mr-3 h-4 w-4" />
                Artists
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-white/70 hover:text-white hover:bg-white/10"
              >
                <Music2 className="mr-3 h-4 w-4" />
                Albums
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

