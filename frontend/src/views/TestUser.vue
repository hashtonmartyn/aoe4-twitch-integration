<template>
  broadcaster id: {{broadcasterId}}
  <br/>
  client id: {{clientId}}
  <br/>
  client secret: {{clientSecret}}
  <br/>
  access token: {{accessToken}}
</template>

<script lang="ts" setup>
import {ref} from "vue";
import axios from "axios";
import {useUserStore} from "@/stores/user";
import config from "../config";

const userStore = useUserStore()

const broadcasterId = ref("")
const clientId = ref("")
const clientSecret = ref("")
const accessToken = ref("")

axios.get("http://localhost:8080/units/users")
  .then(result => {
    broadcasterId.value = result.data.data[0].id
    userStore.setBroadcasterId(broadcasterId.value)

    return axios.get("http://localhost:8080/units/clients")
  }).then(result => {
    config.twitchClientId = result.data.data[0].ID


    clientId.value = result.data.data[0].ID
    clientSecret.value = result.data.data[0].Secret

    return axios.post(
  `http://localhost:8080/auth/authorize?client_id=${clientId.value}&client_secret=${clientSecret.value}&grant_type=user_token&user_id=${broadcasterId.value}&scope=channel:manage:polls`
    )
  }).then(result => {
    accessToken.value = result.data.access_token
    userStore.setToken(accessToken.value)
  })
</script>
