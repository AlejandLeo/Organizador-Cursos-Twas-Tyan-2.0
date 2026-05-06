<script setup lang="ts">
import { ref, onMounted, computed, nextTick, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import api from '@/services/api';
import Swal from 'sweetalert2';
import QrcodeVue from 'qrcode.vue';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const activeTab = ref('resumen');
const loading = ref(true);
const actividadId = route.params.id;

const curso = ref<any>(null);
const estudiantes = ref<any[]>([]);

// Sesiones y QR
const sesiones = ref<any[]>([]);
const activeSessionId = ref<number | null>(null);
const qrMode = ref<'project' | 'scan'>('project');
const qrData = computed(() => {
    return activeSessionId.value ? JSON.stringify({ id_sesion: activeSessionId.value }) : '';
});

// Scanner instance
let html5QrcodeScanner: Html5QrcodeScanner | null = null;

// Verificar si el ponente tiene permisos de edición en esta actividad
const tienePermisos = computed(() => {
    if (!curso.value || !authStore.user) return false;
    const userId = (authStore.user as any)?.id_usuario;
    return curso.value.imparticiones?.some((i: any) => i.usuario?.id_usuario === userId || i.usuarioId === userId);
});

const fetchDetalleActividad = async () => {
    loading.value = true;
    try {
        const res = await api.get(`/actividades-academicas/${actividadId}`);
        const data = res.data;
        
        curso.value = {
            id: data.id,
            evento: data.evento?.nombre || 'Evento Académico',
            version: data.version || 'Gestión 2026',
            fechas: `${data.fecha_inicio ? new Date(data.fecha_inicio).toLocaleDateString() : 'Pendiente'} - ${data.fecha_fin ? new Date(data.fecha_fin).toLocaleDateString() : 'Pendiente'}`,
            estudiantesInscritos: data.inscripciones?.length || 0,
            estado: data.estado === 1 ? 'Activo' : 'Cerrado',
            modalidad: data.modalidad || 'Presencial',
            descripcion: data.descripcion || 'Sin descripción disponible.',
            imparticiones: data.imparticiones || []
        };
        
        // Estudiantes
        estudiantes.value = (data.inscripciones || []).map((ins: any) => ({
            id: ins.id,
            nombre: `${ins.usuario.persona.nombres} ${ins.usuario.persona.primer_apellido}`,
            correo: ins.usuario.email,
            asistencia: '---', 
            estado: ins.nota_principal >= 65 ? 'Excelente' : 'Regular'
        }));

        // Extraer Sesiones
        const allSesiones: any[] = [];
        if (data.modalidades) {
            data.modalidades.forEach((mod: any) => {
                if (mod.sesiones) {
                    mod.sesiones.forEach((s: any) => {
                        allSesiones.push({
                            ...s,
                            modalidad_nombre: mod.nombre || 'General'
                        });
                    });
                }
            });
        }
        sesiones.value = allSesiones;
        if (allSesiones.length > 0) {
            activeSessionId.value = allSesiones[0].id;
        }

    } catch (error) {
        console.error('Error al cargar detalle:', error);
    } finally {
        loading.value = false;
    }
};

onMounted(fetchDetalleActividad);

onUnmounted(() => {
    stopScanner();
});

const navigateToCalificaciones = () => {
    router.push({ 
        name: 'ponente-actividad-calificaciones',
        params: { actividadId: actividadId }
    });
};

const switchTab = (tab: string) => {
    activeTab.value = tab;
    if (tab === 'qr' && qrMode.value === 'scan') {
        startScanner();
    } else {
        stopScanner();
    }
};

const switchQrMode = (mode: 'project' | 'scan') => {
    qrMode.value = mode;
    if (mode === 'scan') {
        startScanner();
    } else {
        stopScanner();
    }
};

const startScanner = async () => {
    await nextTick();
    if (document.getElementById('reader')) {
        html5QrcodeScanner = new Html5QrcodeScanner(
            "reader",
            { fps: 10, qrbox: {width: 250, height: 250}, supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA] },
            false
        );
        html5QrcodeScanner.render(onScanSuccess, onScanFailure);
    }
};

const stopScanner = () => {
    if (html5QrcodeScanner) {
        try {
            html5QrcodeScanner.clear();
        } catch (error) {
            console.error("Failed to clear scanner", error);
        }
        html5QrcodeScanner = null;
    }
};

let isProcessingScan = false;

