"use client"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Plus, User2, Disc3, Radio } from "lucide-react"

interface ContentItem {
  id: string
  name: string
  imageUrl?: string
  description?: string
  type: "mood" | "artist" | "album" | "podcast"
}

interface ContentModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  type: "moods" | "artists" | "albums" | "podcasts"
  items: ContentItem[]
  isLoading?: boolean
  onItemClick?: (item: ContentItem) => void
  onCreateClick?: () => void
}

export default function ContentModal({
  isOpen,
  onClose,
  title,
  type,
  items,
  isLoading = false,
  onItemClick,
  onCreateClick,
}: ContentModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl bg-[#121212] border-[#333] text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            {type === "moods" && <Radio className="h-5 w-5 text-[#00FFFF]" />}
            {type === "artists" && <User2 className="h-5 w-5 text-[#00FFFF]" />}
            {type === "albums" && <Disc3 className="h-5 w-5 text-[#00FFFF]" />}
            {type === "podcasts" && <Radio className="h-5 w-5 text-[#00FFFF]" />}
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="flex justify-between items-center mb-4">
          <p className="text-gray-400">
            {type === "moods" && "Create and browse your mood-based playlists"}
            {type === "artists" && "Artists you've recently listened to"}
            {type === "albums" && "Albums you've recently played"}
            {type === "podcasts" && "Podcasts you might enjoy"}
          </p>
          {type === "moods" && (
            <Button onClick={onCreateClick} className="bg-[#00FFFF] text-black hover:bg-[#00FFFF]/80">
              <Plus className="h-4 w-4 mr-2" />
              Create Mood
            </Button>
          )}
        </div>

        <ScrollArea className="h-[60vh]">
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                <div key={i} className="flex flex-col items-center animate-pulse">
                  <div
                    className={`${type === "artists" ? "rounded-full" : "rounded"} bg-white/10 w-full aspect-square mb-2`}
                  ></div>
                  <div className="h-4 w-3/4 bg-white/10 rounded mb-1"></div>
                  <div className="h-3 w-1/2 bg-white/10 rounded"></div>
                </div>
              ))}
            </div>
          ) : items.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col items-center cursor-pointer transition-transform hover:scale-105"
                  onClick={() => onItemClick?.(item)}
                >
                  <div
                    className={`${type === "artists" ? "rounded-full" : "rounded"} overflow-hidden w-full aspect-square mb-2`}
                  >
                    <img
                      src={item.imageUrl || "/placeholder.svg?height=200&width=200"}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="font-medium text-center">{item.name}</h3>
                  {item.description && <p className="text-xs text-gray-400 text-center mt-1">{item.description}</p>}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="bg-white/5 rounded-full p-6 mb-4">
                {type === "moods" && <Radio className="h-12 w-12 text-[#00FFFF]" />}
                {type === "artists" && <User2 className="h-12 w-12 text-[#00FFFF]" />}
                {type === "albums" && <Disc3 className="h-12 w-12 text-[#00FFFF]" />}
                {type === "podcasts" && <Radio className="h-12 w-12 text-[#00FFFF]" />}
              </div>
              <h3 className="text-xl font-bold mb-2">No {type} found</h3>
              <p className="text-gray-400 text-center max-w-md mb-6">
                {type === "moods" && "Create your first mood-based playlist to get started"}
                {type === "artists" && "Listen to some music to see your recent artists"}
                {type === "albums" && "Listen to some albums to see them here"}
                {type === "podcasts" && "Explore podcasts to see them here"}
              </p>
              {type === "moods" && (
                <Button onClick={onCreateClick} className="bg-[#00FFFF] text-black hover:bg-[#00FFFF]/80">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Mood
                </Button>
              )}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

