import {defineStore} from "pinia";

type Choices = {
  [title: string]: number
}

const usePollResultStore = defineStore("pollResultStore", {
  state: () => ({
    errorMessage: "",
    choices: {} as Choices
  }),
  getters: {
    winningChoice(state): string {
      let winningTitle = ""
      let winningVotes = -1

      Object.keys(state.choices).forEach(title => {
        const votes = state.choices[title]
        if (votes > winningVotes) {
          winningTitle = title
          winningVotes = votes
        }
      })

      return winningTitle
    }
  },
  actions: {
    setErrorMessage(message: string) {
      this.errorMessage = message
    },
    setVotes(title: string, votes: number) {
      this.choices[title] = votes
    }
  }
})

export type PollResultStore = ReturnType<typeof usePollResultStore>

export {
  usePollResultStore
}