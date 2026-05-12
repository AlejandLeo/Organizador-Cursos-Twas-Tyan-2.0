<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import api, { getImageUrl } from '@/services/api';

const router = useRouter();

const actividadesAsignadas = ref<any[]>([]);
const isLoading = ref(false);

const fetchData = async () => {
  try {
    isLoading.value = true;
    const res = await api.get('/imparticiones/mis-actividades');
    const imparticiones = res.data || [];
    
    const actividades = imparticiones
      .filter((imp: any) => imp?.actividadAcademica && Number(imp.actividadAcademica?.estado) !== -1)
      .map((imp: any) => {
        const act = imp.actividadAcademica || {};
        const ev = imp.evento || {};
        return {
          id: act.id,
          title: act.nombre || 'Actividad',
          eventoNombre: ev.nombreCorto || ev.nombre || 'Evento Principal',
          status: act.estado === 1 ? 'En Progreso' : (act.estado === 0 ? 'Finalizado' : 'Próximamente'),
          date: act.fecha_inicio ? `${new Date(act.fecha_inicio).toLocaleDateString()} - ${new Date(act.fecha_fin).toLocaleDateString()}` : 'Fechas por definir',
          students: act.inscripciones?.length || 0,
          type: act.tipo || 'Actividad',
          image: getImageUrl('cursos', act.imagen, 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&q=80'),
          gestion: ev.fecha_inicio ? new Date(ev.fecha_inicio).getFullYear().toString() : '2026'
        };
      });

    actividadesAsignadas.value = actividades;

    // Redirección directa si solo tiene una actividad (requerimiento de UX)
    if (actividades.length === 1) {
      router.replace({ name: 'ponente-curso-detalle', params: { id: actividades[0].id } });
    }
  } catch (error) {
    console.error('Error al cargar actividades asignadas:', error);
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  fetchData();
});

const getStatusColor = (status: any) => {
  if (status === 'En Progreso') return 'text-white bg-emerald-500 shadow-emerald-500/30';
  if (status === 'Finalizado') return 'text-white bg-rose-500 shadow-rose-500/30';
  return 'text-white bg-umsa-gold shadow-yellow-500/30';
};

const openActividadDetalle = (actividadId: any) => {
  router.push({ name: 'ponente-curso-detalle', params: { id: actividadId } });
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
    
    <div class="flex items-center justify-between border-b border-slate-200 dark:border-gray-800 mb-8 pb-6 px-4 md:px-0">
      <div>
        <h2 class="text-2xl md:text-3xl font-black text-primary-dark dark:text-white uppercase italic">Mis Cursos Asignados</h2>
        <p class="text-[9px] md:text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mt-1">Programas en los que estás asignado como docente/ponente</p>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      <div v-for="actividad in actividadesAsignadas" :key="actividad.id" @click="openActividadDetalle(actividad.id)" 
        class="bg-white dark:bg-gray-900 rounded-[2.5rem] overflow-hidden shadow-lg border border-slate-100 dark:border-gray-800 hover:border-umsa-blue transition-all duration-500 hover:-translate-y-2 cursor-pointer group flex flex-col relative">
        
        <!-- Imagen Predominante -->
        <div class="relative h-60 w-full overflow-hidden shrink-0">
          <img :src="actividad.image" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 ease-out">   
          <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"></div>
          
          <span class="absolute top-4 right-4 z-20 text-[9px] font-black uppercase px-3 py-1.5 rounded-full tracking-widest shadow-xl backdrop-blur-md border border-white/10" :class="getStatusColor(actividad.status)">
            {{ actividad.status }}
          </span>

          <div class="absolute bottom-4 left-6 right-6 z-20">
            <p class="text-[10px] font-bold text-umsa-gold uppercase tracking-[0.2em] mb-1 drop-shadow-md">
              {{ actividad.eventoNombre }}
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
</template>
