<script setup lang="ts">
import { RouterView } from 'vue-router';
import PonenteHeader from '@/layouts/PonenteHeader.vue';
import PonenteSidebar from '@/layouts/PonenteSidebar.vue';
import { useUIStore } from '@/stores/ui';

const uiStore = useUIStore();
</script>

<template>
  <div class="flex min-h-screen overflow-x-hidden bg-slate-50 dark:bg-black transition-colors duration-300">
    <PonenteHeader />
    <PonenteSidebar />
    
    <!-- Overlay para móviles -->
    <div v-if="uiStore.isSidebarOpen" 
         @click="uiStore.closeSidebar"
         class="fixed inset-0 bg-black/50 backdrop-blur-sm z-[105] lg:hidden animate-in fade-in duration-300">
    </div>

    <main :class="[
            uiStore.isSidebarOpen ? 'lg:ml-72' : 'ml-0',
            'transition-all duration-300 flex-1 p-6 md:p-10 mt-[75px] relative min-h-screen'
          ]">
      <div class="max-w-6xl mx-auto h-full">
        <RouterView />
      </div>
    </main>
  </div>
</template>