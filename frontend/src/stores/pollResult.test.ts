import {setActivePinia, createPinia} from "pinia";
import {type PollResultStore, usePollResultStore} from "@/stores/pollResult";
import {beforeEach, describe, expect, it} from "vitest";


let store = {} as PollResultStore

describe("Poll Result Store", () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    store = usePollResultStore()
  })

  it("can set the error message", () => {
    expect(store.errorMessage).toEqual("")
    store.setErrorMessage("oh no!")
    expect(store.errorMessage).toEqual("oh no!")
  })

  it("can set votes for a choice", () => {
    expect(store.choices).toEqual({})
    store.setVotes("send boars", 10)
    expect(store.choices).toEqual({"send boars": 10})
  })

  it("can get the winning choice", () => {
    store.setVotes("send boars", 10)
    store.setVotes("delete houses", 20)

    const winningChoice = store.winningChoice
    expect(winningChoice).toEqual("delete houses")
  })

  it("can get the choice titles", () => {
    store.setVotes("send boars", 10)
    store.setVotes("delete houses", 20)
    const actual = store.titles

    expect(actual).toEqual(["send boars", "delete houses"])
  })

  it("can get the votes", () => {
    store.setVotes("send boars", 10)
    store.setVotes("delete houses", 20)
    const actual = store.votes

    expect(actual).toEqual([10, 20])
  })

  it("can reset the choices, error message, poll id,  and inProgress", () => {
    store.setVotes("send boars", 10)
    store.setVotes("delete houses", 20)
    store.setErrorMessage("oh no!")
    store.setInProgress(true)
    store.setPollId("some-poll-id")
    store.reset()

    expect(store.choices).toEqual({})
    expect(store.errorMessage).toEqual("")
    expect(store.inProgress).toBeFalsy()
    expect(store.pollId).toEqual("")
  })

  it("can set in progress", () => {
    expect(store.inProgress).toBeFalsy()
    store.setInProgress(true)
    expect(store.inProgress).toBeTruthy()
  })

  it("can set the poll id", () => {
    expect(store.pollId).toEqual("")
    store.setPollId("some-poll-id")
    expect(store.pollId).toEqual("some-poll-id")
  })
})