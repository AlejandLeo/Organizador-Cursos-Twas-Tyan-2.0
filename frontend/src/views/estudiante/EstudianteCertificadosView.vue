<script setup lang="ts">
import { ref } from 'vue';

const certificates = ref([
  {
    id: 1,
    course: 'Diseño Web Avanzado',
    type: 'Certificado de Aprobación',
    hours: 120,
    date: '20 Dic 2025',
    code: 'UMSA-PG-2025-081',
    valid: true
  },
  {
    id: 2,
    course: 'Taller de Redacción Científica',
    type: 'Certificado de Asistencia',
    hours: 40,
    date: '15 Sep 2025',
    code: 'UMSA-PG-2025-042',
    valid: true
  }
]);

const downloadPdf = (id: number) => {
  // Simulación de descarga PDF
  console.log(`Descargando certificado ${id}`);
};
</script>

<template>
  <div class="animate-in fade-in duration-500 max-w-7xl mx-auto space-y-8">
    <div class="flex items-center justify-between border-b border-slate-200 dark:border-gray-800 pb-6 mb-8">
      <div>
        <h2 class="text-3xl font-black text-primary-dark dark:text-white uppercase italic">Mis Certificados</h2>
        <p class="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mt-1">Credenciales digitales emitidas a tu nombre</p>
      </div>
    </div>

    <!-- Grid Certificates -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="cert in certificates" :key="cert.id" class="bg-white dark:bg-gray-900 rounded-3xl overflow-hidden shadow-sm border border-slate-100 dark:border-gray-800 hover:shadow-lg transition-all group group-hover:border-umsa-gold">
        <!-- Visual "Diploma" Header -->
        <div class="h-32 bg-gradient-to-r from-umsa-blue to-primary-dark relative flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
          <div class="z-10 text-center text-white">
            <span class="material-symbols-outlined text-4xl text-umsa-gold mb-1">workspace_premium</span>
            <p class="text-[8px] font-black uppercase tracking-[0.3em] opacity-80">Postgrado UMSA</p>
          </div>
        </div>

        <div class="p-6">
          <div class="flex justify-between items-start mb-4">
            <span class="text-[9px] font-black uppercase tracking-widest bg-amber-50 text-amber-700 px-3 py-1 rounded-full border border-amber-200">
              {{ cert.type }}
            </span>
            <span v-if="cert.valid" class="text-emerald-500" title="Firma Digital Verificada">
              <span class="material-symbols-outlined text-[18px]">verified</span>
            </span>
          </div>

          <h3 class="text-lg font-black text-primary-dark dark:text-white leading-tight hover:text-umsa-blue transition-colors cursor-pointer mb-2">
            {{ cert.course }}
          </h3>
          <p class="text-xs font-bold text-slate-500 dark:text-gray-400 mb-6 flex items-center">
            <span class="material-symbols-outlined text-[14px] mr-1">schedule</span> {{ cert.hours }} horas académicas
          </p>

          <div class="space-y-4 pt-4 border-t border-slate-100 dark:border-gray-800">
            <div class="flex items-center justify-between text-xs text-slate-400 font-medium">
              <span>Emisión:</span> <span class="font-bold text-slate-600 dark:text-gray-300">{{ cert.date }}</span>
            </div>
            <div class="flex items-center justify-between text-xs text-slate-400 font-medium">
              <span>Folio:</span> <span class="font-mono text-slate-500">{{ cert.code }}</span>
            </div>
          </div>
          
          <button @click="downloadPdf(cert.id)" class="w-full mt-6 bg-slate-50 dark:bg-gray-800 hover:bg-umsa-blue hover:text-white hover:border-umsa-blue text-slate-600 dark:text-white border border-slate-200 dark:border-gray-700 font-black py-3 rounded-xl transition-all shadow-sm flex items-center justify-center space-x-2 group-hover:bg-umsa-blue group-hover:text-white">
            <span class="material-symbols-outlined text-[18px]">picture_as_pdf</span>
            <span class="text-xs uppercase tracking-widest">Descargar PDF</span>
          </button>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="certificates.length === 0" class="col-span-full py-16 text-center bg-white dark:bg-gray-900 border border-slate-100 dark:border-gray-800 border-dashed rounded-3xl">
        <div class="w-20 h-20 bg-slate-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-200 dark:border-gray-700">
          <span class="material-symbols-outlined text-slate-400 text-3xl">history_edu</span>
        </div>
        <h3 class="text-sm font-black text-slate-600 dark:text-gray-300 uppercase tracking-widest">Sin certificados aún</h3>
        <p class="text-xs text-slate-400 mt-2 max-w-sm mx-auto">Completa una actividad académica o diplomado para comenzar a coleccionar credenciales.</p>
        <button @click="$router.push('/estudiante/actividades')" class="mt-6 bg-umsa-blue text-white px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest shadow-md">Ver mis cursos</button>
      </div>
    </div>
  </div>
</template>