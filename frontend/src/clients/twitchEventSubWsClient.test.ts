import {setActivePinia, createPinia} from "pinia";
import type {PollResultStore} from "@/stores/pollResult";
import {usePollResultStore} from "@/stores/pollResult";
import {it, describe, beforeEach, expect} from "vitest";
import {ConnectionState, EventSubWsClient, type WebSocketFactory} from "@/clients/twitchEventSubWsClient";
import MockAdapter from "axios-mock-adapter";
import axios from "axios";


let store = {} as PollResultStore
let wsClient = {} as EventSubWsClient
let maxios = {} as MockAdapter
const eventTypes = [
    "channel.poll.begin",
    "channel.poll.progress",
    "channel.poll.end"
]
const wsUrl = "ws://localhost:8080"

class MockWebSocketFactory implements WebSocketFactory {

  socket: WebSocket

  constructor() {
    this.socket = {} as WebSocket
  }

  build(url: string): WebSocket {
    this.socket =  {
      url: url,
      close: (() => {})
    } as WebSocket

    return this.socket
  }
}

let mockWebSocketFactory = {} as MockWebSocketFactory

describe("Twitch Event Sub Websocket Client", () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    store = usePollResultStore()

    mockWebSocketFactory = new MockWebSocketFactory()
    wsClient = new EventSubWsClient(
        "localhost:8080",
        "123456",
        "some-access-token",
        "client-id",
        store,
        mockWebSocketFactory
    )

    maxios = new MockAdapter(axios, {onNoMatch: "throwException"})
  })

  it("should set state to closed by default", () => {
    expect(wsClient.state).toEqual(ConnectionState.Closed)
  })

  it("should set state to opened", () => {
    wsClient.connect(wsUrl)
    wsClient.onOpen()

    expect(wsClient.state).toEqual(ConnectionState.Opened)
  })

  it("should set state to closing", () => {
    wsClient.connect(wsUrl)
    wsClient.disconnect()
    expect(wsClient.state).toEqual(ConnectionState.Closed)
  })

  it("should set an error message if the connection is closed immediately", () => {
    wsClient.connect(wsUrl)
    wsClient.onClose()

    expect(wsClient.state).toEqual(ConnectionState.Closed)
    expect(store.errorMessage).toEqual("Connection to twitch failed, try refreshing the page")
  })

  it("should set an error message if the connection returns an error", () => {
    wsClient.connect(wsUrl)
    wsClient.onError()

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

  it("should handle reconnects nicely", async () => {
    const message = {
      data: JSON.stringify({
        metadata: {
          message_type: "session_reconnect"
        },
        payload: {
          session: {
            reconnect_url: "ws://some-other-url.com:8080"
          }
        }
      })
    } as MessageEvent

    wsClient.connect(wsUrl)
    expect(mockWebSocketFactory.socket.url).toEqual(wsUrl)
    await wsClient.onMessage(message)
    expect(store.errorMessage).toEqual("")
    expect(mockWebSocketFactory.socket.url).toEqual("ws://some-other-url.com:8080")
  })

  it("should handle revocation nicely", async () => {
    const message = {
      data: JSON.stringify({
        metadata: {
          message_type: "revocation"
        }
      })
    } as MessageEvent

    wsClient.connect(wsUrl)
    await wsClient.onMessage(message)

    expect(store.errorMessage).toEqual("Received revocation message, did you disconnect the aoe4-twitch-integration connection in your twitch account? Maybe try refreshing the page")
    expect(wsClient.state).toEqual(ConnectionState.Closed)
  })

  it("should handle channel.poll.begin", async() => {
    const message = {
      data: JSON.stringify({
        metadata: {
          message_type: "notification"
        },
        payload: {
          subscription: {
            type: "channel.poll.begin"
          },
          event: {
            choices: [
              {
                title: "send boars",
                bits_votes: 0,
                channel_points_votes: 0,
                votes: 0
              },
              {
                title: "delete houses",
                bits_votes: 0,
                channel_points_votes: 0,
                votes: 0
              }
            ]
          }
        }
      })
    } as MessageEvent

    await wsClient.onMessage(message)

    expect(store.choices).toEqual({"send boars": 0, "delete houses": 0})
    expect(store.inProgress).toBeTruthy()
  })

  it("should handle channel.poll.progress", async() => {
    const message = {
      data: JSON.stringify({
        metadata: {
          message_type: "notification"
        },
        payload: {
          subscription: {
            type: "channel.poll.progress"
          },
          event: {
            choices: [
              {
                title: "send boars",
                bits_votes: 1,
                channel_points_votes: 2,
                votes: 3
              },
              {
                title: "delete houses",
                bits_votes: 2,
                channel_points_votes: 3,
                votes: 4
              }
            ]
          }
        }
      })
    } as MessageEvent

    await wsClient.onMessage(message)

    expect(store.choices).toEqual({"send boars": 6, "delete houses": 9})
  })

  it("should handle channel.poll.end", async() => {
    const message = {
      data: JSON.stringify({
        metadata: {
          message_type: "notification"
        },
        payload: {
          subscription: {
            type: "channel.poll.end"
          },
          event: {
            id: "some-event-id",
            choices: [
              {
                title: "send boars",
                bits_votes: 3,
                channel_points_votes: 4,
                votes: 5
              },
              {
                title: "delete houses",
                bits_votes: 4,
                channel_points_votes: 5,
                votes: 6
              }
            ]
          }
        }
      })
    } as MessageEvent

    maxios.onPost(
    "/poll_result",
      {
        result: "delete houses",
        event_id: "some-event-id"
      }
    ).reply(200)

    await wsClient.onMessage(message)

    expect(store.choices).toEqual({"send boars": 12, "delete houses": 15})
    expect(store.inProgress).toBeFalsy()
  })

  it("should handle channel.poll.end when submitting result to backend fails", async() => {
    const message = {
      data: JSON.stringify({
        metadata: {
          message_type: "notification"
        },
        payload: {
          subscription: {
            type: "channel.poll.end"
          },
          event: {
            id: "some-event-id",
            choices: [
              {
                title: "send boars",
                bits_votes: 3,
                channel_points_votes: 4,
                votes: 5
              },
              {
                title: "delete houses",
                bits_votes: 4,
                channel_points_votes: 5,
                votes: 6
              }
            ]
          }
        }
      })
    } as MessageEvent

    maxios.onPost(
    "/poll_result",
      {
        result: "delete houses",
        event_id: "some-event-id"
      }
    ).reply(500)

    await expect(wsClient.onMessage(message)).rejects.toEqual(
      new Error("Request failed with status code 500")
    )

    expect(store.errorMessage).toEqual(
      "Failed to set poll result in the backend, poll result will not make it to the game :("
    )
  })
})