<template>
  user id: {{userId}}
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
import {useTwitchClientStore} from "@/stores/twitchClient";

const userStore = useUserStore()
const twitchClientStore = useTwitchClientStore()

const userId = ref("")
const clientId = ref("")
const clientSecret = ref("")
const accessToken = ref("")

axios.get("http://localhost:8080/units/users")
  .then(result => {
    userId.value = result.data.data[0].id
    userStore.setUserId(userId.value)

    return axios.get("http://localhost:8080/units/clients")
  }).then(result => {
    clientId.value = result.data.data[0].ID
    clientSecret.value = result.data.data[0].Secret

    twitchClientStore.setClientId(clientId.value)

    return axios.post(
  `http://localhost:8080/auth/authorize?client_id=${clientId.value}&client_secret=${clientSecret.value}&grant_type=user_token&user_id=${userId.value}&scope=channel:manage:polls`
    )
  }).then(result => {
    accessToken.value = result.data.access_token
    userStore.setToken(accessToken.value)
  })
</script>
