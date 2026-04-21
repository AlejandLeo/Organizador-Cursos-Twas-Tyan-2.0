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

const eliminarDia = (idx: number) => {
    nuevoEvento.value.cronograma_lista.splice(idx, 1);
    // Reordenar días
    nuevoEvento.value.cronograma_lista.forEach((d, i) => d.day = i + 1);
};

const agregarActividad = (dayIdx: number) => {
    nuevoEvento.value.cronograma_lista[dayIdx].events.push({ time: '09:00', title: '' });
};

const eliminarActividad = (dayIdx: number, actIdx: number) => {
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

const previewImg = ref<string | null>(null);

const onFileChange = (e: any) => {
  const file = e.target.files[0];
  if (!file) {
    previewImg.value = null;
    nuevoEvento.value.fondo_img = null;
    return;
  }
  nuevoEvento.value.fondo_img = file;
  previewImg.value = URL.createObjectURL(file);
};

const eventosAgrupados = computed(() => {
  const map = new Map();
  eventosPlanoDB.value.forEach(ev => {
    if (!map.has(ev.nombre)) {
      map.set(ev.nombre, {
        nombre: ev.nombre,
        descripcion: ev.descripcion,
        imagen_fondo: ev.imagen_fondo || ev.logo || '',
        estadoGeneral: getEstadoLabel(ev.estado) === 'Activo' ? 'Activo' : getEstadoLabel(ev.estado),
        gestiones: []
      });
    }
    const group = map.get(ev.nombre);
    if (ev.estado === 1) group.estadoGeneral = 'Activo';
    
    group.gestiones.push({
      ...ev,
      estadoStr: getEstadoLabel(ev.estado)
    });
  });
  return Array.from(map.values()).sort((a: any, b: any) => b.gestiones.length - a.gestiones.length);
});

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

      const fileToUpload = nuevoEvento.value.fondo_img;
      if (fileToUpload && typeof fileToUpload !== 'string') {
          formData.append('imagen_fondo', fileToUpload);
          formData.append('imagen_portada', fileToUpload); 
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
         google_maps_link: '',
         sobre_evento_1: '',
         sobre_evento_2: '',
         frase_destacada: '',
         ponentes_seleccionados: [],
         cronograma: '',
         cronograma_lista: []
      };
      previewImg.value = null;
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
    
    if (gestion.imagen_fondo) {
        previewImg.value = gestion.imagen_fondo;
    } else {
        previewImg.value = null;
    }
    
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

    <!-- Formulario de Creación -->
    <div v-show="isCreating" class="bg-white dark:bg-gray-900 rounded-[2rem] shadow-xl shadow-umsa-blue/10 dark:shadow-black/50 border border-blue-100 dark:border-gray-800 animate-in slide-in-from-top-4 duration-500 overflow-hidden relative">
        <div class="bg-gradient-to-r from-umsa-blue to-emerald-500 p-8 pb-10 relative overflow-hidden">
            <span class="material-symbols-outlined absolute -right-4 -top-8 text-[120px] text-white/10 rotate-12">event_note</span>
            <h3 class="text-2xl md:text-3xl font-black text-white uppercase italic tracking-tighter drop-shadow-md relative z-10 flex items-center gap-3">
                <span class="material-symbols-outlined text-3xl">{{ isEditing ? 'edit_calendar' : 'add_circle' }}</span>
                {{ isEditing ? 'Editar Gestión de Evento' : 'Crear Nueva Gestión de Evento' }}
            </h3>
        </div>
        
        <form @submit.prevent="handleCreateEvento" class="space-y-10 bg-white dark:bg-gray-900 p-8 pt-10 mt-[-1.5rem] rounded-t-[2rem] relative z-20">
            
            <!-- SECCIÓN 1: IDENTIDAD DEL EVENTO (HERO) -->
            <div class="space-y-6">
                <div class="flex items-center gap-3 border-b border-slate-100 dark:border-gray-800 pb-4">
                    <span class="material-symbols-outlined text-umsa-blue">stars</span>
                    <h4 class="text-sm font-black text-primary-dark dark:text-white uppercase tracking-tighter italic">Identidad y Portada</h4>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div class="md:col-span-2 space-y-5">
                        <div>
                            <label class="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wide block mb-2">Nombre Principal del Evento</label>
                            <input v-model="nuevoEvento.nombre" type="text" required placeholder="Ej: Congreso Internacional de Ciencias Agroindustriales" class="w-full bg-slate-50 dark:bg-gray-800 border-2 border-slate-100 dark:border-gray-700 focus:border-umsa-blue outline-none rounded-2xl px-5 py-4 text-sm font-bold text-primary-dark dark:text-gray-100 transition-all shadow-sm" />
                            <p class="text-[10px] text-slate-500 mt-2 italic font-medium">Este título aparecerá con el tamaño más grande en el Hero del Home.</p>
                        </div>
                        
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wide block mb-2">Gestión / Año</label>
                                <input v-model="nuevoEvento.gestion" type="number" min="2020" max="2100" required class="w-full bg-slate-50 dark:bg-gray-800 border-2 border-slate-100 dark:border-gray-700 focus:border-umsa-blue rounded-2xl px-5 py-3 text-sm font-bold" />
                            </div>
                            <div>
                                <label class="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wide block mb-2">Versión / Edición</label>
                                <input v-model="nuevoEvento.version" type="text" placeholder="Ej: 3ra Edición" class="w-full bg-slate-50 dark:bg-gray-800 border-2 border-slate-100 dark:border-gray-700 focus:border-umsa-blue rounded-2xl px-5 py-3 text-sm font-bold" />
                            </div>
                        </div>

                        <div>
                            <label class="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wide block mb-2">Descripción General Breve</label>
                            <textarea v-model="nuevoEvento.descripcion" required rows="3" placeholder="Una frase potente sobre el propósito del evento..." class="w-full bg-slate-50 dark:bg-gray-800 border-2 border-slate-100 dark:border-gray-700 focus:border-umsa-blue rounded-2xl px-5 py-3 text-sm font-bold resize-none"></textarea>
                        </div>
                    </div>

                    <div class="space-y-4">
                        <label class="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wide block mb-2">Imagen Representativa (Fondo Hero)</label>
                        <div class="relative group bg-slate-100 dark:bg-gray-800 rounded-[2rem] overflow-hidden border-2 border-dashed border-slate-200 dark:border-gray-700 hover:border-emerald-500 transition-all h-[280px] flex items-center justify-center">
                            <img v-if="previewImg" :src="previewImg" class="absolute inset-0 w-full h-full object-cover z-0" />
                            <div class="text-center p-6 relative z-10 backdrop-blur-sm bg-white/70 dark:bg-black/50 rounded-2xl border border-white/50">
                                <span class="material-symbols-outlined text-4xl text-emerald-600 mb-2">photo_camera</span>
                                <label for="evento_fondo" class="cursor-pointer block">
                                    <span class="text-[10px] font-black text-emerald-700 dark:text-emerald-400 bg-white dark:bg-gray-900 px-4 py-2 rounded-full shadow-lg uppercase tracking-widest hover:scale-105 active:scale-95 transition-transform">Subir Imagen</span>
                                    <input id="evento_fondo" type="file" accept="image/*" class="sr-only" @change="onFileChange">
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- SECCIÓN 2: DETALLES NARRATIVOS (SOBRE EL EVENTO) -->
            <div class="p-10 bg-slate-50 dark:bg-gray-800/30 rounded-[3rem] border border-slate-100 dark:border-gray-800 space-y-8">
                <div class="flex items-center gap-3">
                    <span class="material-symbols-outlined text-umsa-blue">subject</span>
                    <h4 class="text-sm font-black text-primary-dark dark:text-white uppercase tracking-tighter italic">Sección Informativa (Sobre el Evento)</h4>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div class="space-y-5">
                        <div>
                            <label class="text-xs font-black text-umsa-blue uppercase tracking-wide block mb-2">Párrafo Principal (Columna Derecha)</label>
                            <textarea v-model="nuevoEvento.sobre_evento_1" rows="4" placeholder="Detalla los objetivos principales aquí..." class="w-full bg-white dark:bg-gray-900 border-2 border-blue-50 dark:border-gray-700 focus:border-umsa-blue rounded-2xl px-5 py-4 text-sm font-medium"></textarea>
                        </div>
                        <div>
                            <label class="text-xs font-black text-umsa-blue uppercase tracking-wide block mb-2">Párrafo Secundario</label>
                            <textarea v-model="nuevoEvento.sobre_evento_2" rows="4" placeholder="Añade información adicional sobre los co-organizadores o metodologías..." class="w-full bg-white dark:bg-gray-900 border-2 border-blue-50 dark:border-gray-700 focus:border-umsa-blue rounded-2xl px-5 py-4 text-sm font-medium"></textarea>
                        </div>
                    </div>
                    <div class="space-y-5">
                        <div class="h-full bg-umsa-blue/5 dark:bg-umsa-blue/10 p-8 rounded-[2rem] border-2 border-dashed border-umsa-blue/20 flex flex-col justify-center">
                            <label class="text-xs font-black text-umsa-blue uppercase tracking-wide block mb-4">Frase Destacada (Cita Central)</label>
                            <textarea v-model="nuevoEvento.frase_destacada" rows="4" placeholder='Ej: "Una oportunidad única para la ciencia..."' class="w-full bg-white dark:bg-gray-900 border-2 border-umsa-blue/30 focus:border-umsa-blue rounded-2xl px-5 py-4 text-lg font-black italic text-primary-dark dark:text-blue-200 text-center resize-none"></textarea>
                        </div>
                    </div>
                </div>
                <p class="text-[10px] text-umsa-blue/60 font-bold uppercase tracking-widest flex items-center gap-2">
                    <span class="material-symbols-outlined text-sm">info</span> Estos textos aparecerán después del Hero en la sección central del Home.
                </p>
            </div>

            <!-- SECCIÓN 3: PERSONAL Y PONENTES -->
            <div class="space-y-6">
                <div class="flex items-center justify-between border-b border-slate-100 dark:border-gray-800 pb-4">
                    <div class="flex items-center gap-3">
                        <span class="material-symbols-outlined text-emerald-600">group</span>
                        <h4 class="text-sm font-black text-primary-dark dark:text-white uppercase tracking-tighter italic">Directorio del Evento</h4>
                    </div>
                    <button @click.prevent="showRegistroRapido = true" class="text-[10px] font-black text-emerald-700 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 px-4 py-2 rounded-xl transition-all shadow-sm">
                        + REGISTRAR NUEVO PERSONAL
                    </button>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div class="md:col-span-1 space-y-4">
                        <label class="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wide block mb-2">Filtrar por Nombre</label>
                        <div class="relative">
                            <input v-model="filtroPonente" type="text" placeholder="Buscar ponente..." class="w-full bg-slate-50 dark:bg-gray-800 border-2 border-slate-100 dark:border-gray-700 rounded-xl px-4 py-3 pl-10 text-xs font-bold" />
                            <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                        </div>
                        <p class="text-[10px] text-slate-400 font-bold italic translate-y-2">Selecciona a los coordinadores y ponentes que aparecerán en la lista del Home.</p>
                    </div>
                    <div class="md:col-span-2">
                        <div class="bg-slate-50 dark:bg-gray-950 border-2 border-slate-100 dark:border-gray-800 rounded-2xl p-4 max-h-[300px] overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-3 thin-scrollbar">
                           <label v-for="pn in ponentesFiltrados" :key="pn.id" class="flex items-center gap-3 p-4 bg-white dark:bg-gray-900 border border-slate-100 dark:border-gray-800 rounded-xl cursor-pointer hover:border-emerald-500 transition-all group">
                               <input type="checkbox" :value="pn.id" v-model="nuevoEvento.ponentes_seleccionados" class="w-5 h-5 rounded border-2 border-slate-200 text-emerald-500 focus:ring-emerald-500" />
                               <div class="flex flex-col min-w-0">
                                   <span class="text-xs font-black text-primary-dark dark:text-gray-200 truncate">{{ pn.displayName }}</span>
                                   <span class="text-[9px] font-bold uppercase tracking-widest" :class="pn.roleLabel === 'Ponente' ? 'text-emerald-500' : 'text-purple-500'">{{ pn.roleLabel }}</span>
                               </div>
                           </label>
                        </div>
                    </div>
                </div>
            </div>

            <!-- SECCIÓN 4: LOGÍSTICA (FECHAS Y MAPA) -->
            <div class="bg-blue-50/30 dark:bg-gray-800/30 p-10 rounded-[3rem] border border-blue-100 dark:border-gray-800 space-y-8">
                <div class="flex items-center gap-3">
                    <span class="material-symbols-outlined text-umsa-blue">room</span>
                    <h4 class="text-sm font-black text-primary-dark dark:text-white uppercase tracking-tighter italic">Logística y Ubicación</h4>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div class="space-y-6">
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest block mb-2 border-b border-slate-200 dark:border-gray-700 pb-1">Fecha de Inicio</label>
                                <input v-model="nuevoEvento.fecha_inicio" type="date" required class="w-full bg-white dark:bg-gray-900 border-2 border-slate-100 dark:border-gray-700 rounded-xl px-4 py-3 text-sm font-bold text-primary-dark dark:text-white focus:border-umsa-blue outline-none" />
                            </div>
                            <div>
                                <label class="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest block mb-2 border-b border-slate-200 dark:border-gray-700 pb-1">Fecha de Fin</label>
                                <input v-model="nuevoEvento.fecha_fin" type="date" required class="w-full bg-white dark:bg-gray-900 border-2 border-slate-100 dark:border-gray-700 rounded-xl px-4 py-3 text-sm font-bold text-primary-dark dark:text-white focus:border-umsa-blue outline-none" />
                            </div>
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest block mb-2 border-b border-slate-200 dark:border-gray-700 pb-1">Ciudad / Sede</label>
                                <input v-model="nuevoEvento.ubicacion" type="text" placeholder="Ej: La Paz" class="w-full bg-white dark:bg-gray-900 border-2 border-slate-100 dark:border-gray-700 rounded-xl px-4 py-3 text-sm font-bold text-primary-dark dark:text-white focus:border-umsa-blue" />
                            </div>
                            <div>
                                <label class="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest block mb-2 border-b border-slate-200 dark:border-gray-700 pb-1">Dirección Exacta</label>
                                <input v-model="nuevoEvento.direccion" type="text" placeholder="Ej: Edif. Central UMSA" class="w-full bg-white dark:bg-gray-900 border-2 border-slate-100 dark:border-gray-700 rounded-xl px-4 py-3 text-sm font-bold text-primary-dark dark:text-white focus:border-umsa-blue" />
                            </div>
                        </div>
                        <div>
                             <label class="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2">Estado del Evento</label>
                             <select v-model="nuevoEvento.estado" class="w-full bg-white dark:bg-gray-900 border-2 border-slate-100 dark:border-gray-700 rounded-xl px-4 py-3 text-sm font-black uppercase text-emerald-600 focus:border-emerald-500 outline-none cursor-pointer">
                                 <option :value="2">Planificación</option>
                                 <option :value="1">Activo / Publicado</option>
                                 <option :value="0">Concluido / Histórico</option>
                                 <option :value="3">Borrador / Invisible</option>
                             </select>
                        </div>
                    </div>

                    <div class="space-y-4">
                        <label class="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest block mb-2 border-b border-slate-200 dark:border-gray-700 pb-1">Mapa Interactivo (Iframe de Google)</label>
                        <textarea v-model="nuevoEvento.google_maps_link" rows="4" placeholder="Pega aquí el código <iframe ...>" class="w-full bg-white dark:bg-gray-900 border-2 border-slate-100 dark:border-gray-700 rounded-2xl px-5 py-4 text-xs font-mono text-emerald-600 dark:text-emerald-400 focus:border-emerald-500 resize-none"></textarea>
                        <div class="bg-blue-500/10 p-4 rounded-xl border border-blue-500/20">
                            <p class="text-[9px] font-black uppercase tracking-widest text-umsa-blue mb-1 leading-tight flex items-center gap-1"><span class="material-symbols-outlined text-sm">help</span> Recomendación</p>
                            <p class="text-[9px] text-slate-500 dark:text-gray-400 leading-tight">Usa la opción "Incorporar mapa" en Google Maps para que la vista sea fluida en el Home.</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- SECCIÓN 5: CRONOGRAMA DETALLADO -->
            <div class="space-y-6">
                <div class="flex items-center justify-between border-b border-slate-100 dark:border-gray-800 pb-4">
                    <div class="flex items-center gap-3">
                        <span class="material-symbols-outlined text-umsa-gold">view_timeline</span>
                        <h4 class="text-sm font-black text-primary-dark dark:text-white uppercase tracking-tighter italic">Cronograma de Actividades</h4>
                    </div>
                    <button @click.prevent="agregarDia" class="bg-umsa-gold hover:bg-yellow-600 text-white px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg active:scale-95 shadow-yellow-500/20">
                        + AGREGAR NUEVO DÍA
                    </button>
                </div>

                <div class="space-y-6">
                    <div v-for="(dia, dIdx) in nuevoEvento.cronograma_lista" :key="dIdx" class="bg-white dark:bg-gray-800 border-2 border-slate-100 dark:border-gray-700 rounded-[2rem] p-8 shadow-sm relative overflow-hidden group">
                        <div class="absolute right-0 top-0 w-2 h-full bg-umsa-gold opacity-30"></div>
                        
                        <div class="flex flex-col lg:flex-row gap-6 items-start lg:items-center mb-8 pb-6 border-b border-slate-50 dark:border-gray-700">
                            <div class="flex items-center gap-4 flex-1">
                                <span class="w-12 h-12 bg-umsa-gold/10 text-umsa-gold rounded-full flex items-center justify-center font-black text-xl italic shadow-inner">#{{ dia.day }}</span>
                                <div class="flex-1">
                                    <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Nombre del Día</label>
                                    <input v-model="dia.name" placeholder="Ej: Apertura y Keynote" class="w-full bg-transparent border-b-2 border-slate-100 dark:border-gray-600 focus:border-umsa-gold outline-none text-base font-black text-primary-dark dark:text-white uppercase" />
                                </div>
                            </div>
                            <div class="w-full lg:w-auto">
                                <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Fecha del Día</label>
                                <input v-model="dia.date" type="date" class="w-full lg:w-auto bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-600 rounded-xl px-4 py-2 text-xs font-bold" />
                            </div>
                            <button @click.prevent="eliminarDia(dIdx)" class="text-slate-300 hover:text-red-500 transition-colors p-2">
                                <span class="material-symbols-outlined text-2xl">delete_sweep</span>
                            </button>
                        </div>

                        <div class="space-y-3">
                            <div v-for="(act, aIdx) in dia.events" :key="aIdx" class="flex flex-col sm:flex-row items-center gap-3 group/act relative">
                                <span class="text-[9px] font-black text-slate-300 dark:text-gray-600 hidden sm:block">{{ aIdx + 1 }}</span>
                                <input v-model="act.time" type="time" class="w-full sm:w-32 bg-slate-50 dark:bg-gray-900 border border-slate-100 dark:border-gray-700 rounded-xl px-4 py-3 text-xs font-black text-umsa-blue" />
                                <input v-model="act.title" placeholder="Descripción de la actividad..." class="flex-1 w-full bg-white dark:bg-gray-900 border border-slate-100 dark:border-gray-700 rounded-xl px-4 py-3 text-sm font-bold shadow-sm focus:border-emerald-500 transition-all" />
                                <button @click.prevent="eliminarActividad(dIdx, aIdx)" class="text-slate-300 hover:text-red-500 opacity-0 group-hover/act:opacity-100 transition-all">
                                    <span class="material-symbols-outlined text-xl">remove_circle</span>
                                </button>
                            </div>
                            <button @click.prevent="agregarActividad(dIdx)" class="mt-4 text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-6 py-2.5 rounded-xl uppercase tracking-widest hover:bg-emerald-100 transition-all flex items-center gap-2">
                                <span class="material-symbols-outlined text-sm">add</span> Añadir Item al Cronograma
                            </button>
                        </div>
                    </div>
                </div>

                <div v-if="nuevoEvento.cronograma_lista.length === 0" class="py-20 text-center border-4 border-dashed border-slate-100 dark:border-gray-800 rounded-[3rem]">
                    <span class="material-symbols-outlined text-6xl text-slate-200 mb-4 scale-125">auto_schedule</span>
                    <p class="text-sm font-black text-slate-300 uppercase tracking-widest mb-6">No has definido el cronograma del evento</p>
                    <button @click.prevent="agregarDia" class="bg-umsa-blue text-white px-8 py-3 rounded-full font-black text-[11px] uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:-translate-y-1 transition-all">Empezar a estructurar</button>
                </div>
            </div>

            <div class="flex justify-between items-center pt-10 border-t-2 border-slate-100 dark:border-gray-800">
                <button type="button" @click="isCreating = false; isEditing = false" class="text-xs font-black text-slate-400 uppercase tracking-widest hover:text-red-500 transition-all flex items-center gap-2">
                    <span class="material-symbols-outlined text-lg">close</span> Descartar Cambios
                </button>
                <button type="submit" class="bg-gradient-to-r from-emerald-600 to-emerald-400 hover:scale-105 transition-all text-white font-black px-12 py-5 rounded-2xl text-xs uppercase tracking-widest shadow-2xl shadow-emerald-500/30 flex items-center gap-3">
                    <span class="material-symbols-outlined text-xl">{{ isEditing ? 'auto_fix_high' : 'playlist_add_check' }}</span> 
                    {{ isEditing ? 'Actualizar Evento Completo' : 'Finalizar y Crear Evento' }}
                </button>
            </div>
        </form>
    </div>

    <!-- Lista de eventos agrupados -->
    <div v-show="!isCreating" class="grid grid-cols-1 gap-8 mt-4">
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
                  <div class="w-24 h-24 rounded-2xl bg-white dark:bg-gray-900 shadow-xl overflow-hidden flex items-center justify-center text-umsa-blue border-4 border-white dark:border-gray-900 shrink-0 relative z-20">
                    <img v-if="evento.imagen_fondo" :src="evento.imagen_fondo" class="w-full h-full object-cover">
                    <span v-else class="material-symbols-outlined text-4xl">corporate_fare</span>
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
                <div v-for="gestion in evento.gestiones" :key="gestion.id" @click="editarGestion(gestion)" class="p-5 rounded-2xl border border-slate-200 dark:border-gray-700 hover:border-umsa-blue dark:hover:border-blue-500 transition-all group cursor-pointer bg-white dark:bg-gray-900 shadow-sm hover:shadow-xl hover:shadow-umsa-blue/10 dark:hover:shadow-blue-900/20 relative overflow-hidden flex flex-col justify-between min-h-[120px]">
                  
                  <div class="absolute -right-6 -top-6 text-slate-50 dark:text-gray-800 group-hover:text-blue-50 dark:group-hover:text-blue-900/30 transition-colors z-0">
                    <span class="material-symbols-outlined text-[100px]">{{ gestion.estadoStr === 'Activo' ? 'verified' : (gestion.estadoStr === 'Planificación' ? 'edit_calendar' : 'history') }}</span>
                  </div>

                  <div class="flex flex-col mb-4 relative z-10">
                    <span class="text-2xl font-black text-primary-dark dark:text-white leading-none">{{ gestion.gestion }}</span>
                    <span class="text-[9px] font-black text-umsa-gold mt-1.5 uppercase italic tracking-widest">{{ gestion.version || 'Sin versión' }}</span>
                  </div>

                  <div class="flex justify-between items-end relative z-10">
                    <span class="text-[10px] uppercase font-black px-2.5 py-1 rounded-md" :class="gestion.estadoStr === 'Activo' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : (gestion.estadoStr === 'Planificación' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' : 'bg-slate-100 dark:bg-gray-800 text-slate-500 dark:text-gray-400')">
                      {{ gestion.estadoStr }}
                    </span>
                    <span class="text-[10px] font-black text-umsa-blue opacity-0 group-hover:opacity-100 transition-opacity bg-blue-50 dark:bg-blue-900/40 px-2.5 py-1 rounded-md flex items-center gap-1">Editar <span class="material-symbols-outlined text-[12px]">edit</span></span>
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
