import { env } from "./env"

export const spotifyConfig = {
  clientId: env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID,
  clientSecret: env.SPOTIFY_CLIENT_SECRET,
};
