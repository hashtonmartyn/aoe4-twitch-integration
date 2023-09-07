import axios from "axios";
import {type PollResultStore} from "@/stores/pollResult";
import type {ChannelPollMessage, Choice} from "@/clients/websocketMessages/channelPoll";

enum ConnectionState {
  Opening,
  Opened,
  Closed
}

const eventTypes = [
    "channel.poll.begin",
    "channel.poll.progress",
    "channel.poll.end"
]

interface WebSocketFactory {
  build(url: string): WebSocket
}

class EventSubWsClient {
  apiBaseUrl: string
  broadcasterId: string
  accessToken: string
  clientId: string

  socket: WebSocket
  webSocketFactory: WebSocketFactory
  sessionId: string

  state: ConnectionState
  store: PollResultStore

  constructor(
      apiBaseUrl: string,
      broadcasterId: string,
      accessToken: string,
      clientId: string,
      pollResultStore: PollResultStore,
      webSocketFactory: WebSocketFactory
  ) {
    this.apiBaseUrl = apiBaseUrl
    this.broadcasterId = broadcasterId
    this.accessToken = accessToken
    this.clientId = clientId
    this.store = pollResultStore
    this.state = ConnectionState.Closed
    this.sessionId = ""
    this.socket = {} as WebSocket
    this.webSocketFactory = webSocketFactory
  }

  connect(wsUrl: string) {
    this.socket = this.webSocketFactory.build(wsUrl)
    this.state = ConnectionState.Opening
    this.socket.onopen = this.onOpen
    this.socket.onclose = this.onClose
    this.socket.onmessage = this.onMessage
    this.socket.onerror = this.onError
    Object.defineProperty(this.socket, "client", {value: this, writable: false})
  }

  disconnect() {
    this.socket.close()
    this.state = ConnectionState.Closed
  }

  onOpen = () => {
    this.state = ConnectionState.Opened
  }

  onClose = () => {
    if (this.state == ConnectionState.Opening) {
      this.store.setErrorMessage("Connection to twitch failed, try refreshing the page")
    }

    this.state = ConnectionState.Closed
  }

  onMessage = (event: MessageEvent): Promise<any> => {
    const data = JSON.parse(event.data)

    switch (data.metadata.message_type) {
      case "session_welcome": {
        const sessionId = data.payload.session.id
        return this.handleSessionWelcome(sessionId)
      }
      case "session_reconnect": {
        const reconnectUrl = data.payload.session.reconnect_url
        return this.handleSessionReconnect(reconnectUrl)
      }
      case "revocation": {
        return this.handleRevocation()
      }
      case "notification": {
        return this.handleNotification(data)
      }
    }

    return Promise.resolve()
  }

  private handleNotification(data: ChannelPollMessage): Promise<any> {
    if (data.payload.event.id != this.store.pollId) {
      return Promise.resolve()
    }

    console.log(data)

    switch (data.payload.subscription.type) {
      case "channel.poll.begin": {
        return this.handleChannelPollBegin(data.payload.event.choices)
      }
      case "channel.poll.progress": {
        return this.handleChannelPollProgress(data.payload.event.choices)
      }
      case "channel.poll.end": {
        return this.handleChannelPollEnd(data.payload.event.choices, data.payload.event.id)
      }
    }

    return Promise.resolve()
  }

  private handleChannelPollEnd(choices: Choice[], eventId: string): Promise<any> {
    this.store.setInProgress(false)
    this.updateChannelPollVotes(choices)

    return axios.post(
      "/poll_result",
      {
        result: this.store.winningChoice.replace(": ", ","),
        event_id: eventId
      },
      {withCredentials: true}
    ).then(result => {
      if (result.status != 200) {
        this.store.setErrorMessage(
          "Failed to set poll result in the backend, poll result will not make it to the game :("
        )
        throw new Error(`Failed to set poll result in the backend, bad status: ${result.status}`)
      }

      return Promise.resolve()
    }).catch(reason => {
      this.store.setErrorMessage(
        "Failed to set poll result in the backend, poll result will not make it to the game :("
      )
      throw reason
    })
  }

  private handleChannelPollProgress(choices: Choice[]): Promise<any> {
    this.updateChannelPollVotes(choices)
    return Promise.resolve()
  }

  private handleChannelPollBegin(choices: Choice[]): Promise<any> {
    this.store.setInProgress(true)
    this.updateChannelPollVotes(choices)
    return Promise.resolve()
  }

  private updateChannelPollVotes(choices: Choice[]) {
    choices.forEach(choice => {
      this.store.setVotes(choice.title, choice.votes + choice.bits_votes + choice.channel_points_votes)
    })
  }

  private handleRevocation(): Promise<any> {
    this.store.setErrorMessage(
        "Received revocation message, did you disconnect the aoe4-twitch-integration connection in your twitch account? Maybe try refreshing the page"
    )
    this.disconnect()
    return Promise.resolve()
  }

  private handleSessionWelcome(sessionId: string): Promise<any> {
    return Promise.all(
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
  }

  private handleSessionReconnect(reconnectUrl: string): Promise<any> {
    this.disconnect()
    this.connect(reconnectUrl)
    return Promise.resolve()
  }

  onError = () => {
    if (this.state == ConnectionState.Opening) {
      this.store.setErrorMessage("Connection to twitch failed, try refreshing the page")
    }

    this.state = ConnectionState.Closed
  }

  private subscribe(eventType: string, sessionId: string) {
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
}

export { EventSubWsClient, ConnectionState, type WebSocketFactory}