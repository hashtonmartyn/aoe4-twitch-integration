<template>
  <Message v-if="pollResultStore.errorMessage.length > 0" severity="error">{{ pollResultStore.errorMessage }}</Message>
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
        <label for="playerColour" class="font-bold block mb-2 mr-2"> Player{{ n }} colour </label>
          <Dropdown
              v-model="pollConfigurationStore.players[n].colour"
              :options="allColours"
              optionValue="value"
              optionLabel="name"
          />
      </div>
    </AccordionTab>
    <AccordionTab header="Poll Configuration">
      <div class="flex flex-column">
        <template v-for="player in players" :key="player.id">
          <div
              class="flex align-items-center justify-content-center h-2rem bg-primary font-bold border-round m-2"
              v-if="player.id <= numberOfPlayers" :key="player.id"
          >
            {{player.option}} {{player.colour}}
          </div>
        </template>
      </div>
      <span class="p-buttonset flex justify-content-center mt-4">
        <Button
            label="Randomise Options"
            icon="pi pi-sync"
            severity="warning"
            @click="pollConfigurationStore.randomiseOptions()"
            :disabled="!canStartPoll"
        />
        <Button
            label="Submit Poll"
            icon="pi pi-check"
            @click="submitPoll"
            :disabled="!canStartPoll"
        />
      </span>
    </AccordionTab>
  </Accordion>
  <h1 class="flex justify-content-center flex-wrap">Poll Results</h1>
  <Chart type="bar" :data="chartData" :options="chartOptions" class="mt-8"/>
</template>

<script async lang="ts" setup>
import {useUserStore} from "@/stores/user";
import {useRouter} from "vue-router";
import { EventSubWsClient, type WebSocketFactory} from "@/clients/twitchEventSubWsClient";
import {computed, reactive, ref, watch} from "vue";
import Chart from "primevue/chart";
import Message from "primevue/message";
import InputNumber from "primevue/inputnumber";
import Dropdown from "primevue/dropdown";
import Accordion from "primevue/accordion";
import AccordionTab from "primevue/accordiontab";
import Button from "primevue/button";
import axios from "axios";
import config from "../config";
import {Colour, usePollConfigurationStore} from "@/stores/pollConfiguration";
import {storeToRefs} from "pinia";
import {usePollResultStore} from "@/stores/pollResult";

const userStore = useUserStore()
const router = useRouter()
const pollConfigurationStore = usePollConfigurationStore()
pollConfigurationStore.randomiseOptions()

const pollResultStore = usePollResultStore()

const {inProgress} = storeToRefs(pollResultStore)

const inProgressReactive = reactive({
  inProgress: inProgress
})

const canStartPoll = computed(() => {
  const canStart = pollConfigurationStore.isPollConfigurationValid && !inProgressReactive.inProgress
  console.log(`canStartPoll: ${canStart}`)
  return canStart
})

const allColours = ref([
  {value: Colour[Colour.Blue], name: Colour.Blue},
  {value: Colour[Colour.Red], name: Colour.Red},
  {value: Colour[Colour.Green], name: Colour.Green},
  {value: Colour[Colour.Yellow], name: Colour.Yellow},
  {value: Colour[Colour.Purple], name: Colour.Purple},
  {value: Colour[Colour.Orange], name: Colour.Orange},
  {value: Colour[Colour.Teal], name: Colour.Teal},
  {value: Colour[Colour.Pink], name: Colour.Pink}
])

class WsFactory implements WebSocketFactory {
  build(url: string): WebSocket {
    return new WebSocket(url)
  }
}

const {
  players,
  numberOfPlayers
} = storeToRefs(pollConfigurationStore)

if (!userStore.isAuthenticated) {
  router.push("/ConnectWithTwitch")
}

const pollSubmissionMessage = ref({
  severity: "",
  content: ""
})

function submitPoll() {
  pollResultStore.reset()
  pollSubmissionMessage.value.content = ""
  pollSubmissionMessage.value.severity = ""

  axios.post(
    `${config.twitchHelixApiBaseUri}/polls`,
    {
      broadcaster_id: userStore.broadcasterId,
      title: "What chaos shall we cause?",
      choices: Object.values(players.value).filter(player => player.id <= numberOfPlayers.value).map(player => {
        return {title: `${player.option} ${player.colour}`}
      }),
      duration: 60,
      channel_points_voting_enabled: false,
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
      const pollId = result.data.data[0].id
      pollResultStore.setPollId(pollId)
    } else {
      pollSubmissionMessage.value.content = "Poll submission failed, try again or refresh the page maybe?"
      pollSubmissionMessage.value.severity = "error"
    }
  }).catch(_ => {
    pollSubmissionMessage.value.content = "Poll submission failed, try again or refresh the page maybe?"
    pollSubmissionMessage.value.severity = "error"
  })
}

let wsClient = new EventSubWsClient(
    config.twitchHelixApiBaseUri,
    userStore.broadcasterId,
    userStore.twitchAccessToken,
    config.twitchClientId,
    pollResultStore,
    new WsFactory()
)

wsClient.connect(config.twitchWebSocketUrl)

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

watch(
    () => [pollResultStore.titles, pollResultStore.votes],
    ([labels, votes]) => {
      chartData.value.labels = labels
      chartData.value.datasets[0].data = votes
    }
)

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
