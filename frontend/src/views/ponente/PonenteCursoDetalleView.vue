<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const activeTab = ref('resumen');
const qrCodeUrl = ref('https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=example-attendance');

const curso = ref({
  id: 1,
  evento: 'Programa de Especialidad en Biofertilizantes',
  version: 'V Edición - Gestión 2026',
  fechas: '10/05/2026 - 15/09/2026',
  estudiantesInscritos: 45,
  estado: 'En Progreso',
  modalidad: 'Virtual',
  descripcion: 'Desarrollo de conocimientos teórico-prácticos para la utilización de biofertilizantes en la agricultura moderna, con un enfoque en la sostenibilidad medioambiental y la integración de marcos internacionales de investigación.'
});

const estudiantes = ref([
  { id: 1, nombre: 'Ana Gómez', correo: 'ana@umsa.bo', asistencia: '85%', estado: 'Regular' },
  { id: 2, nombre: 'Luis Martínez', correo: 'luis@umsa.bo', asistencia: '100%', estado: 'Excelente' },
  { id: 3, nombre: 'María Vargas', correo: 'maria@umsa.bo', asistencia: '60%', estado: 'Riesgo' }
]);

const navigateToCalificaciones = () => {
    router.push({ name: 'ponente-calificacion' });
};
</script>

