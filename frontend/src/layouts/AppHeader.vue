<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useEventoStore } from '../stores/eventoStore'
import { useUIStore } from '../stores/ui'

const eventoStore = useEventoStore()
const uiStore = useUIStore()

const isDark = ref(false)

const toggleDark = () => {
  isDark.value = !isDark.value
  document.documentElement.classList.toggle('dark', isDark.value)
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
}

onMounted(async () => {
  await eventoStore.fetchEventosInfo();
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
  <header class="fixed top-0 left-0 right-0 h-[75px] bg-white dark:bg-gray-900 border-b border-slate-200 dark:border-gray-800 z-[100] px-4 md:px-8 flex items-center justify-between shadow-sm transition-all duration-300">       
    <div class="flex items-center flex-1 space-x-4 md:space-x-6">
      
      <!-- Botón Menú Móvil -->
      <button @click="uiStore.toggleSidebar" class="flex-shrink-0 p-2 -ml-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors lg:hidden flex items-center justify-center">
        <span class="material-symbols-outlined text-2xl">{{ uiStore.isSidebarOpen ? 'menu_open' : 'menu' }}</span>
      </button>

      <!-- Logo -->
      <div class="flex flex-col flex-shrink-0 cursor-pointer border-r border-slate-200 dark:border-gray-800 pr-4 md:pr-6">
        <h2 class="text-primary-dark dark:text-white font-black italic text-xl md:text-2xl tracking-tighter leading-none">twas</h2>
        <p class="hidden md:block text-[6px] leading-tight text-primary-dark/60 dark:text-gray-400 uppercase font-bold tracking-tighter">The World Academy of Sciences</p>
      </div>

      <!-- Selectores (Sólo Escritorio - Vista Premium) -->
      <div class="hidden lg:flex items-center gap-4">
        <div class="relative group/select">
          <label class="absolute -top-2 left-3 bg-white dark:bg-gray-900 px-1 text-[8px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-[0.2em] z-10 transition-colors group-focus-within/select:text-umsa-blue">Evento Académico</label>
          <div class="relative">
            <select :value="eventoStore.selectedEventoNombre" @change="onNombreChange"
              style="text-align: left !important; text-align-last: left !important;"
              class="bg-slate-50 dark:bg-gray-800/50 border border-slate-200 dark:border-gray-700 text-primary-dark dark:text-gray-200 text-xs font-black rounded-xl py-2.5 pl-12 pr-10 appearance-none focus:ring-4 focus:ring-umsa-blue/10 focus:border-umsa-blue w-80 truncate cursor-pointer transition-all shadow-sm group-hover/select:bg-white dark:group-hover/select:bg-gray-800">
              <option v-for="(nombre, idx) in eventoStore.nombresEventos" :key="idx" :value="nombre">{{ nombre }}</option>
            </select>
            <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl pointer-events-none group-focus-within/select:text-umsa-blue">event_seat</span>
            <span class="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 text-lg pointer-events-none group-hover/select:translate-y-[-40%] transition-transform">unfold_more</span>
          </div>
        </div>

        <div class="relative group/select" v-if="eventoStore.selectedEventoNombre">
          <label class="absolute -top-2 left-3 bg-white dark:bg-gray-900 px-1 text-[8px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-[0.2em] z-10 transition-colors group-focus-within/select:text-emerald-500">Versión (Gestión)</label>
          <div class="relative">
            <select v-model="eventoStore.selectedEventoId"
              style="text-align: left !important; text-align-last: left !important;"
              :class="[
                'text-xs font-black rounded-xl py-2.5 pl-12 pr-10 appearance-none focus:ring-4 w-64 transition-all cursor-pointer shadow-sm',
                eventoStore.selectedEstado === 'Activo' 
                  ? 'bg-emerald-50/50 border-emerald-400/50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-500/50 focus:ring-emerald-500/10'
                  : 'bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 text-primary-dark dark:text-gray-200'
              ]">
              <option v-for="ver in eventoStore.versionesDisponibles" :key="ver.id" :value="ver.id">{{ ver.edicion }}</option>
            </select>
            <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl pointer-events-none group-focus-within/select:text-emerald-500">history_toggle_off</span>
            <span class="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 text-lg pointer-events-none group-hover/select:translate-y-[-40%] transition-transform">unfold_more</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Controles -->
    <div class="flex items-center space-x-2 md:space-x-4 shrink-0">
      <button @click="toggleDark" class="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-full bg-slate-100 dark:bg-gray-800 text-slate-500 dark:text-gray-400 border border-slate-200 dark:border-gray-700">
        <span class="material-symbols-outlined text-[18px] md:text-[20px]">{{ isDark ? 'light_mode' : 'dark_mode' }}</span>
      </button>
      <div class="w-9 h-9 md:w-10 md:h-10 bg-slate-100 dark:bg-gray-800 border-2 border-white dark:border-gray-700 rounded-full flex items-center justify-center shadow-sm ring-2 ring-slate-200 dark:ring-gray-600 overflow-hidden">  
        <img src="https://upload.wikimedia.org/wikipedia/commons/a/af/Escudo_de_la_Universidad_Mayor_de_San_Andr%C3%A9s.png" alt="UMSA" class="h-full w-full object-cover">
      </div>
    </div>
  </header>
</template>
