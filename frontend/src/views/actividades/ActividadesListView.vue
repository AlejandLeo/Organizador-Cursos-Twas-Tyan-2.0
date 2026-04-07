<script setup lang="ts">
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useEventoStore } from '../../stores/eventoStore';

const router = useRouter();
const route = useRoute();
const eventoStore = useEventoStore();

const isCreating = ref(false);
const currentStep = ref(1);

// Variables reactivas para el formulario de creación
const tipoActividad = ref('Diplomado');
const nuevoTipoActividad = ref('');

const activities = ref([
  {
    id: 1,
    title: 'Especialidad en Biofertilizantes',
    status: 'En curso',
    type: 'Especialidad',
    date: '15 Mar - 20 Jul 2026',
    students: 45,
    modules: 4,
    color: 'bg-primary-dark',
    icon: 'science',
    image: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&q=80'
  },
  {
    id: 2,
    title: 'Taller de Redacción APA 7ma Edición',
    status: 'Inscripciones',
    type: 'Taller',
    date: '10 Abr - 15 Abr 2026',
    students: 120,
    modules: 1,
    color: 'bg-emerald-500',
    icon: 'edit_document',
    image: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800&q=80'
  },
  {
    id: 3,
    title: 'Diplomado en Riego Tecnificado',
    status: 'Finalizado',
    type: 'Diplomado',
    date: '01 Ene - 28 Feb 2026',
    students: 75,
    modules: 6,
    color: 'bg-slate-400',
    icon: 'water_drop',
    image: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800&q=80'
  }
]);

const getStatusColor = (status: string) => {
  if (status === 'En curso') return 'text-green-600 bg-green-50 dark:bg-green-900/40 border border-green-200 dark:border-green-800';
  if (status === 'Inscripciones') return 'text-umsa-blue bg-blue-50 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-800';
  return 'text-slate-500 bg-slate-100 dark:bg-gray-800 dark:text-gray-400 border border-slate-200 dark:border-gray-700';
};

const openDetalleCurso = (courseId: any) => {
  if (route.name === 'coordinador-estudiantes-global') {
    router.push({ path: `/coordinador/actividades/${courseId}`, query: { tab: 'estudiantes' } });
  } else if (route.name === 'coordinador-ponentes-global') {
    router.push({ path: `/coordinador/actividades/${courseId}`, query: { tab: 'ponentes' } });
  } else {
    router.push({ path: `/coordinador/actividades/${courseId}` });
  }
};

const changeStep = (delta: number) => {
  const nextStep = currentStep.value + delta;
  if (nextStep >= 1 && nextStep <= 4) {
    currentStep.value = nextStep;
  }
};
</script>

