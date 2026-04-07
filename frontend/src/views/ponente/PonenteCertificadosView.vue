<script setup lang="ts">
import { ref } from 'vue';

const certificados = ref([
  { id: 1, evento: 'Programa de Especialidad en Biofertilizantes', version: 'V Edicion', rol: 'Expositor Magistral', emitido: '15/09/2026', codigo: 'CER-TW-001' },
  { id: 2, evento: 'Congreso Internacional de Recursos Hídricos', version: 'Edicion Internacional', rol: 'Ponente', emitido: '15/10/2026', codigo: 'CER-TW-058' }
]);
</script>

<template>
  <div class="animate-in fade-in duration-500">
    <div class="mb-8">
      <h1 class="text-2xl font-black text-primary-dark dark:text-white uppercase tracking-tighter flex items-center gap-2">
        <span class="material-symbols-outlined text-umsa-gold text-3xl">workspace_premium</span>
        Mis Certificados de Ponente
      </h1>
      <p class="text-sm text-slate-500 mt-2">Descarga y visualiza los certificados emitidos a tu nombre por tu participación académica.</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div v-for="cert in certificados" :key="cert.id" class="relative bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-3xl p-8 shadow-sm flex flex-col h-full group overflow-hidden">
        <!-- Decoracion dorada -->
        <div class="absolute top-0 right-0 w-32 h-32 bg-umsa-gold/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-umsa-gold/20 transition-all duration-500"></div>

        <div class="relative z-10 flex-1">
          <div class="w-12 h-12 bg-slate-50 dark:bg-gray-800 rounded-xl flex items-center justify-center mb-6 shadow-inner border border-slate-100 dark:border-gray-700 text-umsa-gold">
            <span class="material-symbols-outlined text-2xl">verified</span>
          </div>
          
          <h3 class="font-black text-xl text-primary-dark dark:text-white leading-tight uppercase mb-1">{{ cert.evento }}</h3>
          <p class="text-xs font-bold text-umsa-gold tracking-widest uppercase mb-4">{{ cert.version }}</p>
          
          <div class="space-y-3 mb-6">
            <div class="flex items-center justify-between text-sm border-b border-slate-100 dark:border-gray-800 pb-2">
              <span class="text-slate-500 dark:text-gray-400 font-medium">Rol:</span>
              <span class="font-bold text-primary-dark dark:text-white">{{ cert.rol }}</span>
            </div>
            <div class="flex items-center justify-between text-sm border-b border-slate-100 dark:border-gray-800 pb-2">
              <span class="text-slate-500 dark:text-gray-400 font-medium">Fecha de Emisión:</span>
              <span class="font-bold text-primary-dark dark:text-white">{{ cert.emitido }}</span>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-slate-500 dark:text-gray-400 font-medium">Código:</span>
              <span class="font-bold text-primary-dark dark:text-white uppercase tracking-wider">{{ cert.codigo }}</span>
            </div>
          </div>
        </div>

        <button class="relative z-10 w-full mt-auto bg-primary-dark dark:bg-black text-white hover:bg-umsa-gold dark:hover:bg-umsa-gold font-bold text-xs uppercase tracking-widest py-3.5 rounded-xl transition-all border border-transparent shadow flex items-center justify-center gap-2">
          <span class="material-symbols-outlined text-[18px]">download</span>
          Descargar PDF
        </button>
      </div>
    </div>
  </div>
</template>
