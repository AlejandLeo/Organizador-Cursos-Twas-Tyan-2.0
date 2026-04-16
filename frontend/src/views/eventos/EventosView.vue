<script setup lang="ts">
import { ref, computed } from 'vue';

const eventosPlanoDB = ref([
  { id: 1, nombre: 'TYAN Hands-on Schools en Bolivia', descripcion: 'Programa integral práctico para investigadores.', gestion: '2023', estado: 'Concluido' },
  { id: 2, nombre: 'TYAN Hands-on Schools en Bolivia', descripcion: 'Programa integral práctico para investigadores.', gestion: '2024', estado: 'Concluido' },
  { id: 3, nombre: 'TYAN Hands-on Schools en Bolivia', descripcion: 'Programa integral práctico para investigadores.', gestion: '2025', estado: 'Activo' },
  { id: 4, nombre: 'Congreso Internacional de Biotecnología', descripcion: 'Ciclo de conferencias de alto nivel en ciencias biológicas.', gestion: '2024', estado: 'Planificación' },
  { id: 5, nombre: 'Congreso Internacional de Biotecnología', descripcion: 'Ciclo de conferencias de alto nivel en ciencias biológicas.', gestion: '2025', estado: 'Borrador' }
]);

const eventosAgrupados = computed(() => {
  const map = new Map();
  eventosPlanoDB.value.forEach(ev => {
    if (!map.has(ev.nombre)) {
      map.set(ev.nombre, {
        nombre: ev.nombre,
        descripcion: ev.descripcion,
        estadoGeneral: ev.estado === 'Activo' ? 'Activo' : ev.estado,
        gestiones: []
      });
    }
    const group = map.get(ev.nombre);
    // Si hay alguno activo, resalta el general
    if (ev.estado === 'Activo') group.estadoGeneral = 'Activo';
    
    group.gestiones.push(ev);
  });
  return Array.from(map.values()).sort((a,b) => b.gestiones.length - a.gestiones.length); // Ordenar por los que tienen más gestiones
});
</script>

<template>
  <div class="animate-in fade-in duration-500 max-w-7xl mx-auto space-y-8">
    <div class="flex items-center justify-between border-b border-slate-200 dark:border-gray-800 mb-8 pb-6">
      <div>
        <h2 class="text-3xl font-black text-primary-dark dark:text-white uppercase italic">Gestión de Eventos</h2>
        <p class="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mt-1">Configuración unificada: Evento y sus Gestiones</p>
      </div>
      <button class="bg-primary-dark dark:bg-blue-600 hover:bg-blue-900 dark:hover:bg-blue-700 text-white font-black px-6 py-3.5 rounded-xl text-[11px] uppercase tracking-widest shadow-lg hover:-translate-y-0.5 transition-all flex items-center gap-2">
        <span class="material-symbols-outlined text-[18px]">add_business</span> Nueva Gestión de Evento
      </button>
    </div>

    <!-- Lista de eventos agrupados -->
    <div class="grid grid-cols-1 gap-6">
      <div v-for="(evento, index) in eventosAgrupados" :key="index" class="bg-white dark:bg-gray-900 rounded-[2rem] p-8 shadow-sm border border-slate-200 dark:border-gray-800 transition-all">
        
        <div class="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-6">
          <div class="flex-1">
            <div class="flex items-center gap-3 mb-3">
              <div class="w-12 h-12 rounded-xl bg-slate-50 dark:bg-gray-800 flex items-center justify-center text-umsa-blue border border-slate-100 dark:border-gray-700">
                <span class="material-symbols-outlined">corporate_fare</span>
              </div>
              <div>
                <h3 class="text-xl font-black text-primary-dark dark:text-white leading-tight mb-1">{{ evento.nombre }}</h3>
                <span class="text-[9px] font-black uppercase px-3 py-1 rounded-full tracking-widest border" :class="evento.estadoGeneral === 'Activo' ? 'bg-green-50 text-green-600 border-green-200 dark:bg-green-900/30' : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-gray-800 text-gray-400'">
                  {{ evento.estadoGeneral }}
                </span>
              </div>
            </div>
            <p class="text-sm font-bold text-slate-500 dark:text-gray-400 pl-[3.75rem]">{{ evento.descripcion }}</p>
          </div>
          
          <!-- Quick summary of Gestiones -->
          <div class="md:w-auto text-right md:border-l border-slate-100 dark:border-gray-800 md:pl-6">
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Aperturas Totales</p>
            <div class="flex items-center md:justify-end gap-2 mt-1">
              <span class="text-3xl font-black text-umsa-gold">{{ evento.gestiones.length }}</span>
              <span class="text-xs font-bold text-slate-500">Gestiones</span>
            </div>
          </div>
        </div>

        <div class="pl-0 md:pl-[3.75rem]">
          <h4 class="text-xs font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-4">Gestiones / Versiones Disponibles</h4>
          
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div v-for="gestion in evento.gestiones" :key="gestion.id" class="p-4 rounded-xl border border-slate-200 dark:border-gray-700 hover:border-umsa-blue dark:hover:border-umsa-blue transition-all group cursor-pointer bg-slate-50 dark:bg-gray-800">
              <div class="flex justify-between items-center mb-2">
                <span class="text-lg font-black text-primary-dark dark:text-white">{{ gestion.gestion }}</span>
                <span class="material-symbols-outlined text-[18px] text-slate-300 dark:text-gray-600 group-hover:text-umsa-blue transition-colors">history</span>
              </div>
              <div class="flex justify-between items-end">
                <span class="text-[10px] uppercase font-bold text-slate-500" :class="gestion.estado === 'Activo' ? 'text-umsa-blue dark:text-blue-400' : ''">
                  {{ gestion.estado }}
                </span>
                <span class="text-[10px] font-bold text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">Editar <span class="material-symbols-outlined text-[10px]">edit</span></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>
