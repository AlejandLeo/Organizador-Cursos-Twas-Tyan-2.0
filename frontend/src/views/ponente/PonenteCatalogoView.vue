<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import api from '@/services/api';

const router = useRouter();
const loading = ref(true);
const eventosPublicados = ref<any[]>([]);

const loadCatalog = async () => {
  loading.value = true;
  try {
    const res = await api.get('/eventos');
    const allEvents = res.data || [];
    
    // Filtrar solo eventos activos (1) o próximos (si aplica, usualmente 1 es activo)
    const activeEvents = allEvents.filter((ev: any) => ev.estado === 1);
    
    eventosPublicados.value = activeEvents.map((evento: any) => {
      return {
        id: evento.id,
        nombreCorto: evento.sigla || evento.nombre?.substring(0, 15) || 'Evento',
        nombreLargo: evento.nombre || 'Nombre del Evento',
        version: evento.version || 'Gestión ' + evento.gestion,
        descripcion: evento.descripcion || 'Sin descripción disponible.',
        imagen: evento.imagen_fondo || 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1600&q=80',
        estado: 'Evento Activo',
        colorEstado: 'bg-emerald-500 text-white border-emerald-400/30',
        inscripcionesAbiertas: true,
        mostrarActividades: true,
        actividades: (evento.actividades || []).filter((act: any) => Number(act.estado) !== -1).map((act: any) => {
          // Determinar estado de la actividad (1 = Activo)
          let statusLabel = 'Próximamente';
          if (act.estado === 1) statusLabel = 'En curso';
          if (act.estado === 0) statusLabel = 'Finalizado';

          return {
            id: act.id,
            title: act.nombre || 'Actividad Académica',
            status: statusLabel,
            type: act.tipo || 'General',
            date: act.fecha_inicio ? `${new Date(act.fecha_inicio).toLocaleDateString()}` : 'Por definir',
            students: act.inscripciones?.length || 0,
            modules: act.modalidades?.length || 1,
            image: act.imagen || 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&q=80'
          };
        })
      };
    });
  } catch (error) {
    console.error('Error cargando catálogo:', error);
  } finally {
    loading.value = false;
  }
};

onMounted(loadCatalog);


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
  if (status === 'En curso') return 'text-green-600 bg-green-50 dark:bg-green-900/40 border border-green-200 dark:border-green-800';
  if (status === 'Inscripciones') return 'text-umsa-blue bg-blue-50 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-800';
  return 'text-slate-500 bg-slate-100 dark:bg-gray-800 dark:text-gray-400 border border-slate-200 dark:border-gray-700';
};
</script>

