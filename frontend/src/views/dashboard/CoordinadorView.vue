<script setup lang="ts">
import { ref } from 'vue';
import StatCard from '@/components/dashboard/StatCard.vue';

// Aquí simulamos cómo el backend podría traerte las métricas del dashboard
const stats = ref([
  { title: 'Total Estudiantes', value: '1,542', icon: 'groups', variant: 'default' },
  { title: 'Actividades Activas', value: '12', icon: 'menu_book', variant: 'default' },
  { title: 'Docs. Emitidos', value: '3,450', icon: 'workspace_premium', variant: 'primary' },
  { title: 'Aprobación Global', value: '85%', icon: 'trending_up', variant: 'success' },
]);
</script>

<template>
  <div class="space-y-8 animate-in fade-in duration-500">
    <h2 class="text-3xl font-black text-primary-dark dark:text-white uppercase italic mb-8 border-b border-slate-200 dark:border-gray-800 pb-4">Panel de Control General</h2>
    
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
            v-for="(stat, idx) in stats" 
            :key="idx" 
            :title="stat.title" 
            :value="stat.value" 
            :icon="stat.icon" 
            :variant="stat.variant as any" 
        />
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
        <div class="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-gray-800 shadow-sm transition-colors">
            <div class="flex justify-between items-center mb-10">
                <h3 class="text-lg font-black text-primary-dark dark:text-white uppercase italic">Inscritos por Actividad</h3>
                <span class="text-[9px] bg-slate-100 dark:bg-gray-800 text-slate-500 dark:text-gray-400 px-3 py-1 rounded-full font-bold uppercase tracking-widest">Estadísticas</span>
            </div>
            <div class="flex items-end justify-around h-56 w-full gap-4 border-b-2 border-slate-100 dark:border-gray-800 pb-2">
                <div class="flex flex-col items-center w-full group relative">
                    <span class="absolute -top-8 text-[10px] font-black text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-gray-800 px-2 py-1 rounded shadow-sm">45</span>
                    <div class="w-full max-w-[3rem] bg-slate-200 dark:bg-gray-700 rounded-t-xl h-[45%] group-hover:bg-emerald-500 dark:group-hover:bg-blue-500 transition-colors cursor-pointer"></div>
                    <span class="text-[9px] font-bold text-slate-500 dark:text-gray-400 mt-4 uppercase text-center leading-tight">Bio<br>fertilizantes</span>
                </div>
                <div class="flex flex-col items-center w-full group relative">
                    <span class="absolute -top-8 text-[10px] font-black text-primary-dark dark:text-white opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-gray-800 px-2 py-1 rounded shadow-sm">120</span>
                    <div class="w-full max-w-[3rem] bg-primary-dark dark:bg-blue-600 rounded-t-xl h-[100%] shadow-md cursor-pointer"></div>
                    <span class="text-[9px] font-black text-primary-dark dark:text-white mt-4 uppercase text-center leading-tight">Redacción<br>APA</span>
                </div>
                <div class="flex flex-col items-center w-full group relative">
                    <span class="absolute -top-8 text-[10px] font-black text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-gray-800 px-2 py-1 rounded shadow-sm">75</span>
                    <div class="w-full max-w-[3rem] bg-slate-200 dark:bg-gray-700 rounded-t-xl h-[75%] group-hover:bg-emerald-500 dark:group-hover:bg-blue-500 transition-colors cursor-pointer"></div>
                    <span class="text-[9px] font-bold text-slate-500 dark:text-gray-400 mt-4 uppercase text-center leading-tight">Riego<br>Agro</span>
                </div>
                <div class="flex flex-col items-center w-full group relative">
                    <span class="absolute -top-8 text-[10px] font-black text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-gray-800 px-2 py-1 rounded shadow-sm">30</span>
                    <div class="w-full max-w-[3rem] bg-slate-200 dark:bg-gray-700 rounded-t-xl h-[30%] group-hover:bg-emerald-500 dark:group-hover:bg-blue-500 transition-colors cursor-pointer"></div>
                    <span class="text-[9px] font-bold text-slate-500 dark:text-gray-400 mt-4 uppercase text-center leading-tight">Genética<br>Vegetal</span>
                </div>
            </div>
        </div>

        <div class="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-gray-800 shadow-sm flex flex-col items-center relative transition-colors">
            <h3 class="text-lg font-black text-primary-dark dark:text-white mb-10 uppercase italic w-full text-left">Distribución de Programas</h3>
            <div class="w-52 h-52 rounded-full flex items-center justify-center shadow-sm" style="background: conic-gradient(var(--color-primary-dark, #012248) 0% 50%, var(--color-umsa-gold, #BC9C31) 50% 75%, #f1f5f9 75% 100%);">
                <div class="w-36 h-36 bg-white dark:bg-gray-900 rounded-full flex flex-col items-center justify-center shadow-inner transition-colors">
                    <p class="text-4xl font-black text-primary-dark dark:text-white italic">12</p>
                    <p class="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Actividades</p>
                </div>
            </div>
            <div class="flex flex-wrap justify-center gap-6 mt-10 w-full">
                <div class="flex items-center gap-2"><span class="w-3 h-3 rounded-full bg-primary-dark dark:bg-blue-600"></span><span class="text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase">Diplomados (50%)</span></div>
                <div class="flex items-center gap-2"><span class="w-3 h-3 rounded-full bg-emerald-500 dark:bg-blue-400"></span><span class="text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase">Especialidades (25%)</span></div>
                <div class="flex items-center gap-2"><span class="w-3 h-3 rounded-full bg-slate-100 dark:bg-gray-700 border border-slate-200 dark:border-gray-600"></span><span class="text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase">Talleres (25%)</span></div>
            </div>
        </div>
    </div>
  </div>
</template>