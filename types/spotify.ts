export interface SpotifyUser {
  id: string
  display_name: string
  email: string
  images?: Array<{
    url: string
    height: number
    width: number
  }>
  country?: string
  product?: string
  followers?: {
    total: number
  }
  last_login?: string
}

export interface Playlist {
  id: string
  name: string
  description?: string
  images?: Array<{
    url: string
    height: number
    width: number
  }>
  owner: {
    id: string
    display_name: string
  }
  tracks: {
    total: number
    items?: Array<{
      track: {
        id: string
        name: string
        uri: string
        album: {
          id: string
          name: string
          images: Array<{
            url: string
            height: number
            width: number
          }>
        }
        artists: Array<{
          id: string
          name: string
        }>
      }
    }>
  }
  public?: boolean
  collaborative?: boolean
}

export interface Track {
  id: string
  name: string
  uri: string
  duration_ms: number
  explicit: boolean
  popularity: number
  preview_url?: string
  album: {
    id: string
    name: string
    images: Array<{
      url: string
      height: number
      width: number
    }>
    release_date: string
  }
  artists: Array<{
    id: string
    name: string
  }>
}

export interface AudioFeatures {
  id: string
  danceability: number
  energy: number
  key: number
  loudness: number
  mode: number
  speechiness: number
  acousticness: number
  instrumentalness: number
  liveness: number
  valence: number
  tempo: number
  duration_ms: number
  time_signature: number
}

