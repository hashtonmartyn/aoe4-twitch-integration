import type {MetaData} from "@/clients/websocketMessages/generic";

type Choice = {
  title: string
  bits_votes: number,
  channel_points_votes: number
  votes: number
}

type Subscription = {
  type: string
}

type Event_ = {
  choices: Choice[]
  id: string
}

type Payload = {
  subscription: Subscription
  event: Event_
}

type ChannelPollMessage = {
  metadata: MetaData,
  payload: Payload
}

export type {
  ChannelPollMessage,
  Choice
}