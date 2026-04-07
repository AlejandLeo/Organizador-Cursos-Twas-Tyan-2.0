<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const activities = ref([
  {
    id: 1,
    title: 'Inteligencia Artificial Aplicada',
    status: 'En curso',
    type: 'Diplomado',
    date: '15 Mar - 20 Jul 2026',
    progress: 45,
    modules: 4,
    color: 'bg-primary-dark',
    icon: 'neurology'
  },
  {
    id: 2,
    title: 'MetodologÁ­as Ágiles (Scrum, Kanban)',
    status: 'En curso',
    type: 'Curso Corto',
    date: '01 Abr - 30 Abr 2026',
    progress: 90,
    modules: 1,
    color: 'bg-umsa-gold',
    icon: 'group_work'
  },
  {
    id: 3,
    title: 'Análisis de Datos con Python',
    status: 'Finalizado',
    type: 'Taller',
    date: '01 Ene - 28 Feb 2026',
    progress: 100,
    modules: 2,
    color: 'bg-emerald-600',
    icon: 'analytics'
  }
]);

const getStatusColor = (status: string) => {
  if (status === 'En curso') return 'text-umsa-blue bg-blue-50 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-800';
  if (status === 'Finalizado') return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800';
  return 'text-slate-500 bg-slate-100 dark:bg-gray-800 dark:text-gray-400 border border-slate-200 dark:border-gray-700';
};

const openDetalleCurso = (courseId: number) => {
  router.push({ name: 'estudiante-actividades-detalle', params: { id: courseId } });
};
</script>

<template>
  <div class="animate-in fade-in duration-500 max-w-7xl mx-auto space-y-8">
    
    <div class="flex justify-center mb-8">
      <div class="relative w-full max-w-2xl group">
        <label class="absolute -top-3 left-6 px-2 bg-[#f8f9fc] dark:bg-black z-10 text-[9px] font-black text-slate-400 uppercase tracking-widest italic transition-colors">Buscador de mis actividades</label>
        <span class="absolute inset-y-0 left-5 flex items-center text-slate-400">
          <span class="material-symbols-outlined text-xl group-focus-within:text-umsa-blue transition-colors">search</span>
        </span>
        <input class="w-full pl-14 pr-6 py-4 bg-white dark:bg-gray-900 border-2 border-slate-200 dark:border-gray-800 rounded-full shadow-sm text-sm focus:ring-4 focus:ring-umsa-blue/10 focus:border-umsa-blue outline-none transition-all font-bold text-primary-dark dark:text-gray-200 placeholder-slate-400" placeholder="Buscar por nombre, tipo..." type="text">
      </div>
    </div>
    
    <div class="flex items-center justify-between border-b border-slate-200 dark:border-gray-800 mb-8 pb-6">
      <div>
        <h2 class="text-3xl font-black text-primary-dark dark:text-white uppercase italic">Mis Actividades Académicas</h2>
        <p class="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mt-1">Cursos, talleres y diplomados en los que estás inscrito</p>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="act in activities" :key="act.id" @click="openDetalleCurso(act.id)" class="bg-white dark:bg-gray-900 rounded-[2rem] p-6 shadow-sm border border-slate-100 dark:border-gray-800 hover:shadow-md hover:border-umsa-blue transition-all group cursor-pointer flex flex-col relative overflow-hidden">
        
        <div class="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/0 to-slate-50/50 dark:to-white/5 rounded-bl-full -z-0"></div>

        <div class="flex justify-between items-start mb-6 relative z-10">
          <div class="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-md shadow-slate-200 dark:shadow-none" :class="act.color">
            <span class="material-symbols-outlined text-2xl" style="font-variation-settings: 'FILL' 1;">{{ act.icon }}</span>
          </div>
          <span class="text-[9px] font-black uppercase px-3 py-1 rounded-full tracking-widest" :class="getStatusColor(act.status)">
            {{ act.status }}
          </span>
        </div>

        <div class="flex-1 relative z-10">
          <p class="text-[9px] font-bold text-umsa-gold dark:text-blue-400 uppercase tracking-widest mb-2">{{ act.type }}</p>
          <h3 class="text-xl font-black text-primary-dark dark:text-white leading-tight mb-2 group-hover:text-umsa-blue transition-colors">{{ act.title }}</h3>
        </div>

        <div class="mt-6 space-y-3 pt-5 border-t border-slate-100 dark:border-gray-800 relative z-10">
          <div class="flex items-center text-slate-500 dark:text-gray-400 bg-slate-50 dark:bg-gray-800/50 p-2 rounded-lg">
            <span class="material-symbols-outlined text-[16px] mr-3 text-slate-400">calendar_today</span>
            <span class="text-xs font-bold">{{ act.date }}</span>
          </div>
          
          <div class="mt-4">
            <div class="flex justify-between text-xs mb-2">
              <span class="font-bold text-slate-500 uppercase tracking-widest text-[9px]">Progreso</span>
              <span class="font-black" :class="act.progress === 100 ? 'text-emerald-500' : 'text-umsa-blue'">{{ act.progress }}%</span>
            </div>
            <div class="w-full bg-slate-100 dark:bg-gray-800 rounded-full h-2.5">
              <div :class="[act.progress === 100 ? 'bg-emerald-500' : 'bg-umsa-blue', 'h-2.5 rounded-full transition-all duration-1000']" :style="{ width: act.progress + '%' }"></div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>