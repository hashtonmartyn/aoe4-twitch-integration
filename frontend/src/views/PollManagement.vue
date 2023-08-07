<template>
  <Message v-if="wsErrorMessage.length > 0" severity="error">{{ wsErrorMessage }}</Message>
  <Message v-if="pollSubmissionMessage.content.length > 0" :severity="pollSubmissionMessage.severity">
    {{pollSubmissionMessage.content}}
  </Message>

  <Message v-if="resultSubmissionMessage.content.length > 0" :severity="resultSubmissionMessage.severity">
    {{resultSubmissionMessage.content}}
  </Message>

  <Accordion :active-index="0">
    <AccordionTab header="Game Configuration">
      <div class="p-inputgroup flex-1 mb-4">
        <label for="numberOfPlayers" class="font-bold block mr-2"> Number of players </label>
        <InputNumber v-model="numberOfPlayers" :min="2" :max="8" inputId="numberOfPlayers" showButtons />
      </div>

      <div v-for="n in numberOfPlayers" class="p-inputgroup flex-1 mb-2" :key="n">
        <label for="playerOneName" class="font-bold block mb-2 mr-2"> Player{{ n }} name </label>
        <InputText v-model="pollConfigurationStore.players[n].name"></InputText>
      </div>
    </AccordionTab>
    <AccordionTab header="Poll Configuration">
      <div class="flex flex-column">
        <template v-for="player in players" :key="player.id">
          <div
              class="flex align-items-center justify-content-center h-2rem bg-primary font-bold border-round m-2"
              v-if="player.name.length > 0 && player.id <= numberOfPlayers" :key="player.id"
          >
            {{player.option}} {{player.name}}
          </div>
        </template>
      </div>
      <span class="p-buttonset flex justify-content-center mt-4">
        <Button label="Randomise Options" icon="pi pi-sync" severity="warning" @click="pollConfigurationStore.randomiseOptions()" :disabled="!pollConfigurationStore.isPollConfigurationValid" />
        <Button label="Submit Poll" icon="pi pi-check" @click="submitPoll" :disabled="!pollConfigurationStore.isPollConfigurationValid" />
      </span>
    </AccordionTab>
  </Accordion>
  <h1 class="flex justify-content-center flex-wrap">Poll Results</h1>
  <Chart type="bar" :data="chartData" :options="chartOptions" class="mt-8"/>
</template>

<script async lang="ts" setup>
import {useUserStore} from "@/stores/user";
import {useRouter} from "vue-router";
import {ConnectionState, EventSubWsClient} from "@/clients/twitchEventSubWsClient";
import {ref} from "vue";
import Chart from "primevue/chart";
import Message from "primevue/message";
import InputNumber from "primevue/inputnumber";
import InputText from "primevue/inputtext";
import Accordion from "primevue/accordion";
import AccordionTab from "primevue/accordiontab";
import Button from "primevue/button";
import axios from "axios";
import config from "../config";
import {usePollConfigurationStore} from "@/stores/pollConfiguration";
import {storeToRefs} from "pinia";

const userStore = useUserStore()
const router = useRouter()
const pollConfigurationStore = usePollConfigurationStore()
pollConfigurationStore.randomiseOptions()

const {
  players,
  numberOfPlayers
} = storeToRefs(pollConfigurationStore)

if (!userStore.isAuthenticated) {
  router.push("/ConnectWithTwitch")
}

const wsErrorMessage = ref("")
const pollSubmissionMessage = ref({
  severity: "",
  content: ""
})
const resultSubmissionMessage = ref({
  severity: "",
  content: ""
})

let lastPollEventId = ""

function submitPoll() {
  pollSubmissionMessage.value.content = ""
  pollSubmissionMessage.value.severity = ""

  axios.post(
    `http://localhost:8080/mock/polls`,
    {
      broadcaster_id: userStore.broadcasterId,
      title: "What chaos shall we cause?",
      choices: Object.values(players.value).filter(player => player.id <= numberOfPlayers.value).map(player => {
        return {title: `${player.option} ${player.name}`}
      }),
      duration: 300,
      channel_points_voting_enabled: false,
      channel_points_per_vote: 200
    },
    {
      headers: {
        "Authorization": `Bearer ${userStore.twitchAccessToken}`,
        "Client-Id": config.twitchClientId,
        "Content-Type": "application/json"
      }
    }
  ).then(result => {
    if (result.status == 200) {
      pollSubmissionMessage.value.content = "Poll submission succeeded"
      pollSubmissionMessage.value.severity = "success"
    } else {
      pollSubmissionMessage.value.content = "Poll submission failed, try again or refresh the page maybe?"
      pollSubmissionMessage.value.severity = "error"
    }
  }).catch(_ => {
    pollSubmissionMessage.value.content = "Poll submission failed, try again or refresh the page maybe?"
    pollSubmissionMessage.value.severity = "error"
  })
}

