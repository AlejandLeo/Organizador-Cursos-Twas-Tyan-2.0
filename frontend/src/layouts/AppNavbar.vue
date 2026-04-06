<script setup lang="ts">
import { ref, onMounted } from 'vue';

const navLinks = [
  { name: 'Home', href: '#inicio' },
  { name: 'Information', href: '#informacion' },
  { name: 'Organization', href: '#organizacion' },
  { name: 'Location', href: '#ubicacion' },
  { name: 'Contact', href: '#footer' },
];

const isMenuOpen = ref(false);
const isDark = ref(false);

const scrollTo = (selector: string) => {
  const element = document.querySelector(selector);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' });
  }
  isMenuOpen.value = false;
};

const toggleDark = () => {
  isDark.value = !isDark.value;
  if (isDark.value) {
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  } else {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  }
};

onMounted(() => {
  if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    isDark.value = true;
    document.documentElement.classList.add('dark');
  }
});
</script>

<template>
  <nav class="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 fixed top-0 left-0 right-0 z-50 shadow-sm font-sans transition-colors duration-300">
    <div class="container mx-auto px-4 lg:px-8">
      <div class="flex justify-between items-center h-20">
        
        <!-- Left: Logos -->
        <div class="flex items-center gap-4 shrink-0">
          <a href="https://twas.org/" target="_blank" rel="noopener noreferrer" class="flex flex-col items-center">
            <!-- Text fallback for UNESCO-TWAS -->
            <span class="text-[0.6rem] leading-none text-blue-900 dark:text-blue-300 font-bold uppercase tracking-tighter">The World Academy of Sciences</span>
            <span class="text-xs text-blue-900 dark:text-blue-300 font-semibold">UNESCO</span>
          </a>
          <a href="https://twas.org/tyan" target="_blank" rel="noopener noreferrer" class="flex items-center bg-[#0074b3] dark:bg-blue-600 text-white px-3 py-1 rounded-sm">
            <!-- Text fallback for TYAN -->
            <span class="font-bold text-xl tracking-wider">TYAN</span>
          </a>
        </div>

        <!-- Mobile Menu Button -->
        <div class="lg:hidden flex items-center gap-2">
          <!-- Toggle Dark Mode Mobile -->
          <button @click="toggleDark" class="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg focus:outline-none">
            <svg v-if="!isDark" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>
            <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
          </button>
          
          <button @click="isMenuOpen = !isMenuOpen" class="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white focus:outline-none">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7"></path>
            </svg>
          </button>
        </div>

        <!-- Middle: Navigation Links -->
        <div class="hidden lg:flex flex-1 justify-center">
          <ul class="flex items-center gap-6 xl:gap-8 text-gray-700 dark:text-gray-200 font-medium text-sm xl:text-base">
            <li v-for="link in navLinks" :key="link.name">
              <a :href="link.href" @click.prevent="scrollTo(link.href)" class="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                {{ link.name }}
              </a>
            </li>
          </ul>
        </div>

        <!-- Right: Actions & Right Logos -->
        <div class="hidden lg:flex items-center gap-3 shrink-0">
          
          <!-- Botón Dark Mode -->
          <button @click="toggleDark" class="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors focus:outline-none" aria-label="Toggle Dark Mode">
            <!-- Icono Luna (Modo claro) -->
            <svg v-if="!isDark" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>
            <!-- Icono Sol (Modo oscuro) -->
            <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
          </button>

          <!-- Botón Idioma -->
          <button class="flex items-center gap-2 px-3 py-1.5 border border-gray-400 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke-width="2"></circle>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"></path>
            </svg>
            ESPAÑOL
          </button>
          
          <!-- Botón Login -->
          <router-link to="/login" class="px-6 py-1.5 border border-blue-500 dark:border-blue-400 text-blue-500 dark:text-blue-400 rounded hover:bg-blue-50 dark:hover:bg-gray-800 text-sm font-medium transition-colors">
            Login
          </router-link>
          
          <!-- Logos UMSA / FCPN Circulares -->
          <div class="flex items-center gap-2 ml-2">
            <a href="https://www.fcpn.edu.bo/" target="_blank" rel="noopener noreferrer" 
               class="w-10 h-10 rounded-full border-2 border-blue-300 dark:border-blue-600 flex items-center justify-center text-[10px] font-bold text-blue-800 dark:text-blue-200 bg-blue-50 dark:bg-blue-900/50 hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors">
               FCPN
            </a>
            <a href="https://www.umsa.bo/" target="_blank" rel="noopener noreferrer" 
               class="w-10 h-10 rounded-full border-2 border-green-300 dark:border-green-600 flex items-center justify-center text-[10px] font-bold text-green-800 dark:text-green-200 bg-green-50 dark:bg-green-900/50 hover:bg-green-100 dark:hover:bg-green-800 transition-colors">
              UMSA
            </a>
          </div>
        </div>
      </div>

      <!-- Mobile Menu (Expanded) -->
      <div v-show="isMenuOpen" class="lg:hidden pb-4 bg-white dark:bg-gray-900">
        <ul class="flex flex-col gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
          <li v-for="link in navLinks" :key="link.name">
            <a :href="link.href" @click.prevent="scrollTo(link.href)" class="block py-2 px-4 text-gray-700 dark:text-gray-200 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 rounded">
              {{ link.name }}
            </a>
          </li>
        </ul>
        <div class="mt-4 px-4 flex flex-col gap-3">
          <button class="flex items-center justify-center gap-2 w-full py-2 border border-gray-400 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded font-medium hover:bg-gray-50 dark:hover:bg-gray-800">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke-width="2"></circle><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"></path></svg>
            ESPAÑOL
          </button>
          <router-link to="/login" class="w-full text-center py-2 border border-blue-500 dark:border-blue-400 text-blue-500 dark:text-blue-400 rounded font-medium hover:bg-blue-50 dark:hover:bg-gray-800">
            Login
          </router-link>
          <div class="flex justify-center items-center gap-4 mt-2">
            <a href="https://www.fcpn.edu.bo/" class="w-12 h-12 rounded-full border-2 border-blue-300 dark:border-blue-600 flex items-center justify-center text-xs font-bold text-blue-800 dark:text-blue-200 bg-blue-50 dark:bg-blue-900/50">FCPN</a>
            <a href="https://www.umsa.bo/" class="w-12 h-12 rounded-full border-2 border-green-300 dark:border-green-600 flex items-center justify-center text-xs font-bold text-green-800 dark:text-green-200 bg-green-50 dark:bg-green-900/50">UMSA</a>
          </div>
        </div>
      </div>
    </div>
  </nav>
</template>