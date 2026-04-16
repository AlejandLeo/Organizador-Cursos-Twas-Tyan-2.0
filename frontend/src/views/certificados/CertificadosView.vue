<script setup lang="ts">
import { ref } from 'vue';

const currentView = ref('lista'); // 'lista' o 'workspace'
const selectedCourse = ref('');
const audienceType = ref<'estudiantes' | 'ponentes' | 'individual'>('estudiantes'); // 'estudiantes', 'ponentes' o 'individual'

const statusGeneracion = ref('pendiente'); // pendiente, generando, completado
const progress = ref(0);

const isModalOpen = ref(false);
const googleSlidesUrl = ref('');
const embeddedUrl = ref('');

const searchInd = ref('');
const selectedStudent = ref<{nombre: string, ci: string, nota: number, asistencia: number} | null>(null);

const searchStudent = () => {
    if (searchInd.value) {
        selectedStudent.value = {
            nombre: 'Alejandro Leonardo',
            ci: '1234567',
            nota: 88,
            asistencia: 90
        };
    } else {
         selectedStudent.value = null;
    }
};

const openWorkspace = (courseName: string) => {
    selectedCourse.value = courseName;
    currentView.value = 'workspace';
    statusGeneracion.value = 'pendiente';
    progress.value = 0;
};

const closeWorkspace = () => {
    selectedCourse.value = '';
    currentView.value = 'lista';
};

const toggleAudience = (type: 'estudiantes' | 'ponentes' | 'individual') => {
    audienceType.value = type;
    statusGeneracion.value = 'pendiente';
    progress.value = 0;
    selectedStudent.value = null;
    searchInd.value = '';
};

const generarCertificados = () => {
    if (!embeddedUrl.value) {
        alert("Por favor, vincula una plantilla de Google Slides primero.");
        return;
    }
    statusGeneracion.value = 'generando';
    progress.value = 0;
    const interval = setInterval(() => {
        progress.value += 15;
        if(progress.value >= 100) {
            progress.value = 100;
            clearInterval(interval);
            setTimeout(() => {
                statusGeneracion.value = 'completado';
            }, 400);
        }
    }, 500);
};

const sendToAll = () => {
    alert('¡Correos enviados a ' + (audienceType.value === 'estudiantes' ? 'todos los estudiantes aprobados!' : 'todos los ponentes!'));
    statusGeneracion.value = 'pendiente';
};

const linkSlides = () => {
    if (googleSlidesUrl.value.includes('/edit')) {
        embeddedUrl.value = googleSlidesUrl.value.split('/edit')[0] + '/embed?rm=minimal';
    } else {
        embeddedUrl.value = googleSlidesUrl.value;
    }
    isModalOpen.value = false;
};
</script>

