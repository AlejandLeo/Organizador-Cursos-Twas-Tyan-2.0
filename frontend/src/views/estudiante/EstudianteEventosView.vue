<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const eventoData = ref({
  id: 1,
  nombreCorto: 'Programa Especializado',
  nombreLargo: 'Programa de Especialidad en Biofertilizantes',
  version: 'V Edición - 2026',
  descripcion: 'Tu programa actual inscrito. Ingresa a las actividades para ver tu progreso, calificaciones y descargar tu certificado de participación una vez finalizado.',
  estado: 'En Progreso',
  colorEstado: 'bg-primary-dark text-white border-blue-900',
  imagen: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=1600&q=80',
  mostrarActividades: true,
  actividadesInscritas: [
    {
      id: 1,
      title: 'Módulo 1: Fundamentos de Biofertilizantes',
      status: 'En curso',
      type: 'Módulo',
      date: '10 May - 20 Jun 2026',
      progress: 60,
      image: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800&q=80'
    },
    {
      id: 2,
      title: 'Taller de Aplicación de Suelos',
      status: 'Próximamente',
      type: 'Taller',
      date: '25 Jun - 30 Jun 2026',
      progress: 0,
      image: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800&q=80'
    }
  ]
});

const getActividadesAgrupadas = (actividades: any) => {
  const grupos: any = {};
  actividades.forEach((act: any) => {
    if (!grupos[act.type]) {
      grupos[act.type] = [];
    }
    grupos[act.type].push(act);
  });
  return grupos;
};

const getStatusColor = (status: string) => {
  if (status === 'En curso') return 'text-green-600 bg-green-50 dark:bg-green-900/40 border border-green-200 dark:border-green-800';
  if (status === 'Próximamente') return 'text-umsa-blue bg-blue-50 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-800';
  return 'text-slate-500 bg-slate-100 dark:bg-gray-800 dark:text-gray-400 border border-slate-200 dark:border-gray-700';
};
</script>

