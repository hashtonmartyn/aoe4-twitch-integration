<template>
  <Message severity="success">Twitch authentication successful, redirecting you to Poll Management</Message>
  <Dialog v-model:visible="showErrorMessage" modal>
    <template #header>
      <i class="pi pi-exclamation-triangle"/>
      Failed to connect to Twitch
    </template>
    <p>Error: {{error}}</p>
    <p>Error description: {{errorDescription}}</p>
    <p>Try clicking the Connect With Twitch button again?</p>
  </Dialog>
</template>

<script setup lang="ts">
import {useRoute, useRouter} from "vue-router";
import {ref} from "vue";
import Dialog from 'primevue/dialog';
import axios from "axios";
import {useUserStore} from "@/stores/user";
import Message from "primevue/message";

const userStore = useUserStore()

const route = useRoute()
const router = useRouter()

const showErrorMessage = ref(false)
const error = ref("")
const errorDescription = ref("")

if (route.query.error != null) {
  error.value = <string>route.query.error
  errorDescription.value = <string>route.query.error_description
  showErrorMessage.value = true
}

axios.get("/twitch_session_data", {withCredentials: true}).then(result => {
  const token = result.data.access_token
  const broadcasterId = result.data.broadcaster_id
  userStore.setToken(token)
  userStore.setBroadcasterId(broadcasterId)
  console.log(result)
})

setTimeout(() => {
  if (!showErrorMessage.value) {
    router.push("/PollManagement")
  }
}, 3000)
</script>