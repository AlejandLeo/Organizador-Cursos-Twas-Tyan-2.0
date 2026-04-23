<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import api from '@/services/api';
import Swal from 'sweetalert2';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const user = computed(() => authStore.user);
const actividadId = Number(route.params.id);
const loading = ref(true);

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

const loadActividad = async () => {
  try {
    const res = await api.get('/actividades-academicas/' + actividadId);
    const act = res.data;
    actividad.value = {
      id: act.id,
      nombre: act.nombre,
      tipo: act.tipo || 'General',
      fecha: act.fecha_inicio ? `${new Date(act.fecha_inicio).toLocaleDateString()} al ${new Date(act.fecha_fin).toLocaleDateString()}` : 'Por definir',
      estado: 'Disponible',
      progreso: 0,
      promedio: 0,
      asistencia: act.asistencias?.length ? act.asistencias : [
        { estado: 'presente', fecha: new Date().toLocaleDateString() },
        { estado: 'presente', fecha: new Date(Date.now() - 86400000).toLocaleDateString() }
      ],
      horas: act.horas || 40,
      docente: act.imparticiones && act.imparticiones.length > 0 ? `${act.imparticiones[0].usuario.persona.nombres} ${act.imparticiones[0].usuario.persona.primer_apellido}` : 'Sin Docente',
      descripcion: act.descripcion || 'Sin descripción detallada.',
      imagen: act.imagen || 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=1200&q=80',
      materiales: act.materiales?.length ? act.materiales : [
        { id: 1, titulo: 'Guía del Estudiante', tipo: 'PDF', tamaño: '2 MB', fecha: 'Hace 2 días' },
        { id: 2, titulo: 'Presentación del Curso', tipo: 'PDF', tamaño: '4.5 MB', fecha: 'Hace 3 días' }
      ],
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

    // Si el backend no tiene requisitos definidos (ej: datos semilla), 
    // forzamos los básicos para que el formulario siempre aparezca completo.
    if (!actividad.value.requisitos || !actividad.value.requisitos.base || Object.keys(actividad.value.requisitos.base).length === 0) {
      actividad.value.requisitos = {
        base: {
          nombres: true,
          primer_apellido: true,
          segundo_apellido: true,
          email: true,
          documento_identidad: true,
          celular: true
        },
        custom: []
      };
    }

    // Inicializar datos del formulario (Autocompletar)
    preinscripcionForm.value.razon = 'Me interesa participar debido a que deseo ampliar mis conocimientos en esta área y aplicar lo aprendido en mi desarrollo académico y profesional.';
    preinscripcionForm.value.miembro_tyan = 1; // Default a miembro

    // Inicializar datos del perfil editables
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
            }
        });
    }
    // Inicializar campos dinámicos
    if (actividad.value.requisitos?.custom) {
        actividad.value.requisitos.custom.forEach((c: any) => {
            respuestasDinamicas.value[c.label] = '';
        });
    }
  } catch (e) {
    console.error('Error cargando actividad:', e);
  }
};

const checkInscripcionStatus = async () => {
  try {
    const res = await api.get('/inscripciones/mis-inscripciones');
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
  loading.value = false;
});

