<template>
  <Menubar :model="visibleItems" class="mb-2">
    <template #end>
      <img alt="logo" src="/logo-favicon.svg" height="40" class="mr-2"/>
    </template>
  </Menubar>
</template>

<script setup lang="ts">
import Menubar from "primevue/menubar";
import {computed, ref} from "vue";
import {useUserStore} from "@/stores/user";
import {useRouter} from "vue-router";

const userStore = useUserStore()
const router = useRouter()

const allItems = ref([
  { label: "Home", to: "/", visible: true },
  { label: "About", to: "/About", visible: true },
  { label: "Connect With Twitch", to: "ConnectWithTwitch", visible: !userStore.isAuthenticated },
  { label: "Poll Management", to: "/PollManagement", visible: true},
  { label: "Instructions", to: "/Instructions", visible: true}
]);

router.afterEach(() => {
  allItems.value.filter(item => item.to == "ConnectWithTwitch")[0].visible = !userStore.isAuthenticated
})

const visibleItems = computed(() => allItems.value.filter(item => item.visible))

</script>
