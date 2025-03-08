"use client"

import { cn } from "@/lib/utils"
import { Play } from "lucide-react"
import type { Playlist } from "@/types/spotify"

interface PlaylistCardProps {
  playlist: Playlist
  onClick: () => void
  isSelected?: boolean
  label?: string
}

export default function PlaylistCard({ playlist, onClick, isSelected, label }: PlaylistCardProps) {
  return (
    <div
      className={cn(
        "group relative aspect-square overflow-hidden rounded-md cursor-pointer transition-all hover:scale-[1.02]",
        isSelected && "ring-2 ring-[#00FFFF]",
      )}
      onClick={onClick}
    >
      <img
        src={playlist.images?.[0]?.url || "/placeholder.svg?height=400&width=400"}
        alt={playlist.name}
        className="object-cover w-full h-full"
      />
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="absolute bottom-0 left-0 right-0 p-4">
        {label && (
          <span className="inline-block px-2 py-1 mb-2 text-xs font-medium bg-[#00FFFF] text-black rounded">
            {label}
          </span>
        )}
        <h3 className="text-lg font-bold text-white line-clamp-1">{playlist.name}</h3>
        <p className="text-sm text-white/70 line-clamp-2">
          {playlist.description || `By ${playlist.owner.display_name}`}
        </p>
      </div>
      <button
        className="absolute right-4 bottom-4 h-10 w-10 rounded-full bg-[#00FFFF] text-black opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
        onClick={(e) => {
          e.stopPropagation()
          onClick()
        }}
      >
        <Play className="h-5 w-5" />
      </button>
    </div>
  )
}

