<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import api from '@/services/api';
import Swal from 'sweetalert2';
import { useEventoStore } from '@/stores/eventoStore';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();
const eventoStore = useEventoStore();
const eventosPlanoDB = ref<any[]>([]);
const ponentesDB = ref<any[]>([]);
const gradosAcademicosDB = ref<any[]>([]);
const showRegistroRapido = ref(false);
const filtroPonente = ref('');

const ponentesFiltrados = computed(() => {
  if (!filtroPonente.value) return ponentesDB.value;
  const f = filtroPonente.value.toLowerCase();
  return ponentesDB.value.filter(p => p.displayName.toLowerCase().includes(f));
});

const fetchEventos = async () => {
  try {
    const res = await api.get('/admin/eventos/lista?limit=1000');
    eventosPlanoDB.value = res.data.data || [];
  } catch (error) {
    console.error("Error fetching eventos:", error);
  }
};

const fetchPonentes = async () => {
  try {
    // Traer tanto a Ponentes (rol 5) como Coordinadores (rol 2)
    const [resP, resC] = await Promise.all([
      api.get('/usuarios?rol=Ponente&limit=100'),
      api.get('/usuarios?rol=Coordinador&limit=100')
    ]);
    const arrP = (Array.isArray(resP.data?.data) ? resP.data.data : (Array.isArray(resP.data) ? resP.data : [])).map((u:any) => {
        const persona = u.persona || {};
        const gaObj = u.afiliaciones?.[0]?.gradoAcademico || {};
        const prefijo = gaObj.abreviacion ? `${gaObj.abreviacion}. ` : '';
        const nombreCompleto = `${prefijo}${persona.nombres || ''} ${persona.primer_apellido || ''}`.trim();
        return { ...u, roleLabel: 'Ponente', displayName: nombreCompleto || u.email || 'Sin Nombre' };
    });
    const arrC = (Array.isArray(resC.data?.data) ? resC.data.data : (Array.isArray(resC.data) ? resC.data : [])).map((u:any) => {
        const persona = u.persona || {};
        const gaObj = u.afiliaciones?.[0]?.gradoAcademico || {};
        const prefijo = gaObj.abreviacion ? `${gaObj.abreviacion}. ` : '';
        const nombreCompleto = `${prefijo}${persona.nombres || ''} ${persona.primer_apellido || ''}`.trim();
        return { ...u, roleLabel: 'Coordinador', displayName: nombreCompleto || u.email || 'Sin Nombre' };
    });
    
    ponentesDB.value = [...arrP, ...arrC];
  } catch (error) {
    console.error("Error fetching ponentes:", error);
  }
};

const fetchGrados = async () => {
  try {
    const res = await api.get('/grados-academicos');
    gradosAcademicosDB.value = res.data.data || res.data || [];
  } catch (error) {
    console.error("Error fetching grados:", error);
  }
};

onMounted(() => {
  fetchEventos();
  fetchPonentes();
  fetchGrados();
});

const getEstadoLabel = (fase: number) => {
  switch (fase) {
    case 1: return 'Planificación';
    case 2: return 'Inscripciones';
    case 3: return 'En Ejecución';
    case 4: return 'Finalizado';
    case 5: return 'Archivado';
    default: return 'Desconocido';
  }
};

const isCreating = ref(false);
const isEditing = ref(false);
const editId = ref<number | null>(null);
const showNewEventoForm = ref(false);
const hideUploads = ref(false);

