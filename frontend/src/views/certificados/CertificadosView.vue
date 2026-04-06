<script setup lang="ts">
import { ref } from 'vue';

const currentView = ref('lista'); // 'lista' o 'workspace'
const selectedCourse = ref('');
const audienceType = ref('estudiantes'); // 'estudiantes' o 'ponentes'

const statusGeneracion = ref('pendiente'); // pendiente, generando, completado
const progress = ref(0);

const isModalOpen = ref(false);
const googleSlidesUrl = ref('');
const embeddedUrl = ref('');

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

const toggleAudience = (type: 'estudiantes' | 'ponentes') => {
    audienceType.value = type;
    statusGeneracion.value = 'pendiente';
    progress.value = 0;
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
      <div class="flex items-end justify-between border-b border-slate-200 pb-6">
          <div>
              <h2 class="text-3xl md:text-4xl font-black text-[#012248] tracking-tighter uppercase italic">Emisión de Certificados</h2>
              <p class="text-slate-400 font-medium mt-2">Selecciona una actividad para vincular su plantilla y generar los diplomas.</p>
          </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-4">
          <div @click="openWorkspace('Especialidad en Biofertilizantes')" class="course-card bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm cursor-pointer group flex flex-col hover:-translate-y-1 hover:border-[#BC9C31] hover:shadow-[0_15px_30px_rgba(1,34,72,0.08)] transition-all">
              <div class="flex justify-between items-center mb-6">
                  <span class="bg-[#012248] text-white text-[9px] font-black px-3 py-1 rounded-full uppercase">Diplomado</span>
                  <span class="bg-amber-100 text-amber-700 text-[9px] font-black px-3 py-1 rounded-full uppercase flex items-center gap-1">
                      <span class="material-symbols-outlined text-[10px]">warning</span> Sin Plantilla
                  </span>
              </div>
              <h3 class="text-xl font-black text-[#012248] leading-tight mb-2 uppercase">Especialidad en Biofertilizantes</h3>
              <p class="text-[10px] font-bold text-slate-400 uppercase mb-8">Aprobados: 35 Alumnos | 4 Ponentes</p>
              <div class="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between text-[10px] font-black text-[#BC9C31] uppercase">
                  <span>Gestión 2026</span>
                  <span class="group-hover:translate-x-1 transition-transform">Abrir Workspace &gt;</span>
              </div>
          </div>
          <!-- Puedes iterar mas tarjetas aquí con v-for -->
      </div>
    </div>

    <!-- VISTA WORKSPACE -->
    <div v-else-if="currentView === 'workspace'" class="space-y-8 animate-in slide-in-from-right-8 duration-500">
        
        <div class="bg-[#012248] p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] text-white shadow-xl border-b-8 border-[#BC9C31] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h2 class="text-xl md:text-2xl font-black italic uppercase tracking-tighter flex items-center gap-2 md:gap-3">
                    <span class="material-symbols-outlined text-[#BC9C31] text-2xl md:text-3xl">workspace_premium</span>
                    Workspace de Certificación
                </h2>
                <p class="text-[#BC9C31] text-xs font-black uppercase mt-2 tracking-[0.2em]">{{ selectedCourse }}</p>
            </div>
            <div class="flex flex-wrap gap-2 md:gap-4 w-full md:w-auto">
                <button @click="closeWorkspace()" class="flex-1 md:flex-none justify-center bg-white/10 border border-white/20 text-white px-4 md:px-6 py-2.5 rounded-xl text-[10px] font-black hover:bg-white/20 transition-all uppercase flex items-center gap-1">
                  <span class="material-symbols-outlined text-[14px]">arrow_back</span> Volver
                </button>
                <button @click="isModalOpen = true" class="flex-1 md:flex-none justify-center bg-white text-slate-700 px-4 md:px-6 py-2.5 rounded-xl text-[10px] font-black shadow-lg hover:bg-slate-50 transition-all flex items-center gap-2 uppercase tracking-widest border border-slate-200">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Google_Drive_icon_%282020%29.svg/512px-Google_Drive_icon_%282020%29.svg.png" class="h-4">
                    Vincular Slides
                </button>
            </div>
        </div>

        <div class="flex justify-center -mb-2 relative z-10 w-full overflow-x-auto pb-2">
            <div class="bg-white p-1.5 rounded-2xl shadow-md border border-slate-100 flex gap-2 min-w-max">
                <button 
                  @click="toggleAudience('estudiantes')" 
                  :class="audienceType === 'estudiantes' ? 'bg-[#012248] text-white' : 'bg-transparent text-slate-400 hover:text-[#012248]'"
                  class="px-6 md:px-8 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                  Para Estudiantes
                </button>
                <button 
                  @click="toggleAudience('ponentes')" 
                  :class="audienceType === 'ponentes' ? 'bg-[#012248] text-white' : 'bg-transparent text-slate-400 hover:text-[#012248]'"
                  class="px-6 md:px-8 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                  Para Ponentes
                </button>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            <!-- PANEL IZQUIERDO: ETIQUETAS -->
            <div class="lg:col-span-4 space-y-6">
                <div class="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-100">
                    <h3 class="text-xs font-black text-[#012248] uppercase tracking-widest mb-6 border-b border-slate-100 pb-4">Etiquetas Dinámicas</h3>
                    <p class="text-[10px] text-slate-400 font-medium mb-6">Copia estas etiquetas en tu diseño de Google Slides. Se reemplazarán automáticamente.</p>
                    
                    <div v-if="audienceType === 'estudiantes'" class="space-y-3">
                        <div class="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 group cursor-copy hover:border-[#012248] transition-colors">
                            <span class="text-[10px] font-black text-[#012248]" v-pre>{{ESTUDIANTE_NOMBRE}}</span>
                            <span class="material-symbols-outlined text-slate-300 group-hover:text-[#012248] text-sm">content_copy</span>
                        </div>
                        <div class="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 group cursor-copy hover:border-[#012248] transition-colors">
                            <span class="text-[10px] font-black text-[#012248]" v-pre>{{NOTA_FINAL}}</span>
                            <span class="material-symbols-outlined text-slate-300 group-hover:text-[#012248] text-sm">content_copy</span>
                        </div>
                        <div class="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 group cursor-copy hover:border-[#012248] transition-colors">
                            <span class="text-[10px] font-black text-[#012248]" v-pre>{{CARGA_HORARIA}}</span>
                            <span class="material-symbols-outlined text-slate-300 group-hover:text-[#012248] text-sm">content_copy</span>
                        </div>
                    </div>

                    <div v-else class="space-y-3">
                        <div class="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 group cursor-copy hover:border-[#BC9C31] transition-colors">
                            <span class="text-[10px] font-black text-[#012248]" v-pre>{{PONENTE_NOMBRE}}</span>
                            <span class="material-symbols-outlined text-slate-300 group-hover:text-[#BC9C31] text-sm">content_copy</span>
                        </div>
                        <div class="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 group cursor-copy hover:border-[#BC9C31] transition-colors">
                            <span class="text-[10px] font-black text-[#012248]" v-pre>{{TEMA_IMPARTIDO}}</span>
                            <span class="material-symbols-outlined text-slate-300 group-hover:text-[#BC9C31] text-sm">content_copy</span>
                        </div>
                        <div class="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 group cursor-copy hover:border-[#BC9C31] transition-colors">
                            <span class="text-[10px] font-black text-[#012248]" v-pre>{{HORAS_DICTADAS}}</span>
                            <span class="material-symbols-outlined text-slate-300 group-hover:text-[#BC9C31] text-sm">content_copy</span>
                        </div>
                    </div>

                    <div class="mt-8 pt-6 border-t border-slate-100">
                        <div v-if="statusGeneracion === 'generando'" class="space-y-4">
                            <div class="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div class="h-full bg-[#BC9C31] transition-all duration-300" :style="{ width: progress + '%' }"></div>
                            </div>
                            <p class="text-[10px] text-center font-black text-[#012248] uppercase tracking-widest animate-pulse">
                                Aplicando variables... {{progress}}%
                            </p>
                        </div>
                        
                        <div v-else-if="statusGeneracion === 'completado'" class="space-y-3">
                            <button @click="sendToAll" class="w-full py-4 bg-green-600 text-white font-black text-[10px] uppercase rounded-xl shadow-lg shadow-green-500/20 hover:bg-green-700 transition-all flex items-center justify-center gap-2 tracking-widest">
                                <span class="material-symbols-outlined text-sm">send</span> 
                                Enviar Todos por Correo
                            </button>
                            <p class="text-[9px] text-center font-black text-slate-400 uppercase tracking-widest">
                                <span class="text-green-600">✓</span> {{ audienceType === 'estudiantes' ? '35' : '4' }} PDFs listos
                            </p>
                        </div>

                        <button v-else @click="generarCertificados" class="w-full py-4 bg-[#012248] text-white font-black text-[10px] uppercase rounded-xl shadow-lg shadow-primary-dark/20 hover:bg-[#BC9C31] transition-all flex items-center justify-center gap-2 tracking-widest">
                            <span class="material-symbols-outlined text-sm">rocket_launch</span>
                            Generar ({{ audienceType === 'estudiantes' ? '35 Estudiantes' : '4 Ponentes' }})
                        </button>
                    </div>
                </div>
            </div>

            <!-- PANEL DERECHO: PREVISUALIZACION -->
            <div class="lg:col-span-8">
                <div class="bg-white p-4 md:p-6 rounded-[2rem] shadow-sm border border-slate-100 h-full flex flex-col">
                    <div class="flex justify-between items-center mb-4 px-2">
                        <h3 class="text-xs font-black text-slate-400 uppercase tracking-widest">
                          Previsualización: {{ audienceType === 'estudiantes' ? 'Aprobación' : 'Reconocimiento' }}
                        </h3>
                        <span class="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                            <span class="material-symbols-outlined text-[10px]">sync</span> Drive Sync
                        </span>
                    </div>
                    
                    <div class="flex-1 workspace-canvas rounded-2xl border-2 border-dashed border-slate-300 flex items-center justify-center relative overflow-hidden p-4 md:p-8">

                        <!-- EMBED REAL -->
                        <div v-if="embeddedUrl" class="w-full aspect-[1.414/1] bg-white shadow-2xl relative transition-opacity duration-300 rounded-xl overflow-hidden pointer-events-auto border-2 border-[#BC9C31]">
                            <iframe :src="embeddedUrl" class="w-full h-full" frameborder="0" allowfullscreen="true" mozallowfullscreen="true" webkitallowfullscreen="true"></iframe>
                            <div class="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 text-[9px] font-black text-green-700 uppercase rounded-full shadow-sm flex items-center gap-1 border border-green-200">
                                <span class="material-symbols-outlined text-[12px]">check_circle</span> Plantilla Vinculada
                            </div>
                        </div>

                        <template v-else>
                            <!-- MOCK ESTUDIANTE -->
                            <div v-if="audienceType === 'estudiantes'" class="w-full aspect-[1.414/1] bg-white shadow-2xl border border-slate-200 flex flex-col items-center justify-center p-6 md:p-12 text-center relative transition-opacity duration-300">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/a/af/Escudo_de_la_Universidad_Mayor_de_San_Andr%C3%A9s.png" class="h-10 md:h-16 absolute top-4 md:top-8 left-4 md:left-8 opacity-20">
                            <h1 class="text-xl md:text-3xl font-black text-[#012248] uppercase tracking-widest mb-1 md:mb-2 font-serif">Certificado de Aprobación</h1>
                            <p class="text-[8px] md:text-[10px] text-slate-500 uppercase tracking-widest mb-4 md:mb-8">Otorgado por la Universidad Mayor de San Andrés a:</p>
                            
                            <div class="border-b-2 border-[#012248] px-4 md:px-10 pb-1 md:pb-2 mb-4 md:mb-6">
                                <h2 class="text-xl md:text-3xl font-black text-[#BC9C31] italic">Pérez Nogales Brenda</h2>
                            </div>
                            
                            <p class="text-[8px] md:text-[10px] text-slate-600 max-w-md mx-auto leading-relaxed">
                                Por haber aprobado satisfactoriamente el programa <span class="font-bold text-[#012248]">{{ selectedCourse || 'Especialidad en Biofertilizantes' }}</span> con una nota de <span class="font-bold text-[#012248]">85/100</span> y carga horaria de <span class="font-bold text-[#012248]">64 horas</span>.
                            </p>
                        </div>

                        <!-- MOCK PONENTE -->
                        <div v-else class="w-full aspect-[1.414/1] bg-[#012248] text-white shadow-2xl border-4 border-[#BC9C31] flex flex-col items-center justify-center p-6 md:p-12 text-center relative transition-opacity duration-300">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/a/af/Escudo_de_la_Universidad_Mayor_de_San_Andr%C3%A9s.png" class="h-10 md:h-16 absolute top-4 md:top-8 left-4 md:left-8 opacity-30 brightness-200">
                            <h1 class="text-xl md:text-3xl font-black text-[#BC9C31] uppercase tracking-widest mb-1 md:mb-2 font-serif">Certificado de Reconocimiento</h1>
                            <p class="text-[8px] md:text-[10px] text-slate-300 uppercase tracking-widest mb-4 md:mb-8">Otorgado por la Universidad Mayor de San Andrés a:</p>
                            
                            <div class="border-b-2 border-[#BC9C31] px-4 md:px-10 pb-1 md:pb-2 mb-4 md:mb-6">
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
        <div class="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
            <div class="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                <h3 class="text-xs font-black text-[#012248] uppercase tracking-widest">Cola de Emisión: {{ audienceType === 'estudiantes' ? 'Estudiantes' : 'Ponentes' }}</h3>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-left whitespace-nowrap">
                  <thead class="bg-[#012248] text-white text-[9px] font-black uppercase tracking-widest">
                      <tr>
                        <th class="px-6 md:px-8 py-4">{{ audienceType === 'estudiantes' ? 'Estudiante' : 'Ponente' }}</th>
                        <th class="px-6 md:px-8 py-4 text-center">Estado Documento</th>
                        <th class="px-6 md:px-8 py-4 text-center">Acción</th>
                      </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100 text-xs">
                      <tr class="hover:bg-slate-50 transition-colors">
                          <td class="px-6 md:px-8 py-4 font-bold text-[#012248] uppercase">
                            {{ audienceType === 'estudiantes' ? 'Pérez Nogales Brenda' : 'Dr. Juan Carlos Mamani' }}
                          </td>
                          <td class="px-6 md:px-8 py-4 text-center">
                            <span class="bg-amber-100 text-amber-700 px-3 py-1 rounded-full font-black text-[9px] uppercase">Pendiente</span>
                          </td>
                          <td class="px-6 md:px-8 py-4 flex justify-center">
                              <button class="text-blue-500 font-bold text-[10px] uppercase hover:underline">Previsualizar PDF</button>
                          </td>
                      </tr>
                      <!-- Puedes llenar con más filas si es necesario -->     
                  </tbody>
              </table>
            </div>
        </div>

    </div>

    <!-- MODAL VINCULAR SLIDES -->
    <div v-if="isModalOpen" class="fixed inset-0 bg-[#012248]/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
        <div class="bg-white rounded-[2rem] w-full max-w-lg p-8 shadow-2xl animate-in zoom-in-95 duration-300">
            <div class="flex justify-between items-center mb-6">
                <h3 class="text-2xl font-black text-[#012248] uppercase tracking-tighter italic flex items-center gap-2">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Google_Drive_icon_%282020%29.svg/512px-Google_Drive_icon_%282020%29.svg.png" class="h-6">
                  Vincular Plantilla
                </h3>
                <button @click="isModalOpen = false" class="text-slate-400 hover:text-red-500 transition-colors">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </div>
            
            <div class="space-y-4">
                <p class="text-xs text-slate-500">Pega aquí el enlace de la presentación de Google Slides donde tienes armada la gráfica de tu certificado. <br>Recuerda que nosotros reemplazaremos las variables (Etiquetas Dinámicas) por ti.</p>
                <div>
                    <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">URL Pública de Google Slides</label>
                    <input v-model="googleSlidesUrl" type="url" placeholder="Ej: https://docs.google.com/presentation/d/.../edit" class="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-[#BC9C31] focus:ring-0 transition-colors bg-slate-50 text-[#012248] font-bold">
                </div>
            </div>
            
            <div class="mt-8 flex gap-3">
                <button @click="isModalOpen = false" class="flex-1 px-4 py-3 border-2 border-slate-200 text-slate-500 font-black text-[10px] uppercase rounded-xl hover:bg-slate-50 transition-colors tracking-widest">Cancelar</button>
                <button @click="linkSlides" :disabled="!googleSlidesUrl" :class="googleSlidesUrl ? 'bg-[#012248] hover:bg-[#BC9C31] text-white shadow-lg' : 'bg-slate-200 text-slate-400 cursor-not-allowed'" class="flex-[2] px-4 py-3 font-black text-[10px] uppercase rounded-xl transition-all tracking-widest">
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
