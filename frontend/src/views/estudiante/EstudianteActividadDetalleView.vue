<script setup lang="ts">
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';

const router = useRouter();
const route = useRoute();

// Simulamos los datos del curso basados en el ID
const curso = ref({
  id: route.params.id,
  title: 'Inteligencia Artificial Aplicada',
  status: 'En curso',
  type: 'Diplomado',
  date: '15 Mar - 20 Jul 2026',
  progress: 45,
  modules: 4,
  ponente: 'Dr. Alan Turing',
  color: 'bg-primary-dark',
  icon: 'neurology',
  description: 'Aprende los fundamentos y la aplicación de IA en proyectos reales de la industria. El diplomado incluye proyectos prácticos y evaluación continua.',
});

// Simulamos el estado de asistencias del estudiante
const asistencias = ref([
  { id: 1, session: 'Sesión 1: Introducción a la IA', date: '15 Mar 2026', time: '18:00 - 20:00', status: 'Asistió', verifiedAt: '17:55' },
  { id: 2, session: 'Sesión 2: Redes Neuronales Regresivas', date: '22 Mar 2026', time: '18:00 - 20:00', status: 'Falta', verifiedAt: '-' },
  { id: 3, session: 'Sesión 3: Deep Learning Módulo I', date: '29 Mar 2026', time: '18:00 - 20:00', status: 'Asistió', verifiedAt: '18:05' },
  { id: 4, session: 'Sesión 4: Taller Práctico (Computer Vision)', date: '05 Abr 2026', time: '18:00 - 20:00', status: 'Pendiente', verifiedAt: '-' },
]);

const activeTab = ref('asistencias');

const goBack = () => {
  router.push({ name: 'estudiante-actividades' });
};
</script>

