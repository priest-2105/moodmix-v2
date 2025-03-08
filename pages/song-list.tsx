import React from "react";
import { Button } from "@/components/ui/button";

interface Song {
  id: string;
  title: string;
  artist: string;
}

interface Playlist {
  id: string;
  name: string;
  image: string;
  songs: Song[];
}

interface SongListPageProps {
  playlist: Playlist;
  onPlay: (song: Song) => void;
}

export default function SongListPage({ playlist, onPlay }: SongListPageProps) {
  return (
    <div
      style={{ backgroundImage: `url(${playlist.image})` }}
      className="min-h-screen bg-cover bg-center"
    >
      <div className="bg-black bg-opacity-70 min-h-screen p-8">
        {/* ...existing header if needed... */}
        <h1 className="text-4xl font-bold text-white mb-8">{playlist.name}</h1>
        <div className="grid grid-cols-1 gap-4">
          {playlist.songs.map(song => (
            <div
              key={song.id}
              className="flex items-center justify-between bg-gray-800 bg-opacity-50 p-4 rounded"
            >
              <div>
                <p className="text-white font-semibold">{song.title}</p>
                <p className="text-gray-300 text-sm">{song.artist}</p>
              </div>
              <Button onClick={() => onPlay(song)}>Play</Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
