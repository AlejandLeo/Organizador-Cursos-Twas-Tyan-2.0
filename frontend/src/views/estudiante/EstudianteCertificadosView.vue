<script setup lang="ts">
import { onMounted } from 'vue';
import { useCertificadosStore } from '@/stores/certificados';

const certificadosStore = useCertificadosStore();

onMounted(() => {
  certificadosStore.fetchMisCertificados();
});

const getStatusColor = (tipo: number) => {
  if (tipo === 1) return 'text-blue-600 bg-blue-50 dark:bg-blue-900/40 border-blue-200 dark:border-blue-800'; // Asistente
  if (tipo === 2) return 'text-purple-600 bg-purple-50 dark:bg-purple-900/40 border-purple-200 dark:border-purple-800'; // Ponente
  if (tipo === 3) return 'text-amber-600 bg-amber-50 dark:bg-amber-900/40 border-amber-200 dark:border-amber-800'; // Logistica
  return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/40 border-emerald-200 dark:border-emerald-800'; // Participante/Default
};

const getTipoNombre = (tipo: number) => {
  if (tipo === 1) return 'Asistente';
  if (tipo === 2) return 'Ponente';
  if (tipo === 3) return 'Logística';
  return 'Participante';
};
</script>

<template>
  <div class="animate-in fade-in duration-500 max-w-7xl mx-auto space-y-8">
    <div class="border-b border-slate-200 dark:border-gray-800 pb-6 mb-8 mt-2 flex justify-between items-end">
      <div>
        <h2 class="text-3xl font-black text-primary-dark dark:text-white uppercase italic">Mi Billetera de Certificados</h2>
        <p class="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mt-1">Todos tus logros avalados por The World Academy of Sciences</p>
      </div>
      <span class="material-symbols-outlined text-[3rem] text-umsa-gold drop-shadow-sm">workspace_premium</span>
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
      <p class="text-sm text-slate-400 text-center max-w-md">No se encontraron certificados emitidos a tu nombre.</p>
    </div>

    <!-- Lista de Certificados -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
       <!-- Tarjeta de Certificado -->
       <div v-for="cert in certificadosStore.misCertificados" :key="cert.id" class="group bg-white dark:bg-gray-900 rounded-[1.5rem] overflow-hidden shadow-sm border border-slate-200/60 dark:border-gray-800 hover:border-umsa-gold/50 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-yellow-500/10 flex flex-col justify-between">
          <div class="relative h-40 w-full overflow-hidden shrink-0">
             <div class="absolute inset-0 bg-primary-dark/40 group-hover:bg-black/60 transition-colors z-10 duration-500 backdrop-blur-[1px]"></div>
             <img src="https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800&q=80" class="w-full h-full object-cover grayscale opacity-60 group-hover:scale-110 transition-transform duration-700 ease-out" alt="Fondo">
             <div class="absolute inset-0 flex items-center justify-center z-20">
                <span class="material-symbols-outlined text-white text-5xl opacity-80 group-hover:scale-125 transition-transform duration-500 drop-shadow-md">workspace_premium</span>
             </div>
             <span class="absolute top-3 right-3 z-30 text-[8px] font-black uppercase px-2 py-1 rounded-md tracking-widest shadow-sm border" :class="getStatusColor(cert.tipo)">
               {{ getTipoNombre(cert.tipo) }}
             </span>
          </div>

          <div class="p-6 relative z-20 flex flex-col flex-1">
             <h3 class="text-sm font-black text-slate-800 dark:text-white leading-tight mb-2 line-clamp-2">{{ cert.evento?.nombre || cert.evento?.nombre_evento || 'Evento Desconocido' }}</h3>
             <div class="space-y-1 mt-2">
                 <p class="text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-widest">Emisión: <span class="text-slate-800 dark:text-white">{{ new Date(cert.fecha_emision || cert.fecha_creacion).toLocaleDateString('es-BO') }}</span></p>
                 <p class="text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-widest">Gestión: <span class="font-mono text-slate-700 dark:text-gray-300">{{ cert.evento?.gestion || '2026' }}</span></p>
             </div>
             
             <div class="mt-6 pt-4 border-t border-slate-100 dark:border-gray-800 flex gap-2">
                 <!-- Botón Descargar PDF invocando el endpoint on-the-fly -->
                 <button @click="certificadosStore.descargarCertificado(cert.id)" class="w-full bg-umsa-gold hover:bg-yellow-500 text-white text-[10px] font-black uppercase py-2.5 rounded-lg tracking-widest transition-colors flex items-center justify-center gap-2 shadow-sm">
                     <span class="material-symbols-outlined text-[16px]">download</span> Descargar PDF
                 </button>
             </div>
          </div>
       </div>
    </div>
  </div>
</template>
