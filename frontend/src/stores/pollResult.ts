import {defineStore} from "pinia";

const usePollResultStore = defineStore("pollResultStore", {
  state: () => ({
    errorMessage: ""
  }),
  actions: {
    setErrorMessage(message: string) {
      this.errorMessage = message
    }
  }
})

export type PollResultStore = ReturnType<typeof usePollResultStore>

export {
  usePollResultStore
}