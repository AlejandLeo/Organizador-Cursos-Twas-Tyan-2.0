<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

// Usamos datos simulados basados en la estructura del PonenteCursoDetalleView
const route = useRoute();
const router = useRouter();
const actividadId = route.params.id;
const activeTab = ref(route.query.tab ? String(route.query.tab) : 'resumen');

const tabs = [
  { id: 'resumen', label: 'Resumen', icon: 'info' },
  { id: 'material', label: 'Material & Tareas', icon: 'library_books' },
  { id: 'calificaciones', label: 'Mi Progreso', icon: 'leaderboard' },
  { id: 'certificados', label: 'Mi Certificado', icon: 'workspace_premium' }
];

const actividad = ref({
  id: actividadId,
  nombre: 'Módulo 1: Fundamentos de Biofertilizantes',
  tipo: 'Módulo',
  fecha: '10 May - 20 Jun 2026',
  estado: 'En curso',
  progreso: 60,
  promedio: 85,
  asistencia: 90,
  horas: 40,
  docente: 'Dr. John Doe',
  descripcion: 'En este módulo aprenderás los principios básicos de la producción y aplicación de biofertilizantes en cultivos de alto rendimiento.',
  imagen: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=1200&q=80',
  materiales: [
    { id: 1, titulo: 'Guía de Introducción', tipo: 'PDF', tamaño: '2.4 MB', fecha: '12 May 2026' },
    { id: 2, titulo: 'Video Analisis de Suelo', tipo: 'Video', tamaño: '145 MB', fecha: '15 May 2026' }
  ],
  tareas: [
    { id: 1, titulo: 'Cuestionario Tema 1', estado: 'Entregado', nota: 90, fecha: '18 May 2026' },
    { id: 2, titulo: 'Ensayo Práctico', estado: 'Pendiente', nota: null, fecha: '25 May 2026' }
  ],
  certificadoRequisitos: {
    asistenciaMinima: 80,
    notaMinima: 71,
    completado: false
  }
});

const getStatusColor = (status: string) => {
  if (status === 'En curso' || status === 'Entregado') return 'bg-emerald-500 text-white';
  if (status === 'Pendiente') return 'bg-amber-500 text-white';
  return 'bg-slate-500 text-white';
};

const goBack = () => {
    router.push({ name: 'estudiante-eventos' });
};
</script>

