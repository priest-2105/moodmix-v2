"use client"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Home, Radio, Library, ListMusic, Music2, User2, Search } from "lucide-react"
import React from "react";

interface Playlist {
  id: string;
  name: string;
}

interface SidebarProps {
  playlists: Playlist[];
  onSelect: (playlistId: string) => void;
}

export default function Sidebar({ playlists, onSelect }: SidebarProps) {
  return (
    <aside className="overflow-y-auto h-full p-4 bg-gray-800 text-white">
      <div className="flex justify-between items-center mb-4">
        <h2>Your Playlists</h2>
        <button className="text-sm text-cyan-400 hover:underline">See All</button>
      </div>
      <ul>
        {playlists.map(pl => (
          <li
            key={pl.id}
            className="mb-2 cursor-pointer hover:text-cyan-400"
            onClick={() => onSelect(pl.id)}
          >
            {pl.name}
          </li>
        ))}
      </ul>
    </aside>
  );
}

