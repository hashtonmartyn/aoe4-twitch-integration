<script lang="ts" setup>
import axios from "axios";
import {ref} from "vue";

</script>

<template>
  <main>
    <a
        :href="`https://id.twitch.tv/oauth2/authorize?client_id=j14afo5k3gvebt6sytw7p7t5o8syyg&redirect_uri=http://localhost:8000/login/twitch&scope=channel%3Amanage%3Apolls+channel%3Aread%3Apolls&response_type=code`">Authorization code grant
    </a>
    <br/>
    <a
        :href="`https://id.twitch.tv/oauth2/authorize?client_id=j14afo5k3gvebt6sytw7p7t5o8syyg&redirect_uri=http://localhost:5173/twitch_auth&scope=channel%3Amanage%3Apolls+channel%3Aread%3Apolls&response_type=token`">Implicit grant flow
    </a>
    <br/>
    <a :href="`http://localhost:8000/login/twitch`">Fastapi</a>
  </main>
</template>
