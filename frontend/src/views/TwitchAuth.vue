<template>
  this is the twitch redirect page
  <Dialog v-model:visible="showErrorMessage" modal>
    <template #header>
      <i class="pi pi-exclamation-triangle"/>
      Failed to connect to Twitch
    </template>
    <p>Error: {{error}}</p>
    <p>Error description: {{errorDescription}}</p>
  </Dialog>
</template>

<script setup lang="ts">
import {useRoute, useRouter} from "vue-router";
import {ref} from "vue";
import Dialog from 'primevue/dialog';
import axios from "axios";
import {useUserStore} from "@/stores/user";

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

axios.get("/twitch_access_token", {withCredentials: true}).then(result => {
  const token = result.data.access_token
  userStore.setToken(token)
  console.log(result)
})

setTimeout(() => {
  console.log("after some time")
}, 3000)
</script>