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
})