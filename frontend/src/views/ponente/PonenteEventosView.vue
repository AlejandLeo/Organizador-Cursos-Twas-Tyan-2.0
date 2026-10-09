<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import api, { getImageUrl } from '@/services/api';

const router = useRouter();

const eventosAsignados = ref<any[]>([]);
const isLoading = ref(false);
const searchQuery = ref('');

const fetchData = async () => {
  try {
    isLoading.value = true;
    const res = await api.get('/imparticiones/mis-actividades');
    const imparticiones = res.data || [];
    
    // Agrupar actividades por evento
    const eventosMap = new Map<number, any>();

    imparticiones.forEach((imp: any) => {
      const act = imp.actividadAcademica;
      const ev = imp.evento;
      if (!act || !ev || Number(act.estado) === -1) return;

      if (!eventosMap.has(ev.id)) {
        eventosMap.set(ev.id, {
          id: ev.id,
          nombre: ev.nombre || 'Evento Principal',
          logo: ev.logo,
          imagenFondo: ev.imagen_fondo,
          fechaInicio: ev.fecha_inicio ? new Date(ev.fecha_inicio).toLocaleDateString() : '',
          fechaFin: ev.fecha_fin ? new Date(ev.fecha_fin).toLocaleDateString() : '',
          image: ev.imagen_fondo 
            ? getImageUrl('fondos', ev.imagen_fondo)
            : getImageUrl('eventos', ev.logo, 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&q=80'),
          gestion: ev.fecha_inicio ? new Date(ev.fecha_inicio).getFullYear().toString() : '2026',
          actividades: []
        });
      }

      eventosMap.get(ev.id).actividades.push({
        id: act.id,
        title: act.nombre || 'Actividad',
        status: act.estado === 1 ? 'En Progreso' : (act.estado === 0 ? 'Finalizado' : 'Próximamente'),
        date: act.fecha_inicio ? `${new Date(act.fecha_inicio).toLocaleDateString()} - ${new Date(act.fecha_fin).toLocaleDateString()}` : 'Fechas por definir',
        students: act.inscripciones?.length || 0,
        type: act.tipo || 'Actividad',
        image: getImageUrl('cursos', act.imagen, 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&q=80')
      });
    });

    eventosAsignados.value = Array.from(eventosMap.values());
  } catch (error) {
    console.error('Error al cargar eventos asignados:', error);
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  fetchData();
});

const filteredEventos = computed(() => {
  const q = searchQuery.value.toLowerCase().trim();
  if (!q) return eventosAsignados.value;

  return eventosAsignados.value.filter((ev: any) => 
    ev.nombre.toLowerCase().includes(q) || 
    ev.actividades.some((act: any) => act.title.toLowerCase().includes(q))
  );
});

const getStatusColor = (status: any) => {
  if (status === 'En Progreso') return 'text-white bg-emerald-500 shadow-emerald-500/30';
  if (status === 'Finalizado') return 'text-white bg-rose-500 shadow-rose-500/30';
  return 'text-white bg-umsa-gold shadow-yellow-500/30';
};

const openActividadDetalle = (actividadId: any) => {
  router.push({ name: 'ponente-curso-detalle', params: { id: actividadId } });
};

const handleImageError = (e: Event, fallbackUrl: string) => {
  (e.target as HTMLImageElement).src = fallbackUrl;
};
</script>

<template>
  <div class="animate-in fade-in duration-500 max-w-7xl mx-auto space-y-8">
    
    <!-- Buscador -->
    <div class="flex justify-center mb-8 mt-2">
      <div class="relative w-full max-w-2xl group">
        <label class="absolute -top-3 left-6 px-2 bg-[#f8f9fc] dark:bg-black z-10 text-[9px] font-black text-slate-400 uppercase tracking-widest italic transition-colors">Buscador de mis eventos y actividades</label>
        <span class="absolute inset-y-0 left-5 flex items-center text-slate-400">
          <span class="material-symbols-outlined text-xl group-focus-within:text-umsa-blue transition-colors">search</span>
        </span>
        <input v-model="searchQuery" class="w-full pl-14 pr-6 py-4 bg-white dark:bg-gray-900 border-2 border-slate-200 dark:border-gray-800 rounded-full shadow-sm text-sm focus:ring-4 focus:ring-umsa-blue/10 focus:border-umsa-blue outline-none transition-all font-bold text-primary-dark dark:text-gray-200 placeholder-slate-400" placeholder="Buscar por evento o actividad..." type="text">
      </div>
    </div>
    
    <!-- Cabecera -->
    <div class="flex items-center justify-between border-b border-slate-200 dark:border-gray-800 mb-8 pb-6 px-4 md:px-0">
      <div>
        <h2 class="text-2xl md:text-3xl font-black text-primary-dark dark:text-white uppercase italic flex items-center gap-3">
          <span class="material-symbols-outlined text-umsa-blue text-3xl">event</span>
          Mis Eventos Asignados
        </h2>
        <p class="text-[9px] md:text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mt-1">Eventos y programas en los que tienes actividades a tu cargo como docente/ponente</p>
      </div>
    </div>

    <div v-if="isLoading" class="p-20 flex flex-col items-center justify-center gap-4 text-slate-400">
      <span class="material-symbols-outlined animate-spin text-4xl">sync</span>
      <p class="text-xs font-black uppercase tracking-widest">Cargando eventos...</p>
    </div>

    <!-- Lista vacía -->
    <div v-else-if="filteredEventos.length === 0" class="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-[2.5rem] p-20 text-center shadow-sm">
      <div class="w-20 h-20 bg-slate-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
        <span class="material-symbols-outlined text-4xl text-slate-300">event_busy</span>
      </div>
      <h3 class="text-xl font-black text-slate-600 dark:text-gray-400 uppercase tracking-tighter">Sin eventos asignados</h3>
      <p class="text-xs text-slate-400 max-w-xs mx-auto font-medium">No se encontraron eventos ni actividades asignadas a tu cuenta actualmente.</p>
    </div>

    <!-- Grid de Eventos -->
    <div v-else class="space-y-12">
      <div v-for="evento in filteredEventos" :key="evento.id" 
        class="bg-white dark:bg-gray-900 rounded-[2.5rem] overflow-hidden shadow-lg border border-slate-100 dark:border-gray-800 flex flex-col group/card">
        
        <!-- Banner del Evento -->
        <div class="relative h-48 md:h-64 w-full overflow-hidden shrink-0">
          <img :src="evento.image" @error="handleImageError($event, 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&q=80')" class="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-[1.5s] ease-out">   
          <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
          
          <div class="absolute bottom-4 left-6 right-6 z-20 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <p class="text-[10px] font-bold text-umsa-gold uppercase tracking-[0.2em] mb-1 drop-shadow-md">
                Gestión {{ evento.gestion }}
              </p>
              <h3 class="text-xl md:text-3xl font-black text-white leading-tight uppercase italic drop-shadow-lg">
                {{ evento.nombre }}
              </h3>
            </div>
            
            <div class="flex items-center gap-2 text-white/90 bg-black/40 border border-white/10 px-4 py-2 rounded-xl backdrop-blur-md text-[10px] font-bold uppercase tracking-wider shadow-inner w-fit">
              <span class="material-symbols-outlined text-sm text-umsa-gold">calendar_month</span>
              <span>{{ evento.fechaInicio }} - {{ evento.fechaFin }}</span>
            </div>
          </div>
        </div>

        <!-- Contenido y Actividades Asignadas -->
        <div class="p-6 md:p-8 bg-slate-50 dark:bg-gray-950/20">
          <h4 class="text-xs font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-4 border-b border-slate-200 dark:border-gray-800 pb-2">
            Mis Actividades Asignadas en este Evento
          </h4>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div v-for="actividad in evento.actividades" :key="actividad.id" @click="openActividadDetalle(actividad.id)"
              class="bg-white dark:bg-gray-900 rounded-[2.5rem] overflow-hidden shadow-lg border border-slate-100 dark:border-gray-800 hover:border-umsa-blue transition-all duration-500 hover:-translate-y-2 cursor-pointer group flex flex-col relative">
              
              <!-- Imagen Predominante -->
              <div class="relative h-60 w-full overflow-hidden shrink-0">
                <img :src="actividad.image" @error="handleImageError($event, 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800&q=80')" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 ease-out">   
                <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"></div>
                
                <!-- Badge de Asignado -->
                <div class="absolute top-4 left-4 z-30">
                  <span class="bg-umsa-gold text-white text-[9px] font-black uppercase px-3 py-1.5 rounded-full shadow-xl flex items-center gap-1 border border-white/20 backdrop-blur-md">
                    <span class="material-symbols-outlined text-[12px]">assignment_ind</span>
                    ASIGNADO
                  </span>
                </div>

                <span class="absolute top-4 right-4 z-20 text-[9px] font-black uppercase px-3 py-1.5 rounded-full tracking-widest shadow-xl backdrop-blur-md border border-white/10" :class="getStatusColor(actividad.status)">
                  {{ actividad.status }}
                </span>

                <div class="absolute bottom-4 left-6 right-6 z-20">
                  <p class="text-[10px] font-bold text-umsa-gold uppercase tracking-[0.2em] mb-1 drop-shadow-md">
                    {{ actividad.type }}
                  </p>
                  <h3 class="text-xl md:text-2xl font-black text-white leading-tight uppercase italic group-hover:text-umsa-gold transition-colors drop-shadow-lg line-clamp-2">
                    {{ actividad.title }}
                  </h3>
                </div>
              </div>

              <!-- Información Inferior -->
              <div class="p-6 flex flex-col flex-1 bg-white dark:bg-gray-900">
                <div class="flex items-center justify-between text-slate-500 dark:text-gray-400 mb-6">
                  <div class="flex items-center gap-2">
                    <span class="material-symbols-outlined text-sm text-umsa-blue">calendar_month</span>
                    <span class="text-[10px] font-bold uppercase tracking-wider">{{ actividad.date }}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="material-symbols-outlined text-sm text-umsa-blue">groups</span>
                    <span class="text-[10px] font-bold uppercase tracking-wider">{{ actividad.students }} Estudiantes</span>
                  </div>
                </div>

                <div class="mt-auto flex justify-between items-center pt-5 border-t border-slate-100 dark:border-gray-800">
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
