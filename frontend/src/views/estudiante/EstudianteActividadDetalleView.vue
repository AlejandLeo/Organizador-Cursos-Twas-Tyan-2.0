<script setup lang="ts">
import { ref, onMounted, computed, nextTick, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useCertificadosStore } from '@/stores/certificados';
import api, { getImageUrl, resolveMediaUrl } from '@/services/api';
import Swal from 'sweetalert2';
import QrcodeVue from 'qrcode.vue';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const certificadosStore = useCertificadosStore();
const user = computed(() => authStore.user);
const actividadId = Number(route.params.id);
const loading = ref(true);

const miCertificado = computed(() => {
    return certificadosStore.misCertificados.find((c: any) => c.actividadAcademica?.id === actividadId);
});

const openMaterial = (mat: any) => {
    if (!mat.url) return;
    const url = resolveMediaUrl(mat.url);
    window.open(url, '_blank');
};

const myInscripcion = ref<any>(null); // Guardará la inscripción si existe
const preinscripcionMenu = ref(false);
const preinscribiendo = ref(false);
const errorMensaje = ref('');

const preinscripcionForm = ref({
  razon: '',
  miembro_tyan: 0
});

// Respuestas a campos dinámicos
const respuestasDinamicas = ref<Record<string, any>>({});
// Campos del perfil que se están completando/editando
const datosPerfilEdit = ref<Record<string, any>>({});
// Copia original para saber qué campos estaban vacíos y permitir su edición
const perfilOriginal = ref<Record<string, any>>({});

const actividad = ref({
  id: actividadId,
  nombre: 'Cargando...',
  tipo: 'Cargando',
  fecha: '',
  estado: 'Cargando',
  progreso: 0,
  promedio: 0,
  asistencia: [] as any[],
  horas: 0,
  docente: 'Sin asignar',
  descripcion: 'Cargando detalle...',
  imagen: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=1200&q=80',
  materiales: [] as any[],
  ponentes: [] as any[],
  tareas: [] as any[],
  certificadoRequisitos: {
    asistenciaMinima: 80,
    notaMinima: 71,
    completado: false
  },
  requisitos: null as any
});

// Lógica QR Estudiante
const qrMode = ref<'project' | 'scan' | 'pin'>('project');
const pinInput = ref('');
const idInscripcionModalidad = computed(() => {
    if (myInscripcion.value && myInscripcion.value.modalidades && myInscripcion.value.modalidades.length > 0) {
        return myInscripcion.value.modalidades[0].id;
    }
    return null;
});
const qrData = computed(() => {
    return idInscripcionModalidad.value ? JSON.stringify({ id_inscripcion_modalidad: idInscripcionModalidad.value }) : '';
});
let html5QrcodeScanner: Html5QrcodeScanner | null = null;
let isProcessingScan = false;

const loadActividad = async () => {
  try {
    const res = await api.get('/actividades-academicas/' + actividadId);
    const act = res.data;

    // Bloquear si la actividad está inhabilitada
    if (Number(act.estado) === -1) {
      Swal.fire({
        icon: 'warning',
        title: 'Actividad Inhabilitada',
        text: 'Esta actividad ha sido inhabilitada temporalmente y no puede ser visualizada.',
        confirmButtonColor: '#003B71'
      });
      router.push({ name: 'estudiante-dashboard' });
      return;
    }
    actividad.value = {
      id: act.id,
      nombre: act.nombre,
      tipo: act.tipo || 'General',
      fecha: act.fecha_inicio ? `${new Date(act.fecha_inicio).toLocaleDateString()} al ${new Date(act.fecha_fin).toLocaleDateString()}` : 'Por definir',
      estado: 'Disponible',
      progreso: 0,
      promedio: 0,
      asistencia: [],
      horas: act.horas || 40,
      docente: act.imparticiones && act.imparticiones.length > 0 ? `${act.imparticiones[0].usuario.persona.nombres} ${act.imparticiones[0].usuario.persona.primer_apellido}` : 'Sin Docente',
      descripcion: act.descripcion || 'Sin descripción detallada.',
      imagen: getImageUrl('cursos', act.imagen) || 
              (act.evento ? (act.evento.imagen_fondo || act.evento.logo) : 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=1200&q=80'),
      materiales: act.materiales || [],
      ponentes: act.imparticiones ? act.imparticiones.map((imp: any) => ({
        id: imp.usuario.id,
        nombre: imp.usuario.persona.nombres,
        apellidos: `${imp.usuario.persona.primer_apellido} ${imp.usuario.persona.segundo_apellido || ''}`,
        especialidad: 'Ponente'
      })) : [],
      tareas: act.tareas || [],
      certificadoRequisitos: {
        asistenciaMinima: 80,
        notaMinima: 71,
        completado: false
      },
      requisitos: act.requisitos
    };

    if (!actividad.value.requisitos || !actividad.value.requisitos.base || Object.keys(actividad.value.requisitos.base).length === 0) {
      actividad.value.requisitos = {
        base: { nombres: true, primer_apellido: true, segundo_apellido: true, email: true, documento_identidad: true, celular: true },
        custom: []
      };
    }

    preinscripcionForm.value.razon = 'Me interesa participar debido a que deseo ampliar mis conocimientos en esta área y aplicar lo aprendido en mi desarrollo académico y profesional.';
    preinscripcionForm.value.miembro_tyan = 1; 

    if (actividad.value.requisitos?.base) {
        Object.keys(actividad.value.requisitos.base).forEach(key => {
            if (actividad.value.requisitos.base[key]) {
                const persona = user.value?.persona as any;
                const affiliations = user.value?.afiliaciones as any[];
                
                if (key === 'email') {
                    datosPerfilEdit.value[key] = user.value?.email || '';
                } else if (key === 'afiliacion') {
                    datosPerfilEdit.value[key] = affiliations?.[0]?.institucion || '';
                } else if (key === 'grado_academico') {
                    datosPerfilEdit.value[key] = affiliations?.[0]?.gradoAcademico?.abreviacion || affiliations?.[0]?.gradoAcademico?.nombre || '';
                } else {
                    datosPerfilEdit.value[key] = persona?.[key] || '';
                }
                perfilOriginal.value[key] = !!datosPerfilEdit.value[key];
            }
        });
    }
    if (actividad.value.requisitos?.custom) {
        actividad.value.requisitos.custom.forEach((c: any) => {
            respuestasDinamicas.value[c.label] = c.type === 'file' ? null : '';
        });
    }
  } catch (e) {
    console.error('Error cargando actividad:', e);
  }
};

const loadAsistenciasReales = async () => {
  try {
    const res = await api.get('/me/asistencias');
    const todas = res.data;
    const filtradas = todas
      .filter((a: any) => a.sesionAcademica?.cursoModalidad?.actividadAcademica?.id === actividadId)
      .map((a: any) => ({
        fecha: new Date(a.fecha_creacion || a.fecha_hora_registro).toLocaleString('es-BO', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        }),
        estado: a.estado === 1 ? 'presente' : 'ausente'
      }));
    actividad.value.asistencia = filtradas;
  } catch (e) {
    console.error('Error cargando asistencias reales:', e);
  }
};

