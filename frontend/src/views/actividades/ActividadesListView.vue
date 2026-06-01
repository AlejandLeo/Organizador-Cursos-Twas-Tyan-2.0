<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useEventoStore } from '@/stores/eventoStore';

import { useAdminHistorialStore } from '@/stores/adminHistorial';
import { useAuthStore } from '@/stores/auth';

import api, { getImageUrl } from '@/services/api';
import Swal from 'sweetalert2';

const router = useRouter();
const route = useRoute();
const eventoStore = useEventoStore();
const historialStore = useAdminHistorialStore();
const authStore = useAuthStore();

// Solo registrar en historial si el usuario es Super Admin
const isAdmin = () => {
  const roles = (authStore.user as any)?.usuariosRoles || [];
  return roles.some((ur: any) => ur.rol?.nombre_rol === 'Super Usuario' || ur.rol?.id === 1);
};
const registrarAccion = (...args: Parameters<typeof historialStore.registrar>) => {
  if (isAdmin()) historialStore.registrar(...args);
};

// --- LÓGICA DE GESTIÓN DE EVENTOS (FUSIÓN MAESTRA) ---
const isLoading = ref(false);
const isCreating = ref(false);
const isCreatingEvento = ref(false);
const isEditingEvento = ref(false);
const isEditingActividad = ref(false);
const editActividadId = ref<number | null>(null);
const editEventoId = ref<number | null>(null);
const currentStep = ref(1);
const totalSteps = 6;
const nextStep = () => { if (currentStep.value < totalSteps) currentStep.value++; };
const prevStep = () => { if (currentStep.value > 1) currentStep.value--; };
const irAlPaso = (step: number) => {
    if (step >= 1) {
        currentStep.value = step;
    }
};
const filtroBusqueda = ref('');

const ponentesDB = ref<any[]>([]);
const gradosAcademicosDB = ref<any[]>([]);
const logoPreview = ref<string | null>(null);
const fondoPreview = ref<string | null>(null);
const showRegistroRapidoPonente = ref(false);
const filtroPonente = ref('');
const logisticaDB = ref<any[]>([]);
const filtroLogistica = ref('');

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
  logo_img: null as any,
  google_maps_link: '',
  sobre_evento_1: '',
  sobre_evento_2: '',
  frase_destacada: '',
  link_facebook: '',
  link_web: '',
  sigla: '',
  color_principal: '#0070b4',
  institucion_badge: 'Evento Oficial OEA/TYAN',
  ponentes_seleccionados: [] as number[],
  cronograma: '',
  cronograma_lista: [] as any[],
  version: '',
  mostrar_correos: true
});

const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${date.getDate() + 1} de ${months[date.getMonth()]}`;
};

const ponentesFiltrados = computed(() => {
  if (!filtroPonente.value) return ponentesDB.value;
  const f = filtroPonente.value.toLowerCase();
  return ponentesDB.value.filter(p => p.displayName.toLowerCase().includes(f));
});

const logisticaFiltrada = computed(() => {
  if (!filtroLogistica.value) return logisticaDB.value;
  const f = filtroLogistica.value.toLowerCase();
  return logisticaDB.value.filter(p => 
    p.displayName.toLowerCase().includes(f) || 
    (p.email || '').toLowerCase().includes(f)
  );
});

const toggleLogisticaUsuario = (id: number) => {
  if (!nuevaActividad.value.logistica_ids) {
    nuevaActividad.value.logistica_ids = [];
  }
  const idx = nuevaActividad.value.logistica_ids.indexOf(id);
  if (idx > -1) {
    nuevaActividad.value.logistica_ids.splice(idx, 1);
  } else {
    nuevaActividad.value.logistica_ids.push(id);
  }
};

const resetFormEvento = () => {
    formEvento.value = {
        nombre: '', descripcion: '', gestion: new Date().getFullYear().toString(),
        fecha_inicio: '', fecha_fin: '', ubicacion: '', direccion: '',
        estado: 2, fondo_img: null, logo_img: null, google_maps_link: '',
        sobre_evento_1: '', sobre_evento_2: '', frase_destacada: '',
        link_facebook: '', link_web: '', sigla: '', color_principal: '#0070b4',
        institucion_badge: 'Evento Oficial OEA/TYAN',
        ponentes_seleccionados: [], cronograma: '', cronograma_lista: [], version: '',
        mostrar_correos: true
    };
};

const seleccionarTodosPonentes = () => {
    formEvento.value.ponentes_seleccionados = ponentesDB.value.map(p => p.id);
};

const deseleccionarTodosPonentes = () => {
    formEvento.value.ponentes_seleccionados = [];
};

const agregarDiaEvento = () => {
    formEvento.value.cronograma_lista.push({
        day: formEvento.value.cronograma_lista.length + 1,
        name: `Día ${formEvento.value.cronograma_lista.length + 1}`,
        date: '',
        events: [{ time: '08:00', title: '' }]
    });
};

const eliminarDiaEvento = (idx: any) => {
    formEvento.value.cronograma_lista.splice(idx, 1);
    formEvento.value.cronograma_lista.forEach((d: any, i: number) => d.day = i + 1);
};

const agregarActividadEvento = (dayIdx: any) => {
    formEvento.value.cronograma_lista[dayIdx].events.push({ time: '09:00', title: '' });
};

const eliminarActividadEvento = (dayIdx: any, actIdx: any) => {
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
        const [resP, resC, resG, resL] = await Promise.all([
            api.get('/usuarios?rol=Ponente&limit=200'),
            api.get('/usuarios?rol=Coordinador&limit=200'),
            api.get('/grados-academicos'),
            api.get('/usuarios?rol=Logistica,Logística&limit=200')
        ]);
        const mapUser = (u: any, role: string) => {
            const persona = u.persona || {};
            const gaObj = u.afiliaciones?.[0]?.gradoAcademico || {};
            const prefijo = gaObj.abreviacion ? `${gaObj.abreviacion}. ` : '';
            return { ...u, roleLabel: role, displayName: `${prefijo}${persona.nombres || ''} ${persona.primer_apellido || ''}`.trim() };
        };
        ponentesDB.value = [...(resP.data?.data || resP.data || []).map((u:any) => mapUser(u, 'Ponente')), ...(resC.data?.data || resC.data || []).map((u:any) => mapUser(u, 'Coordinador'))];
        gradosAcademicosDB.value = resG.data?.data || resG.data || [];
        logisticaDB.value = (resL.data?.data || resL.data || []).map((u: any) => mapUser(u, 'Logística'));
    } catch (e) { console.error(e); }
};

const logoQuality = ref<{status: 'hd' | 'low' | 'ok' | null, msg: string}>({status: null, msg: ''});
const fondoQuality = ref<{status: 'hd' | 'low' | 'ok' | null, msg: string}>({status: null, msg: ''});

// Resolución inteligente de URLs para Vista Previa
const resolvedLogo = computed(() => {
    if (!logoPreview.value) return null;
    if (logoPreview.value.startsWith('data:') || logoPreview.value.startsWith('http')) return logoPreview.value;
    const baseUrl = import.meta.env.VITE_API_URL || window.location.origin;
    return `${baseUrl}/uploads/logo/${logoPreview.value}`;
});

const resolvedBanner = computed(() => {
    if (!fondoPreview.value) return null;
    if (fondoPreview.value.startsWith('data:') || fondoPreview.value.startsWith('http')) return fondoPreview.value;
    const baseUrl = import.meta.env.VITE_API_URL || window.location.origin;
    return `${baseUrl}/uploads/banner/${fondoPreview.value}`;
});

const onLogoChange = (e: any) => {
    const file = e.target.files[0];
    if (file) {
        // Validar formato
        if (!['image/png', 'image/jpeg', 'image/svg+xml'].includes(file.type)) {
            Swal.fire('Formato no válido', 'Usa PNG (recomendado para logos) o JPG.', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event: any) => {
            const img = new Image();
            img.onload = () => {
                const isHD = img.width >= 512 && img.height >= 512;
                logoQuality.value = {
                    status: isHD ? 'hd' : (img.width < 200 ? 'low' : 'ok'),
                    msg: `${img.width}x${img.height}px`
                };
                logoPreview.value = event.target.result;
                formEvento.value.logo_img = file;
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }
};

const onFondoChange = (e: any) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event: any) => {
            const img = new Image();
            img.onload = () => {
                const isHD = img.width >= 1920;
                fondoQuality.value = {
                    status: isHD ? 'hd' : (img.width < 1280 ? 'low' : 'ok'),
                    msg: isHD ? 'Excelente (Full HD)' : (img.width < 1280 ? 'Baja Resolución (Pixelado)' : 'Calidad Estándar')
                };
                fondoPreview.value = event.target.result;
                formEvento.value.fondo_img = file;
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }
};


const fetchEventos = async () => {
    try {
        isLoading.value = true;
        // Usar el endpoint de administración correcto para ver datos reales
        const res = await api.get('/admin/eventos/lista?limit=100');
        const eventosData = res.data?.data || res.data || [];
        eventosPublicados.value = eventosData.map((ev: any) => ({
            ...ev,
            nombreCorto: ev.nombre,
            version: ev.gestion,
            imagen: getImageUrl('fondos', ev.imagen_fondo, 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1600&q=80'),
            estado: ev.estado === 1 ? 'Activo' : (ev.estado === 2 ? 'Planificación' : 'Cerrado'),
            colorEstado: ev.estado === 1 ? 'bg-emerald-500 text-white' : (ev.estado === 2 ? 'bg-blue-500 text-white' : 'bg-slate-500 text-white'),
            mostrarActividades: true,
            actividades: (ev.actividades || []).map((act: any) => ({
                id: act.id,
                title: act.nombre,
                version: act.version,
                status: Number(act.estado) === 1 ? 'Activo' : (Number(act.estado) === -1 ? 'Inactivo' : 'Pendiente'),
                type: act.tipo || 'Curso',
                date: act.fecha_inicio ? new Date(act.fecha_inicio).toLocaleDateString() : 'Pendiente',
                students: act.inscripciones?.length || 0,
                modules: 1,
                image: getImageUrl('cursos', act.imagen, 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&q=80'),
                id_evento: ev.id,
                status_raw: act.estado,
                min_nota: act.min_nota,
                min_asistencia: act.min_asistencia,
                modalidad: act.modalidad,
                fecha_inicio_raw: act.fecha_inicio ? act.fecha_inicio.split('T')[0] : '',
                fecha_fin_raw: act.fecha_fin ? act.fecha_fin.split('T')[0] : '',
                requisitos: act.requisitos,
                descripcion: act.descripcion
            }))
        }));
    } catch (error) {
        console.error("Error fetching eventos:", error);
    } finally {
        isLoading.value = false;
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
        formData.append('sigla', formEvento.value.sigla);
        formData.append('institucion_badge', formEvento.value.institucion_badge);
        formData.append('link_facebook', formEvento.value.link_facebook);
        formData.append('link_web', formEvento.value.link_web);
        formData.append('color_principal', formEvento.value.color_principal);

        // Cronograma
        const cleanedCronograma = formEvento.value.cronograma_lista.map(d => ({
            ...d,
            events: d.events.filter((e:any) => e.title?.trim())
        })).filter(d => d.events.length > 0);
        formData.append('cronograma', JSON.stringify(cleanedCronograma));

        let finalDescripcion = formEvento.value.descripcion;
        finalDescripcion += `\n[MOSTRAR_CORREOS]:${formEvento.value.mostrar_correos ? 'true' : 'false'}`;

        const ponentesStr = formEvento.value.ponentes_seleccionados
            .map(id => {
                const found = ponentesDB.value.find((p: any) => p.id === id);
                return found ? found.displayName : '';
            })
            .filter(s => s)
            .join(', ');

        if (ponentesStr) {
            finalDescripcion += `\n[PONENTES_METADATA]:${ponentesStr}`;
        }
        formData.append('descripcion', finalDescripcion);

        if (formEvento.value.fondo_img instanceof File) {
            formData.append('imagen_fondo', formEvento.value.fondo_img);
        }
        if (formEvento.value.logo_img instanceof File) {
            formData.append('imagen_portada', formEvento.value.logo_img);
        }

        if (isEditingEvento.value && editEventoId.value) {
            await api.put(`/admin/eventos/${editEventoId.value}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        } else {
            await api.post('/admin/eventos', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        }

        Swal.fire({ icon: 'success', title: '¡ÉXITO!', text: 'Gestión guardada con todas sus secciones visuales.' });
        // Registrar en historial
        registrarAccion(
          'evento',
          isEditingEvento.value ? 'editar' : 'crear',
          isEditingEvento.value
            ? `Evento editado: "${formEvento.value.nombre}"`
            : `Nuevo evento creado: "${formEvento.value.nombre}"`,
          { entidadId: editEventoId.value?.toString() ?? undefined, entidadNombre: formEvento.value.nombre }
        );
        isCreatingEvento.value = false;
        logoPreview.value = null;
        fondoPreview.value = null;
        fetchEventos();
        eventoStore.fetchEventosInfo();
    } catch (err) {
        Swal.fire('Error', 'No se pudo guardar el evento', 'error');
    } finally { isLoading.value = false; }
};

