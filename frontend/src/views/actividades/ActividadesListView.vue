<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useEventoStore } from '@/stores/eventoStore';
import api from '@/services/api';
import Swal from 'sweetalert2';

const router = useRouter();
const route = useRoute();
const eventoStore = useEventoStore();

// --- LÓGICA DE GESTIÓN DE EVENTOS (FUSIÓN MAESTRA) ---
const isCreatingEvento = ref(false);
const isEditingEvento = ref(false);
const editEventoId = ref<number | null>(null);
const ponentesDB = ref<any[]>([]);
const gradosAcademicosDB = ref<any[]>([]);
const previewEventoImg = ref<string | null>(null);
const showRegistroRapidoPonente = ref(false);
const filtroPonente = ref('');

const formEvento = ref({
  nombre: '',
  descripcion: '',
  gestion: new Date().getFullYear().toString(),
  fecha_inicio: '',
  fecha_fin: '',
  ubicacion: '',
  direccion: '',
  estado: 2,
  fondo_img: null as any,
  google_maps_link: '',
  sobre_evento_1: '',
  sobre_evento_2: '',
  frase_destacada: '',
  ponentes_seleccionados: [] as number[],
  cronograma: '',
  cronograma_lista: [] as any[],
  version: ''
});

const ponentesFiltrados = computed(() => {
  if (!filtroPonente.value) return ponentesDB.value;
  const f = filtroPonente.value.toLowerCase();
  return ponentesDB.value.filter(p => p.displayName.toLowerCase().includes(f));
});

const resetFormEvento = () => {
    formEvento.value = {
        nombre: '', descripcion: '', gestion: new Date().getFullYear().toString(),
        fecha_inicio: '', fecha_fin: '', ubicacion: '', direccion: '',
        estado: 2, fondo_img: null, google_maps_link: '',
        sobre_evento_1: '', sobre_evento_2: '', frase_destacada: '',
        ponentes_seleccionados: [], cronograma: '', cronograma_lista: [], version: ''
    };
    previewEventoImg.value = null;
};

const agregarDiaEvento = () => {
    formEvento.value.cronograma_lista.push({
        day: formEvento.value.cronograma_lista.length + 1,
        name: `Día ${formEvento.value.cronograma_lista.length + 1}`,
        date: '',
        events: [{ time: '08:00', title: '' }]
    });
};

const eliminarDiaEvento = (idx: number) => {
    formEvento.value.cronograma_lista.splice(idx, 1);
    formEvento.value.cronograma_lista.forEach((d, i) => d.day = i + 1);
};

const agregarActividadEvento = (dayIdx: number) => {
    formEvento.value.cronograma_lista[dayIdx].events.push({ time: '09:00', title: '' });
};

const eliminarActividadEvento = (dayIdx: number, actIdx: number) => {
    formEvento.value.cronograma_lista[dayIdx].events.splice(actIdx, 1);
};

const nuevoPonenteQuick = ref({ nombres: '', primer_apellido: '', email: '', profesion: '', id_grado_academico: null, id_rol: 5 });

const registrarPonenteQuick = async () => {
    try {
        await api.post('/usuarios/ponente', { ...nuevoPonenteQuick.value, password: 'Temporal123*' });
        Swal.fire('Éxito', 'Personal registrado', 'success');
        showRegistroRapidoPonente.value = false;
        fetchPonentesYGrados();
    } catch (e) { Swal.fire('Error', 'No se pudo registrar', 'error'); }
};

const fetchPonentesYGrados = async () => {
    try {
        const [resP, resC, resG] = await Promise.all([
            api.get('/usuarios?rol=Ponente&limit=100'),
            api.get('/usuarios?rol=Coordinador&limit=100'),
            api.get('/grados-academicos')
        ]);
        const mapUser = (u: any, role: string) => {
            const persona = u.persona || {};
            const gaObj = u.afiliaciones?.[0]?.gradoAcademico || {};
            const prefijo = gaObj.abreviacion ? `${gaObj.abreviacion}. ` : '';
            return { ...u, roleLabel: role, displayName: `${prefijo}${persona.nombres || ''} ${persona.primer_apellido || ''}`.trim() };
        };
        ponentesDB.value = [...(resP.data?.data || resP.data || []).map((u:any) => mapUser(u, 'Ponente')), ...(resC.data?.data || resC.data || []).map((u:any) => mapUser(u, 'Coordinador'))];
        gradosAcademicosDB.value = resG.data?.data || resG.data || [];
    } catch (e) { console.error(e); }
};

const onEventoFileChange = (e: any) => {
    const file = e.target.files[0];
    if (file) {
        formEvento.value.fondo_img = file;
        previewEventoImg.value = URL.createObjectURL(file);
    }
};

