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

const route = useRoute()
const router = useRouter()

const showErrorMessage = ref(false)
const error = ref("")
const errorDescription = ref("")

axios.get("/twitch_access_token").then(result => {
  console.log(result)
})
</script>