<template>
  <div class="animate-in fade-in duration-500 max-w-7xl mx-auto space-y-8">
    <div class="border-b border-slate-200 dark:border-gray-800 pb-6 mb-8 mt-2">
      <h2 class="text-3xl font-black text-primary-dark dark:text-white uppercase italic">Mis Cursos</h2>
      <p class="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mt-1">Gestiona tu progreso, material y certificados de The World Academy of Sciences</p>
    </div>

    <div class="w-full bg-white dark:bg-gray-900 rounded-[2rem] overflow-hidden shadow-sm border border-slate-100 dark:border-gray-800 flex flex-col group/card mb-12">
        
        <!-- Header Evento Banner (Estilo Netflix) -->
        <div class="relative w-full h-[320px] overflow-hidden">
          <img :src="eventoData.imagen" alt="Banner" class="w-full h-full object-cover object-center group-hover/card:scale-105 transition-transform duration-[1.5s] ease-out">
          <div class="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/60 to-transparent"></div>
          
          <div class="absolute bottom-0 left-0 right-0 p-8 pt-24 z-20 flex flex-col">
            <span class="mb-3" :class="[eventoData.colorEstado, 'text-[8px] font-black uppercase px-3 py-1 rounded-full tracking-widest w-fit shadow-lg backdrop-blur-md border']">
              {{ eventoData.estado }}
            </span>
            <div class="flex items-end justify-between">
              <div>
                <p class="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-2">{{ eventoData.version }}</p>
                <h1 class="text-4xl md:text-5xl font-black text-white tracking-tighter leading-none mb-4">{{ eventoData.nombreLargo }}</h1>
                <p class="text-sm font-medium text-gray-300 max-w-2xl line-clamp-2 leading-relaxed">{{ eventoData.descripcion }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Grid de Actividades Académicas (Estilo Catálogo Horizontal) -->
        <div class="py-8 bg-slate-50 dark:bg-gray-950/50 w-full animate-in slide-in-from-top-4 duration-500 fade-in border-t border-slate-100 dark:border-gray-900">
          
          <div v-for="(acts, categoria) in getActividadesAgrupadas(eventoData.actividadesInscritas)" :key="categoria" class="mb-10 w-full overflow-hidden">
            <!-- Row Header -->
            <div class="flex items-end justify-between px-8 mb-4">
              <div>
                <h3 class="text-xl md:text-2xl font-black text-primary-dark dark:text-white uppercase tracking-tighter">{{ categoria }}</h3>
                <p class="text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-widest mt-1">Llevas {{ acts.length }} curso(s) en esta categoría</p>
              </div>
            </div>

            <!-- Horizontal Scroll Row -->
            <div class="flex overflow-x-auto gap-6 px-8 pb-8 pt-2 snap-x snap-mandatory flex-nowrap" style="scrollbar-width: none; -ms-overflow-style: none;">
              
              <div v-for="act in acts" :key="act.id" @click="router.push({ name: 'estudiante-actividades-detalle', params: { id: act.id } })" class="flex-none w-[280px] md:w-[320px] bg-white dark:bg-gray-900 rounded-[1.5rem] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-slate-200/60 dark:border-gray-800 hover:border-emerald-500/50 dark:hover:border-emerald-500 transition-all hover:-translate-y-1 hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] cursor-pointer group flex flex-col snap-start relative">
                
                <div class="relative h-48 w-full overflow-hidden shrink-0">
                  <div class="absolute inset-0 bg-primary-dark/10 group-hover:bg-transparent transition-colors z-10"></div>
                  <img :src="act.image" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" :alt="act.title">   
                  <span class="absolute top-3 right-3 z-20 text-[8px] font-black uppercase px-2 py-1 rounded-md tracking-widest shadow-sm bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm" :class="getStatusColor(act.status)">
                    {{ act.status }}
                  </span>

                  <!-- Certificado Overlay Action (Requerido por usuario) -->
                  <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity z-20 flex items-center justify-center backdrop-blur-sm">
                      <button @click.stop="router.push({ name: 'estudiante-actividades-detalle', params: { id: act.id }, query: { tab: 'certificados' } })" class="bg-umsa-gold text-white font-black text-[10px] px-4 py-2 rounded-xl flex items-center gap-2 uppercase tracking-widest hover:scale-105 transition-transform shadow-xl hover:bg-yellow-500">
                          <span class="material-symbols-outlined text-[16px]">workspace_premium</span> Ver Certificado
                      </button>
                  </div>

                  <div class="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-white dark:from-gray-900 to-transparent z-10 opacity-60"></div>
                </div>

                <div class="p-5 flex flex-col flex-1 relative z-20 bg-white dark:bg-gray-900">
                  <h3 class="text-sm font-black text-slate-800 dark:text-white leading-tight mb-3 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors line-clamp-2 block h-[2.5rem]">{{ act.title }}</h3> 

                  <!-- Progress Bar -->
                  <div class="w-full bg-slate-100 dark:bg-gray-800 rounded-full h-1.5 mb-3 overflow-hidden">
                    <div class="bg-emerald-500 h-1.5 rounded-full transition-all duration-1000 ease-out flex" :style="{ width: `${act.progress}%` }"></div>
                  </div>

                  <div class="mt-auto flex flex-col gap-3 pt-3 border-t border-slate-100 dark:border-gray-800">
                    <div class="flex flex-wrap items-center gap-2">
                      <span class="text-[9px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-widest border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800 px-2 py-0.5 rounded-md">{{ act.date }}</span>
                    </div>
                    <div class="flex justify-between items-center text-slate-500 dark:text-gray-400">
                      <div class="flex items-center text-emerald-600 font-bold group-hover:translate-x-1 transition-transform">
                          <span class="text-[10px] uppercase">Ingresar</span>
                          <span class="material-symbols-outlined text-[16px] ml-1">arrow_forward</span>
                      </div>
                      <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">{{ act.progress }}%</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
          
          <div v-if="Object.keys(getActividadesAgrupadas(eventoData.actividadesInscritas)).length === 0" class="px-8 py-10 text-center">
            <p class="text-sm font-bold text-gray-500 uppercase tracking-widest">No tienes actividades inscritas.</p>
          </div>
        </div>
      </div>
  </div>
</template>