const nuevoEvento = ref({
  nombre: '',
  descripcion: '',
  gestion: new Date().getFullYear().toString(),
  fecha_inicio: '',
  fecha_fin: '',
  ubicacion: '',
  direccion: '',
  fase: 1, // 1 = Planificación
  fondo_img: null as any,
  logo_img: null as any, // Campo para el logo del evento
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

const agregarDia = () => {
    nuevoEvento.value.cronograma_lista.push({
        day: nuevoEvento.value.cronograma_lista.length + 1,
        name: `Día ${nuevoEvento.value.cronograma_lista.length + 1}`,
        date: '', // Nueva propiedad de fecha
        events: [{ time: '08:00', title: '' }]
    });
};

const eliminarDia = (idx: any) => {
    nuevoEvento.value.cronograma_lista.splice(idx, 1);
    // Reordenar días
    nuevoEvento.value.cronograma_lista.forEach((d: any, i: number) => d.day = i + 1);
};

const agregarActividad = (dayIdx: any) => {
    nuevoEvento.value.cronograma_lista[dayIdx].events.push({ time: '09:00', title: '' });
};

const eliminarActividad = (dayIdx: any, actIdx: any) => {
    nuevoEvento.value.cronograma_lista[dayIdx].events.splice(actIdx, 1);
};

const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    // Ajuste de zona horaria para inputs de fecha
    const d = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
    return `${d.getDate() + 1} de ${months[d.getMonth()]}`;
};

const nuevoPonenteRegistro = ref({
  nombres: '',
  primer_apellido: '',
  email: '',
  profesion: '',
  grado_academico: '',
  id_rol: 5
});

const registrarNuevoPonente = async () => {
    try {
        // Generar una contraseña temporal
        const payload = {
            ...nuevoPonenteRegistro.value,
            password: 'Temporal123*' // Password por defecto
        };
        await api.post('/usuarios/ponente', payload);
        Swal.fire('¡Éxito!', 'Personal registrado correctamente', 'success');
        showRegistroRapido.value = false;
        // Limpiar
        nuevoPonenteRegistro.value = { nombres: '', primer_apellido: '', email: '', profesion: '', grado_academico: '', id_rol: 5 };
        // Recargar lista
        await fetchPonentes();
    } catch (err: any) {
        Swal.fire('Error', err.response?.data?.message || 'No se pudo registrar', 'error');
    }
};

const currentStep = ref(1);
const totalSteps = 6;

const nextStep = () => { if (currentStep.value < totalSteps) currentStep.value++; };
const prevStep = () => { if (currentStep.value > 1) currentStep.value--; };

const logoPreview = ref<string | null>(null);
const fondoPreview = ref<string | null>(null);
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
        if (!['image/png', 'image/jpeg', 'image/svg+xml'].includes(file.type)) {
            Swal.fire('Formato no válido', 'Usa PNG (recomendado) o JPG.', 'error');
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
                nuevoEvento.value.logo_img = file;
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
                nuevoEvento.value.fondo_img = file;
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }
};

const eventosAgrupados = computed(() => {
  const map = new Map();
  eventosPlanoDB.value.forEach(ev => {
    if (!map.has(ev.nombre)) {
      map.set(ev.nombre, {
        nombre: ev.nombre,
        descripcion: ev.sobre_evento_1 || ev.descripcion || '',
        imagen_fondo: ev.imagen_fondo || '',
        logo_img: ev.logo || '',
        faseGeneral: ev.fase,
        gestiones: []
      });
    }
    const group = map.get(ev.nombre);
    // Un grupo se considera "Activo" si tiene alguna gestión en fase 2 o 3
    if ([2, 3].includes(ev.fase)) group.faseGeneral = ev.fase;
    
    group.gestiones.push({
      ...ev,
      estadoStr: getEstadoLabel(ev.fase)
    });
  });

  // Ordenar: Primero los activos, luego por cantidad de gestiones, y los inhabilitados al final
  return Array.from(map.values()).sort((a: any, b: any) => {
    // Si uno es inhabilitado y el otro no
    const aInhabilitado = a.gestiones.every((g: any) => g.estado === -1);
    const bInhabilitado = b.gestiones.every((g: any) => g.estado === -1);
    
    if (aInhabilitado && !bInhabilitado) return 1;
    if (!aInhabilitado && bInhabilitado) return -1;
    
    return b.gestiones.length - a.gestiones.length;
  });
});

