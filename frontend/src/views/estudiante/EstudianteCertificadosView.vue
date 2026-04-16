<script setup lang="ts">
import { ref } from 'vue';

const certificados = ref([
  {
    id: 1,
    actividad: 'Programa de Especialidad en Biofertilizantes',
    tipo: 'Diplomado',
    fechaEmision: '20 Jun 2026',
    codigoQR: 'AB-12345-X',
    imagenTumb: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800&q=80',
    estado: 'Emitido'
  },
  {
    id: 2,
    actividad: 'Taller de Aplicación de Suelos',
    tipo: 'Taller',
    fechaEmision: '30 Jun 2026',
    codigoQR: 'CD-98765-Y',
    imagenTumb: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800&q=80',
    estado: 'Emitido'
  }
]);

const getStatusColor = (status: string) => {
  return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800';
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

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
       <!-- Tarjeta de Certificado -->
       <div v-for="cert in certificados" :key="cert.id" class="group bg-white dark:bg-gray-900 rounded-[1.5rem] overflow-hidden shadow-sm border border-slate-200/60 dark:border-gray-800 hover:border-umsa-gold/50 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-yellow-500/10 flex flex-col justify-between">
          <div class="relative h-40 w-full overflow-hidden shrink-0">
             <div class="absolute inset-0 bg-primary-dark/40 group-hover:bg-black/60 transition-colors z-10 duration-500 backdrop-blur-[1px]"></div>
             <img :src="cert.imagenTumb" class="w-full h-full object-cover grayscale opacity-60 group-hover:scale-110 transition-transform duration-700 ease-out" alt="Fondo">
             <div class="absolute inset-0 flex items-center justify-center z-20">
                <span class="material-symbols-outlined text-white text-5xl opacity-80 group-hover:scale-125 transition-transform duration-500 drop-shadow-md">workspace_premium</span>
             </div>
             <span class="absolute top-3 right-3 z-30 text-[8px] font-black uppercase px-2 py-1 rounded-md tracking-widest shadow-sm" :class="getStatusColor(cert.estado)">
               {{ cert.tipo }}
             </span>
          </div>

          <div class="p-6 relative z-20 flex flex-col flex-1">
             <h3 class="text-sm font-black text-slate-800 dark:text-white leading-tight mb-2 line-clamp-2">{{ cert.actividad }}</h3>
             <div class="space-y-1 mt-2">
                 <p class="text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-widest">Emisión: <span class="text-slate-800 dark:text-white">{{ cert.fechaEmision }}</span></p>
                 <p class="text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-widest">Cod: <span class="font-mono text-slate-700 dark:text-gray-300">{{ cert.codigoQR }}</span></p>
             </div>
             
             <div class="mt-6 pt-4 border-t border-slate-100 dark:border-gray-800 flex gap-2">
                 <button class="flex-1 bg-slate-100 dark:bg-gray-800 hover:bg-slate-200 dark:hover:bg-gray-700 text-slate-600 dark:text-gray-300 text-[10px] font-black uppercase py-2.5 rounded-lg tracking-widest transition-colors flex items-center justify-center gap-2">
                     <span class="material-symbols-outlined text-[16px]">visibility</span> Ver HTML
                 </button>
                 <button class="flex-1 bg-umsa-gold hover:bg-yellow-500 text-white text-[10px] font-black uppercase py-2.5 rounded-lg tracking-widest transition-colors flex items-center justify-center gap-2 shadow-sm">
                     <span class="material-symbols-outlined text-[16px]">download</span> PDF
                 </button>
             </div>
          </div>
       </div>
    </div>
  </div>
</template>