<template>
  <div class="animate-in fade-in duration-500 max-w-5xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex items-center gap-4 pt-2">
      <button @click="goBack" class="w-10 h-10 flex items-center justify-center rounded-2xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 text-slate-500 hover:text-umsa-blue hover:bg-blue-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
        <span class="material-symbols-outlined text-xl">arrow_back_ios_new</span>
      </button>
      <div>
        <h2 class="text-2xl font-black text-primary-dark dark:text-white uppercase italic">Detalle de Actividad</h2>
        <p class="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mt-0.5">Mis Actividades / {{ curso.type }}</p>
      </div>
    </div>

    <!-- Banner -->
    <div class="bg-white dark:bg-gray-900 rounded-[2rem] p-6 shadow-sm border border-slate-100 dark:border-gray-800 relative overflow-hidden">
      <div class="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/0 to-slate-50/50 dark:to-white/5 rounded-bl-full -z-0"></div>
      <div class="relative z-10 flex flex-col md:flex-row gap-6 items-start md:items-center">
        <div class="w-20 h-20 shrink-0 rounded-3xl flex items-center justify-center text-white shadow-lg shadow-slate-200 dark:shadow-none" :class="curso.color">        
          <span class="material-symbols-outlined text-4xl" style="font-variation-settings: 'FILL' 1;">{{ curso.icon }}</span>
        </div>
        <div class="flex-1">
          <div class="flex items-center gap-3 mb-2">
            <span class="text-[10px] font-bold text-umsa-blue uppercase tracking-widest">{{ curso.type }}</span>
            <span class="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-widest bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">{{ curso.status }}</span>
          </div>
          <h1 class="text-3xl font-black text-primary-dark dark:text-white leading-tight mb-2">{{ curso.title }}</h1>
          <div class="flex flex-wrap gap-4 text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-widest">
            <span class="flex items-center gap-1"><span class="material-symbols-outlined text-[16px]">calendar_today</span> {{ curso.date }}</span>
            <span class="flex items-center gap-1"><span class="material-symbols-outlined text-[16px]">person</span> {{ curso.ponente }}</span>
          </div>
        </div>
        <div class="w-full md:w-48 bg-slate-50 dark:bg-gray-800/50 rounded-2xl p-4 border border-slate-100 dark:border-gray-800 text-center">
          <span class="block text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">Mi Progreso</span>
          <span class="block text-2xl font-black text-umsa-blue">{{ curso.progress }}%</span>
          <div class="w-full bg-slate-200 dark:bg-gray-700 rounded-full h-1.5 mt-2">
            <div class="bg-umsa-blue h-1.5 rounded-full" :style="{ width: curso.progress + '%' }"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="flex gap-2 p-1.5 bg-slate-100 dark:bg-gray-900/50 rounded-2xl w-fit border border-slate-200 dark:border-gray-800">
      <button @click="activeTab = 'contenido'" class="px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all" :class="activeTab === 'contenido' ? 'bg-white dark:bg-gray-800 text-umsa-blue shadow-sm border border-slate-200 dark:border-gray-700' : 'text-slate-500 hover:text-primary-dark dark:text-gray-400 dark:hover:text-white'">Información</button>
      <button @click="activeTab = 'asistencias'" class="px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-2" :class="activeTab === 'asistencias' ? 'bg-white dark:bg-gray-800 text-umsa-blue shadow-sm border border-slate-200 dark:border-gray-700' : 'text-slate-500 hover:text-primary-dark dark:text-gray-400 dark:hover:text-white'">
        Control de Asistencia <span v-if="activeTab !== 'asistencias'" class="w-2 h-2 rounded-full bg-emerald-500"></span>
      </button>
    </div>

    <!-- Tab Content -->
    <div v-if="activeTab === 'asistencias'" class="bg-white dark:bg-gray-900 rounded-[2rem] p-8 shadow-sm border border-slate-100 dark:border-gray-800 animate-in slide-in-from-bottom-2">
      <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
        <div>
          <h3 class="text-xl font-black text-primary-dark dark:text-white uppercase italic flex items-center gap-2">
            <span class="material-symbols-outlined text-umsa-blue text-2xl">how_to_reg</span>
            Mi Registro de Asistencia
          </h3>
          <p class="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Sesión por sesión del diplomado</p>
        </div>
        
        <!-- Tarjeta resumen -->
        <div class="flex items-center gap-6 bg-slate-50 dark:bg-gray-800/80 p-4 rounded-2xl border border-slate-100 dark:border-gray-700">
             <div class="text-center px-4 border-r border-slate-200 dark:border-gray-700">
               <span class="block text-2xl font-black text-emerald-600 dark:text-emerald-400">2</span>
               <span class="block text-[9px] font-bold text-slate-500 uppercase tracking-widest">Asistidas</span>
             </div>
             <div class="text-center px-4 border-r border-slate-200 dark:border-gray-700">
               <span class="block text-2xl font-black text-red-500">1</span>
               <span class="block text-[9px] font-bold text-slate-500 uppercase tracking-widest">Faltas</span>
             </div>
             <div class="text-center px-4">
               <span class="block text-2xl font-black text-umsa-blue">75%</span>
               <span class="block text-[9px] font-bold text-slate-500 uppercase tracking-widest">Porcentaje</span>
             </div>
        </div>
      </div>

      <!-- Tabla Asistencias -->
      <div class="overflow-x-auto rounded-2xl border border-slate-100 dark:border-gray-800">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-50 dark:bg-gray-800/50">
              <th class="py-4 px-6 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-gray-700">Sesión</th>
              <th class="py-4 px-6 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-gray-700">Fecha y Hora</th>
              <th class="py-4 px-6 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-gray-700">Registro</th>
              <th class="py-4 px-6 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-gray-700 text-right">Estado</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-gray-800">
            <tr v-for="asis in asistencias" :key="asis.id" class="hover:bg-slate-50 dark:hover:bg-gray-800/30 transition-colors">
              <td class="py-4 px-6">
                <span class="text-sm font-bold text-primary-dark dark:text-gray-200 block">{{ asis.session }}</span>
              </td>
              <td class="py-4 px-6">
                <span class="text-xs font-bold text-slate-500 flex items-center gap-1.5"><span class="material-symbols-outlined text-[14px]">event</span> {{ asis.date }}</span>
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mt-0.5">{{ asis.time }}</span>
              </td>
              <td class="py-4 px-6">
                <span v-if="asis.verifiedAt !== '-'" class="text-xs font-bold text-slate-600 dark:text-gray-400 bg-slate-100 dark:bg-gray-800 px-2 py-1 rounded-md">{{ asis.verifiedAt }}</span>
                <span v-else class="text-xs text-slate-400">-</span>
              </td>
              <td class="py-4 px-6 text-right">
                <span v-if="asis.status === 'Asistió'" class="inline-flex items-center justify-center px-3 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-lg border border-emerald-200 dark:border-emerald-800">
                  {{ asis.status }}
                </span>
                <span v-else-if="asis.status === 'Falta'" class="inline-flex items-center justify-center px-3 py-1 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[10px] font-black uppercase tracking-widest rounded-lg border border-red-200 dark:border-red-800">
                  {{ asis.status }}
                </span>
                <span v-else class="inline-flex items-center justify-center px-3 py-1 bg-slate-100 dark:bg-gray-800 text-slate-500 dark:text-gray-400 text-[10px] font-black uppercase tracking-widest rounded-lg border border-slate-200 dark:border-gray-700">
                  {{ asis.status }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Información Tab -->
    <div v-if="activeTab === 'contenido'" class="bg-white dark:bg-gray-900 rounded-[2rem] p-8 shadow-sm border border-slate-100 dark:border-gray-800 animate-in slide-in-from-bottom-2">
      <h3 class="text-xl font-black text-primary-dark dark:text-white uppercase italic mb-4">Sobre esta actividad</h3>
      <p class="text-sm font-medium text-slate-600 dark:text-gray-400 leading-relaxed max-w-3xl mb-8">{{ curso.description }}</p>
      
      <h4 class="text-sm font-black text-primary-dark dark:text-white uppercase mb-4">Estructura</h4>
      <div class="space-y-4">
        <div class="p-4 rounded-xl bg-slate-50 dark:bg-gray-800/50 border border-slate-100 dark:border-gray-700 flex gap-4">
          <div class="min-w-10 h-10 bg-white dark:bg-gray-800 rounded-lg text-umsa-blue font-black flex items-center justify-center shadow-sm">01</div>
          <div>
            <h5 class="text-sm font-bold text-primary-dark dark:text-white">Fundamentos y Redes Neuronales</h5>
            <p class="text-xs text-slate-500 mt-1">Arquitectura de modelos de perceptrones y backpropagation.</p>
          </div>
        </div>
        <div class="p-4 rounded-xl bg-slate-50 dark:bg-gray-800/50 border border-slate-100 dark:border-gray-700 flex gap-4">
          <div class="min-w-10 h-10 bg-white dark:bg-gray-800 rounded-lg text-umsa-blue font-black flex items-center justify-center shadow-sm">02</div>
          <div>
            <h5 class="text-sm font-bold text-primary-dark dark:text-white">Computer Vision y Convoluciones</h5>
            <p class="text-xs text-slate-500 mt-1">Aplicación en imágenes mediante CNNs y transfer learning.</p>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>
