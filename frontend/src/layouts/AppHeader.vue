<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useEventoStore } from '../stores/eventoStore'

// Estado del evento global usando Pinia
const eventoStore = useEventoStore()

// Estado del tema oscuro
const isDark = ref(false)

const toggleDark = () => {
  isDark.value = !isDark.value
  document.documentElement.classList.toggle('dark', isDark.value)
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
}

onMounted(() => {
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    isDark.value = true
    document.documentElement.classList.add('dark')
  }
})

const onNombreChange = (event: Event) => {
  const target = event.target as HTMLSelectElement;
  eventoStore.setEventoPorNombre(target.value);
}
</script>

<template>
  <header class="fixed top-0 left-0 right-0 h-[75px] bg-white dark:bg-gray-900 border-b border-slate-200 dark:border-gray-800 z-[100] px-4 md:px-8 flex items-center justify-between shadow-sm transition-colors duration-300">       
    <div class="flex items-center flex-1 space-x-6">
      <div class="hidden md:flex flex-col flex-shrink-0 cursor-pointer border-r border-slate-200 dark:border-gray-800 pr-6">
        <h2 class="text-primary-dark dark:text-white font-black italic text-2xl tracking-tighter leading-none">twas</h2>
        <p class="text-[6px] leading-tight text-primary-dark/60 dark:text-gray-400 uppercase font-bold tracking-tighter">The World Academy of Sciences</p>
      </div>

      <h1 class="text-base md:text-lg font-black text-umsa-blue dark:text-blue-400 tracking-widest uppercase italic hidden lg:block border-r border-slate-200 dark:border-gray-800 pr-6">
        Coordinador
      </h1>

      <div class="flex flex-col md:flex-row items-center gap-3">
        <div class="relative group/select">
          <label class="absolute -top-2 left-3 bg-white dark:bg-gray-900 px-1 text-[8px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest z-10 transition-colors">Evento Académico</label>
          <select
            :value="eventoStore.selectedEventoNombre"
            @change="onNombreChange"
            class="bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 text-primary-dark dark:text-gray-200 text-xs font-bold rounded-lg py-2.5 px-3 pl-9 appearance-none focus:outline-none focus:ring-2 focus:ring-umsa-blue focus:border-umsa-blue w-48 md:w-64 truncate cursor-pointer hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors"
          >
            <option v-for="(nombre, idx) in eventoStore.nombresEventos" :key="idx" :value="nombre">
              {{ nombre }}
            </option>
          </select>
          <span class="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none group-focus-within/select:text-umsa-blue transition-colors">event_note</span>
          <span class="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none group-focus-within/select:text-umsa-blue transition-colors">expand_more</span>        
        </div>

        <div class="relative group/select" v-if="eventoStore.selectedEventoNombre">
          <label class="absolute -top-2 left-3 bg-white dark:bg-gray-900 px-1 text-[8px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest z-10 transition-colors">Versión (Gestión)</label>
          <select
            v-model="eventoStore.selectedEventoId"
            class="bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 text-primary-dark dark:text-gray-200 text-xs font-bold rounded-lg py-2.5 px-3 pl-9 appearance-none focus:outline-none focus:ring-2 focus:ring-umsa-blue focus:border-umsa-blue w-40 hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
          >
            <option v-for="ver in eventoStore.versionesDisponibles" :key="ver.id" :value="ver.id">
              {{ ver.edicion }} ({{ ver.gestion }})
            </option>
          </select>
          <span class="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none group-focus-within/select:text-umsa-blue transition-colors">history</span>
          <span class="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none group-focus-within/select:text-umsa-blue transition-colors">expand_more</span>        
        </div>
      </div>
    </div>

    <div class="flex items-center space-x-4 pl-4 shrink-0">
      <button 
        @click="toggleDark" 
        class="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 dark:bg-gray-800 text-slate-500 dark:text-gray-400 hover:text-umsa-blue dark:hover:text-blue-400 transition-colors shadow-sm border border-slate-200 dark:border-gray-700 mx-2"
        aria-label="Toggle Dark Mode"
      >
        <span class="material-symbols-outlined text-[20px]">{{ isDark ? 'light_mode' : 'dark_mode' }}</span>
      </button>
      
      <div class="text-right hidden sm:block">    
        <p class="text-[9px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest transition-colors mb-0.5">Rol Activo</p>
        <p class="text-xs font-black text-primary-dark dark:text-gray-200 uppercase mt-1">Coordinador</p>
      </div>
      <div class="w-10 h-10 bg-slate-100 dark:bg-gray-800 border-2 border-white dark:border-gray-700 rounded-full flex items-center justify-center shadow-sm overflow-hidden ring-2 ring-slate-200 dark:ring-gray-600">  
        <img src="https://upload.wikimedia.org/wikipedia/commons/a/af/Escudo_de_la_Universidad_Mayor_de_San_Andr%C3%A9s.png" alt="UMSA" class="h-full w-full object-cover">
      </div>
    </div>
  </header>
</template>
