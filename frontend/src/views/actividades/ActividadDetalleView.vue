<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

const activeTab = ref('estudiantes');

onMounted(() => {
  if (route.query.tab) {
    activeTab.value = route.query.tab as string;
  }
});

const switchTab = (tab: string) => {
  activeTab.value = tab;
};

const openModal = (modalId: string) => {
  const m = document.getElementById(modalId);
  if (m) m.style.display = 'flex';
};

const closeModal = (modalId: string) => {
  const m = document.getElementById(modalId);
  if (m) m.style.display = 'none';
};
</script>

<template>
  <div class="animate-in fade-in duration-500 max-w-7xl mx-auto space-y-8">
    <button @click="router.go(-1)" class="flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase hover:text-primary-dark dark:hover:text-white transition-colors mb-4">
      <span class="material-symbols-outlined text-sm">arrow_back</span> Volver
    </button>

    <div class="bg-primary-dark rounded-[3rem] p-10 flex flex-col md:flex-row items-center justify-between shadow-2xl relative overflow-hidden border-r-8 border-umsa-gold">
      <div class="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20"></div>
      <div class="relative z-10">
        <h2 id="titulo-curso" class="text-3xl md:text-4xl font-black text-white italic uppercase tracking-tight">Especialidad en Biofertilizantes</h2>
        <p class="text-umsa-gold text-[10px] font-black uppercase tracking-[0.3em] mt-2">Panel de Administración Integral</p>
      </div>
      <div class="relative z-10 flex gap-4 mt-6 md:mt-0">
        <button class="bg-umsa-gold text-primary-dark px-6 py-3 rounded-2xl text-[10px] font-black shadow-lg hover:brightness-110 transition-all uppercase tracking-widest flex items-center gap-2">
          <span class="material-symbols-outlined text-sm">settings</span> Configuración
        </button>
      </div>
    </div>

    <!-- Tabs Nav -->
    <div class="flex space-x-8 border-b border-slate-200 dark:border-gray-800 px-4 mb-8 overflow-x-auto">
      <button @click="switchTab('estudiantes')" :class="activeTab === 'estudiantes' ? 'border-b-4 border-umsa-gold text-primary-dark dark:text-white font-black' : 'text-slate-400 font-bold hover:text-primary-dark dark:hover:text-white'" class="pb-4 text-[11px] uppercase tracking-widest transition-colors whitespace-nowrap">Estudiantes & Notas</button>
      <button @click="switchTab('ponentes')" :class="activeTab === 'ponentes' ? 'border-b-4 border-umsa-gold text-primary-dark dark:text-white font-black' : 'text-slate-400 font-bold hover:text-primary-dark dark:hover:text-white'" class="pb-4 text-[11px] uppercase tracking-widest transition-colors whitespace-nowrap">Plantel Docente</button>
      <button @click="switchTab('asistencia')" :class="activeTab === 'asistencia' ? 'border-b-4 border-umsa-gold text-primary-dark dark:text-white font-black' : 'text-slate-400 font-bold hover:text-primary-dark dark:hover:text-white'" class="pb-4 text-[11px] uppercase tracking-widest transition-colors flex items-center gap-1 whitespace-nowrap"><span class="material-symbols-outlined text-sm">qr_code_scanner</span> Asistencia</button>
      <button @click="switchTab('reportes')" :class="activeTab === 'reportes' ? 'border-b-4 border-umsa-gold text-primary-dark dark:text-white font-black' : 'text-slate-400 font-bold hover:text-primary-dark dark:hover:text-white'" class="pb-4 text-[11px] uppercase tracking-widest transition-colors whitespace-nowrap">Reportes & Actas</button>
      <button @click="switchTab('certificados')" :class="activeTab === 'certificados' ? 'border-b-4 border-umsa-gold text-primary-dark dark:text-white font-black' : 'text-slate-400 font-bold hover:text-primary-dark dark:hover:text-white'" class="pb-4 text-[11px] uppercase tracking-widest transition-colors flex items-center gap-1 whitespace-nowrap">
        <span class="material-symbols-outlined text-sm" :class="activeTab === 'certificados' ? 'text-umsa-gold' : ''">workspace_premium</span> Certificados
      </button>
    </div>

    <!-- Tab 1: Estudiantes -->
    <div v-if="activeTab === 'estudiantes'" class="tab-content block space-y-6 animate-in fade-in">
        <div class="flex justify-between items-center mb-4">
            <h3 class="text-xl font-black text-primary-dark dark:text-white uppercase italic">Nómina de Inscritos</h3>
            <div class="flex gap-3">
                <button @click="openModal('modal-estudiante')" class="bg-primary-dark text-white px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-md hover:bg-umsa-gold transition-all flex items-center gap-2"><span class="material-symbols-outlined text-sm">person_add</span> Inscribir</button>
                <button class="bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 text-primary-dark dark:text-white px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-gray-700 transition-all flex items-center gap-2"><span class="material-symbols-outlined text-sm">upload_file</span> Importar Notas</button>
            </div>
        </div>
        <div class="bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-gray-800 overflow-hidden">
            <table class="w-full text-left">
                <thead class="bg-slate-50 dark:bg-gray-800/50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-200 dark:border-gray-800">
                    <tr><th class="px-8 py-5 w-16">N°</th><th class="px-8 py-5">Estudiante</th><th class="px-4 py-5 text-center">Nota Parcial</th><th class="px-4 py-5 text-center">Nota Final</th><th class="px-8 py-5 text-center">Acciones</th></tr>
                </thead>
                <tbody class="divide-y divide-slate-100 dark:divide-gray-800">
                    <tr class="hover:bg-slate-50 dark:hover:bg-gray-800/80 transition-colors">
                        <td class="px-8 py-6 font-bold text-slate-400">01</td>
                        <td class="px-8 py-6"><p class="font-black text-primary-dark dark:text-white text-sm uppercase">Pérez Nogales Brenda</p><p class="text-[10px] text-slate-400 font-medium">CI: 8423512 LP</p></td>
                        <td class="px-4 py-6 text-center"><input type="number" value="45" class="w-16 text-center bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg text-xs font-bold text-primary-dark dark:text-white focus:ring-2 focus:ring-umsa-gold outline-none"></td>
                        <td class="px-4 py-6 text-center"><span class="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-3 py-1 rounded-lg font-black text-xs">85 / 100</span></td>
                        <td class="px-8 py-6 flex justify-center gap-2">
                            <button class="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all"><span class="material-symbols-outlined text-sm">edit</span></button>
                            <button class="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all"><span class="material-symbols-outlined text-sm">delete</span></button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>

    <!-- Tab 2: Ponentes -->
    <div v-if="activeTab === 'ponentes'" class="tab-content block space-y-6 animate-in fade-in">
        <div class="flex justify-between items-center mb-4">
            <h3 class="text-xl font-black text-primary-dark dark:text-white uppercase italic">Plantel Docente</h3>
            <button @click="openModal('modal-ponente')" class="bg-primary-dark text-white px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-md hover:bg-umsa-gold transition-all flex items-center gap-2"><span class="material-symbols-outlined text-sm">person_add</span> Asignar Ponente</button>
        </div>
        <div class="bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-gray-800 overflow-hidden">
            <table class="w-full text-left">
                <thead class="bg-slate-50 dark:bg-gray-800/50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-200 dark:border-gray-800">
                    <tr><th class="px-8 py-5">Ponente</th><th class="px-8 py-5">Módulo Impartido</th><th class="px-8 py-5 text-center">Horas</th><th class="px-8 py-5 text-center">Acciones</th></tr>
                </thead>
                <tbody class="divide-y divide-slate-100 dark:divide-gray-800">
                    <tr class="hover:bg-slate-50 dark:hover:bg-gray-800/80 transition-colors">
                        <td class="px-8 py-6">
                            <div class="flex items-center gap-4">
                                <div><p class="font-black text-primary-dark dark:text-white text-sm uppercase">Dr. Juan Carlos Mamani</p><p class="text-[10px] text-blue-500 font-medium italic">jcmamani@umsa.bo</p></div>
                            </div>
                        </td>
                        <td class="px-8 py-6 text-xs font-bold text-primary-dark dark:text-gray-300 uppercase">Fundamentos Microbiológicos</td>
                        <td class="px-8 py-6 text-xs font-bold text-slate-500 text-center">12 Hrs</td>
                        <td class="px-8 py-6 text-center flex justify-center gap-2">
                            <button class="p-2 border border-blue-200 dark:border-blue-900 text-blue-500 rounded-lg hover:bg-blue-500 hover:text-white transition-all"><span class="material-symbols-outlined text-sm">edit</span></button>
                            <button class="p-2 border border-red-200 dark:border-red-900 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all"><span class="material-symbols-outlined text-sm">delete</span></button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>

    <!-- Tab 3: Asistencia -->
    <div v-if="activeTab === 'asistencia'" class="tab-content block space-y-6 animate-in fade-in">
        <div class="flex flex-col md:flex-row md:justify-between md:items-end mb-4 gap-4">
            <div>
                <h3 class="text-xl font-black text-primary-dark dark:text-white uppercase italic">Control de Asistencia</h3>
                <p class="text-[10px] font-bold text-slate-400 uppercase mt-1 tracking-widest">Selecciona la sesión activa:</p>
            </div>
            <select class="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 text-primary-dark dark:text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm outline-none focus:ring-2 focus:ring-umsa-gold">
                <option>Sesión 1: Martes 14/Nov (Teoría)</option>
            </select>
        </div>
        <div class="grid grid-cols-12 gap-8">
            <div class="col-span-12 lg:col-span-5 bg-white dark:bg-gray-900 p-8 rounded-[3rem] shadow-sm border border-slate-100 dark:border-gray-800 text-center relative overflow-hidden">
                <h3 class="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Proyectar Código QR</h3>
                <div class="relative bg-slate-50 dark:bg-gray-800 p-6 rounded-3xl border-2 border-dashed border-umsa-gold mb-6 flex justify-center">
                    <span class="material-symbols-outlined text-[150px] text-primary-dark dark:text-white">qr_code_2</span>
                    <div class="absolute top-0 left-0 w-full h-[3px] bg-umsa-gold shadow-[0_0_15px_#BC9C31] animate-[scan_2s_infinite_linear]"></div>
                </div>
                <p class="text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-widest mb-2">O ingresa el PIN:</p>
                <div class="bg-slate-100 dark:bg-gray-800 px-8 py-3 rounded-2xl border border-slate-200 dark:border-gray-700 mb-6">
                    <span class="text-4xl font-black text-primary-dark dark:text-white tracking-[0.3em]">482-91A</span>
                </div>
            </div>
            <div class="col-span-12 lg:col-span-7 bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-gray-800 overflow-hidden flex flex-col">
                <div class="p-6 bg-slate-50 dark:bg-gray-800/50 border-b border-slate-100 dark:border-gray-800 flex justify-between items-center">
                    <div>
                        <h3 class="text-xs font-black text-primary-dark dark:text-white uppercase tracking-widest">Asistencia en Vivo</h3>
                        <p class="text-[10px] text-green-600 dark:text-green-400 font-bold uppercase mt-1 flex items-center gap-1"><span class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> 32 / 45 Presentes</p>
                    </div>
                    <button class="bg-red-50 dark:bg-red-900/30 text-red-500 px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors">Cerrar Registro</button>
                </div>
                <div class="p-6 flex-1 overflow-y-auto max-h-[400px] space-y-3">
                    <div class="flex items-center justify-between p-4 bg-green-50/50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30 rounded-2xl">
                        <div class="flex items-center gap-4">
                            <div class="w-10 h-10 bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center"><span class="material-symbols-outlined text-sm font-bold">check</span></div>
                            <div><p class="font-black text-primary-dark dark:text-white text-sm uppercase">Pérez Nogales Brenda</p></div>
                        </div>
                        <span class="bg-green-500 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase">Presente</span>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Tab 4: Reportes -->
    <div v-if="activeTab === 'reportes'" class="tab-content block space-y-6 animate-in fade-in">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div class="bg-white dark:bg-gray-900 p-10 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-gray-800 flex flex-col items-center text-center group cursor-pointer hover:border-umsa-gold transition-colors">
                <span class="material-symbols-outlined text-6xl text-primary-dark dark:text-white mb-4 group-hover:scale-110 transition-transform">description</span>
                <h4 class="font-black text-primary-dark dark:text-white uppercase text-sm">Acta de Calificaciones</h4>
                <button class="mt-6 w-full py-3 bg-primary-dark text-white text-[10px] font-black rounded-xl uppercase hover:bg-umsa-gold transition-colors">Generar PDF</button>
            </div>
            
            <div class="bg-white dark:bg-gray-900 p-10 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-gray-800 flex flex-col items-center text-center group cursor-pointer hover:border-umsa-gold transition-colors">
                <span class="material-symbols-outlined text-6xl text-primary-dark dark:text-white mb-4 group-hover:scale-110 transition-transform">checklist</span>
                <h4 class="font-black text-primary-dark dark:text-white uppercase text-sm">Reporte de Asistencias</h4>
                <button class="mt-6 w-full py-3 bg-primary-dark text-white text-[10px] font-black rounded-xl uppercase hover:bg-umsa-gold transition-colors">Generar Excel</button>
            </div>
        </div>
    </div>

    <!-- Tab 5: Certificados -->
    <div v-if="activeTab === 'certificados'" class="tab-content block space-y-8 animate-in fade-in">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div>
              <h3 class="text-2xl font-black text-umsa-gold dark:text-yellow-500 uppercase italic leading-none">Emisión de Certificados</h3>
              <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Configuración y plantillas para el evento</p>
            </div>
            <button class="bg-primary-dark text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:shadow-xl hover:bg-emerald-500 hover:-translate-y-0.5 transition-all flex items-center gap-2">
                <span class="material-symbols-outlined text-[16px]">save</span> Guardar Configuración
            </button>
        </div>
        
        <div class="grid grid-cols-1 xl:grid-cols-3 gap-8">
            
            <!-- Columna Izquierda: Formulario de Metadatos de la BD -->
            <div class="xl:col-span-1 space-y-6">
                
                <!-- BLoque 1: Datos Base -->
                <div class="bg-white dark:bg-gray-900 p-8 rounded-[2rem] shadow-sm border border-slate-100 dark:border-gray-800">
                    <h4 class="text-xs font-black text-primary-dark dark:text-white uppercase tracking-widest mb-6 border-b border-slate-100 dark:border-gray-800 pb-3 flex items-center gap-2">
                      <span class="material-symbols-outlined text-sm text-umsa-gold">database</span> Datos de Registro
                    </h4>
                    
                    <div class="space-y-5">
                        <div>
                            <label class="text-[10px] font-black text-slate-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 block">Tipo de Certificado (tipo)</label>
                            <select class="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl py-3 px-4 font-bold text-xs text-primary-dark dark:text-white focus:ring-2 focus:ring-umsa-gold outline-none transition-all cursor-pointer">
                                <option value="participacion">De Participación</option>
                                <option value="aprobacion">De Aprobación</option>
                                <option value="asistencia">De Asistencia</option>
                                <option value="excelencia">De Excelencia</option>
                            </select>
                        </div>
                        
                        <div>
                            <label class="text-[10px] font-black text-slate-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 block">Plantilla Info (id_info_certificad)</label>
                            <select class="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl py-3 px-4 font-bold text-xs text-primary-dark dark:text-white focus:ring-2 focus:ring-umsa-gold outline-none transition-all cursor-pointer">
                                <option>Plantilla Estándar TWAS</option>
                                <option>Plantilla Especialidad UMSA</option>
                                <option>Plantilla de Evento Corto</option>
                            </select>
                        </div>

                        <div>
                            <label class="text-[10px] font-black text-slate-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 block">Fecha de Emisión Oficial</label>
                            <input type="date" class="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl py-3 px-4 font-bold text-xs text-primary-dark dark:text-white focus:ring-2 focus:ring-umsa-gold outline-none transition-all">
                        </div>

                        <div>
                            <label class="text-[10px] font-black text-slate-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 block">Prefijo de Código (codigo_certificado)</label>
                            <div class="flex items-center">
                              <input type="text" value="TWAS26-BIO-" class="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl py-3 px-4 font-bold text-xs text-primary-dark dark:text-white focus:ring-2 focus:ring-umsa-gold outline-none transition-all">
                            </div>
                            <p class="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 mt-2 italic">*UUID_archivo y hash_integridad se generarán automáticamente.</p>
                        </div>

                        <div>
                            <label class="text-[10px] font-black text-slate-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 block">Estado (estado)</label>
                            <div class="bg-slate-50 dark:bg-gray-800 p-2 rounded-xl flex gap-2 border border-slate-200 dark:border-gray-700">
                               <button class="flex-1 py-2 rounded-lg bg-white dark:bg-gray-900 shadow-sm text-primary-dark dark:text-white text-[10px] font-black uppercase border border-slate-100 dark:border-gray-700">Borrador</button>
                               <button class="flex-1 py-2 rounded-lg text-slate-400 text-[10px] font-black uppercase hover:bg-white dark:hover:bg-gray-900 transition-all">Emitido</button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Bloque 2: Firmas Digitales -->
                <div class="bg-white dark:bg-gray-900 p-8 rounded-[2rem] shadow-sm border border-slate-100 dark:border-gray-800">
                    <div class="flex justify-between items-center mb-6 border-b border-slate-100 dark:border-gray-800 pb-3">
                      <h4 class="text-xs font-black text-primary-dark dark:text-white uppercase tracking-widest flex items-center gap-2">
                        <span class="material-symbols-outlined text-sm text-umsa-gold">draw</span> Firmas
                      </h4>
                      <button class="text-xs text-umsa-blue font-black hover:text-primary-dark transition-colors"><span class="material-symbols-outlined text-[16px]">add_circle</span></button>
                    </div>
                    
                    <div class="space-y-3">
                        <!-- Item Firma -->
                        <div class="flex items-center gap-3 p-3 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl group hover:border-umsa-gold transition-colors cursor-pointer">
                            <div class="w-10 h-10 rounded-lg bg-white dark:bg-gray-900 border border-slate-100 dark:border-gray-700 flex items-center justify-center text-slate-300">
                               <img src="https://upload.wikimedia.org/wikipedia/commons/f/f6/Firma_de_Andr%C3%A9s_Manuel_L%C3%B3pez_Obrador.svg" class="w-8 h-8 object-contain opacity-50 contrast-0" alt="Firma">
                            </div>
                            <div class="flex-1">
                                <p class="text-[11px] font-black text-primary-dark dark:text-white leading-tight">Director Posgrado</p>
                                <p class="text-[9px] font-bold text-slate-400 mt-0.5 uppercase">UMSA</p>
                            </div>
                            <span class="material-symbols-outlined text-red-400 opacity-0 group-hover:opacity-100 transition-opacity text-sm hover:text-red-600">delete</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Columna Derecha: The Workplace / Lienzo -->
            <div class="xl:col-span-2 flex flex-col h-full">
                <div class="flex-1 bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-gray-800 flex flex-col items-center justify-center relative overflow-hidden min-h-[500px]">
                    <div class="w-32 h-32 rounded-full bg-slate-50 dark:bg-gray-800 border-4 border-slate-100 dark:border-gray-700 flex items-center justify-center mb-8 shadow-inner">
                      <span class="material-symbols-outlined text-[64px] text-slate-300 dark:text-gray-600">design_services</span>
                    </div>
                    <h3 class="text-2xl font-black text-primary-dark dark:text-white uppercase tracking-tight mb-4">Lienzo de Diseño</h3>
                    <p class="text-slate-500 dark:text-gray-400 max-w-lg mb-10 leading-relaxed font-medium text-center">
                        Para tener una mejor experiencia al diseñar y ubicar las variables y firmas del certificado, hemos migrado el editor a un entorno de pantalla completa.
                    </p>
                    
                    <router-link :to="{ name: 'coordinador-certificado-workplace', params: { id: route.params.id } }" class="bg-umsa-gold text-white font-black px-10 py-5 rounded-2xl text-[12px] uppercase tracking-widest shadow-lg hover:shadow-xl hover:bg-yellow-500 hover:-translate-y-1 transition-all flex items-center gap-3">
                      <span class="material-symbols-outlined text-[20px]">open_in_new</span>
                      Abrir Workplace del Certificado
                    </router-link>
                </div>
            </div>
            
        </div>
    </div>

  </div>

  <!-- Modal Estudiante -->
  <div id="modal-estudiante" class="fixed inset-0 bg-primary-dark/80 z-[200] hidden items-center justify-center backdrop-blur-sm">
      <div class="bg-white dark:bg-gray-900 rounded-[2rem] w-full max-w-lg p-10 shadow-2xl">
          <div class="flex justify-between items-center mb-8 border-b border-slate-100 dark:border-gray-800 pb-4">
              <h3 class="text-2xl font-black text-primary-dark dark:text-white italic uppercase">Formulario Estudiante</h3>
              <button @click="closeModal('modal-estudiante')" class="text-slate-400 hover:text-red-500 transition-colors"><span class="material-symbols-outlined">close</span></button>
          </div>
          <div class="space-y-5">
              <div class="grid grid-cols-2 gap-4">
                  <div><label class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nombres</label><input type="text" class="w-full bg-slate-50 dark:bg-gray-800 border-2 border-slate-100 dark:border-gray-700 rounded-xl py-3 px-4 font-bold text-primary-dark dark:text-white focus:border-umsa-gold outline-none focus:ring-4 focus:ring-umsa-gold/10"></div>
                  <div><label class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Apellidos</label><input type="text" class="w-full bg-slate-50 dark:bg-gray-800 border-2 border-slate-100 dark:border-gray-700 rounded-xl py-3 px-4 font-bold text-primary-dark dark:text-white focus:border-umsa-gold outline-none focus:ring-4 focus:ring-umsa-gold/10"></div>
              </div>
              <div class="grid grid-cols-2 gap-4">
                  <div><label class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cédula de Identidad</label><input type="text" class="w-full bg-slate-50 dark:bg-gray-800 border-2 border-slate-100 dark:border-gray-700 rounded-xl py-3 px-4 font-bold text-primary-dark dark:text-white focus:border-umsa-gold outline-none focus:ring-4 focus:ring-umsa-gold/10"></div>
                  <div><label class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Teléfono</label><input type="text" class="w-full bg-slate-50 dark:bg-gray-800 border-2 border-slate-100 dark:border-gray-700 rounded-xl py-3 px-4 font-bold text-primary-dark dark:text-white focus:border-umsa-gold outline-none focus:ring-4 focus:ring-umsa-gold/10"></div>
              </div>
              <div><label class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Correo Electrónico</label><input type="email" class="w-full bg-slate-50 dark:bg-gray-800 border-2 border-slate-100 dark:border-gray-700 rounded-xl py-3 px-4 font-bold text-primary-dark dark:text-white focus:border-umsa-gold outline-none focus:ring-4 focus:ring-umsa-gold/10"></div>
          </div>
          <div class="mt-8 flex justify-end gap-4 pt-4 border-t border-slate-100 dark:border-gray-800">
              <button @click="closeModal('modal-estudiante')" class="px-6 py-3 text-slate-500 font-black uppercase text-[10px] hover:bg-slate-50 dark:hover:bg-gray-800 rounded-xl">Cancelar</button>
              <button @click="closeModal('modal-estudiante')" class="px-8 py-3 bg-primary-dark text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-umsa-gold shadow-lg transition-all">Guardar</button>
          </div>
      </div>
  </div>

  <!-- Modal Ponente -->
  <div id="modal-ponente" class="fixed inset-0 bg-primary-dark/80 z-[200] hidden items-center justify-center backdrop-blur-sm">
      <div class="bg-white dark:bg-gray-900 rounded-[2rem] w-full max-w-lg p-10 shadow-2xl">
          <div class="flex justify-between items-center mb-8 border-b border-slate-100 dark:border-gray-800 pb-4">
              <h3 class="text-2xl font-black text-primary-dark dark:text-white italic uppercase">Formulario Ponente</h3>
              <button @click="closeModal('modal-ponente')" class="text-slate-400 hover:text-red-500 transition-colors"><span class="material-symbols-outlined">close</span></button>
          </div>
          <div class="space-y-5">
              <div><label class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nombre Completo y Títulos</label><input type="text" placeholder="Ej: Dr. Juan Carlos Mamani" class="w-full bg-slate-50 dark:bg-gray-800 border-2 border-slate-100 dark:border-gray-700 rounded-xl py-3 px-4 font-bold text-primary-dark dark:text-white focus:border-umsa-gold outline-none focus:ring-4 focus:ring-umsa-gold/10"></div>
              <div class="grid grid-cols-2 gap-4">
                  <div><label class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cédula Identidad</label><input type="text" class="w-full bg-slate-50 dark:bg-gray-800 border-2 border-slate-100 dark:border-gray-700 rounded-xl py-3 px-4 font-bold text-primary-dark dark:text-white focus:border-umsa-gold outline-none focus:ring-4 focus:ring-umsa-gold/10"></div>
                  <div><label class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Especialidad</label><input type="text" class="w-full bg-slate-50 dark:bg-gray-800 border-2 border-slate-100 dark:border-gray-700 rounded-xl py-3 px-4 font-bold text-primary-dark dark:text-white focus:border-umsa-gold outline-none focus:ring-4 focus:ring-umsa-gold/10"></div>
              </div>
              <div>
                  <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Firma Digital</label>
                  <div class="w-full h-12 bg-slate-50 dark:bg-gray-800 border-2 border-dashed border-slate-300 dark:border-gray-700 rounded-xl flex items-center justify-center text-slate-400 hover:border-umsa-gold cursor-pointer text-xs font-bold transition-colors">Subir archivo (PNG sin fondo)</div>
              </div>
          </div>
          <div class="mt-8 flex justify-end gap-4 pt-4 border-t border-slate-100 dark:border-gray-800">
              <button @click="closeModal('modal-ponente')" class="px-6 py-3 text-slate-500 font-black uppercase text-[10px] hover:bg-slate-50 dark:hover:bg-gray-800 rounded-xl">Cancelar</button>
              <button @click="closeModal('modal-ponente')" class="px-8 py-3 bg-primary-dark text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-umsa-gold shadow-lg transition-all">Guardar</button>
          </div>
      </div>
  </div>
</template>