const editarEvento = (evento: any) => {
    currentStep.value = 1;
    isEditingEvento.value = true;
    editEventoId.value = evento.id;
    const rawDesc = evento.descripcion || '';
    const parts = rawDesc.split('\n[PONENTES_METADATA]:');
    const descPart = parts[0] || '';
    
    let baseDesc = descPart;
    let mostrarCorreos = true;
    if (descPart.includes('\n[MOSTRAR_CORREOS]:')) {
        const mcParts = descPart.split('\n[MOSTRAR_CORREOS]:');
        baseDesc = mcParts[0];
        mostrarCorreos = mcParts[1]?.trim() === 'true';
    }
    
    formEvento.value = {
        nombre: evento.nombreCorto,
        descripcion: baseDesc || '',
        gestion: (evento.gestion || evento.version)?.toString(),
        version: evento.version_slogan || evento.version || '',
        fecha_inicio: evento.fecha_inicio ? evento.fecha_inicio.split('T')[0] : '',
        fecha_fin: evento.fecha_fin ? evento.fecha_fin.split('T')[0] : '',
        ubicacion: evento.ubicacion || '',
        direccion: evento.direccion || '',
        google_maps_link: evento.google_maps_link || '',
        sobre_evento_1: evento.sobre_evento_1 || '',
        sobre_evento_2: evento.sobre_evento_2 || '',
        frase_destacada: evento.frase_destacada || '',
        link_facebook: evento.link_facebook || '',
        link_web: evento.link_web || '',
        sigla: evento.sigla || '',
        color_principal: evento.color_principal || '#0070b4',
        institucion_badge: evento.institucion_badge || 'Evento Oficial OEA/TYAN',
        estado: evento.estado === 'Activo' ? 1 : (evento.estado === 'Cerrado' ? 0 : 2),
        fondo_img: null,
        logo_img: null,
        ponentes_seleccionados: parts[1]
          ? ponentesDB.value
              .filter((p: any) => parts[1].split(',').map((s: string) => s.trim()).includes(p.displayName))
              .map((p: any) => p.id)
          : [],
        cronograma: '',
        cronograma_lista: [],
        mostrar_correos: mostrarCorreos
    };

    if (evento.cronograma) {
        try { formEvento.value.cronograma_lista = typeof evento.cronograma === 'string' ? JSON.parse(evento.cronograma) : evento.cronograma; } catch(e) {}
    }

    logoPreview.value = evento.logo;
    fondoPreview.value = evento.imagen_fondo;
    isCreatingEvento.value = true;
};

const inhabilitarEvento = async (id: number, nombre: string) => {
    const { value: motivo } = await Swal.fire({
        title: '¿INHABILITAR EVENTO?',
        text: `Explique por qué desea inhabilitar "${nombre}". Esta acción ocultará el evento y todas sus actividades.`,
        input: 'textarea',
        inputPlaceholder: 'Escriba el motivo aquí...',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        confirmButtonText: 'SÍ, INHABILITAR',
        cancelButtonText: 'CANCELAR',
        inputValidator: (value) => {
          if (!value) return '¡Debes escribir un motivo!'
        }
    });

    if (motivo) {
        try {
            await api.patch(`/eventos/${id}`, { 
                estado: -1, 
                descripcion: `[INHABILITACION_MOTIVO]:${motivo}\n[FECHA]:${new Date().toLocaleString()}\n` 
            });
            registrarAccion('evento', 'eliminar', `Evento inhabilitado: "${nombre}"`, { entidadId: id.toString(), entidadNombre: nombre });
            fetchEventos();
            eventoStore.fetchEventosInfo();
            Swal.fire('Inhabilitado', 'El evento ha sido inactivado correctamente.', 'success');
        } catch (e) { Swal.fire('Error', 'No se pudo inhabilitar el evento', 'error'); }
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
    sesiones: [] as any[],
    requisitos: {
        base: {
            nombres: true,
            primer_apellido: true,
            segundo_apellido: true,
            documento_identidad: true,
            genero: true,
            email: true,
            celular: true,
            pais_origen: false,
            afiliacion: true,
            grado_academico: false
        },
        custom: [
            { label: 'Matrícula / Título / Aval (Documento de Respaldo)', type: 'file', mandatory: true }
        ] as any[]
    },
    lockTipo: false as boolean,
    logistica_ids: [] as number[]
});

// Lista local de IDs inhabilitados (usaremos Strings para máxima compatibilidad)
const inhabilitadosLocal = ref<string[]>([]);

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
        sesiones: [],
        requisitos: {
            base: {
                nombres: true, primer_apellido: true, segundo_apellido: true,
                email: true, documento_identidad: true, genero: true,
                celular: true, pais_origen: false, afiliacion: true,
                grado_academico: false
            },
            custom: [
                { label: 'Matrícula / Título / Aval (Documento de Respaldo)', type: 'file', mandatory: true }
            ] as any[]
        },
        lockTipo: false as boolean,
        logistica_ids: [] as number[]
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

            id_evento: act.id_evento,
            min_nota: act.min_nota || 71,
            min_asistencia: act.min_asistencia || 80,
            modalidad: act.modalidad || 'Presencial',
            fecha_inicio: act.fecha_inicio_raw || '',
            fecha_fin: act.fecha_fin_raw || '',
            sesiones: [],
            lockTipo: false as boolean,
            requisitos: act.requisitos || { base: {}, custom: [] },
            logistica_ids: act.logistica_ids || []
        };
        
        // Intentar obtener descripción completa y campos extras si no están
        const res = await api.get(`/actividades-academicas/${act.id}`);
        const fullAct = res.data;
        
        nuevaActividad.value.descripcion = fullAct.descripcion || '';
        nuevaActividad.value.fecha_inicio = fullAct.fecha_inicio ? fullAct.fecha_inicio.split('T')[0] : '';
        nuevaActividad.value.fecha_fin = fullAct.fecha_fin ? fullAct.fecha_fin.split('T')[0] : '';
        nuevaActividad.value.id_evento = fullAct.evento?.id || act.id_evento;
        nuevaActividad.value.logistica_ids = fullAct.logistica_ids || [];

        imagenPreview.value = fullAct.imagen || null;
        isCreating.value = true;
        currentStep.value = 1;
    } catch (e) {
        Swal.fire('Error', 'No se pudo cargar la actividad', 'error');
    }
};

const inhabilitarActividad = async (id: number, nombre: string) => {
    const { value: motivo } = await Swal.fire({
        title: '¿INHABILITAR ACTIVIDAD?',
        html: `<div class="text-left"><p class="mb-4">Indique la razón para inhabilitar <b>"${nombre}"</b>:</p>
               <div class="bg-red-50 text-red-600 p-3 rounded-lg border border-red-200 text-sm font-bold flex items-start gap-2">
                 <span class="material-symbols-outlined text-lg">warning</span>
                 <span>ATENCIÓN: Una vez inhabilitada, la actividad desaparecerá para estudiantes y ponentes. <b>SOLO EL SUPER USUARIO</b> podrá volver a habilitarla.</span>
               </div></div>`,
        input: 'textarea',
        inputPlaceholder: 'Escriba el motivo detallado aquí...',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        confirmButtonText: 'SÍ, INHABILITAR',
        cancelButtonText: 'CANCELAR',
        inputValidator: (value: any) => {
          if (!value) return '¡Es obligatorio indicar un motivo!'
        }
    });

    if (motivo) {
        try {
            // BLOQUEO OPTIMISTA: Feedback visual instantáneo (forzar String)
            const idStr = String(id);
            if (!inhabilitadosLocal.value.includes(idStr)) {
                inhabilitadosLocal.value.push(idStr);
            }
            console.log("Actividades Inhabilitadas Localmente:", inhabilitadosLocal.value);
            
            await api.patch(`/actividades-academicas/${id}`, { 
                estado: -1, // Estado inhabilitado
                descripcion: `[INHABILITACION_MOTIVO]:${motivo}\n[FECHA]:${new Date().toLocaleString()}\n` 
            });
            registrarAccion('actividad', 'eliminar', `Actividad inhabilitada: "${nombre}"`, { entidadId: id.toString(), entidadNombre: nombre });
            fetchEventos();
            Swal.fire('Inhabilitada', 'La actividad ha sido marcada como inactiva.', 'success');
        } catch (e) { Swal.fire('Error', 'No se pudo inhabilitar la actividad', 'error'); }
    }
};

const imagenArchivo = ref<File | null>(null);
const imagenPreview = ref<string | null>(null);

const nuevoRequisito = ref({
    label: '',
    type: 'text',
    optionsRaw: ''
});

