<script setup lang="ts">
import { ref } from 'vue';

const resumenPanel = ref([
  { title: 'Cursos Inscritos', count: 4, icon: 'book', bg: 'bg-blue-50 text-blue-600 border-blue-100' },
  { title: 'Actividades Pendientes', count: 2, icon: 'assignment_late', bg: 'bg-amber-50 text-amber-600 border-amber-100' },
  { title: 'Certificados Listos', count: 1, icon: 'workspace_premium', bg: 'bg-emerald-50 text-emerald-600 border-emerald-100' }
]);
</script>

<template>
  <div class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-black text-primary-dark dark:text-white tracking-tight">Bienvenida, Maria</h1>
        <p class="text-slate-500 dark:text-gray-400 mt-2 font-medium">Revisa tu progreso y actividades de la semana.</p>
      </div>
      <button @click="$router.push({ name: 'estudiante-catalogo' })" class="bg-umsa-blue hover:bg-blue-800 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-umsa-blue/30 transition-all flex items-center space-x-2">
        <span class="material-symbols-outlined text-[20px]">local_library</span>
        <span>Explorar Actividades</span>
      </button>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div v-for="(stat, i) in resumenPanel" :key="i" class="p-6 rounded-3xl bg-white dark:bg-gray-900 border border-slate-100 dark:border-gray-800 shadow-sm flex items-center space-x-5 hover:shadow-md transition-shadow">
        <div :class="[stat.bg, 'w-14 h-14 rounded-2xl flex items-center justify-center border']">
          <span class="material-symbols-outlined text-[28px]">{{ stat.icon }}</span>
        </div>
        <div>
          <p class="text-3xl font-black text-slate-800 dark:text-white leading-none">{{ stat.count }}</p>
          <p class="text-xs uppercase tracking-widest text-slate-400 font-bold mt-1">{{ stat.title }}</p>
        </div>
      </div>
    </div>

    <!-- Recent Courses -->
    <div class="bg-white dark:bg-gray-900 rounded-3xl p-8 border border-slate-100 dark:border-gray-800 shadow-sm">
      <h3 class="text-lg font-black text-primary-dark dark:text-white mb-6 flex items-center space-x-2">
        <span class="material-symbols-outlined text-umsa-blue">schedule</span>
        <span>Continuar Aprendiendo</span>
      </h3>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div @click="$router.push({ name: 'estudiante-actividades-detalle', params: { id: 1 } })" class="border border-slate-200 dark:border-gray-800 rounded-2xl p-5 hover:border-umsa-blue transition-colors group cursor-pointer">
          <div class="flex justify-between items-start mb-4">
            <span class="px-3 py-1 bg-blue-50 text-umsa-blue text-[10px] font-black uppercase tracking-widest rounded-lg">Diplomado</span>
            <span class="material-symbols-outlined text-slate-300 group-hover:text-umsa-blue transition-colors">arrow_forward</span>
          </div>
          <h4 class="font-bold text-slate-800 dark:text-white text-lg">Inteligencia Artificial Aplicada</h4>
          <p class="text-sm text-slate-500 mt-2 mb-4">Módulo 2: Redes Neuronales</p>
          <div class="w-full bg-slate-100 dark:bg-gray-800 rounded-full h-2 mb-2">
            <div class="bg-umsa-blue h-2 rounded-full" style="width: 45%"></div>
          </div>
          <p class="text-xs text-right text-slate-400 font-bold">45% Completado</p>
        </div>

        <div @click="$router.push({ name: 'estudiante-actividades-detalle', params: { id: 1 } })" class="border border-slate-200 dark:border-gray-800 rounded-2xl p-5 hover:border-umsa-blue transition-colors group cursor-pointer">
          <div class="flex justify-between items-start mb-4">
            <span class="px-3 py-1 bg-amber-50 text-amber-600 text-[10px] font-black uppercase tracking-widest rounded-lg">Curso Corto</span>
            <span class="material-symbols-outlined text-slate-300 group-hover:text-umsa-blue transition-colors">arrow_forward</span>
          </div>
          <h4 class="font-bold text-slate-800 dark:text-white text-lg">MetodologÃ­as Ãgiles</h4>
          <p class="text-sm text-slate-500 mt-2 mb-4">Evaluación Final Pendiente</p>
          <div class="w-full bg-slate-100 dark:bg-gray-800 rounded-full h-2 mb-2">
            <div class="bg-amber-500 h-2 rounded-full" style="width: 90%"></div>
          </div>
          <p class="text-xs text-right text-slate-400 font-bold">90% Completado</p>
        </div>
      </div>
    </div>
  </div>
</template>