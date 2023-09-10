<template>
  <Message v-if="pollResultStore.errorMessage.length > 0" severity="error">
    {{ pollResultStore.errorMessage }}
  </Message>
  <Message v-if="automaticPollMessage.show" :severity="automaticPollMessage.severity">
    {{automaticPollMessage.message}}
  </Message>
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
      <div class="grid mb-4">
        <div class="col-12">
          <div class="flex justify-content-center">
            <label for="automatic" class="font-bold block"> Submit Polls Automatically </label>
          </div>
          <div class="flex justify-content-center">
            <ToggleButton
                v-model="pollConfigurationStore.automatic"
                onIcon="pi pi-check"
                offIcon="pi pi-times"
                class="w-5rem align-items-center justify-content-center"
                :disabled="automaticPollIntervalId != -1"
            />
          </div>
        </div>
        <div class="col-12" v-if="pollConfigurationStore.automatic">
          <div class="grid">
            <div class="lg:col-6">
              <label for="pollDuration" class="font-bold block"> Poll Duration (seconds) </label>
              <InputNumber
                  v-model="pollConfigurationStore.pollDuration"
                  :min="60"
                  :max="600"
                  inputId="pollInterval"
                  showButtons
                  style="width:100%"
                  :disabled="automaticPollIntervalId != -1"
              />
            </div>
            <div class="lg:col-6">
              <label for="pollInterval" class="font-bold block"> Time Between Polls (seconds) </label>
              <InputNumber
                  v-model="pollConfigurationStore.pollInterval"
                  :min="60"
                  :max="1200"
                  inputId="pollInterval"
                  showButtons
                  style="width:100%"
                  :disabled="automaticPollIntervalId != -1"
              />
            </div>
          </div>
        </div>
      </div>

      <div class="flex flex-column">
        <template v-for="player in players" :key="player.id">
          <div
              class="flex align-items-center justify-content-center h-2rem bg-primary font-bold border-round m-2"
              v-if="player.id <= Math.min(5, numberOfPlayers)" :key="player.id"
          >
            {{player.option}} {{player.colour}}
          </div>
        </template>
      </div>
      <span class="p-buttonset flex justify-content-center mt-4" v-if="!pollConfigurationStore.automatic">
        <Button
            label="Randomise Options"
            icon="pi pi-sync"
            severity="warning"
            @click="pollConfigurationStore.randomiseOptions()"
            :disabled="!canStartPoll"
            class="w-12rem"
        />
        <Button
            label="Submit Poll"
            icon="pi pi-check"
            @click="submitPoll"
            :disabled="!canStartPoll"
            class="w-12rem"
        />
      </span>
      <span class="p-buttonset flex justify-content-center mt-4" v-if="pollConfigurationStore.automatic">
        <Button
            label="Stop Automatic Polls"
            icon="pi pi-times"
            severity="warning"
            @click="stopAutomaticPolls"
            :disabled="automaticPollIntervalId == -1"
            class="w-14rem"
        />
        <Button
            label="Start Automatic Polls"
            icon="pi pi-check"
            @click="startAutomaticPolls"
            :disabled="automaticPollIntervalId != -1"
            class="w-14rem"
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
import ToggleButton from "primevue/togglebutton";

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

let automaticPollIntervalId = ref(-1)
const automaticPollMessage = ref({
  show: false,
  message: "",
  severity: ""
})
function startAutomaticPolls() {
  automaticPollMessage.value.show = true
  automaticPollMessage.value.message = `Starting automatic polls, first poll will be submitted in ${pollConfigurationStore.pollInterval} seconds`
  automaticPollMessage.value.severity = "success"

  automaticPollIntervalId.value = window.setInterval(() => {
    pollConfigurationStore.randomiseOptions()
    submitPoll()
  }, (pollConfigurationStore.pollInterval + pollConfigurationStore.pollDuration) * 1000)
}

function stopAutomaticPolls() {
  automaticPollMessage.value.show = true
  automaticPollMessage.value.message = "Stopping automatic polls"
  automaticPollMessage.value.severity = "success"
  pollSubmissionMessage.value.content = ""
  pollSubmissionMessage.value.severity = ""

  clearInterval(automaticPollIntervalId.value)
  automaticPollIntervalId.value = -1
}

function submitPoll() {
  pollResultStore.reset()
  pollSubmissionMessage.value.content = ""
  pollSubmissionMessage.value.severity = ""

  axios.post(
    `${config.twitchHelixApiBaseUri}/polls`,
    {
      broadcaster_id: userStore.broadcasterId,
      title: "What chaos shall we cause?",
      choices: Object.values(players.value).filter(player => player.id <= Math.min(numberOfPlayers.value, 5)).map(player => {
        return {title: `${player.option}${player.colour}`}
      }),
      duration: pollConfigurationStore.pollDuration,
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
  labels: [] as string[] | number[],
  datasets: [
    {
      label: "",
      data: [] as string[] | number[],
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

watch(
    () => [pollConfigurationStore.numberOfPlayers],
    ([numberOfPlayers]) => {
      pollConfigurationStore.randomiseOptions()
    }
)

watch(
    () => [pollConfigurationStore.pollDuration],
    ([pollDuration]) => {
      if (pollDuration >= pollConfigurationStore.pollInterval + 10) {
        pollConfigurationStore.pollInterval = pollDuration + 10
      }
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