const agregarRequisitoPersonalizado = () => {
    if (nuevaActividad.value.requisitos.custom.length >= 10) {
        Swal.fire('Límite alcanzado', 'Solo puedes añadir hasta 10 requisitos personalizados.', 'warning');
        return;
    }
    
    const req: any = {
        label: nuevoRequisito.value.label,
        type: nuevoRequisito.value.type,
        options: []
    };

    if (req.type === 'select' && nuevoRequisito.value.optionsRaw) {
        req.options = nuevoRequisito.value.optionsRaw.split(',').map(o => o.trim()).filter(o => o !== '');
    }

    nuevaActividad.value.requisitos.custom.push(req);
    nuevoRequisito.value = { label: '', type: 'text', optionsRaw: '' };
};

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
        let tipoFinal = nuevaActividad.value.tipo === 'Otro' 
            ? nuevaActividad.value.tipoPersonalizado 
            : nuevaActividad.value.tipo;
        
        // Normalización: Primera letra Mayúscula, resto minúscula (Ej: Curso, Diplomado)
        if (tipoFinal) {
            tipoFinal = tipoFinal.trim();
            tipoFinal = tipoFinal.charAt(0).toUpperCase() + tipoFinal.slice(1).toLowerCase();
        }

        // PAYLOAD LIMPIO: Ajustado estrictamente al DTO del backend
        const formData = new FormData();
        formData.append('nombre', nuevaActividad.value.nombre);
        formData.append('tipo', tipoFinal || 'Actividad');
        formData.append('descripcion', nuevaActividad.value.descripcion);
        formData.append('id_evento', String(nuevaActividad.value.id_evento));
        if (nuevaActividad.value.fecha_inicio) formData.append('fecha_inicio', nuevaActividad.value.fecha_inicio);
        if (nuevaActividad.value.fecha_fin) formData.append('fecha_fin', nuevaActividad.value.fecha_fin);
        formData.append('requisitos', JSON.stringify(nuevaActividad.value.requisitos));
        formData.append('logistica_ids', JSON.stringify(nuevaActividad.value.logistica_ids || []));
        
        if (imagenArchivo.value) {
            formData.append('imagen', imagenArchivo.value);
        }

        if (isEditingActividad.value && editActividadId.value) {
            await api.put(`/actividades-academicas/${editActividadId.value}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
        } else {
            await api.post('/actividades-academicas', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
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
        

        // Registrar en historial
        registrarAccion(
          'actividad',
          isEditingActividad.value ? 'editar' : 'crear',
          isEditingActividad.value
            ? `Actividad editada: "${nuevaActividad.value.nombre}"`
            : `Nueva actividad creada: "${nuevaActividad.value.nombre}"`,
          {
            entidadId: editActividadId.value?.toString() ?? undefined,
            entidadNombre: nuevaActividad.value.nombre,
            metadatos: {
              tipo: nuevaActividad.value.tipo,
              modalidad: nuevaActividad.value.modalidad,
              evento_id: nuevaActividad.value.id_evento?.toString() ?? undefined,
            }
          }
        );
        

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

// Filtrar solo actividades activas para el catálogo
const getActividadesActivas = (actividades: any[]) => {
    return (actividades || []).filter(a => {
        const est = Number(a.status_raw ?? a.estado);
        const idStr = String(a.id);
        const isInactive = a.status === 'Inactivo' || est === -1 || inhabilitadosLocal.value.includes(idStr);
        return est === 1 && !isInactive;
    });
};

// Filtrar solo actividades inhabilitadas
const getActividadesInactivas = (actividades: any[]) => {
    return (actividades || []).filter(a => {
        const est = Number(a.status_raw ?? a.estado);
        const idStr = String(a.id);
        const result = est === -1 || a.status === 'Inactivo' || inhabilitadosLocal.value.includes(idStr);
        return result;
    });
};

// Agrupar actividades por Tipo para la vista estilo Netflix (Case Insensitive)
const getActividadesAgrupadas = (actividades: any[]) => {
  const activas = getActividadesActivas(actividades);
  const grupos: Record<string, any[]> = {};
  activas.forEach((act: any) => {
    // Normalizar a mayúsculas para la clave del grupo
    const normalizedType = (act.type || 'Actividad').trim().toUpperCase();
    if (!grupos[normalizedType]) {
      grupos[normalizedType] = [];
    }
    grupos[normalizedType]!.push(act);
  });
  
  // Ordenar: Alfabético por título
  Object.keys(grupos).forEach(key => {
    grupos[key]!.sort((a, b) => a.title.localeCompare(b.title));
  });
  
  return grupos;
};

const getStatusColor = (status: string) => {
  if (status === 'En curso') return 'text-green-600 bg-green-50 dark:bg-green-900/40 border border-green-200 dark:border-green-800';
  if (status === 'Inscripciones') return 'text-umsa-blue bg-blue-50 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-800';
  if (status === 'Inactivo') return 'text-red-600 bg-red-50 dark:bg-red-900/40 border border-red-200 dark:border-red-800';
  return 'text-slate-500 bg-slate-100 dark:bg-gray-800 dark:text-gray-400 border border-slate-200 dark:border-gray-700';
};

const openDetalleCurso = (courseId: any, status?: string, rawEstado?: any) => {
  const est = Number(rawEstado);
  if (status === 'Inactivo' || est === -1) {
    Swal.fire({
      icon: 'error',
      title: 'ACTIVIDAD BLOQUEADA',
      text: 'Esta actividad ha sido inhabilitada. Debe solicitar su reactivación al Super Usuario para poder ingresar al panel.',
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'ENTENDIDO'
    });
    return;
  }
  // Detectar contexto: ¿estamos en /admin o /coordinador?
  const isAdminContext = route.path.startsWith('/admin');
  const prefix = isAdminContext ? '/admin' : '/coordinador';

  if (route.name === 'coordinador-estudiantes-global' || route.name === 'admin-estudiantes') {
    router.push({ path: `${prefix}/actividades/${courseId}`, query: { tab: 'estudiantes' } });
  } else if (route.name === 'coordinador-ponentes-global' || route.name === 'admin-ponentes') {
    router.push({ path: `${prefix}/actividades/${courseId}`, query: { tab: 'ponentes' } });
  } else {
    router.push({ path: `${prefix}/gestion-eventos/${courseId}` });
  }
};

const changeStep = (delta: number) => {
  const nextStep = currentStep.value + delta;
  if (nextStep >= 1 && nextStep <= 5) {
    currentStep.value = nextStep;
  }
};

const solicitarActivacion = async (id: number, nombre: string) => {
    const result = await Swal.fire({
        title: '¿SOLICITAR ACTIVACIÓN?',
        text: `Se enviará un mensaje al Super Usuario para solicitar la reactivación de "${nombre}".`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#003B71',
        confirmButtonText: 'SÍ, ENVIAR SOLICITUD',
        cancelButtonText: 'CANCELAR'
    });

    if (result.isConfirmed) {
        try {
            Swal.fire({ title: 'Enviando solicitud...', didOpen: () => Swal.showLoading() });
            await api.post(`/actividades-academicas/${id}/solicitar-activacion`);
            Swal.fire('Solicitud Enviada', 'El Super Usuario ha sido notificado.', 'success');
        } catch (e) {
            Swal.fire('Error', 'No se pudo enviar la solicitud.', 'error');
        }
    }
};

const habilitarActividad = async (id: number, nombre: string) => {
    const result = await Swal.fire({
        title: '¿HABILITAR ACTIVIDAD?',
        text: `¿Está seguro de reactivar "${nombre}"? Volverá a ser visible en el catálogo público.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#10b981',
        confirmButtonText: 'SÍ, HABILITAR',
        cancelButtonText: 'CANCELAR'
    });

    if (result.isConfirmed) {
        try {
            await api.patch(`/actividades-academicas/${id}`, { estado: 1 });
            registrarAccion('actividad', 'crear', `Actividad reactivada: "${nombre}"`, { entidadId: id.toString(), entidadNombre: nombre });
            fetchEventos();
            Swal.fire('Activada', 'La actividad está nuevamente en línea.', 'success');
        } catch (e) {
            Swal.fire('Error', 'No se pudo habilitar.', 'error');
        }
    }
};
</script>

