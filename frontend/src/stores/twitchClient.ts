import {defineStore} from "pinia";

export const useTwitchClientStore = defineStore("twitchClient", {
  state: () => ({
    clientId: "",
    apiBaseUrl: "http://localhost:8080",
    webSocketUrl: "ws://127.0.0.1:8081/ws"
  }),
  actions: {
    setClientId(clientId: string) {
      this.clientId = clientId
    }
  },
  persist: true
})