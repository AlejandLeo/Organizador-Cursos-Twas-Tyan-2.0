<script setup lang="ts">
import { RouterView } from 'vue-router';
import AdminSidebar from '@/layouts/AdminSidebar.vue';
import { useUIStore } from '@/stores/ui';

const uiStore = useUIStore();
</script>

<template>
  <div :class="[uiStore.isDark ? 'dark' : '', 'min-h-screen bg-slate-100 dark:bg-[#0a0a0f] transition-colors duration-300 relative']">
    <!-- Admin Header -->
    <header class="fixed top-0 left-0 right-0 z-50 h-[72px] flex items-center justify-between px-6 bg-white dark:bg-[#0d0d14] border-b border-slate-200 dark:border-red-900/30 shadow-sm dark:shadow-lg dark:shadow-black/40 transition-colors">
      <div class="flex items-center gap-4">
        <button @click="uiStore.toggleSidebar()" class="w-10 h-10 flex items-center justify-center rounded-xl text-red-400 hover:bg-red-900/20 transition-all">
          <span class="material-symbols-outlined">menu</span>
        </button>
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-red-600 to-rose-800 flex items-center justify-center shadow-lg shadow-red-900/50">
            <span class="material-symbols-outlined text-white text-[16px]">shield_person</span>
          </div>
          <div class="hidden sm:block">
            <p class="text-[10px] font-black text-red-600 dark:text-red-500 uppercase tracking-widest leading-none">Sistema SGEA</p>
            <h1 class="text-sm font-black text-slate-800 dark:text-white leading-tight">Panel de Super Administrador</h1>
          </div>
        </div>
      </div>
      
      <div class="flex items-center gap-4">
        <!-- BOTÓN MODO CLARO/OSCURO -->
        <button @click="uiStore.toggleTheme()" 
                class="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/20 text-slate-600 dark:text-white hover:bg-slate-200 dark:hover:bg-white/20 transition-all shadow-sm">
          <span class="material-symbols-outlined text-[20px]">{{ uiStore.isDark ? 'light_mode' : 'dark_mode' }}</span>
          <span class="text-[10px] font-black uppercase tracking-widest hidden md:block">{{ uiStore.isDark ? 'Modo Claro' : 'Modo Oscuro' }}</span>
        </button>

        <div class="px-3 py-1.5 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-700/40 rounded-full flex items-center gap-2">
          <div class="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
          <span class="text-[9px] font-black text-red-700 dark:text-red-400 uppercase tracking-widest">Acceso Total</span>
        </div>
      </div>
    </header>

    <AdminSidebar />

    <!-- Mobile overlay -->
    <div v-if="uiStore.isMobile && uiStore.isSidebarOpen"
         @click="uiStore.closeSidebar()"
         class="fixed inset-0 bg-black/70 backdrop-blur-sm z-[40] animate-in fade-in duration-300">
    </div>

    <main :class="[
            uiStore.isSidebarOpen && !uiStore.isMobile ? 'ml-72' : 'ml-0',
            'transition-all duration-300 p-4 md:p-10 pt-[88px] md:pt-[92px] min-h-screen relative'
          ]">
      <div class="max-w-7xl mx-auto">
        <RouterView />
      </div>
    </main>
  </div>
</template>
