<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import api from '@/services/api';
import Swal from 'sweetalert2';
import { useEventoStore } from '@/stores/eventoStore';

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
    const res = await api.get('/eventos/admin/lista');
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

const getEstadoLabel = (estado: number) => {
  switch (estado) {
    case 0: return 'Concluido';
    case 1: return 'Activo';
    case 2: return 'Planificación';
    case 3: return 'Borrador';
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
  estado: 2, // 2 = Planificación
  fondo_img: null as any,
  logo_img: null as any, // Campo para el logo del evento
  google_maps_link: '',
  sobre_evento_1: '',
  sobre_evento_2: '',
  frase_destacada: '',
  ponentes_seleccionados: [] as number[],
  cronograma: '',
  cronograma_lista: [] as any[],
  version: ''
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

const nuevoPonenteRegistro = ref({
  nombres: '',
  primer_apellido: '',
  email: '',
  profesion: '',
  id_grado_academico: null as number | null,
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
        nuevoPonenteRegistro.value = { nombres: '', primer_apellido: '', email: '', profesion: '', id_grado_academico: null, id_rol: 5 };
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
        estadoGeneral: getEstadoLabel(ev.estado) === 'Activo' ? 'Activo' : getEstadoLabel(ev.estado),
        gestiones: []
      });
    }
    const group = map.get(ev.nombre);
    if (ev.estado === 1) group.estadoGeneral = 'Activo';
    
    group.gestiones.push({
      ...ev,
      estadoStr: ev.estado === -1 ? 'Inhabilitado' : getEstadoLabel(ev.estado)
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
            await api.patch(`/eventos/${gestion.id}`, { 
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

      let finalDescripcion = nuevoEvento.value.descripcion;
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

      if (nuevoEvento.value.estado !== undefined && nuevoEvento.value.estado !== null) {
          formData.append('estado', nuevoEvento.value.estado.toString());
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
         estado: 2,
         version: '',
         fondo_img: null,
         logo_img: null, // Incluimos logo_img para evitar error de TS
         google_maps_link: '',
         sobre_evento_1: '',
         sobre_evento_2: '',
         frase_destacada: '',
         ponentes_seleccionados: [],
         cronograma: '',
         cronograma_lista: []
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
        estado: gestion.estado,
        fondo_img: null,
        logo_img: null,
        ponentes_seleccionados: [],
        cronograma: '',
        cronograma_lista: []
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
        <h2 class="text-3xl font-black text-primary-dark dark:text-white uppercase italic">Gestión de Eventos</h2>
        <p class="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mt-1">Configuración unificada: Evento y sus Gestiones</p>
      </div>
      <button v-if="!isCreating" @click="isCreating = true; isEditing = false; editId = null" class="bg-primary-dark dark:bg-blue-600 hover:bg-blue-900 dark:hover:bg-blue-700 text-white font-black px-6 py-3.5 rounded-xl text-[11px] uppercase tracking-widest shadow-lg hover:-translate-y-0.5 transition-all flex items-center gap-2">
        <span class="material-symbols-outlined text-[18px]">add_business</span> Crear Nuevo Evento
      </button>
      <button v-else @click="isCreating = false; isEditing = false; editId = null" class="bg-slate-200 dark:bg-gray-800 hover:bg-slate-300 dark:hover:bg-gray-700 text-slate-600 dark:text-gray-300 font-black px-6 py-3.5 rounded-xl text-[11px] uppercase tracking-widest shadow-sm hover:-translate-y-0.5 transition-all flex items-center gap-2">
        <span class="material-symbols-outlined text-[18px]">close</span> Cancelar
      </button>
    </div>

    <!-- Formulario de Creación / Edición -->
    <div v-if="isCreating || isEditing" class="bg-white dark:bg-gray-900 rounded-[2rem] shadow-xl shadow-umsa-blue/10 dark:shadow-black/50 border border-blue-100 dark:border-gray-800 animate-in slide-in-from-top-4 duration-500 overflow-hidden relative">
        <div class="bg-gradient-to-r from-umsa-blue to-emerald-500 p-8 pb-10 relative overflow-hidden">
            <span class="material-symbols-outlined absolute -right-4 -top-8 text-[120px] text-white/10 rotate-12">design_services</span>
            <h3 class="text-2xl md:text-3xl font-black text-white uppercase italic tracking-tighter drop-shadow-md relative z-10 flex items-center gap-3">
                <span class="material-symbols-outlined text-3xl">{{ isEditing ? 'edit_calendar' : 'add_circle' }}</span>
                {{ isEditing ? 'Editar Gestión de Evento' : 'Crear Nueva Gestión de Evento' }}
            </h3>
        </div>
        
        <!-- BARRA DE NAVEGACIÓN DEL WIZARD (PASOS) -->
        <div class="bg-slate-50 dark:bg-gray-800/50 border-b border-slate-100 dark:border-gray-800 px-8 py-4 flex items-center justify-between overflow-x-auto thin-scrollbar">
            <div v-for="step in totalSteps" :key="step" class="flex items-center gap-2 shrink-0">
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
        
        <form @submit.prevent="handleCreateEvento" class="bg-white dark:bg-gray-900 p-8 md:p-12 min-h-[600px] flex flex-col relative z-20">
            
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
                            <input v-model="nuevoEvento.nombre" type="text" required placeholder="Ej: Congreso Internacional de Ciencias" class="w-full bg-slate-50 dark:bg-gray-800 border-2 border-slate-100 dark:border-gray-700 focus:border-umsa-blue outline-none rounded-2xl px-5 py-4 text-sm font-bold shadow-sm" />
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Versión / Slogan</label>
                                <input v-model="nuevoEvento.version" type="text" placeholder="Ej: 4ta Edición" class="w-full bg-slate-50 dark:bg-gray-800 border-2 border-slate-100 dark:border-gray-700 focus:border-umsa-blue rounded-2xl px-5 py-3 text-sm font-bold" />
                            </div>
                            <div>
                                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Gestión / Año</label>
                                <input v-model="nuevoEvento.gestion" type="text" placeholder="2025" class="w-full bg-slate-50 dark:bg-gray-800 border-2 border-slate-100 dark:border-gray-700 focus:border-umsa-blue rounded-2xl px-5 py-3 text-sm font-bold" />
                            </div>
                        </div>
                        <div class="grid grid-cols-2 gap-6 pt-2">
                            <!-- Logo -->
                            <div class="space-y-3">
                                <div class="flex items-center justify-between">
                                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Logo del Evento</label>
                                    <span v-if="logoQuality.status" :class="logoQuality.status === 'hd' ? 'text-emerald-500 bg-emerald-50' : (logoQuality.status === 'low' ? 'text-red-500 bg-red-50' : 'text-amber-500 bg-amber-50')" class="text-[8px] font-black px-2 py-0.5 rounded-full border border-current">
                                        {{ logoQuality.status === 'hd' ? 'HD' : (logoQuality.status === 'low' ? 'BAJA CALIDAD' : 'OK') }}
                                    </span>
                                </div>
                                <div class="relative group h-32 bg-slate-50 dark:bg-gray-800 border-2 border-dashed border-slate-200 dark:border-gray-700 rounded-2xl flex flex-col items-center justify-center p-4 overflow-hidden transition-all group-hover:border-blue-400">
                                    <img v-if="logoPreview" :src="logoPreview" class="w-full h-full object-contain">
                                    <template v-else>
                                        <span class="material-symbols-outlined text-slate-300 text-3xl mb-1">image</span>
                                        <span class="text-[8px] text-slate-400 font-bold uppercase">Subir Logo</span>
                                    </template>
                                    <input type="file" @change="onLogoChange" class="absolute inset-0 opacity-0 cursor-pointer">
                                </div>
                            </div>
                            <!-- Fondo -->
                            <div class="space-y-3">
                                <div class="flex items-center justify-between">
                                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Imagen de Banner (Hero)</label>
                                    <span v-if="fondoQuality.status" :class="fondoQuality.status === 'hd' ? 'text-emerald-500 bg-emerald-50' : (fondoQuality.status === 'low' ? 'text-red-500 bg-red-50' : 'text-amber-500 bg-amber-50')" class="text-[8px] font-black px-2 py-0.5 rounded-full border border-current">
                                        {{ fondoQuality.status === 'hd' ? 'CALIDAD HD' : (fondoQuality.status === 'low' ? 'PÍXEL DETECTADO' : 'ACEPTABLE') }}
                                    </span>
                                </div>
                                <div class="relative group h-32 bg-slate-50 dark:bg-gray-800 border-2 border-dashed border-slate-200 dark:border-gray-700 rounded-2xl flex flex-col items-center justify-center p-4 overflow-hidden transition-all group-hover:border-blue-400">
                                    <img v-if="fondoPreview" :src="fondoPreview" class="w-full h-full object-cover">
                                    <template v-else>
                                        <span class="material-symbols-outlined text-slate-300 text-3xl mb-1">wallpaper</span>
                                        <span class="text-[8px] text-slate-400 font-bold uppercase">Subir Banner</span>
                                    </template>
                                    <input type="file" @change="onFondoChange" class="absolute inset-0 opacity-0 cursor-pointer">
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- PASO 2: NARRATIVA -->
                    <div v-if="currentStep === 2" class="space-y-6">
                        <div class="flex items-center gap-3 border-b border-slate-100 dark:border-gray-800 pb-4 mb-6">
                            <span class="material-symbols-outlined text-umsa-blue">subject</span>
                            <h4 class="text-sm font-black text-primary-dark dark:text-white uppercase italic">Paso 2: Historia y Frase Destacada</h4>
                        </div>
                        <div class="grid grid-cols-1 gap-6">
                            <div>
                                <label class="text-xs font-black text-umsa-blue uppercase tracking-wide block mb-2">Párrafo Principal</label>
                                <textarea v-model="nuevoEvento.sobre_evento_1" rows="4" class="w-full bg-slate-50 dark:bg-gray-800 border-2 border-slate-100 dark:border-gray-700 rounded-2xl px-5 py-4 text-sm font-medium"></textarea>
                            </div>
                            <div>
                                <label class="text-xs font-black text-umsa-blue uppercase tracking-wide block mb-2">Párrafo Secundario</label>
                                <textarea v-model="nuevoEvento.sobre_evento_2" rows="4" class="w-full bg-slate-50 dark:bg-gray-800 border-2 border-slate-100 dark:border-gray-700 rounded-2xl px-5 py-4 text-sm font-medium"></textarea>
                            </div>
                            <div class="bg-umsa-blue/5 p-6 rounded-[2rem] border-2 border-dashed border-umsa-blue/20">
                                <label class="text-xs font-black text-umsa-blue uppercase tracking-wide block mb-4">Cita Central (Impacto)</label>
                                <textarea v-model="nuevoEvento.frase_destacada" rows="3" class="w-full bg-white dark:bg-gray-900 border-2 border-umsa-blue/30 rounded-2xl px-5 py-4 text-lg font-black italic text-center shadow-inner resize-none"></textarea>
                            </div>
                        </div>
                    </div>

                    <!-- PASO 3: DIRECTORIO -->
                    <div v-if="currentStep === 3" class="space-y-6">
                        <div class="flex items-center justify-between border-b border-slate-100 dark:border-gray-800 pb-4 mb-6">
                            <div class="flex items-center gap-3">
                                <span class="material-symbols-outlined text-emerald-600">group</span>
                                <h4 class="text-sm font-black text-primary-dark dark:text-white uppercase italic">Paso 3: Ponentes y Directorio</h4>
                            </div>
                            <button @click.prevent="showRegistroRapido = true" class="text-[9px] font-black text-emerald-700 bg-emerald-100 px-4 py-2 rounded-xl">
                                + NUEVO PERSONAL
                            </button>
                        </div>
                        <div class="relative">
                            <input v-model="filtroPonente" type="text" placeholder="Buscar por nombre..." class="w-full bg-slate-50 dark:bg-gray-800 border-2 border-slate-100 dark:border-gray-700 rounded-xl px-4 py-3 pl-10 text-xs font-bold" />
                            <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
                        </div>
                        <div class="bg-slate-50 dark:bg-gray-950 border-2 border-slate-100 dark:border-gray-800 rounded-2xl p-4 max-h-[350px] overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-3 thin-scrollbar">
                           <label v-for="pn in ponentesFiltrados" :key="pn.id" class="flex items-center gap-3 p-4 bg-white dark:bg-gray-900 border border-slate-100 dark:border-gray-800 rounded-xl cursor-pointer hover:border-emerald-500 transition-all">
                               <input type="checkbox" :value="pn.id" v-model="nuevoEvento.ponentes_seleccionados" class="w-5 h-5 rounded text-emerald-500" />
                               <div class="flex flex-col min-w-0">
                                   <span class="text-xs font-black text-primary-dark dark:text-gray-200 truncate">{{ pn.displayName }}</span>
                                   <span class="text-[8px] font-black uppercase tracking-widest text-slate-400">{{ pn.roleLabel }}</span>
                               </div>
                           </label>
                        </div>
                    </div>

                    <!-- PASO 4: LOGÍSTICA -->
                    <div v-if="currentStep === 4" class="space-y-6">
                        <div class="flex items-center gap-3 border-b border-slate-100 dark:border-gray-800 pb-4 mb-6">
                            <span class="material-symbols-outlined text-umsa-blue">event_note</span>
                            <h4 class="text-sm font-black text-primary-dark dark:text-white uppercase italic">Paso 4: Logística y Estados</h4>
                        </div>
                        <div class="grid grid-cols-2 gap-6">
                            <div>
                                <label class="text-[10px] font-black text-slate-500 uppercase block mb-2">Fecha de Inicio</label>
                                <input v-model="nuevoEvento.fecha_inicio" type="date" required class="w-full bg-slate-50 dark:bg-gray-800 border-2 border-slate-100 dark:border-gray-700 rounded-xl px-4 py-3 text-sm font-bold" />
                            </div>
                            <div>
                                <label class="text-[10px] font-black text-slate-500 uppercase block mb-2">Fecha de Fin</label>
                                <input v-model="nuevoEvento.fecha_fin" type="date" required class="w-full bg-slate-50 dark:bg-gray-800 border-2 border-slate-100 dark:border-gray-700 rounded-xl px-4 py-3 text-sm font-bold" />
                            </div>
                        </div>
                        <div>
                             <label class="text-[10px] font-black text-slate-500 uppercase block mb-2">Estado del Evento</label>
                             <select v-model="nuevoEvento.estado" class="w-full bg-white dark:bg-gray-900 border-2 border-slate-100 dark:border-gray-700 rounded-xl px-4 py-3 text-sm font-black uppercase text-emerald-600 focus:border-emerald-500 outline-none cursor-pointer">
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
                            <h4 class="text-sm font-black text-primary-dark dark:text-white uppercase italic">Paso 5: Campus y Ubicación</h4>
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="text-[10px] font-black text-slate-500 uppercase block mb-2">Ciudad / Sede</label>
                                <input v-model="nuevoEvento.ubicacion" type="text" placeholder="Ej: La Paz" class="w-full bg-slate-50 dark:bg-gray-800 border-2 border-slate-100 dark:border-gray-700 rounded-xl px-4 py-3 text-sm font-bold" />
                            </div>
                            <div>
                                <label class="text-[10px] font-black text-slate-500 uppercase block mb-2">Dirección Exacta</label>
                                <input v-model="nuevoEvento.direccion" type="text" placeholder="Ej: Edif. Central UMSA" class="w-full bg-slate-50 dark:bg-gray-800 border-2 border-slate-100 dark:border-gray-700 rounded-xl px-4 py-3 text-sm font-bold" />
                            </div>
                        </div>
                        <div>
                            <label class="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase block mb-2">Mapa Interactivo (Iframe de Google)</label>
                            <textarea v-model="nuevoEvento.google_maps_link" rows="5" placeholder="Pega aquí el código <iframe ...>" class="w-full bg-slate-50 dark:bg-gray-900 border-2 border-slate-100 dark:border-gray-700 rounded-2xl px-5 py-4 text-[10px] font-mono text-emerald-600 resize-none"></textarea>
                        </div>
                    </div>

                    <!-- PASO 6: CRONOGRAMA -->
                    <div v-if="currentStep === 6" class="space-y-6">
                        <div class="flex items-center justify-between border-b border-slate-100 dark:border-gray-800 pb-4 mb-6">
                            <div class="flex items-center gap-3">
                                <span class="material-symbols-outlined text-umsa-gold">view_timeline</span>
                                <h4 class="text-sm font-black text-primary-dark dark:text-white uppercase italic">Paso 6: Estructura del Cronograma</h4>
                            </div>
                            <button @click.prevent="agregarDia" class="bg-umsa-gold text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase">
                                + AÑADIR DÍA
                            </button>
                        </div>
                        <div class="space-y-4 max-h-[400px] overflow-y-auto thin-scrollbar pr-2">
                            <div v-for="(dia, dIdx) in nuevoEvento.cronograma_lista" :key="dIdx" class="bg-slate-50 dark:bg-gray-800/50 border border-slate-100 dark:border-gray-700 rounded-2xl p-6">
                                <div class="flex items-center gap-4 mb-4 border-b border-slate-200 dark:border-gray-700 pb-3">
                                    <span class="w-8 h-8 bg-umsa-gold text-white rounded-full flex items-center justify-center font-black text-xs italic">#{{ dia.day }}</span>
                                    <input v-model="dia.name" class="flex-1 bg-transparent border-none outline-none text-xs font-black uppercase" />
                                    <button @click.prevent="eliminarDia(dIdx)" class="text-slate-300 hover:text-red-500"><span class="material-symbols-outlined text-lg">delete</span></button>
                                </div>
                                <div class="space-y-2">
                                    <div v-for="(act, aIdx) in dia.events" :key="aIdx" class="flex items-center gap-2">
                                        <input v-model="act.time" type="time" class="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-lg px-2 py-1.5 text-[10px] font-bold" />
                                        <input v-model="act.title" class="flex-1 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-[10px] font-bold" />
                                        <button @click.prevent="eliminarActividad(dIdx, aIdx)" class="text-slate-300"><span class="material-symbols-outlined text-sm">remove_circle</span></button>
                                    </div>
                                    <button @click.prevent="agregarActividad(dIdx)" class="text-[8px] font-black text-emerald-600 mt-2">+ ITEM</button>
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
                                {{ isEditing ? 'Actualizar Evento' : 'Finalizar y Crear' }}
                            </button>
                        </div>
                    </div>
                </div>

                <!-- COLUMNA DE PREVISUALIZACIÓN DINÁMICA (MINI-HOME) -->
                <div class="lg:col-span-5 flex flex-col h-full">
                    <div class="sticky top-8 space-y-4">
                        <div class="flex items-center justify-between px-2">
                            <div class="flex flex-col">
                                <label class="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Vista Previa en Vivo</label>
                                <span class="text-[8px] font-bold text-emerald-500 uppercase">Simulación de Home Oficial</span>
                            </div>
                            <span class="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 text-[8px] font-black rounded-lg border border-blue-100 dark:border-blue-800 uppercase shadow-sm">Paso {{ currentStep }} / {{ totalSteps }}</span>
                        </div>

                        <!-- CONTENEDOR MINI-HOME UNIFICADO -->
                        <div class="bg-white dark:bg-gray-900 rounded-[2.5rem] border border-slate-200 dark:border-gray-800 overflow-hidden shadow-2xl flex flex-col relative transition-all duration-500 hover:shadow-blue-500/10">
                            
                            <!-- HERO PREVIEW -->
                            <div class="relative aspect-[16/10] bg-slate-900 overflow-hidden">
                                <!-- Banner -->
                                <img v-if="fondoPreview" :src="fondoPreview" class="absolute inset-0 w-full h-full object-cover opacity-60 animate-in fade-in duration-700">
                                <div v-else class="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-950 flex items-center justify-center">
                                    <span class="material-symbols-outlined text-4xl text-white/10">wallpaper</span>
                                </div>

                                <!-- Overlay Gradiente -->
                                <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>

                                <!-- Logo del Evento -->
                                <div class="absolute top-4 left-4 z-20">
                                    <div class="w-12 h-12 bg-white/95 backdrop-blur shadow-xl rounded-xl p-2 border border-white/20 flex items-center justify-center transform -rotate-3 hover:rotate-0 transition-transform duration-500">
                                        <img v-if="logoPreview" :src="logoPreview" class="w-full h-full object-contain animate-in zoom-in-50 duration-500">
                                        <span v-else class="material-symbols-outlined text-slate-300">image</span>
                                    </div>
                                </div>

                                <!-- Badges Superiores -->
                                <div class="absolute top-4 right-4 flex flex-col gap-1 items-end z-20">
                                    <div class="px-2 py-1 bg-emerald-500 text-white text-[7px] font-black rounded-md shadow-lg uppercase tracking-tighter">Evento Oficial</div>
                                    <div class="px-2 py-1 bg-white/10 backdrop-blur-md text-white text-[7px] font-black rounded-md border border-white/20 uppercase">{{ nuevoEvento.version || 'Edición' }}</div>
                                </div>

                                <!-- Contenido del Hero -->
                                <div class="absolute inset-x-0 bottom-0 p-6 space-y-3 z-10">
                                    <h1 class="text-xl md:text-2xl font-black text-white italic uppercase leading-[0.9] tracking-tighter drop-shadow-2xl">
                                        {{ nuevoEvento.nombre || 'Nombre del Evento' }}
                                    </h1>
                                    
                                    <div class="flex flex-wrap gap-2 pt-1">
                                        <!-- Gestión -->
                                        <div class="flex items-center gap-1.5 px-2.5 py-1 bg-sky-500/20 backdrop-blur-md border border-sky-400/30 text-sky-200 rounded-lg text-[8px] font-black uppercase">
                                            <span class="material-symbols-outlined text-[12px]">calendar_today</span>
                                            {{ nuevoEvento.gestion || '202X' }}
                                        </div>
                                        <!-- Fecha -->
                                        <div class="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/20 backdrop-blur-md border border-emerald-400/30 text-emerald-200 rounded-lg text-[8px] font-black uppercase">
                                            <span class="material-symbols-outlined text-[12px]">schedule</span>
                                            {{ nuevoEvento.fecha_inicio ? new Date(nuevoEvento.fecha_inicio + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long' }) : 'Fecha' }}
                                        </div>
                                        <!-- Lugar -->
                                        <div class="flex items-center gap-1.5 px-2.5 py-1 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-lg text-[8px] font-black uppercase">
                                            <span class="material-symbols-outlined text-[12px]">location_on</span>
                                            {{ nuevoEvento.ubicacion || 'Sede' }}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- CONTENIDO NARRATIVO (RESUMEN) -->
                            <div class="p-6 space-y-4 bg-white dark:bg-gray-950 flex-1 border-t border-slate-100 dark:border-gray-800">
                                <div class="space-y-2">
                                    <h2 class="text-[10px] font-black text-umsa-blue dark:text-sky-400 uppercase tracking-widest flex items-center gap-2">
                                        <span class="w-4 h-[2px] bg-umsa-blue dark:bg-sky-400"></span>
                                        Sobre el Evento
                                    </h2>
                                    <p class="text-[10px] text-slate-600 dark:text-slate-400 leading-relaxed font-medium line-clamp-4">
                                        {{ nuevoEvento.sobre_evento_1 || 'Aquí aparecerá el resumen principal que describes en el Paso 2...' }}
                                    </p>
                                </div>

                                <!-- Frase Destacada -->
                                <div v-if="nuevoEvento.frase_destacada" class="bg-slate-50 dark:bg-gray-900 p-4 rounded-2xl border border-slate-100 dark:border-gray-800 relative">
                                    <span class="material-symbols-outlined absolute -left-1 -top-1 text-blue-500/20 text-3xl">format_quote</span>
                                    <p class="text-[9px] font-black italic text-center text-slate-700 dark:text-slate-300 leading-tight">
                                        "{{ nuevoEvento.frase_destacada }}"
                                    </p>
                                </div>

                                <!-- Botones de Simulación -->
                                <div class="flex items-center gap-2 pt-2 opacity-50">
                                    <div class="flex-1 h-9 bg-umsa-blue rounded-full flex items-center justify-center text-[8px] font-black text-white uppercase tracking-tighter">Ingresar al Portal</div>
                                    <div class="flex-1 h-9 border border-slate-200 dark:border-gray-800 rounded-full flex items-center justify-center text-[8px] font-black text-slate-400 uppercase tracking-tighter">Detalles</div>
                                </div>
                            </div>

                            <!-- Footer Simulado -->
                            <div class="px-6 py-3 bg-slate-50 dark:bg-gray-900 border-t border-slate-100 dark:border-gray-800 flex justify-between items-center">
                                <div class="flex gap-2">
                                    <div class="w-4 h-4 bg-slate-200 dark:bg-gray-700 rounded-full"></div>
                                    <div class="w-4 h-4 bg-slate-200 dark:bg-gray-700 rounded-full"></div>
                                </div>
                                <span class="text-[7px] font-bold text-slate-300 uppercase">Organización & Auspicio</span>
                            </div>
                        </div>

                        <!-- Info Card de Calidad -->
                        <div class="p-4 bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                            <div class="flex items-center gap-2 mb-2">
                                <span class="material-symbols-outlined text-emerald-500 text-sm">auto_awesome</span>
                                <span class="text-[9px] font-black text-emerald-700 dark:text-emerald-400 uppercase">Estado de la Marca</span>
                            </div>
                            <div class="grid grid-cols-2 gap-2">
                                <div class="text-[8px] font-bold text-slate-400 uppercase">Logo: <span :class="logoQuality.status === 'hd' ? 'text-emerald-600' : 'text-amber-600'">{{ logoQuality.msg || 'Pendiente' }}</span></div>
                                <div class="text-[8px] font-bold text-slate-400 uppercase">Banner: <span :class="fondoQuality.status === 'hd' ? 'text-emerald-600' : 'text-amber-600'">{{ fondoQuality.status === 'hd' ? 'HD' : 'Estándar' }}</span></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </form>
    </div>

    <!-- Lista de eventos agrupados -->
    <div v-show="!isCreating && !isEditing" class="grid grid-cols-1 gap-8 mt-4">
      <div v-for="(evento, index) in eventosAgrupados" :key="index" class="bg-white dark:bg-gray-900 rounded-[2rem] shadow-xl shadow-slate-200/40 dark:shadow-black/40 border border-slate-100 dark:border-gray-800 transition-all overflow-hidden relative group/evento">
        
        <!-- Decoration top bar / Banner -->
        <div class="h-32 w-full relative overflow-hidden bg-gradient-to-r from-umsa-blue to-emerald-500">
           <img v-if="evento.imagen_fondo" :src="evento.imagen_fondo" class="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-50 contrast-125" />
           <div class="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent"></div>
        </div>

        <div class="p-8 -mt-16 relative z-10">
            <div class="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-6">
              <div class="flex-1">
                <div class="flex items-end gap-5 mb-4">
                  <div class="w-24 h-24 rounded-2xl bg-white dark:bg-gray-800 shadow-xl overflow-hidden flex items-center justify-center text-umsa-blue border-4 border-white dark:border-gray-900 shrink-0 relative z-20">
                    <img v-if="evento.logo_img" :src="evento.logo_img" class="w-full h-full object-contain p-2">
                    <span v-else class="material-symbols-outlined text-4xl text-slate-200">image</span>
                  </div>
                  <div class="pb-[0.1rem]">
                    <span class="text-[9px] font-black uppercase px-3 py-1 rounded-full tracking-widest border mb-2 inline-block shadow-sm" :class="evento.estadoGeneral === 'Activo' ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/40' : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-gray-800 dark:text-gray-400'">
                      ESTADO: {{ evento.estadoGeneral }}
                    </span>
                    <h3 class="text-2xl md:text-3xl font-black text-primary-dark dark:text-white leading-tight uppercase tracking-tighter italic drop-shadow-sm">{{ evento.nombre }}</h3>
                  </div>
                </div>
                <p class="text-sm font-bold text-slate-500 dark:text-gray-400 pl-[7.25rem]">{{ evento.descripcion }}</p>
              </div>
              
              <!-- Quick summary of Gestiones -->
              <div class="md:w-auto text-right md:border-l border-slate-100 dark:border-gray-800 md:pl-6 pt-4 md:pt-0">
                <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-gray-800 px-3 py-1 rounded-lg inline-block">Aperturas Totales</p>
                <div class="flex items-center md:justify-end gap-2 mt-2">
                  <span class="text-4xl font-black text-emerald-500 drop-shadow-md">{{ evento.gestiones.length }}</span>
                  <span class="text-xs font-bold text-slate-500 uppercase tracking-widest">Gestiones</span>
                </div>
              </div>
            </div>

            <div class="pl-0 md:pl-[7.25rem]">
              <h4 class="text-[10px] font-black text-umsa-blue dark:text-blue-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <span class="material-symbols-outlined text-[14px]">view_timeline</span> Gestiones / Versiones Disponibles
              </h4>
              
              <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                <div v-for="gestion in evento.gestiones" :key="gestion.id" 
                  :class="[
                    gestion.estado === -1 ? 'opacity-40 grayscale-[0.5] hover:opacity-100' : '',
                    'p-5 rounded-2xl border border-slate-200 dark:border-gray-700 hover:border-umsa-blue dark:hover:border-blue-500 transition-all group cursor-pointer bg-white dark:bg-gray-900 shadow-sm hover:shadow-xl hover:shadow-umsa-blue/10 dark:hover:shadow-blue-900/20 relative overflow-hidden flex flex-col justify-between min-h-[140px]'
                  ]">
                  
                  <!-- Tooltip informativo para inhabilitados -->
                  <div v-if="gestion.estado === -1" class="absolute inset-0 z-50 flex items-center justify-center p-4 bg-white/95 dark:bg-black/95 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div class="text-center">
                          <p class="text-[9px] font-black text-rose-500 uppercase tracking-widest mb-1">Motivo de Inhabilitación</p>
                          <p class="text-[10px] font-bold text-slate-600 dark:text-slate-300 italic mb-2 line-clamp-3">
                              {{ gestion.descripcion?.split('[INHABILITACION_MOTIVO]:')?.[1]?.split('\n')?.[0] || 'No especificado' }}
                          </p>
                          <p class="text-[8px] font-black text-slate-400 uppercase tracking-tighter">
                              {{ gestion.descripcion?.split('[FECHA_INHABILITACION]:')?.[1] || '' }}
                          </p>
                      </div>
                  </div>

                  <div class="absolute -right-6 -top-6 text-slate-50 dark:text-gray-800 group-hover:text-blue-50 dark:group-hover:text-blue-900/30 transition-colors z-0">
                    <span class="material-symbols-outlined text-[100px]">{{ gestion.estado === -1 ? 'block' : (gestion.estadoStr === 'Activo' ? 'verified' : (gestion.estadoStr === 'Planificación' ? 'edit_calendar' : 'history')) }}</span>
                  </div>

                  <div class="flex flex-col mb-4 relative z-10" @click="editarGestion(gestion)">
                    <span class="text-2xl font-black text-primary-dark dark:text-white leading-none">{{ gestion.gestion }}</span>
                    <span class="text-[9px] font-black text-umsa-gold mt-1.5 uppercase italic tracking-widest">{{ gestion.version || 'Sin versión' }}</span>
                  </div>

                  <div class="flex justify-between items-end relative z-10 gap-2">
                    <span class="text-[10px] uppercase font-black px-2.5 py-1 rounded-md" :class="gestion.estado === -1 ? 'bg-rose-500/10 text-rose-600' : (gestion.estadoStr === 'Activo' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : (gestion.estadoStr === 'Planificación' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' : 'bg-slate-100 dark:bg-gray-800 text-slate-500 dark:text-gray-400'))">
                      {{ gestion.estadoStr }}
                    </span>
                    
                    <div class="flex items-center gap-1">
                        <button v-if="gestion.estado !== -1" @click.stop="inhabilitarEvento(gestion)" class="w-8 h-8 rounded-lg bg-slate-50 dark:bg-gray-800 text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-all flex items-center justify-center" title="Inhabilitar Gestión">
                            <span class="material-symbols-outlined text-lg">block</span>
                        </button>
                        <button @click.stop="editarGestion(gestion)" class="w-8 h-8 rounded-lg bg-slate-50 dark:bg-gray-800 text-slate-400 hover:bg-blue-50 hover:text-umsa-blue transition-all flex items-center justify-center" title="Editar">
                            <span class="material-symbols-outlined text-lg">edit</span>
                        </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
        </div>
      </div>
    </div>

  </div>

    <!-- MODAL REGISTRO RÁPIDO -->
    <div v-if="showRegistroRapido" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-primary-dark/80 backdrop-blur-sm" @click="showRegistroRapido = false"></div>
        <div class="bg-white dark:bg-gray-900 rounded-[2rem] w-full max-w-md p-8 relative z-10 shadow-2xl animate-in zoom-in-95 duration-300 border border-slate-100 dark:border-gray-800">
            <h3 class="text-2xl font-black text-primary-dark dark:text-white mb-6 uppercase italic tracking-tighter border-b-2 border-emerald-500 pb-2 inline-block">Personal Nuevo</h3>
            
            <div class="space-y-5">
                <div>
                    <label class="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest block mb-2">Categoría / Rol</label>
                    <select v-model="nuevoPonenteRegistro.id_rol" class="w-full bg-slate-50 dark:bg-gray-800 border-2 border-slate-100 dark:border-gray-700 rounded-xl px-4 py-3 text-sm font-bold focus:border-emerald-500 outline-none">
                        <option :value="5">Ponente / Expositor</option>
                        <option :value="2">Coordinador de Evento</option>
                    </select>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest block mb-1.5">Nombres</label>
                        <input v-model="nuevoPonenteRegistro.nombres" type="text" class="w-full bg-slate-50 dark:bg-gray-800 border-2 border-slate-100 dark:border-gray-700 rounded-xl px-4 py-3 text-sm font-bold focus:border-emerald-500" />
                    </div>
                    <div>
                        <label class="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest block mb-1.5">Primer Apellido</label>
                        <input v-model="nuevoPonenteRegistro.primer_apellido" type="text" class="w-full bg-slate-50 dark:bg-gray-800 border-2 border-slate-100 dark:border-gray-700 rounded-xl px-4 py-3 text-sm font-bold focus:border-emerald-500" />
                    </div>
                </div>

                <div>
                    <label class="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest block mb-1.5">Correo Electrónico</label>
                    <input v-model="nuevoPonenteRegistro.email" type="email" class="w-full bg-slate-50 dark:bg-gray-800 border-2 border-slate-100 dark:border-gray-700 rounded-xl px-4 py-3 text-sm font-bold focus:border-emerald-500" />
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest block mb-1.5">Grado Académico</label>
                        <select v-model="nuevoPonenteRegistro.id_grado_academico" class="w-full bg-slate-50 dark:bg-gray-800 border-2 border-slate-100 dark:border-gray-700 rounded-xl px-4 py-3 text-sm font-bold focus:border-emerald-500">
                            <option v-for="ga in gradosAcademicosDB" :key="ga.id" :value="ga.id">{{ ga.nombre }} ({{ ga.abreviacion }})</option>
                        </select>
                    </div>
                </div>

                <div class="pt-6 flex gap-3">
                    <button @click="showRegistroRapido = false" class="flex-1 px-4 py-4 rounded-xl text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">Cancelar</button>
                    <button @click="registrarNuevoPonente" class="flex-[2] bg-emerald-500 text-white px-4 py-4 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg active:scale-95">Registrar Personal</button>
                </div>
            </div>
        </div>
    </div>
</template>
