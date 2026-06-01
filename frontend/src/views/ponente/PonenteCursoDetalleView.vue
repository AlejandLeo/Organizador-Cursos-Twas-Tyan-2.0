<script setup lang="ts">
import { ref, onMounted, computed, nextTick, onUnmounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import api, { resolveMediaUrl } from '@/services/api';
import Swal from 'sweetalert2';
import QrcodeVue from 'qrcode.vue';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

// Materiales
const materiales = ref<any[]>([]);
const nuevoMaterial = ref({
    titulo: '',
    tipo: 'Enlace', // 'Enlace' | 'Archivo'
    url: '',
    tamano: ''
});
const selectedFile = ref<File | null>(null);
const subiendoMaterial = ref(false);
const mostrarFormMaterial = ref(false);

const activeTab = ref('resumen');
const loading = ref(true);
const actividadId = route.params.id;

const curso = ref<any>(null);
const estudiantes = ref<any[]>([]);

// Sesiones y QR
const sesiones = ref<any[]>([]);
const activeSessionId = ref<number | null>(null);
const qrMode = ref<'project' | 'scan'>('project');
const registrosRequeridos = ref(1); // "registros para el dia de hoy"
const qrCounter = ref(1); // Current check number
const isQrVisible = ref(false); // Flag to show QR only after clicking project
const qrRandomToken = ref(Math.random().toString(36).substring(2, 8).toUpperCase());

const qrData = computed(() => {
    return activeSessionId.value ? JSON.stringify({ 
        id_sesion: activeSessionId.value,
        token: qrRandomToken.value,
        check_number: qrCounter.value
    }) : '';
});

const generatedPin = computed(() => {
    return `PIN-${actividadId}-${activeSessionId.value}-${qrRandomToken.value}`;
});

const regenerarCodigo = () => {
    if (qrCounter.value < registrosRequeridos.value) {
        qrCounter.value++;
        qrRandomToken.value = Math.random().toString(36).substring(2, 8).toUpperCase();
    } else {
        Swal.fire({
            icon: 'warning',
            title: 'Límite alcanzado',
            text: `Ya has generado los ${registrosRequeridos.value} códigos configurados para hoy.`,
            confirmButtonColor: '#003B71'
        });
    }
};

// Reiniciar estado cuando cambie la sesión
watch(activeSessionId, () => {
    qrCounter.value = 1;
    isQrVisible.value = false;
    qrRandomToken.value = Math.random().toString(36).substring(2, 8).toUpperCase();
});

// Scanner instance
let html5QrcodeScanner: Html5QrcodeScanner | null = null;

// Verificar si el ponente tiene permisos de edición en esta actividad
const tienePermisos = computed(() => {
    if (!curso.value || !authStore.user) return false;
    const userId = authStore.user.id;
    return curso.value.imparticiones?.some((i: any) => 
        i.usuario?.id === userId || 
        i.usuarioId === userId || 
        i.id_usuario === userId
    );
});

const fetchDetalleActividad = async () => {
    loading.value = true;
    try {
        const res = await api.get(`/actividades-academicas/${actividadId}`);
        const data = res.data;
        
        // Bloquear si la actividad está inhabilitada
        if (Number(data.estado) === -1) {
            Swal.fire({
                icon: 'warning',
                title: 'Actividad Inhabilitada',
                text: 'Esta actividad ha sido inhabilitada y no puede ser gestionada ni visualizada.',
                confirmButtonColor: '#003B71'
            });
            router.push({ name: 'ponente-eventos' });
            return;
        }
        
        curso.value = {
            id: data.id,
            nombre: data.nombre || 'Simposio / Actividad',
            evento: data.evento?.nombre || 'Evento Académico',
            version: data.version || 'Gestión 2026',
            fechas: `${data.fecha_inicio ? new Date(data.fecha_inicio).toLocaleDateString() : 'Pendiente'} - ${data.fecha_fin ? new Date(data.fecha_fin).toLocaleDateString() : 'Pendiente'}`,
            estudiantesInscritos: data.inscripciones?.length || 0,
            estado: data.estado === 1 ? 'Activo' : 'Cerrado',
            modalidad: data.modalidad || 'Presencial',
            descripcion: data.descripcion || 'Sin descripción disponible.',
            imparticiones: data.imparticiones || [],
            materiales: data.materiales || []
        };
        materiales.value = data.materiales || [];
        
        // Estudiantes
        estudiantes.value = (data.inscripciones || []).map((ins: any) => ({
            id: ins.id,
            nombre: `${ins.usuario?.persona?.nombres || 'Estudiante'} ${ins.usuario?.persona?.primer_apellido || ''}`,
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
        
        // SI NO HAY SESIONES, AGREGAMOS UNAS MOCK PARA PRUEBAS
        if (allSesiones.length === 0) {
            allSesiones.push({
                id: 101,
                fecha: new Date().toISOString(),
                modalidad_nombre: 'Teoría (Presencial)'
            });
            allSesiones.push({
                id: 102,
                fecha: new Date(Date.now() + 86400000).toISOString(),
                modalidad_nombre: 'Práctica (Virtual)'
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
        isQrVisible.value = false;
    } else {
        stopScanner();
        isQrVisible.value = true; // Show QR when clicking "Proyectar QR"
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

const simularEscaneo = async () => {
    try {
        if (!activeSessionId.value) throw new Error("Debe seleccionar una sesión activa.");

        await Swal.fire({
            icon: 'success',
            title: 'Asistencia Registrada (Simulación)',
            text: 'Se registró la asistencia del estudiante de prueba correctamente.',
            timer: 2000,
            showConfirmButton: false
        });
        
        if (estudiantes.value.length > 0) {
            estudiantes.value[0].asistencia = 'Presente';
            estudiantes.value[0].estado = 'Presente';
        }

    } catch (e: any) {
        await Swal.fire({
            icon: 'error',
            title: 'Error de Simulación',
            text: e.message || 'Error al simular escaneo.',
            timer: 3000,
            showConfirmButton: false
        });
    }
};

const handleFileChange = (e: any) => {
    const file = e.target.files[0];
    if (file) {
        selectedFile.value = file;
    }
};

const guardarMaterial = async () => {
    if (!nuevoMaterial.value.titulo.trim()) {
        Swal.fire('Atención', 'El título del material es obligatorio.', 'warning');
        return;
    }

    subiendoMaterial.value = true;
    try {
        let finalUrl = '';
        let finalSize = '';

        if (nuevoMaterial.value.tipo === 'Archivo') {
            if (!selectedFile.value) {
                Swal.fire('Atención', 'Debe seleccionar un archivo.', 'warning');
                subiendoMaterial.value = false;
                return;
            }
            // Subir archivo al servidor
            const formData = new FormData();
            formData.append('file', selectedFile.value);

            const uploadRes = await api.post(`/actividades-academicas/${actividadId}/materiales/upload`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            finalUrl = uploadRes.data.path;
            
            // Formatear tamaño
            const sizeInMb = (selectedFile.value.size / (1024 * 1024)).toFixed(2);
            finalSize = `${sizeInMb} MB`;
        } else {
            if (!nuevoMaterial.value.url.trim()) {
                Swal.fire('Atención', 'Debe ingresar un enlace (URL).', 'warning');
                subiendoMaterial.value = false;
                return;
            }
            finalUrl = nuevoMaterial.value.url.trim();
        }

        // Agregar al array local
        const nuevo = {
            id: Date.now().toString(),
            titulo: nuevoMaterial.value.titulo.trim(),
            tipo: nuevoMaterial.value.tipo === 'Archivo' ? 'PDF' : 'Enlace',
            url: finalUrl,
            tamaño: finalSize || '---',
            fecha: new Date().toLocaleDateString('es-ES')
        };

        const listaActualizada = [...materiales.value, nuevo];

        // Guardar en la base de datos
        await api.patch(`/actividades-academicas/${actividadId}/materiales`, {
            materiales: listaActualizada
        });

        materiales.value = listaActualizada;
        
        // Resetear form
        nuevoMaterial.value = {
            titulo: '',
            tipo: 'Enlace',
            url: '',
            tamano: ''
        };
        selectedFile.value = null;
        mostrarFormMaterial.value = false;

        Swal.fire({
            icon: 'success',
            title: 'Material Guardado',
            text: 'El material ha sido subido correctamente.',
            timer: 2000,
            showConfirmButton: false
        });

    } catch (e: any) {
        console.error(e);
        Swal.fire('Error', e.response?.data?.message || 'Error al guardar el material.', 'error');
    } finally {
        subiendoMaterial.value = false;
    }
};

const eliminarMaterial = async (id: string) => {
    const result = await Swal.fire({
        title: '¿Eliminar material?',
        text: 'Esta acción no se puede deshacer.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
        try {
            const listaActualizada = materiales.value.filter((m: any) => m.id !== id);
            await api.patch(`/actividades-academicas/${actividadId}/materiales`, {
                materiales: listaActualizada
            });
            materiales.value = listaActualizada;
            Swal.fire('Eliminado', 'El material ha sido eliminado.', 'success');
        } catch (e: any) {
            console.error(e);
            Swal.fire('Error', e.response?.data?.message || 'Error al eliminar el material.', 'error');
        }
    }
};

const openMaterial = (mat: any) => {
    if (!mat.url) return;
    const url = resolveMediaUrl(mat.url);
    window.open(url, '_blank');
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
        
        <h1 class="text-2xl md:text-4xl lg:text-5xl font-black leading-tight uppercase italic mb-2 tracking-tight">
          {{ curso.nombre }}
        </h1>
        <p class="text-blue-200 text-[10px] font-black uppercase tracking-widest mb-4">
          Evento: {{ curso.evento }}
        </p>
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
          <button @click="switchTab('materiales')" :class="[activeTab === 'materiales' ? 'bg-white dark:bg-gray-800 text-umsa-blue dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700']" class="px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-2 flex-shrink-0">
            <span class="material-symbols-outlined text-[18px]" :class="{'text-umsa-gold': activeTab === 'materiales'}">auto_stories</span>
            Materiales
          </button>
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
                    
                    <!-- Registros Requeridos -->
                    <div v-if="sesiones.length > 0" class="mt-4 pt-4 border-t border-slate-200 dark:border-gray-700">
                        <label class="text-[10px] font-black text-slate-400 uppercase mb-2 block">Registros para el día de hoy</label>
                        <input type="number" v-model="registrosRequeridos" min="1" class="w-full bg-white dark:bg-gray-900 border border-slate-300 dark:border-gray-600 rounded-lg p-2 text-sm font-bold text-slate-700 dark:text-white focus:ring-2 focus:ring-umsa-blue/20 outline-none transition-all" />
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
                    <div v-if="!isQrVisible || !activeSessionId" class="text-center p-12 text-slate-400 flex flex-col items-center gap-4">
                        <span class="material-symbols-outlined text-5xl opacity-20">ads_click</span>
                        <p class="text-xs font-black uppercase tracking-widest leading-relaxed">Configura los registros<br>y haz clic en "Proyectar QR"</p>
                    </div>
                    <template v-else>
                        <QrcodeVue :value="qrData" :size="200" :level="'H'" class="md:hidden" />
                        <QrcodeVue :value="qrData" :size="250" :level="'H'" class="hidden md:block" />
                        <p class="text-xs font-bold text-slate-400 mt-6 text-center">Los alumnos deben escanear este código con la cámara de su celular desde el portal</p>
                        
                        <!-- PIN Section -->
                        <div class="mt-6 border-t border-slate-100 dark:border-gray-800 pt-4 w-full text-center">
                            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">O comparte el PIN de asistencia:</p>
                            <div class="bg-slate-50 dark:bg-gray-800 px-6 py-3 rounded-xl border border-slate-200 dark:border-gray-700 mb-4">
                                <span class="text-2xl font-black text-primary-dark dark:text-white tracking-[0.2em]">{{ generatedPin }}</span>
                            </div>
                            
                            <!-- Regenerate Button -->
                            <button @click="regenerarCodigo" class="text-[10px] font-black text-umsa-blue dark:text-blue-400 uppercase tracking-widest flex items-center gap-2 mx-auto hover:text-umsa-gold transition-colors">
                                <span class="material-symbols-outlined text-[16px]">sync</span>
                                Regenerar Código (Actual: {{ qrCounter }})
                            </button>
                        </div>
                    </template>
                </div>

                <div v-if="qrMode === 'scan'" class="w-full max-w-md bg-black rounded-[2rem] md:rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col items-center">
                    <div id="reader" class="w-full min-h-[300px] border-none bg-black"></div>
                    
                    <!-- Simular Escaneo Button -->
                    <button @click="simularEscaneo" class="mb-6 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-widest px-6 py-3 rounded-xl transition-all shadow-lg flex items-center gap-2">
                        <span class="material-symbols-outlined text-[16px]">qr_code_scanner</span>
                        Simular Escaneo (Prueba)
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Tab: Materiales (Ponente) -->
    <div v-if="activeTab === 'materiales' && tienePermisos" class="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-[1.5rem] md:rounded-[2.5rem] p-6 md:p-10 shadow-xl space-y-8 animate-in slide-in-from-bottom-4 duration-500 fade-in">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 dark:border-gray-800 pb-6">
            <div>
                <h3 class="text-2xl font-black text-slate-800 dark:text-white uppercase italic tracking-tight flex items-center gap-2">
                    <span class="material-symbols-outlined text-umsa-blue text-3xl">auto_stories</span>
                    Material Didáctico y Enlaces
                </h3>
                <p class="text-slate-500 dark:text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Sube archivos o comparte enlaces a clases virtuales, libros o diapositivas.</p>
            </div>
            <button @click="mostrarFormMaterial = !mostrarFormMaterial" class="bg-umsa-blue hover:bg-blue-600 text-white font-black text-xs uppercase tracking-widest px-6 py-3 rounded-xl transition-all shadow-md flex items-center gap-2">
                <span class="material-symbols-outlined text-[18px]">{{ mostrarFormMaterial ? 'close' : 'add' }}</span>
                {{ mostrarFormMaterial ? 'Cancelar' : 'Agregar Material' }}
            </button>
        </div>

        <!-- Formulario para agregar material -->
        <div v-if="mostrarFormMaterial" class="bg-slate-50 dark:bg-gray-950 p-6 md:p-8 rounded-[1.5rem] border border-slate-200 dark:border-gray-800 space-y-6">
            <h4 class="text-sm font-black text-slate-700 dark:text-gray-300 uppercase tracking-widest">Nuevo Recurso</h4>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Título -->
                <div>
                    <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Título del Material</label>
                    <input v-model="nuevoMaterial.titulo" type="text" placeholder="Ej. Diapositivas - Sesión 1 o Enlace a Zoom" class="w-full bg-white dark:bg-gray-900 border border-slate-300 dark:border-gray-700 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-umsa-blue/20 outline-none text-slate-700 dark:text-white" />
                </div>

                <!-- Tipo -->
                <div>
                    <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Tipo de Recurso</label>
                    <select v-model="nuevoMaterial.tipo" class="w-full bg-white dark:bg-gray-900 border border-slate-300 dark:border-gray-700 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-umsa-blue/20 outline-none text-slate-700 dark:text-white">
                        <option value="Enlace">Enlace Web (Meet, Zoom, Drive, etc.)</option>
                        <option value="Archivo">Archivo (PDF, Documento, Diapositivas, etc.)</option>
                    </select>
                </div>
            </div>

            <!-- Entrada de Enlace -->
            <div v-if="nuevoMaterial.tipo === 'Enlace'">
                <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Dirección URL (Link)</label>
                <input v-model="nuevoMaterial.url" type="url" placeholder="https://meet.google.com/... o https://zoom.us/..." class="w-full bg-white dark:bg-gray-900 border border-slate-300 dark:border-gray-700 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-umsa-blue/20 outline-none text-slate-700 dark:text-white" />
            </div>

            <!-- Entrada de Archivo -->
            <div v-if="nuevoMaterial.tipo === 'Archivo'">
                <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Subir Archivo</label>
                <input type="file" @change="handleFileChange" class="w-full bg-white dark:bg-gray-900 border border-slate-300 dark:border-gray-700 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 dark:text-white file:mr-4 file:py-1 file:px-4 file:rounded-lg file:border-0 file:text-[10px] file:font-black file:uppercase file:bg-blue-50 file:text-umsa-blue hover:file:bg-blue-100" />
            </div>

            <!-- Guardar button -->
            <div class="flex justify-end">
                <button @click="guardarMaterial" :disabled="subiendoMaterial" class="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-widest px-8 py-4 rounded-xl transition-all shadow-lg shadow-emerald-600/10 flex items-center gap-2">
                    <span v-if="subiendoMaterial" class="material-symbols-outlined animate-spin text-[18px]">sync</span>
                    <span v-else class="material-symbols-outlined text-[18px]">save</span>
                    {{ subiendoMaterial ? 'Guardando...' : 'Guardar Recurso' }}
                </button>
            </div>
        </div>

        <!-- Lista de materiales -->
        <div v-if="materiales.length === 0" class="text-sm font-bold text-slate-500 bg-slate-50 dark:bg-gray-800 p-8 rounded-2xl border border-slate-200 dark:border-gray-700 text-center">
            Aún no has agregado material didáctico para esta actividad.
        </div>
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div v-for="mat in materiales" :key="mat.id" class="border border-slate-200 dark:border-gray-800 rounded-2xl p-5 hover:border-umsa-blue transition-colors group relative flex flex-col justify-between dark:bg-gray-950">
                <div>
                    <div class="flex justify-between items-start mb-4">
                        <span class="material-symbols-outlined text-3xl" :class="mat.tipo === 'PDF' ? 'text-red-500' : 'text-blue-500'">{{ mat.tipo === 'PDF' ? 'picture_as_pdf' : 'link' }}</span>
                        <span class="text-[10px] bg-slate-100 dark:bg-gray-800 px-2 py-1 rounded font-bold uppercase tracking-widest text-slate-500 dark:text-gray-400">{{ mat.tamaño || mat.tipo }}</span>
                    </div>
                    <h4 @click="openMaterial(mat)" class="font-bold text-slate-800 dark:text-white mb-1 line-clamp-2 cursor-pointer hover:text-umsa-blue transition-colors">{{ mat.titulo }}</h4>
                    <p class="text-xs text-slate-500 font-medium">{{ mat.fecha }}</p>
                </div>
                <div class="flex justify-end border-t border-slate-100 dark:border-gray-800 mt-4 pt-3">
                    <button @click="eliminarMaterial(mat.id)" class="text-red-500 hover:text-red-700 flex items-center gap-1 text-[10px] font-black uppercase tracking-widest transition-colors">
                        <span class="material-symbols-outlined text-[16px]">delete</span>
                        Eliminar
                    </button>
                </div>
            </div>
        </div>
    </div>

  </div>
</template>
