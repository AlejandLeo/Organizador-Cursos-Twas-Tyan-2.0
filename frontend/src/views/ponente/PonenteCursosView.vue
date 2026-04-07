<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const cursosAsignados = ref([
  { id: 1, evento: 'Programa de Especialidad en Biofertilizantes', version: 'V Edicion', fecha: '10/05/2026', estudiantes: 45, estado: 'En Progreso' },
  { id: 2, evento: 'Biotecnología Molecular Basica', version: 'IX Edicion', fecha: '01/08/2026', estudiantes: 120, estado: 'Próximamente' }
]);
</script>

<template>
  <div class="animate-in fade-in duration-500">
    <div class="mb-8">
      <h1 class="text-2xl font-black text-primary-dark dark:text-white uppercase tracking-tighter flex items-center gap-2">
        <span class="material-symbols-outlined text-umsa-gold text-3xl">collections_bookmark</span>
        Mis Actividades Asignadas
      </h1>
      <p class="text-sm text-slate-500 mt-2">Gestiona el desarrollo y contenido de los módulos y cursos a tu cargo.</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div v-for="curso in cursosAsignados" :key="curso.id" @click="router.push({ name: 'ponente-curso-detalle', params: { id: curso.id } })" class="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm hover:shadow-lg hover:border-umsa-gold/50 transition-all cursor-pointer group">
        <div class="flex justify-between items-start mb-4">
          <span class="bg-primary-dark dark:bg-black text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">{{ curso.estado }}</span>
          <span class="material-symbols-outlined text-slate-400">more_vert</span>
        </div>
        <h3 class="font-bold text-lg text-primary-dark dark:text-white leading-tight mt-1">{{ curso.evento }}</h3>
        <p class="text-xs text-umsa-gold font-bold mb-4 mt-2">{{ curso.version }}</p>
        
        <div class="flex items-center gap-4 text-sm text-slate-500 mb-6">
          <div class="flex items-center gap-1.5 font-medium"><span class="material-symbols-outlined text-[16px]">calendar_month</span> {{ curso.fecha }}</div>
          <div class="flex items-center gap-1.5 font-medium"><span class="material-symbols-outlined text-[16px]">group</span> {{ curso.estudiantes }} Inscritos</div>
        </div>
      </div>
    </div>
  </div>
</template>