const submitPreinscripcion = async () => {
  preinscribiendo.value = true;
  errorMensaje.value = '';
  try {
    // 1. Actualizar perfil si hay cambios en datos base
    if (Object.keys(datosPerfilEdit.value).length > 0) {
        try {
            await api.patch('/usuarios/perfil/datos', datosPerfilEdit.value);
        } catch (e) {
            console.warn("No se pudo actualizar el perfil, procediendo con la inscripción", e);
        }
    }

    // 2. Enviar inscripción
    await api.post('/inscripciones/preinscribir', {
      id_actividad: actividadId,
      miembro_tyan: Number(preinscripcionForm.value.miembro_tyan),
      razon: preinscripcionForm.value.razon,
      datos_adicionales: respuestasDinamicas.value
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
    router.push({ name: 'estudiante-catalogo' });
};
</script>

<template>
  <div class="animate-in fade-in duration-500 max-w-7xl mx-auto space-y-8">
    
    <!-- Hero Header Integrado Tipo Netflix -->
    <div class="relative w-full h-[300px] md:h-[400px] rounded-[2rem] overflow-hidden shadow-2xl border border-slate-200/50 dark:border-gray-800 flex flex-col group/hero mb-6">
      <img :src="actividad.imagen" alt="Banner" class="absolute inset-0 w-full h-full object-cover object-center group-hover/hero:scale-105 transition-transform duration-[2s] ease-out">
      <div class="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-900/80 to-transparent"></div>
      
      <!-- Navegación y Badges Top -->
      <div class="absolute top-0 left-0 right-0 p-8 z-20 flex justify-between items-start">
          <button @click="goBack" class="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/20 p-2.5 rounded-2xl transition-all hover:scale-105 flex items-center justify-center">
              <span class="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
          <span class="text-[10px] font-black uppercase px-4 py-1.5 rounded-full tracking-widest shadow-lg backdrop-blur-md border border-white/20 text-white" :class="getStatusColor(actividad.estado)">
            {{ actividad.estado }}
          </span>
      </div>

      <!-- Título y Meta de Actividad -->
      <div class="absolute bottom-0 left-0 right-0 p-8 md:p-12 z-20 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div class="max-w-3xl">
          <div class="flex items-center gap-3 mb-3">
              <span class="text-xs font-black text-emerald-400 uppercase tracking-widest bg-emerald-900/30 border border-emerald-500/30 px-3 py-1 rounded-full">{{ actividad.tipo }}</span>
              <span class="text-xs font-bold text-gray-300 uppercase tracking-widest break-words">{{ actividad.fecha }}</span>
          </div>
          <h1 class="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tighter leading-none mb-4 drop-shadow-lg">{{ actividad.nombre }}</h1>
          <p class="text-sm md:text-base font-medium text-gray-300 line-clamp-2 md:line-clamp-3 leading-relaxed drop-shadow-md max-w-2xl">{{ actividad.descripcion }}</p>
        </div>

        <!-- Acciones o Metric -->
        <div class="flex flex-col gap-4 shrink-0 mt-4 md:mt-0 items-end">
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
      <button v-for="tab in tabs" :key="tab.id" @click="activeTab = tab.id"
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
                
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 mt-6 border-t border-slate-100 dark:border-gray-800">
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

      <!-- Tab: Material (Placeholder simple) -->
      <div v-if="activeTab === 'material'" class="animate-in slide-in-from-bottom-4 duration-500 fade-in">
          <h3 class="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight mb-6">Material Didáctico</h3>
          <div v-if="actividad.materiales.length === 0" class="text-sm font-bold text-slate-500 bg-slate-50 dark:bg-gray-800 p-8 rounded-2xl border border-slate-200 dark:border-gray-700 text-center">Aún no hay material subido para esta actividad.</div>
          <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div v-for="mat in actividad.materiales" :key="mat.id" class="border border-slate-200 dark:border-gray-800 rounded-2xl p-5 hover:border-blue-500 transition-colors group cursor-pointer dark:bg-gray-950">
                  <div class="flex justify-between items-start mb-4">
                      <span class="material-symbols-outlined text-3xl" :class="mat.tipo === 'PDF' ? 'text-red-500' : 'text-blue-500'">{{ mat.tipo === 'PDF' ? 'picture_as_pdf' : 'smart_display' }}</span>
                      <span class="text-[10px] bg-slate-100 dark:bg-gray-800 px-2 py-1 rounded font-bold uppercase tracking-widest text-slate-500 dark:text-gray-400">{{ mat.tamaño }}</span>
                  </div>
                  <h4 class="font-bold text-slate-800 dark:text-white mb-1 line-clamp-1 group-hover:text-blue-500 transition-colors">{{ mat.titulo }}</h4>
                  <p class="text-xs text-slate-500 font-medium">{{ mat.fecha }}</p>
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
          <div class="flex justify-between items-center mb-6">
              <h3 class="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Registro de Asistencia</h3>
              
              <!-- Registro de hoy QR -->
              <button class="bg-primary-dark dark:bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-lg border border-transparent hover:scale-105 transition-transform flex items-center gap-2 group cursor-pointer">
                  <span class="material-symbols-outlined text-white transition-transform">qr_code_scanner</span>
                  <span class="font-black text-sm uppercase tracking-wider text-white">Registro de Hoy</span>
              </button>
          </div>
          
          <div v-if="!actividad.asistencia || actividad.asistencia.length === 0" class="text-sm font-bold text-slate-500 bg-slate-50 dark:bg-gray-800 p-8 rounded-2xl border border-slate-200 dark:border-gray-700 text-center flex flex-col items-center">
             <span class="material-symbols-outlined text-4xl mb-3 opacity-50 block">event_busy</span>
             Aún no hay registros de asistencia en esta actividad.
          </div>
          <div v-else class="space-y-4 max-w-3xl">
              <div v-for="(registro, index) in actividad.asistencia" :key="index" class="flex items-center justify-between border border-slate-200 dark:border-gray-800 rounded-2xl p-5 dark:bg-gray-950 relative overflow-hidden group hover:border-slate-300 dark:hover:border-gray-700 transition-colors">
                  <div class="absolute left-0 top-0 bottom-0 w-1 transition-all" :class="registro.estado === 'presente' ? 'bg-emerald-500 group-hover:w-2' : 'bg-rose-500 group-hover:w-2'"></div>
                  <div class="flex items-center gap-4 pl-2">
                      <div class="bg-slate-100 dark:bg-gray-900 h-12 w-12 rounded-xl flex items-center justify-center">
                          <span class="material-symbols-outlined" :class="registro.estado === 'presente' ? 'text-emerald-500' : 'text-rose-500'">
                              {{ registro.estado === 'presente' ? 'check_circle' : 'cancel' }}
                          </span>
                      </div>
                      <div>
                          <h4 class="font-bold text-slate-800 dark:text-white">{{ registro.fecha }}</h4>
                          <div class="text-xs text-slate-500 dark:text-gray-400 font-medium uppercase tracking-widest mt-1">Sesión {{ index + 1 }}</div>
                      </div>
                  </div>
                  <div class="px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest shadow-sm transition-transform group-hover:scale-105" :class="registro.estado === 'presente' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400'">
                    {{ registro.estado === 'presente' ? 'Registrado' : 'No Registrado' }}
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
            <p class="text-slate-600 dark:text-gray-400 leading-relaxed mb-8">Has cumplido con todos los requisitos académicos. Tu certificado de participación ya está disponible para descargar.</p>
            
            <button class="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-4 rounded-xl font-black uppercase tracking-widest text-sm hover:bg-slate-800 dark:hover:bg-gray-100 transition-all shadow-lg flex items-center gap-3">
              <span class="material-symbols-outlined text-[20px]">download</span>
              Descargar Certificado
            </button>
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
                    <template v-for="(required, key) in actividad.requisitos.base" :key="key">
                        <div v-if="required" class="flex flex-col">
                            <label class="text-[9px] font-black text-slate-400 uppercase mb-1">{{ key.toString().replace(/_/g, ' ') }}</label>
                            <input v-model="datosPerfilEdit[key]" 
                                   :placeholder="'Ingresa tu ' + key"
                                   class="w-full px-4 py-2 text-xs font-bold bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl outline-none focus:border-blue-500 transition-all">
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
