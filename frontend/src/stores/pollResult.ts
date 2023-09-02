import {defineStore} from "pinia";

type Choices = {
  [title: string]: number
}

const usePollResultStore = defineStore("pollResultStore", {
  state: () => ({
    errorMessage: "",
    choices: {} as Choices,
    inProgress: false
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
    },
    titles(state): string[] {
      return Object.keys(state.choices)
    },
    votes(state): number[] {
      return Object.values(state.choices)
    }
  },
  actions: {
    setErrorMessage(message: string) {
      this.errorMessage = message
    },
    setVotes(title: string, votes: number) {
      this.choices[title] = votes
    },
    reset() {
      this.errorMessage = ""
      this.choices = {}
      this.inProgress = false
    },
    setInProgress(inProgress: boolean) {
      console.log(`Setting inProgress to ${inProgress}`)
      this.inProgress = inProgress
    }
  }
})

export type PollResultStore = ReturnType<typeof usePollResultStore>

export {
  usePollResultStore
}