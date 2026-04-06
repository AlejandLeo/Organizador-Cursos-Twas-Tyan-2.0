<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router'
import { ref, computed } from 'vue'
import AppNavbar from './layouts/AppNavbar.vue'
import AppFooter from './layouts/AppFooter.vue'

const showVideos = ref(false)
const route = useRoute()
const isDashboard = computed(() => route.path.startsWith('/coordinador'))
</script>

<template>
  <div class="min-h-screen flex flex-col font-sans antialiased text-gray-900 bg-white dark:bg-gray-950 dark:text-gray-100 transition-colors duration-300">      
    <AppNavbar v-if="!isDashboard" />
    <main :class="[!isDashboard ? 'pt-[90px]' : '', 'flex-grow']"> <!-- Padding top to avoid content being hidden by fixed navbar -->
      <RouterView />
    </main>

    <!-- Floating Welcome Videos Button -->
    <button
      v-if="!isDashboard"
      @click="showVideos = true" 
      class="fixed bottom-6 right-6 z-50 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white p-4 rounded-full shadow-2xl hover:shadow-blue-500/50 transition-all transform hover:scale-110 flex items-center justify-center gap-2 group"
      title="Ver Videos de Bienvenida"
    >
      <i class="fas fa-play-circle text-2xl group-hover:animate-pulse"></i>
      <span class="max-w-0 overflow-hidden whitespace-nowrap opacity-0 group-hover:max-w-xs group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 font-semibold tracking-wide">Videos de Bienvenida</span>
    </button>

    <!-- Modal/Dialog for Videos (Simple placeholder implementation) -->
    <div v-if="showVideos" class="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-200 dark:border-gray-800 animate-in fade-in duration-300 transform scale-100">
        <div class="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
          <h2 class="text-2xl font-bold text-gray-800 dark:text-gray-100 uppercase tracking-wide">Videos de Bienvenida</h2>
          <button @click="showVideos = false" class="text-gray-500 hover:text-red-500 hover:rotate-90 transition-all transform w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700">
            <i class="fas fa-times text-xl"></i>
          </button>
        </div>
        <div class="p-8 overflow-y-auto flex-1 bg-gray-50 dark:bg-gray-900">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <!-- Video Placeholder 1 -->
            <div class="space-y-4 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
               <div class="aspect-video bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center relative overflow-hidden group cursor-pointer">
                  <i class="fas fa-play text-4xl text-gray-400 dark:text-gray-500 group-hover:text-blue-500 group-hover:scale-125 transition-all duration-300 z-10"></i>
                  <div class="absolute inset-0 bg-black/10 group-hover:bg-black/40 transition-colors"></div>
               </div>
               <h3 class="font-bold text-lg text-center text-gray-800 dark:text-gray-200">Palabras del Rector</h3>
            </div>
             <!-- Video Placeholder 2 -->
            <div class="space-y-4 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
               <div class="aspect-video bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center relative overflow-hidden group cursor-pointer">
                  <i class="fas fa-play text-4xl text-gray-400 dark:text-gray-500 group-hover:text-blue-500 group-hover:scale-125 transition-all duration-300 z-10"></i>
                  <div class="absolute inset-0 bg-black/10 group-hover:bg-black/40 transition-colors"></div>
               </div>
               <h3 class="font-bold text-lg text-center text-gray-800 dark:text-gray-200">Bienvenida Decanato</h3>
            </div>
          </div>
        </div>
      </div>
    </div>

    <AppFooter v-if="!isDashboard" />
  </div>
</template>

