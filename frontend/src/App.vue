<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router'
import { computed } from 'vue'
import AppNavbar from './layouts/AppNavbar.vue'
import AppFooter from './layouts/AppFooter.vue'
import ForcePasswordChange from './components/ForcePasswordChange.vue'

const route = useRoute()
// Rutas que tienen su propio layout (no necesitan navbar/footer globales)
const isDashboard = computed(() =>
  route.path.startsWith('/coordinador') ||
  route.path.startsWith('/ponente') ||
  route.path.startsWith('/estudiante') ||
  route.path.startsWith('/admin') ||
  route.path.startsWith('/logistica')
)

const showFooter = computed(() => route.path === '/' || route.path.startsWith('/verificar-certificado'))
</script>

<template>
  <div class="min-h-[100vh] flex flex-col font-sans antialiased text-gray-900 bg-white dark:bg-gray-950 dark:text-gray-100 transition-colors duration-300">

    <AppNavbar v-if="!isDashboard" />
    <main class="flex-grow">
      <RouterView />
    </main>
    <AppFooter v-if="showFooter" />

    <!-- Overlay de seguridad global -->
    <ForcePasswordChange />
  </div>
</template>


