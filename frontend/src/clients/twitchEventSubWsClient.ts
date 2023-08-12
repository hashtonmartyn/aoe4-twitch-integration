import axios from "axios";
import {type PollResultStore, usePollResultStore} from "../stores/pollResult";

enum ConnectionState {
  Opening,
  Opened,
  Closed,
  Error
}

const eventTypes = [
    "channel.poll.begin",
    "channel.poll.progress",
    "channel.poll.end"
]

class EventSubWsClient {
  wsUrl: string
  apiBaseUrl: string
  broadcasterId: string
  accessToken: string
  clientId: string

  socket: WebSocket
  sessionId: string

  state: ConnectionState
  store: PollResultStore

  constructor(
      wsUrl: string,
      apiBaseUrl: string,
      broadcasterId: string,
      accessToken: string,
      clientId: string,
      pollResultStore: PollResultStore
  ) {
    this.wsUrl = wsUrl
    this.apiBaseUrl = apiBaseUrl
    this.broadcasterId = broadcasterId
    this.accessToken = accessToken
    this.clientId = clientId
    this.store = pollResultStore

    this.socket = new WebSocket(this.wsUrl)
    this.state = ConnectionState.Opening
    this.socket.onopen = this.onOpen
    this.socket.onclose = this.onClose
    this.socket.onmessage = this.onMessage
    this.socket.onerror = this.onError
    this.sessionId = ""
  }

  onOpen(event: Event) {

  }

  onClose(event: CloseEvent) {
    if (this.state == ConnectionState.Opening) {
      this.store.setErrorMessage("Connection to twitch failed, try refreshing the page")
    }

    this.state = ConnectionState.Closed
  }

  onMessage(event: MessageEvent): Promise {
    const data = JSON.parse(event.data)

    switch (data.metadata.message_type) {
      case "session_welcome": {
        const sessionId = data.payload.session.id
        return this.handleSessionWelcome(sessionId)
      }
    }

    return Promise.resolve()
  }

  handleSessionWelcome(sessionId: string): Promise {
    const promises = Promise.all(
        eventTypes.map(eventType => {
          return this.subscribe(eventType, sessionId).then(subscribed => {
            return subscribed
          }).catch(reason => {
            this.store.setErrorMessage(
                "Failed to subscribe to poll event updates, try refreshing the page?"
            )
            throw reason
          })
        }
      )
    )

    return promises
  }

  onError(event: Event) {
    if (this.state == ConnectionState.Opening) {
      this.store.setErrorMessage("Connection to twitch failed, try refreshing the page")
    }

    this.state = ConnectionState.Closed
  }

  setState(state: ConnectionState) {
    this.state = state
  }

  getState(): ConnectionState {
    return this.state
  }

  setSessionId(sessionId: string) {
    this.sessionId = sessionId
  }

  subscribe(eventType: string, sessionId: string) {
    return axios.post(
      `${this.apiBaseUrl}/eventsub/subscriptions`,
      {
        type: eventType,
        version: "1",
        condition: {
          broadcaster_user_id: this.broadcasterId
        },
        transport: {
          method: "websocket",
          session_id: sessionId
        }
      },
      {
        headers: {
          "Authorization": `Bearer ${this.accessToken}`,
          "Client-Id": this.clientId,
          "Content-Type": "application/json"
        }
      }
    ).then(result => {
      return result.status == 202
    }).catch(reason => {
      throw new Error(reason.message)
    })
  }

  close() {
    this.socket.close()
  }
}

export { EventSubWsClient, ConnectionState }