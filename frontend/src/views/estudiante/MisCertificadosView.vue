<script setup lang="ts">
import { onMounted } from 'vue';
import { useCertificadosStore } from '@/stores/certificados';

const certificadosStore = useCertificadosStore();

onMounted(() => {
  certificadosStore.fetchMisCertificados();
});
</script>

<template>
  <div class="p-6 md:p-10 space-y-8 animate-in fade-in duration-500">
    <div class="flex items-end justify-between border-b border-slate-200 dark:border-gray-800 pb-6">
      <div>
        <h2 class="text-3xl md:text-4xl font-black text-umsa-blue dark:text-blue-400 tracking-tighter uppercase italic">Mis Certificados</h2>
        <p class="text-slate-400 dark:text-gray-400 font-medium mt-2">Explora y descarga los certificados emitidos a tu nombre por la UMSA.</p>
      </div>
    </div>

    <!-- Cargando -->
    <div v-if="certificadosStore.loading" class="flex flex-col items-center justify-center py-20 text-slate-400">
      <span class="material-symbols-outlined animate-spin text-4xl mb-4">progress_activity</span>
      <p class="text-xs font-bold uppercase tracking-widest">Cargando certificados...</p>
    </div>

    <!-- Vacío -->
    <div v-else-if="!certificadosStore.misCertificados.length" class="flex flex-col items-center justify-center py-20 bg-slate-50 dark:bg-gray-800/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-gray-700">
      <span class="material-symbols-outlined text-6xl text-slate-300 dark:text-gray-600 mb-4">sentiment_dissatisfied</span>
      <h3 class="text-xl font-black text-slate-500 dark:text-gray-400 mb-2 uppercase tracking-tighter">Aún no tienes certificados</h3>
      <p class="text-sm text-slate-400 text-center max-w-md">No se encontraron certificados emitidos a tu nombre. Participa en cursos y eventos para obtenerlos.</p>
    </div>

    <!-- Tabla interactiva -->
    <div v-else class="bg-white dark:bg-gray-900 rounded-[2rem] shadow-sm border border-slate-100 dark:border-gray-800 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left whitespace-nowrap">
          <thead class="bg-slate-50 dark:bg-gray-800/50 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-gray-800">
            <tr>
              <th class="px-6 py-4">Evento / Actividad</th>
              <th class="px-6 py-4 text-center">Tipo de Rol</th>
              <th class="px-6 py-4 text-center">Fecha de Emisión</th>
              <th class="px-6 py-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-gray-800 text-xs">
            <tr v-for="cert in certificadosStore.misCertificados" :key="cert.id" class="hover:bg-slate-50/50 dark:hover:bg-gray-800/30 transition-colors">
              <td class="px-6 py-4">
                <p class="font-black text-sm text-umsa-blue dark:text-white mb-0.5">{{ cert.evento?.nombre || cert.evento?.nombre_evento || 'Evento Desconocido' }}</p>
                <p class="text-[10px] text-slate-400 uppercase tracking-widest font-bold">{{ cert.evento?.gestion || '2026' }}</p>
              </td>
              <td class="px-6 py-4 text-center">
                <span v-if="cert.tipo === 1" class="bg-blue-100 text-blue-700 border border-blue-200 px-3 py-1 rounded-full font-black text-[9px] uppercase tracking-widest">Asistente</span>
                <span v-else-if="cert.tipo === 2" class="bg-purple-100 text-purple-700 border border-purple-200 px-3 py-1 rounded-full font-black text-[9px] uppercase tracking-widest">Ponente</span>
                <span v-else-if="cert.tipo === 3" class="bg-amber-100 text-amber-700 border border-amber-200 px-3 py-1 rounded-full font-black text-[9px] uppercase tracking-widest">Logística</span>
                <span v-else class="bg-slate-100 text-slate-700 border border-slate-200 px-3 py-1 rounded-full font-black text-[9px] uppercase tracking-widest">Participante</span>
              </td>
              <td class="px-6 py-4 text-center">
                <p class="font-mono text-slate-500">{{ new Date(cert.fecha_emision || cert.fecha_creacion).toLocaleDateString('es-BO') }}</p>
              </td>
              <td class="px-6 py-4 flex justify-center gap-2">
                <button 
                  @click="certificadosStore.descargarCertificado(cert.id)"
                  class="bg-umsa-blue hover:bg-primary-accent text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md transition-all flex items-center gap-2">
                  <span class="material-symbols-outlined text-[14px]">download</span>
                  Descargar PDF
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
