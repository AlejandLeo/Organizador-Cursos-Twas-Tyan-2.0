<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();

const navigate = (routeName: string) => {
  router.push({ name: routeName });
};
</script>

<template>
  <aside class="w-72 bg-white dark:bg-gray-950 text-slate-600 dark:text-gray-300 flex flex-col px-4 py-8 fixed left-0 bottom-0 top-[75px] z-50 border-r border-slate-200 dark:border-gray-800 overflow-y-auto transition-colors duration-300">
    <div class="mb-8 p-5 bg-slate-50 dark:bg-gray-900 rounded-2xl border border-slate-100 dark:border-gray-800 shadow-sm">
      <p class="text-[10px] uppercase tracking-widest text-umsa-blue dark:text-blue-400 font-bold mb-1">Bienvenido</p>
      <h3 class="text-sm font-black text-primary-dark dark:text-white leading-tight">Alejandro Leonardo</h3>
      <p class="text-xs text-slate-500 dark:text-gray-400 mt-1">Morales Ayma</p>
    </div>

    <nav class="space-y-1 flex-1">
      <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 mt-2 pl-2">MenÃÂº Principal</p>

      <button @click="navigate('coordinador-dashboard')"
        :class="[ $route.name === 'coordinador-dashboard' ? 'nav-active bg-umsa-blue text-white shadow-md shadow-umsa-blue/20' : 'hover:bg-slate-50 dark:hover:bg-gray-900 text-slate-500' ]"
        class="w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all group">
        <span class="text-xs uppercase tracking-widest font-bold">Dashboard</span>
        <span class="material-symbols-outlined text-[20px] transition-colors" :class="[ $route.name === 'coordinador-dashboard' ? 'text-white' : 'text-slate-400 group-hover:text-umsa-blue' ]">dashboard</span>        
      </button>

      <button @click="navigate('coordinador-actividades')"
        :class="[ $route.name === 'coordinador-actividades' ? 'nav-active bg-umsa-blue text-white shadow-md shadow-umsa-blue/20' : 'hover:bg-slate-50 dark:hover:bg-gray-900 text-slate-500' ]"
        class="w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all group mt-2">
        <span class="text-xs uppercase tracking-widest font-bold">Actividades</span>
        <span class="material-symbols-outlined text-[20px] transition-colors" :class="[ $route.name === 'coordinador-actividades' ? 'text-white' : 'text-slate-400 group-hover:text-umsa-blue' ]">school</span>
      </button>

      <button @click="navigate('coordinador-certificados')"
        :class="[ $route.name === 'coordinador-certificados' ? 'nav-active bg-umsa-blue text-white shadow-md shadow-umsa-blue/20' : 'hover:bg-slate-50 dark:hover:bg-gray-900 text-slate-500' ]"
        class="w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all group mt-2">
        <span class="text-xs uppercase tracking-widest font-bold">Certificados</span>
        <span class="material-symbols-outlined text-[20px] transition-colors" :class="[ $route.name === 'coordinador-certificados' ? 'text-white' : 'text-slate-400 group-hover:text-umsa-blue' ]">workspace_premium</span>
      </button>

      <div class="my-6 border-t border-slate-200 dark:border-gray-800"></div>
      <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 pl-2">Gestión de Institución</p>
      
      <button @click="navigate('coordinador-eventos')"
        :class="[ $route.name === 'coordinador-eventos' ? 'nav-active bg-umsa-blue text-white shadow-md shadow-umsa-blue/20' : 'hover:bg-slate-50 dark:hover:bg-gray-900 text-slate-500' ]"
        class="w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all group mt-2">
        <span class="text-xs uppercase tracking-widest font-bold">Gestión de Eventos</span>
        <span class="material-symbols-outlined text-[20px] transition-colors" :class="[ $route.name === 'coordinador-eventos' ? 'text-white' : 'text-slate-400 group-hover:text-umsa-blue' ]">corporate_fare</span>  
      </button>

      <div class="my-6 border-t border-slate-200 dark:border-gray-800"></div>
      <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 pl-2">Directorio y CRUD</p>
      
      <button @click="navigate('coordinador-usuarios')"
        :class="[ $route.name === 'coordinador-usuarios' ? 'nav-active bg-umsa-blue text-white shadow-md shadow-umsa-blue/20' : 'hover:bg-slate-50 dark:hover:bg-gray-900 text-slate-500' ]"
        class="w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all group mt-2">
        <span class="text-xs uppercase tracking-widest font-bold">Usuarios</span>
        <span class="material-symbols-outlined text-[20px] transition-colors" :class="[ $route.name === 'coordinador-usuarios' ? 'text-white' : 'text-slate-400 group-hover:text-umsa-blue' ]">manage_accounts</span>  
      </button>

      <button @click="navigate('coordinador-estudiantes-global')"
        :class="[ $route.name === 'coordinador-estudiantes-global' ? 'nav-active bg-umsa-blue text-white shadow-md shadow-umsa-blue/20' : 'hover:bg-slate-50 dark:hover:bg-gray-900 text-slate-500' ]"
        class="w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all group mt-2">
        <span class="text-xs uppercase tracking-widest font-bold">Estudiantes</span>
        <span class="material-symbols-outlined text-[20px] transition-colors" :class="[ $route.name === 'coordinador-estudiantes-global' ? 'text-white' : 'text-slate-400 group-hover:text-umsa-blue' ]">groups</span>
      </button>

      <button @click="navigate('coordinador-ponentes-global')"
        :class="[ $route.name === 'coordinador-ponentes-global' ? 'nav-active bg-umsa-blue text-white shadow-md shadow-umsa-blue/20' : 'hover:bg-slate-50 dark:hover:bg-gray-900 text-slate-500' ]"
        class="w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all group mt-2">
        <span class="text-xs uppercase tracking-widest font-bold">Ponentes</span>
        <span class="material-symbols-outlined text-[20px] transition-colors" :class="[ $route.name === 'coordinador-ponentes-global' ? 'text-white' : 'text-slate-400 group-hover:text-umsa-blue' ]">record_voice_over</span>
      </button>
    </nav>

    <button @click="router.push('/login')" class="mt-8 flex items-center justify-center space-x-3 text-red-500 hover:bg-red-50 rounded-xl font-bold py-3 transition-colors uppercase text-xs tracking-widest mb-2 border border-red-100">
      <span class="material-symbols-outlined text-[20px]">logout</span>
      <span>Cerrar Sesión</span>
    </button>
  </aside>
</template>
