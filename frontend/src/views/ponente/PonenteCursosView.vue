<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const eventoData = ref({
  id: 1,
  nombreCorto: 'Programa Especializado',
  nombreLargo: 'Programa de Especialidad en Biofertilizantes',
  version: 'V Edición - 2026',
  descripcion: 'Gestiona las actividades a tu carga. Mantén el registro de asistencia y emisión de certificados.',
  estado: 'En Progreso',
  colorEstado: 'bg-primary-dark text-white border-blue-900',
  imagen: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=1600&q=80',
  mostrarActividades: true,
  actividadesAsignadas: [
    {
      id: 1,
      title: 'Módulo 1: Fundamentos de Biofertilizantes',
      status: 'En curso',
      type: 'Módulo',
      date: '10 May - 20 Jun 2026',
      students: 45,
      image: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800&q=80'
    },
    {
      id: 2,
      title: 'Taller de Aplicación de Suelos',
      status: 'Próximamente',
      type: 'Taller',
      date: '25 Jun - 30 Jun 2026',
      students: 120,
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
      <button @click="router.push({ name: 'ponente-eventos' })" class="text-[10px] font-bold text-slate-500 hover:text-umsa-blue uppercase tracking-widest mb-4 flex items-center group transition-colors">
        <span class="material-symbols-outlined text-[16px] mr-1 group-hover:-translate-x-1 transition-transform">arrow_back</span>
        Volver a Mis Eventos Asignados
      </button>
      <h2 class="text-3xl font-black text-primary-dark dark:text-white uppercase italic">Mis Actividades</h2>
      <p class="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mt-1">Gestiona estudiantes, asistencia y certificados de The World Academy of Sciences</p>
    </div>

    <div class="w-full bg-white dark:bg-gray-900 rounded-[2rem] overflow-hidden shadow-sm border border-slate-100 dark:border-gray-800 flex flex-col group/card mb-8">
        
        <div class="relative w-full h-[320px] overflow-hidden">
          <img :src="eventoData.imagen" alt="Banner" class="w-full h-full object-cover object-center group-hover/card:scale-105 transition-transform duration-[1.5s] ease-out">
          <div class="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/60 to-transparent"></div>
          <div class="absolute bottom-0 left-0 right-0 p-8 pt-24 z-20 flex flex-col">
            <span class="mb-3" :class="[eventoData.colorEstado, 'text-[8px] font-black uppercase px-3 py-1 rounded-full tracking-widest w-fit shadow-lg backdrop-blur-md border']">
              {{ eventoData.estado }}
            </span>
            <div class="flex items-end justify-between">
              <div>
                <p class="text-xs font-bold text-umsa-gold dark:text-blue-400 uppercase tracking-widest mb-2">{{ eventoData.version }}</p>
                <h1 class="text-4xl md:text-5xl font-black text-white tracking-tighter leading-none mb-4 uppercase italic">{{ eventoData.nombreLargo }}</h1>
                <p class="text-sm font-medium text-gray-300 max-w-2xl line-clamp-2 leading-relaxed italic opacity-80">{{ eventoData.descripcion }}</p>
              </div>
            </div>
          </div>
        </div>

        <div class="py-8 bg-slate-50 dark:bg-gray-950/50 w-full border-t border-slate-100 dark:border-gray-900">
          <div v-for="(acts, categoria) in getActividadesAgrupadas(eventoData.actividadesAsignadas)" :key="categoria" class="mb-10 w-full overflow-hidden">
            <div class="flex items-end justify-between px-8 mb-4">
              <h3 class="text-xl md:text-2xl font-black text-primary-dark dark:text-white uppercase tracking-tighter">{{ categoria }}s</h3>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-8 pb-8 pt-2">
              <div v-for="act in acts" :key="act.id" @click="router.push({ name: 'ponente-curso-detalle', params: { id: act.id } })" 
                class="bg-white dark:bg-gray-900 rounded-[2rem] overflow-hidden shadow-lg border border-slate-100 dark:border-gray-800 hover:border-umsa-blue transition-all duration-500 hover:-translate-y-2 cursor-pointer group relative">
                
                <!-- Badge de Asignado -->
                <div class="absolute top-4 left-4 z-30">
                  <span class="bg-umsa-blue text-white text-[9px] font-black uppercase px-3 py-1.5 rounded-full shadow-xl flex items-center gap-1 border border-white/20 backdrop-blur-md">
                    <span class="material-symbols-outlined text-[12px]">verified_user</span>
                    DOCENTE ASIGNADO
                  </span>
                </div>

                <!-- Imagen Predominante -->
                <div class="relative h-64 w-full overflow-hidden">
                  <img :src="act.image" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000">   
                  <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                  
                  <span class="absolute top-4 right-4 z-20 text-[9px] font-black uppercase px-3 py-1.5 rounded-full tracking-widest shadow-lg backdrop-blur-md border border-white/10" :class="getStatusColor(act.status)">
                    {{ act.status }}
                  </span>

                  <div class="absolute bottom-4 left-6 right-6 z-20">
                    <p class="text-[10px] font-bold text-umsa-gold uppercase tracking-[0.2em] mb-1 drop-shadow-md">
                      {{ eventoData.nombreCorto }}
                    </p>
                    <h3 class="text-xl font-black text-white leading-tight uppercase italic group-hover:text-umsa-gold transition-colors drop-shadow-lg line-clamp-2">
                      {{ act.title }}
                    </h3>
                  </div>
                </div>

                <!-- Información Inferior -->
                <div class="p-6 flex flex-col bg-white dark:bg-gray-900">
                  <div class="flex items-center justify-between text-slate-500 dark:text-gray-400 mb-4">
                    <div class="flex items-center gap-2">
                      <span class="material-symbols-outlined text-sm text-umsa-blue">calendar_month</span>
                      <span class="text-[10px] font-bold uppercase tracking-wider">{{ act.date }}</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <span class="material-symbols-outlined text-sm text-umsa-blue">groups</span>
                      <span class="text-[10px] font-bold uppercase tracking-wider">{{ act.students }} Inscritos</span>
                    </div>
                  </div>

                  <div class="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-gray-800">
                      <div class="flex items-center text-umsa-blue font-black group/btn">
                          <span class="text-[11px] uppercase tracking-widest">Gestionar Actividad</span>
                          <span class="material-symbols-outlined text-[18px] ml-2 group-hover/btn:translate-x-1 transition-transform">arrow_forward</span>
                      </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  </div>
</template>

<style scoped>
.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
</style>
