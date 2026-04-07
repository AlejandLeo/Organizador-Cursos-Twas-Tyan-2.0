<script setup lang="ts">
import { RouterView } from 'vue-router';
import EstudianteHeader from './EstudianteHeader.vue';
import EstudianteSidebar from './EstudianteSidebar.vue';
</script>

<template>
  <div class="flex min-h-screen overflow-x-hidden bg-[#f8f9fc] dark:bg-black transition-colors duration-300">
    <EstudianteHeader />
    <EstudianteSidebar />
    <main class="flex-1 ml-72 p-10 mt-[75px] relative transition-colors duration-300">
      <div class="max-w-7xl mx-auto">
        <RouterView />
      </div>
    </main>
  </div>
</template>