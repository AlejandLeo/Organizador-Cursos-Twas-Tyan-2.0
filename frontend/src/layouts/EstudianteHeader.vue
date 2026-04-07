<script setup lang="ts">
import { ref, onMounted } from 'vue';

const isProfileOpen = ref(false);
const isDark = ref(false);

const toggleDark = () => {
  isDark.value = !isDark.value;
  document.documentElement.classList.toggle('dark', isDark.value);
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light');
};

onMounted(() => {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    isDark.value = true;
    document.documentElement.classList.add('dark');
  }
});
</script>

<template>
  <header class="fixed top-0 left-0 right-0 h-[75px] bg-white dark:bg-gray-900 border-b border-slate-200 dark:border-gray-800 z-[100] px-4 md:px-8 flex items-center justify-between shadow-sm transition-colors duration-300">       
    <!-- Logo & Title matching Ponente -->
    <div class="flex items-center flex-1 space-x-6">
      <div class="hidden md:flex flex-col flex-shrink-0 cursor-pointer border-r border-slate-200 dark:border-gray-800 pr-6">
        <h2 class="text-primary-dark dark:text-white font-black italic text-2xl tracking-tighter leading-none">twas</h2>
        <p class="text-[6px] leading-tight text-primary-dark/60 dark:text-gray-400 uppercase font-bold tracking-tighter">The World Academy of Sciences</p>
      </div>

      <h1 class="text-base md:text-lg font-black text-umsa-blue dark:text-blue-500 tracking-widest uppercase italic hidden lg:block border-r border-slate-200 dark:border-gray-800 pr-6">
        Portal Estudiante
      </h1>
    </div>

    <!-- Center Search Bar (Hidden to match exact layout, but can be kept if wanted. I'll hide it for identical structural match) -->
    <div class="hidden md:flex flex-1 max-w-xl mx-8">
      <div class="relative w-full">
        <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
        <input 
          type="text" 
          placeholder="Buscar cursos, calificaciones..." 
          class="w-full bg-slate-50 dark:bg-gray-900 border-none rounded-xl pl-12 pr-4 py-3 
                 text-sm outline-none focus:ring-2 focus:ring-umsa-blue/50 focus:bg-white dark:focus:bg-gray-800 
                 transition-all text-slate-700 dark:text-gray-200 shadow-inner"
        />
      </div>
    </div>

    <!-- Actions & Profile -->
    <div class="flex items-center space-x-2 md:space-x-4">
      <button
        @click="toggleDark"
        class="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-gray-800 text-slate-500 dark:text-gray-400 hover:text-umsa-blue hover:bg-slate-100 dark:hover:text-blue-500 dark:hover:bg-gray-700 transition-all shadow-sm border border-slate-200 dark:border-gray-700 mx-1 md:mx-2"
        aria-label="Toggle Dark Mode"
      >
        <span class="material-symbols-outlined text-[20px]">{{ isDark ? 'light_mode' : 'dark_mode' }}</span>
      </button>

      <button class="relative p-2.5 text-slate-400 hover:text-umsa-blue hover:bg-slate-50 dark:hover:bg-gray-900 rounded-xl transition-all hidden sm:block">
        <span class="material-symbols-outlined text-[24px]">notifications</span>
        <span class="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-gray-950"></span>
      </button>
      
      <div class="w-px h-8 bg-slate-200 dark:bg-gray-800 mx-2 hidden sm:block"></div>
      
      <!-- Profile Button matched exactly to Ponente -->
      <div class="relative" @click.stop>
        <button @click="isProfileOpen = !isProfileOpen" class="flex items-center gap-2 md:gap-3 bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors rounded-xl pr-2 md:pr-3 py-1 pl-1 shadow-sm">
          <div class="h-8 w-8 rounded-full overflow-hidden bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 p-0.5 flex items-center justify-center">
            <span class="material-symbols-outlined text-2xl text-slate-400">account_circle</span>
          </div>
          <div class="hidden md:flex flex-col items-start pr-1">
            <span class="text-xs font-black text-primary-dark dark:text-white leading-tight">Maria F. Rojas</span>
            <span class="text-[9px] uppercase tracking-widest text-slate-400 dark:text-gray-500 font-bold">Portal - Mi Perfil</span>
          </div>
          <span class="material-symbols-outlined text-slate-400 text-sm transition-transform duration-200" :class="[isProfileOpen ? 'rotate-180' : '']">expand_more</span>
        </button>

        <!-- Dropdown -->
        <div v-if="isProfileOpen" class="absolute right-0 top-full mt-2 w-[220px] bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
          
          <div class="p-4 border-b border-slate-100 dark:border-gray-800 bg-slate-50 dark:bg-gray-800/50 block md:hidden">
             <span class="block text-xs font-black text-primary-dark dark:text-white">Maria F. Rojas</span>
             <span class="block text-[9px] uppercase tracking-widest text-slate-400 font-bold mt-0.5">Estudiante</span>
          </div>

          <div class="p-2 space-y-1">
            <button class="w-full text-left px-3 py-2.5 rounded-lg text-xs font-bold text-slate-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-800 hover:text-umsa-blue transition-colors flex items-center gap-2">
              <span class="material-symbols-outlined text-[18px]">badge</span>
              Ver Perfil
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