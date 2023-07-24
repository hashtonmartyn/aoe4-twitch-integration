import {defineStore} from "pinia";

export const useUserStore = defineStore("user", {
  state: () => ({
    twitchAccessToken: "",
    userId: ""
  }),
  getters: {
    isAuthenticated: (state) => state.twitchAccessToken != ""
  },
  actions: {
    setToken(token: string) {
      this.twitchAccessToken = token
    },
    setUserId(userId: string) {
      this.userId = userId
    }
  },
  persist: true
})