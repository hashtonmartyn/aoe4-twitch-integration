<script setup lang="ts">
import { RouterView } from 'vue-router'
import PageHeader from "@/components/PageHeader.vue";
</script>

<template>
  <header>
    <nav>
      <PageHeader/>
    </nav>
  </header>
  <main>
    <RouterView />
  </main>
</template>

<style>
html {
  font-family: var(--font-family);
  max-width: 1400px;
  margin: auto;
}
</style>