const onScanSuccess = async (decodedText: string) => {
    if (isProcessingScan) return;
    
    try {
        const data = JSON.parse(decodedText);
        if (!data.id_inscripcion_modalidad) throw new Error("QR inválido para asistencia de estudiante.");
        if (!activeSessionId.value) throw new Error("Debe seleccionar una sesión activa.");

        isProcessingScan = true;
        
        // Pausar scanner
        if (html5QrcodeScanner) html5QrcodeScanner.pause(true);

        const res = await api.post('/ponente/asistencias/registro-qr', {
            id_inscripcion_modalidad: data.id_inscripcion_modalidad,
            id_sesion: activeSessionId.value
        });

        await Swal.fire({
            icon: 'success',
            title: 'Asistencia Registrada',
            text: res.data.mensaje || 'Estudiante registrado correctamente.',
            timer: 2000,
            showConfirmButton: false
        });

    } catch (e: any) {
        await Swal.fire({
            icon: 'error',
            title: 'Error de Lectura',
            text: e.response?.data?.message || e.message || 'QR inválido o ya registrado.',
            timer: 3000,
            showConfirmButton: false
        });
    } finally {
        isProcessingScan = false;
        if (html5QrcodeScanner) html5QrcodeScanner.resume();
    }
};

const onScanFailure = (error: any) => {
    // ignorar errores constantes de frame vacío
};

</script>

