"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import PlaylistCard from "@/components/playlist-card"
import type { Playlist } from "@/types/spotify"

interface SearchResultsProps {
  query: string
  playlists: Playlist[]
  moods: string[]
  onPlaylistSelect: (playlist: Playlist) => void
  onMoodSelect: (mood: string) => void
  selectedPlaylistId?: string
}

export default function SearchResults({
  query,
  playlists,
  moods,
  onPlaylistSelect,
  onMoodSelect,
  selectedPlaylistId,
}: SearchResultsProps) {
  const [activeTab, setActiveTab] = useState("all")

  if (!query) return null

  const filteredPlaylists = playlists.filter((playlist) => playlist.name.toLowerCase().includes(query.toLowerCase()))

  const filteredMoods = moods.filter((mood) => mood.toLowerCase().includes(query.toLowerCase()))

  const hasResults = filteredPlaylists.length > 0 || filteredMoods.length > 0

  if (!hasResults) {
    return (
      <div className="p-8 text-center text-white/60">
        <p>No results found for "{query}"</p>
      </div>
    )
  }

  return (
    <div className="py-6">
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <div className="px-6 mb-4">
          <TabsList className="bg-white/10">
            <TabsTrigger value="all" className="data-[state=active]:bg-[#00FFFF] data-[state=active]:text-black">
              All
            </TabsTrigger>
            <TabsTrigger value="playlists" className="data-[state=active]:bg-[#00FFFF] data-[state=active]:text-black">
              Playlists ({filteredPlaylists.length})
            </TabsTrigger>
            <TabsTrigger value="moods" className="data-[state=active]:bg-[#00FFFF] data-[state=active]:text-black">
              Moods ({filteredMoods.length})
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="all" className="mt-0">
          <ScrollArea className="h-[calc(100vh-250px)]">
            {filteredPlaylists.length > 0 && (
              <div className="px-6 mb-8">
                <h3 className="text-xl font-bold mb-4">Playlists</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredPlaylists.slice(0, 4).map((playlist) => (
                    <PlaylistCard
                      key={playlist.id}
                      playlist={playlist}
                      onClick={() => onPlaylistSelect(playlist)}
                      isSelected={selectedPlaylistId === playlist.id}
                    />
                  ))}
                </div>
              </div>
            )}

            {filteredMoods.length > 0 && (
              <div className="px-6">
                <h3 className="text-xl font-bold mb-4">Moods</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {filteredMoods.map((mood) => (
                    <div
                      key={mood}
                      className="bg-white/10 hover:bg-white/20 rounded-lg p-4 cursor-pointer transition-colors"
                      onClick={() => onMoodSelect(mood)}
                    >
                      <p className="text-center font-medium">{mood}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="playlists" className="mt-0">
          <ScrollArea className="h-[calc(100vh-250px)]">
            <div className="px-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredPlaylists.map((playlist) => (
                  <PlaylistCard
                    key={playlist.id}
                    playlist={playlist}
                    onClick={() => onPlaylistSelect(playlist)}
                    isSelected={selectedPlaylistId === playlist.id}
                  />
                ))}
              </div>
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="moods" className="mt-0">
          <ScrollArea className="h-[calc(100vh-250px)]">
            <div className="px-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {filteredMoods.map((mood) => (
                  <div
                    key={mood}
                    className="bg-white/10 hover:bg-white/20 rounded-lg p-4 cursor-pointer transition-colors"
                    onClick={() => onMoodSelect(mood)}
                  >
                    <p className="text-center font-medium">{mood}</p>
                  </div>
                ))}
              </div>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  )
}

