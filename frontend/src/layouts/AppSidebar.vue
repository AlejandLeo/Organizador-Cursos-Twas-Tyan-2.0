<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useUIStore } from '../stores/ui';
import { useEventoStore } from '../stores/eventoStore';

const router = useRouter();
const authStore = useAuthStore();
const uiStore = useUIStore();
const eventoStore = useEventoStore();

const navigate = (routeName: string) => {
  uiStore.closeSidebar();
  router.push({ name: routeName });
};

const onNombreChange = (e: any) => {
  eventoStore.setEventoPorNombre(e.target.value);
};
</script>

<template>
  <aside :class="[
    uiStore.isSidebarOpen ? 'translate-x-0' : '-translate-x-full',
    'w-72 bg-white dark:bg-gray-950 text-slate-600 dark:text-gray-300 flex flex-col px-4 py-8 fixed left-0 bottom-0 top-[75px] z-[45] border-r border-slate-200 dark:border-gray-800 overflow-y-auto transition-all duration-300 ease-in-out'
  ]">

    <div class="mb-6 p-5 bg-slate-50 dark:bg-gray-900 rounded-2xl border border-slate-100 dark:border-gray-800 shadow-sm relative overflow-hidden group">
      <div class="absolute left-0 top-0 bottom-0 w-1 bg-umsa-blue dark:bg-blue-600 opacity-70 group-hover:opacity-100 transition-opacity"></div>
      <p class="text-[10px] uppercase tracking-widest text-umsa-blue dark:text-blue-400 font-bold mb-1">Coordinador(a)</p>
      <h3 class="text-sm font-bold font-serif italic text-primary-dark dark:text-white leading-tight">
        {{ authStore.user?.persona?.nombres || 'Super' }} {{ authStore.user?.persona?.primer_apellido || 'Admin' }}
      </h3>
      <p class="text-xs text-slate-500 dark:text-gray-400 mt-1">
        {{ authStore.user?.persona?.segundo_apellido || 'Sistema' }}
      </p>

    </div>



    <nav class="space-y-1 flex-1">
      <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 mt-2 pl-2">Menú Principal</p>

      <button @click="navigate('coordinador-dashboard')"
        :class="[ $route.name === 'coordinador-dashboard' ? 'nav-active bg-umsa-blue text-white shadow-md shadow-umsa-blue/20' : 'hover:bg-slate-50 dark:hover:bg-gray-900 text-slate-500' ]"
        class="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all group">
        <span class="text-[10px] sm:text-xs uppercase tracking-wider font-bold">Dashboard</span>
        <span class="material-symbols-outlined text-[18px] transition-colors" :class="[ $route.name === 'coordinador-dashboard' ? 'text-white' : 'text-slate-400 group-hover:text-umsa-blue' ]">dashboard</span>        
      </button>

      <button @click="navigate('coordinador-gestion-eventos')"
        :class="[ $route.name === 'coordinador-gestion-eventos' ? 'nav-active bg-umsa-blue text-white shadow-md shadow-umsa-blue/20' : 'hover:bg-slate-50 dark:hover:bg-gray-900 text-slate-500' ]"
        class="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all group mt-2">
        <span class="text-[10px] sm:text-xs uppercase tracking-wider font-bold">Gestión de Eventos</span>
        <span class="material-symbols-outlined text-[18px] transition-colors" :class="[ $route.name === 'coordinador-gestion-eventos' ? 'text-white' : 'text-slate-400 group-hover:text-umsa-blue' ]">event_note</span>
      </button>

      <button @click="navigate('coordinador-solicitudes')"
        :class="[ $route.name === 'coordinador-solicitudes' ? 'nav-active bg-umsa-blue text-white shadow-md shadow-umsa-blue/20' : 'hover:bg-slate-50 dark:hover:bg-gray-900 text-slate-500' ]"
        class="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all group mt-2">
        <span class="text-[10px] sm:text-xs uppercase tracking-wider font-bold">Solicitudes y Asignación</span>
        <span class="material-symbols-outlined text-[18px] transition-colors" :class="[ $route.name === 'coordinador-solicitudes' ? 'text-white' : 'text-slate-400 group-hover:text-umsa-blue' ]">how_to_reg</span>
      </button>
    </nav>

    <div class="mt-auto space-y-2">
      <button @click="authStore.cambiarRolActivo('')" v-if="authStore.userRoles.length > 1"
        class="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-gray-900 border border-transparent">
        <span class="text-[10px] uppercase tracking-widest">Cambiar Rol</span>
        <span class="material-symbols-outlined text-[18px]">cached</span>
      </button>

      <button @click="authStore.logout(); router.push('/login')" class="flex items-center justify-between px-4 py-3.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl font-bold transition-all uppercase text-[10px] tracking-widest border border-red-100 dark:border-red-900/30 w-full group">
        <span>Cerrar Sesión</span>
        <span class="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform">logout</span>
      </button>
    </div>
  </aside>
</template>
