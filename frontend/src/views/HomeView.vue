<template>
  <img alt="logo" src="logo-editor.svg" class="hero"/>

  <div class="grid lg:mt-8">
    <div class="col-12 lg:col-8">
      <Card class="whatIsThis">
        <template #title>What is this?</template>
        <template #content>
          <p>
            Other games are integrated with twitch so that chat can influence gameplay, this can provide fun and interesting
            new gameplay options for you and your viewers to enjoy. Now Age of Empires 4 has this functionality too! Using
            this website along with a few other tools your twitch chat can spawn units, give resources, delete buildings,
            and much more as you battle for victory. Simply start a poll using this site and let chat mess with your game.
          </p>
        </template>
      </Card>
    </div>
    <div class="col-12 lg:col-4">
      <img src="battle.png" alt="battle" class="battle">
    </div>
  </div>

  <h1 class="justify-content-center flex lg:mt-8">How Does It Work?</h1>

  <div class="card">
    <Timeline :value="events" align="alternate" class="customized-timeline">
      <template #marker="slotProps">
        <span class="flex w-2rem h-2rem align-items-center justify-content-center text-white border-circle z-1 shadow-1">
          <i :class="slotProps.item.icon"></i>
        </span>
      </template>
      <template #content="slotProps">
        <Card>
          <template #title>
            {{ slotProps.item.title }}
          </template>
          <template #content>
            <p>
              {{ slotProps.item.description }}
            </p>
          </template>
        </Card>
      </template>
    </Timeline>
  </div>
</template>

<script setup lang="ts">
import Card from "primevue/card";
import Timeline from "primevue/timeline";
import { ref } from "vue";

const events = ref([
  {title: "This Website", icon: "pi pi-globe", description: "Use this website to create polls in your twitch chat. The result will be stored and made available for the powershell script."},
  {title: "Twitch Chat", icon: "pi pi-users", description: "Your chat will vote on options to influence the game, only the winning option will be used."},
  {title: "Powershell Script", icon: "pi pi-code", description: "One player must run a powershell script which retrieves the poll results from this website and makes them available to the mod by saving them to the player's PC."},
  {title: "Mod", icon: "pi pi-cog", description: "Each player must download the mod. The mod will retrieve poll results from the powershell script, interpret, and action them in-game"},
]);

</script>

<style scoped>
.hero {
  width: 100%;
  height: 50vh;
}

.battle {
  width: 100%;
  height: auto;
}

.whatIsThis {
  height: 100%;
}


@media screen and (max-width: 960px) {
  ::v-deep(.customized-timeline) {
    .p-timeline-event:nth-child(even) {
      flex-direction: row !important;

      .p-timeline-event-content {
        text-align: left !important;
      }
    }

    .p-timeline-event-opposite {
      flex: 0;
    }

    .p-card {
      margin-top: 1rem;
    }
  }
}

</style>
