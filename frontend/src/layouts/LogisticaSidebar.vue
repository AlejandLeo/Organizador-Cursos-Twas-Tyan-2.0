<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useUIStore } from '@/stores/ui';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const uiStore = useUIStore();

const menuItems = [
  { name: 'Inicio', icon: 'dashboard', path: '/logistica' },
  { name: 'Asistencias (QR)', icon: 'qr_code_scanner', path: '/logistica/asistencia' },
  { name: 'Eventos', icon: 'event', path: '/logistica/eventos' },
  { name: 'Usuarios', icon: 'person_search', path: '/logistica/usuarios' },
];

const handleLogout = () => {
  authStore.logout();
  router.push('/login');
};
</script>

<template>
  <aside :class="[
    uiStore.isSidebarOpen ? 'translate-x-0' : '-translate-x-full',
    'fixed top-[72px] bottom-0 left-0 w-72 bg-white dark:bg-[#0d0d14] border-r border-slate-200 dark:border-teal-900/30 z-[45] transition-all duration-300 shadow-2xl shadow-black/5'
  ]">
    <div class="h-full flex flex-col p-6 overflow-y-auto custom-scrollbar">
      <div class="mb-8 p-4 bg-teal-50 dark:bg-teal-900/20 rounded-2xl border border-teal-100 dark:border-teal-800 flex items-center gap-4">
        <div class="w-12 h-12 rounded-xl bg-teal-600 flex items-center justify-center shadow-lg shadow-teal-900/40 text-white">
          <span class="material-symbols-outlined text-[28px]">support_agent</span>
        </div>
        <div>
          <p class="text-[10px] font-black text-teal-600 dark:text-teal-400 uppercase tracking-widest leading-none">Usuario</p>
          <h2 class="text-sm font-black text-slate-800 dark:text-white mt-1">Logística</h2>
        </div>
      </div>

      <nav class="flex-1 space-y-2">
        <div v-for="item in menuItems" :key="item.path">
          <router-link :to="item.path" 
            :class="[
              route.path === item.path 
                ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/30 border-teal-500 scale-105' 
                : 'text-slate-500 dark:text-gray-500 hover:bg-teal-50 dark:hover:bg-teal-900/20 hover:text-teal-600 dark:hover:text-teal-400 border-transparent',
              'flex items-center gap-4 px-5 py-4 rounded-2xl font-bold text-sm transition-all border group'
            ]">
            <span class="material-symbols-outlined transition-transform group-hover:scale-110">{{ item.icon }}</span>
            <span class="uppercase tracking-widest text-[11px]">{{ item.name }}</span>
          </router-link>
        </div>
      </nav>

      <div class="mt-auto pt-6 border-t border-slate-100 dark:border-gray-800 space-y-3">
        <button @click="authStore.cambiarRolActivo('')" v-if="authStore.userRoles.length > 1"
          class="w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold text-sm text-slate-500 hover:bg-slate-50 dark:hover:bg-gray-800 transition-all border border-transparent group">
          <span class="material-symbols-outlined text-teal-600">cached</span>
          <span class="uppercase tracking-widest text-[11px]">Cambiar Rol</span>
        </button>

        <button @click="handleLogout" 
          class="w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all border border-transparent group">
          <span class="material-symbols-outlined transition-transform group-hover:translate-x-1">logout</span>
          <span class="uppercase tracking-widest text-[11px]">Cerrar Sesión</span>
        </button>
      </div>
    </div>
  </aside>
</template>
