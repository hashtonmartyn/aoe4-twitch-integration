import {setActivePinia, createPinia} from "pinia";
import {useUserStore} from "../stores/user";
import {beforeEach, describe, expect, it} from "vitest";

describe("User Store", () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it("setting the token saves the token", () => {
    const store = useUserStore()
    expect(store.twitchAccessToken).toEqual("")
    expect(store.isAuthenticated).toBeFalsy()

    store.setToken("abcd1234")
    expect(store.twitchAccessToken).toEqual("abcd1234")
    expect(store.isAuthenticated).toBeTruthy()
  })

  it("setting the broadcaster id saves the broadcaster id", () => {
    const store = useUserStore()
    expect(store.broadcasterId).toEqual("")

    store.setBroadcasterId("abc123")
    expect(store.broadcasterId).toEqual("abc123")
  })
})