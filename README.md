# Moodmix - Spotify Mood-Based Music Player

![Moodmix Logo](https://github.com/priest-2105/moodmix-v2/blob/e5033fe2c6ef24188d663d5082144958670603c2/public/documentation/Screenshot%20(1029).png)

## Overview

Moodmix is a web application that enhances the Spotify listening experience by allowing users to create and play mood-based music collections. The app integrates with the Spotify Web API and Web Playback SDK to provide a seamless music experience tailored to users' moods and preferences.

## Features

- **Spotify Authentication**: Secure login with Spotify OAuth
- **Playlist Management**: Browse and play your Spotify playlists
- **Mood Collections**: Create custom mood-based collections of tracks
- **Web Playback**: Integrated Spotify Web Player for seamless playback
- **Search Functionality**: Search across playlists and moods
- **Responsive Design**: Works on desktop and mobile devices
- **User Profile**: View and manage your Spotify profile

## Tech Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API routes, Supabase
- **Authentication**: Spotify OAuth
- **Database**: Supabase PostgreSQL
- **Styling**: Tailwind CSS, shadcn/ui components
- **State Management**: React hooks and context
- **APIs**: Spotify Web API, Spotify Web Playback SDK

## Project Structure

```
/app                    # Next.js App Router files
/callback               # Spotify OAuth callback handling
/page.tsx               # Main application page
/layout.tsx             # Root layout component
/globals.css            # Global styles
/components             # React components
/ui                     # UI components (shadcn/ui)
/spotify-web-player.tsx # Spotify player integration
/playlist-view.tsx      # Playlist view component
/mood-view.tsx          # Mood view component
/music-player.tsx       # Custom music player controls
/sidebar.tsx            # Application sidebar
/...                    # Other components
/lib                    # Utility functions and API clients
/spotify.ts             # Spotify API client
/spotify-client.ts      # Client-side Spotify utilities
/supabase               # Supabase database utilities
/client.ts              # Supabase client
/moods.ts               # Mood-related database operations
/user.ts                # User-related database operations
/hooks                  # Custom React hooks
/types                  # TypeScript type definitions
/public                 # Static assets
```

## Core Components

### Authentication Flow

The application uses Spotify's OAuth 2.0 authentication flow:

1. User clicks "Login with Spotify" button
2. User is redirected to Spotify's authorization page
3. After authorization, Spotify redirects back to the app's callback URL
4. The app exchanges the authorization code for access and refresh tokens
5. Tokens are stored in localStorage for subsequent API calls

### Spotify Web Player

The application integrates the Spotify Web Playback SDK to provide a seamless playback experience:

- `SpotifyWebPlayer` component handles the SDK initialization and playback control
- Supports play, pause, skip, and volume control
- Syncs playback state across components
- Handles device management and transfers

### Mood Collections

The app's unique feature is the ability to create mood-based collections:

1. Users select a mood type (Happy, Sad, Energetic, Relaxed, Focused)
2. The app generates recommendations based on the mood or allows selection from existing playlists
3. Collections are stored in Supabase database
4. Users can browse, play, and manage their mood collections

## Database Schema

### Moods Table

```sql
CREATE TABLE moods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  mood_type TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Mood Tracks Table

```sql
CREATE TABLE mood_tracks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mood_id UUID REFERENCES moods(id) ON DELETE CASCADE,
  track_id TEXT NOT NULL,
  track_uri TEXT NOT NULL,
  track_name TEXT NOT NULL,
  artist_name TEXT NOT NULL,
  album_name TEXT,
  album_image_url TEXT,
  duration_ms INTEGER,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Setup and Installation

### Prerequisites

- Node.js 18+ and npm/yarn
- Spotify Developer account
- Supabase account

### Environment Variables

Create a `.env.local` file with the following variables:

```env
# Spotify API Credentials
NEXT_PUBLIC_SPOTIFY_CLIENT_ID=your_spotify_client_id_here
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret_here

# Supabase Connection Details
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### Spotify Developer Setup

1. Create a new app in the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/)
2. Add `http://localhost:3000/callback` as a Redirect URI
3. Note your Client ID and Client Secret for the environment variables

### Supabase Setup

1. Create a new project in [Supabase](https://supabase.com/)
2. Run the SQL scripts in the `migrations` folder to set up the database schema
3. Note your project URL and API keys for the environment variables

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/spotify-music-app.git
cd spotify-music-app

# Install dependencies
npm install

# Run the development server
npm run dev
```

## Usage

1. Open your browser and navigate to `http://localhost:3000`
2. Click "Login with Spotify" to authenticate with your Spotify account
3. Browse your playlists or create new mood collections
4. Enjoy your music organized by mood!

## Key Features Explained

### Home Page


The home page displays:

- Recently played playlists
- User's mood collections
- New and recommended content
- Quick access to search and navigation

![Homepage](https://github.com/priest-2105/moodmix-v2/blob/e5033fe2c6ef24188d663d5082144958670603c2/public/documentation/Screenshot%20(1029).png)


### Playlist View

The playlist view shows:

- Playlist details and cover art
- Track listing with duration and artist information
- Playback controls
- Background color adapts to the playlist cover art


![Mood View](https://github.com/priest-2105/moodmix-v2/blob/e5033fe2c6ef24188d663d5082144958670603c2/public/documentation/Screenshot%20(1038).png)


### Mood View

The mood view displays:

- Mood collection details and cover image
- Tracks in the collection
- Playback controls
- Background color based on the mood type


![Mood View](https://github.com/priest-2105/moodmix-v2/blob/e5033fe2c6ef24188d663d5082144958670603c2/public/documentation/Screenshot%20(1019).png)



### Moods and Playlists Search

The mood and playlist displays:

- Accurate Search between Moods and Playlists

![Moods and Playlist Search](https://github.com/priest-2105/moodmix-v2/blob/e5033fe2c6ef24188d663d5082144958670603c2/public/documentation/Screenshot%20(1034).png
)

### Music Player

The persistent music player at the bottom of the screen provides:

- Track information and cover art
- Play/pause, previous, and next controls
- Progress bar with seek functionality
- Volume control

![Music Player](https://github.com/priest-2105/moodmix-v2/blob/e5033fe2c6ef24188d663d5082144958670603c2/public/documentation/Screenshot%20(1033).png)

### View Profile Modal

The view profile modal allows users to:

- View Spotify Profile Name
- View Spotify Account type
- View Region

![user profile modal](https://github.com/priest-2105/moodmix-v2/blob/e5033fe2c6ef24188d663d5082144958670603c2/public/documentation/Screenshot%20(1025).png)



### Create Mood Modal

The create mood modal allows users to:

- Name and describe their mood collection
- Select a mood type
- Choose tracks from recommendations or existing playlists
- Upload a custom cover image

![create mood](https://github.com/priest-2105/moodmix-v2/blob/e5033fe2c6ef24188d663d5082144958670603c2/public/documentation/Screenshot%20(1027).png)




## Troubleshooting

### Common Issues

1. **Spotify Playback Not Working**
   - Ensure you have a Spotify Premium account (required for Web Playback SDK)
   - Check that your browser supports the Web Playback SDK
   - Try refreshing the page or logging out and back in

2. **Database Connection Issues**
   - Verify your Supabase credentials in the environment variables
   - Check that the database tables are properly set up
   - Ensure your Supabase project is active
   
3. **Authentication Errors**
   - Verify your Spotify API credentials
   - Check that the redirect URI is correctly set up in the Spotify
   - Clear browser cookies and localStorage, then try again

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

- 1. Fork the repository 
- 2. Create your feature branch ( `git checkout -b feature/amazing-feature `) 
- 3. Commit your changes ( `git commit -m  'Add some amazing feature ' `) 
- 4. Push to the branch ( `git push origin feature/amazing-feature `) 
- 5. Open a Pull Request

 ## License

This project is licensed under the MIT License - see the LICENSE file
for details.

 ## Acknowledgements

- [Spotify Web API ](https://developer.spotify.com/documentation/web-api/) 
- [Spotify Web PlaybackSDK ](https://developer.spotify.com/documentation/web-playback-sdk/) 
- [Next.js ](https://nextjs.org/)
- [Supabase ](https://supabase.com/)
- [Tailwind CSS ](https://tailwindcss.com/) 
- [shadcn/ui ](https://ui.shadcn.com/)
