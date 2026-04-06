<script setup lang="ts">
import { ref } from 'vue';
import { RouterView } from 'vue-router';
import AppHeader from '@/layouts/AppHeader.vue';
import AppSidebar from '@/layouts/AppSidebar.vue';

const sidebarOpen = ref(true);
</script>

<template>
  <div class="flex min-h-screen overflow-x-hidden bg-[#f8f9fc] dark:bg-black transition-colors duration-300">
    <AppHeader />
    <AppSidebar />
    <main class="flex-1 ml-72 p-10 mt-[75px] relative transition-colors duration-300">
      <div class="max-w-7xl mx-auto">
        <RouterView />
      </div>
    </main>
  </div>
</template>
