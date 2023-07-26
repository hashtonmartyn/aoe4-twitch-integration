import axios from "axios";

enum ConnectionState {
  Opening,
  Opened,
  Closed,
  Error
}

class EventSubWsClient {
  wsUrl: string
  apiBaseUrl: string
  broadcasterId: string
  accessToken: string
  clientId: string

  socket: WebSocket
  sessionId: string

  state: ConnectionState

  constructor(
      wsUrl: string,
      apiBaseUrl: string,
      broadcasterId: string,
      accessToken: string,
      clientId: string,
      onOpen: (event: Event) => void,
      onMessage: (event: MessageEvent) => void,
      onClose: (event: CloseEvent) => void,
      onError: (event: Event) => void
  ) {
    this.wsUrl = wsUrl
    this.apiBaseUrl = apiBaseUrl
    this.broadcasterId = broadcasterId
    this.accessToken = accessToken
    this.clientId = clientId

    this.socket = new WebSocket(this.wsUrl)
    this.state = ConnectionState.Opening
    this.socket.onopen = onOpen
    this.socket.onclose = onClose
    this.socket.onmessage = onMessage
    this.socket.onerror = onError
    this.sessionId = ""
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

  async subscribe(eventType: string) {
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
          session_id: this.sessionId
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
    })
  }

  close() {
    this.socket.close()
  }
}

export { EventSubWsClient, ConnectionState }