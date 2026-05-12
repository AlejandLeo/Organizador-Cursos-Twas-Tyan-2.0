<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api, { getImageUrl } from '@/services/api';
import Swal from 'sweetalert2';
import { useAuthStore } from '@/stores/auth';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const activeTab = ref('estudiantes');
const isLoading = ref(false);
const actividad = ref<any>(null);
const inscritos = ref<any[]>([]);
const imparticiones = ref<any[]>([]);
const solicitudSeleccionada = ref<any>(null);

// Estado para la edición
const isEditing = ref(false);
const editForm = ref({
    nombre: '',
    tipo: '',
    descripcion: '',
    modalidad: 'Presencial',
    min_nota: 71,
    min_asistencia: 80,
    fecha_inicio: '',
    fecha_fin: '',
    horas: 0,
    id_evento: null as number | null,
    sesiones: [] as any[],
    requisitos: {} as any
});
const nuevaSesion = ref({ dia: 'Lunes', hora_inicio: '19:00', hora_fin: '21:00' });
const imagenArchivo = ref<File | null>(null);
const imagenPreview = ref<string | null>(null);

// Estado para ponentes
const ponentesExistentes = ref<any[]>([]);
const ponenteSeleccionado = ref<string>('');
const ponenteForm = ref({
    email: '',
    nombres: '',
    primer_apellido: ''
});

const fetchData = async () => {
    try {
        isLoading.value = true;

        // Carga de la actividad (crítica)
        const actRes = await api.get(`/actividades-academicas/${route.params.id}`);
        actividad.value = actRes.data;

        // Preparar formulario de edición con valores seguros
        const mod = actividad.value.modalidades?.[0];
        editForm.value = {
            nombre: actividad.value.nombre || '',
            tipo: actividad.value.tipo || '',
            descripcion: actividad.value.descripcion || '',
            modalidad: mod?.tipo || 'Presencial',
            min_nota: mod?.min_nota ?? 71,
            min_asistencia: mod?.min_asistencia ?? 80,
            fecha_inicio: actividad.value.fecha_inicio || '',
            fecha_fin: actividad.value.fecha_fin || '',
<<<<<<< HEAD
            horas: actividad.value.horas || 0,
            id_evento: actividad.value.evento?.id || null,
            sesiones: Array.isArray(mod?.sesiones) ? JSON.parse(JSON.stringify(mod.sesiones)) : [],
            requisitos: actividad.value.requisitos || { fields: [] }
=======
            sesiones: Array.isArray(mod?.sesiones) ? JSON.parse(JSON.stringify(mod.sesiones)) : []
>>>>>>> 85867c37895188d86c6ac4f1847ac54084a3453d
        };

        // Carga de inscripciones (crítica - muestra solicitudes y alumnos)
        try {
            const insRes = await api.get(`/admin/inscripciones/actividad/${route.params.id}`);
            inscritos.value = Array.isArray(insRes.data) ? insRes.data : (insRes.data?.data || []);
        } catch (e) {
            console.warn('No se pudieron cargar las inscripciones:', e);
            inscritos.value = [];
        }

        // Carga de imparticiones (no crítica - endpoint por actividad)
        try {
            const impRes = await api.get(`/imparticiones/actividad/${route.params.id}`);
            imparticiones.value = Array.isArray(impRes.data) ? impRes.data : (impRes.data?.data || []);
        } catch (e) {
            console.warn('No se pudieron cargar las imparticiones:', e);
            imparticiones.value = [];
        }

        // Carga de ponentes existentes (no crítica)
        try {
            const usersRes = await api.get('/usuarios?rol=Ponente&limit=100');
            ponentesExistentes.value = usersRes.data.data || usersRes.data;
        } catch (e) {
            console.warn('No se pudieron cargar los ponentes:', e);
            ponentesExistentes.value = [];
        }

    } catch (error) {
        console.error("Error al cargar la actividad:", error);
    } finally {
        isLoading.value = false;
    }
};

onMounted(() => {
    fetchData();
    if (route.query.tab) activeTab.value = route.query.tab as string;
    if (route.query.edit === 'true') {
        isEditing.value = true;
        // Limpiamos el query para no reabrir el modal al recargar
        router.replace({ query: { ...route.query, edit: undefined } });
    }
});

const handleImageChange = (e: any) => {
    const file = e.target.files[0];
    if (file) {
        imagenArchivo.value = file;
        imagenPreview.value = URL.createObjectURL(file);
    }
};

const agregarSesion = () => {
    editForm.value.sesiones.push({ ...nuevaSesion.value });
};

const eliminarSesion = (idx: number) => {
    editForm.value.sesiones.splice(idx, 1);
};