<template>
  <div class="animate-in fade-in duration-500 max-w-7xl mx-auto space-y-8">
    
    <!-- VISTA: LISTADO -->
    <div v-if="!isCreating" id="view-listado" class="space-y-8">
      <div class="flex justify-center mb-8">
        <div class="relative w-full max-w-2xl group">
          <label class="absolute -top-3 left-6 px-2 bg-[#f8f9fc] dark:bg-black z-10 text-[9px] font-black text-slate-400 uppercase tracking-widest italic transition-colors">Buscador Inteligente de Cursos</label>
          <span class="absolute inset-y-0 left-5 flex items-center text-slate-400">
            <span class="material-symbols-outlined text-xl group-focus-within:text-umsa-blue transition-colors">search</span>
          </span>
          <input class="w-full pl-14 pr-6 py-4 bg-white dark:bg-gray-900 border-2 border-slate-200 dark:border-gray-800 rounded-full shadow-sm text-sm focus:ring-4 focus:ring-umsa-blue/10 focus:border-umsa-blue outline-none transition-all font-bold text-primary-dark dark:text-gray-200 placeholder-slate-400" placeholder="Busca Actividades Académicas..." type="text">
        </div>
      </div>
      
      <div class="flex items-center justify-between border-b border-slate-200 dark:border-gray-800 mb-8 pb-6">
        <div v-if="route.name === 'coordinador-estudiantes-global'">
          <h2 class="text-3xl font-black text-primary-dark dark:text-white uppercase italic">Directorio Estudiantil</h2>
          <p class="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mt-1">Selecciona una actividad para gestionar sus alumnos</p>
        </div>
        <div v-else-if="route.name === 'coordinador-ponentes-global'">
          <h2 class="text-3xl font-black text-primary-dark dark:text-white uppercase italic">Directorio de Ponentes</h2>
          <p class="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mt-1">Selecciona una actividad para gestionar sus docentes</p>
        </div>
        <div v-else>
          <h2 class="text-3xl font-black text-primary-dark dark:text-white uppercase italic">Actividades Académicas</h2>
          <p class="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mt-1">Gestión de programas del evento actual</p>
        </div>
        
        <button v-if="route.name === 'coordinador-actividades'" @click="isCreating = true; currentStep = 1;" class="bg-emerald-500 hover:bg-[#a38628] text-white font-black px-6 py-3.5 rounded-xl text-[11px] uppercase tracking-widest shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-2">
          <span class="material-symbols-outlined text-[18px]">add_circle</span> Crear Actividad
        </button>
      </div>

      <!-- Título de sección superpuesto estilo Netflix -->
      <div class="mb-5 pl-3 border-l-4 border-umsa-gold dark:border-blue-500">
        <h3 class="text-xl md:text-2xl font-black text-primary-dark dark:text-white tracking-tight leading-none">
          {{ eventoStore.selectedEventoNombre }}
          <span class="text-slate-400 dark:text-gray-500 text-lg font-medium ml-2 tracking-normal">/ Gestión {{ eventoStore.activeEvento?.gestion }}</span>
        </h3>
      </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">        
      <div v-for="act in activities" :key="act.id" @click="openDetalleCurso(act.id)" class="bg-white dark:bg-gray-900 rounded-3xl overflow-hidden shadow-sm border border-slate-100 dark:border-gray-800 hover:shadow-xl hover:border-umsa-blue transition-all group cursor-pointer flex flex-col h-full relative">

        <div class="relative h-44 w-full overflow-hidden">
            <div class="absolute inset-0 bg-primary-dark/20 dark:bg-black/40 group-hover:bg-transparent transition-colors z-10"></div>
            <img :src="act.image" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" :alt="act.title">   
            <span class="absolute top-4 right-4 z-20 bg-white/90 backdrop-blur-md text-[9px] font-black uppercase px-3 py-1.5 rounded-lg tracking-widest shadow-sm" :class="getStatusColor(act.status)">
              {{ act.status }}
            </span>
            <div class="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent z-20">
              <p class="text-[10px] font-bold text-umsa-blue mb-1 uppercase tracking-widest bg-white/10 w-fit px-2 py-0.5 rounded-md backdrop-blur-sm">{{ act.type }}</p>
            </div>
        </div>

        <div class="p-5 flex-1 flex flex-col">
          <h3 class="text-base font-black text-primary-dark dark:text-white leading-tight mb-2 group-hover:text-umsa-blue transition-colors line-clamp-2">{{ act.title }}</h3> 

          <div class="mt-auto space-y-3 pt-4 border-t border-slate-100 dark:border-gray-800">
            <div class="flex items-center text-slate-500 dark:text-gray-400 bg-slate-50 dark:bg-gray-800/50 p-2 rounded-lg">
              <span class="material-symbols-outlined text-[16px] mr-2 text-slate-400">calendar_today</span>
              <span class="text-xs font-bold">{{ act.date }}</span>
            </div>

            <div class="flex justify-between items-center px-1 mt-2">
              <div class="flex items-center text-slate-500 dark:text-gray-400">   
                <span class="material-symbols-outlined text-[16px] mr-1.5 text-umsa-blue">groups</span>
                <span class="text-xs font-black">{{ act.students }} <span class="font-bold text-[9px] uppercase tracking-widest ml-0.5">Inscritos</span></span>    
              </div>
              <div class="flex items-center text-slate-500 dark:text-gray-400">   
                <span class="material-symbols-outlined text-[16px] mr-1.5 text-emerald-500">view_module</span>
                <span class="text-xs font-black">{{ act.modules }} <span class="font-bold text-[9px] uppercase tracking-widest ml-0.5">Mód.</span></span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
    </div>

    <!-- VISTA: CREACIÓN (WIZARD) -->
    <div v-else id="view-creacion" class="space-y-10 animate-in fade-in duration-500">
      
      <div class="flex items-center justify-between border-b border-slate-200 dark:border-gray-800 pb-6">
          <div>
              <h2 class="text-3xl font-black text-primary-dark dark:text-white tracking-tighter uppercase italic">Configurar Nueva Actividad</h2>
              <p class="text-slate-400 dark:text-gray-500 font-medium mt-1 text-sm">Diseño, reglas y horarios del curso.</p>
          </div>
          <button @click="isCreating = false" class="flex items-center gap-2 px-6 py-2.5 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 text-slate-500 dark:text-gray-400 font-black text-[10px] uppercase rounded-xl hover:text-primary-dark hover:bg-slate-50 dark:hover:bg-gray-700 transition-all shadow-sm">
              <span class="material-symbols-outlined text-sm">arrow_back</span> Volver al Listado
          </button>
      </div>

      <div class="max-w-4xl mx-auto mb-10">
          <div class="flex items-center justify-between relative">
              <div class="absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 dark:bg-gray-800 -z-10 -translate-y-1/2"></div>
              
              <!-- Step 1 -->
              <div class="flex flex-col items-center bg-white dark:bg-gray-950 px-4">
                  <div class="w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-500"
                       :class="currentStep === 1 ? 'bg-primary-dark text-white border-umsa-gold scale-110 shadow-[0_0_15px_rgba(188,156,49,0.4)] dark:bg-blue-600' : 'bg-white dark:bg-gray-800 text-slate-300 dark:text-gray-500 border-slate-200 dark:border-gray-700'">
                      <span class="material-symbols-outlined text-xl">demography</span>
                  </div>
                  <span class="text-[10px] font-black uppercase mt-3" :class="currentStep === 1 ? 'text-primary-dark dark:text-white' : 'text-slate-400 dark:text-gray-500'">Diseño</span>
              </div>
              
              <!-- Step 2 -->
              <div class="flex flex-col items-center bg-white dark:bg-gray-950 px-4">
                  <div class="w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-500"
                       :class="currentStep === 2 ? 'bg-primary-dark text-white border-umsa-gold scale-110 shadow-[0_0_15px_rgba(188,156,49,0.4)] dark:bg-blue-600' : 'bg-white dark:bg-gray-800 text-slate-300 dark:text-gray-500 border-slate-200 dark:border-gray-700'">
                      <span class="material-symbols-outlined text-xl">gavel</span>
                  </div>
                  <span class="text-[10px] font-black uppercase mt-3" :class="currentStep === 2 ? 'text-primary-dark dark:text-white' : 'text-slate-400 dark:text-gray-500'">Reglas</span>
              </div>

              <!-- Step 3 -->
              <div class="flex flex-col items-center bg-white dark:bg-gray-950 px-4">
                  <div class="w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-500"
                       :class="currentStep === 3 ? 'bg-primary-dark text-white border-umsa-gold scale-110 shadow-[0_0_15px_rgba(188,156,49,0.4)] dark:bg-blue-600' : 'bg-white dark:bg-gray-800 text-slate-300 dark:text-gray-500 border-slate-200 dark:border-gray-700'">
                      <span class="material-symbols-outlined text-xl">calendar_clock</span>
                  </div>
                  <span class="text-[10px] font-black uppercase mt-3" :class="currentStep === 3 ? 'text-primary-dark dark:text-white' : 'text-slate-400 dark:text-gray-500'">Horarios</span>
              </div>

              <!-- Step 4 -->
              <div class="flex flex-col items-center bg-white dark:bg-gray-950 px-4">
                  <div class="w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-500"
                       :class="currentStep === 4 ? 'bg-primary-dark text-white border-umsa-gold scale-110 shadow-[0_0_15px_rgba(188,156,49,0.4)] dark:bg-blue-600' : 'bg-white dark:bg-gray-800 text-slate-300 dark:text-gray-500 border-slate-200 dark:border-gray-700'">
                      <span class="material-symbols-outlined text-xl">check_circle</span>
                  </div>
                  <span class="text-[10px] font-black uppercase mt-3" :class="currentStep === 4 ? 'text-primary-dark dark:text-white' : 'text-slate-400 dark:text-gray-500'">Resumen</span>
              </div>
          </div>
      </div>

      <!-- Contenido del Step 1 -->
      <div v-show="currentStep === 1" class="space-y-8 animate-in slide-in-from-right-8 duration-500">
          <div class="bg-white dark:bg-gray-900 p-8 rounded-[2rem] shadow-sm border border-slate-100 dark:border-gray-800">
              <h3 class="text-xl font-black text-primary-dark dark:text-white uppercase italic mb-8">1. Presentación del Curso</h3>
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div class="space-y-4">
                      <div>
                          <label class="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest block mb-2">Nombre Oficial de la Actividad</label>
                          <input type="text" placeholder="Ej: Especialidad en Microbiología..." class="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-umsa-blue font-bold text-primary-dark dark:text-gray-200 uppercase" />
                      </div>
                      <div>
                          <label class="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest block mb-2">Tipo de Actividad</label>
                          <select v-model="tipoActividad" class="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-umsa-blue font-bold text-primary-dark dark:text-gray-200 uppercase">
                              <option value="Diplomado">Diplomado</option>
                              <option value="Especialidad">Especialidad</option>
                              <option value="Taller">Taller</option>
                              <option value="Otro">Otro (Especificar)</option>
                          </select>
                      </div>

                      <div v-if="tipoActividad === 'Otro'" class="animate-in fade-in slide-in-from-top-4 duration-300">
                          <label class="text-[10px] font-black text-umsa-blue uppercase tracking-widest block mb-2 flex items-center gap-1">
                            <span class="material-symbols-outlined text-[14px]">edit</span> Especificar Nuevo Tipo
                          </label>
                          <input v-model="nuevoTipoActividad" type="text" placeholder="Ej: Seminario, Simposio..." class="w-full bg-blue-50/50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/50 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-umsa-blue font-bold text-primary-dark dark:text-gray-200 uppercase transition-all" />
                          <p class="text-[9px] text-slate-400 dark:text-gray-500 mt-2 font-bold italic">Este tipo se guardará en la base de datos para futuros usos.</p>
                      </div>
                  </div>
              </div>
          </div>
      </div>

      <!-- Contenido del Step 2 -->
      <div v-show="currentStep === 2" class="space-y-8 animate-in slide-in-from-right-8 duration-500">
          <div class="bg-white dark:bg-gray-900 p-8 rounded-[2rem] shadow-sm border border-slate-100 dark:border-gray-800">
              <h3 class="text-xl font-black text-primary-dark dark:text-white uppercase italic mb-8">2. Parámetros de Aprobación</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div class="p-8 rounded-[2rem] border-2 border-slate-100 dark:border-gray-800 border-l-[8px] border-l-primary-dark bg-slate-50 dark:bg-gray-800">
                      <h4 class="font-black text-primary-dark dark:text-white mb-2 uppercase text-sm">Nota Mínima</h4>
                      <input type="number" value="71" class="w-full bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 font-black text-xl text-center text-primary-dark dark:text-gray-200" />
                  </div>
                  <div class="p-8 rounded-[2rem] border-2 border-slate-100 dark:border-gray-800 border-l-[8px] border-l-umsa-gold bg-slate-50 dark:bg-gray-800">
                      <h4 class="font-black text-primary-dark dark:text-white mb-2 uppercase text-sm">Asistencia Mínima (%)</h4>
                      <input type="number" value="80" class="w-full bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 font-black text-xl text-center text-primary-dark dark:text-gray-200" />
                  </div>
              </div>
          </div>
      </div>

      <!-- Contenido del Step 3 -->
      <div v-show="currentStep === 3" class="space-y-8 animate-in slide-in-from-right-8 duration-500">
          <div class="bg-white dark:bg-gray-900 p-8 rounded-[2rem] shadow-sm border border-slate-100 dark:border-gray-800">
              <h3 class="text-xl font-black text-primary-dark dark:text-white uppercase italic mb-8">3. Cronograma y Fechas</h3>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                  <div class="p-6 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-[2rem] shadow-inner">
                      <label class="text-[10px] font-black text-slate-500 dark:text-gray-400 uppercase tracking-widest mb-3 block flex items-center gap-2">
                        <span class="material-symbols-outlined text-sm text-umsa-blue">calendar_month</span> Fecha de Inicio (Apertura)
                      </label>
                      <input type="date" class="w-full bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 font-black text-sm text-primary-dark dark:text-gray-200 focus:ring-2 focus:ring-umsa-blue outline-none transition-all cursor-pointer" />
                  </div>
                  <div class="p-6 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-[2rem] shadow-inner">
                      <label class="text-[10px] font-black text-slate-500 dark:text-gray-400 uppercase tracking-widest mb-3 block flex items-center gap-2">
                        <span class="material-symbols-outlined text-sm text-emerald-500">event_available</span> Fecha de Finalización (Cierre)
                      </label>
                      <input type="date" class="w-full bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 font-black text-sm text-primary-dark dark:text-gray-200 focus:ring-2 focus:ring-umsa-blue outline-none transition-all cursor-pointer" />
                  </div>
              </div>

              <h4 class="text-sm font-black text-primary-dark dark:text-white uppercase italic mb-4">Horarios de Sesiones</h4>
              <div class="p-6 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-[2rem] flex flex-wrap items-end gap-4 shadow-inner">
                  <div class="flex-1 min-w-[200px]">
                      <label class="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase mb-2 block">Día de la semana</label>
                      <select class="w-full border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-xl px-4 py-3 font-bold text-sm text-primary-dark dark:text-gray-200 focus:ring-2 focus:ring-umsa-blue outline-none transition-all cursor-pointer">
                          <option>Lunes</option>
                          <option>Martes</option>
                          <option>Miércoles</option>
                          <option>Jueves</option>
                          <option>Viernes</option>
                          <option>Sábado</option>
                          <option>Domingo</option>
                      </select>
                  </div>
                  <div class="w-32">
                      <label class="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase mb-2 block">Hora Inicio</label>
                      <input type="time" class="w-full border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-xl px-4 py-3 font-bold text-sm text-primary-dark dark:text-gray-200 focus:ring-2 focus:ring-umsa-blue outline-none transition-all cursor-pointer">
                  </div>
                  <div class="w-32">
                      <label class="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase mb-2 block">Hora Fin</label>
                      <input type="time" class="w-full border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-xl px-4 py-3 font-bold text-sm text-primary-dark dark:text-gray-200 focus:ring-2 focus:ring-umsa-blue outline-none transition-all cursor-pointer">
                  </div>
                  <button title="Añadir Horario" class="w-12 h-[46px] flex items-center justify-center bg-primary-dark dark:bg-blue-600 hover:bg-emerald-500 dark:hover:bg-blue-500 text-white rounded-xl shadow-md transition-all mb-[1px]">
                      <span class="material-symbols-outlined text-[20px]">add</span>
                  </button>
              </div>
          </div>
      </div>

      <!-- Contenido del Step 4 -->
      <div v-show="currentStep === 4" class="space-y-8 animate-in zoom-in-95 duration-500">
          <div class="bg-white dark:bg-gray-900 p-8 rounded-[2rem] shadow-sm border-l-[10px] border-l-umsa-gold dark:border-l-yellow-600 border border-slate-100 dark:border-gray-800">
              <h3 class="text-xl font-black text-primary-dark dark:text-white uppercase italic mb-4">4. Confirmación</h3>
              <p class="text-sm font-bold text-slate-500 dark:text-gray-400">Verifica los datos e inserta la actividad en la base de datos de esta versión.</p>
          </div>
      </div>

      <div class="flex justify-between items-center pt-4 border-t border-slate-200 dark:border-gray-800">
          <button @click="changeStep(-1)" :class="currentStep === 1 ? 'opacity-0 pointer-events-none' : 'opacity-100'" class="px-6 py-3 text-slate-400 dark:text-gray-500 font-black text-[10px] uppercase hover:text-primary-dark dark:hover:text-white flex items-center gap-2 transition-all">
              <span class="material-symbols-outlined text-sm">arrow_back</span> Regresar
          </button>
          
          <button v-if="currentStep < 4" @click="changeStep(1)" class="px-8 py-3 bg-primary-dark dark:bg-blue-600 text-white font-black text-[11px] uppercase rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2">
              Siguiente Paso <span class="material-symbols-outlined text-sm">arrow_forward</span>
          </button>

          <button v-else @click="isCreating = false" class="px-8 py-3 bg-emerald-500 dark:bg-yellow-600 text-white font-black text-[11px] uppercase rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2">
              Publicar Actividad <span class="material-symbols-outlined text-sm">publish</span>
          </button>
      </div>

    </div>
  </div>
</template>



