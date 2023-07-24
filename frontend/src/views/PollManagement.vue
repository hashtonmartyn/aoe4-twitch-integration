<template>
  <Message v-if="wsErrorMessage.length > 0" severity="error">{{ wsErrorMessage }}</Message>
  <Message v-if="pollSubmissionMessage.content.length > 0" :severity="pollSubmissionMessage.severity">
    {{pollSubmissionMessage.content}}
  </Message>

  <Accordion :active-index="0">
    <AccordionTab header="Game Configuration">
      <div class="p-inputgroup flex-1 mb-4">
        <label for="numberOfPlayers" class="font-bold block mr-2"> Number of players </label>
        <InputNumber v-model="numberOfPlayers" :min="2" :max="8" inputId="numberOfPlayers" showButtons />
      </div>

      <div v-for="n in numberOfPlayers" class="p-inputgroup flex-1 mb-2" :key="n">
        <label for="playerOneName" class="font-bold block mb-2 mr-2"> Player{{ n }} name </label>
        <InputText v-model="players[n].name"></InputText>
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
        <Button label="Randomise Options" icon="pi pi-sync" severity="warning" @click="randomiseOptions" :disabled="!isPollConfigurationValid()" />
        <Button label="Submit Poll" icon="pi pi-check" @click="submitPoll" :disabled="!isPollConfigurationValid()" />
      </span>
    </AccordionTab>
  </Accordion>

  <Chart type="bar" :data="chartData" :options="chartOptions" class="mt-8"/>
</template>

<script async lang="ts" setup>
import {useUserStore} from "../stores/user";
import {useRouter} from "vue-router";
import {useTwitchClientStore} from "../stores/twitchClient";
import {ConnectionState, EventSubWsClient} from "../clients/twitchEventSubWsClient";
import {ref} from "vue";
import Chart from "primevue/chart";
import Message from "primevue/message";
import InputNumber from "primevue/inputnumber";
import InputText from "primevue/inputtext";
import Accordion from "primevue/accordion";
import AccordionTab from "primevue/accordiontab";
import Button from "primevue/button";
import axios from "axios";

const userStore = useUserStore()
const twitchClientStore = useTwitchClientStore()
const router = useRouter()

if (!userStore.isAuthenticated) {
  router.push("/Login")
}

const pollOptions = [
    "Send wolves to",
    "Take 1000g from",
    "Delete a house from",
    "Give 1000g to",
    "Give buff villagers to",
    "Send boars to",
    "Take 1000f from",
    "Give 1000s to"
]

const wsErrorMessage = ref("")
const pollSubmissionMessage = ref({
  severity: "",
  content: ""
})
const numberOfPlayers = ref(2)

function getRandomOption(): string {
  return pollOptions[Math.floor(Math.random() * pollOptions.length)]
}

const players = ref({
  1: {id: 1, name: "", option: getRandomOption()},
  2: {id: 2, name: "", option: getRandomOption()},
  3: {id: 3, name: "", option: getRandomOption()},
  4: {id: 4, name: "", option: getRandomOption()},
  5: {id: 5, name: "", option: getRandomOption()},
  6: {id: 6, name: "", option: getRandomOption()},
  7: {id: 7, name: "", option: getRandomOption()},
  8: {id: 8, name: "", option: getRandomOption()}
})

function randomiseOptions() {
  Object.values(players.value).forEach(player => player.option = getRandomOption())
}

function isPollConfigurationValid(): boolean {
  return Object.values(players.value)
      .filter(player => player.id <= numberOfPlayers.value)
      .map(player => player.name.length > 0)
      .reduce((accumulator, current) => {
        return accumulator && current
      })
}

function submitPoll() {
  pollSubmissionMessage.value.content = ""
  pollSubmissionMessage.value.severity = ""

  axios.post(
    `http://localhost:8080/mock/polls`,
    {
      broadcaster_id: userStore.userId,
      title: "What chaos shall we cause?",
      choices: Object.values(players.value).filter(player => player.id <= numberOfPlayers.value).map(player => {
        return {title: player.option}
      }),
      duration: 300,
      channel_points_voting_enabled: false,
      channel_points_per_vote: 200
    },
    {
      headers: {
        "Authorization": `Bearer ${userStore.twitchAccessToken}`,
        "Client-Id": twitchClientStore.clientId,
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
  }).catch(error => {
    pollSubmissionMessage.value.content = "Poll submission failed, try again or refresh the page maybe?"
    pollSubmissionMessage.value.severity = "error"
  })
}

const eventTypes = [
    "channel.poll.begin",
    "channel.poll.progress",
    "channel.poll.end"
]
function onOpen(event: Event){
  wsClient.setState(ConnectionState.Opening)
}
function onClose(event: CloseEvent){
  console.log(`Close event: ${event}`)
  if (wsClient.getState() == ConnectionState.Opening) {
    wsErrorMessage.value = "Connection to twitch failed, try refreshing the page"
  }
}
function onError(event: Event){}
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
      handleRevocation(data)
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
  if (data.payload.subscription.type.startsWith("channel.poll")) {
    handleChannelPollMessage(data)
  }
}

function handleChannelPollMessage(data: any) {
  const pollTitle = data.payload.event.title
  const choiceLabels = data.payload.event.choices.map((choice: any) => choice.title)
  const pollData = data.payload.event.choices.map((choice: any) => choice.bits_votes + choice.channel_points_votes + choice.votes)

  console.log(pollTitle)
  console.log(choiceLabels)
  console.log(pollData)

  chartData.value.labels = choiceLabels
  chartData.value.datasets[0].data = pollData
  chartData.value.datasets[0].label = pollTitle
}

function handleRevocation(data: any) {
  console.log("Handling revocation")
  wsErrorMessage.value = "Received revocation message, did you disconnect the aoe4-twitch-integration connection in your twitch account? Maybe try refreshing the page"
}

function handleSessionReconnect(data: any) {
  console.log("Handling session reconnect")
  wsClient.close()

  const reconnectUrl = data.payload.session.reconnect_url

  wsClient = new EventSubWsClient(
    reconnectUrl,
    twitchClientStore.apiBaseUrl,
    userStore.userId,
    userStore.twitchAccessToken,
    twitchClientStore.clientId,
    onOpen,
    onMessage,
    onClose,
    onError
  )
}

function handleSessionWelcome(data: any) {
  console.log("Handling session welcome")
  wsClient.setSessionId(data.payload.session.id)
    eventTypes.forEach((eventType, _) => {
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
    twitchClientStore.webSocketUrl,
    twitchClientStore.apiBaseUrl,
    userStore.userId,
    userStore.twitchAccessToken,
    twitchClientStore.clientId,
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
      // backgroundColor: ['rgba(255, 159, 64, 0.2)', 'rgba(75, 192, 192, 0.2)', 'rgba(54, 162, 235, 0.2)', 'rgba(153, 102, 255, 0.2)'],
      // borderColor: ['rgb(255, 159, 64)', 'rgb(75, 192, 192)', 'rgb(54, 162, 235)', 'rgb(153, 102, 255)'],
      borderWidth: 1
    }
  ]
});
const chartOptions = ref({
  scales: {
    y: {
      beginAtZero: true
    }
  }
});

</script>