const inhabilitarEvento = async (gestion: any) => {
    const { value: motivo } = await Swal.fire({
        title: '¿Inhabilitar esta Gestión?',
        text: "Explique el motivo de la inhabilitación del evento:",
        input: 'textarea',
        inputPlaceholder: 'Escriba el motivo aquí...',
        inputAttributes: {
          'aria-label': 'Motivo de inhabilitación'
        },
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#94a3b8',
        confirmButtonText: 'Sí, Inhabilitar',
        cancelButtonText: 'Cancelar',
        inputValidator: (value) => {
          if (!value) {
            return '¡Debes escribir un motivo!'
          }
        }
    });

    if (motivo) {
        try {
            // Mandamos -1 como estado de inhabilitado y el motivo
            await api.patch(`/admin/eventos/${gestion.id}`, { 
                estado: -1, 
                descripcion: `${gestion.descripcion}\n[INHABILITACION_MOTIVO]:${motivo}\n[FECHA_INHABILITACION]:${new Date().toLocaleString()}`
            });
            
            Swal.fire({
                icon: 'success',
                title: 'Evento Inhabilitado',
                text: 'La gestión ya no será visible para ponentes ni estudiantes.',
                confirmButtonColor: '#10b981'
            });
            
            await fetchEventos();
            await eventoStore.fetchEventosInfo();
        } catch (err: any) {
            Swal.fire('Error', 'No se pudo inhabilitar el evento', 'error');
        }
    }
};

