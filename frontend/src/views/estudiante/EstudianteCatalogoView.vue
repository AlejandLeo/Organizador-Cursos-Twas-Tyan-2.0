<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import api from '@/services/api'; // Import api instance

const router = useRouter();
const eventosPublicados = ref<any[]>([]);
const loading = ref(true);

const fetchEventos = async () => {
  try {
    const [responseEventos, responseInsc] = await Promise.all([
      api.get('/eventos'),
      api.get('/me/inscripciones')
    ]);

    const misInsc = responseInsc.data;

    eventosPublicados.value = responseEventos.data.map((evento: any) => ({
      id: evento.id,
      nombreCorto: evento.nombre,
      nombreLargo: evento.nombre,
      version: evento.gestion || 'Última versión',
      descripcion: evento.descripcion || 'Sin descripción',
      imagen: evento.logo || 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1600&q=80',
      estado: evento.estado == 1 ? 'Activo' : 'Próximamente',
      colorEstado: evento.estado == 1 ? 'bg-emerald-500 text-white border-emerald-400/30' : 'bg-slate-500 text-white border-slate-400/30',
      mostrarActividades: true,
      actividades: (evento.actividades || []).map((act: any) => {
        const found = misInsc.find((i: any) => i.actividadAcademica?.id === act.id);
        let myStatus = 'Disponible';
        if (found) {
          if (found.estado === 1) myStatus = 'Inscrito';
          else if (found.estado === 3) myStatus = 'Finalizado';
          else if (found.estado === 2) myStatus = 'Rechazado';
          else myStatus = 'Pre-Inscrito';
        }

        return {
          id: act.id,
          title: act.nombre,
          status: myStatus,
          type: act.tipo || 'General',
          date: `${act.fecha_inicio ? new Date(act.fecha_inicio).toLocaleDateString() : 'Por definir'}`,
          modules: 1,
          image: act.imagen || 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&q=80'
        };
      })
    }));
  } catch (error) {
    console.error('Error cargando eventos:', error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchEventos();
});

const verDetalle = (idActividad: number) => {
  router.push({ name: 'estudiante-actividades-detalle', params: { id: idActividad } });
};

const toggleActividades = (evento: any) => {
  evento.mostrarActividades = !evento.mostrarActividades;
};

// Agrupar actividades por Tipo para la vista estilo Netflix
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
  if (status === 'Finalizado') return 'text-white bg-red-500 border border-red-400 shadow-md';
  if (status === 'Inscrito' || status === 'En curso') return 'text-white bg-blue-500 border border-blue-400 shadow-md';
  if (status === 'Pre-Inscrito') return 'text-white bg-amber-500 border border-amber-400 shadow-md';
  if (status === 'Rechazado') return 'text-white bg-slate-600 border border-slate-500 shadow-md';
  if (status === 'Próximamente') return 'text-slate-500 bg-slate-100 dark:bg-gray-800 border border-slate-200 dark:border-gray-700';
  return 'text-white bg-emerald-500 border border-emerald-400 shadow-md'; // Default Disponible
};
</script>

