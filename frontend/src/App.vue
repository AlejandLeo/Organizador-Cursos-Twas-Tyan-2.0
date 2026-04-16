<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router'
import { computed } from 'vue'
import AppNavbar from './layouts/AppNavbar.vue'
import AppFooter from './layouts/AppFooter.vue'
import WelcomeWidget from './components/WelcomeWidget.vue'

const route = useRoute()
const isDashboard = computed(() => route.path.startsWith('/coordinador') || route.path.startsWith('/ponente') || route.path.startsWith('/estudiante'))
</script>

<template>
  <div class="min-h-screen flex flex-col font-sans antialiased text-gray-900 bg-white dark:bg-gray-950 dark:text-gray-100 transition-colors duration-300">      
    <AppNavbar v-if="!isDashboard" />
    <main :class="[!isDashboard ? 'pt-[90px]' : '', 'flex-grow']">
      <RouterView />
    </main>

    <!-- Componente Dedicado para Videos de Bienvenida -->
    <WelcomeWidget v-if="!isDashboard" />

    <AppFooter v-if="!isDashboard" />
  </div>
</template>

