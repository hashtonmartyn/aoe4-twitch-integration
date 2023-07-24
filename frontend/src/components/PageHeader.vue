<template>
  <Menubar :model="items">
    <template #end>
      <img alt="logo" src="/logo-favicon.svg" height="40" class="mr-2"/>
    </template>
  </Menubar>
</template>

<script setup lang="ts">
import Menubar from "primevue/menubar";
import { ref } from "vue";

const items = ref([
  { label: 'Home', to: '/' },
  { label: 'About', to: '/TwitchAuth'},
  { label: 'Connect With Twitch', to: 'Login'},
  { label: 'Poll Management', to: '/PollManagement'}
]);

</script>
