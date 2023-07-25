<template>
<Card>
  <template #title>About the Creator</template>
  <template #content>
    <p>
      I'm Henero, you might have seen me around in various twitch chats or discord servers. I have a few other mods I've made such as Mongol Royale and you can find more about me at these links:
    </p>
    <p>
      <a href="https://www.ageofempires.com/mods/mods-search/?q=henero&game=4&modid=0&filter=0&status=&sort=popular&order=DESC">
        <i class="pi pi-cog"/>
        My Other Mods
      </a>
    </p>
    <p>
      <a href="https://www.twitch.tv/heneroaoe">
        <i class="pi pi-user"/>
        My Twitch
      </a>
    </p>
    <p>
      <a href="https://github.com/hashtonmartyn/aoe4-twitch-integration">
        <i class="pi pi-github"/>
        aoe4-twitch-integration github
      </a>
    </p>
  </template>
</Card>
</template>

<script lang="ts" setup>
import Card from "primevue/card";
</script>