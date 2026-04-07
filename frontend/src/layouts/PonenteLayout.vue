<script setup lang="ts">
import { RouterView } from 'vue-router';
import PonenteHeader from '@/layouts/PonenteHeader.vue';
import PonenteSidebar from '@/layouts/PonenteSidebar.vue';
</script>

<template>
  <div class="flex min-h-screen overflow-x-hidden bg-slate-50 dark:bg-black transition-colors duration-300">
    <PonenteHeader />
    <PonenteSidebar />
    <main class="flex-1 ml-64 lg:ml-72 p-6 md:p-10 mt-[75px] relative transition-colors duration-300">
      <div class="max-w-6xl mx-auto h-full">
        <RouterView />
      </div>
    </main>
  </div>
</template>