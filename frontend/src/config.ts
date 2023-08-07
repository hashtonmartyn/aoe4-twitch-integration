interface Config {
  backendApiBaseUri: string
  twitchHelixApiBaseUri: string
  twitchWebSocketUrl: string
  twitchClientId: string

}

const config = {
  backendApiBaseUri: import.meta.env.VITE_BACKEND_API_BASE_URI,
  twitchHelixApiBaseUri: import.meta.env.VITE_TWITCH_HELIX_API_BASE_URI,
  twitchWebSocketUrl: import.meta.env.VITE_TWITCH_WEB_SOCKET_URL,
  twitchClientId: import.meta.env.VITE_TWITCH_CLIENT_ID
}

export default config