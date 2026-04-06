<script setup lang="ts">
import { ref } from 'vue';

const versiones = ref([
  {
    id: 1,
    evento: 'TYAN Hands-on Schools en Bolivia',
    edicion: '1era Versión',
    anio: '2023',
    estado: 'Cerrado'
  },
  {
    id: 2,
    evento: 'TYAN Hands-on Schools en Bolivia',
    edicion: '2da Versión',
    anio: '2024',
    estado: 'Cerrado'
  },
  {
    id: 3,
    evento: 'TYAN Hands-on Schools en Bolivia',
    edicion: '3ra Versión',
    anio: '2025',
    estado: 'Activo'
  }
]);
</script>

<template>
  <div class="animate-in fade-in duration-500 max-w-7xl mx-auto space-y-8">
    <div class="flex items-center justify-between border-b border-slate-200 dark:border-gray-800 mb-8 pb-6">
      <div>
        <h2 class="text-3xl font-black text-primary-dark dark:text-white uppercase italic">Versiones de Eventos</h2>
        <p class="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mt-1">Gestión de ediciones y periodos activos</p>
      </div>
      <button class="bg-umsa-blue hover:bg-blue-600 text-white font-black px-6 py-3.5 rounded-xl text-[11px] uppercase tracking-widest shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-2">
        <span class="material-symbols-outlined text-[18px]">history_edu</span> Crear Versión
      </button>
    </div>

    <!-- Lista de Versiones -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div v-for="ver in versiones" :key="ver.id" class="bg-white dark:bg-gray-900 rounded-[2rem] p-6 shadow-sm border border-slate-200 dark:border-gray-800 transition-all flex flex-col justify-between">
        
        <div>
          <div class="flex justify-between items-start mb-4">
            <div class="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-umsa-blue border border-blue-100 dark:border-blue-800">
              <span class="material-symbols-outlined">history</span>
            </div>
            <span class="text-[9px] font-black uppercase px-3 py-1 rounded-full tracking-widest border" :class="ver.estado === 'Activo' ? 'bg-green-50 text-green-600 border-green-200 dark:bg-green-900/30' : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-gray-800'">
              {{ ver.estado }}
            </span>
          </div>

          <p class="text-[9px] font-bold text-umsa-blue uppercase tracking-widest mb-1">Evento Padre: {{ ver.evento }}</p>
          <h3 class="text-xl font-black text-primary-dark dark:text-white leading-tight mb-2">{{ ver.edicion }}</h3>
          
          <div class="flex items-center text-slate-500 dark:text-gray-400 mt-4 mb-6">
            <span class="material-symbols-outlined text-[16px] mr-2">calendar_month</span>
            <span class="text-xs font-bold">Gestión {{ ver.anio }}</span>
          </div>
        </div>

        <div class="border-t border-slate-100 dark:border-gray-800 pt-4 flex justify-between items-center">
            <button class="text-umsa-blue text-xs font-bold hover:underline transition-all flex items-center gap-1">
               Ver Actividades <span class="material-symbols-outlined text-[14px]">arrow_forward</span>
            </button>
        </div>
      </div>
    </div>

  </div>
</template>