const eventTypes = [
    "channel.poll.begin",
    "channel.poll.progress",
    "channel.poll.end"
]
function onOpen(){
  wsClient.setState(ConnectionState.Opening)
}
function onClose(event: CloseEvent){
  console.log(`Close event: ${event}`)
  if (wsClient.getState() == ConnectionState.Opening) {
    wsErrorMessage.value = "Connection to twitch failed, try refreshing the page"
  }
}
function onError(){}
function onMessage(event: MessageEvent){
  const data = JSON.parse(event.data)
  switch (data.metadata.message_type) {
    case "session_welcome": {
      handleSessionWelcome(data)
      break
    }
    case "session_reconnect": {
      handleSessionReconnect(data)
      break
    }
    case "revocation": {
      handleRevocation()
      break
    }
    case "notification": {
      handleNotification(data)
      break
    }
    case "session_keepalive": {
      break
    }
    default: {
      console.log(data)
    }
  }
}

function handleNotification(data: any) {
  console.log(data)
  if (data.payload.event.id == lastPollEventId) {
    return
  }

  lastPollEventId = data.payload.event.id

  if (data.payload.subscription.type.startsWith("channel.poll")) {
    handleChannelPollMessage(data)
  }

  if (data.payload.subscription.type == "channel.poll.end") {
    handleChannelPollEnd(lastPollEventId)
  }
}

function handleChannelPollEnd(eventId: string) {
  resultSubmissionMessage.value.content = ""
  resultSubmissionMessage.value.severity = ""

  axios.post(
      "/poll_result",
      {
        result: winningChoice.value,
        event_id: eventId
      },
      {withCredentials: true}
  ).then(result => {
    if (result.status != 200) {
      resultSubmissionMessage.value.content = "Failed to set poll result in the backend, poll result will not make it to the game :("
      resultSubmissionMessage.value.severity = "error"
    }
  }).catch(_ => {
    resultSubmissionMessage.value.content = "Failed to set poll result in the backend, poll result will not make it to the game :("
    resultSubmissionMessage.value.severity = "error"
  })
}

const winningChoice = ref("")

function handleChannelPollMessage(data: any) {
  const choiceLabels = data.payload.event.choices.map((choice: any) => choice.title)
  const pollData = data.payload.event.choices.map((choice: any) => choice.bits_votes + choice.channel_points_votes + choice.votes)

  winningChoice.value = choiceLabels[pollData.indexOf(Math.max(...pollData))]

  chartData.value.labels = choiceLabels
  chartData.value.datasets[0].data = pollData
}

function handleRevocation() {
  console.log("Handling revocation")
  wsErrorMessage.value = "Received revocation message, did you disconnect the aoe4-twitch-integration connection in your twitch account? Maybe try refreshing the page"
}

function handleSessionReconnect(data: any) {
  console.log("Handling session reconnect")
  wsClient.close()

  const reconnectUrl = data.payload.session.reconnect_url

  wsClient = new EventSubWsClient(
    reconnectUrl,
    config.twitchHelixApiBaseUri,
    userStore.broadcasterId,
    userStore.twitchAccessToken,
    config.twitchClientId,
    onOpen,
    onMessage,
    onClose,
    onError
  )
}

function handleSessionWelcome(data: any) {
  console.log("Handling session welcome")
  wsClient.setSessionId(data.payload.session.id)
    eventTypes.forEach(eventType => {
      wsClient.subscribe(eventType).then(subscribed => {
        if (!subscribed) {
          console.log(`Failed to subscribe to event ${eventType}`)
          return
        }

        console.log(`Subscribed to event ${eventType}`)
      })
    })
}

let wsClient = new EventSubWsClient(
    config.twitchWebSocketUrl,
    config.twitchHelixApiBaseUri,
    userStore.broadcasterId,
    userStore.twitchAccessToken,
    config.twitchClientId,
    onOpen,
    onMessage,
    onClose,
    onError
)

const chartData = ref({
  labels: [],
  datasets: [
    {
      label: "",
      data: [],
      borderWidth: 1
    }
  ]
});
const chartOptions = ref({
  plugins: {
    legend: {
      display: false
    },
    title: {
      display: false,
      text: "What chaos shall we cause?"
    }
  },
  scales: {
    x: {
      grid: {
        display: false
      }
    },
    y: {
      beginAtZero: true,
      grid: {
        display: false
      }
    }
  }
});

</script>