<template>
  <div class="animate-in fade-in duration-500 max-w-7xl mx-auto space-y-8">
    
    <div class="flex items-center justify-between border-b border-slate-200 dark:border-gray-800 mb-8 pb-6">
        <div>
          <h2 class="text-3xl font-black text-primary-dark dark:text-white uppercase italic">Actividades Académicas</h2>
          <p class="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mt-1">Explora todos los programas disponibles</p>
        </div>
    </div>
      
    <div v-for="evento in eventosPublicados" :key="evento.id" class="w-full bg-white dark:bg-gray-900 rounded-[2rem] overflow-hidden shadow-sm border border-slate-100 dark:border-gray-800 mb-12 flex flex-col group/card">
      
      <!-- Header Evento Banner (Estilo Netflix) -->
      <div class="relative w-full h-[320px] overflow-hidden">
        <img :src="evento.imagen" :alt="evento.nombreCorto" class="w-full h-full object-cover object-center group-hover/card:scale-105 transition-transform duration-[1.5s] ease-out">
        <div class="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/60 to-transparent"></div>
        
        <div class="absolute bottom-0 left-0 right-0 p-6 md:p-8 pt-24 z-20 flex flex-col">
          <span class="mb-3" :class="[evento.colorEstado, 'text-[8px] font-black uppercase px-3 py-1 rounded-full tracking-widest w-fit shadow-lg backdrop-blur-md border']">
            {{ evento.estado }}
          </span>
          <div class="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
            <div class="flex-1">
              <p class="text-[10px] md:text-xs font-bold text-umsa-gold dark:text-blue-400 uppercase tracking-widest mb-2">{{ evento.version }}</p>
              <h1 class="text-3xl md:text-5xl font-black text-white tracking-tighter leading-none mb-3 md:mb-4">{{ evento.nombreCorto }}</h1>
              <p class="text-xs md:text-sm font-medium text-gray-300 max-w-2xl line-clamp-2 leading-relaxed">{{ evento.descripcion }}</p>
            </div>

            <!-- Accordion Toggle Button -->
            <button @click="toggleActividades(evento)" class="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/20 px-5 md:px-6 py-2.5 md:py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 group/btn cursor-pointer z-30 relative w-full lg:w-auto">
              <span class="text-[10px] md:text-xs font-bold uppercase tracking-widest">{{ evento.mostrarActividades ? 'Ocultar' : 'Ver' }} Actividades</span>
              <span class="material-symbols-outlined text-[16px] transition-transform duration-300" :class="evento.mostrarActividades ? 'rotate-180' : ''">expand_more</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Grid de Actividades Académicas (Estilo Catálogo Horizontal) -->
      <div v-show="evento.mostrarActividades" class="py-8 bg-slate-50 dark:bg-gray-950/50 w-full animate-in slide-in-from-top-4 duration-500 fade-in border-t border-slate-100 dark:border-gray-900">
        
        <div v-for="(acts, categoria) in getActividadesAgrupadas(evento.actividades)" :key="categoria" class="mb-10 w-full overflow-hidden">
          <!-- Row Header -->
          <div class="flex flex-col sm:flex-row sm:items-end justify-between px-6 md:px-8 mb-4 gap-4">
            <div>
              <h3 class="text-lg md:text-2xl font-black text-primary-dark dark:text-white uppercase tracking-tighter">{{ categoria }}</h3>
              <p class="text-[9px] md:text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-widest mt-1">Explorar {{ acts.length }} disponibles en esta categoría</p>
            </div>
            <button class="text-[9px] md:text-[10px] font-black uppercase tracking-widest bg-white dark:bg-gray-800 hover:bg-slate-100 dark:hover:bg-gray-700 text-slate-600 dark:text-gray-300 border border-slate-200 dark:border-gray-700 px-4 py-2 rounded-xl transition-all flex items-center justify-center gap-2 relative z-20 cursor-pointer shadow-sm hover:shadow-md w-full sm:w-auto">
              <span class="material-symbols-outlined text-[14px]">visibility</span> Ver todos
            </button>
          </div>

          <!-- Grid de Actividades con Diseño Premium -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-8 pb-8 pt-2">
            <div v-for="act in acts" :key="act.id" 
              class="bg-white dark:bg-gray-900 rounded-[2rem] overflow-hidden shadow-lg border border-slate-100 dark:border-gray-800 hover:border-umsa-blue transition-all duration-500 hover:-translate-y-2 cursor-pointer group relative">
              
              <!-- Badge de Asignado (Simulado: ID 1 y 3 son del ponente) -->
              <div v-if="act.id === 1 || act.id === 3" class="absolute top-4 left-4 z-30">
                <span class="bg-umsa-blue text-white text-[9px] font-black uppercase px-3 py-1.5 rounded-full shadow-xl flex items-center gap-1 border border-white/20 backdrop-blur-md">
                  <span class="material-symbols-outlined text-[12px]">verified_user</span>
                  ASIGNADO
                </span>
              </div>

              <!-- Imagen Predominante -->
              <div class="relative h-60 w-full overflow-hidden">
                <img :src="act.image" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000">   
                <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                
                <span class="absolute top-4 right-4 z-20 text-[9px] font-black uppercase px-3 py-1.5 rounded-full tracking-widest shadow-lg backdrop-blur-md border border-white/10" :class="getStatusColor(act.status)">
                  {{ act.status }}
                </span>

                <div class="absolute bottom-4 left-6 right-6 z-20">
                  <p class="text-[10px] font-bold text-umsa-gold uppercase tracking-[0.2em] mb-1 drop-shadow-md">
                    {{ evento.nombreCorto }}
                  </p>
                  <h3 class="text-lg font-black text-white leading-tight uppercase italic group-hover:text-umsa-gold transition-colors drop-shadow-lg line-clamp-2">
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
                    <button @click="router.push(`/ponente/curso/${act.id}`)" class="flex items-center text-umsa-blue font-black group/btn cursor-pointer">
                        <span class="text-[11px] uppercase tracking-widest">Ver Detalles</span>
                        <span class="material-symbols-outlined text-[18px] ml-2 group-hover/btn:translate-x-1 transition-transform">visibility</span>
                    </button>
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
