"use client"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Home, Radio, Library, ListMusic, Music2, User2, Search } from "lucide-react"

export default function Sidebar() {
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
            <Library className="mr-3 h-5 w-5" />
            Your Library
          </Button>
        </div>

        <div className="mt-8 space-y-4">
          <div className="px-3">
            <h2 className="mb-2 text-lg font-semibold tracking-tight">Discover</h2>
            <div className="space-y-1">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-white/70 hover:text-white hover:bg-white/10"
              >
                <ListMusic className="mr-3 h-4 w-4" />
                Playlists
              </Button>
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

          <div className="px-3">
            <h2 className="mb-2 text-lg font-semibold tracking-tight">Your Playlists</h2>
            <ScrollArea className="h-[300px]">
              <div className="space-y-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start font-normal text-white/70 hover:text-white hover:bg-white/10"
                >
                  Liked Songs
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start font-normal text-white/70 hover:text-white hover:bg-white/10"
                >
                  Recently Played
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start font-normal text-white/70 hover:text-white hover:bg-white/10"
                >
                  Your Episodes
                </Button>
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>
    </div>
  )
}