const checkInscripcionStatus = async () => {
  try {
    const res = await api.get('/me/inscripciones');
    const all = res.data;
    const found = all.find((i: any) => i.actividadAcademica.id === actividadId);
    if (found) {
      myInscripcion.value = found;
      if (found.estado === 1) actividad.value.estado = 'Inscrito';
      else if (found.estado === 3) actividad.value.estado = 'Finalizado';
      else if (found.estado === 2) actividad.value.estado = 'Rechazado';
      else actividad.value.estado = 'Pre-Inscrito';
      
      actividad.value.progreso = found.estado === 1 ? 50 : (found.estado === 3 ? 100 : 0);
      actividad.value.certificadoRequisitos.completado = (found.estado === 3);

      if (found.estado === 1 || found.estado === 3) {
        await loadAsistenciasReales();
      }
    } else {
      myInscripcion.value = null; 
      actividad.value.estado = 'Disponible';
      actividad.value.progreso = 0;
    }
  } catch (e) {
    console.error('Error checando pre-inscripcion', e);
  }
};

onMounted(async () => {
  loading.value = true;
  await loadActividad();
  await checkInscripcionStatus();
  await certificadosStore.fetchMisCertificados();
  loading.value = false;
});

onUnmounted(() => {
    stopScanner();
});

const handleFileReqChange = (e: any, label: string) => {
    const file = e.target.files[0];
    if (file) {
        respuestasDinamicas.value[label] = file;
    }
};

const submitPreinscripcion = async () => {
  preinscribiendo.value = true;
  errorMensaje.value = '';
  try {
    if (Object.keys(datosPerfilEdit.value).length > 0) {
        try {
            await api.patch('/usuarios/perfil/datos', datosPerfilEdit.value);
        } catch (e) {
            console.warn("No se pudo actualizar el perfil, procediendo con la inscripción", e);
        }
    }

    const formData = new FormData();
    formData.append('id_actividad', actividadId.toString());
    formData.append('miembro_tyan', preinscripcionForm.value.miembro_tyan.toString());
    formData.append('razon', preinscripcionForm.value.razon);
    
    const datosDinamicosJson: Record<string, any> = {};
    for (const [label, value] of Object.entries(respuestasDinamicas.value)) {
        if (value instanceof File) {
            formData.append(`file_${label}`, value);
            datosDinamicosJson[label] = `[FILE]:${value.name}`;
        } else {
            datosDinamicosJson[label] = value;
        }
    }
    formData.append('datos_adicionales', JSON.stringify(datosDinamicosJson));

    await api.post('/me/inscripciones/preinscribir', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });

    preinscripcionMenu.value = false;
    
    Swal.fire({
      icon: 'success',
      title: 'Solicitud Enviada',
      text: 'Tu pre-inscripción ha sido registrada exitosamente. Un coordinador revisará tu caso.',
      confirmButtonColor: '#10b981'
    });
    
    await checkInscripcionStatus();
  } catch (e: any) {
    console.error(e);
    errorMensaje.value = e.response?.data?.message || 'Error al procesar la solicitud.';
  } finally {
    preinscribiendo.value = false;
  }
};

const getStatusColor = (status: string) => {
  if (status === 'Inscrito' || status === 'Finalizado' || status === 'En curso' || status === 'Entregado') return 'bg-emerald-500 text-white';
  if (status === 'Pre-Inscrito' || status === 'Pendiente') return 'bg-amber-500 text-white';
  if (status === 'Rechazado') return 'bg-red-500 text-white';
  return 'bg-blue-600 text-white';
};

const activeTab = ref(route.query.tab ? String(route.query.tab) : 'resumen');

const switchTab = (tab: string) => {
    activeTab.value = tab;
    if (tab === 'asistencia' && qrMode.value === 'scan') {
        startScanner();
    } else {
        stopScanner();
    }
};

const switchQrMode = (mode: 'project' | 'scan' | 'pin') => {
    qrMode.value = mode;
    if (mode === 'scan') {
        startScanner();
    } else {
        stopScanner();
    }
};

const submitPin = async () => {
    if (!pinInput.value.trim()) {
        Swal.fire('Atención', 'El PIN no puede estar vacío.', 'warning');
        return;
    }
    
    try {
        const resActivas = await api.get('/sesiones-academicas/activas');
        const sesiones = resActivas.data;
        const sesionHoy = sesiones.find((s: any) => s.cursoModalidad?.actividadAcademica?.id === actividadId);
        
        if (!sesionHoy) {
            Swal.fire('Error', 'No hay ninguna sesión activa hoy con PIN para esta actividad.', 'error');
            return;
        }
        
        await api.post('/inscripciones/registrar-asistencia-pin', {
            email: authStore.user?.email,
            id_sesion: sesionHoy.id,
            pin: pinInput.value.trim()
        });
        
        Swal.fire('Éxito', 'Asistencia registrada correctamente con PIN.', 'success');
        pinInput.value = '';
        qrMode.value = 'project';
        
        await loadActividad();
        await checkInscripcionStatus();
        
    } catch (e: any) {
        console.error(e);
        Swal.fire('Error', e.response?.data?.message || 'No se pudo registrar la asistencia con PIN.', 'error');
    }
};