<template>
  <div class="animate-in fade-in duration-500 max-w-7xl mx-auto space-y-8">
    
    <!-- Hero Header Integrado Tipo Netflix -->
    <div class="relative w-full h-[300px] md:h-[400px] rounded-[2rem] overflow-hidden shadow-2xl border border-slate-200/50 dark:border-gray-800 flex flex-col group/hero mb-6">
      <img :src="actividad.imagen" alt="Banner" class="absolute inset-0 w-full h-full object-cover object-center group-hover/hero:scale-105 transition-transform duration-[2s] ease-out">
      <div class="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-900/80 to-transparent"></div>
      
      <!-- Navegación y Badges Top -->
      <div class="absolute top-0 left-0 right-0 p-8 z-20 flex justify-between items-start">
          <button @click="goBack" class="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/20 p-2.5 rounded-2xl transition-all hover:scale-105 flex items-center justify-center">
              <span class="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
          <span class="text-[10px] font-black uppercase px-4 py-1.5 rounded-full tracking-widest shadow-lg backdrop-blur-md border border-white/20 text-white" :class="getStatusColor(actividad.estado)">
            {{ actividad.estado }}
          </span>
      </div>

      <!-- Título y Meta de Actividad -->
      <div class="absolute bottom-0 left-0 right-0 p-8 md:p-12 z-20 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div class="max-w-3xl">
          <div class="flex items-center gap-3 mb-3">
              <span class="text-xs font-black text-emerald-400 uppercase tracking-widest bg-emerald-900/30 border border-emerald-500/30 px-3 py-1 rounded-full">{{ actividad.tipo }}</span>
              <span class="text-xs font-bold text-gray-300 uppercase tracking-widest break-words">{{ actividad.fecha }}</span>
          </div>
          <h1 class="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tighter leading-none mb-4 drop-shadow-lg">{{ actividad.nombre }}</h1>
          <p class="text-sm md:text-base font-medium text-gray-300 line-clamp-2 md:line-clamp-3 leading-relaxed drop-shadow-md max-w-2xl">{{ actividad.descripcion }}</p>
        </div>

        <!-- Metric Cards Flotantes -->
        <div class="flex gap-4 shrink-0">
            <div class="bg-gray-900/60 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-4 flex flex-col items-center justify-center min-w-[100px] shadow-2xl">
                <span class="material-symbols-outlined text-emerald-400 text-3xl mb-1">school</span>
                <span class="text-2xl font-black text-white leading-none">{{ actividad.promedio }}</span>
                <span class="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Promedio</span>
            </div>
            <div class="bg-gray-900/60 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-4 flex flex-col items-center justify-center min-w-[100px] shadow-2xl">
                <span class="material-symbols-outlined text-blue-400 text-3xl mb-1">fact_check</span>
                <span class="text-2xl font-black text-white leading-none">{{ actividad.asistencia }}%</span>
                <span class="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Asistencia</span>
            </div>
        </div>
      </div>
    </div>

    <!-- Tabs de Navegación -->
    <div class="flex overflow-x-auto gap-2 border-b border-slate-200 dark:border-gray-800 pb-1 snap-x scrollbar-hide">
      <button v-for="tab in tabs" :key="tab.id" @click="activeTab = tab.id"
        class="flex items-center gap-2 px-6 py-4 text-xs font-black uppercase tracking-widest rounded-t-2xl transition-all whitespace-nowrap snap-start border-b-2"
        :class="activeTab === tab.id 
          ? 'text-primary-dark dark:text-emerald-400 border-primary-dark dark:border-emerald-400 bg-slate-50 dark:bg-gray-900/50' 
          : 'text-slate-500 dark:text-gray-500 border-transparent hover:bg-slate-50 dark:hover:bg-gray-800/50 hover:text-slate-700 dark:hover:text-gray-300'">
        <span class="material-symbols-outlined text-[18px]">{{ tab.icon }}</span>
        {{ tab.label }}
      </button>
    </div>

    <!-- Contenido Principal -->
    <div class="bg-white dark:bg-gray-900 rounded-[2rem] p-6 md:p-10 shadow-sm border border-slate-200/60 dark:border-gray-800 min-h-[400px]">
      
      <!-- Tab: Resumen -->
      <div v-if="activeTab === 'resumen'" class="animate-in slide-in-from-bottom-4 duration-500 fade-in space-y-8">
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <!-- Info General -->
              <div class="lg:col-span-2 space-y-6">
                <div>
                   <h3 class="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight mb-4">Acerca de este {{ actividad.tipo.toLowerCase() }}</h3>
                   <p class="text-slate-600 dark:text-gray-400 leading-relaxed">{{ actividad.descripcion }}</p>
                </div>
                
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 mt-6 border-t border-slate-100 dark:border-gray-800">
                   <div class="space-y-1">
                       <span class="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest block">Docente</span>
                       <span class="text-sm font-black text-slate-700 dark:text-gray-300 block truncate">{{ actividad.docente }}</span>
                   </div>
                   <div class="space-y-1">
                       <span class="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest block">Carga Horaria</span>
                       <span class="text-sm font-black text-slate-700 dark:text-gray-300 block">{{ actividad.horas }} Hrs Académicas</span>
                   </div>
                    <div class="space-y-1">
                       <span class="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest block">Progreso Global</span>
                       <span class="text-sm font-black text-emerald-600 dark:text-emerald-400 block">{{ actividad.progreso }}% Completado</span>
                   </div>
                </div>
              </div>
              
              <!-- Sidebar Stats -->
              <div class="bg-slate-50 dark:bg-gray-950 p-6 rounded-[1.5rem] border border-slate-100 dark:border-gray-800 space-y-6 h-fit">
                   <h3 class="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight border-b border-slate-200 dark:border-gray-800 pb-3">Resumen de Progreso</h3>
                   
                   <div class="space-y-4">
                       <div>
                           <div class="flex justify-between items-center mb-2">
                               <span class="text-xs font-bold text-slate-600 dark:text-gray-400 uppercase tracking-widest">Temario</span>
                               <span class="text-xs font-black text-slate-800 dark:text-gray-200">5/8 Completado</span>
                           </div>
                           <div class="w-full bg-slate-200 dark:bg-gray-800 rounded-full h-2">
                               <div class="bg-blue-500 h-2 rounded-full" style="width: 60%"></div>
                           </div>
                       </div>
                       
                        <div>
                           <div class="flex justify-between items-center mb-2">
                               <span class="text-xs font-bold text-slate-600 dark:text-gray-400 uppercase tracking-widest">Tareas</span>
                               <span class="text-xs font-black text-slate-800 dark:text-gray-200">1/2 Entregado</span>
                           </div>
                           <div class="w-full bg-slate-200 dark:bg-gray-800 rounded-full h-2">
                               <div class="bg-purple-500 h-2 rounded-full" style="width: 50%"></div>
                           </div>
                       </div>
                   </div>
              </div>
          </div>
      </div>

      <!-- Tab: Material (Placeholder simple) -->
      <div v-if="activeTab === 'material'" class="animate-in slide-in-from-bottom-4 duration-500 fade-in">
          <h3 class="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight mb-6">Material Didáctico</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div v-for="mat in actividad.materiales" :key="mat.id" class="border border-slate-200 dark:border-gray-800 rounded-2xl p-5 hover:border-blue-500 transition-colors group cursor-pointer dark:bg-gray-950">
                  <div class="flex justify-between items-start mb-4">
                      <span class="material-symbols-outlined text-3xl" :class="mat.tipo === 'PDF' ? 'text-red-500' : 'text-blue-500'">{{ mat.tipo === 'PDF' ? 'picture_as_pdf' : 'smart_display' }}</span>
                      <span class="text-[10px] bg-slate-100 dark:bg-gray-800 px-2 py-1 rounded font-bold uppercase tracking-widest text-slate-500 dark:text-gray-400">{{ mat.tamaño }}</span>
                  </div>
                  <h4 class="font-bold text-slate-800 dark:text-white mb-1 line-clamp-1 group-hover:text-blue-500 transition-colors">{{ mat.titulo }}</h4>
                  <p class="text-xs text-slate-500 font-medium">{{ mat.fecha }}</p>
              </div>
          </div>
      </div>

       <!-- Tab: Calificaciones (Placeholder simple) -->
      <div v-if="activeTab === 'calificaciones'" class="animate-in slide-in-from-bottom-4 duration-500 fade-in">
          <h3 class="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight mb-6">Tus Calificaciones</h3>
          <div class="space-y-4 max-w-3xl">
              <div v-for="tarea in actividad.tareas" :key="tarea.id" class="flex items-center justify-between border border-slate-200 dark:border-gray-800 rounded-2xl p-5 dark:bg-gray-950 relative overflow-hidden">
                  <div class="absolute left-0 top-0 bottom-0 w-1" :class="tarea.nota ? 'bg-emerald-500' : 'bg-amber-500'"></div>
                  <div class="flex items-center gap-4">
                      <div class="bg-slate-100 dark:bg-gray-900 p-3 rounded-xl">
                          <span class="material-symbols-outlined text-slate-500" :class="tarea.nota ? 'text-emerald-500' : 'text-amber-500'">{{ tarea.nota ? 'task_alt' : 'history_edu' }}</span>
                      </div>
                      <div>
                          <h4 class="font-bold text-slate-800 dark:text-white text-sm md:text-base">{{ tarea.titulo }}</h4>
                          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{{ tarea.fecha }} - <span :class="getStatusColor(tarea.estado) + ' px-1.5 py-0.5 rounded ml-1'">{{ tarea.estado }}</span></span>
                      </div>
                  </div>
                  <div class="text-right">
                      <span v-if="tarea.nota !== null" class="text-2xl font-black text-slate-800 dark:text-white">{{ tarea.nota }}/100</span>
                      <span v-else class="text-sm font-bold text-amber-500 uppercase tracking-widest">- / 100</span>
                  </div>
              </div>
          </div>
      </div>

      <!-- Tab: Certificados -->
      <div v-if="activeTab === 'certificados'" class="animate-in slide-in-from-bottom-4 duration-500 fade-in flex flex-col items-center justify-center py-12 md:py-20 text-center max-w-2xl mx-auto">
        
        <div class="relative w-32 h-32 mb-8 group">
          <div class="absolute inset-0 bg-umsa-gold/20 dark:bg-yellow-500/10 rounded-full blur-xl group-hover:blur-2xl transition-all duration-500"></div>
          <div class="w-full h-full bg-gradient-to-br from-umsa-gold to-yellow-600 rounded-full flex items-center justify-center shadow-2xl border-4 border-white dark:border-gray-900 relative z-10 transform group-hover:scale-105 transition-transform">
             <span class="material-symbols-outlined text-white text-5xl">workspace_premium</span>
          </div>
        </div>

        <h3 class="text-2xl md:text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tighter mb-4">Tu Certificado de Participación</h3>
        
        <p v-if="!actividad.certificadoRequisitos.completado" class="text-slate-500 dark:text-gray-400 text-sm md:text-base mb-8 leading-relaxed max-w-lg">
          Para habilitar la descarga de tu certificado oficial, debes cumplir con los requisitos académicos del {{ actividad.tipo.toLowerCase() }}. Revisa tu estado actual:
        </p>
        <p v-else class="text-green-600 dark:text-green-400 text-sm md:text-base mb-8 leading-relaxed max-w-lg font-bold">
          ¡Felicidades! Has cumplido con todos los requisitos. Tu certificado está listo para ser descargado en alta resolución.
        </p>

        <!-- Tracker de Requisitos -->
        <div class="w-full bg-slate-50 dark:bg-gray-950 border border-slate-200 dark:border-gray-800 rounded-3xl p-6 md:p-8 mb-10 text-left relative overflow-hidden">
            <h4 class="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-gray-500 mb-6 border-b border-slate-200 dark:border-gray-800 pb-3">Progreso de Requisitos Academicos</h4>
            
            <div class="space-y-6">
                <!-- Req Asistencia -->
                <div>
                   <div class="flex justify-between items-center mb-2">
                       <span class="text-xs md:text-sm font-bold text-slate-700 dark:text-gray-300">Asistencia Mínima ({{ actividad.certificadoRequisitos.asistenciaMinima }}%)</span>
                       <span class="text-sm font-black" :class="actividad.asistencia >= actividad.certificadoRequisitos.asistenciaMinima ? 'text-emerald-500' : 'text-amber-500'">{{ actividad.asistencia }}%</span>
                   </div>
                   <div class="w-full bg-slate-200 dark:bg-gray-800 rounded-full h-2">
                       <div class="h-2 rounded-full transition-all" :class="actividad.asistencia >= actividad.certificadoRequisitos.asistenciaMinima ? 'bg-emerald-500' : 'bg-amber-500'" :style="{ width: `${Math.min(100, (actividad.asistencia / actividad.certificadoRequisitos.asistenciaMinima) * 100)}%` }"></div>
                   </div>
                </div>

                <!-- Req Promedio -->
                <div>
                   <div class="flex justify-between items-center mb-2">
                       <span class="text-xs md:text-sm font-bold text-slate-700 dark:text-gray-300">Aprobación (>= {{ actividad.certificadoRequisitos.notaMinima }} pts)</span>
                       <span class="text-sm font-black" :class="actividad.promedio >= actividad.certificadoRequisitos.notaMinima ? 'text-emerald-500' : 'text-amber-500'">{{ actividad.promedio }} pts</span>
                   </div>
                   <div class="w-full bg-slate-200 dark:bg-gray-800 rounded-full h-2">
                       <div class="h-2 rounded-full transition-all" :class="actividad.promedio >= actividad.certificadoRequisitos.notaMinima ? 'bg-emerald-500' : 'bg-amber-500'" :style="{ width: `${Math.min(100, (actividad.promedio / actividad.certificadoRequisitos.notaMinima) * 100)}%` }"></div>
                   </div>
                </div>
            </div>

            <!-- Lock Overlay if incomplete but not explicitly showing as a lock block, just subtle UI -->
            <div v-if="!actividad.certificadoRequisitos.completado" class="mt-6 flex items-center justify-center gap-2 text-amber-500 bg-amber-50 dark:bg-amber-500/10 p-3 rounded-xl border border-amber-200 dark:border-amber-500/20">
                <span class="material-symbols-outlined text-sm">lock</span>
                <span class="text-[10px] font-black uppercase tracking-widest">Aún no cumples todos los requisitos</span>
            </div>
        </div>

        <!-- Botones de Acción -->
        <button 
          class="w-full md:w-auto px-10 py-4 rounded-xl font-black text-xs md:text-sm uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-3"
          :class="actividad.certificadoRequisitos.completado ? 'bg-umsa-gold hover:bg-yellow-500 text-white hover:scale-105 hover:shadow-yellow-500/30' : 'bg-slate-200 text-slate-400 dark:bg-gray-800 dark:text-gray-600 cursor-not-allowed border border-slate-300 dark:border-gray-700'"
          :disabled="!actividad.certificadoRequisitos.completado">
          <span class="material-symbols-outlined text-[20px]">{{ actividad.certificadoRequisitos.completado ? 'download' : 'lock' }}</span>
          {{ actividad.certificadoRequisitos.completado ? 'Descargar PDF Oficial' : 'Certificado Bloqueado' }}
        </button>
        <p v-if="actividad.certificadoRequisitos.completado" class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-4">Documento firmado digitalmente con código QR de verificación</p>

      </div>

    </div>
  </div>
</template>
