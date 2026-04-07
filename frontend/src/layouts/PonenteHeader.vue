<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const isDark = ref(false)
const isProfileOpen = ref(false)
const profileDropdownRef = ref<HTMLElement | null>(null)

const toggleDark = () => {
  isDark.value = !isDark.value
  document.documentElement.classList.toggle('dark', isDark.value)
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
}

const toggleProfile = () => {
  isProfileOpen.value = !isProfileOpen.value
}

const closeProfile = (e: MouseEvent) => {
  if (profileDropdownRef.value && !profileDropdownRef.value.contains(e.target as Node)) {
    isProfileOpen.value = false
  }
}

const goToProfile = () => {
  isProfileOpen.value = false
  router.push({ name: 'ponente-datos' })
}

onMounted(() => {
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    isDark.value = true
    document.documentElement.classList.add('dark')
  }
  document.addEventListener('click', closeProfile)
})

onUnmounted(() => {
  document.removeEventListener('click', closeProfile)
})
</script>

<template>
  <header class="fixed top-0 left-0 right-0 h-[75px] bg-white dark:bg-gray-900 border-b border-slate-200 dark:border-gray-800 z-[100] px-4 md:px-8 flex items-center justify-between shadow-sm transition-colors duration-300">       
    <div class="flex items-center flex-1 space-x-6">
      <div class="hidden md:flex flex-col flex-shrink-0 cursor-pointer border-r border-slate-200 dark:border-gray-800 pr-6">
        <h2 class="text-primary-dark dark:text-white font-black italic text-2xl tracking-tighter leading-none">twas</h2>
        <p class="text-[6px] leading-tight text-primary-dark/60 dark:text-gray-400 uppercase font-bold tracking-tighter">The World Academy of Sciences</p>
      </div>

      <h1 class="text-base md:text-lg font-black text-umsa-blue dark:text-blue-500 tracking-widest uppercase italic hidden lg:block border-r border-slate-200 dark:border-gray-800 pr-6">
        Gestión Expositor
      </h1>
    </div>

    <div class="flex items-center space-x-2 md:space-x-4 pl-4 shrink-0">        
      <button
        @click="toggleDark"
        class="w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 dark:bg-gray-800 text-slate-500 dark:text-gray-400 hover:text-umsa-blue dark:hover:text-blue-500 transition-colors shadow-sm border border-slate-200 dark:border-gray-700 mx-1 md:mx-2"
        aria-label="Toggle Dark Mode"
      >
        <span class="material-symbols-outlined text-lg">{{ isDark ? 'light_mode' : 'dark_mode' }}</span>
      </button>

      <!-- Menú Perfil SSA Style -->
      <div class="relative" ref="profileDropdownRef" @click.stop>
        <button @click="toggleProfile" class="flex items-center gap-2 md:gap-3 bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors rounded-xl pr-2 md:pr-3 py-1 pl-1 shadow-sm">
          <div class="h-8 w-8 rounded-full overflow-hidden bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 p-0.5 flex items-center justify-center">
            <span class="material-symbols-outlined text-2xl text-slate-400">account_circle</span>
          </div>
          <div class="hidden md:flex flex-col items-start pr-1">
            <span class="text-xs font-black text-primary-dark dark:text-white leading-tight">Federico Brown</span>
            <span class="text-[9px] uppercase tracking-widest text-slate-400 dark:text-gray-500 font-bold">SSA - Mi Perfil</span>
          </div>
          <span class="material-symbols-outlined text-slate-400 text-sm transition-transform duration-200" :class="[isProfileOpen ? 'rotate-180' : '']">expand_more</span>
        </button>

        <!-- Dropdown flotante -->
        <div v-if="isProfileOpen" class="absolute right-0 top-full mt-2 w-[220px] bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
          
          <div class="p-4 border-b border-slate-100 dark:border-gray-800 bg-slate-50 dark:bg-gray-800/50 block md:hidden">
             <span class="block text-xs font-black text-primary-dark dark:text-white">Federico Brown</span>
             <span class="block text-[9px] uppercase tracking-widest text-slate-400 font-bold mt-0.5">Expositor</span>
          </div>

          <div class="p-2 space-y-1">
            <button @click="goToProfile" class="w-full text-left px-3 py-2.5 rounded-lg text-xs font-bold text-slate-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-800 hover:text-umsa-blue transition-colors flex items-center gap-2">
              <span class="material-symbols-outlined text-[18px]">badge</span>
              Ver Perfil de Datos
            </button>
            <div class="h-[1px] bg-slate-100 dark:border-gray-800 my-1"></div>
            <button class="w-full text-left px-3 py-2.5 rounded-lg text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2">
              <span class="material-symbols-outlined text-[18px]">logout</span>
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>