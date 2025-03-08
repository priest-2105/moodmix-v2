"use client"

import { Card, CardContent } from "@/components/ui/card"
import type { Playlist } from "@/types/spotify"

interface PlaylistGridProps {
  playlists: Playlist[]
  onSelect: (playlist: Playlist) => void
  selectedId?: string
}

export default function PlaylistGrid({ playlists, onSelect, selectedId }: PlaylistGridProps) {
  if (playlists.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No playlists found</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {playlists.map((playlist) => (
        <Card
          key={playlist.id}
          className={`cursor-pointer transition-all hover:shadow-md ${
            selectedId === playlist.id ? "ring-2 ring-primary" : ""
          }`}
          onClick={() => onSelect(playlist)}
        >
          <CardContent className="p-4">
            <div className="aspect-square mb-3 overflow-hidden rounded-md">
              <img
                src={playlist.images?.[0]?.url || "/placeholder.svg?height=200&width=200"}
                alt={playlist.name}
                className="h-full w-full object-cover transition-all hover:scale-105"
              />
            </div>
            <h3 className="font-medium line-clamp-1">{playlist.name}</h3>
            <p className="text-sm text-muted-foreground line-clamp-1">{playlist.tracks?.total || 0} tracks</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