<template>
  <div v-if="loading" class="animate-in fade-in flex flex-col items-center justify-center p-40 text-slate-400">
      <span class="material-symbols-outlined animate-spin text-5xl">sync</span>
      <p class="text-[10px] font-black uppercase tracking-widest mt-4">Sincronizando información académica...</p>
  </div>

  <div v-else-if="curso" class="animate-in fade-in duration-500 max-w-7xl mx-auto space-y-8 pb-20">
    <!-- Header Retorno -->
    <button @click="router.back()" class="flex items-center gap-2 text-slate-500 hover:text-umsa-blue transition-colors font-black text-[11px] uppercase tracking-widest">
      <span class="material-symbols-outlined text-[16px]">arrow_back</span>
      Volver al Listado
    </button>

    <!-- Header Principal -->
    <div class="bg-gradient-to-br from-umsa-blue via-[#005a96] to-[#004270] rounded-[1.5rem] md:rounded-[2.5rem] p-6 md:p-12 text-white relative overflow-hidden shadow-2xl shadow-umsa-blue/20 flex flex-col lg:flex-row justify-between items-center gap-6 md:gap-8 border border-white/10">
      <div class="absolute top-0 right-0 w-96 h-96 bg-umsa-gold/20 rounded-full blur-3xl -mr-32 -mt-32 mix-blend-screen pointer-events-none"></div>
      
      <div class="relative z-10 w-full lg:w-2/3 text-center lg:text-left">
        <div class="flex items-center justify-center lg:justify-start gap-2 md:gap-3 mb-6 flex-wrap">
          <span class="px-3 md:px-4 py-1 md:py-1.5 bg-umsa-gold text-white text-[9px] md:text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-umsa-gold/30">
            {{ curso.version }}
          </span>
          <span class="px-3 md:px-4 py-1 md:py-1.5 bg-white/10 backdrop-blur-md border border-white/20 text-white text-[9px] md:text-[10px] font-black uppercase tracking-widest rounded-full">
            <span class="mr-1 inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> {{ curso.estado }}
          </span>
        </div>
        
        <h1 class="text-2xl md:text-4xl lg:text-5xl font-black leading-tight uppercase italic mb-4 tracking-tight">
          {{ curso.evento }}
        </h1>
        <p class="text-blue-50 text-xs md:text-sm lg:text-base leading-relaxed max-w-3xl border-l-4 border-umsa-gold pl-4 font-medium opacity-90 mx-auto lg:mx-0">
          {{ curso.descripcion }}
        </p>
      </div>

      <!-- Acciones Rápidas: SOLAMENTE SI TIENE PERMISOS -->
      <div v-if="tienePermisos" class="relative z-10 flex flex-col sm:flex-row lg:flex-col gap-3 w-full lg:w-auto lg:min-w-[220px]">
        <button @click="switchTab('qr')" class="group bg-white text-umsa-blue hover:bg-slate-50 font-black text-[10px] md:text-xs uppercase tracking-widest px-6 py-3.5 rounded-xl md:rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 flex-1 lg:w-full">
            <span class="material-symbols-outlined text-[18px] md:text-[20px] group-hover:scale-110 transition-transform">qr_code_scanner</span>
            Generar QR
        </button>
        <button @click="navigateToCalificaciones()" class="group bg-umsa-gold hover:bg-yellow-600 text-white font-black text-[10px] md:text-xs uppercase tracking-widest px-6 py-3.5 rounded-xl md:rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl hover:shadow-2xl shadow-umsa-gold/20 hover:-translate-y-1 flex-1 lg:w-full">
            <span class="material-symbols-outlined text-[18px] md:text-[20px] group-hover:scale-110 transition-transform">grading</span>
            Notas
        </button>
      </div>
      
      <!-- Si no tiene permisos, mostrar badge de catálogo -->
      <div v-else class="relative z-10 bg-white/5 backdrop-blur-xl p-6 rounded-3xl border border-white/10 text-center flex flex-col items-center gap-2 w-full lg:w-auto">
            <span class="material-symbols-outlined text-3xl md:text-4xl text-umsa-gold/50">visibility</span>
            <p class="text-[10px] font-black uppercase tracking-widest text-white/60">Vista de Catálogo</p>
            <p class="text-[8px] font-bold text-white/40 uppercase">No asignado como ponente</p>
      </div>
    </div>

    <!-- Pestañas Modernas -->
    <div class="flex gap-2 overflow-x-auto no-scrollbar p-1.5 bg-slate-100 dark:bg-gray-900 rounded-2xl border border-slate-200 dark:border-gray-800 scroll-smooth">
      <button v-for="tab in ['resumen', 'estudiantes']" :key="tab" @click="switchTab(tab)" :class="[activeTab === tab ? 'bg-white dark:bg-gray-800 text-umsa-blue dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700']" class="px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-2 flex-shrink-0">
        <span class="material-symbols-outlined text-[18px]" :class="{'text-umsa-gold': activeTab === tab}">{{ tab === 'resumen' ? 'dashboard' : 'groups' }}</span>
        {{ tab === 'resumen' ? 'Panel Central' : `Nómina (${curso.estudiantesInscritos})` }}
      </button>
      
      <!-- Pestañas Extras solo si tiene permisos -->
      <template v-if="tienePermisos">
          <button @click="switchTab('qr')" :class="[activeTab === 'qr' ? 'bg-white dark:bg-gray-800 text-umsa-blue dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700']" class="px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-2 flex-shrink-0 relative">
            <span class="material-symbols-outlined text-[18px]" :class="{'text-umsa-gold': activeTab === 'qr'}">qr_code_2</span>
            Asistencia
          </button>
          <button @click="switchTab('certificados')" :class="[activeTab === 'certificados' ? 'bg-white dark:bg-gray-800 text-umsa-blue dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700']" class="px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-2 flex-shrink-0">
            <span class="material-symbols-outlined text-[18px]" :class="{'text-umsa-gold': activeTab === 'certificados'}">workspace_premium</span>
            Mis Certificados
          </button>
      </template>
    </div>

    <!-- Contenido dinámico según permisos -->
    <div v-show="activeTab === 'resumen'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
       <div class="col-span-1 md:col-span-2 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-[2.5rem] p-8 shadow-sm flex items-center justify-between group hover:border-umsa-blue/30 transition-all">
            <div>
                <p class="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2 flex items-center gap-2">Modalidad y Fechas</p>
                <h4 class="text-xl md:text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic">{{ curso.modalidad }} - {{ curso.fechas }}</h4>
            </div>
            <div class="w-14 h-14 bg-blue-50 dark:bg-gray-800 rounded-2xl flex items-center justify-center text-umsa-blue">
                <span class="material-symbols-outlined text-3xl">event_upcoming</span>
            </div>
       </div>

       <div class="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-[2.5rem] p-8 shadow-sm group hover:border-umsa-gold/50 transition-all text-center md:text-left">
           <p class="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-3">Participantes Inscritos</p>
           <h4 class="text-4xl font-black text-slate-800 dark:text-white leading-none">{{ curso.estudiantesInscritos }}</h4>
       </div>

       <div v-if="tienePermisos" class="bg-gradient-to-br from-slate-800 to-slate-900 rounded-[2.5rem] p-8 shadow-lg flex flex-col justify-between text-white group cursor-pointer" @click="switchTab('qr')">
            <p class="text-[10px] font-black uppercase tracking-widest text-umsa-gold mb-1">Módulo Docente</p>
            <h4 class="text-lg font-black leading-tight italic">Registrar Asistencia Hoy</h4>
            <div class="mt-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                Lanzar <span class="material-symbols-outlined text-sm">qr_code</span>
            </div>
       </div>
       <div v-else class="bg-slate-50 dark:bg-gray-800/20 rounded-[2.5rem] p-8 border border-dashed border-slate-200 flex items-center justify-center flex-col text-center opacity-60">
            <span class="material-symbols-outlined text-3xl text-slate-300">lock</span>
            <p class="text-[10px] font-black text-slate-400 uppercase mt-2">Funciones restringidas</p>
       </div>
    </div>

    <!-- Tabla de Estudiantes (Disponible para todos) -->
    <div v-if="activeTab === 'estudiantes'" class="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-[1.5rem] md:rounded-[2.5rem] shadow-sm overflow-hidden p-2">
        <div class="overflow-x-auto">
            <table class="w-full text-left min-w-[600px]">
                <thead class="bg-slate-50/50 dark:bg-black/20">
                    <tr>
                        <th class="px-4 md:px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Estudiante</th>
                        <th class="px-4 md:px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Correo Institucional</th>
                        <th class="px-4 md:px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Estatus Académico</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="est in estudiantes" :key="est.id" class="border-b border-slate-50 dark:border-gray-800/50 hover:bg-slate-50 dark:hover:bg-gray-800/30 transition-all">
                        <td class="px-4 md:px-8 py-5">
                           <div class="text-sm font-black text-slate-700 dark:text-white uppercase italic tracking-tighter">{{ est.nombre }}</div>
                        </td>
                        <td class="px-4 md:px-8 py-5 text-xs text-slate-500 font-bold">{{ est.correo }}</td>
                        <td class="px-4 md:px-8 py-5 text-right">
                            <span class="px-3 py-1 bg-blue-50 dark:bg-blue-900/10 text-umsa-blue text-[9px] font-black uppercase rounded-lg border border-blue-100 dark:border-blue-800/50 whitespace-nowrap">
                                Pre-Inscrito
                            </span>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>

    <!-- SECCIONES SEGURAS -->
    <div v-if="activeTab === 'qr' && tienePermisos" class="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-[1.5rem] md:rounded-[2.5rem] p-6 md:p-12 shadow-xl">
        <div class="flex flex-col xl:flex-row gap-8 xl:gap-12 items-start">
            <div class="flex-1 w-full xl:max-w-lg">
                <h3 class="text-2xl md:text-3xl font-black text-slate-800 dark:text-white uppercase italic mb-4">Registro de Asistencia</h3>
                <p class="text-slate-500 text-sm leading-relaxed mb-6">Selecciona la sesión activa y el método de registro de asistencia.</p>
                
                <div class="mb-8 bg-slate-50 dark:bg-gray-800 p-4 rounded-xl border border-slate-200 dark:border-gray-700">
                    <label class="text-[10px] font-black text-slate-400 uppercase mb-2 block">Sesión Académica Activa</label>
                    <select v-if="sesiones.length > 0" v-model="activeSessionId" class="w-full bg-white dark:bg-gray-900 border border-slate-300 dark:border-gray-600 rounded-lg p-2 text-sm font-bold text-slate-700 dark:text-white focus:ring-2 focus:ring-umsa-blue/20 outline-none transition-all">
                        <option v-for="s in sesiones" :key="s.id" :value="s.id">
                            {{ s.modalidad_nombre }} - {{ s.fecha ? new Date(s.fecha).toLocaleDateString() : 'Sin Fecha' }}
                        </option>
                    </select>
                    <div v-else class="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                        <p class="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-tight">No hay sesiones configuradas para esta actividad.</p>
                    </div>
                </div>

                <div class="flex flex-col sm:flex-row gap-4">
                    <button @click="switchQrMode('project')" :class="qrMode === 'project' ? 'bg-umsa-blue text-white shadow-xl shadow-umsa-blue/20' : 'bg-slate-100 text-slate-500'" class="flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">
                        Proyectar QR
                    </button>
                    <button @click="switchQrMode('scan')" :class="qrMode === 'scan' ? 'bg-umsa-blue text-white shadow-xl shadow-umsa-blue/20' : 'bg-slate-100 text-slate-500'" class="flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">
                        Escanear Alumnos
                    </button>
                </div>
            </div>

            <!-- Panel Derecho (Proyectar o Escanear) -->
            <div class="flex-1 flex justify-center items-center w-full min-h-[320px] mt-8 xl:mt-0">
                <div v-if="qrMode === 'project'" class="bg-white p-6 md:p-10 rounded-[2.5rem] border-[8px] md:border-[12px] border-slate-100 shadow-2xl flex flex-col items-center justify-center w-full max-w-sm transition-all animate-in zoom-in-95 duration-500">
                    <div v-if="!activeSessionId" class="text-center p-12 text-slate-400 flex flex-col items-center gap-4">
                        <span class="material-symbols-outlined text-5xl opacity-20">ads_click</span>
                        <p class="text-xs font-black uppercase tracking-widest leading-relaxed">Selecciona una sesión académica<br>para generar el código QR</p>
                    </div>
                    <template v-else>
                        <QrcodeVue :value="qrData" :size="200" :level="'H'" class="md:hidden" />
                        <QrcodeVue :value="qrData" :size="250" :level="'H'" class="hidden md:block" />
                        <p class="text-xs font-bold text-slate-400 mt-6 text-center">Los alumnos deben escanear este código con la cámara de su celular desde el portal</p>
                    </template>
                </div>

                <div v-if="qrMode === 'scan'" class="w-full max-w-md bg-black rounded-[2rem] md:rounded-[2.5rem] overflow-hidden shadow-2xl">
                    <div id="reader" class="w-full min-h-[300px] border-none bg-black"></div>
                </div>
            </div>
        </div>
    </div>

  </div>
</template>