<template>
  <div class="animate-in fade-in duration-500 max-w-7xl mx-auto space-y-8">
    <!-- Header Retorno -->
    <button @click="router.back()" class="flex items-center gap-2 text-slate-500 hover:text-umsa-blue transition-colors font-black text-[11px] uppercase tracking-widest">
      <span class="material-symbols-outlined text-[16px]">arrow_back</span>
      Volver a mis actividades
    </button>

    <!-- Header Principal (Rediseñado con la paleta de UMSA) -->
    <div class="bg-gradient-to-br from-umsa-blue via-[#005a96] to-[#004270] rounded-[2rem] p-8 md:p-12 text-white relative overflow-hidden shadow-2xl shadow-umsa-blue/20 flex flex-col md:flex-row justify-between items-center gap-8 border border-white/10">
      <!-- Decoración abstracta -->
      <div class="absolute top-0 right-0 w-96 h-96 bg-umsa-gold/20 rounded-full blur-3xl -mr-32 -mt-32 mix-blend-screen pointer-events-none"></div>
      <div class="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-2xl -ml-20 -mb-20 mix-blend-screen pointer-events-none"></div>

      <div class="relative z-10 w-full md:w-2/3">
        <div class="flex items-center gap-3 mb-6 flex-wrap">
          <span class="px-4 py-1.5 bg-umsa-gold text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-umsa-gold/30">
            {{ curso.version }}
          </span>
          <span class="px-4 py-1.5 bg-white/10 backdrop-blur-md border border-white/20 text-white text-[10px] font-black uppercase tracking-widest rounded-full">
            <span class="mr-1 inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> {{ curso.estado }}
          </span>
           <span class="px-4 py-1.5 bg-white/10 backdrop-blur-md border border-white/20 text-white text-[10px] font-black uppercase tracking-widest rounded-full">
            {{ curso.modalidad }}
          </span>
        </div>
        
        <h1 class="text-3xl md:text-5xl font-black leading-tight uppercase italic mb-4 drop-shadow-md tracking-tight">
          {{ curso.evento }}
        </h1>
        <p class="text-blue-50 text-sm md:text-base leading-relaxed max-w-3xl border-l-4 border-umsa-gold pl-4 font-medium opacity-90">
          {{ curso.descripcion }}
        </p>
      </div>

      <!-- Acciones Rápidas -->
      <div class="relative z-10 flex flex-col gap-3 w-full md:w-auto min-w-[220px]">
        <button @click="activeTab = 'qr'" class="group bg-white text-umsa-blue hover:bg-slate-50 font-black text-xs uppercase tracking-widest px-6 py-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1">
            <span class="material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform">qr_code_scanner</span>
            Generar QR
        </button>
        <button @click="navigateToCalificaciones()" class="group bg-umsa-gold hover:bg-yellow-600 text-white font-black text-xs uppercase tracking-widest px-6 py-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl hover:shadow-2xl shadow-umsa-gold/20 hover:-translate-y-1">
            <span class="material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform">grading</span>
            Gestionar Notas
        </button>
      </div>
    </div>

    <!-- Pestañas Modernas -->
    <div class="flex gap-2 overflow-x-auto no-scrollbar p-1 bg-slate-100 dark:bg-gray-900 rounded-2xl border border-slate-200 dark:border-gray-800">
      <button @click="activeTab = 'resumen'" :class="[activeTab === 'resumen' ? 'bg-white dark:bg-gray-800 text-umsa-blue dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700']" class="px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-2 flex-shrink-0">
        <span class="material-symbols-outlined text-[18px]" :class="{'text-umsa-gold': activeTab === 'resumen'}">dashboard</span>
        Panel Central
      </button>
      <button @click="activeTab = 'estudiantes'" :class="[activeTab === 'estudiantes' ? 'bg-white dark:bg-gray-800 text-umsa-blue dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700']" class="px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-2 flex-shrink-0">
        <span class="material-symbols-outlined text-[18px]" :class="{'text-umsa-gold': activeTab === 'estudiantes'}">groups</span>
        Nómina ({{ curso.estudiantesInscritos }})
      </button>
      <button @click="activeTab = 'qr'" :class="[activeTab === 'qr' ? 'bg-white dark:bg-gray-800 text-umsa-blue dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700']" class="px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-2 flex-shrink-0 relative">
        <span class="material-symbols-outlined text-[18px]" :class="{'text-umsa-gold': activeTab === 'qr'}">qr_code_2</span>
        Control de Asistencia
        <span v-if="activeTab !== 'qr'" class="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
      </button>
      <button @click="activeTab = 'certificados'" :class="[activeTab === 'certificados' ? 'bg-white dark:bg-gray-800 text-umsa-blue dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700']" class="px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-2 flex-shrink-0">
        <span class="material-symbols-outlined text-[18px]" :class="{'text-umsa-gold': activeTab === 'certificados'}">workspace_premium</span>
        Certificados
      </button>
    </div>

    <!-- Contenido: Panel Central -->
    <div v-if="activeTab === 'resumen'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
       <!-- Stats Cards Rediseñadas -->
       <div class="col-span-1 md:col-span-2 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-[2rem] p-8 shadow-sm flex items-center justify-between relative overflow-hidden group hover:border-umsa-blue/30 transition-all">
           <div class="relative z-10">
               <p class="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                 <span class="material-symbols-outlined text-[16px] text-umsa-blue">calendar_month</span>
                 Calendario Académico
               </p>
               <h4 class="text-xl md:text-2xl font-black text-slate-800 dark:text-white">{{ curso.fechas }}</h4>
           </div>
           <div class="w-16 h-16 bg-blue-50 dark:bg-gray-800 rounded-full flex items-center justify-center text-umsa-blue group-hover:scale-110 transition-transform">
               <span class="material-symbols-outlined text-3xl">event_upcoming</span>
           </div>
       </div>

       <div class="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-[2rem] p-8 shadow-sm flex flex-col justify-center relative overflow-hidden group hover:border-umsa-gold/50 transition-all">
           <p class="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-3 flex items-center gap-2">
             <span class="material-symbols-outlined text-[16px] text-umsa-gold">school</span>
             Participantes
           </p>
           <div class="flex items-end gap-2">
             <h4 class="text-4xl font-black text-slate-800 dark:text-white leading-none">{{ curso.estudiantesInscritos }}</h4>
             <span class="text-xs font-bold text-emerald-500 mb-1">+Aprobados</span>
           </div>
       </div>

        <!-- Banner Pequeño -->
       <div class="bg-gradient-to-br from-slate-800 to-slate-900 rounded-[2rem] p-8 shadow-lg flex flex-col justify-between relative overflow-hidden text-white group cursor-pointer" @click="activeTab='qr'">
          <div class="absolute right-0 bottom-0 opacity-10 transform translate-x-4 translate-y-4 group-hover:scale-125 transition-transform duration-700">
            <span class="material-symbols-outlined text-[120px]">qr_code_scanner</span>
          </div>
          <div>
            <p class="text-[10px] font-black uppercase tracking-widest text-umsa-gold mb-1">Acción Rápida</p>
            <h4 class="text-lg font-black leading-tight">Iniciar Sesión de Hoy</h4>
          </div>
          <div class="mt-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-300">
            Lanzar QR <span class="material-symbols-outlined text-sm">arrow_forward</span>
          </div>
       </div>
    </div>

    <!-- Contenido: Nómina Estudiantes -->
    <div v-if="activeTab === 'estudiantes'" class="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-[2rem] shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-500 p-2">
        <div class="p-6 flex justify-between items-center bg-slate-50/50 dark:bg-gray-900 rounded-t-[1.5rem] border-b border-slate-100 dark:border-gray-800">
          <h3 class="font-black text-lg text-slate-800 dark:text-white uppercase tracking-tight flex items-center gap-2">
            <span class="material-symbols-outlined text-umsa-blue">recent_patient</span> Directorio del Curso
          </h3>
          <div class="relative">
            <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
            <input type="text" placeholder="Buscar estudiante..." class="pl-9 pr-4 py-2 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-umsa-blue/50 w-64">
          </div>
        </div>

        <table class="w-full text-left">
            <thead class="bg-white dark:bg-black/20">
                <tr>
                    <th class="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-gray-800">Estudiante</th>
                    <th class="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-gray-800">Contacto Institucional</th>
                    <th class="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center border-b border-slate-100 dark:border-gray-800">Asistencia (%)</th>
                    <th class="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right border-b border-slate-100 dark:border-gray-800">Rendimiento</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="estudiante in estudiantes" :key="estudiante.id" class="hover:bg-slate-50 dark:hover:bg-gray-800/50 transition-colors group">
                    <td class="px-8 py-5 border-b border-slate-50 dark:border-gray-800/50">
                        <div class="flex items-center gap-4">
                           <div class="w-10 h-10 rounded-xl bg-blue-50 dark:bg-gray-800 border border-blue-100 dark:border-gray-700 flex items-center justify-center text-sm font-black text-umsa-blue">{{ estudiante.nombre.charAt(0) }}</div>
                           <span class="text-sm font-bold text-slate-800 dark:text-white">{{ estudiante.nombre }}</span>
                        </div>
                    </td>
                    <td class="px-8 py-5 text-sm font-medium text-slate-500 border-b border-slate-50 dark:border-gray-800/50 flex items-center gap-2">
                        <span class="material-symbols-outlined text-[16px] text-slate-300">mail</span> {{ estudiante.correo }}
                    </td>
                    <td class="px-8 py-5 text-center border-b border-slate-50 dark:border-gray-800/50">
                        <div class="inline-flex items-center justify-center w-16 px-2 py-1 bg-slate-100 dark:bg-gray-800 text-slate-700 dark:text-gray-300 text-xs font-black rounded-lg">
                           {{ estudiante.asistencia }}
                        </div>
                    </td>
                    <td class="px-8 py-5 text-right border-b border-slate-50 dark:border-gray-800/50">
                        <span :class="{
                          'bg-emerald-100 text-emerald-700 border-emerald-200': estudiante.estado === 'Excelente',
                          'bg-blue-100 text-blue-700 border-blue-200': estudiante.estado === 'Regular',
                          'bg-rose-100 text-rose-700 border-rose-200': estudiante.estado === 'Riesgo'
                        }" class="inline-block px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg border">
                            {{ estudiante.estado }}
                        </span>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>

    <!-- Contenido: Control de Asistencia QR -->
    <div v-if="activeTab === 'qr'" class="animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div class="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-[2rem] p-12 shadow-xl shadow-slate-200/50 dark:shadow-none flex flex-col md:flex-row items-center gap-12 relative overflow-hidden">
            
            <!-- Decorativos -->
            <div class="absolute -right-20 -top-20 w-64 h-64 bg-umsa-blue/5 rounded-full blur-3xl"></div>
            <div class="absolute -left-20 -bottom-20 w-64 h-64 bg-umsa-gold/5 rounded-full blur-3xl"></div>

            <div class="flex-1 max-w-lg relative z-10 relative">
                <div class="inline-flex items-center gap-2 px-3 py-1.5 bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 font-bold text-[10px] uppercase tracking-widest rounded-lg mb-6 border border-rose-200 dark:border-rose-800/50">
                    <span class="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span> Emisión en Vivo
                </div>
                <h3 class="text-3xl md:text-4xl font-black text-slate-800 dark:text-white uppercase tracking-tight leading-tight mb-4">
                    Registro Dinámico de Asistencia
                </h3>
                <p class="text-slate-500 text-sm md:text-base leading-relaxed mb-8">
                    La sesión actual está abierta. Proyecta este código QR para que los estudiantes registren su presencia escaneándolo desde la App Institucional de la UMSA.
                </p>
                <div class="flex flex-wrap gap-4">
                    <button class="bg-umsa-blue text-white px-8 py-4 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-umsa-blue/30 flex items-center gap-2">
                        <span class="material-symbols-outlined text-[18px]">fullscreen</span> Pantalla Completa
                    </button>
                    <button class="bg-white dark:bg-gray-800 text-rose-600 border border-rose-200 dark:border-rose-900/50 px-8 py-4 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all flex items-center gap-2">
                        <span class="material-symbols-outlined text-[18px]">stop_circle</span> Finalizar Día
                    </button>
                </div>
            </div>

            <div class="relative z-10">
                <div class="bg-white p-6 rounded-[2rem] shadow-2xl shadow-slate-300/50 dark:shadow-black/50 border-[8px] border-slate-50 dark:border-gray-800 transform rotate-3 hover:rotate-0 transition-transform duration-500">
                    <div class="absolute inset-0 border-2 border-umsa-gold opacity-50 rounded-[1.5rem] m-2 pointer-events-none"></div>
                    <img :src="qrCodeUrl" alt="QR Dinámico" class="w-64 h-64 md:w-80 md:h-80 object-contain rounded-xl">
                    <p class="text-center font-bold text-slate-400 text-[10px] uppercase tracking-widest mt-4">Expira en: 05:00 min</p>
                </div>
            </div>
        </div>
    </div>

    <!-- Contenido: Mi Certificado de Ponente -->
    <div v-if="activeTab === 'certificados'" class="animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div class="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-[2rem] shadow-sm overflow-hidden p-2">
            <div class="p-6 flex justify-between items-center bg-slate-50/50 dark:bg-gray-900 rounded-t-[1.5rem] border-b border-slate-100 dark:border-gray-800">
              <h3 class="font-black text-lg text-slate-800 dark:text-white uppercase tracking-tight flex items-center gap-2">
                <span class="material-symbols-outlined text-umsa-gold">workspace_premium</span> Mi Certificado
              </h3>
            </div>
            
            <div class="p-12 flex flex-col items-center justify-center max-w-3xl mx-auto text-center">
                <div class="w-32 h-32 rounded-full bg-slate-50 dark:bg-gray-800 border-4 border-slate-100 dark:border-gray-700 flex items-center justify-center mb-8 shadow-inner relative">
                  <span class="material-symbols-outlined text-[64px] text-slate-300 dark:text-gray-600">workspace_premium</span>
                  <div class="absolute -bottom-2 -right-2 w-10 h-10 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-full border-4 border-white dark:border-gray-900 flex items-center justify-center">
                      <span class="material-symbols-outlined text-sm">lock</span>
                  </div>
                </div>
                
                <h3 class="text-2xl font-black text-primary-dark dark:text-white uppercase tracking-tight mb-4">Certificado de Docencia</h3>
                <p class="text-slate-500 dark:text-gray-400 max-w-lg mb-10 leading-relaxed font-medium">
                    Su certificado como Expositor/Ponente de la actividad <span class="font-bold text-umsa-blue">"{{ curso.evento }}"</span> se generará automáticamente una vez que el coordinador finalice el evento y cierre las actas académicas.
                </p>
                
                <div class="bg-slate-50 dark:bg-gray-800/50 border border-slate-200 dark:border-gray-700 rounded-2xl p-6 w-full flex items-center justify-between text-left">
                    <div>
                        <p class="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-gray-500 mb-1">Estado de Emisión</p>
                        <p class="text-sm font-bold text-slate-700 dark:text-gray-300 flex items-center gap-2">
                             <span class="w-2 h-2 rounded-full bg-rose-500"></span> Pendiente de Cierre de Evento
                        </p>
                    </div>
                    <button disabled class="bg-slate-200 dark:bg-gray-800 text-slate-400 dark:text-gray-600 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm cursor-not-allowed flex items-center gap-2">
                       <span class="material-symbols-outlined text-[16px]">download</span> Descargar PDF
                    </button>
                </div>
            </div>
        </div>
    </div>

  </div>
</template>
