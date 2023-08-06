import {defineStore} from "pinia";


interface Player {
  id: number
  name: string
  option: string
}

type Players = {
  [key: number]: Player
}

export const usePollConfigurationStore = defineStore("pollConfiguration", {
  state: () => ({
    pollOptions: [
      "Send wolves to",
      "Delete a house from",
      "Give gold to",
      "Give buff villagers to",
      "Send boars to",
      "Give stone to"
    ],
    numberOfPlayers: 2,
    players: {
      1: {id: 1, name: "", option: ""},
      2: {id: 2, name: "", option: ""},
      3: {id: 3, name: "", option: ""},
      4: {id: 4, name: "", option: ""},
      5: {id: 5, name: "", option: ""},
      6: {id: 6, name: "", option: ""},
      7: {id: 7, name: "", option: ""},
      8: {id: 8, name: "", option: ""}
    } as Players
  }),
  getters: {
    isPollConfigurationValid(): boolean {
    return Object.values(this.players)
      .filter(player => player.id <= this.numberOfPlayers)
      .map(player => player.name.length > 0)
      .reduce((accumulator, current) => {
        return accumulator && current
    })
}
  },
  actions: {
    setNumberOfPlayers(numberOfPlayers: number) {
      if (numberOfPlayers < 2) {
        numberOfPlayers = 2
      }
      else if (numberOfPlayers > 8) {
        numberOfPlayers = 8
      }
      this.numberOfPlayers = numberOfPlayers
    },
    randomiseOptions() {
      Object.values(this.players).forEach(player => {
        player.option = this.pollOptions[Math.floor(Math.random() * this.pollOptions.length)]
      })
    },
    setPlayerName(id: number, name: string) {
      const oldPlayer = this.players[id]
      this.players[id] = {
        name: name,
        id: oldPlayer.id,
        option: oldPlayer.option
      }
    }
  },
})