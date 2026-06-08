<script setup lang="ts">
import { ref, onMounted, computed, watch, nextTick } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useEventoStore } from '@/stores/eventoStore';

import { useAdminHistorialStore } from '@/stores/adminHistorial';
import { useAuthStore } from '@/stores/auth';

import api, { getImageUrl } from '@/services/api';
import Swal from 'sweetalert2';
import CertificadoRender from '@/components/common/CertificadoRender.vue';

const router = useRouter();
const route = useRoute();
const eventoStore = useEventoStore();
const authStore = useAuthStore();

// Determinar si estamos en el panel de administración
const isAdminContext = computed(() => route.path.startsWith('/admin'));

const openDetalleCurso = (courseId: any, extraQuery = {}) => {
  const isAdminContext = route.path.startsWith('/admin');
  const routeName = isAdminContext ? 'admin-gestion-eventos-detalle' : 'coordinador-gestion-eventos-detalle';
  
  let query: any = { ...extraQuery };
  if (route.name === 'coordinador-estudiantes-global' || route.name === 'admin-estudiantes') {
    query.tab = 'estudiantes';
  } else if (route.name === 'coordinador-ponentes-global' || route.name === 'admin-ponentes') {
    query.tab = 'ponentes';
  }

  router.push({ name: routeName, params: { id: courseId }, query });
};

// Solo registrar en historial si el usuario es Super Admin
const isAdmin = () => {
  const roles = (authStore.user as any)?.usuariosRoles || [];
  return roles.some((ur: any) => ur.rol?.nombre_rol === 'Super Usuario' || ur.rol?.id === 1);
};
const registrarAccion = (...args: Parameters<ReturnType<typeof useAdminHistorialStore>['registrar']>) => {
  if (isAdmin()) {
    const historialStore = useAdminHistorialStore();
    historialStore.registrar(...args);
  }
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
const totalSteps = 7;
const slideDir = ref<'forward' | 'backward'>('forward');
const isSuperAdminTheme = computed(() => authStore.esSuperUsuario);

const themeColor = computed(() => isSuperAdminTheme.value ? 'red' : 'blue');
const themeBg = computed(() => isSuperAdminTheme.value ? 'bg-red-600' : 'bg-blue-600');
const themeShadow = computed(() => isSuperAdminTheme.value ? 'shadow-red-500/20' : 'shadow-blue-500/20');
const themeHover = computed(() => isSuperAdminTheme.value ? 'hover:bg-red-700' : 'hover:bg-blue-700');

const previewTransition = computed(() =>
    slideDir.value === 'forward' ? 'preview-slide-forward' : 'preview-slide-backward'
);
const nextStep = () => {
    if (currentStep.value < totalSteps) {
        slideDir.value = 'forward';
        currentStep.value++;
    }
};
const prevStep = () => {
    if (currentStep.value > 1) {
        slideDir.value = 'backward';
        currentStep.value--;
    }
};
const irAlPaso = (step: number) => {
    if (step >= 1 && step <= totalSteps) {
        slideDir.value = step > currentStep.value ? 'forward' : 'backward';
        currentStep.value = step;
    }
};
const filtroBusqueda = ref('');

const ponentesDB = ref<any[]>([]);
const gradosAcademicosDB = ref<any[]>([]);
const gradosAdministrativosDB = ref<any[]>([]);
const logoPreview = ref<string | null>(null);
const fondoPreview = ref<string | null>(null);
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
  logo_img: null as any,
  google_maps_link: '',
  sobre_evento_1: '',
  sobre_evento_2: '',
  frase_destacada: '',
  link_facebook: '',
  link_web: '',
  sigla: '',
  color_principal: '#0070b4',
  color_sigla: '#ffffff',
  color_texto_header: '#0070b4',
  color_titulo_2: '#ffffff',
  color_badge_gestion: '#0070b4',
  color_badge_institucion: '#0070b4',
  color_badge_fecha: '#0070b4',
  institucion_badge: 'Evento Oficial OEA/TYAN',
  ponentes_seleccionados: [] as number[],
  cronograma: '',
  cronograma_lista: [] as any[],
  version: '',
  nombre_2: '',
  prioridad: '3',
  visibilidad_al_finalizar: 'visible',
  // Paso 6: Contacto, Organización y Auspicios
  contacto_donde: '',
  contacto_telefono: '',
  contacto_email: '',
  auspicios: [] as { nombre: string; link: string }[],
  coordinadores_ids: [] as number[],
  logistica_ids: [] as number[],
  coordinadores_grados: {} as Record<number, number>,
  fase: 1, // 1: Planificación, 2: Inscripciones, 3: Ejecución, 4: Finalizado, 5: Archivado
  mostrar_correos: true,
});