<template>
    <!-- PANEL DE DIAGNÓSTICO TEMPORAL -->
    <div class="fixed top-20 right-4 z-[9999] bg-black/80 backdrop-blur-md text-white p-4 rounded-2xl border border-white/20 text-[10px] font-mono shadow-2xl pointer-events-none">
       <div class="flex items-center gap-2 mb-2 text-umsa-gold font-bold uppercase tracking-widest border-b border-white/10 pb-2">
          <span class="material-symbols-outlined text-sm">bug_report</span> DIAGNÓSTICO
       </div>
       <div class="space-y-1">
          <p>EVENTOS CARGADOS: {{ eventosPublicados.length }}</p>
          <p>LOCAL INHABILITADOS: {{ inhabilitadosLocal.length }}</p>
          <p>LISTA LOCAL: {{ inhabilitadosLocal.join(', ') || 'VACÍA' }}</p>
       </div>
    </div>
  <div class="animate-in fade-in duration-500 max-w-7xl mx-auto space-y-8">
    
    <!-- VISTA: LISTADO -->
    <div v-show="!isCreating && !isCreatingEvento" id="view-listado" class="space-y-8">
      <div class="flex justify-center mb-8">
        <div class="relative w-full max-w-2xl group">
          <label class="absolute -top-3 left-6 px-2 bg-[#f8f9fc] dark:bg-black z-10 text-[9px] font-black text-slate-400 uppercase tracking-widest italic transition-colors">Buscador de Eventos y Actividades</label>
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
          <h2 class="text-3xl font-black text-primary-dark dark:text-white uppercase italic">Gestión de Eventos</h2>
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
                <button @click="inhabilitarEvento(evento.id, evento.nombreCorto)" class="bg-red-500/20 hover:bg-red-500/40 backdrop-blur-md text-white border border-red-500/30 px-4 py-3 rounded-xl transition-all shadow-lg flex items-center gap-2 group/btn cursor-pointer" title="Inhabilitar Evento">
                   <span class="material-symbols-outlined text-[18px]">block</span>
                </button>

                <div class="h-8 w-px bg-white/20 mx-1"></div>

                <button @click="resetNuevaActividad(evento.id); isCreating = true" class="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl transition-all shadow-lg flex items-center gap-2 font-black text-[10px] uppercase tracking-widest cursor-pointer">
                   <span class="material-symbols-outlined text-[18px]">add_circle</span> Nueva Actividad
                </button>

                <button v-if="getActividadesInactivas(evento.actividades).length > 0" class="bg-red-500/20 text-red-500 px-4 py-3 rounded-xl border border-red-500/30 flex items-center gap-2 animate-pulse">
                   <span class="material-symbols-outlined text-[18px]">folder_off</span>
                   <span class="text-[10px] font-black uppercase tracking-widest">{{ getActividadesInactivas(evento.actividades).length }} Archivadas</span>
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

          <div v-for="(acts, categoria) in getActividadesAgrupadas(evento.actividades)" :key="categoria + '-' + acts.length" class="mb-10 w-full overflow-hidden">
            <!-- Row Header -->
            <div class="flex items-end justify-between px-8 mb-4">
              <div>
                <h3 class="text-xl md:text-2xl font-black text-primary-dark dark:text-white uppercase tracking-tighter">{{ categoria }}</h3>
                <p class="text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-widest mt-1">Explorar {{ (acts as any[]).length }} disponibles</p>
              </div>
              <button @click="resetNuevaActividad(evento.id); isCreating = true; nuevaActividad.tipo = String(categoria); nuevaActividad.lockTipo = true; currentStep = 1;" class="text-[10px] font-black uppercase tracking-widest bg-white dark:bg-gray-800 hover:bg-slate-100 dark:hover:bg-gray-700 text-slate-600 dark:text-gray-300 border border-slate-200 dark:border-gray-700 px-4 py-2 rounded-xl transition-all flex items-center gap-2 relative z-20 cursor-pointer shadow-sm hover:shadow-md">
                <span class="material-symbols-outlined text-[14px]">add</span> Crear {{ categoria }}
              </button>
            </div>

            <!-- Horizontal Scroll Row -->
            <div class="flex overflow-x-auto gap-6 px-8 pb-8 pt-2 snap-x snap-mandatory flex-nowrap" style="scrollbar-width: none; -ms-overflow-style: none;">
              <!-- Tarjeta -->
              <div v-for="act in acts" :key="act.id" 
                @click="openDetalleCurso(act.id, act.status, act.status_raw || act.estado)" 
                :class="{'opacity-40 grayscale pointer-events-none scale-95': inhabilitadosLocal.includes(act.id)}"
                class="flex-none w-[280px] md:w-[320px] bg-white dark:bg-gray-900 rounded-[1.5rem] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-slate-200/60 dark:border-gray-800 hover:border-primary-light/50 dark:hover:border-gray-600 transition-all hover:-translate-y-1 hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] cursor-pointer group flex flex-col snap-start relative">
                
                <div class="relative h-48 w-full overflow-hidden shrink-0">
                  <div class="absolute inset-0 bg-primary-dark/10 group-hover:bg-transparent transition-colors z-10"></div>
                  
                  <!-- INDICADOR DE ESTADO (DEPURACIÓN) -->
                  <div class="absolute top-2 right-2 z-50 flex flex-col gap-1 items-end pointer-events-none">
                      <span class="bg-black/60 text-white text-[7px] px-1 rounded font-black shadow-sm">ID: {{ act.id }}</span>
                      <span :class="(act.status_raw === -1 || act.estado === -1 || inhabilitadosLocal.includes(act.id)) ? 'bg-red-500' : 'bg-green-500'" class="text-white text-[7px] px-1 rounded font-black shadow-sm">EST: {{ act.status_raw || act.estado }}</span>
                  </div>
                  
                  <!-- OVERLAY DE BLOQUEO (PREMIUM) -->
                  <div v-if="act.status === 'Inactivo'" class="absolute inset-0 z-40 bg-gray-900/40 backdrop-blur-[2px] flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
                    <span class="material-symbols-outlined text-white text-5xl mb-2 drop-shadow-lg">lock</span>
                    <p class="text-white text-[10px] font-black uppercase tracking-[0.2em] drop-shadow-md">Contenido Bloqueado</p>
                  </div>

                  <img :src="act.imagen || act.image" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" :alt="act.title">   
                  
                  <!-- ACCIONES RAPIDAS (FLOTANTES) -->
                  <div class="absolute top-3 left-3 z-50 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0 duration-300">
                    <template v-if="act.status !== 'Inactivo'">
                      <button @click.stop="editarActividad(act)" class="p-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-lg shadow-lg text-umsa-blue hover:scale-110 transition-all border border-blue-50/20" title="Editar Actividad">
                          <span class="material-symbols-outlined text-[18px]">edit</span>
                      </button>
                      <button @click.stop="inhabilitarActividad(act.id, act.title)" class="p-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-lg shadow-lg text-red-500 hover:scale-110 transition-all border border-red-50/20" title="Inhabilitar Actividad">
                          <span class="material-symbols-outlined text-[18px]">block</span>
                      </button>
                    </template>
                    <template v-else>
                      <button @click.stop="solicitarActivacion(act.id, act.title)" class="p-2 bg-umsa-gold text-white backdrop-blur-md rounded-lg shadow-lg hover:scale-110 transition-all border border-yellow-400/20" title="Solicitar Activación">
                          <span class="material-symbols-outlined text-[18px]">lock_open</span>
                      </button>
                    </template>
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

          <!-- SECCIÓN: ACTIVIDADES INHABILITADAS (ZONA DE CONTROL) -->
          <div v-if="getActividadesInactivas(evento.actividades).length > 0" class="mt-8 mx-8 mb-8 py-8 px-6 bg-gradient-to-br from-red-50/50 to-orange-50/30 dark:from-red-950/20 dark:to-gray-900/50 rounded-2xl border-2 border-dashed border-red-200 dark:border-red-900/40">
            <div class="flex items-center justify-between mb-6">
              <div class="flex items-center gap-4">
                <div class="p-3 bg-red-500 text-white rounded-2xl shadow-lg shadow-red-500/20">
                  <span class="material-symbols-outlined text-2xl">folder_off</span>
                </div>
                <div>
                  <h4 class="text-lg font-black text-red-600 dark:text-red-400 uppercase tracking-tight">Actividades Archivadas / Inhabilitadas</h4>
                  <p class="text-[10px] font-bold text-slate-500 dark:text-gray-500 uppercase tracking-[0.15em] mt-0.5">No visibles para estudiantes ni ponentes · Solo el Super Usuario puede reactivarlas</p>
                </div>
              </div>
              <span class="bg-red-500/10 text-red-500 text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest border border-red-200 dark:border-red-800">
                {{ getActividadesInactivas(evento.actividades).length }} inhabilitada{{ getActividadesInactivas(evento.actividades).length > 1 ? 's' : '' }}
              </span>
            </div>

            <!-- Lista de actividades inhabilitadas -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div v-for="act in getActividadesInactivas(evento.actividades)" :key="act.id" 
                class="flex items-center justify-between bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm p-4 rounded-2xl border border-red-100 dark:border-red-900/30 shadow-sm hover:shadow-md transition-all group/disabled">
                
                <div class="flex items-center gap-4 min-w-0">
                   <div class="w-14 h-14 bg-red-50 dark:bg-red-900/20 rounded-xl flex items-center justify-center shrink-0 border border-red-100 dark:border-red-800">
                      <span class="material-symbols-outlined text-red-400 text-2xl">visibility_off</span>
                   </div>
                   <div class="truncate">
                      <h5 class="text-[12px] font-black text-slate-700 dark:text-gray-200 uppercase truncate">{{ act.title }}</h5>
                      <div class="flex items-center gap-2 mt-1">
                        <span class="text-[8px] font-black text-red-500 uppercase tracking-widest bg-red-50 dark:bg-red-900/30 px-2 py-0.5 rounded border border-red-100 dark:border-red-800">Inhabilitada</span>
                        <span class="text-[8px] text-slate-400 font-bold">{{ act.type }}</span>
                      </div>
                   </div>
                </div>

                <div class="flex items-center gap-2 shrink-0">
                   <button @click.stop="solicitarActivacion(act.id, act.title)" 
                     class="flex items-center gap-2 px-4 py-2.5 bg-amber-500/10 hover:bg-amber-500 text-amber-600 hover:text-white rounded-xl transition-all border border-amber-300/30 hover:border-amber-500 font-black text-[9px] uppercase tracking-wider hover:shadow-lg hover:shadow-amber-500/20 hover:-translate-y-0.5"
                     title="Solicitar al Super Usuario que reactive esta actividad">
                     <span class="material-symbols-outlined text-[16px]">mail</span>
                     Solicitar Habilitación
                   </button>
                </div>
              </div>
            </div>
          </div>
          
          <div v-if="getActividadesActivas(evento.actividades).length === 0 && getActividadesInactivas(evento.actividades).length === 0" class="px-8 py-10 text-center">
            <p class="text-sm font-bold text-gray-500 uppercase tracking-widest">No hay actividades publicadas para esta categoría.</p>
          </div>
        </div>
      </div>
    </div>
    
    <div v-show="isCreating" id="view-creacion" class="space-y-10 animate-in fade-in duration-500">
      
      <div class="flex items-center justify-between border-b border-slate-200 dark:border-gray-800 pb-6">
          <div>
              <h2 class="text-3xl font-black text-primary-dark dark:text-white tracking-tighter uppercase italic">{{ isEditingActividad ? 'Editar Actividad' : 'Configurar Nueva Actividad' }}</h2>
              <p class="text-slate-400 dark:text-gray-500 font-medium mt-1 text-sm">Diseño, reglas y horarios del curso.</p>
          </div>
          <div class="flex items-center gap-3">
              <button v-if="isEditingActividad" @click="publicarActividad" :disabled="isLoading" class="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-[10px] uppercase rounded-xl transition-all shadow-sm">
                  <span class="material-symbols-outlined text-sm">save</span> Guardar Cambios
              </button>
              <button @click="isCreating = false" class="flex items-center gap-2 px-6 py-2.5 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 text-slate-500 dark:text-gray-400 font-black text-[10px] uppercase rounded-xl hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-200 transition-all shadow-sm">
                  <span class="material-symbols-outlined text-sm">arrow_back</span> Volver al Listado
              </button>
          </div>
      </div>

      <div class="max-w-4xl mx-auto mb-10">
          <div class="flex items-center justify-between relative">
              <div class="absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 dark:bg-gray-800 -z-10 -translate-y-1/2"></div>
              
              <!-- Step 1 -->
              <div @click="irAlPaso(1)" class="flex flex-col items-center bg-white dark:bg-gray-950 px-4 cursor-pointer select-none hover:opacity-80 transition-all">
                  <div class="w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-500"
                       :class="currentStep === 1 ? 'bg-primary-dark text-white border-umsa-gold scale-110 shadow-[0_0_15px_rgba(188,156,49,0.4)] dark:bg-blue-600' : (currentStep > 1 ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg' : 'bg-white dark:bg-gray-800 text-slate-300 dark:text-gray-500 border-slate-200 dark:border-gray-700')">
                      <span v-if="currentStep > 1" class="material-symbols-outlined text-xl">check</span>
                      <span v-else class="material-symbols-outlined text-xl">demography</span>
                  </div>
                  <span class="text-[10px] font-black uppercase mt-3" :class="currentStep === 1 ? 'text-primary-dark dark:text-white' : (currentStep > 1 ? 'text-emerald-500 dark:text-emerald-400 font-black' : 'text-slate-400 dark:text-gray-500')">Diseño</span>
              </div>
              
              <!-- Step 2 -->
              <div @click="irAlPaso(2)" class="flex flex-col items-center bg-white dark:bg-gray-950 px-4 cursor-pointer select-none hover:opacity-80 transition-all">
                  <div class="w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-500"
                       :class="currentStep === 2 ? 'bg-primary-dark text-white border-umsa-gold scale-110 shadow-[0_0_15px_rgba(37,99,235,0.2)] dark:bg-blue-600' : (currentStep > 2 ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg' : 'bg-white dark:bg-gray-800 text-slate-300 dark:text-gray-500 border-slate-200 dark:border-gray-700')">
                      <span v-if="currentStep > 2" class="material-symbols-outlined text-xl">check</span>
                      <span v-else class="material-symbols-outlined text-xl">verified</span>
                  </div>
                  <span class="text-[10px] font-black uppercase mt-3" :class="currentStep === 2 ? 'text-primary-dark dark:text-white' : (currentStep > 2 ? 'text-emerald-500 dark:text-emerald-400 font-black' : 'text-slate-400 dark:text-gray-500')">Aprobación</span>
              </div>

              <!-- Step 3 -->
              <div @click="irAlPaso(3)" class="flex flex-col items-center bg-white dark:bg-gray-950 px-4 cursor-pointer select-none hover:opacity-80 transition-all">
                  <div class="w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-500"
                       :class="currentStep === 3 ? 'bg-primary-dark text-white border-umsa-gold scale-110 shadow-[0_0_15px_rgba(37,99,235,0.2)] dark:bg-blue-600' : (currentStep > 3 ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg' : 'bg-white dark:bg-gray-800 text-slate-300 dark:text-gray-500 border-slate-200 dark:border-gray-700')">
                      <span v-if="currentStep > 3" class="material-symbols-outlined text-xl">check</span>
                      <span v-else class="material-symbols-outlined text-xl">schedule</span>
                  </div>
                  <span class="text-[10px] font-black uppercase mt-3" :class="currentStep === 3 ? 'text-primary-dark dark:text-white' : (currentStep > 3 ? 'text-emerald-500 dark:text-emerald-400 font-black' : 'text-slate-400 dark:text-gray-500')">Horarios</span>
              </div>

              <!-- Step 4 -->
              <div @click="irAlPaso(4)" class="flex flex-col items-center bg-white dark:bg-gray-950 px-4 cursor-pointer select-none hover:opacity-80 transition-all">
                  <div class="w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-500"
                       :class="currentStep === 4 ? 'bg-primary-dark text-white border-umsa-gold scale-110 shadow-[0_0_15px_rgba(37,99,235,0.2)] dark:bg-blue-600' : (currentStep > 4 ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg' : 'bg-white dark:bg-gray-800 text-slate-300 dark:text-gray-500 border-slate-200 dark:border-gray-700')">
                      <span v-if="currentStep > 4" class="material-symbols-outlined text-xl">check</span>
                      <span v-else class="material-symbols-outlined text-xl">person_add_alt</span>
                  </div>
                  <span class="text-[10px] font-black uppercase mt-3" :class="currentStep === 4 ? 'text-primary-dark dark:text-white' : (currentStep > 4 ? 'text-emerald-500 dark:text-emerald-400 font-black' : 'text-slate-400 dark:text-gray-500')">Requisitos</span>
              </div>

              <!-- Step 5 -->
              <div @click="irAlPaso(5)" class="flex flex-col items-center bg-white dark:bg-gray-950 px-4 cursor-pointer select-none hover:opacity-80 transition-all">
                  <div class="w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-500"
                       :class="currentStep === 5 ? 'bg-primary-dark text-white border-umsa-gold scale-110 shadow-[0_0_15px_rgba(188,156,49,0.4)] dark:bg-blue-600' : (currentStep > 5 ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg' : 'bg-white dark:bg-gray-800 text-slate-300 dark:text-gray-500 border-slate-200 dark:border-gray-700')">
                      <span v-if="currentStep > 5" class="material-symbols-outlined text-xl">check</span>
                      <span v-else class="material-symbols-outlined text-xl">check_circle</span>
                  </div>
                  <span class="text-[10px] font-black uppercase mt-3" :class="currentStep === 5 ? 'text-primary-dark dark:text-white' : (currentStep > 5 ? 'text-emerald-500 dark:text-emerald-400 font-black' : 'text-slate-400 dark:text-gray-500')">Resumen</span>
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
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-10">
                  <div class="space-y-6">
                      <div>
                          <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Nombre Oficial de la Actividad</label>
                          <input v-model="nuevaActividad.nombre" type="text" placeholder="Ej: Especialidad en Microbiología..." class="w-full px-5 py-3.5 bg-slate-50 dark:bg-gray-800 border-2 border-slate-100 dark:border-gray-700 rounded-2xl focus:border-umsa-blue outline-none transition-all font-bold text-sm">
                      </div>
                      <div>
                          <label class="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest block mb-2">Tipo de Actividad</label>
                          <select v-model="nuevaActividad.tipo" :disabled="nuevaActividad.lockTipo" :class="nuevaActividad.lockTipo ? 'bg-slate-100 dark:bg-gray-700 cursor-not-allowed opacity-70' : 'bg-slate-50 dark:bg-gray-800 cursor-pointer'" class="w-full border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-umsa-blue font-bold text-primary-dark dark:text-gray-200 uppercase transition-all">
                              <option value="Diplomado">Diplomado</option>
                              <option value="Especialidad">Especialidad</option>
                              <option value="Taller">Taller</option>
                              <option value="Seminario">Seminario</option>
                              <option value="Curso">Curso</option>
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
                              <div v-if="imagenPreview" class="absolute inset-0 z-10 overflow-hidden rounded-xl">
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

          <!-- Asignación de Personal de Logística -->
          <div class="bg-white dark:bg-gray-900 p-8 rounded-[2rem] shadow-sm border border-slate-100 dark:border-gray-800 mt-6">
              <div class="flex items-center justify-between mb-6">
                  <div>
                      <h3 class="text-lg font-black text-primary-dark dark:text-white uppercase italic">Personal de Logística Asignado</h3>
                      <p class="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mt-1">Selecciona el personal que gestionará la asistencia de esta actividad</p>
                  </div>
                  <div class="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 flex items-center justify-center border border-emerald-100 dark:border-emerald-800 shadow-sm">
                      <span class="material-symbols-outlined text-lg">support_agent</span>
                  </div>
              </div>

              <!-- Buscador de logística local -->
              <div class="relative w-full mb-6">
                  <span class="absolute inset-y-0 left-4 flex items-center text-slate-400">
                      <span class="material-symbols-outlined text-lg">search</span>
                  </span>
                  <input v-model="filtroLogistica" type="text" placeholder="Buscar personal de logística..." class="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-gray-800 border-2 border-slate-100 dark:border-gray-700 rounded-xl text-xs font-bold focus:border-emerald-500 outline-none transition-all" />
              </div>

              <div v-if="logisticaFiltrada.length === 0" class="text-center py-6 border border-dashed border-slate-200 dark:border-gray-800 rounded-2xl">
                  <p class="text-xs text-slate-400 font-bold uppercase">No se encontró personal de logística</p>
              </div>

              <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[250px] overflow-y-auto pr-2" style="scrollbar-width: thin;">
                  <div v-for="user in logisticaFiltrada" :key="user.id"
                       @click="toggleLogisticaUsuario(user.id)"
                       :class="nuevaActividad.logistica_ids.includes(user.id) 
                            ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-800/80 shadow-md ring-2 ring-emerald-500/20' 
                            : 'border-slate-100 dark:border-gray-800 hover:border-slate-200 dark:hover:border-gray-700 bg-white dark:bg-gray-900'"
                       class="p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between group">
                      <div class="flex items-center gap-3">
                          <div class="w-9 h-9 rounded-xl bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-gray-400 flex items-center justify-center font-black text-xs uppercase group-hover:scale-105 transition-transform"
                               :class="{'bg-emerald-500 text-white dark:bg-emerald-600': nuevaActividad.logistica_ids.includes(user.id)}">
                              {{ user.displayName.charAt(0) }}
                          </div>
                          <div>
                              <p class="text-xs font-black text-slate-700 dark:text-gray-200 uppercase leading-tight">{{ user.displayName }}</p>
                              <p class="text-[9px] text-slate-400 font-bold mt-1 font-mono select-all">{{ user.email }}</p>
                          </div>
                      </div>
                      <span class="material-symbols-outlined text-lg"
                            :class="nuevaActividad.logistica_ids.includes(user.id) ? 'text-emerald-500' : 'text-slate-300 dark:text-gray-700 group-hover:text-slate-400'">
                          {{ nuevaActividad.logistica_ids.includes(user.id) ? 'check_circle' : 'radio_button_unchecked' }}
                      </span>
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

      <!-- Contenido del Paso 4: Requisitos de Pre-inscripción -->
      <div v-show="currentStep === 4" class="space-y-8 animate-in slide-in-from-right-8 duration-500">
          <div class="bg-white dark:bg-gray-900 p-8 rounded-[2rem] shadow-sm border border-slate-100 dark:border-gray-800">
              <div class="flex items-center justify-between mb-8">
                  <div>
                      <h3 class="text-xl font-black text-primary-dark dark:text-white uppercase italic">4. Requisitos de Pre-inscripción</h3>
                      <p class="text-xs font-bold text-slate-500 dark:text-gray-400 mt-1 italic italic">Configura qué datos debe proporcionar el estudiante para inscribirse.</p>
                  </div>
                  <div class="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 rounded-xl border border-blue-100 dark:border-blue-800">
                      <span class="material-symbols-outlined text-blue-600 text-sm">info</span>
                      <span class="text-[9px] font-black text-blue-700 dark:text-blue-400 uppercase tracking-widest">Los datos base se autocompletarán del perfil del estudiante</span>
                  </div>
              </div>

              <div class="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  <!-- Columna: Datos Base del Perfil -->
                  <div class="space-y-6">
                      <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2 mb-4">Datos del Perfil (Entidad Persona)</h4>
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div v-for="(val, key) in nuevaActividad.requisitos.base" :key="key" 
                               class="flex items-center justify-between p-4 bg-slate-50 dark:bg-gray-800/50 rounded-2xl border border-slate-100 dark:border-gray-800 transition-all hover:border-blue-300">
                              <span class="text-[10px] font-bold text-slate-600 dark:text-gray-300 uppercase truncate pr-2">
                                  {{ key.replace(/_/g, ' ') }}
                                  <span v-if="['nombres', 'primer_apellido', 'segundo_apellido', 'documento_identidad', 'genero', 'celular', 'afiliacion'].includes(key)" class="text-red-500 font-black">*</span>
                              </span>
                              <label class="relative inline-flex items-center" :class="['nombres', 'primer_apellido', 'segundo_apellido', 'documento_identidad', 'genero', 'celular', 'afiliacion'].includes(key) ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'">
                                  <input type="checkbox" 
                                         :checked="['nombres', 'primer_apellido', 'segundo_apellido', 'documento_identidad', 'genero', 'celular', 'afiliacion'].includes(key) ? true : nuevaActividad.requisitos.base[key]"
                                         @change="!['nombres', 'primer_apellido', 'segundo_apellido', 'documento_identidad', 'genero', 'celular', 'afiliacion'].includes(key) ? nuevaActividad.requisitos.base[key] = !nuevaActividad.requisitos.base[key] : null"
                                         :disabled="['nombres', 'primer_apellido', 'segundo_apellido', 'documento_identidad', 'genero', 'celular', 'afiliacion'].includes(key)" 
                                         class="sr-only peer">
                                  <div class="w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all dark:border-gray-600 peer-checked:bg-umsa-blue"></div>
                              </label>
                          </div>
                      </div>
                  </div>

                  <!-- Columna: Campos Personalizados -->
                  <div class="space-y-6">
                      <div class="flex items-center justify-between border-b pb-2 mb-4">
                          <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Requisitos Personalizados (Máx. 10)</h4>
                          <span class="text-[9px] font-bold text-blue-600 uppercase">{{ nuevaActividad.requisitos.custom.length }} / 10</span>
                      </div>

                      <div v-if="nuevaActividad.requisitos.custom.length === 0" class="flex flex-col items-center justify-center p-8 bg-slate-50 dark:bg-gray-800/40 border-2 border-dashed border-slate-200 dark:border-gray-700 rounded-2xl opacity-60">
                          <span class="material-symbols-outlined text-4xl mb-2">add_task</span>
                          <p class="text-[10px] font-black text-slate-500 uppercase">No has añadido requisitos personalizados aún</p>
                      </div>

                      <div class="space-y-3">
                          <div v-for="(req, idx) in nuevaActividad.requisitos.custom" :key="idx" 
                               class="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl animate-in slide-in-from-bottom-2">
                              <span class="material-symbols-outlined text-sm text-blue-500">{{ req.type === 'select' ? 'list' : (req.type === 'number' ? '123' : 'text_fields') }}</span>
                              <div class="flex-1 min-w-0">
                                  <p class="text-xs font-black text-slate-700 dark:text-white truncate">{{ req.label }}</p>
                                  <p class="text-[9px] font-bold text-slate-400 uppercase">{{ req.type }} <span v-if="req.type === 'select'">({{ req.options.length }} opciones)</span></p>
                              </div>
                              <button v-if="!req.mandatory" @click="nuevaActividad.requisitos.custom.splice(idx, 1)" class="w-8 h-8 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition-all">
                                  <span class="material-symbols-outlined text-sm">delete</span>
                              </button>
                              <span v-else class="text-[8px] font-black text-blue-500 uppercase px-2 italic">Fijo</span>
                          </div>
                      </div>

                      <div v-if="nuevaActividad.requisitos.custom.length < 10" class="p-5 bg-blue-50/30 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/50 rounded-2xl space-y-4">
                          <div class="grid grid-cols-2 gap-3">
                              <input v-model="nuevoRequisito.label" type="text" placeholder="Ej: Talla de Polera" class="col-span-2 px-4 py-2 text-xs font-bold bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl outline-none focus:border-blue-500">
                              <select v-model="nuevoRequisito.type" class="px-4 py-2 text-xs font-bold bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl outline-none">
                                  <option value="text">Texto Libre</option>
                                  <option value="number">Número</option>
                                  <option value="select">Selección</option>
                              </select>
                              <div v-if="nuevoRequisito.type === 'select'" class="col-span-2">
                                  <input v-model="nuevoRequisito.optionsRaw" type="text" placeholder="Opciones sep. por comas (Ej: S, M, L)" class="w-full px-4 py-2 text-xs font-bold bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl outline-none focus:border-blue-500">
                              </div>
                          </div>
                          <button @click="agregarRequisitoPersonalizado" :disabled="!nuevoRequisito.label" class="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-md">
                              + Añadir Requisito
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      </div>

      <!-- Contenido del Paso 5 (Anterior 4) -->
      <div v-show="currentStep === 5" class="space-y-8 animate-in zoom-in-95 duration-500">
          <div class="bg-white dark:bg-gray-900 p-8 rounded-[2rem] shadow-sm border-l-[10px] border-l-umsa-gold dark:border-l-yellow-600 border border-slate-100 dark:border-gray-800">
              <h3 class="text-xl font-black text-primary-dark dark:text-white uppercase italic mb-4">5. Confirmación y Revisión</h3>
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

                      <!-- BLOQUE DE REQUISITOS (RESUMEN) -->
                      <div class="p-6 bg-blue-50/50 dark:bg-blue-950/20 rounded-[2rem] border-2 border-dashed border-blue-100 dark:border-blue-900/30">
                          <div class="flex items-center gap-2 mb-4">
                              <span class="material-symbols-outlined text-blue-600 text-lg">fact_check</span>
                              <h4 class="text-xs font-black text-blue-800 dark:text-blue-300 uppercase tracking-widest">Resumen de Requisitos</h4>
                          </div>
                          
                          <div class="space-y-4">
                              <div>
                                  <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Datos del Perfil Activados:</span>
                                  <div class="flex flex-wrap gap-1.5">
                                      <template v-for="(val, key) in nuevaActividad.requisitos.base" :key="key">
                                          <span v-if="val" class="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 px-2 py-1 rounded-md text-[8px] font-black text-slate-600 dark:text-gray-400 uppercase">
                                              {{ key.toString().replace(/_/g, ' ') }}
                                          </span>
                                      </template>
                                  </div>
                              </div>
                              
                              <div v-if="nuevaActividad.requisitos.custom.length > 0">
                                  <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Campos Personalizados ({{ nuevaActividad.requisitos.custom.length }}):</span>
                                  <div class="grid grid-cols-1 gap-2">
                                      <div v-for="(req, aIdx) in nuevaActividad.requisitos.custom" :key="aIdx" class="flex items-center justify-between bg-blue-100/50 dark:bg-blue-900/20 px-3 py-1.5 rounded-xl border border-blue-200/50 dark:border-blue-800">
                                          <span class="text-[9px] font-black text-slate-300 dark:text-gray-600 hidden sm:block">{{ Number(aIdx) + 1 }}</span>
                                          <span class="text-[9px] font-black text-blue-700 dark:text-blue-400 uppercase">{{ req.label }}</span>
                                          <span class="text-[8px] font-bold text-blue-500 uppercase italic">{{ req.type }}</span>
                                      </div>
                                  </div>
                              </div>
                              <div v-else class="text-[9px] font-bold text-slate-400 uppercase italic">Sin campos personalizados adicionales.</div>
                          </div>
                      </div>
                  </div>

                  <!-- Columna Preview Imagen -->
                  <div class="relative rounded-[2rem] overflow-hidden border-2 border-slate-100 dark:border-gray-800 bg-slate-50 dark:bg-gray-800 aspect-square lg:aspect-auto">
                      <div v-if="imagenPreview" class="absolute inset-0 z-10">
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
          
          <div class="flex items-center gap-3">
              <button v-if="isEditingActividad" @click="publicarActividad" :disabled="isLoading"
                class="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-[11px] uppercase rounded-xl flex items-center gap-2 transition-all shadow-xl hover:-translate-y-0.5">
                  <span class="material-symbols-outlined text-[18px]">save</span> Guardar Cambios
              </button>
              
              <button v-if="currentStep < 5" @click="changeStep(1)" 
                class="px-8 py-3 bg-primary-dark dark:bg-blue-600 text-white font-black text-[11px] uppercase rounded-xl hover:bg-umsa-blue dark:hover:bg-blue-500 flex items-center gap-2 transition-all shadow-xl hover:-translate-y-0.5">
                  Continuar <span class="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>

              <button v-else @click="publicarActividad" :disabled="isLoading"
                class="px-8 py-3 bg-umsa-gold hover:bg-yellow-600 text-white font-black text-[11px] uppercase rounded-xl flex items-center gap-2 transition-all shadow-xl hover:-translate-y-0.5 disabled:opacity-50">
                  <span class="material-symbols-outlined text-[18px]">publish</span> {{ isEditingActividad ? 'Guardar Cambios' : 'Publicar Actividad' }}
              </button>
          </div>
      </div>

    </div>

    <!-- PANEL FUSIÓN: CLON LITERAL DE GESTIÓN DE EVENTOS -->
    <!-- PANEL FUSIÓN: CLON LITERAL DE GESTIÓN DE EVENTOS (MEJORADO CON WIZARD) -->
    <div v-if="isCreatingEvento" class="bg-white dark:bg-gray-900 rounded-[2rem] shadow-xl shadow-umsa-blue/10 dark:shadow-black/50 border border-blue-100 dark:border-gray-800 animate-in slide-in-from-top-4 duration-500 overflow-hidden relative mb-20">
        <div class="bg-gradient-to-r from-umsa-blue to-emerald-500 p-8 pb-10 relative overflow-hidden">
            <span class="material-symbols-outlined absolute -right-4 -top-8 text-[120px] text-white/10 rotate-12">design_services</span>
            <div class="flex justify-between items-start relative z-20">
                <h3 class="text-2xl md:text-3xl font-black text-white uppercase italic tracking-tighter drop-shadow-md flex items-center gap-3">
                    <span class="material-symbols-outlined text-3xl">{{ isEditingEvento ? 'edit_calendar' : 'add_circle' }}</span>
                    {{ isEditingEvento ? 'Editar Gestión de Evento' : 'Crear Nueva Gestión de Evento' }}
                </h3>
                <button @click="isCreatingEvento = false" class="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl border border-white/20 transition-all flex items-center gap-2">
                    <span class="material-symbols-outlined text-sm">close</span>
                    <span class="text-[9px] font-black uppercase tracking-widest">cancelar</span>
                </button>
            </div>
        </div>

        <!-- BARRA DE NAVEGACIÓN DEL WIZARD (PASOS) -->
        <div class="bg-slate-50 dark:bg-gray-800/50 border-b border-slate-100 dark:border-gray-800 px-8 py-4 flex items-center justify-between overflow-x-auto thin-scrollbar">
            <div v-for="step in totalSteps" :key="step" 
                 @click="irAlPaso(step)"
                 class="flex items-center gap-2 shrink-0 cursor-pointer hover:opacity-80 transition-all select-none">
                <div :class="[
                    currentStep === step ? 'bg-umsa-blue text-white ring-4 ring-blue-100 dark:ring-blue-900/30' : 
                    (currentStep > step ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-gray-700 text-slate-500'),
                    'w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black transition-all duration-500'
                ]">
                    <span v-if="currentStep > step" class="material-symbols-outlined text-sm">check</span>
                    <span v-else>{{ step }}</span>
                </div>
                <span :class="currentStep === step ? 'text-primary-dark dark:text-white' : 'text-slate-400'" class="text-[9px] font-black uppercase tracking-widest hidden md:block mr-4">
                    {{ 
                        step === 1 ? 'Identidad' : 
                        step === 2 ? 'Narrativa' : 
                        step === 3 ? 'Directorio' : 
                        step === 4 ? 'Logística' : 
                        step === 5 ? 'Ubicación' : 'Cronograma' 
                    }}
                </span>
                <div v-if="step < totalSteps" class="h-[2px] w-8 bg-slate-200 dark:bg-gray-700 mx-2 hidden lg:block"></div>
            </div>
        </div>
        
        <form @submit.prevent="handleSaveEvento" class="bg-white dark:bg-gray-900 p-8 md:p-12 min-h-[600px] flex flex-col relative z-20">
            
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 flex-1">
                
                <!-- ÁREA DE EDICIÓN (PASOS) -->
                <div class="lg:col-span-7 space-y-8 animate-in slide-in-from-left-8 duration-500">
                    
                    <!-- PASO 1: IDENTIDAD VISUAL -->
                    <div v-if="currentStep === 1" class="space-y-6">
                        <div class="flex items-center gap-3 border-b border-slate-100 dark:border-gray-800 pb-4 mb-6">
                            <span class="material-symbols-outlined text-umsa-blue">palette</span>
                            <h4 class="text-sm font-black text-primary-dark dark:text-white uppercase italic">Paso 1: Identidad Visual y Portada</h4>
                        </div>
                        <div>
                            <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Nombre Principal del Evento</label>
                            <input v-model="formEvento.nombre" type="text" required placeholder="Ej: Congreso Internacional de Ciencias" class="w-full bg-slate-50 dark:bg-gray-800 border-2 border-slate-100 dark:border-gray-700 focus:border-umsa-blue outline-none rounded-2xl px-5 py-4 text-sm font-bold shadow-sm" />
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Sigla / Abreviación (Para el Header)</label>
                                <input v-model="formEvento.sigla" type="text" placeholder="Ej: TYAN" class="w-full bg-slate-50 dark:bg-gray-800 border-2 border-slate-100 dark:border-gray-700 focus:border-umsa-blue rounded-2xl px-5 py-3 text-sm font-black uppercase" />
                            </div>
                            <div>
                                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Texto del Badge (Botón Verde)</label>
                                <input v-model="formEvento.institucion_badge" type="text" placeholder="Ej: Evento Oficial OEA/TYAN" class="w-full bg-slate-50 dark:bg-gray-800 border-2 border-slate-100 dark:border-gray-700 focus:border-umsa-blue rounded-2xl px-5 py-3 text-sm font-bold uppercase" />
                            </div>
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Versión / Slogan</label>
                                <input v-model="formEvento.version" type="text" placeholder="Ej: 4ta Edición" class="w-full bg-slate-50 dark:bg-gray-800 border-2 border-slate-100 dark:border-gray-700 focus:border-umsa-blue rounded-2xl px-5 py-3 text-sm font-bold" />
                            </div>
                            <div>
                                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Gestión</label>
                                <input v-model="formEvento.gestion" type="text" placeholder="2025" class="w-full bg-slate-50 dark:bg-gray-800 border-2 border-slate-100 dark:border-gray-700 focus:border-umsa-blue rounded-2xl px-5 py-3 text-sm font-bold" />
                            </div>
                            <div>
                                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Color de Identidad</label>
                                <div class="flex items-center gap-3 bg-slate-50 dark:bg-gray-800 border-2 border-slate-100 dark:border-gray-700 rounded-2xl px-4 py-2">
                                    <input v-model="formEvento.color_principal" type="color" class="w-10 h-10 border-none bg-transparent cursor-pointer" />
                                    <span class="text-[10px] font-black uppercase text-slate-500">{{ formEvento.color_principal }}</span>
                                </div>
                            </div>
                        </div>
                        <div class="grid grid-cols-2 gap-6">
                            <div class="space-y-4">
                                <div>
                                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Logo del Evento</label>
                                    <p class="text-[8px] font-bold text-slate-400 uppercase mt-0.5">PNG/SVG Transparente • 512x512px</p>
                                </div>
                                <div class="relative h-32 bg-slate-50 dark:bg-gray-800 border-2 border-dashed border-slate-200 dark:border-gray-700 rounded-2xl flex flex-col items-center justify-center p-4 overflow-hidden">
                                    <img v-if="resolvedLogo" :src="resolvedLogo" class="w-full h-full object-contain z-10">
                                    <template v-else>
                                        <span class="material-symbols-outlined text-slate-300 text-3xl">image</span>
                                        <span class="text-[8px] text-slate-400 font-bold uppercase">Subir Logo Oficial</span>
                                    </template>
                                    <input type="file" @change="onLogoChange" class="absolute inset-0 opacity-0 cursor-pointer">
                                </div>
                            </div>
                            <div class="space-y-4">
                                <div>
                                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Banner Principal (Hero)</label>
                                    <p class="text-[8px] font-bold text-slate-400 uppercase mt-0.5">JPG/PNG • Full HD (1920x1080px)</p>
                                </div>
                                <div class="relative h-32 bg-slate-50 dark:bg-gray-800 border-2 border-dashed border-slate-200 dark:border-gray-700 rounded-2xl flex flex-col items-center justify-center p-4 overflow-hidden">
                                    <img v-if="resolvedBanner" :src="resolvedBanner" class="w-full h-full object-cover z-10">
                                    <template v-else>
                                        <span class="material-symbols-outlined text-slate-300 text-3xl">wallpaper</span>
                                        <span class="text-[8px] text-slate-400 font-bold uppercase">Subir Fondo Hero</span>
                                    </template>
                                    <input type="file" @change="onFondoChange" class="absolute inset-0 opacity-0 cursor-pointer">
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- PASO 2: NARRATIVA Y LINKS -->
                    <div v-if="currentStep === 2" class="space-y-6">
                        <div class="flex items-center gap-3 border-b border-slate-100 dark:border-gray-800 pb-4 mb-6">
                            <span class="material-symbols-outlined text-umsa-blue">auto_stories</span>
                            <h4 class="text-sm font-black text-primary-dark dark:text-white uppercase italic">Paso 2: Narrativa y Enlaces Externos</h4>
                        </div>
                        <div class="space-y-4">
                            <div>
                                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 italic">¿De qué trata este evento? (Párrafo 1)</label>
                                <textarea v-model="formEvento.sobre_evento_1" rows="4" class="w-full bg-slate-50 dark:bg-gray-800 border-2 border-slate-100 dark:border-gray-700 rounded-2xl px-5 py-4 text-sm font-bold" placeholder="Describe los objetivos y la importancia del evento..."></textarea>
                            </div>
                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 italic">Link Facebook (Opcional)</label>
                                    <input v-model="formEvento.link_facebook" type="text" class="w-full bg-slate-50 dark:bg-gray-800 border-2 border-slate-100 dark:border-gray-700 rounded-xl px-4 py-3 text-[10px] font-bold" placeholder="https://facebook.com/..." />
                                </div>
                                <div>
                                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 italic">Link Web/Externo (Opcional)</label>
                                    <input v-model="formEvento.link_web" type="text" class="w-full bg-slate-50 dark:bg-gray-800 border-2 border-slate-100 dark:border-gray-700 rounded-xl px-4 py-3 text-[10px] font-bold" placeholder="https://mi-evento.com" />
                                </div>
                            </div>
                            <div>
                                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 italic">Frase Destacada (Quote Central)</label>
                                <input v-model="formEvento.frase_destacada" type="text" class="w-full bg-slate-50 dark:bg-gray-800 border-2 border-slate-100 dark:border-gray-700 rounded-2xl px-5 py-4 text-sm font-black text-umsa-blue italic" placeholder="Ej: 'Innovación que transforma el futuro académico'" />
                            </div>
                            <div>
                                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 italic">Información Adicional (Párrafo 2)</label>
                                <textarea v-model="formEvento.sobre_evento_2" rows="3" class="w-full bg-slate-50 dark:bg-gray-800 border-2 border-slate-100 dark:border-gray-700 rounded-2xl px-5 py-4 text-sm font-bold" placeholder="Datos extra, historia previa o invitación final..."></textarea>
                            </div>
                        </div>
                    </div>

                    <!-- PASO 3: DIRECTORIO -->
                    <div v-if="currentStep === 3" class="space-y-6">
                        <div class="flex items-center justify-between border-b border-slate-100 dark:border-gray-800 pb-4 mb-6">
                            <div class="flex items-center gap-3">
                                <span class="material-symbols-outlined text-emerald-600">group</span>
                                <h4 class="text-sm font-black text-primary-dark dark:text-white uppercase italic">Paso 3: Directorio del Evento</h4>
                            </div>
                            <button @click.prevent="showRegistroRapidoPonente = true" class="text-[9px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg">REGISTRAR NUEVO</button>
                        </div>

                        <!-- Controles de selección y privacidad -->
                        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 dark:bg-gray-800/40 p-4 rounded-xl border border-slate-100 dark:border-gray-800">
                            <!-- Selector Mostrar Correos -->
                            <label class="flex items-center gap-2 cursor-pointer select-none bg-white dark:bg-gray-900 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-gray-700">
                                <input type="checkbox" v-model="formEvento.mostrar_correos" class="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer" />
                                <span class="text-[9px] font-black uppercase text-slate-500 dark:text-gray-400 tracking-wider">Mostrar Correos</span>
                            </label>
                            <!-- Botones Seleccionar Todo -->
                            <div class="flex items-center gap-3">
                                <button @click.prevent="seleccionarTodosPonentes" class="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:hover:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all shadow-sm cursor-pointer">
                                    <span class="material-symbols-outlined text-[12px]">done_all</span> Seleccionar Todos
                                </button>
                                <button @click.prevent="deseleccionarTodosPonentes" class="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-900/40 text-rose-500 dark:text-rose-400 border border-rose-200 dark:border-rose-800 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all shadow-sm cursor-pointer">
                                    <span class="material-symbols-outlined text-[12px]">close</span> Deseleccionar Todos
                                </button>
                            </div>
                        </div>
                        <div class="space-y-4">
                            <div class="relative">
                                <input v-model="filtroPonente" type="text" placeholder="Buscar personal..." class="w-full bg-slate-50 dark:bg-gray-800 border-2 border-slate-100 dark:border-gray-700 rounded-xl px-4 py-3 pl-10 text-xs font-bold" />
                                <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                            </div>
                            <div class="bg-slate-50 dark:bg-gray-950 border-2 border-slate-100 dark:border-gray-800 rounded-2xl p-4 max-h-[300px] overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-3 thin-scrollbar">
                                <label v-for="pn in ponentesFiltrados" :key="pn.id" class="flex items-center gap-3 p-4 bg-white dark:bg-gray-900 border border-slate-100 dark:border-gray-800 rounded-xl cursor-pointer hover:border-emerald-500 transition-all group">
                                    <input type="checkbox" :value="pn.id" v-model="formEvento.ponentes_seleccionados" class="w-5 h-5 rounded border-2 border-slate-200 text-emerald-500" />
                                    <div class="flex flex-col min-w-0">
                                        <span class="text-[10px] font-black text-primary-dark dark:text-gray-200 truncate">{{ pn.displayName }}</span>
                                        <span class="text-[8px] font-bold uppercase tracking-widest text-emerald-500">{{ pn.roleLabel }}</span>
                                    </div>
                                </label>
                            </div>
                        </div>
                    </div>

                    <!-- PASO 4: LOGÍSTICA -->
                    <div v-if="currentStep === 4" class="space-y-6">
                        <div class="flex items-center gap-3 border-b border-slate-100 dark:border-gray-800 pb-4 mb-6">
                            <span class="material-symbols-outlined text-umsa-blue">schedule</span>
                            <h4 class="text-sm font-black text-primary-dark dark:text-white uppercase italic">Paso 4: Logística y Fechas</h4>
                        </div>
                        <div class="grid grid-cols-2 gap-6">
                            <div>
                                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Fecha de Inicio</label>
                                <input v-model="formEvento.fecha_inicio" type="date" required class="w-full bg-slate-50 dark:bg-gray-800 border-2 border-slate-100 dark:border-gray-700 rounded-xl px-4 py-3 text-sm font-bold" />
                            </div>
                            <div>
                                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Fecha de Fin</label>
                                <input v-model="formEvento.fecha_fin" type="date" required class="w-full bg-slate-50 dark:bg-gray-800 border-2 border-slate-100 dark:border-gray-700 rounded-xl px-4 py-3 text-sm font-bold" />
                            </div>
                        </div>
                        <div>
                             <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Estado de Publicación</label>
                             <select v-model="formEvento.estado" class="w-full bg-slate-50 dark:bg-gray-800 border-2 border-slate-100 dark:border-gray-700 rounded-xl px-4 py-3 text-sm font-black uppercase text-emerald-600">
                                 <option :value="2">Planificación</option>
                                 <option :value="1">Activo / Publicado</option>
                                 <option :value="0">Concluido / Histórico</option>
                                 <option :value="3">Borrador / Invisible</option>
                             </select>
                        </div>
                    </div>

                    <!-- PASO 5: UBICACIÓN -->
                    <div v-if="currentStep === 5" class="space-y-6">
                        <div class="flex items-center gap-3 border-b border-slate-100 dark:border-gray-800 pb-4 mb-6">
                            <span class="material-symbols-outlined text-umsa-blue">room</span>
                            <h4 class="text-sm font-black text-primary-dark dark:text-white uppercase italic">Paso 5: Sede y Mapa</h4>
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div class="col-span-2 sm:col-span-1">
                                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Ciudad / Sede</label>
                                <input v-model="formEvento.ubicacion" type="text" placeholder="Ej: La Paz" class="w-full bg-slate-50 dark:bg-gray-800 border-2 border-slate-100 dark:border-gray-700 rounded-xl px-4 py-3 text-sm font-bold" />
                            </div>
                            <div class="col-span-2 sm:col-span-1">
                                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Dirección Exacta</label>
                                <input v-model="formEvento.direccion" type="text" placeholder="Ej: Edif. Central UMSA" class="w-full bg-slate-50 dark:bg-gray-800 border-2 border-slate-100 dark:border-gray-700 rounded-xl px-4 py-3 text-sm font-bold" />
                            </div>
                        </div>
                        <div>
                            <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Iframe de Google Maps</label>
                            <textarea v-model="formEvento.google_maps_link" rows="3" placeholder="Pega aquí el <iframe ...>" class="w-full bg-slate-50 dark:bg-gray-800 border-2 border-slate-100 dark:border-gray-700 rounded-2xl px-5 py-4 text-[10px] font-mono text-emerald-600 resize-none"></textarea>
                        </div>
                    </div>

                    <!-- PASO 6: CRONOGRAMA -->
                    <div v-if="currentStep === 6" class="space-y-6">
                        <div class="flex items-center justify-between border-b border-slate-100 dark:border-gray-800 pb-4 mb-6">
                            <div class="flex items-center gap-3">
                                <span class="material-symbols-outlined text-umsa-gold">view_timeline</span>
                                <h4 class="text-sm font-black text-primary-dark dark:text-white uppercase italic">Paso 6: Cronograma Detallado</h4>
                            </div>
                            <button @click.prevent="agregarDiaEvento" class="bg-umsa-gold text-white px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg">+ AGREGAR DÍA</button>
                        </div>
                        <div class="space-y-4 max-h-[400px] overflow-y-auto thin-scrollbar pr-2">
                            <div v-for="(dia, dIdx) in formEvento.cronograma_lista" :key="dIdx" class="bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-2xl p-6 relative">
                                <div class="flex items-center justify-between mb-4">
                                    <span class="text-[10px] font-black text-umsa-gold uppercase tracking-tighter">Día #{{ dia.day }}</span>
                                    <button @click.prevent="eliminarDiaEvento(dIdx)" class="text-slate-300 hover:text-red-500 transition-colors"><span class="material-symbols-outlined">delete</span></button>
                                </div>
                                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                                    <input v-model="dia.name" placeholder="Nombre del día..." class="w-full bg-white dark:bg-gray-900 border border-slate-100 dark:border-gray-700 rounded-xl px-4 py-2 text-xs font-bold" />
                                    <input v-model="dia.date" type="date" class="w-full bg-white dark:bg-gray-900 border border-slate-100 dark:border-gray-700 rounded-xl px-4 py-2 text-xs font-bold" />
                                </div>
                                <div class="space-y-2">
                                    <div v-for="(act, aIdx) in dia.events" :key="aIdx" class="flex items-center gap-2">
                                        <input v-model="act.time" type="time" class="w-24 bg-white dark:bg-gray-900 border border-slate-100 rounded-lg px-2 py-1 text-[10px] font-black" />
                                        <input v-model="act.title" placeholder="Descripción del punto o sesión..." class="flex-1 bg-white dark:bg-gray-900 border border-slate-100 rounded-lg px-3 py-1 text-[10px] font-bold" />
                                        <button @click.prevent="eliminarActividadEvento(dIdx, aIdx)" class="text-slate-300 hover:text-red-500"><span class="material-symbols-outlined text-sm">remove_circle</span></button>
                                    </div>
                                    <button @click.prevent="agregarActividadEvento(dIdx)" class="text-[8px] font-black text-emerald-600 uppercase tracking-widest mt-2 flex items-center gap-1">+ Añadir Punto de Agenda</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- BOTONES DE NAVEGACIÓN -->
                    <div class="flex items-center justify-between pt-8 border-t border-slate-100 dark:border-gray-800 mt-auto">
                        <button v-if="currentStep > 1" @click.prevent="prevStep" type="button" class="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-primary-dark transition-colors">
                            <span class="material-symbols-outlined text-lg">arrow_back</span> Anterior
                        </button>
                        <div v-else></div>
                        
                        <div class="flex gap-4">
                            <button v-if="currentStep < totalSteps" @click.prevent="nextStep" type="button" class="bg-primary-dark text-white px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all">
                                Siguiente Parte
                            </button>
                            <button v-else type="submit" class="bg-emerald-600 text-white px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 active:scale-95 transition-all">
                                {{ isEditingEvento ? 'Actualizar Evento' : 'Finalizar y Crear' }}
                            </button>
                        </div>
                    </div>
                </div>

                <!-- ÁREA DE PREVISUALIZACIÓN DINÁMICA -->
                <div class="lg:col-span-5 flex flex-col">
                    <div class="sticky top-8 space-y-6">
                        <label class="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 text-center block">Vista Previa Dinámica (Mini-Home)</label>
                        
                        <!-- CARD PRINCIPAL (HOME HERO) -->
                        <div class="relative w-full aspect-video rounded-[2rem] overflow-hidden shadow-2xl border border-slate-200 dark:border-gray-700 bg-gray-900 animate-in zoom-in-95 duration-500">
                            
                            <!-- MINI HEADER PERSISTENTE -->
                            <div class="absolute top-0 inset-x-0 h-14 bg-white/95 backdrop-blur-md z-50 flex items-center justify-between px-6 border-b border-slate-100 shadow-sm">
                                <div class="flex items-center gap-3">
                                    <!-- Escudo UMSA -->
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/a/af/Escudo_de_la_Universidad_Mayor_de_San_Andr%C3%A9s.png" class="h-8 w-auto object-contain">
                                    
                                    <div class="h-6 w-px bg-slate-200 mx-1"></div>

                                    <!-- Nombre y Sigla -->
                                    <div class="flex items-center gap-3 overflow-hidden">
                                        <span class="text-[10px] font-black text-umsa-blue uppercase tracking-tighter truncate max-w-[150px] leading-tight">{{ formEvento.nombre || 'NOMBRE DEL EVENTO' }}</span>
                                        <div :style="{ backgroundColor: formEvento.color_principal }" class="px-3 py-1.5 rounded-lg shadow-lg shadow-blue-500/10 transform -skew-x-12">
                                            <span class="text-[11px] font-black text-white uppercase block transform skew-x-12 italic leading-none">{{ formEvento.sigla || 'TYAN' }}</span>
                                        </div>
                                    </div>
                                </div>
                                <div class="flex items-center gap-2">
                                    <!-- Logos institucionales quitados del preview -->
                                </div>
                            </div>

                            <!-- CONTENIDO HERO (Paso 1, 4, 5) -->
                            <div v-if="[1, 4, 5].includes(currentStep)" class="h-full w-full relative overflow-hidden">
                                <img v-if="resolvedBanner" :src="resolvedBanner" class="w-full h-full object-cover opacity-60 animate-in fade-in duration-700 z-10">
                                <div v-else class="w-full h-full bg-slate-800 flex items-center justify-center">
                                    <span class="material-symbols-outlined text-4xl text-white/5">wallpaper</span>
                                </div>
                                <div class="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/40 to-transparent"></div>
                                <div class="absolute inset-0 p-6 pt-20 flex flex-col justify-end">
                                    <div class="flex items-center gap-2 mb-3">
                                        <div class="px-2.5 py-1 bg-emerald-500 text-white rounded-md flex items-center gap-1 shadow-lg shadow-emerald-500/20 border border-emerald-400/50">
                                            <span class="material-symbols-outlined text-[10px]">verified</span>
                                            <span class="text-[7px] font-black uppercase tracking-widest">{{ formEvento.institucion_badge || 'Evento Oficial OEA/TYAN' }}</span>
                                        </div>
                                    </div>
                                    <h1 class="text-xl md:text-2xl font-black text-white tracking-tighter leading-none mb-1 uppercase italic drop-shadow-2xl">{{ formEvento.nombre || 'NOMBRE DEL EVENTO' }}</h1>
                                    <p class="text-[7px] text-gray-400 font-bold uppercase mb-3 tracking-widest">{{ formEvento.ubicacion || 'SEDE' }} • BOLIVIA</p>
                                    <div class="flex flex-wrap items-center gap-2">
                                        <div class="px-3 py-1 bg-blue-600 text-white rounded-lg flex items-center gap-1 shadow-lg shadow-blue-500/20 border border-blue-500/50">
                                            <span class="material-symbols-outlined text-[10px]">calendar_month</span>
                                            <span class="text-[7px] font-black">{{ formEvento.gestion || '2026' }}</span>
                                        </div>
                                        <div class="px-3 py-1 bg-white/10 backdrop-blur-md text-white border border-white/20 rounded-lg flex items-center gap-1">
                                            <span class="material-symbols-outlined text-[10px]">event</span>
                                            <span class="text-[7px] font-black uppercase tracking-tighter">{{ formEvento.fecha_inicio ? formatDate(formEvento.fecha_inicio) : '13 DE MAYO' }}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- CARD NARRATIVA - Sincronizada con Imagen 1 -->
                        <div v-if="currentStep === 2" class="bg-white dark:bg-gray-800 border-2 border-slate-100 dark:border-gray-700 rounded-[2rem] p-8 shadow-xl animate-in fade-in slide-in-from-right-8 duration-500">
                            <div class="grid grid-cols-12 gap-8">
                                <!-- Lado Izquierdo (Links y Recursos) -->
                                <div class="col-span-4 space-y-4">
                                    <div v-if="formEvento.link_facebook || formEvento.link_web" class="space-y-3">
                                        <h5 class="text-[8px] font-black text-blue-600 uppercase tracking-widest border-l-2 border-blue-600 pl-2">Recursos y Links</h5>
                                        <div v-if="formEvento.link_facebook" class="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                                            <p class="text-[7px] font-black text-blue-600 dark:text-blue-400 uppercase">Facebook Oficial</p>
                                            <p class="text-[6px] text-slate-400 truncate">{{ formEvento.link_facebook }}</p>
                                        </div>
                                        <div v-if="formEvento.link_web" class="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800">
                                            <p class="text-[7px] font-black text-emerald-600 dark:text-emerald-400 uppercase">Sitio Web</p>
                                            <p class="text-[6px] text-slate-400 truncate">{{ formEvento.link_web }}</p>
                                        </div>
                                    </div>
                                    <div v-else class="h-40 bg-slate-50 dark:bg-gray-900 rounded-2xl flex items-center justify-center border-2 border-dashed border-slate-100 dark:border-gray-800">
                                        <p class="text-[8px] font-black text-slate-300 uppercase tracking-tighter">Sin enlaces extra</p>
                                    </div>
                                </div>

                                <!-- Lado Derecho (Sobre el Evento) -->
                                <div class="col-span-8 space-y-4">
                                    <div class="flex flex-col">
                                        <h4 class="text-xs md:text-sm font-black text-umsa-blue uppercase italic tracking-tighter leading-none">SOBRE EL EVENTO</h4>
                                        <p class="text-[8px] font-black text-slate-400 uppercase mt-1">{{ formEvento.nombre || 'NOMBRE DEL EVENTO' }}</p>
                                    </div>
                                    
                                    <div class="space-y-2">
                                        <p class="text-[9px] text-slate-600 dark:text-gray-300 font-bold leading-relaxed line-clamp-3">{{ formEvento.sobre_evento_1 || 'Descripción principal del evento...' }}</p>
                                        <p class="text-[8px] text-slate-400 font-medium leading-relaxed">{{ formEvento.sobre_evento_2 || 'Más detalles...' }}</p>
                                    </div>

                                    <div class="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-2xl border-l-4 border-umsa-blue italic">
                                        <p class="text-[10px] font-black text-umsa-blue">"{{ formEvento.frase_destacada || 'Pudes ser un buen profesional' }}"</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- CARD CRONOGRAMA - Visible en Paso 6 -->
                        <div v-if="currentStep === 6" class="bg-slate-900 rounded-[2rem] p-8 shadow-2xl animate-in zoom-in-95 duration-500">
                            <div class="flex items-center gap-3 mb-6">
                                <span class="material-symbols-outlined text-umsa-gold text-xl">event_upcoming</span>
                                <h4 class="text-xs font-black text-white uppercase italic">Vista Previa Agenda</h4>
                            </div>
                            <div class="space-y-4">
                                <div v-if="formEvento.cronograma_lista.length === 0" class="text-center py-10 opacity-30">
                                    <span class="material-symbols-outlined text-4xl text-white mb-2">view_timeline</span>
                                    <p class="text-[9px] font-black text-white uppercase">Sin cronograma</p>
                                </div>
                                <div v-for="dia in formEvento.cronograma_lista" :key="dia.day" class="p-4 bg-white/5 border border-white/10 rounded-2xl">
                                    <p class="text-[8px] font-black text-umsa-gold uppercase italic mb-2">Día {{ dia.day }}: {{ dia.name }}</p>
                                    <div v-for="act in dia.events" :key="act.time" class="flex gap-2 items-center opacity-60">
                                        <span class="text-[7px] font-bold w-10 text-white">{{ act.time }}</span>
                                        <span class="text-[7px] truncate flex-1 text-gray-300">{{ act.title }}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- CARD DIRECTORIO - Visible en Paso 3 -->
                        <div v-if="currentStep === 3" class="bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-100 dark:border-emerald-800 rounded-[2rem] p-8 animate-in slide-in-from-bottom-8 duration-500">
                             <h4 class="text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase italic mb-4">Personal Destacado</h4>
                             <div class="flex -space-x-4 mb-4">
                                <div v-for="i in 5" :key="i" class="w-10 h-10 rounded-full border-2 border-white dark:border-gray-800 bg-emerald-100 dark:bg-gray-700 flex items-center justify-center">
                                    <span class="material-symbols-outlined text-sm text-emerald-400">person</span>
                                </div>
                             </div>
                             <p class="text-[9px] font-bold text-emerald-600">{{ formEvento.ponentes_seleccionados.length }} personal/ponentes seleccionados para mostrar en el Home.</p>
                        </div>
                    </div>
                </div>
            </div>
        </form>
    </div>

    <!-- MODAL REGISTRO RÁPIDO -->
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



