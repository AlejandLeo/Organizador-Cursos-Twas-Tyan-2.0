<script setup lang="ts">
import { RouterView } from 'vue-router';
import AppHeader from '@/layouts/AppHeader.vue';
import AppSidebar from '@/layouts/AppSidebar.vue';
import { useUIStore } from '@/stores/ui';
import { useRoute } from 'vue-router';

const uiStore = useUIStore();
const route = useRoute();
</script>

<template>
  <div class="min-h-screen bg-[#f8f9fc] dark:bg-black transition-colors duration-300 relative">
    <AppHeader />
    <AppSidebar v-if="!route.meta.hideSidebar" />
    
    <!-- Overlay para móviles -->
    <div v-if="uiStore.isMobile && uiStore.isSidebarOpen" 
         @click="uiStore.closeSidebar"
         class="fixed inset-0 bg-black/50 backdrop-blur-sm z-[40] animate-in fade-in duration-300">
    </div>

    <main :class="[
            uiStore.isSidebarOpen && !uiStore.isMobile && !route.meta.hideSidebar ? 'ml-72' : 'ml-0',
            route.meta.fullWidth ? 'p-0 pt-[80px] md:pt-[85px]' : 'p-4 md:p-10 pt-[100px] md:pt-[105px]',
            'transition-all duration-300 min-h-screen relative flex flex-col'
          ]">
      <div :class="route.meta.fullWidth ? 'w-full flex-1 flex' : 'max-w-7xl mx-auto w-full'">
        <RouterView />
      </div>
    </main>
  </div>
</template>