<template>
  <div class="p-6 md:p-10 space-y-8 animate-in fade-in duration-500">
    
    <!-- VISTA LISTA DE CURSOS -->
    <div v-if="currentView === 'lista'" class="space-y-8">
      <div class="flex items-end justify-between border-b border-slate-200 dark:border-gray-800 pb-6">
          <div>
              <h2 class="text-3xl md:text-4xl font-black text-umsa-blue dark:text-blue-400 tracking-tighter uppercase italic">Emisión de Certificados</h2>
              <p class="text-slate-400 dark:text-gray-400 font-medium mt-2">Selecciona una actividad para vincular su plantilla y generar los diplomas.</p>
          </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-4">
          <div @click="openWorkspace('Especialidad en Biofertilizantes')" class="course-card bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-gray-800 shadow-sm cursor-pointer group flex flex-col hover:-translate-y-1 hover:border-slate-400 dark:hover:border-gray-600 hover:shadow-[0_15px_30px_rgba(1,34,72,0.08)] dark:hover:shadow-black/50 transition-all">
              <div class="flex justify-between items-center mb-6">
                  <span class="bg-umsa-blue dark:bg-blue-500/20 text-white dark:text-blue-400 text-[9px] font-black px-3 py-1 rounded-full uppercase border dark:border-blue-400/30">Diplomado</span>
                  <span class="bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-500 text-[9px] font-black px-3 py-1 rounded-full uppercase flex items-center gap-1 border dark:border-amber-500/20">
                      <span class="material-symbols-outlined text-[10px]">warning</span> Sin Plantilla
                  </span>
              </div>
              <h3 class="text-xl font-black text-umsa-blue dark:text-white leading-tight mb-2 uppercase">Especialidad en Biofertilizantes</h3>
              <p class="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase mb-8">Aprobados: 35 Alumnos | 4 Ponentes</p>
              <div class="mt-auto pt-4 border-t border-slate-50 dark:border-gray-800 flex items-center justify-between text-[10px] font-black text-umsa-gold dark:text-emerald-500 uppercase">
                  <span>Gestión 2026</span>
                  <span class="group-hover:translate-x-1 transition-transform">Abrir Workspace &gt;</span>
              </div>
          </div>
          <!-- Puedes iterar mas tarjetas aquí con v-for -->
      </div>
    </div>

    <!-- VISTA WORKSPACE -->
    <div v-else-if="currentView === 'workspace'" class="space-y-8 animate-in slide-in-from-right-8 duration-500">
        
        <div class="bg-white dark:bg-gray-900 justify-between items-start md:items-center p-6 rounded-2xl border border-slate-200 dark:border-gray-800 shadow-sm flex flex-col md:flex-row gap-4 relative overflow-hidden">
            <!-- Decorative line instead of full border -->
            <div class="absolute left-0 top-0 bottom-0 w-1 bg-umsa-blue dark:bg-blue-500"></div>
            
            <div class="pl-2">
                <h2 class="text-xl md:text-2xl font-black text-umsa-blue dark:text-white tracking-tighter flex items-center gap-2">
                    <span class="material-symbols-outlined text-umsa-blue dark:text-blue-400 text-2xl md:text-3xl">workspace_premium</span>
                    Workspace de Certificación
                </h2>
                <p class="text-slate-500 dark:text-gray-400 text-xs font-bold mt-1 tracking-widest uppercase">{{ selectedCourse }}</p>
            </div>
            
            <div class="flex flex-wrap gap-2 md:gap-3 w-full md:w-auto">
                <button @click="closeWorkspace()" class="flex-1 md:flex-none justify-center bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 text-slate-600 dark:text-gray-300 px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-100 dark:hover:bg-gray-700 transition-all uppercase flex items-center gap-1.5 shadow-sm">
                  <span class="material-symbols-outlined text-[16px]">arrow_back</span> Volver
                </button>
                <button @click="isModalOpen = true" class="flex-1 md:flex-none justify-center bg-umsa-blue text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-umsa-blue/20 hover:bg-primary-accent transition-all flex items-center gap-2 uppercase tracking-widest">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Google_Drive_icon_%282020%29.svg/512px-Google_Drive_icon_%282020%29.svg.png" class="h-4 brightness-0 invert">
                    Vincular Slides
                </button>
            </div>
        </div>

        <div class="flex justify-center -mb-2 relative z-10 w-full overflow-x-auto pb-2 mt-4">
            <div class="bg-slate-50 dark:bg-gray-800 p-1.5 rounded-xl border border-slate-200 dark:border-gray-700 flex gap-1 min-w-max shadow-sm">
                <button 
                  @click="toggleAudience('estudiantes')" 
                  :class="audienceType === 'estudiantes' ? 'bg-white dark:bg-gray-700 text-umsa-blue dark:text-white shadow-sm border-slate-200 dark:border-gray-600' : 'bg-transparent text-slate-500 border-transparent dark:text-gray-400 hover:text-umsa-blue dark:hover:text-white'"
                  class="px-6 md:px-8 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all border">
                  Para Estudiantes
                </button>
                <button 
                  @click="toggleAudience('ponentes')" 
                  :class="audienceType === 'ponentes' ? 'bg-white dark:bg-gray-700 text-umsa-blue dark:text-white shadow-sm border-slate-200 dark:border-gray-600' : 'bg-transparent text-slate-500 border-transparent dark:text-gray-400 hover:text-umsa-blue dark:hover:text-white'"
                  class="px-6 md:px-8 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all border">
                  Para Ponentes
                </button>
                <button 
                  @click="toggleAudience('individual')" 
                  :class="audienceType === 'individual' ? 'bg-white dark:bg-gray-700 text-umsa-blue dark:text-white shadow-sm border-slate-200 dark:border-gray-600' : 'bg-transparent text-slate-500 border-transparent dark:text-gray-400 hover:text-umsa-blue dark:hover:text-white'"
                  class="px-6 md:px-8 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all border">
                  Envío Individual
                </button>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            <!-- PANEL IZQUIERDO: ETIQUETAS -->
            <div class="lg:col-span-4 space-y-6">
                <div class="bg-white dark:bg-gray-900 p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-100 dark:border-gray-800">
                    <div v-if="audienceType !== 'individual'">
                        <h3 class="text-xs font-black text-umsa-blue dark:text-blue-400 uppercase tracking-widest mb-6 border-b border-slate-100 dark:border-gray-800 pb-4">Etiquetas Dinámicas</h3>
                        <p class="text-[10px] text-slate-400 dark:text-gray-500 font-medium mb-6">Copia estas etiquetas en tu diseño de Google Slides. Se reemplazarán automáticamente.</p>
                        
                        <div v-if="audienceType === 'estudiantes'" class="space-y-3">
                            <div class="flex items-center justify-between p-3 bg-slate-50 dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 group cursor-copy hover:border-primary-dark dark:hover:border-blue-400 transition-colors">
                                <span class="text-[10px] font-black text-umsa-blue dark:text-blue-300" v-pre>{{ESTUDIANTE_NOMBRE}}</span>
                                <span class="material-symbols-outlined text-slate-300 dark:text-gray-600 group-hover:text-umsa-blue dark:group-hover:text-blue-400 text-sm">content_copy</span>
                            </div>
                            <div class="flex items-center justify-between p-3 bg-slate-50 dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 group cursor-copy hover:border-primary-dark dark:hover:border-blue-400 transition-colors">
                                <span class="text-[10px] font-black text-umsa-blue dark:text-blue-300" v-pre>{{NOTA_FINAL}}</span>
                                <span class="material-symbols-outlined text-slate-300 dark:text-gray-600 group-hover:text-umsa-blue dark:group-hover:text-blue-400 text-sm">content_copy</span>
                            </div>
                            <div class="flex items-center justify-between p-3 bg-slate-50 dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 group cursor-copy hover:border-primary-dark dark:hover:border-blue-400 transition-colors">
                                <span class="text-[10px] font-black text-umsa-blue dark:text-blue-300" v-pre>{{CARGA_HORARIA}}</span>
                                <span class="material-symbols-outlined text-slate-300 dark:text-gray-600 group-hover:text-umsa-blue dark:group-hover:text-blue-400 text-sm">content_copy</span>
                            </div>
                        </div>

                        <div v-else-if="audienceType === 'ponentes'" class="space-y-3">
                            <div class="flex items-center justify-between p-3 bg-slate-50 dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 group cursor-copy hover:border-primary-dark dark:hover:border-blue-400 transition-colors">
                                <span class="text-[10px] font-black text-umsa-blue dark:text-blue-300" v-pre>{{PONENTE_NOMBRE}}</span>
                                <span class="material-symbols-outlined text-slate-300 dark:text-gray-600 group-hover:text-umsa-blue dark:group-hover:text-blue-400 text-sm">content_copy</span>
                            </div>
                            <div class="flex items-center justify-between p-3 bg-slate-50 dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 group cursor-copy hover:border-primary-dark dark:hover:border-blue-400 transition-colors">
                                <span class="text-[10px] font-black text-umsa-blue dark:text-blue-300" v-pre>{{TEMA_IMPARTIDO}}</span>
                                <span class="material-symbols-outlined text-slate-300 dark:text-gray-600 group-hover:text-umsa-blue dark:group-hover:text-blue-400 text-sm">content_copy</span>
                            </div>
                            <div class="flex items-center justify-between p-3 bg-slate-50 dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 group cursor-copy hover:border-primary-dark dark:hover:border-blue-400 transition-colors">
                                <span class="text-[10px] font-black text-umsa-blue dark:text-blue-300" v-pre>{{HORAS_DICTADAS}}</span>
                                <span class="material-symbols-outlined text-slate-300 dark:text-gray-600 group-hover:text-umsa-blue dark:group-hover:text-blue-400 text-sm">content_copy</span>
                            </div>
                        </div>
                    </div>

                    <div v-else>
                        <h3 class="text-xs font-black text-umsa-blue dark:text-blue-400 uppercase tracking-widest mb-6 border-b border-slate-100 dark:border-gray-800 pb-4">Control y Envío</h3>
                        <p class="text-[10px] text-slate-400 dark:text-gray-500 font-medium mb-6">Busca al estudiante por CI o nombre para verificar asistencia/notas y emitir su certificado individual.</p>
                        
                        <div class="relative mb-6">
                            <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 text-[18px]">search</span>
                            <input v-model="searchInd" @input="searchStudent" type="text" placeholder="Ingresar CI o nombre..." class="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 text-umsa-blue dark:text-white pl-10 pr-4 py-3 rounded-xl text-xs font-bold focus:border-umsa-blue dark:focus:border-blue-500 focus:outline-none transition-colors">
                        </div>

                        <div v-if="selectedStudent" class="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900 rounded-xl p-4 space-y-4">
                            <div>
                                <p class="text-[10px] uppercase font-black text-slate-400 dark:text-gray-500">Estudiante Encontrado</p>
                                <p class="text-sm font-bold text-umsa-blue dark:text-white mt-1">{{ selectedStudent.nombre }}</p>
                                <p class="text-xs text-slate-500 dark:text-gray-400">CI: {{ selectedStudent.ci }}</p>
                            </div>
                            
                            <div class="grid grid-cols-2 gap-3 pt-3 border-t border-blue-100 dark:border-blue-900/30">
                                <div>
                                    <p class="text-[10px] uppercase font-black text-slate-400 dark:text-gray-500">Asistencia</p>
                                    <p :class="selectedStudent.asistencia >= 80 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'" class="text-base font-black">{{ selectedStudent.asistencia }}%</p>
                                </div>
                                <div>
                                    <p class="text-[10px] uppercase font-black text-slate-400 dark:text-gray-500">Nota Final</p>
                                    <p class="text-base font-black text-umsa-blue dark:text-blue-400">{{ selectedStudent.nota }}/100</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="mt-8 pt-6 border-t border-slate-200 dark:border-gray-800">
                        <div v-if="statusGeneracion === 'generando'" class="space-y-4">
                            <div class="h-2 w-full bg-slate-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div class="h-full bg-umsa-blue transition-all duration-300" :style="{ width: progress + '%' }"></div>
                            </div>
                            <p class="text-xs text-center font-bold text-slate-500 dark:text-gray-400 uppercase tracking-widest animate-pulse">
                                Procesando PDF... {{progress}}%
                            </p>
                        </div>
                        
                        <div v-else-if="statusGeneracion === 'completado'" class="space-y-3">
                            <button @click="statusGeneracion = 'pendiente'" class="w-full py-3.5 bg-emerald-600 text-white font-bold text-xs uppercase rounded-xl shadow-sm hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 tracking-widest">
                                <span class="material-symbols-outlined text-[16px]">send</span>
                                Enviar por Correo
                            </button>
                            <p class="text-[10px] text-center font-bold text-slate-500 uppercase tracking-widest mt-2">
                                <span class="text-emerald-600 dark:text-emerald-400 font-black">✓</span> PDF listo para enviar
                            </p>
                        </div>

                        <button v-else @click="generarCertificados" :disabled="audienceType === 'individual' && !selectedStudent" :class="(audienceType === 'individual' && !selectedStudent) ? 'bg-slate-200 dark:bg-gray-800 text-slate-400 border-slate-200 dark:border-gray-700 cursor-not-allowed' : 'bg-umsa-blue dark:bg-blue-600 text-white hover:bg-primary-accent border-blue-600'" class="w-full py-3.5 font-bold text-xs uppercase rounded-xl shadow-md transition-all flex items-center justify-center gap-2 tracking-widest border">
                            <span class="material-symbols-outlined text-[16px]">play_circle</span>
                            <span v-if="audienceType === 'individual'">Emitir Certificado (1)</span>
                            <span v-else>Iniciar Generación ({{ audienceType === 'estudiantes' ? '35' : '4' }})</span>
                        </button>
                    </div>
                </div>
            </div>

            <!-- PANEL DERECHO: PREVISUALIZACION -->
            <div class="lg:col-span-8">
                <div class="bg-white dark:bg-gray-900 p-4 md:p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-800 h-full flex flex-col">
                    <div class="flex justify-between items-center mb-4 px-2">
                        <h3 class="text-xs font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest">
                          Previsualización: {{ audienceType === 'estudiantes' ? 'Aprobación' : (audienceType === 'ponentes' ? 'Reconocimiento' : 'Individual') }}
                        </h3>
                        <span class="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-umsa-blue dark:text-blue-400 rounded-lg text-[9px] font-bold border border-blue-100 dark:border-blue-900 uppercase tracking-widest flex items-center gap-1">
                            <span class="material-symbols-outlined text-[10px]">sync</span> Drive Sync
                        </span>
                    </div>
                    
                    <div class="flex-1 workspace-canvas rounded-2xl border-umsa-blue border-dashed border-slate-300 flex items-center justify-center relative overflow-hidden p-4 md:p-8">

                        <!-- EMBED REAL -->
                        <div v-if="embeddedUrl" class="w-full aspect-[1.414/1] bg-white shadow-2xl relative transition-opacity duration-300 rounded-xl overflow-hidden pointer-events-auto border-umsa-blue border-umsa-gold">
                            <iframe :src="embeddedUrl" class="w-full h-full" frameborder="0" allowfullscreen="true" mozallowfullscreen="true" webkitallowfullscreen="true"></iframe>
                            <div class="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 text-[9px] font-black text-green-700 uppercase rounded-full shadow-sm flex items-center gap-1 border border-green-200">
                                <span class="material-symbols-outlined text-[12px]">check_circle</span> Plantilla Vinculada
                            </div>
                        </div>

                        <template v-else>
                            <!-- MOCK ESTUDIANTE -->
                            <div v-if="audienceType === 'estudiantes'" class="w-full aspect-[1.414/1] bg-white shadow-2xl border border-slate-200 flex flex-col items-center justify-center p-6 md:p-12 text-center relative transition-opacity duration-300">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/a/af/Escudo_de_la_Universidad_Mayor_de_San_Andr%C3%A9s.png" class="h-10 md:h-16 absolute top-4 md:top-8 left-4 md:left-8 opacity-20">
                            <h1 class="text-xl md:text-3xl font-black text-umsa-blue uppercase tracking-widest mb-1 md:mb-2 font-serif">Certificado de Aprobación</h1>
                            <p class="text-[8px] md:text-[10px] text-slate-500 uppercase tracking-widest mb-4 md:mb-8">Otorgado por la Universidad Mayor de San Andrés a:</p>
                            
                            <div class="border-b-2 border-primary-dark px-4 md:px-10 pb-1 md:pb-2 mb-4 md:mb-6">
                                <h2 class="text-xl md:text-3xl font-black text-umsa-gold italic">Pérez Nogales Brenda</h2>
                            </div>
                            
                            <p class="text-[8px] md:text-[10px] text-slate-600 max-w-md mx-auto leading-relaxed">
                                Por haber aprobado satisfactoriamente el programa <span class="font-bold text-umsa-blue">{{ selectedCourse || 'Especialidad en Biofertilizantes' }}</span> con una nota de <span class="font-bold text-umsa-blue">85/100</span> y carga horaria de <span class="font-bold text-umsa-blue">64 horas</span>.
                            </p>
                        </div>

                        <!-- MOCK PONENTE -->
                        <div v-else class="w-full aspect-[1.414/1] bg-umsa-blue text-white shadow-2xl border-umsa-blue border-umsa-gold flex flex-col items-center justify-center p-6 md:p-12 text-center relative transition-opacity duration-300">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/a/af/Escudo_de_la_Universidad_Mayor_de_San_Andr%C3%A9s.png" class="h-10 md:h-16 absolute top-4 md:top-8 left-4 md:left-8 opacity-30 brightness-200">
                            <h1 class="text-xl md:text-3xl font-black text-umsa-gold uppercase tracking-widest mb-1 md:mb-2 font-serif">Certificado de Reconocimiento</h1>
                            <p class="text-[8px] md:text-[10px] text-slate-300 uppercase tracking-widest mb-4 md:mb-8">Otorgado por la Universidad Mayor de San Andrés a:</p>
                            
                            <div class="border-b-2 border-umsa-gold px-4 md:px-10 pb-1 md:pb-2 mb-4 md:mb-6">
                                <h2 class="text-xl md:text-3xl font-black text-white italic">Dr. Juan Carlos Mamani</h2>
                            </div>
                            
                            <p class="text-[8px] md:text-[10px] text-slate-300 max-w-md mx-auto leading-relaxed">
                                Por su destacada participación como ponente impartiendo el módulo <span class="font-bold text-white">"Microbiología Agrícola"</span> con una carga de <span class="font-bold text-white">12 horas académicas</span>.
                            </p>
                        </div>
                      </template>
                    </div>
                </div>
            </div>
        </div>

        <!-- TABLA COLA DE EMISIÓN -->
        <div class="bg-white dark:bg-gray-900 rounded-[2rem] shadow-sm border border-slate-100 dark:border-gray-800 overflow-hidden">
            <div class="p-6 bg-slate-50 dark:bg-gray-800/50 border-b border-slate-100 dark:border-gray-800 flex justify-between items-center">
                <h3 class="text-xs font-black text-umsa-blue dark:text-blue-400 uppercase tracking-widest">Cola de Emisión: {{ audienceType === 'estudiantes' ? 'Estudiantes' : (audienceType === 'ponentes' ? 'Ponentes' : 'Envío Directo') }}</h3>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-left whitespace-nowrap">
                  <thead class="bg-umsa-blue text-white text-[9px] font-black uppercase tracking-widest">
                      <tr>
                        <th class="px-6 md:px-8 py-4">{{ audienceType === 'ponentes' ? 'Ponente' : 'Estudiante' }}</th>
                        <th class="px-6 md:px-8 py-4 text-center">Estado Documento</th>
                        <th class="px-6 md:px-8 py-4 text-center">Acción</th>
                      </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100 dark:divide-gray-800 text-xs">
                      <tr v-if="audienceType !== 'individual' || selectedStudent" class="hover:bg-slate-50 dark:hover:bg-gray-800/50 transition-colors">
                          <td class="px-6 md:px-8 py-4 font-bold text-umsa-blue dark:text-white uppercase">
                            {{ audienceType === 'estudiantes' ? 'Pérez Nogales Brenda' : (audienceType === 'ponentes' ? 'Dr. Juan Carlos Mamani' : selectedStudent?.nombre) }}
                          </td>
                          <td class="px-6 md:px-8 py-4 text-center">
                            <span v-if="statusGeneracion === 'completado'" class="bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 px-3 py-1 rounded-full font-black text-[9px] uppercase">Emitido</span>
                            <span v-else class="bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-500 border border-amber-200 dark:border-amber-500/20 px-3 py-1 rounded-full font-black text-[9px] uppercase">Pendiente</span>
                          </td>
                          <td class="px-6 md:px-8 py-4 flex justify-center">
                              <button class="text-blue-500 dark:text-blue-400 font-bold text-[10px] uppercase hover:underline">Previsualizar PDF</button>
                          </td>
                      </tr>
                      <tr v-if="audienceType === 'individual' && !selectedStudent">
                          <td colspan="3" class="px-6 py-12 text-center text-slate-400 dark:text-gray-500 font-bold text-xs uppercase tracking-widest">
                            Busca a un estudiante para ver el registro.
                          </td>
                      </tr>
                  </tbody>
              </table>
            </div>
        </div>

    </div>

    <!-- MODAL VINCULAR SLIDES -->
    <div v-if="isModalOpen" class="fixed inset-0 bg-umsa-blue/80 dark:bg-gray-950/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
        <div class="bg-white dark:bg-gray-900 rounded-[2rem] w-full max-w-lg p-8 shadow-2xl animate-in zoom-in-95 duration-300 border dark:border-gray-800">
            <div class="flex justify-between items-center mb-6">
                <h3 class="text-2xl font-black text-umsa-blue dark:text-blue-400 uppercase tracking-tighter italic flex items-center gap-2">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Google_Drive_icon_%282020%29.svg/512px-Google_Drive_icon_%282020%29.svg.png" class="h-6">
                  Vincular Plantilla
                </h3>
                <button @click="isModalOpen = false" class="text-slate-400 dark:text-gray-500 hover:text-red-500 transition-colors">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </div>
            
            <div class="space-y-4">
                <p class="text-xs text-slate-500 dark:text-gray-400">Pega aquí el enlace de la presentación de Google Slides donde tienes armada la gráfica de tu certificado. <br>Recuerda que nosotros reemplazaremos las variables (Etiquetas Dinámicas) por ti.</p>
                <div>
                    <label class="block text-[10px] font-black text-slate-500 dark:text-gray-500 uppercase tracking-widest mb-2">URL Pública de Google Slides</label>
                    <input v-model="googleSlidesUrl" type="url" placeholder="Ej: https://docs.google.com/presentation/d/.../edit" class="w-full border-umsa-blue dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:border-umsa-blue dark:focus:border-blue-500 focus:ring-0 transition-colors bg-slate-50 dark:bg-gray-950 text-umsa-blue dark:text-white font-bold">
                </div>
            </div>
            
            <div class="mt-8 flex gap-3">
                <button @click="isModalOpen = false" class="flex-1 px-4 py-3 border-umsa-blue border-slate-200 dark:border-gray-700 text-slate-500 dark:text-gray-400 font-black text-[10px] uppercase rounded-xl hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors tracking-widest border">Cancelar</button>
                <button @click="linkSlides" :disabled="!googleSlidesUrl" :class="googleSlidesUrl ? 'bg-umsa-blue dark:bg-blue-600 hover:bg-primary-accent text-white shadow-lg' : 'bg-slate-200 dark:bg-gray-800 text-slate-400 dark:text-gray-600 cursor-not-allowed'" class="flex-[2] px-4 py-3 font-black text-[10px] uppercase rounded-xl transition-all tracking-widest block text-center">
                    <span class="flex items-center justify-center gap-2"><span class="material-symbols-outlined text-[16px]">link</span> Vincular Presentación</span>
                </button>
            </div>
        </div>
    </div>
  </div>
</template>

<style scoped>
.workspace-canvas { 
  background-image: radial-gradient(#cbd5e1 1px, transparent 1px); 
  background-size: 20px 20px; 
}
</style>
