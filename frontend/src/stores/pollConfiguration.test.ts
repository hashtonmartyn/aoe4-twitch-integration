import {setActivePinia, createPinia} from "pinia";
import {usePollConfigurationStore} from "@/stores/pollConfiguration";
import {it, beforeEach, describe, expect} from "vitest";

describe("Poll Configuration Store", () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it("contains all of the poll options", () => {
    const store = usePollConfigurationStore()
    const expectedOptions = [
      "Send wolves to",
      "Delete a house from",
      "Give gold to",
      "Give buff villagers to",
      "Send boars to",
      "Give stone to"
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
    Object.values(store.players).forEach(player => {
      expect(player.option).toEqual("")
    })

    store.randomiseOptions()

    Object.values(store.players).forEach(player => {
      expect(store.pollOptions.includes(player.option), player.option).toBeTruthy()
    })
  })

  it("should be a invalid poll configuration by default", () => {
    const store = usePollConfigurationStore()
    expect(store.isPollConfigurationValid).toBeFalsy()
  })

  it("should be valid poll configuration when all of the players have names set", () => {
    const store = usePollConfigurationStore()

    store.setPlayerName(1, "abc")
    store.setPlayerName(2, "bcd")

    expect(store.isPollConfigurationValid).toBeTruthy()
  })

  it("should invalidate the poll configuration when a new player is added with no name", () => {
    const store = usePollConfigurationStore()

    store.setPlayerName(1, "abc")
    store.setPlayerName(2, "bcd")

    expect(store.isPollConfigurationValid).toBeTruthy()

    store.setNumberOfPlayers(3)

    expect(store.isPollConfigurationValid).toBeFalsy()
  })

  it("should be able to set player names", () => {
    const store = usePollConfigurationStore()
    const newPlayerNames = [
      "abc",
      "bcd",
      "def",
      "efg",
      "fgh",
      "ghi",
      "hij",
      "ijk"
    ]

    Object.values(store.players).forEach((player, index) => {
      expect(player.name).toEqual("")
      const newName = newPlayerNames[index]
      store.setPlayerName(index + 1, newName)
    })

    Object.values(store.players).forEach((player, index) => {
      const newName = newPlayerNames[index]
      expect(player.name).toEqual(newName)
    })
  })
})