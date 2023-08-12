import {setActivePinia, createPinia} from "pinia";
import type {PollResultStore} from "../stores/pollResult";
import {usePollResultStore} from "../stores/pollResult";
import {it, describe, beforeEach, vi, test, expect} from "vitest";
import {ConnectionState, EventSubWsClient} from "../clients/twitchEventSubWsClient";
import MockAdapter from "axios-mock-adapter";
import axios from "axios";


let store = null as PollResultStore
let wsClient = null as EventSubWsClient
let maxios = null as MockAdapter
const eventTypes = [
    "channel.poll.begin",
    "channel.poll.progress",
    "channel.poll.end"
]

describe("Twitch Event Sub Websocket Client", () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    store = usePollResultStore()

    const WebSocketMock = vi.fn(() => {

    })

    vi.stubGlobal("WebSocket", WebSocketMock)

    wsClient = new EventSubWsClient(
        "localhost:8080",
        "localhost:8080",
        "123456",
        "some-access-token",
        "client-id",
        store
    )

    maxios = new MockAdapter(axios, {onNoMatch: "throwException"})
  })

  it("should set state to opening by default", () => {
    expect(wsClient.state).toEqual(ConnectionState.Opening)
  })

  it("should set an error message if the connection is closed immediately", () => {
    const event = {} as CloseEvent
    wsClient.onClose(event)

    expect(wsClient.state).toEqual(ConnectionState.Closed)
    expect(store.errorMessage).toEqual("Connection to twitch failed, try refreshing the page")
  })

  it("should set an error message if the connection returns an error", () => {
    const event = {} as Event
    wsClient.onError(event)

    expect(wsClient.state).toEqual(ConnectionState.Closed)
    expect(store.errorMessage).toEqual("Connection to twitch failed, try refreshing the page")
  })

  it("should subscribe to channel poll events upon receiving the session welcome", async () => {
    const message = {
      data: JSON.stringify({
        metadata: {
          message_type: "session_welcome"
        },
        payload: {
          session: {
            id: "some-session-id"
          }
        }
      })
    } as MessageEvent

    eventTypes.forEach(eventType => {
      maxios.onPost(
        "localhost:8080/eventsub/subscriptions",
          {
          type: eventType,
          version: "1",
          condition: {
            broadcaster_user_id: "123456"
          },
          transport: {
            method: "websocket",
            session_id: "some-session-id"
          }
        }
      ).reply(202)
    })

    await wsClient.onMessage(message)
    expect(store.errorMessage).toEqual("")
  })

  it("should throw an error when channel poll event subscription returns a non 202 status code", async () => {
    const message = {
      data: JSON.stringify({
        metadata: {
          message_type: "session_welcome"
        },
        payload: {
          session: {
            id: "some-session-id"
          }
        }
      })
    } as MessageEvent

    eventTypes.forEach(eventType => {
      maxios.onPost(
        "localhost:8080/eventsub/subscriptions",
          {
          type: eventType,
          version: "1",
          condition: {
            broadcaster_user_id: "123456"
          },
          transport: {
            method: "websocket",
            session_id: "some-session-id"
          }
        }
      ).reply(502)
    })

    await expect(wsClient.onMessage(message)).rejects.toEqual(new Error("Request failed with status code 502"))
    expect(store.errorMessage).toEqual("Failed to subscribe to poll event updates, try refreshing the page?")
  })
})