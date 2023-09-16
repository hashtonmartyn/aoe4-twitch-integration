<template>
<Card class="mt-2">
  <template #title>About the Creator</template>
  <template #content>
    <p>
      I'm Henero, you might have seen me around in various twitch chats or discord servers. If you'd like to support my work consider following or gifting a sub to my twitch channel. I have a few other mods I've made such as Mongol Royale and you can find more about me at these links:
    </p>
    <div class="flex justify-content-center flex-wrap">
        <a
          href="https://www.ageofempires.com/mods/mods-search/?q=henero&game=4&modid=0&filter=0&status=&sort=popular&order=DESC"
          class="m-2">
          <Button label="My Other Mods" icon="pi pi-cog" class="p-button-raised p-button-link"></Button>
        </a>
        <a
          href="https://www.twitch.tv/heneroaoe"
          class="m-2">
          <Button label="My Twitch Channel" icon="pi pi-video" class="p-button-raised p-button-link"></Button>
        </a>
        <a
          href="https://github.com/hashtonmartyn/aoe4-twitch-integration"
          class="m-2">
          <Button label="aoe4-twitch-integration" icon="pi pi-github" class="p-button-raised p-button-link"></Button>
        </a>
    </div>
  </template>
</Card>
</template>

<script lang="ts" setup>
import Card from "primevue/card";
import Button from "primevue/button";

</script>