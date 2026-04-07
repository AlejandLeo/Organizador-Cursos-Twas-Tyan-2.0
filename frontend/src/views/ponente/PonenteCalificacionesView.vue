<script setup lang="ts">
import { ref } from 'vue';

const estudiantes = ref([
  { id: 1, nombre: 'Ana Gómez', curso: 'Biofertilizantes', version: 'V Edicion', nota: 85, estado: 'Aprobado' },
  { id: 2, nombre: 'Luis Martínez', curso: 'Biofertilizantes', version: 'V Edicion', nota: 60, estado: 'Reprobado' },
  { id: 3, nombre: 'María Vargas', curso: 'Biotecnología', version: 'IX Edicion', nota: 92, estado: 'Aprobado' }
]);
</script>

<template>
  <div class="animate-in fade-in duration-500">
    <div class="mb-8 flex justify-between items-end">
      <div>
        <h1 class="text-2xl font-black text-primary-dark dark:text-white uppercase tracking-tighter flex items-center gap-2">
          <span class="material-symbols-outlined text-umsa-gold text-3xl">grading</span>
          Calificación de Postulantes
        </h1>
        <p class="text-sm text-slate-500 mt-2">Ingresa las calificaciones de los estudiantes por cada actividad académica.</p>
      </div>
      <button class="bg-primary-dark hover:bg-umsa-gold text-white font-bold px-5 py-2.5 rounded-xl uppercase tracking-widest text-xs transition-colors flex items-center gap-2 shadow-lg shadow-primary-dark/20">
        <span class="material-symbols-outlined text-[16px]">save</span>
        Guardar Notas
      </button>
    </div>

    <div class="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-3xl overflow-hidden shadow-sm">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="bg-slate-50 dark:bg-black/50 border-b border-slate-200 dark:border-gray-800">
            <th class="px-6 py-4 text-xs uppercase tracking-widest font-black text-slate-400">Estudiante</th>
            <th class="px-6 py-4 text-xs uppercase tracking-widest font-black text-slate-400">Actividad / Curso</th>
            <th class="px-6 py-4 text-xs uppercase tracking-widest font-black text-slate-400">Nota Final</th>
            <th class="px-6 py-4 text-xs uppercase tracking-widest font-black text-slate-400 text-center">Estado</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="estudiante in estudiantes" :key="estudiante.id" class="border-b border-slate-100 dark:border-gray-800 hover:bg-slate-50/50 dark:hover:bg-gray-800/50 transition-colors">
            <td class="px-6 py-4">
              <div class="font-bold text-sm text-primary-dark dark:text-white">{{ estudiante.nombre }}</div>
            </td>
            <td class="px-6 py-4">
              <div class="text-sm font-semibold text-slate-600 dark:text-gray-300">{{ estudiante.curso }}</div>
              <div class="text-[10px] text-umsa-gold font-bold">{{ estudiante.version }}</div>
            </td>
            <td class="px-6 py-4 w-32">
              <input type="number" v-model="estudiante.nota" class="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm font-bold text-center focus:outline-none focus:border-umsa-gold focus:ring-1 focus:ring-umsa-gold text-primary-dark dark:text-white" min="0" max="100">
            </td>
            <td class="px-6 py-4 text-center">
              <span :class="[estudiante.nota >= 65 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30']" class="px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-bold">
                {{ estudiante.nota >= 65 ? 'Aprobado' : 'Reprobado' }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
