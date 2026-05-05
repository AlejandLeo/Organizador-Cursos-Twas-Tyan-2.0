<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const navigate = (routeName: string) => {
  router.push({ name: routeName });
};

const cambiarAEstudiante = () => {
  authStore.cambiarRolActivo('Estudiante');
  router.push('/estudiante');
};
</script>

<template>
  <aside class="w-64 lg:w-72 bg-white dark:bg-gray-950 text-slate-600 dark:text-gray-300 flex flex-col px-4 py-8 fixed left-0 bottom-0 top-[75px] z-50 border-r border-slate-200 dark:border-gray-800 overflow-y-auto transition-colors duration-300">
    <div class="mb-8 p-5 bg-slate-50 dark:bg-gray-900 rounded-2xl border border-slate-100 dark:border-gray-800 shadow-sm relative overflow-hidden group">       
      <!-- Decorative color (UMSA Blue) -->
      <div class="absolute left-0 top-0 bottom-0 w-1 bg-umsa-blue dark:bg-blue-500"></div>

      <div class="flex items-center gap-3 mb-2">
        <div class="w-10 h-10 rounded-full bg-blue-100 dark:bg-gray-800 text-umsa-blue font-black flex items-center justify-center text-lg border border-blue-200 dark:border-gray-700 shadow-inner">
          {{ authStore.user?.persona?.nombres?.charAt(0) || 'P' }}
        </div>
        <div>
          <p class="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-0.5">Bienvenido</p>
          <h3 class="text-sm font-black text-slate-800 dark:text-white leading-tight uppercase">{{ authStore.user?.persona?.nombres || 'Ponente' }}</h3>
        </div>
      </div>
      <p class="text-[10px] text-umsa-blue dark:text-blue-400 mt-2 uppercase tracking-widest font-black bg-blue-50 w-max px-2 py-1 rounded-md dark:bg-gray-800 border border-blue-100 dark:border-gray-700">Expositor</p>
    </div>

    <nav class="space-y-1 flex-1">
      <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 mt-2 pl-2 border-b border-slate-100 dark:border-gray-800 pb-2">Descubrimiento</p>

      <button @click="navigate('ponente-catalogo')"
        :class="[ $route.name === 'ponente-catalogo' ? 'nav-active bg-umsa-blue text-white shadow-lg shadow-umsa-blue/30' : 'hover:bg-slate-50 dark:hover:bg-gray-900 text-slate-500 hover:text-umsa-blue hover:translate-x-1' ]"
        class="w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all group font-medium"
        :style="[$route.name === 'ponente-catalogo' ? '' : '']">
        <span class="text-[11px] uppercase tracking-widest font-bold">Actividades Académicas</span>
        <span class="material-symbols-outlined text-[18px] transition-colors" :class="[ $route.name === 'ponente-catalogo' ? 'text-white' : 'text-slate-400 group-hover:text-umsa-blue' ]">grid_view</span>
      </button>

      <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 mt-6 pl-2 border-b border-slate-100 dark:border-gray-800 pb-2">Mi área de Trabajo</p>

      <button @click="navigate('ponente-eventos')"
        :class="[ $route.name === 'ponente-eventos' || $route.name === 'ponente-evento-detalle' ? 'nav-active bg-umsa-blue text-white shadow-lg shadow-umsa-blue/30' : 'hover:bg-slate-50 dark:hover:bg-gray-900 text-slate-500 hover:text-umsa-blue hover:translate-x-1' ]"
        class="w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all group mt-1">
        <span class="text-xs uppercase tracking-widest font-bold">Mis Cursos Asignados</span>
        <span class="material-symbols-outlined text-[18px] transition-colors" :class="[ $route.name === 'ponente-eventos' || $route.name === 'ponente-evento-detalle' ? 'text-white' : 'text-slate-400 group-hover:text-umsa-blue' ]">collections_bookmark</span>
      </button>

      <button @click="navigate('ponente-historial-notas')"
        :class="[ $route.name === 'ponente-historial-notas' ? 'nav-active bg-umsa-blue text-white shadow-lg shadow-umsa-blue/30' : 'hover:bg-slate-50 dark:hover:bg-gray-900 text-slate-500 hover:text-umsa-blue hover:translate-x-1' ]"
        class="w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all group mt-1">
        <span class="text-xs uppercase tracking-widest font-bold">Historial de Notas</span>
        <span class="material-symbols-outlined text-[18px] transition-colors" :class="[ $route.name === 'ponente-historial-notas' ? 'text-white' : 'text-slate-400 group-hover:text-umsa-blue' ]">history_edu</span>
      </button>


      <button @click="navigate('ponente-certificados')"
        :class="[ $route.name === 'ponente-certificados' ? 'nav-active bg-umsa-blue text-white shadow-lg shadow-umsa-blue/30' : 'hover:bg-slate-50 dark:hover:bg-gray-900 text-slate-500 hover:text-umsa-blue hover:translate-x-1' ]"
        class="w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all group mt-1"     
        :style="[$route.name === 'ponente-certificados' ? '' : '']">
        <span class="text-xs uppercase tracking-widest font-bold">Mis Certificados</span>
        <span class="material-symbols-outlined text-[18px] transition-colors" :class="[ $route.name === 'ponente-certificados' ? 'text-white' : 'text-slate-400 group-hover:text-umsa-blue' ]">workspace_premium</span>
      </button>
    </nav>

    <!-- CAMBIO DE CONTEXTO DE ROL (Solo si también es Estudiante) -->
    <div v-if="authStore.esEstudiante" class="mt-6 pt-4 border-t border-slate-100 dark:border-gray-800">
      <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 pl-2">Cambiar Vista</p>
      <button @click="cambiarAEstudiante"
              class="w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-slate-500 hover:text-emerald-600 group border border-dashed border-slate-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-800">
        <div class="flex items-center gap-3">
          <div class="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center">
            <span class="material-symbols-outlined text-[16px]">school</span>
          </div>
          <span class="text-[11px] uppercase tracking-widest font-black">Vista Estudiante</span>
        </div>
        <span class="material-symbols-outlined text-[18px] text-slate-400 group-hover:text-emerald-500 transition-colors">swap_horiz</span>
      </button>
    </div>

  </aside>
</template>
