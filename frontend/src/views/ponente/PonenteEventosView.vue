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
    image: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&q=80'
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
    image: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800&q=80'
  }
]);

const getStatusColor = (status: any) => {
  if (status === 'En Progreso') return 'text-white bg-emerald-500 shadow-emerald-500/30';
  if (status === 'Finalizado') return 'text-white bg-rose-500 shadow-rose-500/30';
  return 'text-white bg-umsa-gold shadow-yellow-500/30';
};

const openActividadesEvento = (eventoId: any) => {
  router.push({ name: 'ponente-curso', params: { evento_id: eventoId } });
};
</script>

<template>
  <div class="animate-in fade-in duration-500 max-w-7xl mx-auto space-y-8">
    
    <div class="flex justify-center mb-8 mt-2">
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

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      <div v-for="evento in eventosAsignados" :key="evento.id" @click="openActividadesEvento(evento.id)" 
        class="bg-white dark:bg-gray-900 rounded-[2.5rem] overflow-hidden shadow-lg border border-slate-100 dark:border-gray-800 hover:border-umsa-blue transition-all duration-500 hover:-translate-y-2 cursor-pointer group flex flex-col relative">
        
        <!-- Imagen Predominante -->
        <div class="relative h-60 w-full overflow-hidden shrink-0">
          <img :src="evento.image" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 ease-out">   
          <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"></div>
          
          <span class="absolute top-4 right-4 z-20 text-[9px] font-black uppercase px-3 py-1.5 rounded-full tracking-widest shadow-xl backdrop-blur-md border border-white/10" :class="getStatusColor(evento.status)">
            {{ evento.status }}
          </span>

          <div class="absolute bottom-4 left-6 right-6 z-20">
            <p class="text-[10px] font-bold text-umsa-gold uppercase tracking-[0.2em] mb-1 drop-shadow-md">
              GESTIÓN {{ evento.gestion }}
            </p>
            <h3 class="text-2xl font-black text-white leading-tight uppercase italic group-hover:text-umsa-gold transition-colors drop-shadow-lg line-clamp-2">
              {{ evento.title }}
            </h3>
          </div>
        </div>

        <!-- Información Inferior -->
        <div class="p-6 flex flex-col flex-1 bg-white dark:bg-gray-900">
          <div class="flex items-center justify-between text-slate-500 dark:text-gray-400 mb-6">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-sm text-umsa-blue">calendar_month</span>
              <span class="text-[10px] font-bold uppercase tracking-wider">{{ evento.date }}</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-sm text-umsa-blue">book</span>
              <span class="text-[10px] font-bold uppercase tracking-wider">{{ evento.actividadesCount }} Actividades</span>
            </div>
          </div>

          <div class="mt-auto flex justify-between items-center pt-5 border-t border-slate-100 dark:border-gray-800">
              <div class="flex items-center text-umsa-blue font-black group/btn">
                  <span class="text-[11px] uppercase tracking-widest">Ver Actividades</span>
                  <span class="material-symbols-outlined text-[18px] ml-2 group-hover/btn:translate-x-1 transition-transform">arrow_forward</span>
              </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