const guardarCambios = async () => {
    try {
        Swal.fire({ title: 'Guardando...', didOpen: () => Swal.showLoading() });
        const formData = new FormData();
        Object.entries(editForm.value).forEach(([key, val]) => {
            if (val === null || val === undefined || val === '') return; // Evitar enviar campos vacíos que fallen la validación (como fechas)
            if (key === 'sesiones' || key === 'requisitos') {
                formData.append(key, JSON.stringify(val));
            } else {
                formData.append(key, String(val));
            }
        });
        if (imagenArchivo.value) formData.append('imagen', imagenArchivo.value);

        console.log('Enviando datos de actualización para ID:', actividad.value.id);
        await api.put(`/actividades-academicas/${actividad.value.id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        await fetchData();
        isEditing.value = false;
        imagenArchivo.value = null;
        imagenPreview.value = null;
        Swal.fire('Éxito', 'Actividad actualizada correctamente', 'success');
    } catch (error: any) {
        console.error('Error al actualizar actividad:', error);
        
        // Formatear error de class-validator (array de strings) o string normal
        let errorMsg = 'No se pudo actualizar la actividad';
        const rawMsg = error.response?.data?.message;
        if (Array.isArray(rawMsg)) {
            errorMsg = rawMsg.join('<br>');
        } else if (typeof rawMsg === 'string') {
            errorMsg = rawMsg;
        }

        Swal.fire({
            icon: 'error',
            title: 'Error de Validación',
            html: errorMsg
        });
    } finally {
        isLoading.value = false;
    }
};

const inhabilitarActividad = async () => {
    const { value: motivo } = await Swal.fire({
        title: '¿INHABILITAR ACTIVIDAD?',
        text: `Indique la razón para inhabilitar "${actividad.value.nombre}":`,
        input: 'textarea',
        inputPlaceholder: 'Escriba el motivo aquí...',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        confirmButtonText: 'INHABILITAR',
        cancelButtonText: 'CANCELAR',
        inputValidator: (value) => {
          if (!value) return '¡Es obligatorio indicar un motivo!'
        }
    });

    if (motivo) {
        try {
            await api.patch(`/actividades-academicas/${actividad.value.id}`, { 
                estado: -1, 
                descripcion: `[INHABILITACION_MOTIVO]:${motivo}\n[FECHA]:${new Date().toLocaleString()}\n` 
            });
            await Swal.fire('Inhabilitada', 'La actividad ha sido marcada como inactiva.', 'success');
        } catch (e) { 
            Swal.fire('Error', 'No se pudo inhabilitar la actividad', 'error'); 
        }
    }
};

const solicitarActivacion = async () => {
    const result = await Swal.fire({
        title: '¿SOLICITAR ACTIVACIÓN?',
        text: `Se enviará un mensaje al Super Usuario para solicitar la reactivación de "${actividad.value.nombre}".`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#003B71',
        confirmButtonText: 'SÍ, ENVIAR SOLICITUD',
        cancelButtonText: 'CANCELAR'
    });

    if (result.isConfirmed) {
        try {
            Swal.fire({ title: 'Enviando solicitud...', didOpen: () => Swal.showLoading() });
            await api.post(`/actividades-academicas/${actividad.value.id}/solicitar-activacion`);
            Swal.fire('Solicitud Enviada', 'El Super Usuario ha sido notificado.', 'success');
        } catch (e) {
            Swal.fire('Error', 'No se pudo enviar la solicitud.', 'error');
        }
    }
};

const switchTab = (tab: string) => { activeTab.value = tab; };
const openModal = (id: string) => { 
    const m = document.getElementById(id); 
    if (m) m.style.display = 'flex'; 
};
const closeModal = (id: string) => { 
    const m = document.getElementById(id); 
    if (m) m.style.display = 'none'; 
};

// Computed para solicitudes (pendientes) - uso == para compatibilidad con valores numéricos del backend
const solicitudes = computed(() => inscritos.value.filter(i => i.estado == 0));
const alumnosActivos = computed(() => inscritos.value.filter(i => i.estado == 1));

const cambiarEstadoInscripcion = async (id: number, nuevoEstado: number) => {
    try {
        const accion = nuevoEstado === 1 ? 'aprobar' : 'rechazar';
        let observacion = '';

        if (nuevoEstado === 2) {
            const { value: text, isConfirmed } = await Swal.fire({
                title: 'Justificación de Rechazo',
                input: 'textarea',
                inputLabel: 'Explica detalladamente por qué no se acepta la solicitud:',
                inputPlaceholder: 'Ej: El perfil no cumple con los requisitos mínimos...',
                inputAttributes: { 'aria-label': 'Escribe el motivo aquí' },
                showCancelButton: true,
                confirmButtonText: 'Confirmar Rechazo',
                confirmButtonColor: '#d33',
                cancelButtonText: 'Cancelar',
                inputValidator: (value) => {
                    if (!value) return '¡Es obligatorio indicar un motivo para el rechazo!';
                    return null;
                }
            });
            if (!isConfirmed) return;
            observacion = text;
        } else {
            const result = await Swal.fire({
                title: '¿Confirmar aprobación?',
                text: "El estudiante será notificado de su alta en el curso.",
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: 'Sí, aprobar',
                cancelButtonText: 'Cancelar'
            });
            if (!result.isConfirmed) return;
        }

        Swal.fire({ title: 'Procesando...', didOpen: () => Swal.showLoading() });
        await api.put(`/admin/inscripciones/${id}`, { estado: nuevoEstado, observacion });
        
        Swal.fire('Completado', `La solicitud ha sido gestionada con éxito.`, 'success');
        if (solicitudSeleccionada.value) closeModal('modal-detalle-postulante');
        fetchData();
    } catch (error) {
        Swal.fire('Error', 'No se pudo completar la acción.', 'error');
    }
};

const verDetalleSolicitud = (sol: any) => {
    solicitudSeleccionada.value = sol;
    openModal('modal-detalle-postulante');
};

const getGeneroLabel = (genero: number) => {
    const labels: Record<number, string> = {
        0: 'Masculino',
        1: 'Femenino',
        2: 'Otro',
        3: 'Prefiero no decir'
    };
    return labels[genero] || 'No especificado';
};

const guardarNota = async (id: number, nota: number) => {
    try {
        await api.patch(`/admin/inscripciones/${id}/nota`, { nota });
        Swal.fire({
            title: 'Nota Guardada',
            icon: 'success',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 2000
        });
    } catch (error) {
        Swal.fire('Error', 'No se pudo guardar la nota', 'error');
    }
};

const cargarDatosPonente = () => {
    const p = ponentesExistentes.value.find(u => u.email === ponenteSeleccionado.value);
    if (p) {
        ponenteForm.value.email = p.email;
        ponenteForm.value.nombres = p.persona?.nombres || '';
        ponenteForm.value.primer_apellido = p.persona?.primer_apellido || '';
    } else {
        ponenteForm.value = { email: '', nombres: '', primer_apellido: '' };
    }
};

const asignarPonente = async () => {
    try {
        if (!ponenteForm.value.email || !ponenteForm.value.nombres) {
            return Swal.fire('Atención', 'Email y Nombres son obligatorios', 'warning');
        }
        
        Swal.fire({ title: 'Procesando vinculación...', didOpen: () => Swal.showLoading() });
        
        await api.post('/imparticiones/asignar-ponente', {
            ...ponenteForm.value,
            id_actividad: actividad.value.id,
            id_evento: actividad.value.evento.id
        });
        
        await fetchData();
        closeModal('modal-ponente');
        ponenteForm.value = { email: '', nombres: '', primer_apellido: '' };
        Swal.fire('¡Logrado!', 'El docente ha sido vinculado y/o creado exitosamente.', 'success');
    } catch (error) {
        Swal.fire('Error', 'Hubo un problema al vincular al docente. Verifica los datos.', 'error');
    }
};

const eliminarPonente = async (id: number) => {
    try {
        const result = await Swal.fire({
            title: '¿Remover docente?',
            text: "Esta acción quitará al docente de la planilla de esta actividad.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Sí, remover',
            cancelButtonText: 'Mantener'
        });

        if (result.isConfirmed) {
            await api.delete(`/imparticiones/${id}`);
            await fetchData();
            Swal.fire('Eliminado', 'Docente removido de la actividad.', 'success');
        }
    } catch (error) {
        Swal.fire('Error', 'No se pudo completar la eliminación.', 'error');
    }
};
</script>

<template>
  <div class="animate-in fade-in duration-500 max-w-7xl mx-auto space-y-8">
    <button @click="router.go(-1)" class="flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase hover:text-primary-dark dark:hover:text-white transition-colors mb-4">
      <span class="material-symbols-outlined text-sm">arrow_back</span> Volver
    </button>

    <div v-if="actividad" class="rounded-[3rem] p-10 flex flex-col md:flex-row items-center justify-between shadow-2xl relative overflow-hidden border-r-8 border-umsa-gold min-h-[200px]"
<<<<<<< HEAD
         :style="actividad.imagen ? { backgroundImage: `url(${getImageUrl('cursos', actividad.imagen)})`, backgroundSize: 'cover', backgroundPosition: 'center' } : { backgroundColor: '#1e293b' }"
         :class="Number(actividad.estado) === -1 ? 'grayscale' : ''">
=======
         :style="actividad.imagen ? { backgroundImage: `url(${actividad.imagen})`, backgroundSize: 'cover', backgroundPosition: 'center' } : { backgroundColor: '#1e293b' }">
>>>>>>> 85867c37895188d86c6ac4f1847ac54084a3453d
      <!-- Overlay degradado para adaptar a la paleta institucional -->
      <div class="absolute inset-0 bg-gradient-to-r" :class="Number(actividad.estado) === -1 ? 'from-gray-900/95 via-gray-800/80 to-transparent' : 'from-umsa-blue/95 via-primary-dark/80 to-transparent'"></div>
      
      <div class="relative z-10">
        <div v-if="Number(actividad.estado) === -1" class="flex items-center gap-2 text-red-500 mb-2">
            <span class="material-symbols-outlined">lock</span>
            <span class="text-[10px] font-black uppercase tracking-[0.3em]">Actividad Bloqueada - Modo Lectura</span>
        </div>
        <h2 id="titulo-curso" class="text-3xl md:text-4xl font-black text-white italic uppercase tracking-tight">{{ actividad.nombre }}</h2>
        <p class="text-emerald-400 text-[10px] font-black uppercase tracking-[0.3em] mt-2">Panel de Administración Integral • {{ actividad.tipo }}</p>
      </div>

      <div class="relative z-10 flex gap-4 mt-6 md:mt-0">
        <template v-if="Number(actividad.estado) !== -1">
            <button @click="isEditing = true" class="bg-emerald-500 text-primary-dark px-6 py-3 rounded-2xl text-[10px] font-black shadow-lg hover:brightness-110 transition-all uppercase tracking-widest flex items-center gap-2">
            <span class="material-symbols-outlined text-sm">settings</span> Configuración
            </button>
            <button @click="inhabilitarActividad" class="bg-red-500 text-white px-6 py-3 rounded-2xl text-[10px] font-black shadow-lg hover:brightness-110 transition-all uppercase tracking-widest flex items-center gap-2">
            <span class="material-symbols-outlined text-sm">block</span> Inhabilitar
            </button>
        </template>
        <template v-else>
            <button @click="solicitarActivacion" class="bg-umsa-gold text-white px-8 py-3 rounded-2xl text-[10px] font-black shadow-lg hover:brightness-110 transition-all uppercase tracking-widest flex items-center gap-2">
                <span class="material-symbols-outlined text-sm">lock_open</span> Solicitar Reactivación
            </button>
        </template>
      </div>
    </div>

    <!-- Tabs Nav -->
    <div class="flex space-x-8 border-b border-slate-200 dark:border-gray-800 px-4 mb-8 overflow-x-auto">
      <button @click="switchTab('estudiantes')" :class="activeTab === 'estudiantes' ? 'border-b-4 border-umsa-gold text-primary-dark dark:text-white font-black' : 'text-slate-400 font-bold hover:text-primary-dark dark:hover:text-white'" class="pb-4 text-[11px] uppercase tracking-widest transition-colors whitespace-nowrap">Estudiantes & Notas ({{ alumnosActivos.length }})</button>
      <button @click="switchTab('solicitudes')" :class="activeTab === 'solicitudes' ? 'border-b-4 border-umsa-gold text-primary-dark dark:text-white font-black' : 'text-slate-400 font-bold hover:text-primary-dark dark:hover:text-white'" class="pb-4 text-[11px] uppercase tracking-widest transition-colors flex items-center gap-1 whitespace-nowrap">
        <span class="material-symbols-outlined text-sm text-umsa-blue">how_to_reg</span> Solicitudes ({{ solicitudes.length }})
      </button>
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
                <button @click="openModal('modal-estudiante')" class="bg-primary-dark text-white px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-md hover:bg-emerald-500 transition-all flex items-center gap-2"><span class="material-symbols-outlined text-sm">person_add</span> Inscribir</button>
                <button class="bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 text-primary-dark dark:text-white px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-gray-700 transition-all flex items-center gap-2"><span class="material-symbols-outlined text-sm">upload_file</span> Importar Notas</button>
            </div>
        </div>
        <div class="bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-gray-800 overflow-hidden">
            <table class="w-full text-left">
                <thead class="bg-slate-50 dark:bg-gray-800/50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-200 dark:border-gray-800">
                    <tr><th class="px-8 py-5 w-16">N°</th><th class="px-8 py-5">Estudiante</th><th class="px-4 py-5 text-center">Nota Parcial</th><th class="px-4 py-5 text-center">Nota Final</th><th class="px-8 py-5 text-center">Acciones</th></tr>
                </thead>
                <tbody class="divide-y divide-slate-100 dark:divide-gray-800">
                    <tr v-for="(ins, idx) in alumnosActivos" :key="ins.id" class="hover:bg-slate-50 dark:hover:bg-gray-800/80 transition-colors">
                        <td class="px-8 py-6 font-bold text-slate-400">{{ (idx + 1).toString().padStart(2, '0') }}</td>
                        <td class="px-8 py-6">
                            <p class="font-black text-primary-dark dark:text-white text-sm uppercase">{{ ins.usuario?.persona?.primer_apellido }} {{ ins.usuario?.persona?.segundo_apellido }} {{ ins.usuario?.persona?.nombres }}</p>
                            <p class="text-[10px] text-slate-400 font-medium">CI: {{ ins.usuario?.persona?.documento_identidad }}</p>
                        </td>
                        <td class="px-4 py-6 text-center">
                            <input type="number" v-model="ins.nota_principal" class="w-16 text-center bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg text-xs font-bold text-primary-dark dark:text-white focus:ring-2 focus:ring-umsa-gold outline-none">
                        </td>
                        <td class="px-4 py-6 text-center">
                            <span :class="(ins.nota_principal || 0) >= 51 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'" class="px-3 py-1 rounded-lg font-black text-xs">
                                {{ ins.nota_principal || 0 }} / 100
                            </span>
                        </td>
                        <td class="px-8 py-6 flex justify-center gap-2">
                            <button @click="guardarNota(ins.id, ins.nota_principal)" class="p-2 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-all" title="Guardar Nota">
                                <span class="material-symbols-outlined text-sm">save</span>
                            </button>
                            <button class="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all"><span class="material-symbols-outlined text-sm">delete</span></button>
                        </td>
                    </tr>
                    <tr v-if="alumnosActivos.length === 0">
                        <td colspan="5" class="p-20 text-center text-slate-400 font-bold uppercase text-[10px]">No hay estudiantes activos inscritos</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>

    <!-- Tab Solicitudes (Aprobar/Rechazar) -->
    <div v-if="activeTab === 'solicitudes'" class="tab-content block space-y-6 animate-in fade-in">
        <div class="flex justify-between items-center mb-4">
            <h3 class="text-xl font-black text-primary-dark dark:text-white uppercase italic">Solicitudes de Inscripción</h3>
            <div class="flex items-center gap-3">
                <span class="bg-blue-100 dark:bg-blue-900/30 text-umsa-blue px-3 py-1 text-[10px] font-black uppercase rounded-lg">{{ solicitudes.length }} Pendientes</span>
                <button @click="fetchData" class="p-2 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg text-slate-400 hover:text-emerald-500 transition-colors" title="Actualizar">
                    <span class="material-symbols-outlined text-[18px]">refresh</span>
                </button>
            </div>
        </div>
        <div class="bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-gray-800 overflow-hidden">
            <table class="w-full text-left">
                <thead class="bg-slate-50 dark:bg-gray-800/50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-200 dark:border-gray-800">
                    <tr><th class="px-8 py-5">Postulante</th><th class="px-4 py-5 text-center">Fecha Solicitud</th><th class="px-4 py-5 text-center">Estado</th><th class="px-8 py-5 text-center">Evaluación</th></tr>
                </thead>
                <tbody class="divide-y divide-slate-100 dark:divide-gray-800">
                    <tr v-for="sol in solicitudes" :key="sol.id" class="hover:bg-slate-50 dark:hover:bg-gray-800/80 transition-colors">
                        <td class="px-8 py-6">
                            <p class="font-black text-primary-dark dark:text-white text-sm uppercase">{{ sol.usuario?.persona?.primer_apellido }} {{ sol.usuario?.persona?.segundo_apellido }} {{ sol.usuario?.persona?.nombres }}</p>
                            <p class="text-[10px] text-slate-400 font-medium">CI: {{ sol.usuario?.persona?.documento_identidad }}</p>
                        </td>
                        <td class="px-4 py-6 text-center text-xs font-bold text-slate-500">{{ new Date(sol.fecha_creacion).toLocaleDateString() }}</td>
                        <td class="px-4 py-6 text-center"><span class="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-3 py-1 rounded-lg font-black text-[9px] uppercase">Pendiente</span></td>
                        <td class="px-8 py-6 flex justify-center gap-3">
                            <button @click="verDetalleSolicitud(sol)" class="bg-primary-dark text-white px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-umsa-gold transition-all flex items-center gap-1 shadow-sm"><span class="material-symbols-outlined text-sm">visibility</span> Ver Perfil</button>
                            <button @click="cambiarEstadoInscripcion(sol.id, 1)" class="border border-emerald-500 text-emerald-500 px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all flex items-center gap-1">Aprobar</button>
                        </td>
                    </tr>
                    <tr v-if="solicitudes.length === 0">
                        <td colspan="4" class="p-20 text-center text-slate-400 font-bold uppercase text-[10px]">No hay solicitudes pendientes</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>

    <!-- Tab 2: Ponentes -->
    <div v-if="activeTab === 'ponentes'" class="tab-content block space-y-6 animate-in fade-in">
        <div class="flex justify-between items-center mb-4">
            <h3 class="text-xl font-black text-primary-dark dark:text-white uppercase italic">Plantel Docente</h3>
            <button @click="openModal('modal-ponente')" class="bg-primary-dark text-white px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-md hover:bg-emerald-500 transition-all flex items-center gap-2"><span class="material-symbols-outlined text-sm">person_add</span> Asignar Ponente</button>
        </div>
        <div class="bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-gray-800 overflow-hidden">
            <table class="w-full text-left">
                <thead class="bg-slate-50 dark:bg-gray-800/50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-200 dark:border-gray-800">
                    <tr><th class="px-8 py-5">Ponente</th><th class="px-8 py-5">Identificación</th><th class="px-8 py-5 text-center">Acciones</th></tr>
                </thead>
                <tbody class="divide-y divide-slate-100 dark:divide-gray-800">
                    <tr v-for="imp in imparticiones" :key="imp.id" class="hover:bg-slate-50 dark:hover:bg-gray-800/80 transition-colors">
                        <td class="px-8 py-6">
                            <div class="flex items-center gap-4">
                                <div>
                                    <p class="font-black text-primary-dark dark:text-white text-sm uppercase">
                                        {{ imp.usuario?.persona?.primer_apellido }} {{ imp.usuario?.persona?.segundo_apellido }} {{ imp.usuario?.persona?.nombres }}
                                    </p>
                                    <p class="text-[10px] text-blue-500 font-medium italic">{{ imp.usuario?.email }}</p>
                                </div>
                            </div>
                        </td>
                        <td class="px-8 py-6 text-xs font-bold text-primary-dark dark:text-gray-300 uppercase">
                            CI: {{ imp.usuario?.persona?.documento_identidad || 'S/N' }}
                        </td>
                        <td class="px-8 py-6 text-center flex justify-center gap-2">
                            <button @click="eliminarPonente(imp.id)" class="p-2 border border-red-200 dark:border-red-900 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all" title="Remover Docente"><span class="material-symbols-outlined text-sm">delete</span></button>
                        </td>
                    </tr>
                    <tr v-if="imparticiones.length === 0">
                        <td colspan="3" class="p-20 text-center text-slate-400 font-bold uppercase text-[10px]">No hay docentes asignados a esta actividad</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>

    <!-- Tab 3: Asistencia -->
    <div v-if="activeTab === 'asistencia'" class="tab-content block space-y-6 animate-in fade-in">
        <!-- VISTA PARA COORDINADOR: HISTORIAL DE ASISTENCIA -->
        <div v-if="authStore.rolActivo === 'Coordinador'" class="space-y-6">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-xl font-black text-primary-dark dark:text-white uppercase italic">Historial de Asistencias</h3>
                <span class="bg-blue-100 dark:bg-blue-900/30 text-umsa-blue px-3 py-1 text-[10px] font-black uppercase rounded-lg">Vista de Coordinador</span>
            </div>
            
            <div class="bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-gray-800 overflow-hidden">
                <table class="w-full text-left">
                    <thead class="bg-slate-50 dark:bg-gray-800/50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-200 dark:border-gray-800">
                        <tr>
                            <th class="px-8 py-5">Fecha / Sesión</th>
                            <th class="px-8 py-5">Modo de Registro</th>
                            <th class="px-8 py-5 text-center">Asistentes</th>
                            <th class="px-8 py-5 text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100 dark:divide-gray-800">
                        <tr class="hover:bg-slate-50 dark:hover:bg-gray-800/80 transition-colors">
                            <td class="px-8 py-6">
                                <p class="font-black text-primary-dark dark:text-white text-sm uppercase">Sesión 1: Martes 14/Nov</p>
                                <p class="text-[10px] text-slate-400 font-medium">Teoría • 08:00 AM</p>
                            </td>
                            <td class="px-8 py-6">
                                <span class="bg-blue-100 dark:bg-blue-900/30 text-umsa-blue px-3 py-1 rounded-lg font-black text-[9px] uppercase">Por PIN</span>
                            </td>
                            <td class="px-8 py-6 text-center">
                                <span class="text-green-600 dark:text-green-400 font-black text-sm">32 / 45</span>
                            </td>
                            <td class="px-8 py-6 text-center">
                                <button @click="openModal('modal-lista-asistencia')" class="bg-primary-dark text-white px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-emerald-500 transition-all flex items-center gap-1 mx-auto">
                                    <span class="material-symbols-outlined text-sm">visibility</span> Ver Lista
                                </button>
                            </td>
                        </tr>
                        <tr class="hover:bg-slate-50 dark:hover:bg-gray-800/80 transition-colors">
                            <td class="px-8 py-6">
                                <p class="font-black text-primary-dark dark:text-white text-sm uppercase">Sesión 2: Jueves 16/Nov</p>
                                <p class="text-[10px] text-slate-400 font-medium">Práctica • 02:00 PM</p>
                            </td>
                            <td class="px-8 py-6">
                                <span class="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 px-3 py-1 rounded-lg font-black text-[9px] uppercase">QR Proyectado</span>
                            </td>
                            <td class="px-8 py-6 text-center">
                                <span class="text-green-600 dark:text-green-400 font-black text-sm">40 / 45</span>
                            </td>
                            <td class="px-8 py-6 text-center">
                                <button @click="openModal('modal-lista-asistencia')" class="bg-primary-dark text-white px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-emerald-500 transition-all flex items-center gap-1 mx-auto">
                                    <span class="material-symbols-outlined text-sm">visibility</span> Ver Lista
                                </button>
                            </td>
                        </tr>
                        <tr class="hover:bg-slate-50 dark:hover:bg-gray-800/80 transition-colors">
                            <td class="px-8 py-6">
                                <p class="font-black text-primary-dark dark:text-white text-sm uppercase">Sesión 3: Sábado 18/Nov</p>
                                <p class="text-[10px] text-slate-400 font-medium">Evaluación • 10:00 AM</p>
                            </td>
                            <td class="px-8 py-6">
                                <span class="bg-purple-100 dark:bg-purple-900/30 text-purple-600 px-3 py-1 rounded-lg font-black text-[9px] uppercase">QR Estudiante</span>
                            </td>
                            <td class="px-8 py-6 text-center">
                                <span class="text-green-600 dark:text-green-400 font-black text-sm">45 / 45</span>
                            </td>
                            <td class="px-8 py-6 text-center">
                                <button @click="openModal('modal-lista-asistencia')" class="bg-primary-dark text-white px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-emerald-500 transition-all flex items-center gap-1 mx-auto">
                                    <span class="material-symbols-outlined text-sm">visibility</span> Ver Lista
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- VISTA PARA PONENTE: CONTROL DE ASISTENCIA (Lo que ya existía) -->
        <div v-else class="space-y-6">
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
                        <div class="absolute top-0 left-0 w-full h-[3px] bg-emerald-500 shadow-[0_0_15px_#BC9C31] animate-[scan_2s_infinite_linear]"></div>
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
    </div>

    <!-- Tab 4: Reportes -->
    <div v-if="activeTab === 'reportes'" class="tab-content block space-y-6 animate-in fade-in">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div class="bg-white dark:bg-gray-900 p-10 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-gray-800 flex flex-col items-center text-center group cursor-pointer hover:border-umsa-gold transition-colors">
                <span class="material-symbols-outlined text-6xl text-primary-dark dark:text-white mb-4 group-hover:scale-110 transition-transform">description</span>
                <h4 class="font-black text-primary-dark dark:text-white uppercase text-sm">Acta de Calificaciones</h4>
                <button class="mt-6 w-full py-3 bg-primary-dark text-white text-[10px] font-black rounded-xl uppercase hover:bg-emerald-500 transition-colors">Generar PDF</button>
            </div>
            
            <div class="bg-white dark:bg-gray-900 p-10 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-gray-800 flex flex-col items-center text-center group cursor-pointer hover:border-umsa-gold transition-colors">
                <span class="material-symbols-outlined text-6xl text-primary-dark dark:text-white mb-4 group-hover:scale-110 transition-transform">checklist</span>
                <h4 class="font-black text-primary-dark dark:text-white uppercase text-sm">Reporte de Asistencias</h4>
                <button class="mt-6 w-full py-3 bg-primary-dark text-white text-[10px] font-black rounded-xl uppercase hover:bg-emerald-500 transition-colors">Generar Excel</button>
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

  <!-- Modal Lista de Asistencia (Vista Coordinador) -->
  <div id="modal-lista-asistencia" class="fixed inset-0 bg-primary-dark/80 z-[200] hidden items-center justify-center backdrop-blur-sm">
      <div class="bg-white dark:bg-gray-900 rounded-[2rem] w-full max-w-2xl p-10 shadow-2xl">
          <div class="flex justify-between items-center mb-8 border-b border-slate-100 dark:border-gray-800 pb-4">
              <div>
                  <h3 class="text-2xl font-black text-primary-dark dark:text-white italic uppercase">Lista de Asistencia</h3>
                  <p class="text-[10px] text-slate-400 font-bold uppercase mt-1">Sesión 1: Martes 14/Nov</p>
              </div>
              <button @click="closeModal('modal-lista-asistencia')" class="text-slate-400 hover:text-red-500 transition-colors"><span class="material-symbols-outlined">close</span></button>
          </div>
          <div class="space-y-4 max-h-[400px] overflow-y-auto">
              <!-- Item Estudiante -->
              <div class="flex items-center justify-between p-4 bg-slate-50 dark:bg-gray-800/50 border border-slate-100 dark:border-gray-700 rounded-2xl">
                  <div class="flex items-center gap-4">
                      <div class="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center"><span class="material-symbols-outlined text-sm font-bold">check</span></div>
                      <div>
                          <p class="font-black text-primary-dark dark:text-white text-sm uppercase">PÉREZ NOGALES BRENDA</p>
                          <p class="text-[10px] text-slate-400 font-medium">CI: 1234567</p>
                      </div>
                  </div>
                  <span class="bg-green-500 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase">Presente</span>
              </div>
              
              <div class="flex items-center justify-between p-4 bg-slate-50 dark:bg-gray-800/50 border border-slate-100 dark:border-gray-700 rounded-2xl">
                  <div class="flex items-center gap-4">
                      <div class="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center"><span class="material-symbols-outlined text-sm font-bold">check</span></div>
                      <div>
                          <p class="font-black text-primary-dark dark:text-white text-sm uppercase">GÓMEZ LÓPEZ CARLOS</p>
                          <p class="text-[10px] text-slate-400 font-medium">CI: 7654321</p>
                      </div>
                  </div>
                  <span class="bg-green-500 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase">Presente</span>
              </div>
              
              <div class="flex items-center justify-between p-4 bg-slate-50 dark:bg-gray-800/50 border border-slate-100 dark:border-gray-700 rounded-2xl">
                  <div class="flex items-center gap-4">
                      <div class="w-10 h-10 bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center"><span class="material-symbols-outlined text-sm font-bold">close</span></div>
                      <div>
                          <p class="font-black text-primary-dark dark:text-white text-sm uppercase">MAMANI QUISPE JHOEL</p>
                          <p class="text-[10px] text-slate-400 font-medium">CI: 9876543</p>
                      </div>
                  </div>
                  <span class="bg-red-500 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase">Ausente</span>
              </div>
          </div>
          <div class="mt-8 flex justify-end pt-4 border-t border-slate-100 dark:border-gray-800">
              <button @click="closeModal('modal-lista-asistencia')" class="px-8 py-3 bg-primary-dark text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-emerald-500 shadow-lg transition-all">Cerrar</button>
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
              <button @click="closeModal('modal-estudiante')" class="px-8 py-3 bg-primary-dark text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-emerald-500 shadow-lg transition-all">Guardar</button>
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
              <div>
                  <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Seleccionar Ponente Existente (Opcional)</label>
                  <select v-model="ponenteSeleccionado" @change="cargarDatosPonente" class="w-full bg-slate-100 dark:bg-gray-800 border-2 border-slate-200 dark:border-gray-700 rounded-xl py-3 px-4 font-bold text-xs text-primary-dark dark:text-white outline-none focus:ring-2 focus:ring-umsa-gold">
                      <option value="">-- Nuevo Ponente (Escribir datos) --</option>
                      <option v-for="p in ponentesExistentes" :key="p.id" :value="p.email">
                          {{ p.persona?.primer_apellido }} {{ p.persona?.nombres }} ({{ p.email }})
                      </option>
                  </select>
              </div>

              <div class="border-t border-slate-100 dark:border-gray-800 pt-4">
                  <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Correo Electrónico</label>
                  <input v-model="ponenteForm.email" type="email" placeholder="ejemplo@correo.com" class="w-full bg-slate-50 dark:bg-gray-800 border-2 border-slate-100 dark:border-gray-700 rounded-xl py-3 px-4 font-bold text-primary-dark dark:text-white focus:border-umsa-gold outline-none focus:ring-4 focus:ring-umsa-gold/10">
              </div>
              <div class="grid grid-cols-2 gap-4">
                  <div>
                      <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nombres</label>
                      <input v-model="ponenteForm.nombres" type="text" placeholder="Nombres" class="w-full bg-slate-50 dark:bg-gray-800 border-2 border-slate-100 dark:border-gray-700 rounded-xl py-3 px-4 font-bold text-primary-dark dark:text-white focus:border-umsa-gold outline-none focus:ring-4 focus:ring-umsa-gold/10">
                  </div>
                  <div>
                      <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Apellido Paterno</label>
                      <input v-model="ponenteForm.primer_apellido" type="text" placeholder="Apellido" class="w-full bg-slate-50 dark:bg-gray-800 border-2 border-slate-100 dark:border-gray-700 rounded-xl py-3 px-4 font-bold text-primary-dark dark:text-white focus:border-umsa-gold outline-none focus:ring-4 focus:ring-umsa-gold/10">
                  </div>
              </div>
              <p class="text-[9px] text-slate-400 font-bold italic">* Si el docente no existe, se creará una cuenta con una contraseña segura temporal.</p>
          </div>
          <div class="mt-8 flex justify-end gap-4 pt-4 border-t border-slate-100 dark:border-gray-800">
              <button @click="closeModal('modal-ponente')" class="px-6 py-3 text-slate-500 font-black uppercase text-[10px] hover:bg-slate-50 dark:hover:bg-gray-800 rounded-xl">Cancelar</button>
              <button @click="asignarPonente" class="px-8 py-3 bg-primary-dark text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-emerald-500 shadow-lg transition-all">Vinculación Automática</button>
          </div>
      </div>
  </div>

  <!-- Modal Detalle Postulante (Premium) -->
  <div id="modal-detalle-postulante" class="fixed inset-0 bg-primary-dark/95 z-[400] hidden items-center justify-center backdrop-blur-xl p-4 overflow-y-auto">
      <div v-if="solicitudSeleccionada" class="bg-white dark:bg-gray-900 rounded-[3rem] w-full max-w-4xl shadow-2xl overflow-hidden animate-in zoom-in duration-300">
          <!-- Header del Perfil -->
          <div class="relative h-40 bg-gradient-to-r from-umsa-blue to-primary-dark p-10 flex items-end">
              <div class="flex items-center gap-6 z-10">
                  <div class="w-24 h-24 rounded-3xl bg-white dark:bg-gray-800 flex items-center justify-center shadow-2xl border-4 border-white/20">
                      <span class="material-symbols-outlined text-5xl text-umsa-blue">person</span>
                  </div>
                  <div class="text-white">
                      <h3 class="text-3xl font-black uppercase italic leading-tight">{{ solicitudSeleccionada.usuario?.persona?.nombres }} {{ solicitudSeleccionada.usuario?.persona?.primer_apellido }} {{ solicitudSeleccionada.usuario?.persona?.segundo_apellido }}</h3>
                      <div class="flex gap-3 mt-2">
                          <span v-if="solicitudSeleccionada.miembro_tyan" class="bg-umsa-gold text-primary-dark px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1 shadow-lg">
                              <span class="material-symbols-outlined text-xs">verified</span> Miembro TYAN
                          </span>
                          <span class="bg-white/20 backdrop-blur-md text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">Postulante</span>
                      </div>
                  </div>
              </div>
              <button @click="closeModal('modal-detalle-postulante')" class="absolute top-8 right-8 p-3 bg-white/10 hover:bg-red-500 text-white rounded-full transition-all">
                  <span class="material-symbols-outlined">close</span>
              </button>
          </div>

          <div class="p-10 grid grid-cols-1 lg:grid-cols-3 gap-10">
              <!-- Columna Datos Personales -->
              <div class="lg:col-span-2 space-y-8">
                  <div>
                      <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                          <span class="material-symbols-outlined text-sm">badge</span> Información Personal
                      </h4>
                      <div class="grid grid-cols-2 md:grid-cols-3 gap-6 bg-slate-50 dark:bg-gray-800/50 p-6 rounded-3xl">
                          <div><p class="text-[9px] text-slate-400 font-black uppercase">Documento ID</p><p class="font-bold text-sm text-primary-dark dark:text-white">{{ solicitudSeleccionada.usuario?.persona?.documento_identidad }}</p></div>
                          <div><p class="text-[9px] text-slate-400 font-black uppercase">Género</p><p class="font-bold text-sm text-primary-dark dark:text-white">{{ getGeneroLabel(solicitudSeleccionada.usuario?.persona?.genero) }}</p></div>
                          <div><p class="text-[9px] text-slate-400 font-black uppercase">Nacimiento</p><p class="font-bold text-sm text-primary-dark dark:text-white">{{ solicitudSeleccionada.usuario?.persona?.fecha_nacimiento }}</p></div>
                          <div><p class="text-[9px] text-slate-400 font-black uppercase">Origen</p><p class="font-bold text-sm text-primary-dark dark:text-white uppercase">{{ solicitudSeleccionada.usuario?.persona?.pais_origen }}</p></div>
                          <div><p class="text-[9px] text-slate-400 font-black uppercase">Residencia</p><p class="font-bold text-sm text-primary-dark dark:text-white uppercase">{{ solicitudSeleccionada.usuario?.persona?.pais_residencia }}</p></div>
                          <div><p class="text-[9px] text-slate-400 font-black uppercase">Celular</p><p class="font-bold text-sm text-emerald-600 dark:text-emerald-400">{{ solicitudSeleccionada.usuario?.persona?.celular }}</p></div>
                      </div>
                  </div>

                  <div>
                      <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                          <span class="material-symbols-outlined text-sm">history_edu</span> Motivación de Inscripción
                      </h4>
                      <div class="bg-blue-50 dark:bg-blue-900/10 border-l-4 border-umsa-blue p-6 rounded-r-3xl italic text-slate-600 dark:text-slate-300 text-sm font-medium">
                          "{{ solicitudSeleccionada.razon || 'No se proporcionó una razón específica.' }}"
                      </div>
                  </div>
              </div>

              <!-- Columna Afiliaciones Académicas -->
              <div class="space-y-6">
                  <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                      <span class="material-symbols-outlined text-sm">school</span> Perfil Académico
                  </h4>
                  <div class="space-y-4">
                      <div v-for="af in solicitudSeleccionada.usuario?.afiliaciones" :key="af.id" class="p-4 border border-slate-100 dark:border-gray-800 rounded-2xl bg-white dark:bg-gray-800 shadow-sm">
                          <p class="text-[10px] font-black text-umsa-blue uppercase mb-1">{{ af.tipo_afiliacion || 'Institución' }}</p>
                          <p class="font-black text-primary-dark dark:text-white text-xs uppercase">{{ af.afiliacion || af.institucion }}</p>
                          <div class="mt-2 pt-2 border-t border-slate-50 dark:border-gray-700 space-y-1">
                             <p class="text-[9px] font-bold text-slate-400 uppercase">Área: <span class="text-slate-600 dark:text-gray-300">{{ af.area_tematica }}</span></p>
                             <p class="text-[9px] font-bold text-slate-400 uppercase">Disciplina: <span class="text-slate-600 dark:text-gray-300">{{ af.disciplina_cientifica }}</span></p>
                             <p v-if="af.gradoAcademico" class="text-[9px] font-bold text-slate-400 uppercase">Grado: <span class="text-emerald-600 dark:text-emerald-400 font-black">{{ af.gradoAcademico?.descripcion }}</span></p>
                          </div>
                      </div>
                      <div v-if="!solicitudSeleccionada.usuario?.afiliaciones?.length" class="text-center p-6 bg-slate-50 dark:bg-gray-800 rounded-2xl border-2 border-dashed border-slate-200 dark:border-gray-700">
                          <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Sin Afiliaciones registradas</p>
                      </div>
                  </div>
              </div>
          </div>

          <!-- Footer de Acciones -->
          <div class="p-8 bg-slate-50 dark:bg-gray-800/50 border-t border-slate-100 dark:border-gray-800 flex justify-between items-center">
              <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">* Al aprobar, el estudiante recibirá un correo de confirmación.</p>
              <div class="flex gap-4">
                  <button @click="cambiarEstadoInscripcion(solicitudSeleccionada.id, 2)" class="px-8 py-3 bg-white dark:bg-gray-900 border-2 border-red-100 dark:border-red-900 text-red-500 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-red-500 hover:text-white transition-all">Rechazar Solicitud</button>
                  <button @click="cambiarEstadoInscripcion(solicitudSeleccionada.id, 1)" class="px-10 py-3 bg-emerald-500 text-primary-dark rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:brightness-110 active:scale-95 transition-all">Aprobar Inscripción</button>
              </div>
          </div>
      </div>
  </div>

  <!-- MODAL DE CONFIGURACIÓN AVANZADA (EDICIÓN) -->
  <div v-if="isEditing" class="fixed inset-0 bg-primary-dark/95 z-[300] flex items-center justify-center backdrop-blur-xl p-2 md:p-10 animate-in fade-in zoom-in duration-300">
      <div class="bg-white dark:bg-gray-900 rounded-[2rem] md:rounded-[3rem] w-full max-w-5xl h-full md:h-auto max-h-[95vh] overflow-y-auto shadow-2xl flex flex-col border border-white/10">
          
          <div class="p-8 md:p-12 flex-1 space-y-12">
              <div class="flex justify-between items-start">
                  <div>
                      <h2 class="text-2xl md:text-4xl font-black text-primary-dark dark:text-white uppercase italic tracking-tighter">Configuración de Actividad</h2>
                      <p class="text-slate-400 font-bold uppercase text-[8px] md:text-[10px] tracking-[0.2em] md:tracking-[0.3em] mt-2 italic">Edición de contenido, horarios y diseño visual</p>
                  </div>
                  <button @click="isEditing = false" class="p-4 bg-slate-100 dark:bg-gray-800 rounded-full text-slate-400 hover:text-red-500 transition-all">
                      <span class="material-symbols-outlined font-black">close</span>
                  </button>
              </div>

              <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
                  <!-- Columna 1: Información & Imagen -->
                  <div class="space-y-8">
                      <div class="space-y-4">
                          <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Portada del Curso (Imagen Recomendada 16:9)</label>
                          <div class="relative group cursor-pointer overflow-hidden rounded-[2rem] bg-slate-100 dark:bg-gray-800 border-2 border-dashed border-slate-200 dark:border-gray-700 aspect-video flex items-center justify-center">
                              <img v-if="imagenPreview || actividad?.imagen" :src="imagenPreview || actividad?.imagen" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700">
                              <div v-else class="text-center p-8">
                                  <span class="material-symbols-outlined text-4xl text-slate-300 mb-2">add_a_photo</span>
                                  <p class="text-[9px] font-black text-slate-400 uppercase">Subir Nueva Imagen</p>
                              </div>
                              <input type="file" @change="handleImageChange" class="absolute inset-0 opacity-0 cursor-pointer">
                              <div class="absolute inset-0 bg-primary-dark/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <span class="text-white font-black text-[10px] uppercase tracking-widest">Cambiar Imagen</span>
                              </div>
                          </div>
                      </div>

                      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                              <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Título de la Actividad</label>
                              <input v-model="editForm.nombre" type="text" class="w-full bg-slate-50 dark:bg-gray-800 border-2 border-slate-100 dark:border-gray-700 rounded-2xl py-4 px-6 font-bold text-primary-dark dark:text-white focus:border-umsa-gold outline-none transition-all">
                          </div>
                          <div>
                              <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Tipo de Actividad</label>
                              <select v-model="editForm.tipo" class="w-full bg-slate-50 dark:bg-gray-800 border-2 border-slate-100 dark:border-gray-700 rounded-2xl py-4 px-6 font-bold text-primary-dark dark:text-white focus:border-umsa-gold outline-none transition-all">
                                  <option value="Curso">Curso</option>
                                  <option value="Taller">Taller</option>
                                  <option value="Conferencia">Conferencia</option>
                                  <option value="Workshop">Workshop</option>
                                  <option value="Seminario">Seminario</option>
                              </select>
                          </div>
                          <div>
                              <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Modalidad de Enseñanza</label>
                              <select v-model="editForm.modalidad" class="w-full bg-slate-50 dark:bg-gray-800 border-2 border-slate-100 dark:border-gray-700 rounded-2xl py-4 px-6 font-bold text-primary-dark dark:text-white focus:border-umsa-gold outline-none transition-all">
                                  <option value="Presencial">Presencial</option>
                                  <option value="Virtual">Virtual</option>
                                  <option value="Híbrido">Híbrido</option>
                                  <option value="Semipresencial">Semipresencial</option>
                              </select>
                          </div>
                      </div>

                      <div>
                          <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Descripción Detallada</label>
                          <textarea v-model="editForm.descripcion" rows="4" class="w-full bg-slate-50 dark:bg-gray-800 border-2 border-slate-100 dark:border-gray-700 rounded-2xl py-4 px-6 font-bold text-primary-dark dark:text-white focus:border-umsa-gold outline-none transition-all resize-none"></textarea>
                      </div>

                      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          <div>
                              <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Fecha Inicio</label>
                              <input v-model="editForm.fecha_inicio" type="date" class="w-full bg-slate-50 dark:bg-gray-800 border-2 border-slate-100 dark:border-gray-700 rounded-2xl py-4 px-6 font-bold text-primary-dark dark:text-white focus:border-umsa-gold outline-none transition-all">
                          </div>
                          <div>
                              <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Fecha Fin</label>
                              <input v-model="editForm.fecha_fin" type="date" class="w-full bg-slate-50 dark:bg-gray-800 border-2 border-slate-100 dark:border-gray-700 rounded-2xl py-4 px-6 font-bold text-primary-dark dark:text-white focus:border-umsa-gold outline-none transition-all">
                          </div>
                          <div>
                              <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Carga Horaria (Hrs)</label>
                              <input v-model="editForm.horas" type="number" class="w-full bg-slate-50 dark:bg-gray-800 border-2 border-slate-100 dark:border-gray-700 rounded-2xl py-4 px-6 font-bold text-primary-dark dark:text-white focus:border-umsa-gold outline-none transition-all">
                          </div>
                      </div>

                      <div>
                          <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Configuración de Requisitos (JSON)</label>
                          <textarea v-model="editForm.requisitos" 
                                    @input="(e) => { try { editForm.requisitos = JSON.parse((e.target as HTMLTextAreaElement).value) } catch(e) {} }"
                                    class="w-full bg-slate-50 dark:bg-gray-800 border-2 border-slate-100 dark:border-gray-700 rounded-2xl py-4 px-6 font-mono text-[10px] text-emerald-600 dark:text-emerald-400 focus:border-umsa-gold outline-none transition-all resize-none" 
                                    rows="3">{{ JSON.stringify(editForm.requisitos, null, 2) }}</textarea>
                      </div>
                  </div>

                  <!-- Columna 2: Horarios & Parámetros -->
                  <div class="space-y-8">
                      <div class="bg-slate-50 dark:bg-gray-800/30 p-8 rounded-[2rem] border border-slate-100 dark:border-gray-800">
                          <h4 class="text-xs font-black text-primary-dark dark:text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                             <span class="material-symbols-outlined text-sm text-umsa-gold">verified</span> Parámetros de Aprobación
                          </h4>
                          <div class="grid grid-cols-2 gap-4 mb-10">
                              <div>
                                  <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Nota Mínima</label>
                                  <input v-model="editForm.min_nota" type="number" class="w-full bg-white dark:bg-gray-800 border-2 border-slate-100 dark:border-gray-700 rounded-xl py-3 px-4 font-bold text-center text-primary-dark dark:text-white focus:border-umsa-gold outline-none transition-all">
                              </div>
                              <div>
                                  <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Asistencia Mínima (%)</label>
                                  <input v-model="editForm.min_asistencia" type="number" class="w-full bg-white dark:bg-gray-800 border-2 border-slate-100 dark:border-gray-700 rounded-xl py-3 px-4 font-bold text-center text-primary-dark dark:text-white focus:border-umsa-gold outline-none transition-all">
                              </div>
                          </div>

                          <h4 class="text-xs font-black text-primary-dark dark:text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                             <span class="material-symbols-outlined text-sm text-umsa-gold">schedule</span> Cronograma (Horarios)
                          </h4>
                          
                          <div class="flex flex-wrap gap-2 mb-6">
                              <select v-model="nuevaSesion.dia" class="flex-1 min-w-[120px] bg-white dark:bg-gray-800 border-2 border-slate-100 dark:border-gray-700 rounded-xl py-2 px-3 text-[10px] font-bold outline-none focus:border-umsa-gold">
                                  <option>Lunes</option><option>Martes</option><option>Miércoles</option><option>Jueves</option><option>Viernes</option><option>Sábado</option><option>Domingo</option>
                              </select>
                              <div class="flex items-center gap-2">
                                  <input v-model="nuevaSesion.hora_inicio" type="time" class="w-24 bg-white dark:bg-gray-800 border-2 border-slate-100 dark:border-gray-700 rounded-xl py-2 px-3 text-[10px] font-bold outline-none focus:border-umsa-gold">
                                  <span class="text-slate-400 font-bold text-xs">a</span>
                                  <input v-model="nuevaSesion.hora_fin" type="time" class="w-24 bg-white dark:bg-gray-800 border-2 border-slate-100 dark:border-gray-700 rounded-xl py-2 px-3 text-[10px] font-bold outline-none focus:border-umsa-gold">
                              </div>
                              <button @click="agregarSesion" class="bg-primary-dark text-white px-4 py-2 rounded-xl hover:bg-emerald-500 transition-all flex items-center gap-1">
                                  <span class="material-symbols-outlined text-sm">add</span>
                                  <span class="text-[9px] font-black uppercase">Agregar</span>
                              </button>
                          </div>

                          <div class="space-y-2">
                              <div v-for="(s, idx) in editForm.sesiones" :key="idx" class="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-xl border border-slate-100 dark:border-gray-800 animate-in slide-in-from-right-2">
                                  <div class="flex items-center gap-3">
                                      <span class="w-2 h-2 bg-umsa-gold rounded-full"></span>
                                      <p class="text-[10px] font-black text-primary-dark dark:text-white uppercase">{{ s.dia }} <span class="text-slate-400 font-bold ml-2">{{ s.hora_inicio }} - {{ s.hora_fin }}</span></p>
                                  </div>
                                  <button @click="eliminarSesion(idx)" class="text-red-400 hover:text-red-600 transition-colors"><span class="material-symbols-outlined text-sm">delete_sweep</span></button>
                              </div>
                          </div>
                      </div>

                      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                        <div>
                            <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Nota Mínima</label>
                            <input v-model="editForm.min_nota" type="number" class="w-full bg-slate-50 dark:bg-gray-800 border-2 border-slate-100 dark:border-gray-700 rounded-xl py-3 px-4 font-bold text-primary-dark dark:text-white">
                        </div>
                        <div>
                            <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Asistencia %</label>
                            <input v-model="editForm.min_asistencia" type="number" class="w-full bg-slate-50 dark:bg-gray-800 border-2 border-slate-100 dark:border-gray-700 rounded-xl py-3 px-4 font-bold text-primary-dark dark:text-white">
                        </div>
                      </div>
                  </div>
              </div>
          </div>

          <div class="p-6 md:p-8 bg-slate-50 dark:bg-gray-800/50 border-t border-slate-100 dark:border-gray-800 flex flex-col sm:flex-row justify-end gap-3 md:gap-4">
              <button @click="isEditing = false" class="w-full sm:w-auto px-8 py-4 text-slate-500 font-black uppercase text-[10px] tracking-widest hover:bg-slate-200 dark:hover:bg-gray-800 rounded-2xl transition-all">Descartar</button>
              <button @click="guardarCambios" class="w-full sm:w-auto px-10 py-4 bg-emerald-500 text-primary-dark rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl hover:scale-105 active:scale-95 transition-all">Publicar Cambios</button>
          </div>
      </div>
  </div>
</template>
