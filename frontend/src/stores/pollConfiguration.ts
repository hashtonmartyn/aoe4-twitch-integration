import {defineStore} from "pinia";

enum Colour {
  Blue = "Blue",
  Red = "Red",
  Green = "Green",
  Yellow = "Yellow",
  Purple = "Purple",
  Orange = "Orange",
  Teal = "Teal",
  Pink = "Pink"
}

type Player = {
  id: number
  colour: Colour
  option: string
}

type Players = {
  [key: number]: Player
}

const usePollConfigurationStore = defineStore("pollConfiguration", {
  state: () => ({
    pollOptions: [
      "Send wolves: ",
      "Send sheep: ",
      "Send photon man: ",
      "Send bombards: ",
      "Robin hood: ",
      "Send elephants: ",
      "Kill houses: ",
      "Kill gers: ",
      "Kill mining camps: ",
      "Buff villagers: ",
      "Vills wander off: ",
      "Burn buildings: ",
      "Send relics: ",
      "Send boar: ",
      "Send gold: ",
      "Send food: ",
      "Send wood: ",
      "Send stone: ",
      "Send nest of bees: ",
    ],
    numberOfPlayers: 2,
    players: {
      1: {id: 1, colour: Colour.Blue, option: ""},
      2: {id: 2, colour: Colour.Red, option: ""},
      3: {id: 3, colour: Colour.Green, option: ""},
      4: {id: 4, colour: Colour.Yellow, option: ""},
      5: {id: 5, colour: Colour.Purple, option: ""},
      6: {id: 6, colour: Colour.Orange, option: ""},
      7: {id: 7, colour: Colour.Teal, option: ""},
      8: {id: 8, colour: Colour.Pink, option: ""}
    } as Players
  }),
  getters: {
    isPollConfigurationValid(): boolean {
      let valid = true
      Object.values(this.players).forEach(p1 => {
        Object.values(this.players).forEach(p2 => {
          if (p1.id != p2.id && p1.colour == p2.colour && p1.id <= this.numberOfPlayers && p2.id <= this.numberOfPlayers) {
            valid = false
            return
          }
        })
      })
      return valid
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
      const rand = Math.floor(Math.random() * 10)
      Object.values(this.players).filter(player => player.id <= this.numberOfPlayers).forEach((player: Player) => {
        for(let i=0; i < rand; i++) {
          if (this.numberOfPlayers > 5) {
            player.id = ((player.id + this.numberOfPlayers) % this.numberOfPlayers) + 1
          }
        }

        player.option = this.pollOptions[Math.floor(Math.random() * this.pollOptions.length)]
      })
    },
  }
})

export type PollConfigurationStore = ReturnType<typeof usePollConfigurationStore>

export {
  usePollConfigurationStore,
  Colour
}