const handleSaveEvento = async () => {
    try {
        isLoading.value = true;
        const formData = new FormData();
        formData.append('nombre', formEvento.value.nombre);
        formData.append('gestion', formEvento.value.gestion);
        formData.append('version', formEvento.value.version || '');
        formData.append('fecha_inicio', formEvento.value.fecha_inicio);
        formData.append('fecha_fin', formEvento.value.fecha_fin);
        formData.append('ubicacion', formEvento.value.ubicacion);
        formData.append('direccion', formEvento.value.direccion);
        formData.append('estado', formEvento.value.estado.toString());
        formData.append('google_maps_link', formEvento.value.google_maps_link);
        formData.append('sobre_evento_1', formEvento.value.sobre_evento_1);
        formData.append('sobre_evento_2', formEvento.value.sobre_evento_2);
        formData.append('frase_destacada', formEvento.value.frase_destacada);

        // Cronograma
        const cleanedCronograma = formEvento.value.cronograma_lista.map(d => ({
            ...d,
            events: d.events.filter((e:any) => e.title?.trim())
        })).filter(d => d.events.length > 0);
        formData.append('cronograma', JSON.stringify(cleanedCronograma));

        formData.append('descripcion', formEvento.value.descripcion);

        if (formEvento.value.fondo_img instanceof File) {
            formData.append('imagen_fondo', formEvento.value.fondo_img);
            formData.append('imagen_portada', formEvento.value.fondo_img);
        }

        if (isEditingEvento.value && editEventoId.value) {
            await api.put(`/eventos/${editEventoId.value}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        } else {
            await api.post('/eventos', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        }

        Swal.fire({ icon: 'success', title: '¡ÉXITO!', text: 'Gestión guardada con todas sus secciones.' });
        isCreatingEvento.value = false;
        fetchEventos();
        eventoStore.fetchEventosInfo();
    } catch (err) {
        Swal.fire('Error', 'No se pudo guardar el evento', 'error');
    } finally { isLoading.value = false; }
};

const editarEvento = (evento: any) => {
    isEditingEvento.value = true;
    editEventoId.value = evento.id;
    const rawDesc = evento.descripcion || '';
    const parts = rawDesc.split('\n[PONENTES_METADATA]:');
    
    formEvento.value = {
        nombre: evento.nombreCorto,
        descripcion: parts[0] || '',
        gestion: (evento.gestion || ev.version)?.toString(),
        version: evento.version_slogan || evento.version || '',
        fecha_inicio: evento.fecha_inicio ? evento.fecha_inicio.split('T')[0] : '',
        fecha_fin: evento.fecha_fin ? evento.fecha_fin.split('T')[0] : '',
        ubicacion: evento.ubicacion || '',
        direccion: evento.direccion || '',
        google_maps_link: evento.google_maps_link || '',
        sobre_evento_1: evento.sobre_evento_1 || '',
        sobre_evento_2: evento.sobre_evento_2 || '',
        frase_destacada: evento.frase_destacada || '',
        estado: evento.estado === 'Activo' ? 1 : (evento.estado === 'Cerrado' ? 0 : 2),
        fondo_img: null,
        ponentes_seleccionados: [],
        cronograma: '',
        cronograma_lista: []
    };

    if (evento.cronograma) {
        try { formEvento.value.cronograma_lista = typeof evento.cronograma === 'string' ? JSON.parse(evento.cronograma) : evento.cronograma; } catch(e) {}
    }

    previewEventoImg.value = evento.imagen;
    isCreatingEvento.value = true;
};

const eliminarEvento = async (id: number, nombre: string) => {
    const res = await Swal.fire({
        title: '¿ELIMINAR EVENTO?',
        text: `Se borrará "${nombre}" y todas sus actividades vinculadas. Esta acción es irreversible.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        confirmButtonText: 'SÍ, ELIMINAR TODO'
    });
    if (res.isConfirmed) {
        try {
            await api.delete(`/eventos/${id}`);
            fetchEventos();
            eventoStore.fetchEventosInfo();
            Swal.fire('Eliminado', 'El evento ha sido borrado.', 'success');
        } catch (e) { Swal.fire('Error', 'No se pudo eliminar el evento', 'error'); }
    }
};

const eventosPublicados = ref<any[]>([]);

const eventosFiltrados = computed(() => {
    // Ahora mostramos SIEMPRE todos los eventos para que sea un catálogo global,
    // pero si el usuario busca algo, filtramos por nombre de actividad o evento.
    const search = (filtroBusqueda.value || '').toLowerCase();
    if (!search) return eventosPublicados.value;

    return eventosPublicados.value.map(ev => ({
        ...ev,
        actividades: ev.actividades.filter((a: any) => 
            a.title.toLowerCase().includes(search) || 
            ev.nombreCorto.toLowerCase().includes(search)
        )
    })).filter(ev => ev.actividades.length > 0 || ev.nombreCorto.toLowerCase().includes(search));
});

const isCreating = ref(false);
const isEditingActividad = ref(false);
const editActividadId = ref<number | null>(null);
const currentStep = ref(1);
const isLoading = ref(false);
const filtroBusqueda = ref('');

const fetchEventos = async () => {
    try {
        isLoading.value = true;
        const res = await api.get('/eventos');
        eventosPublicados.value = (res.data || []).map((ev: any) => ({
            ...ev,
            nombreCorto: ev.nombre,
            version: ev.gestion,
            imagen: ev.imagen_fondo || 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1600&q=80', // Fallback
            estado: ev.estado === 1 ? 'Activo' : 'Cerrado',
            colorEstado: ev.estado === 1 ? 'bg-emerald-500 text-white' : 'bg-slate-500 text-white',
            mostrarActividades: true,
            actividades: (ev.actividades || []).map((act: any) => ({
                id: act.id,
                title: act.nombre,
                version: act.version, // Capturar versión de la DB
                status: 'Activo',
                type: act.tipo || 'Curso',
                date: act.fecha_inicio ? new Date(act.fecha_inicio).toLocaleDateString() : 'Pendiente',
                students: act.inscripciones?.length || 0,
                modules: 1,
                image: act.imagen || 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&q=80'
            }))
        }));
    } catch (error) {
        console.error("Error fetching eventos:", error);
    } finally {
        isLoading.value = false;
    }
};

const nuevaActividad = ref({
    nombre: '',
    tipo: 'Diplomado',
    tipoPersonalizado: '',
    descripcion: '',
    id_evento: null as number | null,
    min_nota: 71,
    min_asistencia: 80,
    modalidad: 'Presencial',
    fecha_inicio: '',
    fecha_fin: '',
    sesiones: [] as any[]
});

const resetNuevaActividad = (eventoId: number) => {
    isEditingActividad.value = false;
    editActividadId.value = null;
    nuevaActividad.value = {
        nombre: '',
        tipo: 'Diplomado',
        tipoPersonalizado: '',
        descripcion: '',
        id_evento: eventoId,
        min_nota: 71,
        min_asistencia: 80,
        modalidad: 'Presencial',
        fecha_inicio: '',
        fecha_fin: '',
        sesiones: []
    };
    imagenArchivo.value = null;
    imagenPreview.value = null;
    currentStep.value = 1;
};

const editarActividad = async (act: any) => {
    try {
        isEditingActividad.value = true;
        editActividadId.value = act.id;
        
        // Cargamos lo que ya tenemos
        nuevaActividad.value = {
            nombre: act.title,
            tipo: act.type || 'Curso',
            tipoPersonalizado: '',
            descripcion: act.descripcion || '',
            id_evento: act.id_evento, // Asegurarnos que el objeto tenga esto
            min_nota: act.min_nota || 71,
            min_asistencia: act.min_asistencia || 80,
            modalidad: act.modalidad || 'Presencial',
            fecha_inicio: act.fecha_inicio_raw || '', // Necesitaremos la fecha y descripción real
            fecha_fin: act.fecha_fin_raw || '',
            sesiones: []
        };
        
        // Intentar obtener descripción completa y campos extras si no están
        const res = await api.get(`/actividades-academicas/${act.id}`);
        const fullAct = res.data;
        
        nuevaActividad.value.descripcion = fullAct.descripcion || '';
        nuevaActividad.value.fecha_inicio = fullAct.fecha_inicio ? fullAct.fecha_inicio.split('T')[0] : '';
        nuevaActividad.value.fecha_fin = fullAct.fecha_fin ? fullAct.fecha_fin.split('T')[0] : '';
        nuevaActividad.value.id_evento = fullAct.evento?.id || act.id_evento;

        imagenPreview.value = fullAct.imagen || null;
        isCreating.value = true;
        currentStep.value = 1;
    } catch (e) {
        Swal.fire('Error', 'No se pudo cargar la actividad', 'error');
    }
};

const eliminarActividad = async (id: number, nombre: string) => {
    const res = await Swal.fire({
        title: '¿ELIMINAR ACTIVIDAD?',
        text: `Se borrará "${nombre}". Los inscritos podrían verse afectados.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        confirmButtonText: 'SÍ, ELIMINAR'
    });

    if (res.isConfirmed) {
        try {
            await api.delete(`/actividades-academicas/${id}`);
            fetchEventos();
            Swal.fire('Eliminado', 'La actividad ha sido borrada.', 'success');
        } catch (e) { Swal.fire('Error', 'No se pudo eliminar la actividad', 'error'); }
    }
};

const imagenArchivo = ref<File | null>(null);
const imagenPreview = ref<string | null>(null);

const handleFileUpload = (event: any) => {
    const file = event.target.files[0];
    if (file) {
        imagenArchivo.value = file;
        imagenPreview.value = URL.createObjectURL(file);
    }
};

const nuevaSesion = ref({
    dia: 'Lunes',
    hora_inicio: '19:00',
    hora_fin: '21:00'
});

const agregarSesion = () => {
    nuevaActividad.value.sesiones.push({ ...nuevaSesion.value });
};

const eliminarSesion = (index: number) => {
    nuevaActividad.value.sesiones.splice(index, 1);
};

const publicarActividad = async () => {
    try {
        if (!nuevaActividad.value.id_evento) {
            Swal.fire('Error', 'Debes seleccionar un evento primero', 'error');
            return;
        }

        isLoading.value = true;
        
        // --- ALERTA DE PROCESANDO (PREMIUM) ---
        Swal.fire({
            title: 'Publicando Actividad',
            html: 'Estamos preparando todo en el servidor...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            },
            customClass: {
                popup: 'rounded-[2rem] border-none shadow-2xl dark:bg-gray-900',
                title: 'font-black uppercase tracking-tight text-primary-dark dark:text-white',
                htmlContainer: 'font-medium text-slate-500 dark:text-gray-400'
            }
        });

        // Determinar el tipo final (si es Otro, usar el personalizado)
        const tipoFinal = nuevaActividad.value.tipo === 'Otro' 
            ? nuevaActividad.value.tipoPersonalizado 
            : nuevaActividad.value.tipo;

        // PAYLOAD LIMPIO: Ajustado estrictamente al DTO del backend
        const payload = {
            nombre: nuevaActividad.value.nombre,
            tipo: tipoFinal || 'Actividad',
            descripcion: nuevaActividad.value.descripcion,
            id_evento: Number(nuevaActividad.value.id_evento),
            fecha_inicio: nuevaActividad.value.fecha_inicio || null,
            fecha_fin: nuevaActividad.value.fecha_fin || null
        };

        if (isEditingActividad.value && editActividadId.value) {
            await api.put(`/actividades-academicas/${editActividadId.value}`, payload);
        } else {
            await api.post('/actividades-academicas', payload);
        }

        // --- ALERTA EXITOSA (PREMIUM) ---
        Swal.fire({
            icon: 'success',
            title: '¡PUBLICACIÓN EXITOSA!',
            html: `La actividad <b>"${nuevaActividad.value.nombre}"</b> ya está disponible en el catálogo.`,
            confirmButtonText: 'EXCELENTE',
            confirmButtonColor: '#003B71',
            customClass: {
                popup: 'rounded-[2rem] border-none shadow-2xl dark:bg-gray-900',
                title: 'font-black uppercase tracking-tight text-emerald-600 dark:text-emerald-400',
                confirmButton: 'rounded-xl px-10 py-3 font-black text-xs uppercase tracking-widest'
            }
        });

        isCreating.value = false;
        
        // Resetear form
        imagenArchivo.value = null;
        imagenPreview.value = null;
        nuevaActividad.value.sesiones = [];
        
        fetchEventos();
    } catch (error: any) {
        console.error(error);
        // --- ALERTA ERROR (PREMIUM) ---
        Swal.fire({
            icon: 'error',
            title: 'ERROR DE PUBLICACIÓN',
            text: error.response?.data?.message || 'Ocurrió un problema técnico inesperado.',
            confirmButtonText: 'ENTENDIDO',
            confirmButtonColor: '#A38628',
            customClass: {
                popup: 'rounded-[2rem] border-none shadow-2xl dark:bg-gray-900',
                title: 'font-black uppercase tracking-tight text-red-600 dark:text-red-400',
                confirmButton: 'rounded-xl px-10 py-3 font-black text-xs uppercase tracking-widest'
            }
        });
    } finally {
        isLoading.value = false;
    }
};

const eventoActual = computed(() => {
    return eventosPublicados.value.find(ev => ev.id === nuevaActividad.value.id_evento);
});

onMounted(async () => {
    await eventoStore.fetchEventosInfo();
    fetchEventos();
    fetchPonentesYGrados();
});

// Refrescar listado si el filtro global cambia
watch(() => eventoStore.selectedEventoId, () => {
    fetchEventos();
});

const toggleActividades = (evento: any) => {
  evento.mostrarActividades = !evento.mostrarActividades;
};

// Agrupar actividades por Tipo para la vista estilo Netflix
const getActividadesAgrupadas = (actividades: any[]) => {
  const grupos: Record<string, any[]> = {};
  actividades.forEach((act: any) => {
    if (!grupos[act.type]) {
      grupos[act.type] = [];
    }
    grupos[act.type]!.push(act);
  });
  return grupos;
};

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
    <div v-show="!isCreating && !isCreatingEvento" id="view-listado" class="space-y-8">
      <div class="flex justify-center mb-8">
        <div class="relative w-full max-w-2xl group">
          <label class="absolute -top-3 left-6 px-2 bg-[#f8f9fc] dark:bg-black z-10 text-[9px] font-black text-slate-400 uppercase tracking-widest italic transition-colors">Buscador Inteligente de Cursos</label>
          <span class="absolute inset-y-0 left-5 flex items-center text-slate-400">
            <span class="material-symbols-outlined text-xl group-focus-within:text-umsa-blue transition-colors">search</span>
          </span>
          <input v-model="filtroBusqueda" class="w-full pl-14 pr-6 py-4 bg-white dark:bg-gray-900 border-2 border-slate-200 dark:border-gray-800 rounded-full shadow-sm text-sm focus:ring-4 focus:ring-umsa-blue/10 focus:border-umsa-blue outline-none transition-all font-bold text-primary-dark dark:text-gray-200 placeholder-slate-400" placeholder="Busca Actividades Académicas..." type="text">
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
        <div v-else class="flex items-center gap-4">
          <h2 class="text-3xl font-black text-primary-dark dark:text-white uppercase italic">Actividades Académicas</h2>
        </div>
        
        <div class="flex items-center gap-3">
          <!-- ÚNICO BOTÓN MAESTRO: NUEVO EVENTO -->
          <button @click="isCreatingEvento = true; isEditingEvento = false; resetFormEvento()" 
            class="bg-blue-600 hover:bg-blue-700 text-white font-black px-8 py-4 rounded-2xl text-[12px] uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:shadow-blue-500/40 hover:-translate-y-1 active:translate-y-0 transition-all flex items-center gap-3">
            <span class="material-symbols-outlined text-[24px]">add_business</span> NUEVO EVENTO
          </button>
        </div>
      </div>

      
      <div v-for="evento in eventosFiltrados" :key="evento.id" class="w-full bg-white dark:bg-gray-900 rounded-[2rem] overflow-hidden shadow-sm border border-slate-100 dark:border-gray-800 mb-12 flex flex-col group/card">
        
        <!-- Header Evento Banner (Estilo Netflix) -->
        <div class="relative w-full h-[320px] overflow-hidden">
          <img :src="evento.imagen" :alt="evento.nombreCorto" class="w-full h-full object-cover object-center group-hover/card:scale-105 transition-transform duration-[1.5s] ease-out">
          <div class="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/60 to-transparent"></div>
          
          <div class="absolute bottom-0 left-0 right-0 p-8 pt-24 z-20 flex flex-col">
            <span class="mb-3" :class="[evento.colorEstado, 'text-[8px] font-black uppercase px-3 py-1 rounded-full tracking-widest w-fit shadow-lg backdrop-blur-md border']">
              {{ evento.estado }}
            </span>
            <div class="flex items-end justify-between">
              <div>
                <p class="text-xs font-bold text-umsa-gold dark:text-blue-400 uppercase tracking-widest mb-2">{{ evento.version }}</p>
                <h1 class="text-4xl md:text-5xl font-black text-white tracking-tighter leading-none mb-4">{{ evento.nombreCorto }}</h1>
                <p class="text-sm font-medium text-gray-300 max-w-2xl line-clamp-2 leading-relaxed">{{ evento.descripcion }}</p>
              </div>

              <!-- ACCIONES DE EVENTO Y ACORDEÓN -->
              <div class="flex items-center gap-3 z-30 relative">
                <button @click="editarEvento(evento)" class="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/20 px-4 py-3 rounded-xl transition-all shadow-lg flex items-center gap-2 group/btn cursor-pointer" title="Configurar Eventos">
                   <span class="material-symbols-outlined text-[18px]">settings</span>
                </button>
                <button @click="eliminarEvento(evento.id, evento.nombreCorto)" class="bg-red-500/20 hover:bg-red-500/40 backdrop-blur-md text-white border border-red-500/30 px-4 py-3 rounded-xl transition-all shadow-lg flex items-center gap-2 group/btn cursor-pointer" title="Eliminar Evento">
                   <span class="material-symbols-outlined text-[18px]">delete</span>
                </button>

                <div class="h-8 w-px bg-white/20 mx-1"></div>

                <button @click="resetNuevaActividad(evento.id); isCreating = true" class="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl transition-all shadow-lg flex items-center gap-2 font-black text-[10px] uppercase tracking-widest cursor-pointer">
                   <span class="material-symbols-outlined text-[18px]">add_circle</span> Nueva Actividad
                </button>

                <button @click="toggleActividades(evento)" class="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/20 px-6 py-3 rounded-xl transition-all shadow-lg flex items-center gap-2 group/btn cursor-pointer">
                  <span class="text-xs font-bold uppercase tracking-widest">{{ evento.mostrarActividades ? 'Ocultar' : 'Ver' }} Actividades</span>
                  <span class="material-symbols-outlined text-[16px] transition-transform duration-300" :class="evento.mostrarActividades ? 'rotate-180' : ''">expand_more</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Grid de Actividades Académicas (Estilo Catálogo Horizontal) -->
        <div v-show="evento.mostrarActividades" class="py-8 bg-slate-50 dark:bg-gray-950/50 w-full animate-in slide-in-from-top-4 duration-500 fade-in border-t border-slate-100 dark:border-gray-900">
          
          <!-- Botón Superior General Crear Actividad y Certificados -->
          <div class="px-8 pb-6 flex justify-start lg:justify-between items-center mb-8">
            <h3 class="hidden lg:block text-lg font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest italic">Actividades Académicas del Evento</h3>
          </div>

          <div v-for="(acts, categoria) in getActividadesAgrupadas(evento.actividades)" :key="categoria" class="mb-10 w-full overflow-hidden">
            <!-- Row Header -->
            <div class="flex items-end justify-between px-8 mb-4">
              <div>
                <h3 class="text-xl md:text-2xl font-black text-primary-dark dark:text-white uppercase tracking-tighter">{{ categoria }}</h3>
                <p class="text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-widest mt-1">Explorar {{ (acts as any[]).length }} disponibles</p>
              </div>
              <button @click="isCreating = true; nuevaActividad.id_evento = evento.id; nuevaActividad.tipo = String(categoria); currentStep = 1;" class="text-[10px] font-black uppercase tracking-widest bg-white dark:bg-gray-800 hover:bg-slate-100 dark:hover:bg-gray-700 text-slate-600 dark:text-gray-300 border border-slate-200 dark:border-gray-700 px-4 py-2 rounded-xl transition-all flex items-center gap-2 relative z-20 cursor-pointer shadow-sm hover:shadow-md">
                <span class="material-symbols-outlined text-[14px]">add</span> Crear {{ categoria }}
              </button>
            </div>

            <!-- Horizontal Scroll Row -->
            <div class="flex overflow-x-auto gap-6 px-8 pb-8 pt-2 snap-x snap-mandatory flex-nowrap" style="scrollbar-width: none; -ms-overflow-style: none;">
              <!-- Tarjeta -->
              <div v-for="act in acts" :key="act.id" @click="openDetalleCurso(act.id)" class="flex-none w-[280px] md:w-[320px] bg-white dark:bg-gray-900 rounded-[1.5rem] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-slate-200/60 dark:border-gray-800 hover:border-primary-light/50 dark:hover:border-gray-600 transition-all hover:-translate-y-1 hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] cursor-pointer group flex flex-col snap-start relative">
                
                <div class="relative h-48 w-full overflow-hidden shrink-0">
                  <div class="absolute inset-0 bg-primary-dark/10 group-hover:bg-transparent transition-colors z-10"></div>
                  <img :src="act.imagen || act.image" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" :alt="act.title">   
                  
                  <!-- ACCIONES RAPIDAS (FLOTANTES) -->
                  <div class="absolute top-3 left-3 z-30 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0 duration-300">
                    <button @click.stop="editarActividad(act)" class="p-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-lg shadow-lg text-umsa-blue hover:scale-110 transition-all border border-blue-50/20" title="Editar Actividad">
                        <span class="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                    <button @click.stop="eliminarActividad(act.id, act.title)" class="p-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-lg shadow-lg text-red-500 hover:scale-110 transition-all border border-red-50/20" title="Eliminar Actividad">
                        <span class="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>

                  <span class="absolute top-3 right-3 z-20 text-[8px] font-black uppercase px-2 py-1 rounded-md tracking-widest shadow-sm bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm" :class="getStatusColor(act.status)">
                    {{ act.status }}
                  </span>
                  <!-- Suave sombra inferior para que conecte con la tarjeta blanca -->
                  <div class="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-white dark:from-gray-900 to-transparent z-10 opacity-60"></div>
                </div>

                <div class="p-5 flex flex-col flex-1 relative z-20 bg-white dark:bg-gray-900">
                  <h3 class="text-sm font-black text-slate-800 dark:text-white leading-tight mb-3 group-hover:text-primary-light dark:group-hover:text-blue-400 transition-colors line-clamp-2 block h-[2.5rem]">{{ act.title }}</h3> 

                  <div class="mt-auto flex flex-col gap-3 pt-3 border-t border-slate-100 dark:border-gray-800">
                    <div class="flex flex-wrap items-center gap-2">
                      <span class="text-[9px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-widest border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800 px-2 py-0.5 rounded-md">{{ act.date }}</span>
                    </div>
                    <div class="flex justify-between items-center text-slate-500 dark:text-gray-400">
                      <div class="flex items-center">   
                        <span class="material-symbols-outlined text-[16px] mr-1.5 text-primary-light dark:text-blue-400">groups</span>
                        <span class="text-[10px] font-bold">{{ act.students }} Inscritos</span>    
                      </div>
                      <div class="flex items-center">   
                        <span class="material-symbols-outlined text-[16px] mr-1.5 text-emerald-500">view_module</span>
                        <span class="text-[10px] font-bold">{{ act.modules }} Mód.</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
          
          <div v-if="Object.keys(getActividadesAgrupadas(evento.actividades)).length === 0" class="px-8 py-10 text-center">
            <p class="text-sm font-bold text-gray-500 uppercase tracking-widest">No hay actividades publicadas para esta categoría.</p>
          </div>
        </div>
      </div>
    </div>
    
    <div v-show="isCreating" id="view-creacion" class="space-y-10 animate-in fade-in duration-500">
      
      <div class="flex items-center justify-between border-b border-slate-200 dark:border-gray-800 pb-6">
          <div>
              <h2 class="text-3xl font-black text-primary-dark dark:text-white tracking-tighter uppercase italic">Configurar Nueva Actividad</h2>
              <p class="text-slate-400 dark:text-gray-500 font-medium mt-1 text-sm">Diseño, reglas y horarios del curso.</p>
          </div>
          <button @click="isCreating = false" class="flex items-center gap-2 px-6 py-2.5 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 text-slate-500 dark:text-gray-400 font-black text-[10px] uppercase rounded-xl hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-200 transition-all shadow-sm">
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
              <div class="flex items-center justify-between mb-8">
                  <h3 class="text-xl font-black text-primary-dark dark:text-white uppercase italic">1. Diseño de la Actividad</h3>
                  <div class="flex flex-col items-end">
                      <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Contexto del Evento</span>
                      <div v-if="eventoActual" class="flex items-center gap-2">
                          <span class="text-[10px] font-bold text-umsa-blue bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-md border border-blue-100 dark:border-blue-800">{{ eventoActual.nombreCorto }}</span>
                          <span class="text-[10px] font-bold text-slate-500 dark:text-gray-400">/ {{ eventoActual.version }}</span>
                      </div>
                  </div>
              </div>
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  <div class="space-y-6">
                      <div>
                          <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Nombre Oficial de la Actividad</label>
                          <input v-model="nuevaActividad.nombre" type="text" placeholder="Ej: Especialidad en Microbiología..." class="w-full px-5 py-3.5 bg-slate-50 dark:bg-gray-800 border-2 border-slate-100 dark:border-gray-700 rounded-2xl focus:border-umsa-blue outline-none transition-all font-bold text-sm">
                      </div>
                      <div>
                          <label class="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest block mb-2">Tipo de Actividad</label>
                          <select v-model="nuevaActividad.tipo" class="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-umsa-blue font-bold text-primary-dark dark:text-gray-200 uppercase">
                              <option value="Diplomado">Diplomado</option>
                              <option value="Especialidad">Especialidad</option>
                              <option value="Taller">Taller</option>
                              <option value="Seminario">Seminario</option>
                              <option value="Otro">Otro (Especificar)</option>
                          </select>
                      </div>

                      <div v-if="nuevaActividad.tipo === 'Otro'" class="animate-in fade-in slide-in-from-top-4 duration-300">
                          <label class="text-[10px] font-black text-umsa-blue uppercase tracking-widest block mb-2 flex items-center gap-1">
                            <span class="material-symbols-outlined text-[14px]">edit</span> Especificar Nuevo Tipo (Filtro)
                          </label>
                          <input v-model="nuevaActividad.tipoPersonalizado" type="text" placeholder="Ej: Webinar, Simposio..." class="w-full bg-blue-50/50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/50 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-umsa-blue font-bold text-primary-dark dark:text-gray-200 uppercase transition-all" />
                      </div>

                      <div>
                          <label class="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest block mb-2">Descripción (Opcional)</label>
                          <textarea v-model="nuevaActividad.descripcion" rows="3" class="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm font-bold text-primary-dark dark:text-gray-200 resize-none"></textarea>
                      </div>
                  </div>
                  <div class="space-y-4">
                      <div>
                          <label class="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest block mb-2">Imagen de Portada (Opcional)</label>
                          <div class="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 dark:border-gray-700 border-dashed rounded-xl hover:border-umsa-blue dark:hover:border-blue-500 transition-colors bg-slate-50 dark:bg-gray-800/40 group overflow-hidden relative">
                              <div v-if="imagenPreview" class="absolute inset-0">
                                  <img :src="imagenPreview" class="w-full h-full object-cover">
                                  <div class="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                      <p class="text-white text-[10px] font-black uppercase">Cambiar Imagen</p>
                                  </div>
                              </div>
                              <div class="space-y-1 text-center">
                                  <span class="material-symbols-outlined text-4xl text-slate-400 dark:text-slate-500 group-hover:text-umsa-blue transition-colors">image</span>
                                  <div class="flex flex-col items-center text-sm text-slate-600 dark:text-slate-400">
                                      <label for="actividad_img" class="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-bold text-umsa-blue hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 focus-within:outline-none px-3 py-1.5 shadow-sm border border-slate-200 dark:border-gray-700 mt-2">
                                          <span>Subir Imagen</span>
                                          <input id="actividad_img" name="actividad_img" type="file" accept="image/*" class="sr-only" @change="handleFileUpload">
                                      </label>
                                  </div>
                                  <p class="text-[10px] text-slate-500 dark:text-slate-400 mt-3">PNG, JPG hasta 5MB</p>
                                  <p v-if="imagenArchivo" class="text-[9px] text-emerald-500 font-bold mt-2 truncate max-w-[200px]">{{ imagenArchivo.name }}</p>
                              </div>
                          </div>
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
                      <input v-model="nuevaActividad.min_nota" type="number" class="w-full bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 font-black text-xl text-center text-primary-dark dark:text-gray-200" />
                  </div>
                  <div class="p-8 rounded-[2rem] border-2 border-slate-100 dark:border-gray-800 border-l-[8px] border-l-umsa-gold bg-slate-50 dark:bg-gray-800">
                      <h4 class="font-black text-primary-dark dark:text-white mb-2 uppercase text-sm">Asistencia Mínima (%)</h4>
                      <input v-model="nuevaActividad.min_asistencia" type="number" class="w-full bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 font-black text-xl text-center text-primary-dark dark:text-gray-200" />
                  </div>
              </div>
          </div>
      </div>

      <!-- Contenido del Step 3 -->
      <div v-show="currentStep === 3" class="space-y-8 animate-in slide-in-from-right-8 duration-500">
          <div class="bg-white dark:bg-gray-900 p-8 rounded-[2rem] shadow-sm border border-slate-100 dark:border-gray-800">
              <h3 class="text-xl font-black text-primary-dark dark:text-white uppercase italic mb-8">3. Cronograma y Modalidad</h3>
              
              <!-- SELECTOR DE MODALIDAD -->
              <div class="mb-10 p-8 rounded-[2.5rem] bg-slate-50 dark:bg-gray-800 border-2 border-slate-100 dark:border-gray-700 border-l-[12px] border-l-umsa-blue shadow-inner relative overflow-hidden group">
                  <div class="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform duration-500">
                      <span class="material-symbols-outlined text-7xl text-umsa-blue">location_on</span>
                  </div>
                  <div class="relative z-10">
                      <label class="text-[10px] font-black text-slate-500 dark:text-gray-400 uppercase tracking-widest mb-4 block flex items-center gap-2">
                          <span class="material-symbols-outlined text-sm">hub</span> Tipo de Modalidad / Ejecución
                      </label>
                      <div class="flex flex-wrap gap-4">
                          <button v-for="mod in ['Presencial', 'Virtual', 'Híbrido']" :key="mod"
                            @click="nuevaActividad.modalidad = mod"
                            class="flex-1 min-w-[140px] px-6 py-4 rounded-2xl border-2 font-black text-xs uppercase tracking-widest transition-all flex flex-col items-center gap-2 shadow-sm"
                            :class="nuevaActividad.modalidad === mod 
                                ? 'bg-umsa-blue text-white border-umsa-blue shadow-lg shadow-blue-200 dark:shadow-none' 
                                : 'bg-white dark:bg-gray-900 text-slate-400 dark:text-gray-500 border-slate-100 dark:border-gray-800 hover:border-blue-200'">
                              <span class="material-symbols-outlined text-2xl">
                                  {{ mod === 'Presencial' ? 'groups' : (mod === 'Virtual' ? 'laptop_mac' : 'layers') }}
                              </span>
                              {{ mod }}
                          </button>
                      </div>
                  </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                  <div class="p-6 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-[2rem] shadow-inner">
                      <label class="text-[10px] font-black text-slate-500 dark:text-gray-400 uppercase tracking-widest mb-3 block flex items-center gap-2">
                        <span class="material-symbols-outlined text-sm text-umsa-blue">calendar_month</span> Fecha de Inicio (Apertura)
                      </label>
                      <input v-model="nuevaActividad.fecha_inicio" type="date" class="w-full bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 font-black text-sm text-primary-dark dark:text-gray-200 focus:ring-2 focus:ring-umsa-blue outline-none transition-all cursor-pointer" />
                  </div>
                  <div class="p-6 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-[2rem] shadow-inner">
                      <label class="text-[10px] font-black text-slate-500 dark:text-gray-400 uppercase tracking-widest mb-3 block flex items-center gap-2">
                        <span class="material-symbols-outlined text-sm text-emerald-500">event_available</span> Fecha de Finalización (Cierre)
                      </label>
                      <input v-model="nuevaActividad.fecha_fin" type="date" class="w-full bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 font-black text-sm text-primary-dark dark:text-gray-200 focus:ring-2 focus:ring-umsa-blue outline-none transition-all cursor-pointer" />
                  </div>
              </div>

              <!-- LISTA DE HORARIOS AÑADIDOS -->
              <div v-if="nuevaActividad.sesiones.length > 0" class="mb-6 space-y-2">
                  <div v-for="(s, idx) in nuevaActividad.sesiones" :key="idx" class="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                      <div class="flex items-center gap-6">
                        <span class="text-sm font-black text-umsa-blue uppercase tracking-tighter w-20">{{ s.dia }}</span>
                        <div class="flex items-center gap-2 text-slate-600 dark:text-gray-300">
                            <span class="material-symbols-outlined text-sm">schedule</span>
                            <span class="text-xs font-bold">{{ s.hora_inicio }} - {{ s.hora_fin }}</span>
                        </div>
                      </div>
                      <button @click="eliminarSesion(idx)" class="text-red-500 hover:text-red-700">
                        <span class="material-symbols-outlined">delete</span>
                      </button>
                  </div>
              </div>

              <h4 class="text-sm font-black text-primary-dark dark:text-white uppercase italic mb-4">Añadir Horario</h4>
              <div class="p-6 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-[2rem] flex flex-wrap items-end gap-4 shadow-inner">
                  <div class="flex-1 min-w-[200px]">
                      <label class="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase mb-2 block">Día de la semana</label>
                      <select v-model="nuevaSesion.dia" class="w-full border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-xl px-4 py-3 font-bold text-sm text-primary-dark dark:text-gray-200 focus:ring-2 focus:ring-umsa-blue outline-none transition-all cursor-pointer">
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
                      <input v-model="nuevaSesion.hora_inicio" type="time" class="w-full border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-xl px-4 py-3 font-bold text-sm text-primary-dark dark:text-gray-200 focus:ring-2 focus:ring-umsa-blue outline-none transition-all cursor-pointer">
                  </div>
                  <div class="w-32">
                      <label class="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase mb-2 block">Hora Fin</label>
                      <input v-model="nuevaSesion.hora_fin" type="time" class="w-full border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-xl px-4 py-3 font-bold text-sm text-primary-dark dark:text-gray-200 focus:ring-2 focus:ring-umsa-blue outline-none transition-all cursor-pointer">
                  </div>
                  <button @click="agregarSesion" title="Añadir Horario" class="w-12 h-[46px] flex items-center justify-center bg-primary-dark dark:bg-blue-600 hover:bg-emerald-500 dark:hover:bg-blue-500 text-white rounded-xl shadow-md transition-all mb-[1px]">
                      <span class="material-symbols-outlined text-[20px]">add</span>
                  </button>
              </div>
          </div>
      </div>

      <!-- Contenido del Step 4 -->
      <div v-show="currentStep === 4" class="space-y-8 animate-in zoom-in-95 duration-500">
          <div class="bg-white dark:bg-gray-900 p-8 rounded-[2rem] shadow-sm border-l-[10px] border-l-umsa-gold dark:border-l-yellow-600 border border-slate-100 dark:border-gray-800">
              <h3 class="text-xl font-black text-primary-dark dark:text-white uppercase italic mb-4">4. Confirmación y Revisión</h3>
              <p class="text-sm font-bold text-slate-500 dark:text-gray-400 mb-8 italic">Por favor, verifica los detalles finales antes de publicar la actividad en el sistema.</p>

              <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <!-- Columna Resumen Texto -->
                  <div class="lg:col-span-2 space-y-6">
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div class="p-5 bg-slate-50 dark:bg-gray-800/50 rounded-2xl border border-slate-100 dark:border-gray-800">
                              <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Nombre de la Actividad</span>
                              <p class="text-sm font-black text-primary-dark dark:text-white uppercase">{{ nuevaActividad.nombre || 'Sin nombre' }}</p>
                          </div>
                          <div class="p-5 bg-slate-50 dark:bg-gray-800/50 rounded-2xl border border-slate-100 dark:border-gray-800">
                              <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Tipo de Actividad / Categoría</span>
                              <p class="text-sm font-black text-umsa-blue uppercase">
                                  {{ nuevaActividad.tipo === 'Otro' ? nuevaActividad.tipoPersonalizado : nuevaActividad.tipo }}
                              </p>
                          </div>
                          <div class="p-5 bg-slate-50 dark:bg-gray-800/50 rounded-2xl border border-slate-100 dark:border-gray-800">
                              <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Modalidad de Ejecución</span>
                              <p class="text-sm font-black text-purple-600 uppercase">{{ nuevaActividad.modalidad }}</p>
                          </div>
                      </div>

                      <div class="p-6 bg-slate-50 dark:bg-gray-800/50 rounded-2xl border border-slate-100 dark:border-gray-800">
                          <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-3">Horarios Programados ({{ nuevaActividad.sesiones.length }})</span>
                          <div v-if="nuevaActividad.sesiones.length > 0" class="flex flex-wrap gap-2">
                              <div v-for="(s, i) in nuevaActividad.sesiones" :key="i" class="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 px-3 py-2 rounded-xl flex items-center gap-2">
                                  <span class="text-[10px] font-black text-primary-dark dark:text-white w-14">{{ s.dia }}</span>
                                  <span class="text-[10px] font-bold text-slate-500">{{ s.hora_inicio }} - {{ s.hora_fin }}</span>
                              </div>
                          </div>
                          <p v-else class="text-xs font-bold text-red-500 flex items-center gap-1">
                              <span class="material-symbols-outlined text-sm">warning</span> Sin horarios configurados
                          </p>
                      </div>

                      <div class="grid grid-cols-3 gap-4 text-center">
                          <div class="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-800/50">
                              <span class="text-[8px] font-black text-emerald-600 uppercase block">Nota Mínima</span>
                              <p class="text-lg font-black text-emerald-700">{{ nuevaActividad.min_nota }}</p>
                          </div>
                          <div class="p-4 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-800/50">
                              <span class="text-[8px] font-black text-amber-600 uppercase block">Asistencia</span>
                              <p class="text-lg font-black text-amber-700">{{ nuevaActividad.min_asistencia }}%</p>
                          </div>
                          <div class="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-800/50">
                              <span class="text-[8px] font-black text-blue-600 uppercase block">Fecha Inicio</span>
                              <p class="text-[10px] font-black text-blue-700 mt-1 uppercase">{{ nuevaActividad.fecha_inicio || '--/--/--' }}</p>
                          </div>
                      </div>
                  </div>

                  <!-- Columna Preview Imagen -->
                  <div class="relative rounded-[2rem] overflow-hidden border-2 border-slate-100 dark:border-gray-800 bg-slate-50 dark:bg-gray-800 aspect-square lg:aspect-auto">
                      <div v-if="imagenPreview" class="absolute inset-0">
                          <img :src="imagenPreview" class="w-full h-full object-cover">
                      </div>
                      <div v-else class="absolute inset-0 flex flex-col items-center justify-center p-6 text-center opacity-50 grayscale">
                          <span class="material-symbols-outlined text-5xl mb-2">image_not_supported</span>
                          <p class="text-[10px] font-black text-slate-500 uppercase">Sin imagen de portada</p>
                      </div>
                      <div class="absolute bottom-4 left-4 right-4 z-20">
                          <div class="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-white/20">
                              <p class="text-[10px] font-black text-primary-dark dark:text-white uppercase truncate">{{ nuevaActividad.nombre || 'Vista Previa' }}</p>
                              <p class="text-[8px] font-bold text-umsa-blue uppercase mt-1">{{ nuevaActividad.tipo === 'Otro' ? nuevaActividad.tipoPersonalizado : nuevaActividad.tipo }}</p>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      </div>

      <div class="flex justify-between items-center pt-8 border-t border-slate-200 dark:border-gray-800 mt-8">
          <button @click="changeStep(-1)" 
            :class="currentStep === 1 ? 'opacity-0 pointer-events-none' : 'opacity-100'" 
            class="px-8 py-3 bg-slate-100 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 text-slate-600 dark:text-gray-300 font-black text-[11px] uppercase rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 hover:border-red-200 flex items-center gap-2 transition-all shadow-sm">
              <span class="material-symbols-outlined text-[18px]">arrow_back</span> Regresar
          </button>
          
          <button v-if="currentStep < 4" @click="changeStep(1)" 
            class="px-10 py-4 bg-primary-dark dark:bg-blue-600 text-white font-black text-[12px] uppercase rounded-xl shadow-xl hover:shadow-2xl hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center gap-3">
              Siguiente Paso <span class="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>

          <button v-else @click="publicarActividad" 
            class="px-12 py-4 bg-umsa-gold dark:bg-yellow-600 text-white font-black text-[12px] uppercase rounded-xl shadow-[0_10px_30px_rgba(163,134,40,0.3)] hover:shadow-[0_15px_40px_rgba(163,134,40,0.4)] hover:-translate-y-1 active:translate-y-0 transition-all flex items-center gap-3">
              Publicar Actividad <span class="material-symbols-outlined text-[20px]">verified</span>
          </button>
      </div>

    </div>

    <!-- PANEL FUSIÓN: CLON LITERAL DE GESTIÓN DE EVENTOS -->
    <div v-if="isCreatingEvento" class="bg-white dark:bg-gray-900 rounded-[2rem] shadow-xl shadow-umsa-blue/10 dark:shadow-black/50 border border-blue-100 dark:border-gray-800 animate-in slide-in-from-top-4 duration-500 overflow-hidden relative mb-20">
        <div class="bg-gradient-to-r from-umsa-blue to-emerald-500 p-8 pb-10 relative overflow-hidden">
            <span class="material-symbols-outlined absolute -right-4 -top-8 text-[120px] text-white/10 rotate-12">event_note</span>
            <div class="flex justify-between items-start relative z-20">
                <h3 class="text-2xl md:text-3xl font-black text-white uppercase italic tracking-tighter drop-shadow-md flex items-center gap-3">
                    <span class="material-symbols-outlined text-3xl">{{ isEditingEvento ? 'edit_calendar' : 'add_circle' }}</span>
                    {{ isEditingEvento ? 'Editar Gestión de Evento' : 'Crear Nueva Gestión de Evento' }}
                </h3>
                <button @click="isCreatingEvento = false" class="bg-red-500/20 hover:bg-red-500 text-white px-4 py-2 rounded-xl border border-red-500/30 transition-all flex items-center gap-2">
                    <span class="material-symbols-outlined text-sm">close</span>
                    <span class="text-[9px] font-black uppercase tracking-widest">cancelar</span>
                </button>
            </div>
        </div>
        
        <form @submit.prevent="handleSaveEvento" class="space-y-10 bg-white dark:bg-gray-900 p-8 md:p-12 pt-10 mt-[-1.5rem] rounded-t-[3rem] relative z-20">
            
            <!-- SECCIÓN 1: IDENTIDAD Y PORTADA -->
            <div class="space-y-6">
                <div class="flex items-center gap-3 border-b border-slate-100 dark:border-gray-800 pb-4">
                    <span class="material-symbols-outlined text-umsa-blue">stars</span>
                    <h4 class="text-sm font-black text-primary-dark dark:text-white uppercase tracking-tighter italic">Identidad y Portada</h4>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-3 gap-10">
                    <div class="md:col-span-2 space-y-6">
                        <div>
                            <label class="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wide block mb-2">Nombre Principal del Evento</label>
                            <input v-model="formEvento.nombre" type="text" required placeholder="Ej: Congreso Internacional de Ciencias Agroindustriales" class="w-full bg-slate-50 dark:bg-gray-800 border-2 border-slate-100 dark:border-gray-700 focus:border-umsa-blue outline-none rounded-2xl px-5 py-4 text-sm font-bold text-primary-dark dark:text-gray-100 transition-all shadow-sm" />
                        </div>
                        
                        <div class="grid grid-cols-2 gap-6">
                            <div>
                                <label class="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wide block mb-2">Gestión / Año</label>
                                <input v-model="formEvento.gestion" type="number" required class="w-full bg-slate-50 dark:bg-gray-800 border-2 border-slate-100 dark:border-gray-700 focus:border-umsa-blue rounded-2xl px-5 py-3 text-sm font-bold" />
                            </div>
                            <div>
                                <label class="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wide block mb-2">Versión / Edición</label>
                                <input v-model="formEvento.version" type="text" placeholder="Ej: 3ra Edición" class="w-full bg-slate-50 dark:bg-gray-800 border-2 border-slate-100 dark:border-gray-700 focus:border-umsa-blue rounded-2xl px-5 py-3 text-sm font-bold" />
                            </div>
                        </div>

                        <div>
                            <label class="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wide block mb-2">Descripción General Breve</label>
                            <textarea v-model="formEvento.descripcion" required rows="3" class="w-full bg-slate-50 dark:bg-gray-800 border-2 border-slate-100 dark:border-gray-700 focus:border-umsa-blue rounded-2xl px-5 py-3 text-sm font-bold resize-none"></textarea>
                        </div>
                    </div>

                    <div class="space-y-4">
                        <label class="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wide block mb-2">Imagen Portada (Fondo Hero)</label>
                        <div class="relative group bg-slate-100 dark:bg-gray-800 rounded-[2.5rem] overflow-hidden border-2 border-dashed border-slate-200 dark:border-gray-700 hover:border-emerald-500 transition-all h-[320px] flex items-center justify-center">
                            <img v-if="previewEventoImg" :src="previewEventoImg" class="absolute inset-0 w-full h-full object-cover" />
                            <div class="text-center p-6 relative z-10 backdrop-blur-sm bg-white/70 dark:bg-black/50 rounded-2xl border border-white/50">
                                <span class="material-symbols-outlined text-4xl text-emerald-600 mb-2">photo_camera</span>
                                <label class="cursor-pointer block">
                                    <span class="text-[10px] font-black text-emerald-700 dark:text-emerald-400 bg-white dark:bg-gray-900 px-5 py-2.5 rounded-full shadow-lg uppercase tracking-widest hover:scale-105 active:scale-95 transition-transform">Subir Imagen</span>
                                    <input type="file" accept="image/*" class="sr-only" @change="onEventoFileChange">
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- SECCIÓN 2: DETALLES NARRATIVOS -->
            <div class="p-10 bg-slate-50 dark:bg-gray-800/30 rounded-[3.5rem] border border-slate-100 dark:border-gray-800 space-y-8">
                <div class="flex items-center gap-3">
                    <span class="material-symbols-outlined text-umsa-blue">subject</span>
                    <h4 class="text-sm font-black text-primary-dark dark:text-white uppercase tracking-tighter italic">Sección Informativa (Sobre el Evento)</h4>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <div class="space-y-6">
                        <div>
                            <label class="text-xs font-black text-umsa-blue uppercase tracking-wide block mb-2">Párrafo Principal (Columna Derecha)</label>
                            <textarea v-model="formEvento.sobre_evento_1" rows="4" class="w-full bg-white dark:bg-gray-900 border-2 border-blue-50 dark:border-gray-700 focus:border-umsa-blue rounded-2xl px-5 py-4 text-sm font-medium"></textarea>
                        </div>
                        <div>
                            <label class="text-xs font-black text-umsa-blue uppercase tracking-wide block mb-2">Párrafo Secundario</label>
                            <textarea v-model="formEvento.sobre_evento_2" rows="4" class="w-full bg-white dark:bg-gray-900 border-2 border-blue-50 dark:border-gray-700 focus:border-umsa-blue rounded-2xl px-5 py-4 text-sm font-medium"></textarea>
                        </div>
                    </div>
                    <div class="h-full bg-blue-500/5 p-8 rounded-[2.5rem] border-2 border-dashed border-umsa-blue/20 flex flex-col justify-center">
                        <label class="text-xs font-black text-umsa-blue uppercase tracking-wide block mb-4">Frase Destacada (Cita Central)</label>
                        <textarea v-model="formEvento.frase_destacada" rows="4" class="w-full bg-white dark:bg-gray-900 border-2 border-umsa-blue/30 focus:border-umsa-blue rounded-3xl px-6 py-6 text-xl font-black italic text-center resize-none shadow-inner"></textarea>
                    </div>
                </div>
            </div>

            <!-- SECCIÓN 3: PERSONAL Y PONENTES -->
            <div class="space-y-6">
                <div class="flex items-center justify-between border-b border-slate-100 dark:border-gray-800 pb-4">
                    <div class="flex items-center gap-3">
                        <span class="material-symbols-outlined text-emerald-600">group</span>
                        <h4 class="text-sm font-black text-primary-dark dark:text-white uppercase tracking-tighter italic">Directorio del Evento</h4>
                    </div>
                    <button @click.prevent="showRegistroRapidoPonente = true" class="text-[10px] font-black text-emerald-700 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 px-5 py-2.5 rounded-[1.2rem] transition-all shadow-sm">
                        + REGISTRAR NUEVO PERSONAL
                    </button>
                </div>

                <div class="bg-blue-50/50 dark:bg-gray-800/50 p-8 rounded-[2.5rem] border-2 border-dashed border-blue-100 dark:border-gray-700">
                    <div class="flex flex-col items-center text-center">
                        <span class="material-symbols-outlined text-4xl text-umsa-blue mb-3">sync</span>
                        <p class="text-xs font-black text-primary-dark dark:text-white uppercase tracking-widest">Sincronización Automática Activa</p>
                        <p class="text-[10px] font-medium text-slate-500 mt-2 max-w-sm">
                            Los ponentes se mostrarán en la página pública <b>si y solo si</b> tienen asignada al menos una actividad académica en este evento. No necesitas seleccionarlos aquí manualmente.
                        </p>
                    </div>
                </div>
            </div>

            <!-- SECCIÓN 4: LOGÍSTICA -->
            <div class="bg-blue-50/30 dark:bg-gray-800/30 p-10 rounded-[3.5rem] border border-blue-100 dark:border-gray-800 space-y-10">
                <div class="flex items-center gap-3">
                    <span class="material-symbols-outlined text-umsa-blue">room</span>
                    <h4 class="text-sm font-black text-primary-dark dark:text-white uppercase tracking-tighter italic">Logística y Ubicación</h4>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div class="space-y-6">
                        <div class="grid grid-cols-2 gap-6">
                            <div>
                                <label class="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest block mb-2 border-b border-slate-200 dark:border-gray-700 pb-1">Fecha de Inicio</label>
                                <input v-model="formEvento.fecha_inicio" type="date" required class="w-full bg-white dark:bg-gray-900 border-2 border-slate-100 dark:border-gray-700 rounded-2xl px-5 py-4 text-sm font-bold text-primary-dark dark:text-white" />
                            </div>
                            <div>
                                <label class="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest block mb-1 border-b border-slate-200 dark:border-gray-700 pb-1">Fecha de Fin</label>
                                <input v-model="formEvento.fecha_fin" type="date" required class="w-full bg-white dark:bg-gray-900 border-2 border-slate-100 dark:border-gray-700 rounded-2xl px-5 py-4 text-sm font-bold text-primary-dark dark:text-white" />
                            </div>
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                             <div class="col-span-2">
                                 <label class="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2">Estado del Evento</label>
                                 <select v-model="formEvento.estado" class="w-full bg-white dark:bg-gray-900 border-2 border-slate-100 dark:border-gray-700 rounded-2xl px-5 py-4 text-sm font-black uppercase text-emerald-600 focus:border-emerald-500 outline-none cursor-pointer">
                                     <option :value="2">Planificación</option>
                                     <option :value="1">Activo / Publicado</option>
                                     <option :value="0">Concluido / Histórico</option>
                                     <option :value="3">Borrador / Invisible</option>
                                 </select>
                             </div>
                        </div>
                        <div class="grid grid-cols-2 gap-6">
                            <div>
                                <label class="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest block mb-2 border-b border-slate-200 dark:border-gray-700 pb-1">Ciudad / Sede</label>
                                <input v-model="formEvento.ubicacion" type="text" placeholder="Ej: La Paz" class="w-full bg-white dark:bg-gray-900 border-2 border-slate-100 dark:border-gray-700 rounded-2xl px-5 py-4 text-sm font-bold" />
                            </div>
                            <div>
                                <label class="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest block mb-2 border-b border-slate-200 dark:border-gray-700 pb-1">Dirección Exacta</label>
                                <input v-model="formEvento.direccion" type="text" placeholder="Ej: Edif. Central UMSA" class="w-full bg-white dark:bg-gray-900 border-2 border-slate-100 dark:border-gray-700 rounded-2xl px-5 py-4 text-sm font-bold" />
                            </div>
                        </div>
                    </div>

                    <div class="space-y-4">
                        <label class="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest block mb-2 border-b border-slate-200 dark:border-gray-700 pb-1">Mapa Interactivo (Google Iframe)</label>
                        <textarea v-model="formEvento.google_maps_link" rows="5" placeholder="Pega aquí el código <iframe ...>" class="w-full bg-white dark:bg-gray-900 border-2 border-slate-100 dark:border-gray-700 rounded-3xl px-6 py-6 text-xs font-mono text-emerald-600 dark:text-emerald-400 focus:border-emerald-500 resize-none"></textarea>
                    </div>
                </div>
            </div>

            <!-- SECCIÓN 5: CRONOGRAMA -->
            <div class="space-y-8">
                <div class="flex items-center justify-between border-b border-slate-100 dark:border-gray-800 pb-4">
                    <div class="flex items-center gap-4">
                        <span class="material-symbols-outlined text-umsa-gold text-3xl">view_timeline</span>
                        <h4 class="text-sm font-black text-primary-dark dark:text-white uppercase tracking-tighter italic">Cronograma de Actividades</h4>
                    </div>
                    <button @click.prevent="agregarDiaEvento" class="bg-umsa-gold hover:bg-yellow-600 text-white px-6 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all shadow-lg active:scale-95 shadow-yellow-500/20">
                        + AGREGAR NUEVO DÍA
                    </button>
                </div>

                <div class="space-y-8">
                    <div v-for="(dia, dIdx) in formEvento.cronograma_lista" :key="dIdx" class="bg-white dark:bg-gray-800 border-2 border-slate-100 dark:border-gray-700 rounded-[3rem] p-10 shadow-sm relative overflow-hidden group">
                        <div class="absolute right-0 top-0 w-3 h-full bg-umsa-gold opacity-30"></div>
                        
                        <div class="flex flex-col lg:flex-row gap-8 items-start lg:items-center mb-10 pb-8 border-b border-slate-50 dark:border-gray-700">
                            <div class="flex items-center gap-6 flex-1">
                                <span class="w-14 h-14 bg-umsa-gold/10 text-umsa-gold rounded-full flex items-center justify-center font-black text-2xl italic shadow-inner">#{{ dia.day }}</span>
                                <div class="flex-1">
                                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Nombre del Día / Fase</label>
                                    <input v-model="dia.name" class="w-full bg-transparent border-b-2 border-slate-100 dark:border-gray-600 focus:border-umsa-gold outline-none text-xl font-black text-primary-dark dark:text-white uppercase" />
                                </div>
                            </div>
                            <div class="w-full lg:w-auto">
                                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Fecha del Día</label>
                                <input v-model="dia.date" type="date" class="w-full lg:w-auto bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-600 rounded-xl px-5 py-3 text-xs font-bold shadow-sm" />
                            </div>
                            <button @click.prevent="eliminarDiaEvento(dIdx)" class="text-slate-300 hover:text-red-500 transition-colors p-3">
                                <span class="material-symbols-outlined text-3xl">delete_sweep</span>
                            </button>
                        </div>

                        <div class="space-y-4">
                            <div v-for="(act, aIdx) in dia.events" :key="aIdx" class="flex flex-col sm:flex-row items-center gap-4 group/act relative">
                                <input v-model="act.time" type="time" class="w-full sm:w-36 bg-slate-50 dark:bg-gray-900 border border-slate-100 dark:border-gray-700 rounded-2xl px-5 py-4 text-xs font-black text-umsa-blue shadow-inner" />
                                <input v-model="act.title" placeholder="Descripción de la actividad..." class="flex-1 w-full bg-white dark:bg-gray-900 border border-slate-100 dark:border-gray-700 rounded-2xl px-5 py-4 text-sm font-bold shadow-sm focus:border-emerald-500 transition-all" />
                                <button @click.prevent="eliminarActividadEvento(dIdx, aIdx)" class="text-slate-300 hover:text-red-500 sm:opacity-0 group-hover/act:opacity-100 transition-all">
                                    <span class="material-symbols-outlined text-2xl">remove_circle</span>
                                </button>
                            </div>
                            <button @click.prevent="agregarActividadEvento(dIdx)" class="mt-6 text-[11px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-8 py-3 rounded-2xl uppercase tracking-widest hover:bg-emerald-100 transition-all flex items-center gap-3">
                                <span class="material-symbols-outlined text-lg">add</span> Añadir Item al Cronograma
                            </button>
                        </div>
                    </div>
                </div>

                <div v-if="formEvento.cronograma_lista.length === 0" class="py-24 text-center border-4 border-dashed border-slate-100 dark:border-gray-800 rounded-[4rem]">
                    <span class="material-symbols-outlined text-7xl text-slate-200 mb-6 scale-125">auto_schedule</span>
                    <p class="text-sm font-black text-slate-300 uppercase tracking-widest mb-8">No has definido el cronograma del evento</p>
                    <button @click.prevent="agregarDiaEvento" class="bg-umsa-blue text-white px-10 py-4 rounded-full font-black text-[11px] uppercase tracking-widest shadow-2xl shadow-blue-500/20 hover:-translate-y-1 transition-all">Empezar a estructurar</button>
                </div>
            </div>

            <div class="flex justify-between items-center pt-12 border-t-2 border-slate-100 dark:border-gray-800 mt-10">
                <button type="button" @click="isCreatingEvento = false; isEditingEvento = false" class="text-xs font-black text-slate-400 uppercase tracking-widest hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 px-4 py-2 rounded-xl transition-all flex items-center gap-3">
                    <span class="material-symbols-outlined text-xl">close</span> Descartar Cambios
                </button>
                <button type="submit" class="bg-gradient-to-r from-emerald-600 to-emerald-400 hover:scale-105 active:scale-95 transition-all text-white font-black px-14 py-5 rounded-[2rem] text-xs uppercase tracking-widest shadow-2xl shadow-emerald-500/40 flex items-center gap-4">
                    <span class="material-symbols-outlined text-2xl">{{ isEditingEvento ? 'auto_fix_high' : 'playlist_add_check' }}</span> 
                    {{ isEditingEvento ? 'Actualizar Evento Completo' : 'Finalizar y Crear Evento' }}
                </button>
            </div>
        </form>
    </div>

    <div v-if="showRegistroRapidoPonente" class="fixed inset-0 z-[120] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="showRegistroRapidoPonente = false"></div>
        <div class="bg-white dark:bg-gray-900 rounded-[2rem] w-full max-w-md p-8 relative z-10 animate-in zoom-in-95 duration-300">
            <h3 class="text-xl font-black text-primary-dark dark:text-white uppercase italic mb-6 border-b-2 border-emerald-500 pb-2 inline-block">Personal Nuevo</h3>
            <div class="space-y-4">
                <div class="grid grid-cols-2 gap-4">
                    <input v-model="nuevoPonenteQuick.nombres" placeholder="Nombres" class="w-full bg-slate-50 dark:bg-gray-800 border-2 border-slate-100 dark:border-gray-700 rounded-xl px-4 py-3 text-xs font-bold" />
                    <input v-model="nuevoPonenteQuick.primer_apellido" placeholder="Apellidos" class="w-full bg-slate-50 dark:bg-gray-800 border-2 border-slate-100 dark:border-gray-700 rounded-xl px-4 py-3 text-xs font-bold" />
                </div>
                <input v-model="nuevoPonenteQuick.email" placeholder="Correo" class="w-full bg-slate-50 dark:bg-gray-800 border-2 border-slate-100 dark:border-gray-700 rounded-xl px-4 py-3 text-xs font-bold" />
                <select v-model="nuevoPonenteQuick.id_grado_academico" class="w-full bg-slate-50 dark:bg-gray-800 border-2 border-slate-100 dark:border-gray-700 rounded-xl px-4 py-3 text-xs font-bold">
                    <option v-for="ga in gradosAcademicosDB" :key="ga.id" :value="ga.id">{{ ga.abreviacion }} - {{ ga.nombre }}</option>
                </select>
                <div class="pt-4 flex gap-3">
                    <button @click="showRegistroRapidoPonente = false" class="flex-1 text-[10px] font-black uppercase text-slate-400 hover:text-red-600 transition-all">Cancelar</button>
                    <button @click="registrarPonenteQuick" class="flex-1 bg-emerald-500 text-white px-4 py-3 rounded-xl font-black text-[10px] uppercase">Registrar</button>
                </div>
            </div>
        </div>
    </div>
  </div>
</template>



