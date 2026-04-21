<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const eventosAsignados = ref([
  {
    id: 1,
    title: 'Programa de Especialidad en Biofertilizantes',
    status: 'En Progreso',
    gestion: '2026',
    date: '10/05/2026 - 15/09/2026',
    progress: 45,
    actividadesCount: 2,
    color: 'bg-primary-dark',
    icon: 'event'
  },
  {
    id: 2,
    title: 'Simposio Internacional de Inteligencia Artificial',
    status: 'Próximamente',
    gestion: '2026',
    date: '01/08/2026 - 30/08/2026',
    progress: 0,
    actividadesCount: 1,
    color: 'bg-umsa-gold',
    icon: 'event_available'
  }
]);

const getStatusColor = (status: any) => {
  if (status === 'En Progreso') return 'text-umsa-blue bg-blue-50 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-800';
  if (status === 'Finalizado') return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800';
  return 'text-slate-500 bg-slate-100 dark:bg-gray-800 dark:text-gray-400 border border-slate-200 dark:border-gray-700';
};

const openActividadesEvento = (eventoId: any) => {
  router.push({ name: 'ponente-curso', params: { evento_id: eventoId } });
};
</script>

<template>
  <div class="animate-in fade-in duration-500 max-w-7xl mx-auto space-y-8">
    
    <div class="flex justify-center mb-8">
      <div class="relative w-full max-w-2xl group">
        <label class="absolute -top-3 left-6 px-2 bg-[#f8f9fc] dark:bg-black z-10 text-[9px] font-black text-slate-400 uppercase tracking-widest italic transition-colors">Buscador de mis cursos asignados</label>
        <span class="absolute inset-y-0 left-5 flex items-center text-slate-400">
          <span class="material-symbols-outlined text-xl group-focus-within:text-umsa-blue transition-colors">search</span>
        </span>
        <input class="w-full pl-14 pr-6 py-4 bg-white dark:bg-gray-900 border-2 border-slate-200 dark:border-gray-800 rounded-full shadow-sm text-sm focus:ring-4 focus:ring-umsa-blue/10 focus:border-umsa-blue outline-none transition-all font-bold text-primary-dark dark:text-gray-200 placeholder-slate-400" placeholder="Buscar por programa o gestión..." type="text">
      </div>
    </div>
    
    <div class="flex items-center justify-between border-b border-slate-200 dark:border-gray-800 mb-8 pb-6">
      <div>
        <h2 class="text-3xl font-black text-primary-dark dark:text-white uppercase italic">Mis Cursos Asignados</h2>
        <p class="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mt-1">Programas en los que estás asignado como docente/ponente</p>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="evento in eventosAsignados" :key="evento.id" @click="openActividadesEvento(evento.id)" class="bg-white dark:bg-gray-900 rounded-[2rem] p-6 shadow-sm border border-slate-100 dark:border-gray-800 hover:shadow-md hover:border-umsa-blue transition-all group cursor-pointer flex flex-col relative overflow-hidden">
        
        <div class="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/0 to-slate-50/50 dark:to-white/5 rounded-bl-full -z-0"></div>

        <div class="flex justify-between items-start mb-6 relative z-10">
          <div :class="evento.color" class="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-md shadow-slate-200 dark:shadow-none">
            <span class="material-symbols-outlined text-2xl" style="font-variation-settings: 'FILL' 1;">{{ evento.icon }}</span>
          </div>
          <span :class="getStatusColor(evento.status)" class="text-[9px] font-black uppercase px-3 py-1 rounded-full tracking-widest">
            {{ evento.status }}
          </span>
        </div>

        <div class="flex-1 relative z-10">
          <p class="text-[9px] font-bold text-umsa-gold dark:text-blue-400 uppercase tracking-widest mb-2">Gestión {{ evento.gestion }}</p>
          <h3 class="text-xl font-black text-primary-dark dark:text-white leading-tight mb-2 group-hover:text-umsa-blue transition-colors">{{ evento.title }}</h3>
          <p class="text-xs font-medium text-slate-500">{{ evento.actividadesCount }} actividades a tu cargo</p>
        </div>

        <div class="mt-6 space-y-3 pt-5 border-t border-slate-100 dark:border-gray-800 relative z-10">
          <div class="flex items-center text-slate-500 dark:text-gray-400 bg-slate-50 dark:bg-gray-800/50 p-2 rounded-lg">
            <span class="material-symbols-outlined text-[16px] mr-3 text-slate-400">calendar_today</span>
            <span class="text-xs font-bold">{{ evento.date }}</span>
          </div>
          
          <div class="mt-4">
            <div class="flex justify-between text-xs mb-2">
              <span class="font-bold text-slate-500 uppercase tracking-widest text-[9px]">Desarrollo del Programa</span>
              <span :class="evento.progress === 100 ? 'text-emerald-500' : 'text-umsa-blue'" class="font-black">{{ evento.progress }}%</span>
            </div>
            <div class="w-full bg-slate-100 dark:bg-gray-800 rounded-full h-2.5">
              <div :class="[evento.progress === 100 ? 'bg-emerald-500' : 'bg-umsa-blue', 'h-2.5 rounded-full transition-all duration-1000']" :style="{ width: evento.progress + '%' }"></div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>