const handleCreateEvento = async () => {
    try {
      const formData = new FormData();
      formData.append('nombre', nuevoEvento.value.nombre);
      formData.append('gestion', nuevoEvento.value.gestion);
      formData.append('version', nuevoEvento.value.version || '');
      if (nuevoEvento.value.fecha_inicio) formData.append('fecha_inicio', nuevoEvento.value.fecha_inicio);
      if (nuevoEvento.value.fecha_fin) formData.append('fecha_fin', nuevoEvento.value.fecha_fin);
      if (nuevoEvento.value.ubicacion) formData.append('ubicacion', nuevoEvento.value.ubicacion);
      if (nuevoEvento.value.direccion) formData.append('direccion', nuevoEvento.value.direccion);
      if (nuevoEvento.value.google_maps_link) formData.append('google_maps_link', nuevoEvento.value.google_maps_link);
      if (nuevoEvento.value.sobre_evento_1) formData.append('sobre_evento_1', nuevoEvento.value.sobre_evento_1);
      if (nuevoEvento.value.sobre_evento_2) formData.append('sobre_evento_2', nuevoEvento.value.sobre_evento_2);
      if (nuevoEvento.value.frase_destacada) formData.append('frase_destacada', nuevoEvento.value.frase_destacada);
      
      formData.append('sigla', nuevoEvento.value.sigla || '');
      formData.append('color_principal', nuevoEvento.value.color_principal || '#0070b4');
      formData.append('institucion_badge', nuevoEvento.value.institucion_badge || 'Evento Oficial OEA/TYAN');
      formData.append('link_facebook', nuevoEvento.value.link_facebook || '');
      formData.append('link_web', nuevoEvento.value.link_web || '');

      let finalDescripcion = nuevoEvento.value.descripcion;
      finalDescripcion += `\n[MOSTRAR_CORREOS]:${nuevoEvento.value.mostrar_correos ? 'true' : 'false'}`;
      
      const ponentesStr = nuevoEvento.value.ponentes_seleccionados.map(id => {
         const found = ponentesDB.value.find((p:any) => p.id === id);
         return found ? found.displayName : '';
      }).filter(s => s).join(', ');
      
      if (ponentesStr) {
         finalDescripcion += `\n[PONENTES_METADATA]:${ponentesStr}`;
      }
      formData.append('descripcion', finalDescripcion);

      if (nuevoEvento.value.cronograma_lista && nuevoEvento.value.cronograma_lista.length > 0) {
          // Filtrar actividades vacías antes de guardar
          const cleaned = nuevoEvento.value.cronograma_lista.map(d => ({
              ...d,
              events: d.events.filter((e:any) => e.title?.trim())
          })).filter(d => d.events.length > 0);
          
          formData.append('cronograma', JSON.stringify(cleaned));
      } else if (nuevoEvento.value.cronograma && nuevoEvento.value.cronograma.trim()) {
         try {
             // Fallback for raw text if still present
             let parsed = null;
             if (nuevoEvento.value.cronograma.trim().startsWith('[')) {
                 parsed = JSON.parse(nuevoEvento.value.cronograma);
             }
             if (parsed) formData.append('cronograma', JSON.stringify(parsed));
         } catch(e) { /* ignore */ }
      }

      if (nuevoEvento.value.fase !== undefined && nuevoEvento.value.fase !== null) {
          formData.append('fase', nuevoEvento.value.fase.toString());
      }

      if (nuevoEvento.value.fondo_img instanceof File) {
          formData.append('imagen_fondo', nuevoEvento.value.fondo_img);
      }
      if (nuevoEvento.value.logo_img instanceof File) {
          formData.append('imagen_portada', nuevoEvento.value.logo_img);
      }
      
      if (isEditing.value && editId.value) {
        await api.put(`/eventos/${editId.value}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        const res = await api.post('/eventos', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        // Sincronización con el selector global
        if (res.data) {
          await eventoStore.fetchEventosInfo();
          eventoStore.setEventoPorNombre(res.data.nombre);
          eventoStore.setVersion(res.data.id);
        }
      }
      
      Swal.fire({
         icon: 'success',
         title: 'Éxito',
         text: 'Evento estructurado correctamente',
         confirmButtonColor: '#10b981'
      });
      
      isCreating.value = false;
      isEditing.value = false;
      editId.value = null;
      nuevoEvento.value = {
         nombre: '',
         descripcion: '',
         gestion: new Date().getFullYear().toString(),
         fecha_inicio: '',
         fecha_fin: '',
         ubicacion: '',
         direccion: '',
         fase: 1,
         version: '',
         fondo_img: null,
         logo_img: null, // Incluimos logo_img para evitar error de TS
         google_maps_link: '',
         sobre_evento_1: '',
         sobre_evento_2: '',
         frase_destacada: '',
         sigla: '',
         color_principal: '#0070b4',
         institucion_badge: 'Evento Oficial OEA/TYAN',
         link_facebook: '',
         link_web: '',
         ponentes_seleccionados: [],
         cronograma: '',
         cronograma_lista: [],
         mostrar_correos: true
      };
      logoPreview.value = null;
      fondoPreview.value = null;
      await fetchEventos();
      await eventoStore.fetchEventosInfo(); // REFRESCAR SELECTOR GLOBAL
    } catch(err: any) {
      console.error(err);
      const errorMsg = err.response?.data?.message || 'No se pudo guardar el evento por un problema técnico.';
      Swal.fire({
          icon: 'error',
          title: 'ERROR DE GUARDADO',
          text: Array.isArray(errorMsg) ? errorMsg.join(', ') : errorMsg,
          confirmButtonColor: '#ef4444'
      });
    }
};

const editarGestion = (gestion: any) => {
    // Restringir edición si está Finalizado (0) - Excepto para el Super Usuario
    if (!authStore.esSuperUsuario && (gestion.estado === 0 || gestion.fase === 4)) {
        Swal.fire({
            icon: 'info',
            title: 'Modo de Solo Lectura',
            text: 'Este evento está finalizado y no permite modificaciones.',
            confirmButtonColor: '#0070b4'
        });
        return;
    }

    isEditing.value = true;
    editId.value = gestion.id;
    // Extraer ponentes de la descripcion oculta
    const rawDesc = gestion.descripcion || '';
    const metadataMarker = '\n[PONENTES_METADATA]:';
    let baseDesc = rawDesc;
    let ponentesSaved = '';
    
    if (rawDesc.includes(metadataMarker)) {
        const parts = rawDesc.split(metadataMarker);
        baseDesc = parts[0];
        ponentesSaved = parts[1];
    }
    
    let mostrarCorreos = true;
    if (baseDesc.includes('\n[MOSTRAR_CORREOS]:')) {
        const mcParts = baseDesc.split('\n[MOSTRAR_CORREOS]:');
        baseDesc = mcParts[0];
        mostrarCorreos = mcParts[1]?.trim() === 'true';
    }
    
    nuevoEvento.value = {
        nombre: gestion.nombre,
        descripcion: baseDesc,
        gestion: gestion.gestion?.toString() || new Date().getFullYear().toString(),
        version: gestion.version || '',
        fecha_inicio: gestion.fecha_inicio ? gestion.fecha_inicio.split('T')[0] : '',
        fecha_fin: gestion.fecha_fin ? gestion.fecha_fin.split('T')[0] : '',
        ubicacion: gestion.ubicacion || '',
        direccion: gestion.direccion || '',
        google_maps_link: gestion.google_maps_link || '',
        sobre_evento_1: gestion.sobre_evento_1 || '',
        sobre_evento_2: gestion.sobre_evento_2 || '',
        frase_destacada: gestion.frase_destacada || '',
        sigla: gestion.sigla || '',
        color_principal: gestion.color_principal || '#0070b4',
        institucion_badge: gestion.institucion_badge || 'Evento Oficial OEA/TYAN',
        link_facebook: gestion.link_facebook || '',
        link_web: gestion.link_web || '',
        fase: gestion.fase,
        ponentes_seleccionados: [],
        fondo_img: null,
        logo_img: null,
        cronograma: '',
        cronograma_lista: [],
        mostrar_correos: mostrarCorreos
    };
    
    // Reverse cronograma serialization to structured list
    if (gestion.cronograma) {
       try {
           const arr = typeof gestion.cronograma === 'string' ? JSON.parse(gestion.cronograma) : gestion.cronograma;
           if (Array.isArray(arr)) {
              nuevoEvento.value.cronograma_lista = JSON.parse(JSON.stringify(arr));
           }
       } catch(e) { /* ignore */ }
    }
    
    if (ponentesSaved) {
        const nombresArr = ponentesSaved.split(',').map((s: string) => s.trim());
        const seleccionados = ponentesDB.value.filter((p: any) => {
            return nombresArr.includes(p.displayName);
        }).map((p: any) => p.id);
        nuevoEvento.value.ponentes_seleccionados = seleccionados;
    }
    
    logoPreview.value = gestion.logo;
    fondoPreview.value = gestion.imagen_fondo;
    
    isCreating.value = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
};
</script>

<template>
  <div class="animate-in fade-in duration-500 max-w-7xl mx-auto space-y-8">
    <div class="flex items-center justify-between border-b border-slate-200 dark:border-gray-800 mb-8 pb-6">
      <div>
        <h2 class="text-3xl font-black text-primary-dark dark:text-white uppercase italic">Catálogo Histórico de Eventos</h2>
        <p class="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mt-1">Listado detallado de todas las aperturas y gestiones pasadas.</p>
      </div>
      <button v-if="!isCreating" @click="isCreating = true; isEditing = false; editId = null" class="bg-primary-dark dark:bg-blue-600 hover:bg-blue-900 dark:hover:bg-blue-700 text-white font-black px-6 py-3.5 rounded-xl text-[11px] uppercase tracking-widest shadow-lg hover:-translate-y-0.5 transition-all flex items-center gap-2">
        <span class="material-symbols-outlined text-[18px]">add_business</span> Crear Nuevo Evento
      </button>
      <button v-else @click="isCreating = false; isEditing = false; editId = null" class="bg-slate-200 dark:bg-gray-800 hover:bg-slate-300 dark:hover:bg-gray-700 text-slate-600 dark:text-gray-300 font-black px-6 py-3.5 rounded-xl text-[11px] uppercase tracking-widest shadow-sm hover:-translate-y-0.5 transition-all flex items-center gap-2">
        <span class="material-symbols-outlined text-[18px]">close</span> Cancelar
      </button>
    </div>

    <!-- Reutilizamos el Wizard del componente padre por si se necesita crear desde aquí -->
    <div v-if="isCreating || isEditing" class="bg-white dark:bg-gray-900 rounded-[2rem] shadow-xl border border-blue-100 dark:border-gray-800 animate-in slide-in-from-top-4 duration-500 overflow-hidden relative">
        <div class="bg-gradient-to-r from-umsa-blue to-emerald-500 p-8 pb-10">
            <h3 class="text-2xl font-black text-white uppercase italic flex items-center gap-3">
                <span class="material-symbols-outlined text-3xl">{{ isEditing ? 'edit_calendar' : 'add_circle' }}</span>
                {{ isEditing ? 'Editar Gestión de Evento' : 'Crear Nueva Gestión de Evento' }}
            </h3>
        </div>
        
        <!-- Formulario (Resumido para Lista) -->
        <form @submit.prevent="handleCreateEvento" class="p-8 md:p-12 space-y-8">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Nombre del Evento</label>
                    <input v-model="nuevoEvento.nombre" type="text" required class="w-full bg-slate-50 dark:bg-gray-800 border-2 border-slate-100 dark:border-gray-700 rounded-xl px-5 py-3 text-sm font-bold" />
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Sigla</label>
                        <input v-model="nuevoEvento.sigla" type="text" class="w-full bg-slate-50 dark:bg-gray-800 border-2 border-slate-100 dark:border-gray-700 rounded-xl px-5 py-3 text-sm font-black uppercase" />
                    </div>
                    <div>
                        <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Gestión</label>
                        <input v-model="nuevoEvento.gestion" type="text" class="w-full bg-slate-50 dark:bg-gray-800 border-2 border-slate-100 dark:border-gray-700 rounded-xl px-5 py-3 text-sm font-bold" />
                    </div>
                </div>
            </div>
            
            <div class="flex justify-end pt-4">
                <button type="submit" class="bg-emerald-600 text-white px-10 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg">
                    {{ isEditing ? 'Guardar Cambios' : 'Crear Evento' }}
                </button>
            </div>
        </form>
    </div>

    <!-- Lista de eventos agrupados -->
    <div v-show="!isCreating && !isEditing" class="grid grid-cols-1 gap-8 mt-4">
      <div v-for="(evento, index) in eventosAgrupados" :key="index" class="bg-white dark:bg-gray-900 rounded-[2rem] shadow-sm border border-slate-100 dark:border-gray-800 transition-all overflow-hidden relative group/evento">
        
        <div class="h-24 w-full bg-gradient-to-r from-slate-100 to-slate-200 dark:from-gray-800 dark:to-gray-900"></div>

        <div class="p-8 -mt-12 relative z-10">
            <div class="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-6">
              <div class="flex-1">
                <div class="flex items-center gap-5 mb-4">
                  <div class="w-20 h-20 rounded-2xl bg-white dark:bg-gray-800 shadow-xl overflow-hidden flex items-center justify-center border-4 border-white dark:border-gray-900 shrink-0">
                    <img v-if="evento.logo_img" :src="evento.logo_img" class="w-full h-full object-contain p-2">
                    <span v-else class="material-symbols-outlined text-3xl text-slate-200">image</span>
                  </div>
                  <div>
                    <h3 class="text-2xl font-black text-primary-dark dark:text-white uppercase tracking-tighter italic">{{ evento.nombre }}</h3>
                    <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic">{{ evento.gestiones.length }} Gestiones registradas</p>
                  </div>
                </div>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              <div v-for="gestion in evento.gestiones" :key="gestion.id" 
                class="p-5 rounded-2xl border border-slate-200 dark:border-gray-700 hover:border-umsa-blue bg-white dark:bg-gray-900 shadow-sm transition-all group cursor-pointer flex flex-col justify-between min-h-[120px]">
                
                <div class="flex flex-col">
                  <span class="text-xl font-black text-primary-dark dark:text-white">{{ gestion.gestion }}</span>
                  <span class="text-[8px] font-black text-umsa-gold uppercase italic tracking-widest">{{ gestion.version || 'Sin versión' }}</span>
                </div>

                <div class="flex justify-between items-center mt-4">
                  <span class="text-[9px] uppercase font-black px-2 py-1 rounded-md" :class="gestion.estado === -1 ? 'bg-rose-500/10 text-rose-600' : (gestion.estadoStr === 'Activo' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-100 text-slate-500')">
                    {{ gestion.estadoStr }}
                  </span>
                  <div class="flex gap-1">
                    <button @click.stop="editarGestion(gestion)" class="w-7 h-7 rounded-lg bg-slate-50 dark:bg-gray-800 text-slate-400 hover:text-umsa-blue flex items-center justify-center">
                        <span class="material-symbols-outlined text-sm">edit</span>
                    </button>
                    <button v-if="gestion.estado !== -1" @click.stop="inhabilitarEvento(gestion)" class="w-7 h-7 rounded-lg bg-slate-50 dark:bg-gray-800 text-slate-400 hover:text-rose-500 flex items-center justify-center">
                        <span class="material-symbols-outlined text-sm">block</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
        </div>
      </div>
    </div>
  </div>
</template>