const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${date.getDate() + 1} de ${months[date.getMonth()]}`;
};

const confirmarCancelar = () => {
    Swal.fire({
        title: '¿Estás seguro?',
        text: "¿Quieres cancelar los cambios? Se perderán los datos no guardados.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#0070b4',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, cancelar',
        cancelButtonText: 'No, seguir editando'
    }).then((result) => {
        if (result.isConfirmed) {
            if (isSuperAdminTheme.value) {
                router.push({ name: 'admin-gestion' });
            } else {
                isCreatingEvento.value = false;
            }
        }
    });
};

const ponentesFiltrados = computed(() => {
  if (!filtroPonente.value) return ponentesDB.value;
  const f = filtroPonente.value.toLowerCase();
  return ponentesDB.value.filter(p => p.displayName.toLowerCase().includes(f));
});

const resetFormEvento = () => {
    editEventoId.value = null;
    infoCertificado.value = {
        cabecera: '',
        tenor: '',
        estado: 1
    };
    formEvento.value = {
        nombre: '', descripcion: '', gestion: new Date().getFullYear().toString(),
        fecha_inicio: '', fecha_fin: '', ubicacion: '', direccion: '',
        estado: 2, fondo_img: null, logo_img: null, google_maps_link: '',
        sobre_evento_1: '', sobre_evento_2: '', frase_destacada: '',
        link_facebook: '', link_web: '', sigla: '', 
        color_principal: '#0070b4',
        color_sigla: '#000000', 
        color_texto_header: '#0070b4', 
        color_titulo_2: '#ffffff',
        color_badge_gestion: '#0070b4',
        color_badge_institucion: '#0070b4',
        color_badge_fecha: '#0070b4',
        institucion_badge: 'Evento Oficial OEA/TYAN',
        ponentes_seleccionados: [], cronograma: '', cronograma_lista: [], version: '',
        nombre_2: '',
        contacto_donde: '',
        contacto_telefono: '',
        contacto_email: '',
        auspicios: [],
        prioridad: '3',
        visibilidad_al_finalizar: 'visible',
        coordinadores_ids: [] as number[],
        logistica_ids: [] as number[],
        coordinadores_grados: {} as Record<number, number>,
        fase: 1,
        mostrar_correos: true
    };
};

const tipoCertificado = ref<number | null>(null);
const esExcelencia = ref<number>(0);
const infoCertificado = ref<any>({
    cabecera: '',
    tenor: '',
    estado: 1
});

const fetchInfoCertificado = async () => {
    if (!editEventoId.value || tipoCertificado.value === null) return;
    try {
        let url = `/info-certificados/evento/${editEventoId.value}?tipo=${tipoCertificado.value}`;
        if (tipoCertificado.value === 4) {
            url += `&es_excelencia=${esExcelencia.value}`;
        }
        const res = await api.get(url);
        if (res.data && res.data.length > 0) {
            infoCertificado.value = res.data[0];
        } else {
            infoCertificado.value = {
                cabecera: '',
                tenor: '',
                estado: 1
            };
        }
    } catch (error) {
        console.error("Error al obtener info del certificado:", error);
    }
};

watch([tipoCertificado, esExcelencia], () => {
    fetchInfoCertificado();
});

watch([currentStep, editEventoId], () => {
    if (currentStep.value === 7 && editEventoId.value) {
        fetchInfoCertificado();
    }
}, { immediate: true });

const guardarInfoCertificado = async () => {
    if (!editEventoId.value) {
        Swal.fire('Atención', 'Primero debes guardar/crear el evento antes de configurar los certificados.', 'warning');
        return;
    }
    if (tipoCertificado.value === null) {
        Swal.fire('Atención', 'Debes seleccionar el tipo de certificado (rol) a configurar.', 'warning');
        return;
    }
    try {
        const payload: any = {
            id_evento: editEventoId.value,
            tipo: tipoCertificado.value,
            cabecera: infoCertificado.value?.cabecera || '',
            tenor: infoCertificado.value?.tenor || ''
        };
        if (tipoCertificado.value === 4) {
            payload.es_excelencia = esExcelencia.value;
        }
        
        await api.post('/info-certificados', payload);
        
        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'Configuración guardada',
            showConfirmButton: false,
            timer: 2000
        });
        await fetchInfoCertificado();
    } catch (error) {
        console.error(error);
        Swal.fire('Error', 'No se pudo guardar la configuración del certificado', 'error');
    }
};

// --- LÓGICA DE PREVISUALIZACIÓN RÁPIDA (PASO 7) ---
const showQuickPreviewModal = ref(false);
const quickPreviewZoom = ref(1.0);
const quickPreviewViewportRef = ref<HTMLElement | null>(null);
const isQuickPreviewPanning = ref(false);
const quickPreviewStartX = ref(0);
const quickPreviewStartY = ref(0);
const quickPreviewScrollLeftStart = ref(0);
const quickPreviewScrollTopStart = ref(0);

const onMouseDownQuickPreview = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button')) return;
    isQuickPreviewPanning.value = true;
    quickPreviewStartX.value = e.pageX - (quickPreviewViewportRef.value?.offsetLeft || 0);
    quickPreviewStartY.value = e.pageY - (quickPreviewViewportRef.value?.offsetTop || 0);
    quickPreviewScrollLeftStart.value = quickPreviewViewportRef.value?.scrollLeft || 0;
    quickPreviewScrollTopStart.value = quickPreviewViewportRef.value?.scrollTop || 0;
};

const onMouseMoveQuickPreview = (e: MouseEvent) => {
    if (!isQuickPreviewPanning.value || !quickPreviewViewportRef.value) return;
    e.preventDefault();
    const x = e.pageX - (quickPreviewViewportRef.value.offsetLeft || 0);
    const y = e.pageY - (quickPreviewViewportRef.value.offsetTop || 0);
    const walkX = (x - quickPreviewStartX.value) * 1.5;
    const walkY = (y - quickPreviewStartY.value) * 1.5;
    quickPreviewViewportRef.value.scrollLeft = quickPreviewScrollLeftStart.value - walkX;
    quickPreviewViewportRef.value.scrollTop = quickPreviewScrollTopStart.value - walkY;
};

const onMouseUpQuickPreview = () => {
    isQuickPreviewPanning.value = false;
};

const onMouseLeaveQuickPreview = () => {
    isQuickPreviewPanning.value = false;
};

const quickPreviewElements = computed(() => {
    if (!infoCertificado.value?.configuracion) return [];
    try {
        return typeof infoCertificado.value.configuracion === 'string'
            ? JSON.parse(infoCertificado.value.configuracion)
            : infoCertificado.value.configuracion;
    } catch (e) {
        return [];
    }
});

const resolveQuickPreviewVariables = (text: string) => {
    if (!text) return '';
    return text
        .replace(/{NOMBRE_ESTUDIANTE}/g, 'Lic. Alejandro Leonardo Nogales Ticona')
        .replace(/{NOMBRE_COMPLETO_1}/g, 'Lic. Nogales Ticona Alejandro Leonardo')
        .replace(/{NOMBRE_COMPLETO_2}/g, 'Lic. Alejandro Leonardo Nogales Ticona')
        .replace(/{NOMBRE}/g, 'Lic. Alejandro Leonardo Nogales Ticona')
        .replace(/{NOMBRES}/g, 'Lic. Alejandro Leonardo Nogales Ticona')
        .replace(/{PRIMER_APELLIDO}/g, 'Nogales')
        .replace(/{SEGUNDO_APELLIDO}/g, 'Ticona')
        .replace(/{AREA_TEMATICA}/g, 'CIENCIAS DE LA VIDA Y DE LA TIERRA')
        .replace(/{DISCIPLINA}/g, 'BIOLOGÍA MOLECULAR')
        .replace(/{DISCIPLINA_CIENTIFICA}/g, 'BIOLOGÍA MOLECULAR')
        .replace(/{NOMBRE_CURSO}/g, formEvento.value.nombre || 'Curso de Especialización')
        .replace(/{EVENTO}/g, formEvento.value.nombre || 'Curso de Especialización')
        .replace(/{ACTIVIDAD}/g, 'Actividad Académica Base')
        .replace(/{CODIGO_CERTIFICADO}/g, 'CERT-TWAS-TYAN-2026-9842')
        .replace(/{GESTION}/g, formEvento.value.gestion || '2026')
        .replace(/{ROL}/g, tipoCertificado.value === 1 ? 'Logística' : tipoCertificado.value === 2 ? 'Expositor' : tipoCertificado.value === 3 ? 'Organizador' : 'Asistente')
        .replace(/{CI_USUARIO}/g, '1234567 LP')
        .replace(/{CARGA_HORARIA}/g, '40 horas académicas')
        .replace(/{FECHA_EMISION}/g, '17 de Mayo de 2026')
        .replace(/{NOTA_FINAL}/g, '95');
};

const resolveQuickPreviewTenor = (text: string) => {
    if (!text) return '[ TENOR PENDIENTE ]';
    return resolveQuickPreviewVariables(text);
};

const abrirVistaPreviaRapida = () => {
    if (!infoCertificado.value) return;
    quickPreviewZoom.value = 1.0;
    showQuickPreviewModal.value = true;
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
        const [resP, resC, resG, resAdmin] = await Promise.all([
            api.get('/usuarios?rol=Ponente&limit=100'),
            api.get('/usuarios?rol=Coordinador,Logística&limit=100'),
            api.get('/grados-academicos'),
            api.get('/admin/grados-administrativos'),
        ]);
        
        const mapUser = (u: any, role: string) => {
            const persona = u.persona || {};
            const gaObj = u.afiliaciones?.[0]?.gradoAcademico || {};
            const prefijo = gaObj.abreviacion ? `${gaObj.abreviacion}. ` : '';
            return { ...u, roleLabel: role, displayName: `${prefijo}${persona.nombres || ''} ${persona.primer_apellido || ''}`.trim() };
        };
        ponentesDB.value = [
            ...(resP.data?.data || resP.data || []).map((u:any) => mapUser(u, 'Ponente')), 
            ...(resC.data?.data || resC.data || []).map((u:any) => mapUser(u, 'Coordinador')),
        ];
        gradosAcademicosDB.value = resG.data?.data || resG.data || [];
        gradosAdministrativosDB.value = resAdmin.data?.data || resAdmin.data || [];
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
        const res = await api.get('/admin/eventos/lista?limit=100');
        
        // Usar exactamente la misma lógica que eventoStore (que sí funciona)
        const eventosRaw = Array.isArray(res.data) ? res.data : (res.data.data || []);
        
        eventosPublicados.value = eventosRaw.map((ev: any) => {
            return {
            ...ev,
            nombreCorto: ev.nombre || 'Sin nombre',
            // BUG FIX: No sobreescribir ev.version (slogan) con ev.gestion (año).
            // Se usa gestionLabel para mostrar en UI sin destruir el campo original.
            gestionLabel: ev.gestion || '2025',
            imagen: getImageUrl('fondos', ev.imagen_fondo, 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1600&q=80'),
            estadoLabel: ev.estado === 1 ? 'Activo' : (ev.estado === 2 ? 'Planificación' : 'Cerrado'),
            colorEstado: ev.estado === 1 ? 'bg-emerald-500 text-white' : (ev.estado === 2 ? 'bg-blue-500 text-white' : 'bg-slate-500 text-white'),
            mostrarActividades: true,
            mostrarInhabilitadas: false, // Nueva variable para controlar el despliegue
            actividades: (ev.actividades || []).map((act: any) => {
                const s_raw = Number(act.estado);
                return {
                id: act.id,
                title: act.nombre,
                version: act.version,
                status: s_raw === 1 ? 'Activo' : (s_raw === -1 ? 'Inactivo' : 'Pendiente'),
                status_raw: s_raw,
                type: act.tipo || 'Curso',
                date: act.fecha_inicio ? new Date(act.fecha_inicio).toLocaleDateString() : 'Pendiente',
                students: act.inscripciones?.length || 0,
                modules: 1,
                image: getImageUrl('cursos', act.imagen || act.image, 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&q=80'),
                id_evento: ev.id,
                min_nota: act.min_nota,
                min_asistencia: act.min_asistencia,
                modalidad: act.modalidad,
                fecha_inicio_raw: act.fecha_inicio ? act.fecha_inicio.split('T')[0] : '',
                fecha_fin_raw: act.fecha_fin ? act.fecha_fin.split('T')[0] : '',
                requisitos: act.requisitos,
                descripcion: act.descripcion
            };
            })
        };
        });
    } catch (error: any) {
        console.error("Error fetching eventos:", error);
        Swal.fire({
            icon: 'error',
            title: 'Error de Conexión',
            text: `No se pudieron cargar los eventos: ${error.message} (Status: ${error.response?.status})`,
            confirmButtonText: 'Entendido'
        });
    } finally {
        isLoading.value = false;
    }
};

const handleSaveEvento = async () => {
    // VALIDACIÓN PREVENTIVA (REQUERIMIENTO OFICIAL)
    if (!formEvento.value.nombre?.trim()) {
        Swal.fire('Atención', 'El NOMBRE del evento es obligatorio (Paso 1)', 'warning');
        currentStep.value = 1;
        return;
    }
    if (!formEvento.value.gestion?.trim()) {
        Swal.fire('Atención', 'La GESTIÓN es obligatoria (Paso 1)', 'warning');
        currentStep.value = 1;
        return;
    }
    if (!formEvento.value.fecha_inicio) {
        Swal.fire('Atención', 'La FECHA DE INICIO es obligatoria (Paso 1)', 'warning');
        currentStep.value = 1;
        return;
    }
    if (!formEvento.value.fecha_fin) {
        Swal.fire('Atención', 'La FECHA DE FIN es obligatoria (Paso 1)', 'warning');
        currentStep.value = 1;
        return;
    }

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
        formData.append('fase', formEvento.value.fase.toString());
        formData.append('google_maps_link', formEvento.value.google_maps_link);
        formData.append('sobre_evento_1', formEvento.value.sobre_evento_1);
        formData.append('sobre_evento_2', formEvento.value.sobre_evento_2);
        formData.append('frase_destacada', formEvento.value.frase_destacada);
        formData.append('sigla', formEvento.value.sigla);
        formData.append('institucion_badge', formEvento.value.institucion_badge);
        formData.append('link_facebook', formEvento.value.link_facebook);
        formData.append('link_web', formEvento.value.link_web);
        formData.append('color_principal', formEvento.value.color_principal);
        formData.append('color_sigla', formEvento.value.color_sigla);
        formData.append('color_texto_header', formEvento.value.color_texto_header);
        formData.append('color_titulo_2', formEvento.value.color_titulo_2);
        formData.append('color_badge_gestion', formEvento.value.color_badge_gestion);
        formData.append('color_badge_institucion', formEvento.value.color_badge_institucion);
        formData.append('color_badge_fecha', formEvento.value.color_badge_fecha);
        formData.append('nombre_2', formEvento.value.nombre_2 || '');
        formData.append('prioridad', formEvento.value.prioridad || '3');
        formData.append('visibilidad_al_finalizar', formEvento.value.visibilidad_al_finalizar || 'visible');

        // Personal (Coordinadores y Logística)
        formData.append('coordinadores_ids', JSON.stringify(formEvento.value.coordinadores_ids));
        formData.append('logistica_ids', JSON.stringify(formEvento.value.logistica_ids));
        formData.append('coordinadores_grados', JSON.stringify(formEvento.value.coordinadores_grados));

        // Contacto y Auspicios
        formData.append('telefono', formEvento.value.contacto_telefono || '');
        formData.append('email', formEvento.value.contacto_email || '');
        // El campo contacto_donde se puede manejar como un complemento a la dirección o un campo extra en el futuro si se requiere, pero por ahora guardamos telefono/email/organizadores.
        const cleanedAuspicios = formEvento.value.auspicios.filter(a => a.nombre?.trim());
        formData.append('organizadores', JSON.stringify(cleanedAuspicios));

        // Cronograma
        const cleanedCronograma = formEvento.value.cronograma_lista.map(d => ({
            ...d,
            events: d.events?.filter((e:any) => e?.title?.trim()) || []
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
        if (isSuperAdminTheme.value) {
            router.push({ name: 'admin-gestion' });
        } else {
            isCreatingEvento.value = false;
            logoPreview.value = null;
            fondoPreview.value = null;
            fetchEventos();
            eventoStore.fetchEventosInfo();
        }
    } catch (err) {
        Swal.fire('Error', 'No se pudo guardar el evento', 'error');
    } finally { isLoading.value = false; }
};

const editarEvento = (evento: any) => {
    // BUG FIX: evento.estado es ahora el número crudo (via spread ...ev), evento.estadoLabel es el string mapeado
    if (!authStore.esSuperUsuario && (evento.estado === 0 || evento.estadoLabel === 'Cerrado' || evento.estadoLabel === 'Concluido')) {
        Swal.fire({
            icon: 'info',
            title: 'Modo de Solo Lectura',
            text: 'Este evento está finalizado y no permite modificaciones.',
            confirmButtonColor: '#0070b4'
        });
        return;
    }
    
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
    
    // BUG FIX: Se leen directamente los campos del objeto crudo (no del objeto mapeado con
    // campos sobreescritos). El objeto ya incluye todos los campos del backend via spread.
    formEvento.value = {
        nombre: evento.nombre || evento.nombreCorto || '',
        descripcion: baseDesc || '',
        gestion: evento.gestion?.toString() || new Date().getFullYear().toString(),
        // BUG FIX: version real del backend (slogan/edición), no el gestion-label sobreescrito
        version: evento.version || '',
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
        color_sigla: evento.color_sigla || '#ffffff',
        color_texto_header: evento.color_texto_header || '#0070b4',
        color_titulo_2: evento.color_titulo_2 || '#ffffff',
        color_badge_gestion: evento.color_badge_gestion || '#0070b4',
        color_badge_institucion: evento.color_badge_institucion || '#0070b4',
        color_badge_fecha: evento.color_badge_fecha || '#0070b4',
        institucion_badge: evento.institucion_badge || 'Evento Oficial OEA/TYAN',
        // BUG FIX: mapeo completo de estados incluyendo Planificación (2)
        estado: evento.estadoLabel === 'Activo' ? 1
              : evento.estadoLabel === 'Planificación' ? 2
              : evento.estadoLabel === 'Cerrado' ? 0
              : typeof evento.estado === 'number' ? evento.estado
              : 2,
        fondo_img: null,
        logo_img: null,
        ponentes_seleccionados: parts[1]
          ? ponentesDB.value
              .filter((p: any) => parts[1].split(',').map((s: string) => s.trim()).includes(p.displayName))
              .map((p: any) => p.id)
          : [],
        cronograma: '',
        cronograma_lista: [],
        // BUG FIX: nombre_2 leído directamente del objeto (que preserva el campo vía spread)
        nombre_2: evento.nombre_2 || '',
        contacto_donde: evento.direccion || '',
        contacto_telefono: evento.telefono || '',
        contacto_email: evento.email || '',
        auspicios: [],
        // BUG FIX: prioridad convertida a string para coincidir con los value del <select>
        prioridad: String(evento.prioridad ?? '3'),
        visibilidad_al_finalizar: evento.visibilidad_al_finalizar || 'visible',
        fase: evento.fase || 1,
        mostrar_correos: mostrarCorreos,
        coordinadores_ids: (evento.coordinaciones || [])
          .filter((c: any) => c.usuario?.usuariosRoles?.some((ur: any) => 
              ur.rol?.nombre_rol?.toLowerCase() === 'coordinador' || 
              Number(ur.rol?.id) === 2 || 
              Number(ur.rol?.id) === 7
          ))
          .map((c: any) => c.usuario.id),
        logistica_ids: [],
        coordinadores_grados: (evento.coordinaciones || []).reduce((acc: any, c: any) => {
            if (c.gradoAdministrativo) acc[c.usuario.id] = c.gradoAdministrativo.id;
            return acc;
        }, {})
    };

    if (evento.organizadores) {
        try { formEvento.value.auspicios = typeof evento.organizadores === 'string' ? JSON.parse(evento.organizadores) : evento.organizadores; } catch(e) {}
    }

    if (evento.cronograma) {
        try { formEvento.value.cronograma_lista = typeof evento.cronograma === 'string' ? JSON.parse(evento.cronograma) : evento.cronograma; } catch(e) {}
    }

    logoPreview.value = evento.logo;
    fondoPreview.value = evento.imagen_fondo;
    isCreatingEvento.value = true;
};

// --- GESTIÓN DE PERSONAL ---
const usuariosCoordinadores = ref<any[]>([]);

const fetchUsuariosPersonal = async () => {
    try {
        const res = await api.get('/usuarios?rol=Coordinador&limit=100');
        const data = res.data.data || res.data || [];
        
        usuariosCoordinadores.value = data.filter((u: any) => 
            u.usuariosRoles?.some((ur: any) => 
                ur.rol?.nombre_rol?.toLowerCase() === 'coordinador' || 
                Number(ur.rol?.id) === 7
            )
        );
    } catch (err) {
        console.error("Error fetching personnel:", err);
    }
};

const toggleCoordinador = (id: number) => {
    const idx = formEvento.value.coordinadores_ids.indexOf(id);
    if (idx === -1) formEvento.value.coordinadores_ids.push(id);
    else formEvento.value.coordinadores_ids.splice(idx, 1);
};

const togglePonenteSeleccionado = (id: number) => {
    const idx = formEvento.value.ponentes_seleccionados.indexOf(id);
    if (idx === -1) formEvento.value.ponentes_seleccionados.push(id);
    else formEvento.value.ponentes_seleccionados.splice(idx, 1);
};

const seleccionarTodosPonentes = () => {
    formEvento.value.ponentes_seleccionados = ponentesDB.value.map(p => p.id);
};

const deseleccionarTodosPonentes = () => {
    formEvento.value.ponentes_seleccionados = [];
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
            await api.patch(`/admin/eventos/${id}`, { 
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
    let list = eventosPublicados.value;

    // Filtro por Evento Global Seleccionado (Header)
    if (eventoStore.selectedEventoId) {
        list = list.filter(ev => ev.id === eventoStore.selectedEventoId);
    }

    const search = (filtroBusqueda.value || '').toLowerCase();
    if (!search) return list;

    return list.map(ev => ({
        ...ev,
        actividades: (ev.actividades || []).filter((a: any) => 
            a.title.toLowerCase().includes(search) || 
            ev.nombreCorto.toLowerCase().includes(search)
        )
    })).filter(ev => ev.actividades.length > 0 || ev.nombreCorto.toLowerCase().includes(search));
});

// FUNCIONES DE FILTRADO DE ACTIVIDADES
const getActividadesActivas = (actividades: any[]) => {
    return (actividades || []).filter(a => Number(a.status_raw) === 1);
};

const getActividadesInactivas = (actividades: any[]) => {
    // Si no es estado 1 (Activo), lo mandamos a la zona de seguridad por precaución
    return (actividades || []).filter(a => Number(a.status_raw) !== 1);
};

const getActividadesAgrupadas = (actividades: any[]) => {
  const activas = getActividadesActivas(actividades);
  const grupos: Record<string, any[]> = {};
  activas.forEach((act: any) => {
    const normalizedType = (act.type || 'Actividad').trim().toUpperCase();
    if (!grupos[normalizedType]) {
      grupos[normalizedType] = [];
    }
    grupos[normalizedType]!.push(act);
  });
  return grupos;
};

// ACCIONES DE INHABILITACIÓN

const solicitarActivacion = async (id: number, nombre: string) => {
  await Swal.fire({
    title: 'Solicitud Enviada',
    text: `Se ha enviado una notificación al Super Usuario para reactivar "${nombre}".`,
    icon: 'info',
    confirmButtonText: 'Entendido'
  });
  // Aquí se llamaría al endpoint de notificación si existiera
};


const nuevaActividad = ref({
    nombre: '',
    tipo: 'Diplomado',
    tipoPersonalizado: '',
    descripcion: '',
    id_evento: null as number | null,
    min_nota: 51,
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
    lockTipo: false
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
        min_nota: 51,
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
        lockTipo: false
    };
    imagenArchivo.value = null;
    imagenPreview.value = null;
    currentStep.value = 1;
};

const prepararEdicionActividad = async (actId: number) => {
    try {
        isLoading.value = true;
        const res = await api.get(`/actividades-academicas/${actId}`);
        const act = res.data;
        
        isEditingActividad.value = true;
        editActividadId.value = act.id;
        isCreating.value = true;
        currentStep.value = 1;

        nuevaActividad.value = {
            nombre: act.nombre || '',
            tipo: act.tipo || 'Diplomado',
            tipoPersonalizado: '',
            descripcion: act.descripcion || '',
            id_evento: act.evento?.id || act.id_evento,
            min_nota: act.min_nota ?? 51,
            min_asistencia: act.min_asistencia ?? 80,
            modalidad: act.modalidad || 'Presencial',
            fecha_inicio: act.fecha_inicio ? act.fecha_inicio.split('T')[0] : '',
            fecha_fin: act.fecha_fin ? act.fecha_fin.split('T')[0] : '',
            sesiones: act.sesiones || [],
            requisitos: typeof act.requisitos === 'string' ? JSON.parse(act.requisitos) : (act.requisitos || { base: {}, custom: [] }),
            lockTipo: true
        };
        
        if (act.imagen) {
            imagenPreview.value = act.imagen;
        }
    } catch (e) {
        console.error("Error al preparar edición de actividad:", e);
        Swal.fire('Error', 'No se pudo cargar la actividad para editar.', 'error');
    } finally {
        isLoading.value = false;
    }
};

const editarActividad = (act: any) => {
  if (isAdminContext.value) {
    prepararEdicionActividad(act.id);
  } else {
    openDetalleCurso(act.id, { edit: 'true' });
  }
};

const inhabilitarActividad = async (id: number, nombre: string) => {
    const { value: motivo } = await Swal.fire({
        title: '¿INHABILITAR ACTIVIDAD?',
        text: `Indique la razón para inhabilitar "${nombre}":`,
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
            await api.patch(`/actividades-academicas/${id}`, { 
                estado: -1, 
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

        if (nuevaActividad.value.min_nota === undefined || nuevaActividad.value.min_nota === null || nuevaActividad.value.min_nota < 0 || nuevaActividad.value.min_nota > 100) {
            Swal.fire('Error', 'La nota mínima debe estar entre 0 y 100 y no puede ser negativa.', 'error');
            return;
        }

        if (nuevaActividad.value.min_asistencia === undefined || nuevaActividad.value.min_asistencia === null || nuevaActividad.value.min_asistencia < 0 || nuevaActividad.value.min_asistencia > 100) {
            Swal.fire('Error', 'La asistencia mínima debe estar entre 0 y 100 y no puede ser negativa.', 'error');
            return;
        }

        isLoading.value = true;
        
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

        let tipoFinal = nuevaActividad.value.tipo === 'Otro' 
            ? nuevaActividad.value.tipoPersonalizado 
            : nuevaActividad.value.tipo;
        
        if (tipoFinal) {
            tipoFinal = tipoFinal.trim();
            tipoFinal = tipoFinal.charAt(0).toUpperCase() + tipoFinal.slice(1).toLowerCase();
        }

        const formData = new FormData();
        formData.append('nombre', nuevaActividad.value.nombre);
        formData.append('tipo', tipoFinal || 'Actividad');
        formData.append('descripcion', nuevaActividad.value.descripcion);
        if (nuevaActividad.value.id_evento) {
            formData.append('id_evento', String(nuevaActividad.value.id_evento));
        }
        if (nuevaActividad.value.fecha_inicio) formData.append('fecha_inicio', nuevaActividad.value.fecha_inicio);
        if (nuevaActividad.value.fecha_fin) formData.append('fecha_fin', nuevaActividad.value.fecha_fin);
        formData.append('requisitos', JSON.stringify(nuevaActividad.value.requisitos));
        
        if (nuevaActividad.value.min_nota !== undefined && nuevaActividad.value.min_nota !== null) {
            formData.append('min_nota', String(nuevaActividad.value.min_nota));
        }
        if (nuevaActividad.value.min_asistencia !== undefined && nuevaActividad.value.min_asistencia !== null) {
            formData.append('min_asistencia', String(nuevaActividad.value.min_asistencia));
        }
        if (nuevaActividad.value.modalidad) {
            formData.append('modalidad', nuevaActividad.value.modalidad);
        }
        if (nuevaActividad.value.sesiones && nuevaActividad.value.sesiones.length > 0) {
            formData.append('sesiones', JSON.stringify(nuevaActividad.value.sesiones));
        }
        
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

        if (isAdminContext.value) {
            router.push({ name: 'admin-gestion' });
        } else {
            isCreating.value = false;
            imagenArchivo.value = null;
            imagenPreview.value = null;
            nuevaActividad.value.sesiones = [];
            fetchEventos();
        }
    } catch (error: any) {
        console.error(error);
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


watch(() => eventoStore.selectedEventoId, () => {
    fetchEventos();
});

const toggleActividades = (evento: any) => {
  evento.mostrarActividades = !evento.mostrarActividades;
};

const getStatusColor = (status: string) => {
  if (status === 'En curso') return 'text-green-600 bg-green-50 dark:bg-green-900/40 border border-green-200 dark:border-green-800';
  if (status === 'Inscripciones') return 'text-umsa-blue bg-blue-50 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-800';
  return 'text-slate-500 bg-slate-100 dark:bg-gray-800 dark:text-gray-400 border border-slate-200 dark:border-gray-700';
};

onMounted(async () => {
    await Promise.all([
        fetchEventos(),
        fetchPonentesYGrados(),
        fetchUsuariosPersonal(),
        eventoStore.fetchEventosInfo()
    ]);

    // Manejar edición desde Query Params (viniendo desde AdminGestionView o Workplace)
    if (route.query.edit) {
        const evId = Number(route.query.edit);
        const ev = eventosPublicados.value.find(e => e.id === evId);
        if (ev) {
            editarEvento(ev);
            if (route.query.step) {
                currentStep.value = Number(route.query.step);
            }
        }
    }

    // Manejar creación directa desde Query Params (Evitar doble vista)
    if (route.query.create === 'true') {
        nextTick(() => {
            isCreatingEvento.value = true;
            isEditingEvento.value = false;
            resetFormEvento();
        });
    }

    // Manejar creación directa de nueva actividad (viniendo desde AdminGestionView con evento seleccionado)
    if (route.query.newAct === 'true' && route.query.eventoId) {
        nextTick(() => {
            resetNuevaActividad(Number(route.query.eventoId));
            isCreating.value = true;
        });
    }

    // Manejar edición profunda de actividad (viniendo desde AdminGestionView)
    if (route.query.editAct) {
        nextTick(() => {
            prepararEdicionActividad(Number(route.query.editAct));
        });
    }
});

const changeStep = (delta: number) => {
  const nextStep = currentStep.value + delta;
  if (nextStep >= 1 && nextStep <= 5) {
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
          <label class="absolute -top-3 left-6 px-2 bg-[#f8f9fc] dark:bg-black z-10 text-[9px] font-black text-slate-400 uppercase tracking-widest italic transition-colors">Buscador de Eventos y Contenido</label>
          <span class="absolute inset-y-0 left-5 flex items-center text-slate-400">
            <span class="material-symbols-outlined text-xl group-focus-within:text-umsa-blue transition-colors">search</span>
          </span>
          <input v-model="filtroBusqueda" class="w-full pl-14 pr-6 py-4 bg-white dark:bg-gray-900 border-2 border-slate-200 dark:border-gray-800 rounded-full shadow-sm text-sm focus:ring-4 focus:ring-umsa-blue/10 focus:border-umsa-blue outline-none transition-all font-bold text-primary-dark dark:text-gray-200 placeholder-slate-400" placeholder="Busca Cursos o Eventos..." type="text">
        </div>
      </div>
      
      <div class="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 dark:border-gray-800 mb-8 pb-6 gap-4">
        <div v-if="route.name === 'coordinador-estudiantes-global'">
          <h2 class="text-3xl font-black text-primary-dark dark:text-white uppercase italic">Directorio Estudiantil</h2>
          <p class="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mt-1">Selecciona una actividad para gestionar sus alumnos</p>
        </div>
        <div v-else-if="route.name === 'coordinador-ponentes-global'">
          <h2 class="text-3xl font-black text-primary-dark dark:text-white uppercase italic">Directorio de Ponentes</h2>
          <p class="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mt-1">Selecciona una actividad para gestionar sus docentes</p>
        </div>
        <div v-else class="flex items-center gap-4">
          <h2 class="text-2xl sm:text-3xl font-black text-primary-dark dark:text-white uppercase italic">Gestión de Eventos</h2>
        </div>
        
        <div v-if="authStore.esSuperUsuario" class="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button @click="isCreatingEvento = true; isEditingEvento = false; resetFormEvento()" 
            :class="[themeBg, themeHover, themeShadow]"
            class="w-full sm:w-auto text-white font-black px-8 py-4 rounded-2xl text-[12px] uppercase tracking-widest hover:-translate-y-1 active:translate-y-0 transition-all flex items-center gap-3 justify-center shadow-xl">
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
              {{ evento.estadoLabel }}
            </span>
            <div class="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <p class="text-xs font-bold text-umsa-gold dark:text-blue-400 uppercase tracking-widest mb-2">{{ evento.gestionLabel }}</p>
                <h1 class="text-3xl md:text-5xl font-black text-white tracking-tighter leading-none mb-4">{{ evento.nombreCorto }}</h1>
                <p class="text-sm font-medium text-gray-300 max-w-2xl line-clamp-2 leading-relaxed">{{ evento.descripcion }}</p>
              </div>

              <div class="flex flex-wrap items-center justify-start md:justify-end gap-2 z-30 relative">
                <button v-if="authStore.esSuperUsuario" @click="editarEvento(evento)" class="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/20 px-3 py-2.5 rounded-xl transition-all shadow-lg flex items-center justify-center cursor-pointer" title="Configurar Eventos">
                   <span class="material-symbols-outlined text-[18px]">settings</span>
                </button>
                <button v-if="authStore.esSuperUsuario" @click="inhabilitarEvento(evento.id, evento.nombreCorto)" class="bg-red-500/20 hover:bg-red-500/40 backdrop-blur-md text-white border border-red-500/30 px-3 py-2.5 rounded-xl transition-all shadow-lg flex items-center justify-center cursor-pointer" title="Inhabilitar Evento">
                   <span class="material-symbols-outlined text-[18px]">block</span>
                </button>

                <div class="h-6 w-px bg-white/20 mx-1 hidden sm:block"></div>

                <button @click="resetNuevaActividad(evento.id); isCreating = true" class="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-xl transition-all shadow-lg flex items-center gap-2 font-black text-[10px] uppercase tracking-widest cursor-pointer">
                   <span class="material-symbols-outlined text-[18px]">add_circle</span>
                   <span class="hidden sm:inline">Nueva Actividad</span>
                </button>

                <button v-if="getActividadesInactivas(evento.actividades).length > 0" 
                  @click.stop="evento.mostrarInhabilitadas = !evento.mostrarInhabilitadas"
                  class="bg-red-500/10 hover:bg-red-500/20 text-red-500 px-4 py-2.5 rounded-xl border border-red-500/30 flex items-center gap-2 animate-pulse cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-lg shadow-red-500/10">
                   <span class="material-symbols-outlined text-[18px]">folder_managed</span>
                   <span class="text-[10px] font-black uppercase tracking-widest">{{ getActividadesInactivas(evento.actividades).length }} <span class="hidden sm:inline">INHABILITADAS</span></span>
                </button>

                <button @click="toggleActividades(evento)" class="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/20 px-4 py-2.5 rounded-xl transition-all shadow-lg flex items-center gap-2 cursor-pointer">
                  <span class="text-xs font-bold uppercase tracking-widest">
                    <span class="hidden sm:inline">{{ evento.mostrarActividades ? 'Ocultar' : 'Ver' }} Cursos</span>
                    <span class="sm:hidden">{{ evento.mostrarActividades ? 'Ocultar' : 'Ver' }} Cursos</span>
                  </span>
                  <span class="material-symbols-outlined text-[16px] transition-transform duration-300" :class="evento.mostrarActividades ? 'rotate-180' : ''">expand_more</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div v-show="evento.mostrarActividades" class="py-8 bg-slate-50 dark:bg-gray-950/50 w-full animate-in slide-in-from-top-4 duration-500 fade-in border-t border-slate-100 dark:border-gray-900">
          
          <div class="px-8 pb-6 flex justify-start lg:justify-between items-center mb-8">
            <h3 class="hidden lg:block text-lg font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest italic">Cursos del Evento</h3>
          </div>

          <!-- SECCIÓN: ACTIVIDADES INHABILITADAS (ZONA DE CONTROL) -->
          <div v-if="getActividadesInactivas(evento.actividades).length > 0 && evento.mostrarInhabilitadas" class="mt-4 mx-8 mb-12 py-10 px-8 bg-red-50/50 dark:bg-red-950/10 rounded-[2.5rem] border-4 border-dashed border-red-200 dark:border-red-900/30 shadow-inner relative animate-in slide-in-from-top-4 duration-500 overflow-hidden">
            
            <div class="flex items-center justify-between mb-8 relative z-10">
              <div class="flex items-center gap-6">
                <div class="w-16 h-16 bg-red-500 text-white rounded-[1.5rem] flex items-center justify-center shadow-xl shadow-red-500/20">
                  <span class="material-symbols-outlined text-3xl">folder_off</span>
                </div>
                <div>
                  <h4 class="text-2xl font-black text-red-600 dark:text-red-400 uppercase tracking-tighter italic">Sección de Actividades Inhabilitadas</h4>
                  <p class="text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1 flex items-center gap-2">
                    <span class="material-symbols-outlined text-sm">info</span> Estos módulos están ocultos para el público general
                  </p>
                </div>
              </div>
              <button @click="evento.mostrarInhabilitadas = false" class="p-2 text-red-400 hover:text-red-600 transition-colors">
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
              <div v-for="act in getActividadesInactivas(evento.actividades)" :key="act.id" 
                class="bg-white dark:bg-gray-900 p-6 rounded-[2rem] border-2 border-red-50 dark:border-red-900/20 hover:border-red-300 transition-all flex flex-col justify-between h-[160px] shadow-sm hover:shadow-xl hover:shadow-red-500/5 group/disabled-item">
                
                <div class="flex items-start justify-between gap-4">
                   <div class="truncate">
                      <h5 class="text-sm font-black text-slate-700 dark:text-gray-200 uppercase truncate mb-1 group-hover/disabled-item:text-red-600 transition-colors">{{ act.title }}</h5>
                      <div class="flex items-center gap-2">
                         <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest">{{ act.type }}</span>
                         <span class="w-1 h-1 bg-slate-200 rounded-full"></span>
                         <span class="text-[9px] font-bold text-red-500/60 uppercase">Archivada</span>
                      </div>
                   </div>
                   <span class="material-symbols-outlined text-red-200 dark:text-red-900/40">block</span>
                </div>

                <div class="mt-4">
                   <button @click.stop="solicitarActivacion(act.id, act.title)" 
                     class="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white dark:bg-gray-800 hover:bg-red-500 text-red-500 hover:text-white rounded-xl transition-all font-black text-[10px] uppercase tracking-widest border-2 border-red-100 dark:border-red-900/30 hover:border-red-500 shadow-sm hover:shadow-red-500/20">
                     <span class="material-symbols-outlined text-sm">mail</span>
                     Solicitar Habilitación
                   </button>
                </div>
              </div>
            </div>
          </div>

          <div v-for="(acts, categoria) in getActividadesAgrupadas(evento.actividades)" :key="categoria" class="mb-10 w-full overflow-hidden">
            <div class="flex items-end justify-between px-8 mb-4">
              <div>
                <h3 class="text-xl md:text-2xl font-black text-primary-dark dark:text-white uppercase tracking-tighter">{{ categoria }}</h3>
                <p class="text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-widest mt-1">Explorar {{ (acts as any[]).length }} disponibles</p>
              </div>
              <button @click="resetNuevaActividad(evento.id); isCreating = true; nuevaActividad.tipo = String(categoria); nuevaActividad.lockTipo = true; currentStep = 1;" class="text-[10px] font-black uppercase tracking-widest bg-white dark:bg-gray-800 hover:bg-slate-100 dark:hover:bg-gray-700 text-slate-600 dark:text-gray-300 border border-slate-200 dark:border-gray-700 px-4 py-2 rounded-xl transition-all flex items-center gap-2 relative z-20 cursor-pointer shadow-sm hover:shadow-md">
                <span class="material-symbols-outlined text-[14px]">add</span> Crear {{ categoria }}
              </button>
            </div>

            <div class="flex overflow-x-auto gap-6 px-8 pb-8 pt-2 snap-x snap-mandatory flex-nowrap" style="scrollbar-width: none; -ms-overflow-style: none;">
              <div v-for="act in acts" :key="act.id" @click="openDetalleCurso(act.id)" class="flex-none w-[280px] md:w-[320px] bg-white dark:bg-gray-900 rounded-[1.5rem] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-slate-200/60 dark:border-gray-800 hover:border-primary-light/50 dark:hover:border-gray-600 transition-all hover:-translate-y-1 hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] cursor-pointer group flex flex-col snap-start relative">
                
                <div class="relative h-48 w-full overflow-hidden shrink-0">
                  <div class="absolute inset-0 bg-primary-dark/10 group-hover:bg-transparent transition-colors z-10"></div>
                  <img :src="act.imagen || act.image" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" :alt="act.title">   
                  
                  <div class="absolute top-3 left-3 z-30 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0 duration-300">
                    <button @click.stop="inhabilitarActividad(act.id, act.title)" class="p-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-lg shadow-lg text-red-500 hover:scale-110 transition-all border border-red-50/20" title="Inhabilitar Actividad">
                        <span class="material-symbols-outlined text-[18px]">block</span>
                    </button>
                  </div>

                  <span class="absolute top-3 right-3 z-20 text-[8px] font-black uppercase px-2 py-1 rounded-md tracking-widest shadow-sm bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm" :class="getStatusColor(act.status)">
                    {{ act.status }}
                  </span>
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
          


          <div v-if="getActividadesActivas(evento.actividades).length === 0 && getActividadesInactivas(evento.actividades).length === 0" class="px-8 py-20 text-center">
            <div class="max-w-md mx-auto opacity-30">
                <span class="material-symbols-outlined text-6xl mb-4">inventory_2</span>
                <p class="text-sm font-bold text-gray-500 uppercase tracking-widest">No hay actividades publicadas ni archivadas para este evento.</p>
            </div>
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
              <button @click="isAdminContext ? router.push({ name: 'admin-gestion' }) : isCreating = false" class="flex items-center gap-2 px-6 py-2.5 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 text-slate-500 dark:text-gray-400 font-black text-[10px] uppercase rounded-xl hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-200 transition-all shadow-sm">
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
                       :class="currentStep === 1 ? [themeBg, 'text-white border-umsa-gold scale-110 shadow-[0_0_15px_rgba(188,156,49,0.4)]'] : 
                              (currentStep > 1 ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg' : 'bg-white dark:bg-gray-800 text-slate-300 dark:text-gray-500 border-slate-200 dark:border-gray-700')">
                      <span v-if="currentStep > 1" class="material-symbols-outlined text-xl">check</span>
                      <span v-else class="material-symbols-outlined text-xl">demography</span>
                  </div>
                  <span class="text-[10px] font-black uppercase mt-3" :class="currentStep === 1 ? 'text-primary-dark dark:text-white' : (currentStep > 1 ? 'text-emerald-500 dark:text-emerald-400 font-black' : 'text-slate-400 dark:text-gray-500')">Diseño</span>
              </div>
              
              <!-- Step 2 -->
              <div @click="irAlPaso(2)" class="flex flex-col items-center bg-white dark:bg-gray-950 px-4 cursor-pointer select-none hover:opacity-80 transition-all">
                  <div class="w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-500"
                       :class="currentStep === 2 ? [themeBg, 'text-white border-umsa-gold scale-110 shadow-[0_0_15px_rgba(37,99,235,0.2)]'] : 
                              (currentStep > 2 ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg' : 'bg-white dark:bg-gray-800 text-slate-300 dark:text-gray-500 border-slate-200 dark:border-gray-700')">
                      <span v-if="currentStep > 2" class="material-symbols-outlined text-xl">check</span>
                      <span v-else class="material-symbols-outlined text-xl">verified</span>
                  </div>
                  <span class="text-[10px] font-black uppercase mt-3" :class="currentStep === 2 ? 'text-primary-dark dark:text-white' : (currentStep > 2 ? 'text-emerald-500 dark:text-emerald-400 font-black' : 'text-slate-400 dark:text-gray-500')">Aprobación</span>
              </div>

              <!-- Step 3 -->
              <div @click="irAlPaso(3)" class="flex flex-col items-center bg-white dark:bg-gray-950 px-4 cursor-pointer select-none hover:opacity-80 transition-all">
                  <div class="w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-500"
                       :class="currentStep === 3 ? [themeBg, 'text-white border-umsa-gold scale-110 shadow-[0_0_15px_rgba(37,99,235,0.2)]'] : 
                              (currentStep > 3 ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg' : 'bg-white dark:bg-gray-800 text-slate-300 dark:text-gray-500 border-slate-200 dark:border-gray-700')">
                      <span v-if="currentStep > 3" class="material-symbols-outlined text-xl">check</span>
                      <span v-else class="material-symbols-outlined text-xl">schedule</span>
                  </div>
                  <span class="text-[10px] font-black uppercase mt-3" :class="currentStep === 3 ? 'text-primary-dark dark:text-white' : (currentStep > 3 ? 'text-emerald-500 dark:text-emerald-400 font-black' : 'text-slate-400 dark:text-gray-500')">Horarios</span>
              </div>

              <!-- Step 4 -->
              <div @click="irAlPaso(4)" class="flex flex-col items-center bg-white dark:bg-gray-950 px-4 cursor-pointer select-none hover:opacity-80 transition-all">
                  <div class="w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-500"
                       :class="currentStep === 4 ? [themeBg, 'text-white border-umsa-gold scale-110 shadow-[0_0_15px_rgba(37,99,235,0.2)]'] : 
                              (currentStep > 4 ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg' : 'bg-white dark:bg-gray-800 text-slate-300 dark:text-gray-500 border-slate-200 dark:border-gray-700')">
                      <span v-if="currentStep > 4" class="material-symbols-outlined text-xl">check</span>
                      <span v-else class="material-symbols-outlined text-xl">person_add_alt</span>
                  </div>
                  <span class="text-[10px] font-black uppercase mt-3" :class="currentStep === 4 ? 'text-primary-dark dark:text-white' : (currentStep > 4 ? 'text-emerald-500 dark:text-emerald-400 font-black' : 'text-slate-400 dark:text-gray-500')">Requisitos</span>
              </div>

              <!-- Step 5 -->
              <div @click="irAlPaso(5)" class="flex flex-col items-center bg-white dark:bg-gray-950 px-4 cursor-pointer select-none hover:opacity-80 transition-all">
                  <div class="w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-500"
                       :class="currentStep === 5 ? [themeBg, 'text-white border-umsa-gold scale-110 shadow-[0_0_15px_rgba(188,156,49,0.4)]'] : 
                              (currentStep > 5 ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg' : 'bg-white dark:bg-gray-800 text-slate-300 dark:text-gray-500 border-slate-200 dark:border-gray-700')">
                      <span v-if="currentStep > 5" class="material-symbols-outlined text-xl">check</span>
                      <span v-else class="material-symbols-outlined text-xl">check_circle</span>
                  </div>
                  <span class="text-[10px] font-black uppercase mt-3" :class="currentStep === 5 ? 'text-primary-dark dark:text-white' : (currentStep > 5 ? 'text-emerald-500 dark:text-emerald-400 font-black' : 'text-slate-400 dark:text-gray-500')">Resumen</span>
              </div>
          </div>
      </div>

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

      <div v-show="currentStep === 2" class="space-y-8 animate-in slide-in-from-right-8 duration-500">
          <div class="bg-white dark:bg-gray-900 p-8 rounded-[2rem] shadow-sm border border-slate-100 dark:border-gray-800">
              <h3 class="text-xl font-black text-primary-dark dark:text-white uppercase italic mb-8">2. Parámetros de Aprobación</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div class="p-8 rounded-[2rem] border-2 border-slate-100 dark:border-gray-800 border-l-[8px] border-l-primary-dark bg-slate-50 dark:bg-gray-800">
                      <h4 class="font-black text-primary-dark dark:text-white mb-2 uppercase text-sm">Nota Mínima</h4>
                      <input v-model="nuevaActividad.min_nota" type="number" min="0" max="100" class="w-full bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 font-black text-xl text-center text-primary-dark dark:text-gray-200" />
                  </div>
                  <div class="p-8 rounded-[2rem] border-2 border-slate-100 dark:border-gray-800 border-l-[8px] border-l-umsa-gold bg-slate-50 dark:bg-gray-800">
                      <h4 class="font-black text-primary-dark dark:text-white mb-2 uppercase text-sm">Asistencia Mínima (%)</h4>
                      <input v-model="nuevaActividad.min_asistencia" type="number" min="0" max="100" class="w-full bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 font-black text-xl text-center text-primary-dark dark:text-gray-200" />
                  </div>
              </div>
          </div>
      </div>

      <div v-show="currentStep === 3" class="space-y-8 animate-in slide-in-from-right-8 duration-500">
          <div class="bg-white dark:bg-gray-900 p-8 rounded-[2rem] shadow-sm border border-slate-100 dark:border-gray-800">
              <h3 class="text-xl font-black text-primary-dark dark:text-white uppercase italic mb-8">3. Cronograma y Modalidad</h3>
              
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
                  <button @click="agregarSesion" title="Añadir Horario" :class="[themeBg, themeHover]" class="w-12 h-[46px] flex items-center justify-center text-white rounded-xl shadow-md transition-all mb-[1px]">
                      <span class="material-symbols-outlined text-[20px]">add</span>
                  </button>
              </div>
          </div>
      </div>

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

      <div v-show="currentStep === 5" class="space-y-8 animate-in zoom-in-95 duration-500">
          <div class="bg-white dark:bg-gray-900 p-8 rounded-[2rem] shadow-sm border-l-[10px] border-l-umsa-gold dark:border-l-yellow-600 border border-slate-100 dark:border-gray-800">
              <h3 class="text-xl font-black text-primary-dark dark:text-white uppercase italic mb-4">5. Confirmación y Revisión</h3>
              <p class="text-sm font-bold text-slate-500 dark:text-gray-400 mb-8 italic">Por favor, verifica los detalles finales antes de publicar la actividad en el sistema.</p>

              <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
          
          <div class="flex items-center gap-3">
              <button v-if="isEditingActividad" @click="publicarActividad" :disabled="isLoading"
                class="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-[11px] uppercase rounded-xl flex items-center gap-2 transition-all shadow-xl hover:-translate-y-0.5">
                  <span class="material-symbols-outlined text-[18px]">save</span> Guardar Cambios
              </button>
              
              <button v-if="currentStep < 5" @click="changeStep(1)" 
                :class="[themeBg, themeHover]"
                class="px-8 py-3 text-white font-black text-[11px] uppercase rounded-xl flex items-center gap-2 transition-all shadow-xl hover:-translate-y-0.5">
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
    <div v-if="isCreatingEvento" :class="isAdminContext ? 'shadow-red-900/10 border-red-100' : 'shadow-umsa-blue/10 border-blue-100'" class="bg-white dark:bg-gray-900 rounded-[2rem] shadow-xl dark:shadow-black/50 border dark:border-gray-800 animate-in slide-in-from-top-4 duration-500 overflow-hidden relative mb-20">
        <div :class="isAdminContext ? 'from-red-600 to-red-800' : 'from-umsa-blue to-emerald-500'" class="bg-gradient-to-r p-8 pb-10 relative overflow-hidden">
            <span class="material-symbols-outlined absolute -right-4 -top-8 text-[120px] text-white/10 rotate-12">design_services</span>
            <div class="flex justify-between items-start relative z-20">
                <h3 class="text-2xl md:text-3xl font-black text-white uppercase italic tracking-tighter drop-shadow-md flex items-center gap-3">
                    <span class="material-symbols-outlined text-3xl">{{ isEditingEvento ? 'edit_calendar' : 'add_circle' }}</span>
                    {{ isEditingEvento ? 'Editar Gestión de Evento' : 'Crear Nueva Gestión de Evento' }}
                </h3>
                <div class="flex items-center gap-3">
                    <button @click.prevent="handleSaveEvento" class="bg-umsa-gold hover:bg-yellow-600 text-white px-4 py-2 rounded-xl border border-yellow-500 transition-all flex items-center gap-2 shadow-lg">
                        <span class="material-symbols-outlined text-sm">check_circle</span>
                        <span class="text-[9px] font-black uppercase tracking-widest">Finalizar Cambios</span>
                    </button>
                    <button @click="confirmarCancelar" class="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl border border-white/20 transition-all flex items-center gap-2">
                        <span class="material-symbols-outlined text-sm">close</span>
                        <span class="text-[9px] font-black uppercase tracking-widest">cancelar</span>
                    </button>
                </div>
            </div>
        </div>

        <div class="bg-slate-50 dark:bg-gray-800/50 border-b border-slate-100 dark:border-gray-800 px-8 py-4 flex items-center justify-between overflow-x-auto thin-scrollbar">
            <div v-for="step in totalSteps" :key="step" 
                 @click="irAlPaso(step)"
                 class="flex items-center gap-2 shrink-0 cursor-pointer hover:opacity-80 transition-all select-none">
                <div :class="[
                    currentStep === step ? [themeBg, 'text-white ring-4', isAdminContext ? 'ring-red-100 dark:ring-red-900/30' : 'ring-blue-100 dark:ring-blue-900/30'] : 
                    (currentStep > step ? (isAdminContext ? 'bg-red-800 text-white' : 'bg-emerald-500 text-white') : 'bg-slate-200 dark:bg-gray-700 text-slate-500'),
                    'w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black transition-all duration-500'
                ]">
                    <span v-if="currentStep > step" class="material-symbols-outlined text-sm">check</span>
                    <span v-else>{{ step }}</span>
                </div>
                <span :class="currentStep === step ? 'text-primary-dark dark:text-white' : 'text-slate-400'" class="text-[9px] font-black uppercase tracking-widest hidden md:block mr-4">
                    {{ 
                        step === 1 ? 'Identidad' : 
                        step === 2 ? 'Narrativa' : 
                        step === 3 ? 'Cronograma' : 
                        step === 4 ? 'Directorio' : 
                        step === 5 ? 'Ubicación' : 
                        step === 6 ? 'Contacto' : 'Certificados'
                    }}
                </span>
                <div v-if="step < totalSteps" class="h-[2px] w-8 bg-slate-200 dark:bg-gray-700 mx-2 hidden lg:block"></div>
            </div>
        </div>
        
        <form @submit.prevent="handleSaveEvento" class="bg-white dark:bg-gray-900 p-8 md:p-12 min-h-[600px] flex flex-col relative z-20">
            
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 flex-1">
                
                <div class="lg:col-span-7 space-y-8 animate-in slide-in-from-left-8 duration-500">
                    
                    <!-- PASO 1: IDENTIDAD VISUAL -->
                    <div v-if="currentStep === 1" class="space-y-6">
                        <div class="flex items-center gap-3 border-b border-slate-100 dark:border-gray-800 pb-4 mb-6">
                            <span class="material-symbols-outlined text-umsa-blue">palette</span>
                            <h4 class="text-sm font-black text-primary-dark dark:text-white uppercase italic">Paso 1: Identidad Visual y Configuración de Colores</h4>
                        </div>

                        <!-- SECCIÓN A: IDENTIDAD EN NAVBAR (ARRIBA) -->
                        <div class="p-6 bg-slate-50/50 dark:bg-gray-900/50 rounded-3xl border border-slate-100 dark:border-gray-800 space-y-6">
                            <div class="flex items-center gap-2">
                                <span class="material-symbols-outlined text-slate-400 text-sm">tab</span>
                                <h5 class="text-[10px] font-black text-slate-500 uppercase tracking-widest">Identidad en Barra Superior (Navbar)</h5>
                            </div>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label class="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2">Nombre en Navbar (Izquierda)</label>
                                    <div class="flex gap-2">
                                        <input v-model="formEvento.nombre" type="text" placeholder="NOMBRE DEL EVENTO" class="flex-1 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm font-black uppercase" />
                                        <div class="flex flex-col items-center justify-center bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-2">
                                            <div class="w-8 h-8 rounded-full overflow-hidden border border-slate-200 dark:border-gray-700">
                                                <input v-model="formEvento.color_texto_header" type="color" class="w-full h-full scale-150 cursor-pointer" />
                                            </div>
                                            <span class="text-[7px] font-bold text-slate-400 uppercase mt-1">COLOR</span>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label class="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2">Sigla / Acrónimo (Derecha)</label>
                                    <div class="flex gap-2">
                                        <input v-model="formEvento.sigla" type="text" placeholder="SIGLA" class="flex-1 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm font-black uppercase" />
                                        <div class="flex flex-col items-center justify-center bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-2">
                                            <div class="w-8 h-8 rounded-full overflow-hidden border border-slate-200 dark:border-gray-700">
                                                <input v-model="formEvento.color_sigla" type="color" class="w-full h-full scale-150 cursor-pointer" />
                                            </div>
                                            <span class="text-[7px] font-bold text-slate-400 uppercase mt-1">COLOR</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- SECCIÓN B: TÍTULOS EN HERO (FONDO) -->
                        <div class="p-6 bg-white dark:bg-gray-900 rounded-3xl border border-slate-100 dark:border-gray-800 space-y-6">
                            <div class="flex items-center gap-2">
                                <span class="material-symbols-outlined text-umsa-blue text-sm">title</span>
                                <h5 class="text-[10px] font-black text-slate-500 uppercase tracking-widest">Títulos sobre Imagen de Fondo (Hero)</h5>
                            </div>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label class="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2">Título Línea 1</label>
                                    <div class="flex gap-2">
                                        <input v-model="formEvento.nombre" type="text" class="flex-1 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm font-black uppercase" />
                                        <div class="flex flex-col items-center justify-center bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-2">
                                            <div class="w-8 h-8 rounded-full overflow-hidden border border-slate-200 dark:border-gray-700">
                                                <input v-model="formEvento.color_principal" type="color" class="w-full h-full scale-150 cursor-pointer" />
                                            </div>
                                            <span class="text-[7px] font-bold text-slate-400 uppercase mt-1">COLOR</span>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label class="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2">Título Línea 2</label>
                                    <div class="flex gap-2">
                                        <input v-model="formEvento.nombre_2" type="text" placeholder="PARTE 2" class="flex-1 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm font-black uppercase" />
                                        <div class="flex flex-col items-center justify-center bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-2">
                                            <div class="w-8 h-8 rounded-full overflow-hidden border border-slate-200 dark:border-gray-700">
                                                <input v-model="formEvento.color_titulo_2" type="color" class="w-full h-full scale-150 cursor-pointer" />
                                            </div>
                                            <span class="text-[7px] font-bold text-slate-400 uppercase mt-1">COLOR</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- SECCIÓN D: PRIORIDAD Y VISIBILIDAD -->
                        <div class="p-6 bg-white dark:bg-gray-900 rounded-3xl border border-slate-100 dark:border-gray-800 space-y-6">
                            <div class="flex items-center gap-2">
                                <span class="material-symbols-outlined text-amber-500 text-sm">priority_high</span>
                                <h5 class="text-[10px] font-black text-slate-500 uppercase tracking-widest">Prioridad y Visibilidad</h5>
                            </div>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label class="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2">Orden de Prioridad</label>
                                    <select v-model="formEvento.prioridad" class="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm font-bold">
                                        <option value="1">1º (Primer Evento / Destacado)</option>
                                        <option value="2">2º (Segundo Evento)</option>
                                        <option value="3">3º (Tercero)</option>
                                        <option value="4">4º (Cuarto)</option>
                                        <option value="5">5º (Quinto)</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2">Al Finalizar el Evento</label>
                                    <select v-model="formEvento.visibilidad_al_finalizar" class="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm font-bold">
                                        <option value="visible">Mantener Visible (con etiqueta 'Finalizado')</option>
                                        <option value="oculto">Ocultar Evento</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <!-- SECCIÓN C: DATOS Y BADGES (LOGÍSTICA) -->
                        <div class="p-6 bg-slate-50/50 dark:bg-gray-900/50 rounded-3xl border border-slate-100 dark:border-gray-800 space-y-6">
                            <div class="flex items-center gap-2">
                                <span class="material-symbols-outlined text-emerald-500 text-sm">dynamic_feed</span>
                                <h5 class="text-[10px] font-black text-slate-500 uppercase tracking-widest">Información y Colores de Badges</h5>
                            </div>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                <div>
                                    <label class="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2">Gestión / Edición</label>
                                    <div class="flex gap-2">
                                        <input v-model="formEvento.gestion" type="text" class="flex-1 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm font-bold" />
                                        <div class="w-8 h-8 rounded-full overflow-hidden border border-slate-200 dark:border-gray-700 mt-1">
                                            <input v-model="formEvento.color_badge_gestion" type="color" class="w-full h-full scale-150 cursor-pointer" />
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label class="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2">Fecha de Inicio</label>
                                    <div class="flex gap-2">
                                        <input v-model="formEvento.fecha_inicio" type="date" class="flex-1 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm font-bold" />
                                        <div class="w-8 h-8 rounded-full overflow-hidden border border-slate-200 dark:border-gray-700 mt-1">
                                            <input v-model="formEvento.color_badge_fecha" type="color" class="w-full h-full scale-150 cursor-pointer" />
                                        </div>
                                    </div>
                                </div>
                                <div class="md:col-span-2">
                                    <label class="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2">Badge Institucional (Texto y Color)</label>
                                    <div class="flex gap-3">
                                        <input v-model="formEvento.institucion_badge" type="text" class="flex-1 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 text-xs font-black uppercase" />
                                        <div class="flex flex-col items-center justify-center bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-3">
                                            <div class="w-8 h-8 rounded-full overflow-hidden border border-slate-200 dark:border-gray-700">
                                                <input v-model="formEvento.color_badge_institucion" type="color" class="w-full h-full scale-150 cursor-pointer" />
                                            </div>
                                            <span class="text-[7px] font-bold text-slate-400 uppercase mt-1">FONDO</span>
                                        </div>
                                    </div>
                                </div>
                                <div class="md:col-span-1">
                                    <label class="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2">Ciudad / Sede</label>
                                    <input v-model="formEvento.ubicacion" type="text" class="w-full bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 text-xs font-bold" />
                                </div>
                                <div class="md:col-span-1">
                                    <label class="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2">Dirección Física</label>
                                    <input v-model="formEvento.direccion" type="text" class="w-full bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 text-xs font-bold" />
                                </div>
                            </div>
                        </div>

                        <!-- SECCIÓN D: MULTIMEDIA -->
                        <div class="grid grid-cols-1 md:grid-cols-12 gap-6">
                            <div class="md:col-span-12 p-4 bg-white dark:bg-gray-900 rounded-3xl border border-slate-100 dark:border-gray-800 flex flex-col gap-2">
                                <label class="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] block">Fondo Hero (Banner)</label>
                                <div class="flex-1 relative bg-slate-50 dark:bg-gray-800 border border-dashed border-slate-200 dark:border-gray-700 rounded-2xl flex items-center justify-center overflow-hidden min-h-[100px]">
                                    <img v-if="resolvedBanner" :src="resolvedBanner" class="w-full h-full object-cover opacity-50" />
                                    <span v-else class="material-symbols-outlined text-slate-300">wallpaper</span>
                                    <input type="file" @change="onFondoChange" class="absolute inset-0 opacity-0 cursor-pointer" />
                                </div>
                            </div>
                        </div>
                        
                        <!-- SECCIÓN E: ESTADO Y FASE -->
                        <div class="p-6 bg-white dark:bg-gray-950 rounded-3xl border-2 border-red-50 dark:border-red-900/20 shadow-sm space-y-6">
                            <div class="flex items-center gap-2">
                                <span class="material-symbols-outlined text-red-600 text-sm">settings_suggest</span>
                                <h5 class="text-[10px] font-black text-slate-500 uppercase tracking-widest">Gestión del Ciclo de Vida del Evento</h5>
                            </div>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label class="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2">Estado General</label>
                                    <select v-model="formEvento.estado" class="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm font-black uppercase transition-all focus:ring-2 focus:ring-red-500/20">
                                        <option :value="2">Planificación</option>
                                        <option :value="1">Activo / Público</option>
                                        <option :value="3">Borrador</option>
                                        <option :value="0">Concluido / Cerrado</option>
                                    </select>
                                    <p class="text-[8px] text-slate-400 mt-2 italic font-bold">Controla la visibilidad y permisos globales.</p>
                                </div>
                                <div>
                                    <label class="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2">Fase Operativa</label>
                                    <select v-model="formEvento.fase" class="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm font-black uppercase transition-all focus:ring-2 focus:ring-red-500/20">
                                        <option :value="1">1. Planificación</option>
                                        <option :value="2">2. Inscripciones</option>
                                        <option :value="3">3. Ejecución</option>
                                        <option :value="4">4. Finalizado (Emisión de Certificados)</option>
                                        <option :value="5">5. Archivado</option>
                                    </select>
                                    <p class="text-[8px] text-slate-400 mt-2 italic font-bold">Determina qué acciones (inscripción, certificados) están permitidas.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- PASO 2: NARRATIVA -->
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

                    <!-- PASO 3: CRONOGRAMA Y FECHAS -->
                    <div v-if="currentStep === 3" class="space-y-6">
                        <div class="flex items-center justify-between border-b border-slate-100 dark:border-gray-800 pb-4 mb-6">
                            <div class="flex items-center gap-3">
                                <span class="material-symbols-outlined text-umsa-gold">view_timeline</span>
                                <h4 class="text-sm font-black text-primary-dark dark:text-white uppercase italic">Paso 3: Cronograma y Fechas</h4>
                            </div>
                        </div>
                        
                        <div class="grid grid-cols-2 gap-6 bg-slate-50 dark:bg-gray-800 p-4 rounded-2xl border border-slate-100 dark:border-gray-700">
                            <div>
                                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Fecha de Inicio General</label>
                                <input v-model="formEvento.fecha_inicio" type="date" required class="w-full bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm font-bold" />
                            </div>
                            <div>
                                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Fecha de Fin General</label>
                                <input v-model="formEvento.fecha_fin" type="date" required class="w-full bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm font-bold" />
                            </div>
                        </div>

                        <div class="flex justify-end">
                            <button @click.prevent="agregarDiaEvento" class="bg-umsa-gold text-white px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg hover:bg-yellow-500 transition-colors">+ AGREGAR DÍA</button>
                        </div>

                        <div class="space-y-4 max-h-[350px] overflow-y-auto thin-scrollbar pr-2">
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

                    <!-- PASO 4: DIRECTORIO / PERSONAL -->
                    <div v-if="currentStep === 4" class="space-y-8 animate-in slide-in-from-right-4 duration-500">
                        <div class="flex items-center justify-between border-b border-slate-100 dark:border-gray-800 pb-4 mb-6">
                            <div class="flex items-center gap-3">
                                <span class="material-symbols-outlined text-umsa-blue">badge</span>
                                <h4 class="text-sm font-black text-primary-dark dark:text-white uppercase italic">Paso 4: Directorio y Personal del Evento</h4>
                            </div>
                            <button @click="fetchUsuariosPersonal" type="button" class="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-umsa-blue rounded-lg text-[9px] font-black uppercase tracking-widest border border-blue-100 dark:border-blue-800 hover:bg-umsa-blue hover:text-white transition-all">
                                <span class="material-symbols-outlined text-[12px] align-middle mr-1">refresh</span>
                                Actualizar Usuarios
                            </button>
                        </div>

                        <!-- SECCIÓN COORDINADORES -->
                        <div>
                            <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-4 flex items-center gap-2">
                                <span class="material-symbols-outlined text-sm">groups</span> Asignar Coordinadores
                            </label>
                            <div v-if="usuariosCoordinadores.length === 0" class="p-8 text-center bg-slate-50 dark:bg-gray-800/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-gray-700">
                                <p class="text-[10px] font-bold text-slate-400 uppercase">No se encontraron usuarios con rol de Coordinador o Logística</p>
                            </div>
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[350px] overflow-y-auto thin-scrollbar pr-2">
                                <div v-for="user in usuariosCoordinadores" :key="user.id" 
                                     @click="toggleCoordinador(user.id)"
                                     :class="[formEvento.coordinadores_ids.includes(user.id) ? 'border-umsa-blue bg-blue-50 dark:bg-blue-900/20' : 'border-slate-100 dark:border-gray-800 bg-white dark:bg-gray-900']"
                                     class="p-4 border-2 rounded-2xl cursor-pointer transition-all flex flex-col gap-3 group shadow-sm hover:shadow-md">
                                    <div class="flex items-center gap-4">
                                        <div class="w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
                                             :class="formEvento.coordinadores_ids.includes(user.id) ? 'bg-umsa-blue text-white' : 'bg-slate-100 dark:bg-gray-800 text-slate-400 group-hover:bg-blue-100'">
                                            <span class="material-symbols-outlined">{{ formEvento.coordinadores_ids.includes(user.id) ? 'check_circle' : 'person' }}</span>
                                        </div>
                                        <div class="flex-1 min-w-0">
                                            <p class="text-xs font-black text-slate-700 dark:text-gray-200 uppercase truncate">{{ user.persona?.nombres }} {{ user.persona?.primer_apellido }}</p>
                                            <div class="flex items-center gap-2">
                                                <span class="text-[7px] font-black uppercase px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-umsa-blue">Coordinador</span>
                                                <p class="text-[9px] font-bold text-slate-400 truncate">{{ user.email }}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <!-- Dropdown de Grado Administrativo -->
                                    <div v-if="formEvento.coordinadores_ids.includes(user.id)" class="pt-2 border-t border-blue-100 dark:border-blue-800/50" @click.stop>
                                        <div v-if="user.persona?.firma_dig">
                                            <label class="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">Grado para Firmas</label>
                                            <select v-model="formEvento.coordinadores_grados[user.id]" class="w-full bg-white dark:bg-gray-900 border border-blue-200 dark:border-blue-700 rounded-lg px-2 py-1.5 text-xs font-bold text-primary-dark dark:text-gray-200 transition-all focus:ring-1 focus:ring-blue-500">
                                                <option :value="null">Ninguno / Por defecto</option>
                                                <option v-for="g in gradosAdministrativosDB" :key="g.id" :value="g.id">{{ g.nombre }} {{ g.abreviatura ? `(${g.abreviatura})` : '' }}</option>
                                            </select>
                                        </div>
                                        <div v-else class="text-[9px] font-bold text-slate-400 italic flex items-center gap-1.5 py-1">
                                            <span class="material-symbols-outlined text-[14px] text-amber-500">warning</span>
                                            Firma digital pendiente de cargar en perfil
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- SECCIÓN EXPOSITORES Y PONENTES -->
                        <div class="mt-8">
                            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                                <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest block flex items-center gap-2">
                                    <span class="material-symbols-outlined text-sm">record_voice_over</span> Asignar Expositores y Ponentes
                                </label>
                                <div class="flex flex-wrap items-center gap-3">
                                    <!-- Selector Mostrar Correos -->
                                    <label class="flex items-center gap-2 cursor-pointer select-none bg-slate-50 dark:bg-gray-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-gray-700">
                                        <input type="checkbox" v-model="formEvento.mostrar_correos" class="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer" />
                                        <span class="text-[9px] font-black uppercase text-slate-500 dark:text-gray-400 tracking-wider">Mostrar Correos</span>
                                    </label>
                                    <!-- Botones Seleccionar Todo -->
                                    <button @click.prevent="seleccionarTodosPonentes" class="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:hover:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all shadow-sm cursor-pointer">
                                        <span class="material-symbols-outlined text-[12px]">done_all</span> Seleccionar Todos
                                    </button>
                                    <button @click.prevent="deseleccionarTodosPonentes" class="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-900/40 text-rose-500 dark:text-rose-400 border border-rose-200 dark:border-rose-800 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all shadow-sm cursor-pointer">
                                        <span class="material-symbols-outlined text-[12px]">close</span> Deseleccionar Todos
                                    </button>
                                </div>
                            </div>
                            <div v-if="ponentesDB.length === 0" class="p-8 text-center bg-slate-50 dark:bg-gray-800/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-gray-700">
                                <p class="text-[10px] font-bold text-slate-400 uppercase">No se encontraron ponentes registrados</p>
                            </div>
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[350px] overflow-y-auto thin-scrollbar pr-2">
                                <div v-for="user in ponentesDB" :key="user.id" 
                                     @click="togglePonenteSeleccionado(user.id)"
                                     :class="[formEvento.ponentes_seleccionados.includes(user.id) ? 'border-amber-500 bg-amber-50/20 dark:bg-amber-900/10' : 'border-slate-100 dark:border-gray-800 bg-white dark:bg-gray-900']"
                                     class="p-4 border-2 rounded-2xl cursor-pointer transition-all flex items-center gap-4 group shadow-sm hover:shadow-md">
                                    <div class="w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
                                         :class="formEvento.ponentes_seleccionados.includes(user.id) ? 'bg-amber-500 text-white' : 'bg-slate-100 dark:bg-gray-800 text-slate-400 group-hover:bg-amber-100'">
                                        <span class="material-symbols-outlined">{{ formEvento.ponentes_seleccionados.includes(user.id) ? 'check_circle' : 'person_play' }}</span>
                                    </div>
                                    <div class="flex-1 min-w-0">
                                        <p class="text-xs font-black text-slate-700 dark:text-gray-200 uppercase truncate">{{ user.displayName }}</p>
                                        <div class="flex items-center gap-2">
                                            <span class="text-[7px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-700">{{ user.roleLabel }}</span>
                                            <p class="text-[9px] font-bold text-slate-400 truncate">{{ user.email }}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
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

                    <!-- PASO 6: CONTACTO, ORGANIZACIÓN Y AUSPICIOS -->
                    <div v-if="currentStep === 6" class="space-y-6">
                        <div class="flex items-center gap-3 border-b border-slate-100 dark:border-gray-800 pb-4 mb-6">
                            <span class="material-symbols-outlined text-umsa-blue">contact_support</span>
                            <h4 class="text-sm font-black text-primary-dark dark:text-white uppercase italic">Paso 6: Contacto, Organización y Auspicios</h4>
                        </div>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <!-- Dónde Estamos & Contacto -->
                            <div class="space-y-4">
                                <h5 class="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100 pb-2">Información de Contacto</h5>
                                <div>
                                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Dónde estamos</label>
                                    <textarea v-model="formEvento.contacto_donde" rows="2" placeholder="Ej: Campus Central UMSA, Avenida Villazón" class="w-full bg-slate-50 dark:bg-gray-800 border-2 border-slate-100 dark:border-gray-700 rounded-xl px-4 py-3 text-xs font-bold resize-none"></textarea>
                                </div>
                                <div>
                                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Teléfono de referencia</label>
                                    <input v-model="formEvento.contacto_telefono" type="text" placeholder="+591 76706873" class="w-full bg-slate-50 dark:bg-gray-800 border-2 border-slate-100 dark:border-gray-700 rounded-xl px-4 py-3 text-xs font-bold" />
                                </div>
                                <div>
                                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Correo Electrónico</label>
                                    <input v-model="formEvento.contacto_email" type="email" placeholder="contacto@umsa.bo" class="w-full bg-slate-50 dark:bg-gray-800 border-2 border-slate-100 dark:border-gray-700 rounded-xl px-4 py-3 text-xs font-bold" />
                                </div>
                            </div>

                            <!-- Organización y Auspicios -->
                            <div class="space-y-4 flex flex-col h-full">
                                <div class="flex items-center justify-between border-b border-slate-100 pb-2">
                                    <h5 class="text-[10px] font-black text-slate-500 uppercase tracking-widest">Organización y Auspicio</h5>
                                    <button @click.prevent="formEvento.auspicios.push({nombre: '', link: ''})" class="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded hover:bg-emerald-100 transition-colors">+ Añadir Auspiciador</button>
                                </div>
                                
                                <div class="flex-1 overflow-y-auto max-h-[300px] space-y-3 thin-scrollbar pr-2">
                                    <div v-if="formEvento.auspicios.length === 0" class="text-center py-6 text-slate-400 opacity-50 border-2 border-dashed border-slate-200 rounded-xl">
                                        <span class="material-symbols-outlined text-2xl">handshake</span>
                                        <p class="text-[9px] font-bold uppercase mt-1">Sin auspiciadores</p>
                                    </div>
                                    <div v-for="(ausp, idx) in formEvento.auspicios" :key="idx" class="bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 p-3 rounded-xl relative group">
                                        <button @click.prevent="formEvento.auspicios.splice(idx, 1)" class="absolute top-2 right-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span class="material-symbols-outlined text-sm">close</span>
                                        </button>
                                        <div class="space-y-2">
                                            <input v-model="ausp.nombre" type="text" placeholder="Nombre (Ej: TWAS)" class="w-full bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-600 rounded-lg px-3 py-2 text-[10px] font-bold" />
                                            <input v-model="ausp.link" type="text" placeholder="Enlace (Opcional)" class="w-full bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-600 rounded-lg px-3 py-2 text-[10px]" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- PASO 7: CERTIFICADOS -->
                    <div v-if="currentStep === 7" class="space-y-6">
                        <div class="flex items-center justify-between border-b border-slate-100 dark:border-gray-800 pb-4 mb-6">
                            <div class="flex items-center gap-3">
                                <span class="material-symbols-outlined text-umsa-gold">workspace_premium</span>
                                <h4 class="text-sm font-black text-primary-dark dark:text-white uppercase italic">Paso 7: Plantillas de Certificados</h4>
                            </div>
                        </div>
                        
                        <div class="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 p-4 rounded-2xl border border-blue-100 dark:border-blue-800 flex gap-3 text-xs mb-4">
                            <span class="material-symbols-outlined text-xl">info</span>
                            <p><strong>Configuración Centralizada:</strong> Los diseños y plantillas de certificados se configuran aquí a nivel del evento para mantener una estética unificada. Configura primero el rol (tipo de asistente) y su tenor, luego abre el "Workplace" para subir tu fondo y acomodar las variables (nombres, fechas, firmas).</p>
                        </div>

                        <!-- Selector de Rol (Configuración General de la Plantilla) -->
                        <div class="space-y-6">
                            <div>
                                <label class="text-[10px] font-black text-slate-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 block">Configurar para (Rol)</label>
                                <select v-model="tipoCertificado" class="w-full bg-slate-50 dark:bg-gray-800 border-2 border-slate-100 dark:border-gray-700 rounded-xl py-3.5 px-5 font-bold text-xs text-primary-dark dark:text-white focus:ring-2 focus:ring-umsa-gold outline-none transition-all cursor-pointer shadow-sm">
                                    <option :value="null" disabled>-- Selecciona un Rol para Configurar Certificado --</option>
                                    <option :value="1">Logística</option>
                                    <option :value="2">Expositor</option>
                                    <option :value="3">Organizador</option>
                                    <option :value="4">Asistente</option>
                                </select>
                            </div>

                            <!-- Tarjeta de presentación si no hay rol seleccionado -->
                            <div v-if="tipoCertificado === null" class="p-12 text-center bg-slate-50 dark:bg-gray-900/40 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-gray-800 flex flex-col items-center justify-center min-h-[300px] animate-in fade-in duration-300">
                                <div class="w-20 h-20 rounded-full bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 flex items-center justify-center mb-4 shadow-sm text-umsa-gold">
                                    <span class="material-symbols-outlined text-[40px]">workspace_premium</span>
                                </div>
                                <p class="text-[11px] font-bold text-slate-500 dark:text-gray-400 max-w-xs">
                                    Selecciona un rol arriba para configurar su plantilla de certificado (cabecera, tenor y diseño).
                                </p>
                            </div>

                            <!-- Layout del Diseñador en 2 columnas al seleccionar rol -->
                            <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in duration-300">
                                <!-- Datos Base (Cabecera + Tenor + Variables + Guardar) -->
                                <div class="space-y-5">
                                    <!-- Tabs de Modalidad para Asistente (Participación vs Excelencia) -->
                                    <Transition name="fade">
                                        <div v-if="tipoCertificado === 4" class="flex gap-2 p-1 bg-slate-100 dark:bg-gray-900/60 rounded-xl border border-slate-200 dark:border-gray-800">
                                            <button 
                                                @click.prevent="esExcelencia = 0"
                                                :class="esExcelencia === 0 ? 'bg-primary-dark dark:bg-slate-700 text-white shadow-md' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-gray-800'"
                                                class="flex-1 py-2 px-3 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
                                            >
                                                <span class="material-symbols-outlined text-[13px]">military_tech</span>
                                                Participación (Regular)
                                            </button>
                                            <button 
                                                @click.prevent="esExcelencia = 1"
                                                :class="esExcelencia === 1 ? 'bg-umsa-gold text-white shadow-md' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-gray-800'"
                                                class="flex-1 py-2 px-3 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
                                            >
                                                <span class="material-symbols-outlined text-[13px]">workspace_premium</span>
                                                Excelencia Académica
                                            </button>
                                        </div>
                                    </Transition>
                                    
                                    <!-- Cabecera -->
                                    <div>
                                        <label class="text-[10px] font-black text-slate-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 block">Cabecera del Certificado</label>
                                        <input v-model="infoCertificado.cabecera" type="text" placeholder="Ej: Certificado de Asistencia" class="w-full bg-slate-50 dark:bg-gray-800 border-2 border-slate-100 dark:border-gray-700 rounded-xl py-3 px-4 font-bold text-xs text-primary-dark dark:text-white focus:ring-2 focus:ring-umsa-gold outline-none transition-all">
                                    </div>

                                    <!-- Tenor -->
                                    <div>
                                        <label class="text-[10px] font-black text-slate-500 dark:text-gray-400 uppercase tracking-widest mb-1.5 block">Tenor del Certificado</label>
                                        <textarea
                                            v-model="infoCertificado.tenor"
                                            rows="5"
                                            placeholder="Ej: Se certifica que {NOMBRE_ESTUDIANTE} participó en el evento {EVENTO}..."
                                            class="w-full bg-slate-50 dark:bg-gray-800 border-2 border-slate-100 dark:border-gray-700 rounded-xl py-3 px-4 font-bold text-xs text-primary-dark dark:text-white focus:ring-2 focus:ring-umsa-gold outline-none transition-all resize-none leading-relaxed"
                                        ></textarea>
                                        <!-- Variables Dinámicas (clic para insertar) -->
                                        <div class="mt-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-xl">
                                            <p class="text-[9px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                                                <span class="material-symbols-outlined text-[12px]">auto_fix_high</span>
                                                Variables Dinámicas (clic para insertar)
                                            </p>
                                            <div class="grid grid-cols-2 gap-1">
                                                <code v-for="v in ['{NOMBRE_ESTUDIANTE}','{PRIMER_APELLIDO}','{SEGUNDO_APELLIDO}','{NOMBRE_CURSO}','{ACTIVIDAD}','{EVENTO}','{GESTION}','{ROL}','{CI_USUARIO}','{AREA_TEMATICA}','{DISCIPLINA}','{CARGA_HORARIA}','{FECHA_EMISION}','{NOTA_FINAL}','{CODIGO_CERTIFICADO}']" :key="v"
                                                    @click="infoCertificado.tenor = (infoCertificado.tenor || '') + v"
                                                    class="text-[8px] font-mono bg-white dark:bg-gray-800 border border-amber-200 dark:border-amber-700 text-amber-800 dark:text-amber-300 px-1.5 py-0.5 rounded cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors truncate"
                                                    :title="`Clic para insertar ${v}`"
                                                >{{ v }}</code>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Botón Guardar Cabecera y Tenor -->
                                    <div class="pt-2">
                                        <button @click.prevent="guardarInfoCertificado" class="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-2">
                                            <span class="material-symbols-outlined text-base">save</span> Guardar Cabecera y Tenor
                                        </button>
                                    </div>
                                </div>

                                <!-- Acceso al Lienzo / Workplace -->
                                <div class="flex flex-col space-y-6">
                                    <div class="p-6 bg-slate-50 dark:bg-gray-900 border-2 border-dashed border-slate-200 dark:border-gray-700 rounded-[2rem] text-center relative overflow-hidden group">
                                        <div class="w-20 h-20 rounded-full bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 flex items-center justify-center mx-auto mb-4 shadow-sm group-hover:scale-110 transition-transform">
                                          <span class="material-symbols-outlined text-[40px] text-umsa-gold">design_services</span>
                                        </div>
                                        <h5 class="text-sm font-black text-primary-dark dark:text-white uppercase mb-2">Editor Visual Avanzado</h5>
                                        <p class="text-[10px] text-slate-500 dark:text-gray-400 max-w-[200px] mx-auto mb-6">
                                            Abre el Workplace para subir tu imagen de fondo y colocar dinámicamente el nombre, firmas, cabecera y tenor.
                                        </p>
                                        <router-link
                                            v-if="editEventoId"
                                            :to="{
                                                name: isAdminContext ? 'admin-certificado-workplace-evento' : 'coordinador-certificado-workplace-evento',
                                                params: { id: editEventoId },
                                                query: { tipo: tipoCertificado, ...(tipoCertificado === 4 ? { es_excelencia: esExcelencia } : {}) }
                                            }"
                                            class="bg-umsa-gold hover:bg-yellow-600 text-white font-black px-6 py-3 rounded-xl text-[10px] uppercase tracking-widest shadow-lg inline-flex items-center gap-2 transition-all mx-auto"
                                        >
                                          <span class="material-symbols-outlined text-[16px]">open_in_new</span>
                                          Abrir Workplace
                                        </router-link>
                                        <div v-else class="text-[9px] text-red-500 font-bold uppercase p-3 bg-red-50 dark:bg-red-900/20 rounded-xl inline-block mx-auto">
                                            Debes guardar el evento primero
                                        </div>
                                    </div>

                                    <div class="bg-slate-100/50 dark:bg-gray-800/30 border border-slate-200 dark:border-gray-700 p-5 rounded-[1.5rem]">
                                        <h6 class="text-[10px] font-black text-primary-dark dark:text-white uppercase tracking-widest mb-3 flex items-center gap-2">
                                            <span class="material-symbols-outlined text-sm text-emerald-500">category</span> Guía de Bloques en el Workplace
                                        </h6>
                                        <ul class="space-y-3">
                                            <li class="flex items-start gap-3">
                                                <div class="w-6 h-6 rounded bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5"><span class="material-symbols-outlined text-[14px]">text_fields</span></div>
                                                <div>
                                                    <p class="text-[10px] font-bold text-primary-dark dark:text-white">Bloques de Texto (Cabecera / Tenor)</p>
                                                    <p class="text-[9px] text-slate-500 leading-tight">Muestran el contenido que configures arriba. Se adaptarán al ancho que les asignes.</p>
                                                </div>
                                            </li>
                                            <li class="flex items-start gap-3">
                                                <div class="w-6 h-6 rounded bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5"><span class="material-symbols-outlined text-[14px]">draw</span></div>
                                                <div>
                                                    <p class="text-[10px] font-bold text-primary-dark dark:text-white">Bloque de Firmas</p>
                                                    <p class="text-[9px] text-slate-500 leading-tight">Contenedor dinámico donde se insertarán horizontalmente las firmas de ponentes y coordinadores.</p>
                                                </div>
                                            </li>
                                        </ul>
                                    </div>
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

                <!-- PANEL DE PREVISUALIZACIÓN (DERECHA) -->
                <div class="lg:col-span-5 sticky top-8">
                    <div class="flex flex-col h-full">
                        <div class="flex items-center justify-between mb-4">
                            <span class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">
                                {{ currentStep === 1 ? 'Vista Previa Dinámica (Mini-Home)' : 'Previsualización de Sección' }}
                            </span>
                            <div class="flex gap-1">
                                <div class="w-2 h-2 rounded-full bg-red-400"></div>
                                <div class="w-2 h-2 rounded-full bg-amber-400"></div>
                                <div class="w-2 h-2 rounded-full bg-emerald-400"></div>
                            </div>
                        </div>

                    <!-- SECCIONES REACTIVAS: animación de deslizamiento direccional -->
                    <Transition :name="previewTransition" mode="out-in">
                    <div :key="currentStep">
                        <!-- PASO 1: HERO SIMULADOR (COMPACTO Y ELEGANTE) -->
                        <div
                            v-if="currentStep === 1"
                            ref="heroRef"
                            :class="[
                                currentStep === 1 ? 'h-[520px]' : 'h-[200px]',
                                currentStep === 1 ? 'ring-4 ring-umsa-blue/40 shadow-2xl shadow-umsa-blue/20' : 'ring-0'
                            ]"
                            class="transition-all duration-700 ease-in-out bg-slate-100 dark:bg-gray-950 rounded-[3rem] shadow-2xl border border-slate-200 dark:border-gray-800 overflow-hidden relative group"
                        >
                            
                            <!-- BARRA SUPERIOR ULTRA-LIMPIA -->
                            <div class="absolute top-0 inset-x-0 h-14 bg-white/95 backdrop-blur-md z-50 flex items-center px-6 border-b border-slate-100/50 shadow-sm">
                                <!-- IZQUIERDA: Logo + Sigla/Nombre apilados (igual que el home) -->
                                <div class="flex items-center gap-2">
                                    <img v-if="resolvedLogo" :src="resolvedLogo" class="h-7 w-auto object-contain" />
                                    <div v-else class="h-7 w-7 bg-slate-200 rounded-full animate-pulse"></div>
                                    <div class="flex flex-col leading-none">
                                        <span :style="{ color: formEvento.color_sigla }" class="text-[8px] font-black uppercase tracking-widest italic">
                                            {{ formEvento.sigla || 'TWAS-TYAN' }}
                                        </span>
                                        <span :style="{ color: formEvento.color_texto_header }" class="text-[7px] font-bold uppercase tracking-tight truncate max-w-[130px]">
                                            {{ formEvento.nombre || 'Congreso Internacional' }}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <!-- CONTENIDO HERO (1:1 HOME) -->
                            <div class="h-full w-full relative">
                                <img v-if="resolvedBanner" :src="resolvedBanner" class="w-full h-full object-cover opacity-60" />
                                <div v-else class="w-full h-full bg-slate-900"></div>
                                
                                <div class="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/40 to-transparent"></div>
                                
                                <div class="absolute inset-0 p-8 pt-20 flex flex-col justify-end text-left">
                                    <!-- BADGES SUPERIORES -->
                                    <div class="flex items-center gap-2 mb-6">
                                        <div :style="{ backgroundColor: formEvento.color_badge_gestion }" class="flex items-center gap-2 px-3 py-1.5 backdrop-blur-md border border-white/20 rounded-xl shadow-lg shadow-black/20">
                                            <span class="material-symbols-outlined text-[12px] text-white">event_note</span>
                                            <span class="text-[8px] font-black text-white uppercase">Gestión Actual</span>
                                        </div>
                                        <div :style="{ backgroundColor: formEvento.color_badge_institucion }" class="inline-flex items-center gap-2 px-4 py-1.5 text-white rounded-xl border border-white/20 shadow-lg shadow-black/20">
                                            <span class="material-symbols-outlined text-[12px]">verified</span>
                                            <span class="text-[8px] font-black uppercase tracking-widest italic">{{ formEvento.institucion_badge || 'EVENTO OFICIAL' }}</span>
                                        </div>
                                    </div>

                                    <!-- TÍTULO BÍCRROMO IMPACTANTE -->
                                    <div class="mb-4 flex flex-col items-start leading-none">
                                        <h1 :style="{ color: formEvento.color_principal }" class="text-[38px] font-black tracking-tighter uppercase italic drop-shadow-2xl">
                                            {{ formEvento.nombre || 'CONGRESO' }}
                                        </h1>
                                        <h1 :style="{ color: formEvento.color_titulo_2 }" class="text-[38px] font-black tracking-tighter uppercase italic drop-shadow-2xl -mt-1">
                                            {{ formEvento.nombre_2 || 'INTERNACIONAL' }}
                                        </h1>
                                    </div>
                                    
                                    <!-- LUGAR (UBICACIÓN CIUDAD) -->
                                    <p class="text-sm font-black text-slate-300 uppercase tracking-[0.2em] mb-8 italic drop-shadow-lg">
                                        {{ formEvento.ubicacion || 'LA PAZ, BOLIVIA' }}
                                    </p>
                                    
                                    <!-- TRÍADA DE INFORMACIÓN -->
                                    <div class="flex items-center gap-2 mb-8">
                                        <div :style="{ backgroundColor: formEvento.color_badge_gestion }" class="px-3 py-2 text-white rounded-xl flex items-center gap-2 border border-white/10 shadow-lg">
                                            <span class="material-symbols-outlined text-[14px]">military_tech</span>
                                            <span class="text-[9px] font-black">{{ formEvento.gestion || '2025' }}</span>
                                        </div>
                                        <div :style="{ backgroundColor: formEvento.color_badge_fecha }" class="px-3 py-2 text-white border border-white/10 rounded-xl flex items-center gap-2 shadow-lg">
                                            <span class="material-symbols-outlined text-[14px] text-white">calendar_today</span>
                                            <span class="text-[9px] font-bold uppercase italic">{{ formEvento.fecha_inicio ? formatDate(formEvento.fecha_inicio) : '13 DE MAYO' }}</span>
                                        </div>
                                        <div v-if="formEvento.direccion" class="px-3 py-2 bg-black/40 backdrop-blur-md text-white border border-white/10 rounded-xl flex items-center gap-2">
                                            <span class="material-symbols-outlined text-[14px] text-blue-400">location_on</span>
                                            <span class="text-[9px] font-bold uppercase italic truncate max-w-[150px]">{{ formEvento.direccion }}</span>
                                        </div>
                                    </div>

                                    <!-- DESCRIPCIÓN ESENCIAL -->
                                    <p class="text-[11px] text-slate-300 font-medium leading-relaxed max-w-[400px] mb-8 opacity-90 line-clamp-2">
                                        {{ formEvento.descripcion || 'Descripción del impacto y objetivos del evento latinoamericano...' }}
                                    </p>

                                    <!-- BOTONES OFICIALES -->
                                    <div class="flex items-center gap-3">
                                        <div :style="{ backgroundColor: formEvento.color_principal }" class="px-6 py-3 rounded-xl text-white text-[9px] font-black uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-black/30">
                                            <span class="material-symbols-outlined text-sm">login</span> INGRESAR AL PORTAL
                                        </div>
                                        <div class="px-6 py-3 rounded-xl bg-white/10 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-widest border border-white/20 flex items-center gap-2">
                                            <span class="material-symbols-outlined text-sm">visibility</span> DETALLES
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <!-- SECCIÓN NARRATIVA (PASO 2) -->
                        <div
                            ref="previewStep2Ref"
                            v-if="currentStep === 2"
                            class="bg-white dark:bg-gray-800 border-2 border-umsa-blue/20 dark:border-blue-900/40 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-blue-500/10 animate-in slide-in-from-right-8 duration-500 ring-4 ring-umsa-blue/30 ring-offset-2"
                        >
                            <!-- Header con acento visual -->
                            <div class="bg-gradient-to-r from-umsa-blue/5 to-transparent dark:from-blue-900/20 px-8 pt-8 pb-4 border-b border-blue-100 dark:border-blue-900/30">
                                <div class="flex items-center gap-3">
                                    <span class="material-symbols-outlined text-umsa-blue text-2xl">article</span>
                                    <div>
                                        <p class="text-[8px] font-black text-umsa-blue/60 uppercase tracking-[0.2em]">Previsualización — Sección del Home</p>
                                        <h2 class="text-lg font-black text-umsa-blue dark:text-white uppercase italic tracking-tighter leading-none">Sobre el Evento</h2>
                                    </div>
                                </div>
                            </div>
                            <!-- Contenido -->
                            <div class="p-8 space-y-5">
                                <!-- Nombre del evento -->
                                <div>
                                    <p class="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Nombre del Evento</p>
                                    <p class="text-sm font-black text-primary-dark dark:text-white uppercase italic tracking-tight">
                                        {{ formEvento.nombre || 'CONGRESO INTERNACIONAL' }} {{ formEvento.nombre_2 || '' }}
                                    </p>
                                </div>
                                <!-- Descripción principal -->
                                <div>
                                    <p class="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">Descripción Principal (Párrafo 1)</p>
                                    <p class="text-[11px] text-slate-600 dark:text-gray-300 font-medium leading-relaxed border-l-3 border-umsa-blue pl-4" style="border-left-width: 3px; border-left-color: var(--umsa-blue, #0070b4);">
                                        {{ formEvento.sobre_evento_1 || 'El texto del párrafo 1 aparecerá aquí...' }}
                                    </p>
                                </div>
                                <!-- Frase destacada -->
                                <div v-if="formEvento.frase_destacada" class="bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-900/10 p-5 rounded-2xl border-l-4 border-umsa-blue relative">
                                    <span class="material-symbols-outlined absolute right-3 top-3 text-blue-100 dark:text-blue-900 text-3xl">format_quote</span>
                                    <p class="text-xs font-black text-umsa-blue dark:text-blue-300 italic leading-snug relative z-10">
                                        "{{ formEvento.frase_destacada }}"
                                    </p>
                                </div>
                                <div v-else class="bg-slate-50 dark:bg-gray-900/50 p-4 rounded-2xl border border-dashed border-slate-200 dark:border-gray-700 text-center">
                                    <p class="text-[8px] font-bold text-slate-400 italic">La frase destacada aparecerá aquí...</p>
                                </div>
                                <!-- Párrafo 2 -->
                                <div v-if="formEvento.sobre_evento_2">
                                    <p class="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Información Adicional (Párrafo 2)</p>
                                    <p class="text-[10px] text-slate-500 dark:text-gray-400 font-medium leading-relaxed">
                                        {{ formEvento.sobre_evento_2 }}
                                    </p>
                                </div>
                                <!-- Links externos (Web y Facebook) -->
                                <div v-if="formEvento.link_web || formEvento.link_facebook" class="pt-4 border-t border-slate-100 dark:border-gray-700 space-y-2">
                                    <p class="text-[7px] font-black text-slate-400 uppercase tracking-[0.2em]">Más información oficial</p>
                                    <div class="flex flex-wrap gap-2">
                                        <a v-if="formEvento.link_web" :href="formEvento.link_web" target="_blank" :style="{ borderColor: formEvento.color_principal, color: formEvento.color_principal }" class="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border-2 bg-white dark:bg-gray-900 font-black text-[8px] uppercase tracking-wider shadow-sm hover:-translate-y-0.5 transition-all group">
                                            <span class="material-symbols-outlined text-[13px]">language</span>
                                            Sitio Web
                                            <span class="material-symbols-outlined text-[10px] opacity-50 group-hover:opacity-100 transition-all">arrow_outward</span>
                                        </a>
                                        <a v-if="formEvento.link_facebook" :href="formEvento.link_facebook" target="_blank" class="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border-2 border-[#1877F2] text-[#1877F2] bg-white dark:bg-gray-900 font-black text-[8px] uppercase tracking-wider shadow-sm hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:-translate-y-0.5 transition-all group">
                                            <svg class="w-3 h-3 fill-current shrink-0" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                                            Facebook
                                            <span class="material-symbols-outlined text-[10px] opacity-50 group-hover:opacity-100 transition-all">arrow_outward</span>
                                        </a>
                                    </div>
                                </div>
                                <div v-else class="pt-4 border-t border-dashed border-slate-100 dark:border-gray-700">
                                    <p class="text-[7px] font-bold text-slate-300 italic">Links de Web y Facebook aparecerán aquí si los configuras...</p>
                                </div>
                            </div>
                        </div>

                        <!-- SECCIÓN UBICACIÓN (PASO 5) -->
                        <div
                            ref="previewStep5Ref"
                            v-if="currentStep === 5"
                            class="bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 rounded-[2.5rem] overflow-hidden shadow-2xl animate-in slide-in-from-right-8 duration-500 ring-4 ring-emerald-400/40 ring-offset-2"
                        >
                             <div class="p-8 space-y-6">
                                <div class="flex flex-col gap-1">
                                    <h2 class="text-xl font-black text-primary-dark dark:text-white uppercase italic tracking-tighter">Sede del Evento</h2>
                                    <p class="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                        <span class="material-symbols-outlined text-[14px] text-emerald-500">place</span>
                                        {{ formEvento.direccion || 'Ubicación pendiente de asignar' }}
                                    </p>
                                </div>
                                
                                <div class="aspect-video bg-slate-100 dark:bg-gray-900 rounded-2xl border-2 border-dashed border-slate-200 dark:border-gray-700 flex flex-col items-center justify-center p-6 text-center group">
                                    <div v-if="formEvento.google_maps_link" class="space-y-3">
                                        <span class="material-symbols-outlined text-4xl text-umsa-blue animate-bounce">location_on</span>
                                        <p class="text-[10px] font-black text-primary-dark dark:text-white uppercase">Mapa de Google Vinculado</p>
                                        <p class="text-[7px] text-slate-400 truncate max-w-[200px]">{{ formEvento.google_maps_link }}</p>
                                    </div>
                                    <div v-else class="opacity-30 space-y-2">
                                        <span class="material-symbols-outlined text-4xl">map</span>
                                        <p class="text-[8px] font-black uppercase">Pendiente vincular Google Maps</p>
                                    </div>
                                </div>
                             </div>
                        </div>

                        <!-- SECCIÓN DIRECTORIO (PASO 4) -->
                        <div
                            ref="previewStep4Ref"
                            v-if="currentStep === 4"
                            class="bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-[2.5rem] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-8 duration-500 ring-4 ring-umsa-blue/30 ring-offset-2"
                        >
                             <div class="p-8">
                                <div class="flex flex-col items-center text-center mb-8">
                                    <span class="text-[8px] font-black text-umsa-blue uppercase tracking-widest mb-1">Directorio Oficial</span>
                                    <h2 class="text-xl font-black text-primary-dark dark:text-white uppercase italic tracking-tighter">Expositores y Ponentes</h2>
                                </div>

                                <div v-if="formEvento.ponentes_seleccionados.length > 0" class="grid grid-cols-2 gap-3">
                                    <div v-for="id in formEvento.ponentes_seleccionados.slice(0, 4)" :key="id" class="p-4 bg-white dark:bg-gray-800 rounded-2xl border border-slate-100 dark:border-gray-700 shadow-sm flex items-center gap-3">
                                        <div class="w-10 h-10 rounded-full bg-slate-100 dark:bg-gray-700 flex items-center justify-center border-2 border-emerald-500/30">
                                            <span class="material-symbols-outlined text-emerald-500">person</span>
                                        </div>
                                        <div class="flex-1 overflow-hidden">
                                            <p class="text-[8px] font-black text-primary-dark dark:text-white truncate uppercase">{{ ponentesDB.find(p => p.id === id)?.displayName || 'Nombre Ponente' }}</p>
                                            <p class="text-[6px] text-slate-400 uppercase font-bold">{{ ponentesDB.find(p => p.id === id)?.roleLabel || 'Expositor' }}</p>
                                        </div>
                                    </div>
                                </div>
                                <div v-else class="py-12 flex flex-col items-center justify-center opacity-20 border-2 border-dashed border-slate-200 dark:border-gray-800 rounded-3xl">
                                    <span class="material-symbols-outlined text-5xl">groups</span>
                                    <p class="text-[9px] font-black uppercase mt-2">Sin personal seleccionado</p>
                                </div>
                                
                                <p class="text-[8px] font-black text-slate-400 uppercase mt-6 text-center tracking-widest">{{ formEvento.ponentes_seleccionados.length }} Personas registradas en esta gestión</p>
                             </div>
                        </div>

                        <!-- SECCIÓN CRONOGRAMA (PASO 3) -->
                        <div
                            ref="previewStep3Ref"
                            v-if="currentStep === 3"
                            class="bg-slate-50 dark:bg-gray-950 rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-200 dark:border-gray-800 animate-in slide-in-from-bottom-8 duration-500 ring-4 ring-emerald-500/30 ring-offset-2"
                        >
                            <div class="p-8">
                                <div class="flex items-center gap-2 mb-2">
                                    <div class="h-1 w-8 bg-emerald-500 rounded-full"></div>
                                    <span class="text-emerald-600 dark:text-emerald-500 font-bold uppercase tracking-widest text-[8px]">Actividades Programadas</span>
                                </div>
                                <div class="flex items-end justify-between mb-8">
                                  <h2 class="text-xl font-black text-primary-dark dark:text-white uppercase tracking-tighter italic leading-none">Cronograma {{ formEvento.gestion }}</h2>
                                  <p v-if="formEvento.fecha_inicio" class="text-[8px] text-umsa-blue font-bold uppercase tracking-widest bg-blue-50 dark:bg-umsa-blue/10 px-2 py-1 rounded-lg border border-blue-100 dark:border-umsa-blue/30">{{ formatDate(formEvento.fecha_inicio) }}</p>
                                </div>

                                <div class="flex gap-3 overflow-x-auto pb-4 thin-scrollbar">
                                    <div v-if="formEvento.cronograma_lista.length === 0" class="w-full py-12 text-center opacity-40 flex flex-col items-center border-2 border-dashed border-slate-300 dark:border-gray-700 rounded-3xl">
                                        <span class="material-symbols-outlined text-4xl mb-2 text-slate-400">calendar_today</span>
                                        <p class="text-[9px] font-black uppercase text-slate-500">Agrega días al cronograma</p>
                                    </div>
                                    <div v-for="dia in formEvento.cronograma_lista" :key="dia.day" class="min-w-[140px] bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl shadow-sm flex flex-col shrink-0">
                                        <div class="bg-slate-100 dark:bg-gray-800 p-4 relative overflow-hidden rounded-t-2xl">
                                           <div class="text-5xl font-black opacity-5 absolute -top-2 -right-2 text-umsa-blue">{{ dia.day }}</div>
                                           <span class="block text-3xl font-black text-umsa-blue dark:text-blue-300 relative z-10 font-serif leading-none mb-1">{{ dia.day }}</span>
                                           <span class="block text-[8px] uppercase tracking-widest font-bold text-slate-400 relative z-10">{{ dia.name }}</span>
                                        </div>
                                        <div class="flex-1 p-4 space-y-3 bg-white/50 dark:bg-black/20">
                                          <div v-for="(act, idx) in dia.events.slice(0, 3)" :key="idx" class="relative pl-3 before:content-[''] before:absolute before:left-0 before:top-1 before:w-1.5 before:h-1.5 before:bg-emerald-500 before:rounded-full after:content-[''] after:absolute after:left-[2px] after:top-2.5 after:bottom-[-12px] after:w-[1.5px] after:bg-slate-200 dark:after:bg-gray-700 last:after:hidden">
                                             <div class="flex flex-col gap-0.5 -mt-1">
                                                <span class="text-umsa-blue text-[7px] uppercase font-black tracking-widest">{{ act.time }}</span>
                                                <span class="text-[8px] font-bold text-slate-600 dark:text-gray-300 leading-tight uppercase line-clamp-2">{{ act.title || '...' }}</span>
                                             </div>
                                          </div>
                                          <p v-if="dia.events.length > 3" class="text-[6px] text-slate-400 font-bold uppercase mt-1 pl-3">+ {{ dia.events.length - 3 }} más</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- SECCIÓN CONTACTO Y FOOTER (PASO 6) -->
                        <div
                            ref="previewStep6Ref"
                            v-if="currentStep === 6"
                            class="bg-primary-dark dark:bg-gray-900 rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-800 animate-in fade-in duration-500 ring-4 ring-primary-dark/40 ring-offset-2 flex flex-col justify-end"
                        >
                             <div class="p-6 text-white text-[7px] font-sans">
                                <div class="grid grid-cols-3 gap-4 mb-6">
                                    <div>
                                        <h4 class="font-bold text-[8px] mb-3 border-b border-umsa-blue pb-1 inline-block">Dónde estamos</h4>
                                        <p class="text-gray-300 leading-relaxed">{{ formEvento.contacto_donde || 'Dirección no configurada...' }}</p>
                                    </div>
                                    <div>
                                        <h4 class="font-bold text-[8px] mb-3 border-b border-umsa-blue pb-1 inline-block">Contáctanos</h4>
                                        <p class="text-gray-300 leading-relaxed">Teléfono de referencia: {{ formEvento.contacto_telefono || 'No definido' }}</p>
                                        <p class="text-gray-300 leading-relaxed mt-1">Email: {{ formEvento.contacto_email || 'No definido' }}</p>
                                    </div>
                                    <div>
                                        <h4 class="font-bold text-[8px] mb-3 border-b border-umsa-blue pb-1 inline-block">Organización y Auspicio</h4>
                                        <div class="flex flex-wrap gap-x-2 gap-y-1">
                                            <template v-if="formEvento.auspicios.length > 0">
                                                <a v-for="(ausp, i) in formEvento.auspicios" :key="i" :href="ausp.link || '#'" target="_blank" class="font-bold text-gray-300 hover:text-white transition-colors">
                                                    {{ ausp.nombre }}
                                                </a>
                                            </template>
                                            <p v-else class="text-gray-500 italic">Sin auspicios...</p>
                                        </div>
                                    </div>
                                </div>
                                <div class="border-t border-gray-700 pt-3 text-center flex justify-between items-center text-[6px] text-gray-400">
                                    <p>© {{ formEvento.gestion || '2025' }} - Todos los derechos reservados - BattleBread</p>
                                    <p>Desarrollado por <span class="text-umsa-blue font-medium">BattleBread Academy</span></p>
                                </div>
                             </div>
                        </div>

                        <!-- SECCIÓN CERTIFICADOS (PASO 7) -->
                        <div
                            v-if="currentStep === 7"
                            class="bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-500 ring-4 ring-umsa-gold/40 ring-offset-2"
                        >
                             <div class="p-8">
                                <div class="flex flex-col items-center text-center mb-6">
                                    <div class="flex items-center gap-2 mb-1">
                                        <div class="h-1 w-4 bg-umsa-gold rounded-full"></div>
                                        <span class="text-[8px] font-black text-umsa-gold uppercase tracking-widest">
                                            Certificado para: {{ tipoCertificado === null ? 'Ninguno' : (tipoCertificado === 1 ? 'Logística' : tipoCertificado === 2 ? 'Expositor' : tipoCertificado === 3 ? 'Organizador' : 'Asistente') }}
                                        </span>
                                        <div class="h-1 w-4 bg-umsa-gold rounded-full"></div>
                                    </div>
                                    <h2 class="text-xl font-black text-primary-dark dark:text-white uppercase italic tracking-tighter">Diseño y Maquetación</h2>
                                </div>

                                <!-- MOCK DE CERTIFICADO -->
                                <div class="aspect-[1.414/1] w-full bg-white border-8 border-double border-umsa-gold/30 rounded-lg p-6 flex flex-col items-center justify-center relative overflow-hidden shadow-inner group/cert">
                                    <!-- Marca de agua mock -->
                                    <span class="material-symbols-outlined absolute text-[120px] text-slate-50 opacity-[0.05] rotate-12 transition-transform group-hover/cert:scale-110 duration-1000">workspace_premium</span>
                                    
                                    <div class="relative z-10 w-full flex flex-col items-center">
                                        <!-- Cabecera -->
                                        <h3 :class="!infoCertificado?.cabecera ? 'text-slate-300 italic' : 'text-primary-dark'" class="text-[12px] font-black uppercase mb-3 text-center leading-tight transition-colors">
                                            {{ infoCertificado?.cabecera || '[ CABECERA PENDIENTE ]' }}
                                        </h3>
                                        
                                        <!-- Separador -->
                                        <div class="w-12 h-[1px] bg-umsa-gold/50 mb-3"></div>
                                        
                                        <!-- Tenor -->
                                        <div class="min-h-[60px] flex items-center justify-center px-2 mb-6">
                                            <p v-if="infoCertificado?.tenor" class="text-[8px] text-slate-600 text-center leading-relaxed italic">
                                                {{ infoCertificado?.tenor }}
                                            </p>
                                            <div v-else class="flex flex-col items-center opacity-30 gap-1">
                                                <span class="material-symbols-outlined text-lg">edit_note</span>
                                                <p class="text-[7px] text-slate-400 text-center uppercase font-bold tracking-tighter">Esperando redacción del tenor...</p>
                                            </div>
                                        </div>
                                        
                                        <!-- Firmas Mock -->
                                        <div class="flex justify-between w-full mt-auto pt-4 border-t border-slate-100 border-dashed">
                                            <div class="flex flex-col items-center opacity-20">
                                                <div class="w-12 h-0.5 bg-slate-400 mb-1"></div>
                                                <span class="text-[5px] font-bold uppercase">Firma Coordinación</span>
                                            </div>
                                            <div class="flex flex-col items-center opacity-20">
                                                <div class="w-12 h-0.5 bg-slate-400 mb-1"></div>
                                                <span class="text-[5px] font-bold uppercase">Firma Ponente</span>
                                            </div>
                                        </div>
                                    </div>
                                    <h5 class="text-xs font-black text-primary-dark dark:text-white uppercase mb-2">Previsualizador de Alta Fidelidad</h5>
                                    <p class="text-[9px] text-slate-500 dark:text-gray-400 max-w-[240px] mx-auto mb-6 leading-relaxed">
                                        Visualiza el diploma maquetado en tiempo real con las variables dinámicas del estudiante y el fondo oficial.
                                    </p>
                                    <button 
                                        v-if="tipoCertificado !== null"
                                        @click.prevent="abrirVistaPreviaRapida"
                                        class="bg-primary-dark hover:bg-slate-800 text-white font-black px-6 py-3 rounded-xl text-[10px] uppercase tracking-widest shadow-lg inline-flex items-center gap-2 transition-all cursor-pointer hover:-translate-y-0.5 active:translate-y-0 shadow-primary-dark/20"
                                    >
                                        <span class="material-symbols-outlined text-[16px]">pageview</span>
                                        Previsualizar Certificado
                                    </button>
                                    <p v-else class="text-[9px] text-red-500 font-bold uppercase tracking-wider bg-red-50 dark:bg-red-950/20 px-3 py-1.5 rounded-lg">
                                        Selecciona un rol para previsualizar
                                    </p>
                                </div>
                                
                                <div class="mt-6 bg-slate-50 dark:bg-gray-900/50 p-4 rounded-2xl border border-slate-100 dark:border-gray-800">
                                    <p class="text-[8px] font-bold text-slate-500 uppercase tracking-widest text-center leading-tight">
                                        <span class="text-umsa-gold">Nota:</span> Estás editando la versión para <span class="text-primary-dark dark:text-white underline">{{ tipoCertificado === null ? 'Ninguno' : (tipoCertificado === 1 ? 'Logística' : tipoCertificado === 2 ? 'Expositor' : tipoCertificado === 3 ? 'Organizador' : 'Asistente') }}</span>. Los cambios se guardan por separado para cada rol.
                                    </p>
                                </div>
                             </div>
                        </div>
                    </div>
                    </Transition>
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

    <!-- Modal de Previsualización Rápida en Gestión de Eventos -->
    <div v-if="showQuickPreviewModal" class="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-200">
        <div class="bg-white dark:bg-gray-900 rounded-[2.5rem] w-full max-w-[1080px] p-8 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-100 dark:border-gray-800 animate-in zoom-in-95 duration-300">
            <div class="flex justify-between items-center mb-6 shrink-0">
                <div>
                    <h3 class="text-xl font-black text-primary-dark dark:text-white uppercase italic tracking-tighter flex items-center gap-2">
                      <span class="material-symbols-outlined text-umsa-gold text-2xl">workspace_premium</span>
                      Previsualización de Alta Fidelidad
                    </h3>
                    <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Simulación real del certificado generado en PDF</p>
                </div>
                <div class="flex items-center gap-3">
                    <!-- Zoom Controls -->
                    <button @click="quickPreviewZoom = Math.max(0.5, quickPreviewZoom - 0.1)" class="w-8 h-8 rounded-full bg-slate-50 dark:bg-gray-800 hover:bg-slate-100 text-slate-500 flex items-center justify-center transition-colors">
                        <span class="material-symbols-outlined text-sm">zoom_out</span>
                    </button>
                    <div class="text-[10px] font-black font-mono text-slate-600 dark:text-gray-300 w-12 text-center">
                        {{ Math.round(quickPreviewZoom * 100) }}%
                    </div>
                    <button @click="quickPreviewZoom = Math.min(2.0, quickPreviewZoom + 0.1)" class="w-8 h-8 rounded-full bg-slate-50 dark:bg-gray-800 hover:bg-slate-100 text-slate-500 flex items-center justify-center transition-colors">
                        <span class="material-symbols-outlined text-sm">zoom_in</span>
                    </button>
                    
                    <button @click="showQuickPreviewModal = false" class="w-10 h-10 rounded-full bg-slate-50 dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-400 hover:text-red-500 flex items-center justify-center transition-colors">
                        <span class="material-symbols-outlined">close</span>
                    </button>
                </div>
            </div>
            
            <!-- Preview Scrollable Viewport Wrapper with Mouse Grab Panning -->
            <div ref="quickPreviewViewportRef" 
                 @mousedown="onMouseDownQuickPreview" 
                 @mousemove="onMouseMoveQuickPreview" 
                 @mouseup="onMouseUpQuickPreview" 
                 @mouseleave="onMouseLeaveQuickPreview" 
                 class="flex-1 overflow-auto flex items-center justify-center p-12 bg-slate-100 dark:bg-gray-950 rounded-3xl border border-slate-200 dark:border-gray-800 relative select-none cursor-grab active:cursor-grabbing animate-in fade-in duration-300">
                
                <!-- Sizing Layout Box for Zoom -->
                <div class="relative transition-all duration-200 flex items-center justify-center shrink-0" 
                     :style="{ 
                        width: `${960 * quickPreviewZoom}px`, 
                        height: `${678 * quickPreviewZoom}px` 
                     }">
                     
                    <!-- Certificado Previsualizado via Componente Universal -->
                    <CertificadoRender 
                        :elementos="quickPreviewElements"
                        :fondoUrl="infoCertificado?.fondo_url"
                        :zoom="quickPreviewZoom"
                    />
                </div>
            </div>
            
            <div class="mt-6 flex justify-end shrink-0">
                <button @click="showQuickPreviewModal = false" class="px-6 py-3 bg-primary-dark hover:bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg active:scale-95 cursor-pointer">
                    Cerrar Vista Previa
                </button>
            </div>
        </div>
    </div>
    </div>
</template>
<style scoped>
/* === ANIMACIONES DIRECTIONALES DE LA PREVISUALIZACIÓN === */
.preview-slide-forward-enter-active,
.preview-slide-forward-leave-active,
.preview-slide-backward-enter-active,
.preview-slide-backward-leave-active {
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
.preview-slide-forward-enter-from { transform: translateX(60px); opacity: 0; filter: blur(3px); }
.preview-slide-forward-leave-to   { transform: translateX(-60px); opacity: 0; filter: blur(3px); }
.preview-slide-backward-enter-from { transform: translateX(-60px); opacity: 0; filter: blur(3px); }
.preview-slide-backward-leave-to   { transform: translateX(60px); opacity: 0; filter: blur(3px); }
</style>
