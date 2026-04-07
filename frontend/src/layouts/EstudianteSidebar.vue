<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();

const navigate = (routeName: string) => {
  router.push({ name: routeName });
};
</script>

<template>
  <aside class="w-64 lg:w-72 bg-white dark:bg-gray-950 text-slate-600 dark:text-gray-300 flex flex-col px-4 py-8 fixed left-0 bottom-0 top-[75px] z-50 border-r border-slate-200 dark:border-gray-800 overflow-y-auto transition-colors duration-300">
    <div class="mb-8 p-5 bg-slate-50 dark:bg-gray-900 rounded-2xl border border-slate-100 dark:border-gray-800 shadow-sm relative overflow-hidden group">
      <!-- Decorative color (UMSA Green/Blue) -->
      <div class="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 dark:bg-emerald-600"></div>

      <div class="flex items-center gap-3 mb-2">
        <div class="w-10 h-10 rounded-full bg-emerald-100 dark:bg-gray-800 text-emerald-600 font-black flex items-center justify-center text-lg border border-emerald-200 dark:border-gray-700 shadow-inner">
          M
        </div>
        <div>
          <p class="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-0.5">Bienvenida</p>
          <h3 class="text-sm font-black text-slate-800 dark:text-white leading-tight uppercase">Maria F.</h3>
        </div>
      </div>
      <p class="text-[10px] text-emerald-600 dark:text-emerald-400 mt-2 uppercase tracking-widest font-black bg-emerald-50 w-max px-2 py-1 rounded-md dark:bg-gray-800 border border-emerald-100 dark:border-gray-700">Estudiante</p>
    </div>

    <nav class="space-y-1 flex-1">
      <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 mt-2 pl-2 border-b border-slate-100 dark:border-gray-800 pb-2">Descubrimiento</p>

      <button @click="navigate('estudiante-catalogo')"
        :class="[ $route.name === 'estudiante-catalogo' ? 'nav-active bg-umsa-blue text-white shadow-md shadow-umsa-blue/20' : 'hover:bg-slate-50 dark:hover:bg-gray-900 text-slate-500' ]"
        class="w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all group">
        <span class="text-xs uppercase tracking-widest font-bold">Actividades Académicas</span>
        <span class="material-symbols-outlined text-[20px] transition-colors" :class="[ $route.name === 'estudiante-catalogo' ? 'text-white' : 'text-slate-400 group-hover:text-umsa-blue' ]">local_library</span>        
      </button>

      <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 mt-6 pl-2 border-b border-slate-100 dark:border-gray-800 pb-2">Mi Portal</p>

      <button @click="navigate('estudiante-dashboard')"
        :class="[ $route.name === 'estudiante-dashboard' ? 'nav-active bg-umsa-blue text-white shadow-md shadow-umsa-blue/20' : 'hover:bg-slate-50 dark:hover:bg-gray-900 text-slate-500' ]"
        class="w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all group mt-1">
        <span class="text-xs uppercase tracking-widest font-bold">Mi Inicio</span>
        <span class="material-symbols-outlined text-[20px] transition-colors" :class="[ $route.name === 'estudiante-dashboard' ? 'text-white' : 'text-slate-400 group-hover:text-umsa-blue' ]">home</span>        
      </button>

      <button @click="navigate('estudiante-actividades')"
        :class="[ $route.name === 'estudiante-actividades' ? 'nav-active bg-umsa-blue text-white shadow-md shadow-umsa-blue/20' : 'hover:bg-slate-50 dark:hover:bg-gray-900 text-slate-500' ]"
        class="w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all group mt-2">
        <span class="text-xs uppercase tracking-widest font-bold">Mis Actividades</span>
        <span class="material-symbols-outlined text-[20px] transition-colors" :class="[ $route.name === 'estudiante-actividades' ? 'text-white' : 'text-slate-400 group-hover:text-umsa-blue' ]">book</span>
      </button>

      <button @click="navigate('estudiante-calificaciones')"
        :class="[ $route.name === 'estudiante-calificaciones' ? 'nav-active bg-umsa-blue text-white shadow-md shadow-umsa-blue/20' : 'hover:bg-slate-50 dark:hover:bg-gray-900 text-slate-500' ]"
        class="w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all group mt-2">
        <span class="text-xs uppercase tracking-widest font-bold">Calificaciones</span>
        <span class="material-symbols-outlined text-[20px] transition-colors" :class="[ $route.name === 'estudiante-calificaciones' ? 'text-white' : 'text-slate-400 group-hover:text-umsa-blue' ]">grading</span>
      </button>

      <button @click="navigate('estudiante-certificados')"
        :class="[ $route.name === 'estudiante-certificados' ? 'nav-active bg-umsa-blue text-white shadow-md shadow-umsa-blue/20' : 'hover:bg-slate-50 dark:hover:bg-gray-900 text-slate-500' ]"
        class="w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all group mt-2">
        <span class="text-xs uppercase tracking-widest font-bold">Mis Certificados</span>
        <span class="material-symbols-outlined text-[20px] transition-colors" :class="[ $route.name === 'estudiante-certificados' ? 'text-white' : 'text-slate-400 group-hover:text-umsa-blue' ]">workspace_premium</span>
      </button>
    </nav>

    <button @click="router.push('/login')" class="mt-8 flex items-center justify-center space-x-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl font-bold py-3 transition-colors uppercase text-xs tracking-widest mb-2 border border-red-100 dark:border-red-900/30">
      <span class="material-symbols-outlined text-[20px]">logout</span>
      <span>Cerrar Sesión</span>
    </button>
  </aside>
</template>