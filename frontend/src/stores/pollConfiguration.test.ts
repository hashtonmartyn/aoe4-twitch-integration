import {setActivePinia, createPinia} from "pinia";
import {Colour, usePollConfigurationStore} from "@/stores/pollConfiguration";
import {it, beforeEach, describe, expect} from "vitest";

describe("Poll Configuration Store", () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it("contains all of the poll options", () => {
    const store = usePollConfigurationStore()
    const expectedOptions = [
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
      "Kill wonder: "
    ]

    expectedOptions.forEach(option => {
      expect(store.pollOptions.includes(option), option).toBeTruthy()
    })
  })

  it("defaults the number of players to 2 but can change", () => {
    const store = usePollConfigurationStore()
    expect(store.numberOfPlayers).toEqual(2)

    store.setNumberOfPlayers(8)

    expect(store.numberOfPlayers).toEqual(8)
  })

  it("only allows valid number of players be to set", () => {
    const store = usePollConfigurationStore()
    store.setNumberOfPlayers(1)
    expect(store.numberOfPlayers).toEqual(2)

    store.setNumberOfPlayers(9)
    expect(store.numberOfPlayers).toEqual(8)
  })

  it("should be able to randomise poll options for the players", () => {
    const store = usePollConfigurationStore()
    const options = Object.values(store.players).map(player => player.option)
    store.randomiseOptions()
    const newOptions = Object.values(store.players).map(player => player.option)
    expect(options).not.toEqual(newOptions)
  })

  it("should be a valid poll configuration by default", () => {
    const store= usePollConfigurationStore()
    expect(store.isPollConfigurationValid).toBeTruthy()
  })

  it("should be invalid if more than one player has the same colour", () => {
    const store = usePollConfigurationStore()
    store.players[1].colour = Colour.Blue
    store.players[2].colour = Colour.Blue

    expect(store.isPollConfigurationValid).toBeFalsy()
  })

  it("should not have an options that are more than 19 characters in length", () => {
    const store = usePollConfigurationStore()
    store.pollOptions.forEach(option => {
      expect(option.length, option).toBeLessThanOrEqual(19)
    })
  })

})