<template>
  <div class="animate-in fade-in duration-500 max-w-7xl mx-auto space-y-8">
    
    <div class="flex items-center justify-between border-b border-slate-200 dark:border-gray-800 mb-8 pb-6">
        <div>
          <h2 class="text-3xl font-black text-primary-dark dark:text-white uppercase italic">Catálogo de Actividades</h2>
          <p class="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mt-1">Explora y únete a los cursos del The World Academy of Sciences</p>
        </div>
    </div>
      
    <div v-for="evento in eventosPublicados" :key="evento.id" class="w-full bg-white dark:bg-gray-900 rounded-[2rem] overflow-hidden shadow-sm border border-slate-100 dark:border-gray-800 mb-12 flex flex-col group/card">
      
      <!-- Header Evento Banner (Estilo Netflix) -->
      <div class="relative w-full h-[320px] overflow-hidden">
        <img :src="evento.imagen" :alt="evento.nombreCorto" class="w-full h-full object-cover object-center group-hover/card:scale-105 transition-transform duration-[1.5s] ease-out">
        <div class="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/60 to-transparent"></div>
        
        <!-- Etiqueta de Estado en la parte superior izquierda, destacada -->
        <span class="absolute top-6 left-6 z-30" :class="[evento.colorEstado, 'text-[12px] font-black uppercase px-4 py-2 rounded-full tracking-widest w-fit shadow-2xl backdrop-blur-md border-2 border-white/20']">
          ● {{ evento.estado }}
        </span>

        <div class="absolute bottom-0 left-0 right-0 p-8 pt-24 z-20 flex flex-col">
          <div class="flex items-end justify-between">
            <div>
              <p class="text-xs font-bold text-emerald-400 dark:text-emerald-400 uppercase tracking-widest mb-2">{{ evento.version }}</p>
              <h1 class="text-4xl md:text-5xl font-black text-white tracking-tighter leading-none mb-4">{{ evento.nombreCorto }}</h1>
              <p class="text-sm font-medium text-gray-300 max-w-2xl line-clamp-2 leading-relaxed">{{ evento.descripcion }}</p>
            </div>

            <button @click="toggleActividades(evento)" class="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/20 px-6 py-3 rounded-xl transition-all shadow-lg flex items-center gap-2 group/btn cursor-pointer z-30 relative">
              <span class="text-xs font-bold uppercase tracking-widest">{{ evento.mostrarActividades ? 'Ocultar' : 'Ver' }} Actividades</span>
              <span class="material-symbols-outlined text-[16px] transition-transform duration-300" :class="evento.mostrarActividades ? 'rotate-180' : ''">expand_more</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Grid de Actividades Académicas (Estilo Catálogo Horizontal) -->
      <div v-show="evento.mostrarActividades" class="py-8 bg-slate-50 dark:bg-gray-950/50 w-full animate-in slide-in-from-top-4 duration-500 fade-in border-t border-slate-100 dark:border-gray-900">
        
        <div v-for="(acts, categoria) in getActividadesAgrupadas(evento.actividades)" :key="categoria" class="mb-10 w-full overflow-hidden">
          <div class="flex items-end justify-between px-8 mb-4">
            <div>
              <h3 class="text-xl md:text-2xl font-black text-primary-dark dark:text-white uppercase tracking-tighter">{{ categoria }}</h3>
              <p class="text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-widest mt-1">Explorar {{ acts.length }} disponibles en esta categoría</p>
            </div>
            <button class="text-[10px] font-black uppercase tracking-widest bg-white dark:bg-gray-800 hover:bg-slate-100 dark:hover:bg-gray-700 text-slate-600 dark:text-gray-300 border border-slate-200 dark:border-gray-700 px-4 py-2 rounded-xl transition-all flex items-center gap-2 relative z-20 cursor-pointer shadow-sm hover:shadow-md">
              <span class="material-symbols-outlined text-[14px]">visibility</span> Ver todos
            </button>
          </div>

          <div class="flex overflow-x-auto gap-6 px-8 pb-8 pt-2 snap-x snap-mandatory flex-nowrap" style="scrollbar-width: none; -ms-overflow-style: none;">
            
            <div v-for="act in acts" :key="act.id" @click="verDetalle(act.id)" class="flex-none w-[280px] md:w-[320px] bg-white dark:bg-gray-900 rounded-[1.5rem] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-slate-200/60 dark:border-gray-800 hover:border-emerald-500/50 dark:hover:border-emerald-500 transition-all hover:-translate-y-1 hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] cursor-pointer group flex flex-col snap-start relative">
              
              <div class="relative h-48 w-full overflow-hidden shrink-0">
                <div class="absolute inset-0 bg-primary-dark/10 group-hover:bg-transparent transition-colors z-10"></div>
                <img :src="act.image" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" :alt="act.title">   
                <span class="absolute top-3 right-3 z-20 text-[8px] font-black uppercase px-2 py-1 rounded-md tracking-widest shadow-sm " :class="getStatusColor(act.status)">
                  {{ act.status }}
                </span>
                <div class="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-white dark:from-gray-900 to-transparent z-10 opacity-60"></div>
              </div>

              <div class="p-5 flex flex-col flex-1 relative z-20 bg-white dark:bg-gray-900">
                <h3 class="text-sm font-black text-slate-800 dark:text-white leading-tight mb-3 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors line-clamp-2 block h-[2.5rem]">{{ act.title }}</h3> 

                <div class="mt-auto flex flex-col gap-3 pt-3 border-t border-slate-100 dark:border-gray-800">
                  <div class="flex flex-wrap items-center gap-2">
                    <span class="text-[9px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-widest border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800 px-2 py-0.5 rounded-md">{{ act.date }}</span>
                  </div>
                  <div class="flex justify-between items-center text-slate-500 dark:text-gray-400">
                    <button @click.prevent="verDetalle(act.id)" class="flex items-center text-emerald-600 font-bold hover:translate-x-1 transition-transform group-hover:translate-x-1">   
                      <span class="text-[10px] uppercase">Ver Actividad</span>
                      <span class="material-symbols-outlined text-[16px] ml-1">arrow_forward</span>    
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
        
        <div v-if="Object.keys(getActividadesAgrupadas(evento.actividades)).length === 0" class="px-8 py-10 text-center">
          <p class="text-sm font-bold text-gray-500 uppercase tracking-widest">No hay actividades publicadas para esta categoría.</p>
        </div>
      </div>
    </div>
  </div>
</template>
