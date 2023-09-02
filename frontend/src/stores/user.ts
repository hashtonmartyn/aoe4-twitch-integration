import {defineStore} from "pinia";

export const useUserStore = defineStore("user", {
  state: () => ({
    twitchAccessToken: "",
    broadcasterId: ""
  }),
  getters: {
    isAuthenticated: (state): boolean => {
      return state.twitchAccessToken != ""
    }
  },
  actions: {
    setToken(token: string) {
      this.twitchAccessToken = token
    },
    setBroadcasterId(broadcasterId: string) {
      this.broadcasterId = broadcasterId
    }
  },
  persist: {
    storage: sessionStorage
  }
})