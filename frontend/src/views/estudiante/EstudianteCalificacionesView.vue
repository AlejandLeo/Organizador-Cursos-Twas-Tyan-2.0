<script setup lang="ts">
import { ref } from 'vue';

const grades = ref([
  {
    id: 1,
    course: 'Inteligencia Artificial Aplicada',
    module: 'Módulo 1: Introducción y Fundamentos',
    grade: 95,
    status: 'Aprobado',
    date: '20 Mar 2026',
    teacher: 'Ing. Laura Valdivia'
  },
  {
    id: 2,
    course: 'Inteligencia Artificial Aplicada',
    module: 'Módulo 2: Redes Neuronales',
    grade: 88,
    status: 'Aprobado',
    date: '10 Abr 2026',
    teacher: 'Ing. Roberto Mamani'
  },
  {
    id: 3,
    course: 'Metodologías Ágiles',
    module: 'Evaluación Única',
    grade: 0,
    status: 'Pendiente',
    date: '25 Abr 2026',
    teacher: 'Lic. Claudia Vargas'
  }
]);

const getGradeColor = (grade: number, status: string) => {
  if (status === 'Pendiente') return 'text-slate-500 bg-slate-100';
  if (grade >= 90) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
  if (grade >= 51) return 'text-blue-700 bg-blue-50 border-blue-200';
  return 'text-red-700 bg-red-50 border-red-200';
};
</script>

<template>
  <div class="animate-in fade-in duration-500 max-w-7xl mx-auto space-y-8">
    <div class="flex items-center justify-between border-b border-slate-200 dark:border-gray-800 pb-6 mb-8">
      <div>
        <h2 class="text-3xl font-black text-primary-dark dark:text-white uppercase italic">Historial de Calificaciones</h2>
        <p class="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mt-1">Revisa tus notas por módulo de cada actividad</p>
      </div>
      
      <button class="bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 hover:border-umsa-blue text-slate-600 dark:text-gray-300 font-black px-5 py-2.5 rounded-xl text-[11px] uppercase tracking-widest shadow-sm hover:text-umsa-blue transition-all flex items-center gap-2">
        <span class="material-symbols-outlined text-[18px]">download</span> Descargar Récord
      </button>
    </div>

    <!-- Table Container -->
    <div class="bg-white dark:bg-gray-900 rounded-3xl border border-slate-100 dark:border-gray-800 shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-50 dark:bg-gray-800/50 border-b border-slate-200 dark:border-gray-800">
              <th class="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Actividad / Módulo</th>
              <th class="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Docente</th>
              <th class="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha Asignación</th>
              <th class="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Nota (100)</th>
              <th class="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Estado</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-gray-800">
            <tr v-for="item in grades" :key="item.id" class="hover:bg-slate-50/50 dark:hover:bg-gray-800/20 transition-colors group">
              <td class="py-4 px-6">
                <p class="text-sm font-black text-primary-dark dark:text-white mb-0.5">{{ item.course }}</p>
                <p class="text-xs font-bold text-slate-500">{{ item.module }}</p>
              </td>
              <td class="py-4 px-6">
                <div class="flex items-center space-x-2">
                  <div class="w-6 h-6 rounded-full bg-slate-200 dark:bg-gray-700 flex items-center justify-center text-slate-400">
                    <span class="material-symbols-outlined text-[14px]">person</span>
                  </div>
                  <span class="text-xs font-bold text-slate-600 dark:text-gray-300">{{ item.teacher }}</span>
                </div>
              </td>
              <td class="py-4 px-6 text-xs text-slate-500 font-medium">
                {{ item.date }}
              </td>
              <td class="py-4 px-6 text-center">
                <span v-if="item.status !== 'Pendiente'" class="text-lg font-black" :class="item.grade >= 51 ? 'text-emerald-600' : 'text-red-500'">
                  {{ item.grade }}
                </span>
                <span v-else class="text-xl font-black text-slate-300">-</span>
              </td>
              <td class="py-4 px-6 text-center">
                <span class="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border"
                      :class="getGradeColor(item.grade, item.status)">
                  {{ item.status }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <!-- Empty State -->
      <div v-if="grades.length === 0" class="py-12 text-center">
        <div class="w-16 h-16 bg-slate-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
          <span class="material-symbols-outlined text-slate-400 text-2xl">sentiment_dissatisfied</span>
        </div>
        <h3 class="text-sm font-black text-slate-600 dark:text-gray-300">Sin calificaciones registradas</h3>
        <p class="text-xs text-slate-400 mt-1">Aún no tienes notas asignadas en este periodo.</p>
      </div>
    </div>
  </div>
</template>