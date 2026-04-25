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

    <!-- SELECTORES SÓLO PARA MÓVIL (Aparecen al inicio del sidebar) -->
    <div class="lg:hidden mb-6 space-y-4 p-4 bg-slate-50 dark:bg-gray-900 rounded-2xl border border-slate-100 dark:border-gray-800">
        <p class="text-[9px] font-black text-umsa-blue uppercase tracking-widest mb-1 pl-1">Contexto Académico</p>
        
        <div class="relative">
            <label class="absolute -top-2 left-2 px-1 bg-slate-50 dark:bg-gray-900 text-[8px] font-bold text-slate-400 uppercase z-10 transition-colors">Evento</label>
            <select :value="eventoStore.selectedEventoNombre" @change="onNombreChange"
              class="w-full bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 text-primary-dark dark:text-gray-200 text-xs font-bold rounded-lg py-2.5 pl-8 appearance-none focus:ring-2 focus:ring-umsa-blue transition-all">
              <option v-for="(nombre, idx) in eventoStore.nombresEventos" :key="idx" :value="nombre">{{ nombre }}</option>
            </select>
            <span class="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none">event_note</span>
        </div>

        <div class="relative" v-if="eventoStore.selectedEventoNombre">
            <label class="absolute -top-2 left-2 px-1 bg-slate-50 dark:bg-gray-900 text-[8px] font-bold text-slate-400 uppercase z-10 transition-colors">Versión / Gestión</label>
            <select v-model="eventoStore.selectedEventoId"
              class="w-full bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 text-primary-dark dark:text-gray-200 text-xs font-bold rounded-lg py-2.5 pl-8 appearance-none focus:ring-2 focus:ring-umsa-blue transition-all">
              <option v-for="ver in eventoStore.versionesDisponibles" :key="ver.id" :value="ver.id">{{ ver.edicion }}</option>
            </select>
            <span class="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none">history</span>
        </div>
    </div>
    <div class="mb-8 p-5 bg-slate-50 dark:bg-gray-900 rounded-2xl border border-slate-100 dark:border-gray-800 shadow-sm">
      <p class="text-[10px] uppercase tracking-widest text-umsa-blue dark:text-blue-400 font-bold mb-1">Bienvenido</p>
      <h3 class="text-sm font-black text-primary-dark dark:text-white leading-tight">
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
        class="w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all group">
        <span class="text-xs uppercase tracking-widest font-bold">Dashboard</span>
        <span class="material-symbols-outlined text-[20px] transition-colors" :class="[ $route.name === 'coordinador-dashboard' ? 'text-white' : 'text-slate-400 group-hover:text-umsa-blue' ]">dashboard</span>        
      </button>

      <button @click="navigate('coordinador-actividades')"
        :class="[ $route.name === 'coordinador-actividades' ? 'nav-active bg-umsa-blue text-white shadow-md shadow-umsa-blue/20' : 'hover:bg-slate-50 dark:hover:bg-gray-900 text-slate-500' ]"
        class="w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all group mt-2">
        <span class="text-xs uppercase tracking-widest font-bold">Gestión de Eventos</span>
        <span class="material-symbols-outlined text-[20px] transition-colors" :class="[ $route.name === 'coordinador-actividades' ? 'text-white' : 'text-slate-400 group-hover:text-umsa-blue' ]">corporate_fare</span>
      </button>

      <button @click="navigate('coordinador-solicitudes')"
        :class="[ $route.name === 'coordinador-solicitudes' ? 'nav-active bg-umsa-blue text-white shadow-md shadow-umsa-blue/20' : 'hover:bg-slate-50 dark:hover:bg-gray-900 text-slate-500' ]"
        class="w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all group mt-2">
        <span class="text-xs uppercase tracking-widest font-bold">Solicitudes</span>
        <span class="material-symbols-outlined text-[20px] transition-colors" :class="[ $route.name === 'coordinador-solicitudes' ? 'text-white' : 'text-slate-400 group-hover:text-umsa-blue' ]">how_to_reg</span>
      </button>

    </nav>

    <button @click="router.push('/login')" class="mt-8 flex items-center justify-between px-4 py-3.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl font-bold transition-all uppercase text-[10px] tracking-widest mb-2 border border-red-100 dark:border-red-900/30 w-full group">
      <span>Cerrar Sesión</span>
      <span class="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform">logout</span>
    </button>
  </aside>
</template>