const startScanner = async () => {
    await nextTick();
    if (document.getElementById('reader-student')) {
        html5QrcodeScanner = new Html5QrcodeScanner(
            "reader-student",
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

const onScanSuccess = async (decodedText: string) => {
    if (isProcessingScan) return;
    
    try {
        const data = JSON.parse(decodedText);
        if (!data.id_sesion) throw new Error("QR inválido para registro de sesión.");

        isProcessingScan = true;
        
        if (html5QrcodeScanner) html5QrcodeScanner.pause(true);

        const res = await api.post('/me/asistencias/registro-qr', {
            id_sesion: data.id_sesion
        });

        await Swal.fire({
            icon: 'success',
            title: 'Asistencia Registrada',
            text: res.data.mensaje || 'Tu asistencia fue registrada exitosamente.',
            timer: 2000,
            showConfirmButton: false
        });

        await loadActividad();
        await checkInscripcionStatus();

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
    //
};

const tabs = computed(() => {
  const isAprobado = myInscripcion.value && (myInscripcion.value.estado === 1 || myInscripcion.value.estado === 3);
  
  const baseTabs = [
    { id: 'resumen', label: 'Resumen', icon: 'info' },
    { id: 'ponentes', label: 'Ponentes', icon: 'group' }
  ];

  if (isAprobado) {
    baseTabs.push(
      { id: 'material', label: 'Materiales', icon: 'auto_stories' },
      { id: 'asistencia', label: 'Asistencia', icon: 'fact_check' },
      { id: 'notas', label: 'Notas', icon: 'grading' },
      { id: 'certificados', label: 'Certificados', icon: 'workspace_premium' }
    );
  }
  
  return baseTabs;
});

const goBack = () => {
    if (window.history.length > 1) {
        router.back();
    } else {
        router.push({ name: 'estudiante-dashboard' });
    }
};
</script>

<template>
  <div class="animate-in fade-in duration-500 max-w-7xl mx-auto space-y-8">
    
    <!-- Hero Header Integrado Tipo Netflix -->
    <div class="relative w-full h-[300px] md:h-[400px] rounded-[2rem] overflow-hidden shadow-2xl border border-slate-200/50 dark:border-gray-800 flex flex-col group/hero mb-6">
      <img :src="actividad.imagen" alt="Banner" class="absolute inset-0 w-full h-full object-cover object-center group-hover/hero:scale-105 transition-transform duration-[2s] ease-out">
      <div class="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-900/80 to-transparent"></div>
      
      <!-- Navegación y Badges Top -->
      <div class="absolute top-0 left-0 right-0 p-8 z-50 flex justify-between items-start">
          <button @click="goBack" class="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/20 p-2.5 rounded-2xl transition-all hover:scale-105 flex items-center justify-center cursor-pointer pointer-events-auto">
              <span class="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
          <span class="text-[10px] font-black uppercase px-4 py-1.5 rounded-full tracking-widest shadow-lg backdrop-blur-md border border-white/20 text-white" :class="getStatusColor(actividad.estado)">
            {{ actividad.estado }}
          </span>
      </div>

      <!-- Título y Meta de Actividad -->
      <div class="absolute bottom-0 left-0 right-0 p-6 md:p-12 z-20 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
        <div class="max-w-3xl">
          <div class="flex items-center gap-2 md:gap-3 mb-3 flex-wrap">
              <span class="text-[9px] md:text-xs font-black text-emerald-400 uppercase tracking-widest bg-emerald-900/30 border border-emerald-500/30 px-3 py-1 rounded-full">{{ actividad.tipo }}</span>
              <span class="text-[9px] md:text-xs font-bold text-gray-300 uppercase tracking-widest break-words">{{ actividad.fecha }}</span>
          </div>
          <h1 class="text-3xl md:text-5xl lg:text-6xl font-black text-white tracking-tighter leading-none mb-4 drop-shadow-lg">{{ actividad.nombre }}</h1>
          <p class="text-xs md:text-base font-medium text-gray-300 line-clamp-2 md:line-clamp-3 leading-relaxed drop-shadow-md max-w-2xl">{{ actividad.descripcion }}</p>
        </div>

        <!-- Acciones o Metric -->
        <div class="flex flex-col gap-4 shrink-0 mt-4 lg:mt-0 items-center lg:items-end">
          <template v-if="myInscripcion">
            <div :class="myInscripcion.estado === 1 ? 'bg-emerald-500' : (myInscripcion.estado === 2 ? 'bg-red-500' : (myInscripcion.estado === 3 ? 'bg-blue-500' : 'bg-amber-500'))"
                  class="backdrop-blur-xl border border-white/20 dark:border-gray-800 rounded-2xl p-6 flex flex-col items-center justify-center min-w-[180px] shadow-2xl transition-all">
              <div v-if="myInscripcion.estado === 1" class="flex flex-col items-center"><span class="material-symbols-outlined text-white mb-2 text-3xl">check_circle</span><span class="text-white text-base font-black uppercase text-center w-full block">Aprobado</span></div>
              <div v-else-if="myInscripcion.estado === 2" class="flex flex-col items-center"><span class="material-symbols-outlined text-white mb-2 text-3xl">cancel</span><span class="text-white text-base font-black uppercase text-center w-full block">Rechazado</span></div>
              <div v-else-if="myInscripcion.estado === 3" class="flex flex-col items-center"><span class="material-symbols-outlined text-white mb-2 text-3xl">school</span><span class="text-white text-base font-black uppercase text-center w-full block">Finalizado</span></div>
              <div v-else class="flex flex-col items-center"><span class="material-symbols-outlined text-white mb-2 text-3xl">hourglass_empty</span><span class="text-white text-xs font-black uppercase text-center w-full block mt-1 tracking-tight">Pendiente de<br>Aprobación</span></div>
              <span class="text-[10px] text-white/80 font-bold uppercase tracking-widest mt-2">Estado</span>
            </div>
            <div v-if="myInscripcion.estado === 0" class="text-xs font-bold text-amber-500 dark:text-amber-400 mt-2 text-center max-w-[200px]">Tu pre-inscripción fue enviada y está en revisión</div>
            <div v-if="myInscripcion.estado === 2" class="text-xs font-bold text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-xl mt-2 text-center max-w-[200px] border border-red-200 dark:border-red-900/50"><strong>No se pudo habilitar su inscripción debido a:</strong><br>{{ myInscripcion.observacion || myInscripcion.razon_rechazo || 'No se cumplieron los requisitos requeridos por la coordinadora.' }}</div>
          </template>
          <template v-else>
            <button @click="preinscripcionMenu = true" class="bg-umsa-blue hover:bg-blue-600 text-white px-8 py-5 rounded-2xl font-black uppercase tracking-widest transition-all shadow-[0_0_40px_-5px_rgba(37,99,235,0.5)] flex items-center justify-center gap-3 min-w-[180px] border border-blue-400/50 hover:scale-105">
               <span class="material-symbols-outlined text-[24px]">approval</span>
               Pre-inscribirme
            </button>
            <span class="text-xs text-slate-500 dark:text-gray-400 font-bold text-center mt-2 max-w-[200px]">Inscríbete para acceder al material y asistencia.</span>
          </template>
        </div>
      </div>
    </div>

    <!-- Tabs de Navegación -->
    <div class="flex overflow-x-auto gap-2 border-b border-slate-200 dark:border-gray-800 pb-1 snap-x scrollbar-hide">
      <button v-for="tab in tabs" :key="tab.id" @click="switchTab(tab.id)"
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
                
                <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-6 mt-6 border-t border-slate-100 dark:border-gray-800">
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
              <div v-if="myInscripcion" class="bg-slate-50 dark:bg-gray-950 p-6 rounded-[1.5rem] border border-slate-100 dark:border-gray-800 space-y-6 h-fit">
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

      <!-- Tab: Material (Real desde BDT) -->
      <div v-if="activeTab === 'material'" class="animate-in slide-in-from-bottom-4 duration-500 fade-in">
          <h3 class="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight mb-6">Material Didáctico</h3>
          <div v-if="actividad.materiales.length === 0" class="text-sm font-bold text-slate-500 bg-slate-50 dark:bg-gray-800 p-8 rounded-2xl border border-slate-200 dark:border-gray-700 text-center">Aún no hay material subido para esta actividad.</div>
          <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div v-for="mat in actividad.materiales" :key="mat.id" @click="openMaterial(mat)" class="border border-slate-200 dark:border-gray-800 hover:border-umsa-blue rounded-2xl p-5 hover:shadow-lg transition-all group cursor-pointer dark:bg-gray-950 flex flex-col justify-between min-h-[140px]">
                  <div>
                      <div class="flex justify-between items-start mb-4">
                          <span class="material-symbols-outlined text-3xl" :class="['PDF', 'Archivo'].includes(mat.tipo) ? 'text-red-500' : 'text-blue-500'">{{ ['PDF', 'Archivo'].includes(mat.tipo) ? 'picture_as_pdf' : 'link' }}</span>
                          <span class="text-[10px] bg-slate-100 dark:bg-gray-800 px-2 py-1 rounded font-bold uppercase tracking-widest text-slate-500 dark:text-gray-400">{{ mat.tamaño || mat.tipo }}</span>
                      </div>
                      <h4 class="font-bold text-slate-800 dark:text-white mb-1 line-clamp-2 group-hover:text-umsa-blue transition-colors">{{ mat.titulo }}</h4>
                  </div>
                  <p class="text-xs text-slate-500 font-medium mt-2">{{ mat.fecha }}</p>
              </div>
          </div>
      </div>

       <!-- Tab: Ponentes -->
      <div v-if="activeTab === 'ponentes'" class="animate-in slide-in-from-bottom-4 duration-500 fade-in">
          <h3 class="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight mb-6">Ponentes</h3>
          <div v-if="!actividad.ponentes || actividad.ponentes.length === 0" class="text-sm font-bold text-slate-500 bg-slate-50 dark:bg-gray-800 p-8 rounded-2xl border border-slate-200 dark:border-gray-700 text-center">Aún no hay ponentes registrados para esta actividad.</div>
          <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div v-for="ponente in actividad.ponentes" :key="ponente.id" class="border border-slate-200 dark:border-gray-800 rounded-2xl p-5 dark:bg-gray-950 flex flex-col items-center text-center group cursor-pointer hover:border-blue-500 transition-colors">
                  <div class="h-16 w-16 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-full flex items-center justify-center font-bold text-xl mb-4 group-hover:scale-110 transition-transform">{{ ponente.nombre ? ponente.nombre.charAt(0) : 'P' }}</div>
                  <h4 class="font-bold text-slate-800 dark:text-white text-lg">{{ ponente.nombre }} {{ ponente.apellidos || '' }}</h4>
                  <span class="text-xs text-slate-500 dark:text-gray-400 mt-1 uppercase tracking-wider font-bold">{{ ponente.especialidad || 'Especialista' }}</span>
              </div>
          </div>
      </div>

       <!-- Tab: Asistencia -->
      <div v-if="activeTab === 'asistencia'" class="animate-in slide-in-from-bottom-4 duration-500 fade-in">
          <!-- Card Principal de Asistencia -->
          <div class="bg-gradient-to-br from-white to-slate-50 dark:from-gray-900 dark:to-gray-950 border border-slate-200/60 dark:border-gray-800 rounded-[2rem] p-6 md:p-10 shadow-xl shadow-slate-200/10 dark:shadow-black/30 mb-8 relative overflow-hidden">
              <!-- Decoración de fondo -->
              <div class="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-3xl"></div>
              <div class="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-3xl"></div>

              <div class="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start relative z-10">
                  <!-- Columna Izquierda: Opciones -->
                  <div class="flex-1 w-full lg:max-w-md">
                      <div class="flex items-center gap-3 mb-2">
                          <span class="material-symbols-outlined text-emerald-500 text-3xl">fact_check</span>
                          <h3 class="text-2xl md:text-3xl font-black text-slate-800 dark:text-white uppercase italic tracking-tight">Registro de Asistencia</h3>
                      </div>
                      <p class="text-slate-500 dark:text-gray-400 text-sm leading-relaxed mb-8">Selecciona el método que prefieras para registrar tu presencia en la sesión de hoy.</p>
                      
                      <!-- Botones de Modo -->
                      <div class="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-3">
                          <!-- Botón Mostrar QR -->
                          <button @click="switchQrMode('project')" 
                              :class="qrMode === 'project' 
                                  ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-600/20 scale-[1.02]' 
                                  : 'bg-white dark:bg-gray-800 text-slate-600 dark:text-gray-300 border border-slate-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-700'" 
                              class="flex items-center gap-3 p-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 group">
                              <div class="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                                  :class="qrMode === 'project' ? 'bg-white/20' : 'bg-slate-100 dark:bg-gray-700 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-900/30'">
                                  <span class="material-symbols-outlined text-[18px]" :class="qrMode === 'project' ? 'text-white' : 'text-slate-500 dark:text-gray-400 group-hover:text-emerald-600'">qr_code_2</span>
                              </div>
                              <span class="flex-1 text-left">Mostrar Mi QR</span>
                              <span class="material-symbols-outlined text-[16px] opacity-0 group-hover:opacity-100 transition-opacity" :class="qrMode === 'project' ? 'text-white/70' : 'text-emerald-500'">arrow_forward</span>
                          </button>

                          <!-- Botón Escanear Clase -->
                          <button @click="switchQrMode('scan')" 
                              :class="qrMode === 'scan' 
                                  ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-600/20 scale-[1.02]' 
                                  : 'bg-white dark:bg-gray-800 text-slate-600 dark:text-gray-300 border border-slate-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-700'" 
                              class="flex items-center gap-3 p-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 group">
                              <div class="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                                  :class="qrMode === 'scan' ? 'bg-white/20' : 'bg-slate-100 dark:bg-gray-700 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-900/30'">
                                  <span class="material-symbols-outlined text-[18px]" :class="qrMode === 'scan' ? 'text-white' : 'text-slate-500 dark:text-gray-400 group-hover:text-emerald-600'">qr_code_scanner</span>
                              </div>
                              <span class="flex-1 text-left">Escanear Clase</span>
                              <span class="material-symbols-outlined text-[16px] opacity-0 group-hover:opacity-100 transition-opacity" :class="qrMode === 'scan' ? 'text-white/70' : 'text-emerald-500'">arrow_forward</span>
                          </button>

                          <!-- Botón Ingresar PIN -->
                          <button @click="switchQrMode('pin')" 
                              :class="qrMode === 'pin' 
                                  ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-600/20 scale-[1.02]' 
                                  : 'bg-white dark:bg-gray-800 text-slate-600 dark:text-gray-300 border border-slate-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-700'" 
                              class="flex items-center gap-3 p-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 group">
                              <div class="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                                  :class="qrMode === 'pin' ? 'bg-white/20' : 'bg-slate-100 dark:bg-gray-700 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-900/30'">
                                  <span class="material-symbols-outlined text-[18px]" :class="qrMode === 'pin' ? 'text-white' : 'text-slate-500 dark:text-gray-400 group-hover:text-emerald-600'">pin</span>
                              </div>
                              <span class="flex-1 text-left">Ingresar PIN</span>
                              <span class="material-symbols-outlined text-[16px] opacity-0 group-hover:opacity-100 transition-opacity" :class="qrMode === 'pin' ? 'text-white/70' : 'text-emerald-500'">arrow_forward</span>
                          </button>
                      </div>
                  </div>

                  <!-- Columna Derecha: Contenido Dinámico -->
                  <div class="flex-1 flex justify-center items-center w-full min-h-[340px] mt-6 lg:mt-0 bg-slate-50/50 dark:bg-gray-800/30 rounded-2xl p-6 border border-slate-100 dark:border-gray-800">
                      
                      <!-- Proyectar Mi QR -->
                      <div v-if="qrMode === 'project'" class="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-xl flex flex-col items-center justify-center w-full max-w-sm border border-slate-100 dark:border-gray-800 animate-in fade-in zoom-in-95 duration-300">
                          <div v-if="!idInscripcionModalidad" class="text-center p-8 text-slate-400">
                              <span class="material-symbols-outlined text-4xl animate-spin mb-2">autorenew</span>
                              <p class="text-xs font-bold uppercase tracking-widest">Generando código...</p>
                          </div>
                          <template v-else>
                              <div class="p-4 bg-white rounded-xl mb-4">
                                  <QrcodeVue :value="qrData" :size="200" :level="'H'" class="md:hidden" />
                                  <QrcodeVue :value="qrData" :size="220" :level="'H'" class="hidden md:block" />
                              </div>
                          </template>
                          <div class="flex items-center gap-2 text-slate-500 dark:text-gray-400">
                              <span class="material-symbols-outlined text-[16px]">info</span>
                              <p class="text-xs font-bold uppercase tracking-widest">Muestra este código al docente</p>
                          </div>
                      </div>

                      <!-- Escanear QR del Ponente -->
                      <div v-if="qrMode === 'scan'" class="w-full max-w-md bg-black rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-300">
                          <div id="reader-student" class="w-full min-h-[300px] border-none bg-black"></div>
                          <div class="p-4 bg-gray-900 text-center">
                              <p class="text-xs font-bold text-gray-400 uppercase tracking-widest">Apunta a la pantalla del docente</p>
                          </div>
                      </div>

                      <!-- Ingresar PIN -->
                      <div v-if="qrMode === 'pin'" class="w-full max-w-md bg-white dark:bg-gray-900 p-8 rounded-2xl border border-slate-200 dark:border-gray-800 shadow-xl flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-300">
                          <div class="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mb-4">
                              <span class="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-3xl">lock</span>
                          </div>
                          <h4 class="text-sm font-black text-slate-700 dark:text-gray-200 mb-2 uppercase tracking-widest">PIN de Acceso</h4>
                          <p class="text-xs text-slate-500 dark:text-gray-400 text-center mb-6">Ingresa el código de 6 dígitos que proyecta el docente.</p>
                          
                          <input v-model="pinInput" type="text" placeholder="······" class="w-full bg-slate-50 dark:bg-gray-800 border-2 border-slate-100 dark:border-gray-700 rounded-xl px-4 py-4 text-center text-3xl font-black focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none mb-4 tracking-[0.5em]" maxlength="6" />
                          
                          <button @click="submitPin" class="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-colors shadow-lg shadow-emerald-600/10 flex items-center justify-center gap-2">
                              <span class="material-symbols-outlined text-[18px]">verified</span>
                              Registrar Asistencia
                          </button>
                      </div>
                  </div>
              </div>
          </div>
          
          <!-- Historial de Asistencias -->
          <div class="max-w-4xl mx-auto">
              <div class="flex items-center justify-between mb-6">
                  <h3 class="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">Historial de Sesiones</h3>
                  <span class="text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-widest">{{ actividad.asistencia?.length || 0 }} Registros</span>
              </div>

              <div v-if="!actividad.asistencia || actividad.asistencia.length === 0" class="text-sm font-bold text-slate-500 bg-slate-50 dark:bg-gray-800/50 p-10 rounded-2xl border-2 border-dashed border-slate-200 dark:border-gray-700 text-center flex flex-col items-center justify-center">
                 <span class="material-symbols-outlined text-5xl mb-4 text-slate-400 dark:text-gray-600">event_busy</span>
                 <p class="text-slate-600 dark:text-gray-300 text-base mb-1">Aún no hay registros de asistencia.</p>
                 <p class="text-xs text-slate-400 dark:text-gray-500">Tus asistencias marcadas aparecerán aquí.</p>
              </div>
              
              <div v-else class="space-y-3">
                  <div v-for="(registro, index) in actividad.asistencia" :key="index" class="flex items-center justify-between bg-white dark:bg-gray-900 border border-slate-200/60 dark:border-gray-800 rounded-xl p-4 dark:bg-gray-950 relative overflow-hidden group hover:border-emerald-300 dark:hover:border-emerald-700 transition-all duration-300 shadow-sm hover:shadow-lg hover:shadow-slate-100 dark:hover:shadow-black/20">
                      <!-- Barra de estado -->
                      <div class="absolute left-0 top-0 bottom-0 w-1.5 transition-all duration-300" 
                          :class="registro.estado === 'presente' ? 'bg-emerald-500 group-hover:w-2' : 'bg-rose-500 group-hover:w-2'"></div>
                      
                      <div class="flex items-center gap-4 pl-2">
                          <div class="h-10 w-10 rounded-lg flex items-center justify-center transition-colors"
                              :class="registro.estado === 'presente' ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-rose-50 dark:bg-rose-900/20'">
                              <span class="material-symbols-outlined text-[20px]" :class="registro.estado === 'presente' ? 'text-emerald-500' : 'text-rose-500'">
                                  {{ registro.estado === 'presente' ? 'check_circle' : 'cancel' }}
                              </span>
                          </div>
                          <div>
                              <h4 class="font-bold text-slate-800 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{{ registro.fecha }}</h4>
                              <div class="text-[10px] text-slate-400 dark:text-gray-500 font-bold uppercase tracking-widest mt-0.5">Sesión {{ Number(index) + 1 }}</div>
                          </div>
                      </div>
                      
                      <div class="px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all" 
                          :class="registro.estado === 'presente' 
                              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' 
                              : 'bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400'">
                        {{ registro.estado === 'presente' ? 'Presente' : 'Ausente' }}
                      </div>
                  </div>
              </div>
          </div>
      </div>

      <!-- Tab: Notas -->
      <div v-if="activeTab === 'notas'" class="animate-in slide-in-from-bottom-4 duration-500 fade-in">
          <h3 class="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight mb-6">Mis Calificaciones</h3>
          <div class="bg-slate-50 dark:bg-gray-950 p-8 rounded-[2rem] border border-slate-200 dark:border-gray-800 flex flex-col md:flex-row items-center justify-between shadow-sm max-w-3xl">
              <div class="text-center md:text-left mb-6 md:mb-0">
                  <p class="text-sm font-bold text-slate-500 dark:text-gray-400 uppercase tracking-widest mb-2">Nota Final</p>
                  <h4 class="text-5xl font-black text-slate-800 dark:text-white">{{ myInscripcion?.nota_principal !== null && myInscripcion?.nota_principal !== undefined ? myInscripcion.nota_principal : 'N/A' }} <span v-if="myInscripcion?.nota_principal !== null && myInscripcion?.nota_principal !== undefined" class="text-xl text-slate-400 font-bold">/ 100</span></h4>
                  <p v-if="myInscripcion?.nota_principal === null || myInscripcion?.nota_principal === undefined" class="text-xs text-slate-400 dark:text-gray-500 mt-2 font-medium">Calificación pendiente por el docente.</p>
              </div>
              <div class="flex-shrink-0">
                  <div class="w-24 h-24 rounded-full flex items-center justify-center border-4 shadow-lg bg-white dark:bg-gray-900" :class="(myInscripcion?.nota_principal ?? 0) >= 71 ? 'border-emerald-500 text-emerald-500' : (myInscripcion?.nota_principal !== null && myInscripcion?.nota_principal !== undefined ? 'border-red-500 text-red-500' : 'border-slate-300 text-slate-400')">
                     <span class="material-symbols-outlined text-4xl">{{ (myInscripcion?.nota_principal ?? 0) >= 71 ? 'verified' : (myInscripcion?.nota_principal !== null && myInscripcion?.nota_principal !== undefined ? 'cancel' : 'pending') }}</span>
                  </div>
              </div>
          </div>
      </div>

      <!-- Tab: Certificados -->
      <div v-if="activeTab === 'certificados'" class="animate-in slide-in-from-bottom-4 duration-500 fade-in flex flex-col items-center justify-center py-12 md:py-20 text-center max-w-2xl mx-auto">
        <template v-if="myInscripcion?.estado === 3 || actividad.estado === 'Finalizado'">
            <div class="relative w-32 h-32 mb-8 group">
              <div class="absolute inset-0 bg-umsa-gold/20 dark:bg-yellow-500/10 rounded-full blur-xl group-hover:blur-2xl transition-all duration-500"></div>
              <div class="w-full h-full bg-gradient-to-br from-umsa-gold to-yellow-600 rounded-full flex items-center justify-center shadow-2xl border-4 border-white dark:border-gray-900 relative z-10 transform group-hover:scale-105 transition-transform">
                 <span class="material-symbols-outlined text-white text-5xl">workspace_premium</span>
              </div>
            </div>
            <h3 class="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tight mb-4 text-balance">¡Felicidades por completar el {{ actividad.tipo.toLowerCase() }}!</h3>
            
            <template v-if="miCertificado">
                <p class="text-slate-600 dark:text-gray-400 leading-relaxed mb-8">Has cumplido con todos los requisitos académicos. Tu certificado de participación ya está disponible para descargar.</p>
                <button @click="certificadosStore.descargarCertificado(miCertificado.id)" class="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-4 rounded-xl font-black uppercase tracking-widest text-sm hover:bg-slate-800 dark:hover:bg-gray-100 transition-all shadow-lg flex items-center gap-3">
                  <span class="material-symbols-outlined text-[20px]">download</span>
                  Descargar Certificado
                </button>
            </template>
            <template v-else>
                <p class="text-slate-500 dark:text-gray-400 leading-relaxed mb-4">Has aprobado satisfactoriamente la actividad académica.</p>
                <div class="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/50 p-6 rounded-2xl max-w-md flex items-start gap-3 text-left">
                    <span class="material-symbols-outlined text-amber-500 mt-0.5">info</span>
                    <div>
                        <h4 class="text-xs font-black text-amber-800 dark:text-amber-400 uppercase tracking-wider mb-1">Certificado en Proceso</h4>
                        <p class="text-xs font-medium text-amber-700 dark:text-amber-500 leading-relaxed">Tu certificado está siendo firmado digitalmente por los coordinadores y ponentes asignados. Estará disponible para descarga en esta pestaña muy pronto.</p>
                    </div>
                </div>
            </template>
        </template>
        <template v-else>
            <div class="relative w-24 h-24 mb-6 opacity-60 grayscale">
              <div class="w-full h-full bg-slate-200 dark:bg-gray-800 rounded-full flex items-center justify-center border-4 border-white dark:border-gray-900 relative z-10">
                 <span class="material-symbols-outlined text-slate-400 text-4xl block">workspace_premium</span>
              </div>
            </div>
            <h3 class="text-xl font-black text-slate-500 dark:text-gray-400 uppercase tracking-tight mb-2">Certificado no disponible aún</h3>
            <p class="text-slate-400 dark:text-gray-500 text-sm">El certificado estará disponible al finalizar el {{ actividad.tipo.toLowerCase() || 'curso' }} y cumplir los requisitos de aprobación.</p>
        </template>
      </div>

    </div>
  </div>

  <!-- Modal Pre-inscripción -->
  <div v-if="preinscripcionMenu" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div class="bg-white dark:bg-gray-900 rounded-[2rem] p-8 max-w-md w-full shadow-2xl relative border border-slate-200/50 dark:border-gray-800">
        <button @click="preinscripcionMenu = false" class="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:hover:text-white transition-colors">
            <span class="material-symbols-outlined">close</span>
        </button>
        <h3 class="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight mb-4">Pre-inscripción</h3>
        <p class="text-slate-600 dark:text-gray-400 mb-6 text-sm">Por favor, llene los siguientes datos para solicitar su inscripción.</p>
        
        <div class="space-y-6 max-h-[60vh] overflow-y-auto px-1">
            <!-- SECCIÓN 1: DATOS BASE (PERSONA) -->
            <div v-if="actividad.requisitos?.base" class="p-5 bg-slate-50 dark:bg-gray-800/50 rounded-2xl border border-slate-100 dark:border-gray-800 space-y-4">
                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2 mb-4">Verificación de Datos de Perfil</p>
                <div class="grid grid-cols-1 gap-4">
                    <template v-for="key in ['nombres', 'primer_apellido', 'segundo_apellido', 'documento_identidad', 'email', 'celular', 'genero', 'afiliacion']" :key="key">
                        <div v-if="actividad.requisitos.base[key]" class="flex flex-col">
                            <label class="text-[9px] font-black text-slate-400 uppercase mb-1">
                                {{ key === 'documento_identidad' && datosPerfilEdit[key]?.includes(':') ? (datosPerfilEdit[key].split(':')[0] || 'Documento') : key.toString().replace(/_/g, ' ') }}
                            </label>
                            
                            <!-- Si es Documento Identidad y está bloqueado -->
                            <input v-if="key === 'documento_identidad' && perfilOriginal[key]"
                                   :value="datosPerfilEdit[key]?.includes(':') ? (datosPerfilEdit[key].split(':')[1] || '').trim() : datosPerfilEdit[key]" 
                                   readonly
                                   class="w-full px-4 py-2 text-xs font-bold bg-slate-100 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl outline-none text-slate-500 dark:text-gray-400 cursor-not-allowed transition-all">
                            
                            <!-- Para cualquier otro campo bloqueado -->
                            <input v-else-if="perfilOriginal[key]"
                                   :value="datosPerfilEdit[key]" 
                                   readonly
                                   class="w-full px-4 py-2 text-xs font-bold bg-slate-100 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl outline-none text-slate-500 dark:text-gray-400 cursor-not-allowed transition-all">
                            
                            <!-- Si es Género, mostrar select -->
                            <select v-else-if="key === 'genero'"
                                    v-model="datosPerfilEdit[key]"
                                    required
                                    class="w-full px-4 py-2 text-xs font-bold bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl outline-none focus:border-blue-500 text-slate-800 dark:text-white transition-all">
                                <option value="">Seleccione Género</option>
                                <option :value="0">Masculino</option>
                                <option :value="1">Femenino</option>
                                <option :value="2">Otro / No especifica</option>
                            </select>

                            <!-- Para campos vacíos que deben poder llenarse -->
                            <input v-else
                                   v-model="datosPerfilEdit[key]" 
                                   required
                                   :placeholder="'Ingresa tu ' + key.toString().replace(/_/g, ' ')"
                                   class="w-full px-4 py-2 text-xs font-bold bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl outline-none focus:border-blue-500 text-slate-800 dark:text-white transition-all">
                        </div>
                    </template>
                </div>
            </div>

            <!-- SECCIÓN 2: CAMPOS PERSONALIZADOS -->
            <div v-if="actividad.requisitos?.custom?.length > 0" class="p-5 bg-blue-50/30 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/50 space-y-4">
                <p class="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest border-b border-blue-100 dark:border-blue-800 pb-2 mb-4">Información Adicional Requerida</p>
                <div class="space-y-4">
                    <div v-for="(req, idx) in actividad.requisitos.custom" :key="idx" class="flex flex-col">
                        <label class="text-[9px] font-black text-blue-500 uppercase mb-1">{{ req.label }}</label>
                        
                        <!-- Input tipo Texto -->
                        <input v-if="req.type === 'text' || req.type === 'number'" 
                               v-model="respuestasDinamicas[req.label]" 
                               :type="req.type" 
                               class="w-full px-4 py-2 text-xs font-bold bg-white dark:bg-gray-950 border border-blue-100 dark:border-blue-800/50 rounded-xl outline-none focus:border-blue-500 transition-all">
                        
                        <!-- Input tipo Select -->
                        <select v-else-if="req.type === 'select'" 
                                v-model="respuestasDinamicas[req.label]" 
                                class="w-full px-4 py-2 text-xs font-bold bg-white dark:bg-gray-950 border border-blue-100 dark:border-blue-800/50 rounded-xl outline-none focus:border-blue-500 transition-all">
                            <option value="">Seleccione una opción</option>
                            <option v-for="opt in req.options" :key="opt" :value="opt">{{ opt }}</option>
                        </select>

                        <!-- Input tipo Archivo -->
                        <div v-else-if="req.type === 'file'" class="relative group">
                            <input type="file" 
                                   @change="(e) => handleFileReqChange(e, req.label)"
                                   class="hidden" 
                                   :id="'file-' + idx">
                            <label :for="'file-' + idx" class="w-full px-4 py-3 bg-white dark:bg-gray-950 border-2 border-dashed border-blue-100 dark:border-blue-800/50 rounded-xl flex items-center gap-3 cursor-pointer hover:border-blue-500 hover:bg-blue-50/30 transition-all">
                                <span class="material-symbols-outlined text-blue-500">{{ respuestasDinamicas[req.label] ? 'check_circle' : 'upload_file' }}</span>
                                <span class="text-[10px] font-bold text-slate-500 truncate">
                                    {{ respuestasDinamicas[req.label] ? respuestasDinamicas[req.label].name : 'Subir ' + req.label }}
                                </span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            <!-- SECCIÓN 3: RAZÓN Y TYAN -->
            <div class="space-y-4">
                <div>
                    <label class="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">¿Por qué deseas participar? (Motivación)</label>
                    <textarea v-model="preinscripcionForm.razon" class="w-full border border-slate-200 dark:border-gray-800 rounded-xl p-3 bg-slate-50 dark:bg-gray-950 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-blue-500 transition-colors" rows="2" placeholder="Describe brevemente tu interés..."></textarea>
                </div>
                <div class="flex items-center justify-between p-4 bg-slate-50 dark:bg-gray-800/50 rounded-xl border border-slate-100 dark:border-gray-800">
                    <span class="text-[10px] font-black text-slate-500 dark:text-gray-400 uppercase tracking-widest">¿Eres miembro de la red TYAN?</span>
                    <label class="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" v-model="preinscripcionForm.miembro_tyan" :true-value="1" :false-value="0" class="sr-only peer">
                        <div class="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                </div>
            </div>
        </div>
        
         <div v-if="errorMensaje" class="mt-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-bold rounded-xl border border-red-200 dark:border-red-900/50">
            {{ errorMensaje }}
        </div>
        
        <div class="flex gap-3 mt-8">
            <button @click="preinscripcionMenu = false" class="flex-1 bg-slate-100 dark:bg-gray-800 text-slate-500 dark:text-gray-400 py-4 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-200 dark:hover:bg-gray-700 transition-all">
                Cancelar
            </button>
            <button @click="submitPreinscripcion" :disabled="preinscribiendo" class="flex-[2] bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-4 rounded-xl font-black uppercase tracking-widest text-xs transition-all shadow-lg flex justify-center items-center gap-2">
                <span v-if="preinscribiendo" class="material-symbols-outlined animate-spin text-white">autorenew</span>
                <span>{{ preinscribiendo ? 'Enviando...' : 'Enviar Solicitud' }}</span>
            </button>
        </div>
    </div>
  </div>
</template>
