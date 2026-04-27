<script setup lang="ts">
import { RouterView } from 'vue-router';
import EstudianteHeader from './EstudianteHeader.vue';
import EstudianteSidebar from './EstudianteSidebar.vue';
import { useUIStore } from '@/stores/ui';

const uiStore = useUIStore();
</script>

<template>
  <div class="min-h-screen bg-[#f8f9fc] dark:bg-black transition-colors duration-300 relative">
    <EstudianteHeader />
    <EstudianteSidebar />
    
    <!-- Overlay para móviles -->
    <div v-if="uiStore.isSidebarOpen" 
         @click="uiStore.closeSidebar"
         class="fixed inset-0 bg-black/50 backdrop-blur-sm z-[105] lg:hidden animate-in fade-in duration-300">
    </div>

    <main :class="[
            uiStore.isSidebarOpen ? 'lg:ml-72' : 'ml-0',
            'transition-all duration-300 p-4 md:p-10 pt-[100px] md:pt-[105px] min-h-screen relative'
          ]">
      <div class="max-w-7xl mx-auto">
        <RouterView />
      </div>
    </main>
  </div>
</template>