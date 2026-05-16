<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import api from '@/services/api';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';

const route = useRoute();

// --- Estado de la vista ---
const activeTab = ref<'usuarios' | 'inscripciones' | 'ponentes'>('usuarios');
const isUploading = ref(false);
const notificar = ref(true);
const crearUsuarios = ref(false);

const eventos = ref<any[]>([]);
const selectedEventoId = ref<string>('');
const isLoadingSelects = ref(false);
const searchQuery = ref('');

// Computed para filtrar eventos
import { computed } from 'vue';
const filteredEventos = computed(() => {
  if (!searchQuery.value) return eventos.value;
  const q = searchQuery.value.toLowerCase();
  return eventos.value.filter(e => 
    e.nombre.toLowerCase().includes(q) || 
    (e.gestion && String(e.gestion).toLowerCase().includes(q))
  );
});

// --- Selección de Plantilla ---
const plantillas = ref<any[]>([]);
const selectedTemplateId = ref<string>('');
const showPreviewModal = ref(false);
const previewTemplateHtml = ref('');

const fetchPlantillas = async () => {
  try {
    // Para registro de usuarios (WELCOME) y inscripciones (ENROLLMENT)
    const tipo = activeTab.value === 'usuarios' ? 'WELCOME' : 'ENROLLMENT';
    const res = await api.get(`/admin/mail-templates/tipo/${tipo}`);
    plantillas.value = Array.isArray(res.data) ? res.data : [];
  } catch (e) {
    console.error('Error fetching plantillas:', e);
  }
};

const openPreviewTemplate = async () => {
  let subject = '';
  let body = '';
  
  if (selectedTemplateId.value) {
    const t = plantillas.value.find(p => String(p.id) === selectedTemplateId.value);
    if (!t) return;
    subject = t.asunto;
    body = t.cuerpo;
  } else {
    // Si no hay seleccionada, traemos la de sistema (base)
    try {
      const tipo = activeTab.value === 'usuarios' ? 'WELCOME' : 'ENROLLMENT';
      const keySubject = tipo === 'WELCOME' ? 'WELCOME_MESSAGE_SUBJECT' : 'ENROLLMENT_MESSAGE_SUBJECT';
      const keyBody = tipo === 'WELCOME' ? 'WELCOME_MESSAGE_BODY' : 'ENROLLMENT_MESSAGE_BODY';
      
      const resSubject = await api.get(`/admin/sistema-config/key/${keySubject}`);
      const resBody = await api.get(`/admin/sistema-config/key/${keyBody}`);
      
      subject = resSubject.data?.valor || 'Notificación de Sistema';
      body = resBody.data?.valor || 'Hola {{nombre}}, tienes una nueva notificación.';
    } catch (e) {
      subject = 'Bienvenida';
      body = 'Hola {{nombre}}, bienvenido al sistema.';
    }
  }

  // Renderizado para previsualización
  const resLayout = await api.get('/admin/sistema-config/key/MAIL_MASTER_LAYOUT');
  const resUrl = await api.get('/admin/sistema-config/key/SYSTEM_URL');
  
  const masterLayout = resLayout.data?.valor || '<html><body>{{{content}}}</body></html>';
  const systemUrl = resUrl.data?.valor || window.location.origin;
  
  let contentHtml = body.replace(/\n/g, '<br>');
  
  // Reemplazo de variables
  const context = {
    nombre: 'Juan Perez',
    email: 'ejemplo@correo.com',
    password: '********',
    actividad: 'Curso de Especialización',
    evento: 'Congreso Internacional 2026',
    url_sistema: systemUrl,
    year: new Date().getFullYear()
  };

  Object.keys(context).forEach(key => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    contentHtml = contentHtml.replace(regex, String((context as any)[key]));
  });

  previewTemplateHtml.value = masterLayout
    .replace('{{{content}}}', contentHtml)
    .replace('{{year}}', context.year.toString());
    
  showPreviewModal.value = true;
};

const fetchEventos = async () => {
  try {
    const res = await api.get('/admin/eventos/lista');
    eventos.value = res.data?.data || res.data || [];
    
    // Si viene por query param
    const evId = route.query.eventoId as string;
    if (evId) {
      selectedEventoId.value = evId;
      activeTab.value = 'inscripciones';
    }
  } catch (e) {
    console.error('Error fetching eventos:', e);
  }
};

onMounted(() => {
  fetchEventos();
  fetchPlantillas();
});

watch(activeTab, () => {
  selectedTemplateId.value = '';
  fetchPlantillas();
});

// --- Previsualización ---
const previewData = ref<any[]>([]);
const selectedFile = ref<File | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);

// --- Resultados de la importación ---
const results = ref<any>(null);
const ultimoModo = ref<'verificar' | 'guardar' | null>(null);

// --- Métodos ---
const onFileChange = (e: any) => {
  const file = e.target.files[0];
  if (!file) return;
  handleFile(file);
};

const handleDrop = (e: DragEvent) => {
  const file = e.dataTransfer?.files[0];
  if (!file) return;
  handleFile(file);
};

const handleFile = (file: File) => {
  const reader = new FileReader();
  reader.onload = (e: any) => {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) return;
    const worksheet = workbook.Sheets[firstSheetName];
    if (!worksheet) return;
    const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];
    
    previewData.value = jsonData.slice(0, 5); // Mostrar solo las primeras 5 filas
    selectedFile.value = file;
    results.value = null; // Limpiar resultados anteriores
  };
  reader.readAsArrayBuffer(file);
};

const clearFile = () => {
  selectedFile.value = null;
  previewData.value = [];
  results.value = null;
  ultimoModo.value = null;
};

const descargarPlantilla = async () => {
  let endpoint = '';
  let filename = '';

  if (activeTab.value === 'usuarios') {
    endpoint = '/admin/inscripciones-excel/plantilla-usuarios';
    filename = 'plantilla_usuarios.xlsx';
  } else if (activeTab.value === 'inscripciones') {
    endpoint = '/admin/inscripciones-excel/plantilla-inscripciones';
    filename = 'plantilla_inscripciones.xlsx';
  } else {
    endpoint = '/admin/inscripciones-excel/plantilla-ponentes';
    filename = 'plantilla_ponentes.xlsx';
  }
  
  try {
    const token = localStorage.getItem('token');
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    
    // Usamos fetch nativo para bypass de interceptores XHR que causan el error InvalidStateError
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) throw new Error('Respuesta del servidor no válida');

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', activeTab.value === 'usuarios' ? 'plantilla_usuarios.xlsx' : 'plantilla_inscripciones.xlsx');
    document.body.appendChild(link);
    link.click();
    
    // Limpieza
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error: any) {
    console.error('Error al descargar plantilla:', error);
    Swal.fire('Error', 'No se pudo descargar la plantilla', 'error');
  }
};

const importar = async (modo: 'verificar' | 'guardar') => {
  if (!selectedFile.value) return;

  if ((activeTab.value === 'inscripciones' || activeTab.value === 'ponentes') && !selectedEventoId.value) {
    Swal.fire('Atención', 'Debes seleccionar al menos un evento para continuar.', 'warning');
    return;
  }

  isUploading.value = true;
  const formData = new FormData();
  formData.append('file', selectedFile.value);
  formData.append('notificar', String(notificar.value));
  formData.append('crear_usuarios', String(crearUsuarios.value));
  
  if ((activeTab.value === 'inscripciones' || activeTab.value === 'ponentes') && selectedEventoId.value) {
    formData.append('id_evento', selectedEventoId.value);
  }
  if (selectedTemplateId.value) {
    formData.append('id_template', selectedTemplateId.value);
  }
  formData.append('modo', modo);

  let endpoint = '';
  if (activeTab.value === 'usuarios') {
    endpoint = '/admin/inscripciones-excel/registro-masivo';
  } else if (activeTab.value === 'inscripciones') {
    endpoint = '/admin/inscripciones-excel/inscripcion-masiva';
  } else {
    endpoint = '/admin/inscripciones-excel/asignacion-ponentes';
  }

  try {
    const response = await api.post(endpoint, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    
    results.value = response.data;
    ultimoModo.value = modo;
    const hasMailWarnings = response.data.advertenciasCorreo > 0;
    
    let textMsg = '';
    if (modo === 'verificar') {
      textMsg = response.data.errores > 0 
        ? `Se verificaron los datos pero hay ${response.data.errores} errores. Corrige el archivo antes de guardar.`
        : 'Verificación exitosa. Todos los datos son válidos. Ahora puedes Guardar.';
    } else {
      textMsg = hasMailWarnings 
        ? `Se procesaron y guardaron los datos, pero hubo ${response.data.advertenciasCorreo} errores al enviar correos.` 
        : 'Se han procesado y guardado los datos correctamente.';
    }

    Swal.fire({
      title: modo === 'verificar' ? (response.data.errores > 0 ? 'Verificación Fallida' : 'Verificación Exitosa') : (hasMailWarnings ? 'Proceso con Advertencias' : 'Proceso Completado'),
      text: textMsg,
      icon: (modo === 'verificar' && response.data.errores > 0) ? 'error' : (hasMailWarnings ? 'warning' : 'success'),
      confirmButtonColor: hasMailWarnings ? '#f59e0b' : '#3085d6',
    });
  } catch (error: any) {
    let errorMsg = error.response?.data?.message || 'Error al procesar el archivo.';
    if (Array.isArray(errorMsg)) errorMsg = errorMsg.join(' | ');
    Swal.fire('Error', String(errorMsg), 'error');
  } finally {
    isUploading.value = false;
  }
};

const getStatusClass = (status: string) => {
  switch (status) {
    case 'creado':
    case 'inscrito': return 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30';
    case 'omitido': return 'bg-amber-500/20 text-amber-500 border-amber-500/30';
    case 'error': return 'bg-red-500/20 text-red-500 border-red-500/30';
    default: return 'bg-slate-500/20 text-slate-500 border-slate-500/30';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'creado':
    case 'inscrito': return 'check_circle';
    case 'omitido': return 'warning';
    case 'error': return 'error';
    default: return 'help';
  }
};
</script>

<template>
  <div class="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
    
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-6">
      <div>
        <div class="flex items-center gap-3 mb-2">
          <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-umsa-blue to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <span class="material-symbols-outlined text-white text-2xl">grid_on</span>
          </div>
          <div>
            <h1 class="text-3xl font-black text-slate-800 dark:text-white tracking-tight">Inscripciones Masivas</h1>
            <p class="text-slate-500 dark:text-slate-400 font-medium">Gestión administrativa mediante archivos Excel</p>
          </div>
        </div>
      </div>
      
      <div class="flex bg-slate-100 dark:bg-white/5 p-1 rounded-2xl border border-slate-200 dark:border-white/10 w-fit self-start md:self-end">
        <button 
          @click="activeTab = 'usuarios'; clearFile()"
          :class="[activeTab === 'usuarios' ? 'bg-white dark:bg-white/10 shadow-sm text-umsa-blue dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300']"
          class="px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300"
        >
          Registro de Usuarios
        </button>
        <button 
          @click="activeTab = 'inscripciones'; clearFile()"
          :class="[activeTab === 'inscripciones' ? 'bg-white dark:bg-white/10 shadow-sm text-umsa-blue dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300']"
          class="px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300"
        >
          Inscripción a Evento
        </button>
        <button 
          @click="activeTab = 'ponentes'; clearFile()"
          :class="[activeTab === 'ponentes' ? 'bg-white dark:bg-white/10 shadow-sm text-umsa-blue dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300']"
          class="px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300"
        >
          Asignación de Ponentes
        </button>
      </div>
    </div>

    <!-- Main Card -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      <!-- Upload Section -->
      <div class="lg:col-span-2 space-y-6">
        <div class="bg-white dark:bg-[#0d0d14] rounded-3xl border border-slate-200 dark:border-white/5 shadow-xl shadow-slate-200/50 dark:shadow-none p-8 relative overflow-hidden">
          
          <div class="flex items-center justify-between mb-8">
            <h2 class="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
              <span class="material-symbols-outlined text-umsa-blue">upload</span>
              Subir Archivo
            </h2>
            <div class="flex items-center gap-4">
              <!-- Selector Integrado en Header -->
              <div class="flex items-center gap-2 bg-slate-50 dark:bg-white/5 px-3 py-1.5 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm">
                <span class="material-symbols-outlined text-slate-400 text-sm">mail</span>
                <select v-model="selectedTemplateId"
                        class="bg-transparent text-[11px] font-bold text-slate-600 dark:text-slate-300 outline-none cursor-pointer min-w-[140px]">
                  <option value="">Plantilla por Defecto</option>
                  <option v-for="p in plantillas" :key="p.id" :value="String(p.id)">{{ p.nombre }}</option>
                </select>
                <div class="w-px h-4 bg-slate-200 dark:bg-white/10 mx-1"></div>
                <button @click="openPreviewTemplate" class="w-7 h-7 flex items-center justify-center text-blue-500 hover:bg-blue-500/10 rounded-lg transition-all" title="Ver visor de plantilla">
                  <span class="material-symbols-outlined text-[18px]">visibility</span>
                </button>
              </div>

              <button 
                @click="descargarPlantilla"
                class="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-bold hover:bg-emerald-500/20 transition-all border border-emerald-500/20"
              >
                <span class="material-symbols-outlined text-sm">download</span>
                Plantilla Excel
              </button>
            </div>
          </div>

          <!-- Selectores de Evento (Para Inscripciones y Ponentes) -->
          <div v-if="activeTab === 'inscripciones' || activeTab === 'ponentes'" class="mb-8 p-6 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-200 dark:border-white/10 space-y-4 animate-in slide-in-from-top-4 duration-500">
            
            <!-- Encabezado y Buscador -->
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-white/10 pb-4">
              <div>
                <h3 class="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Selección de Evento Destino</h3>
                <p class="text-[10px] text-slate-500 font-bold">Elige el evento para cargar {{ activeTab === 'inscripciones' ? 'inscritos' : 'ponentes' }}</p>
              </div>
              
              <div class="relative w-full md:w-72">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-[18px]">search</span>
                <input 
                  v-model="searchQuery" 
                  type="text" 
                  placeholder="FILTRAR POR NOMBRE O GESTIÓN..." 
                  class="w-full bg-white dark:bg-gray-800 border border-slate-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-[10px] font-black uppercase tracking-widest outline-none focus:border-umsa-blue transition-all shadow-sm"
                />
              </div>
            </div>

            <!-- Opciones Rápidas -->
            <div class="flex flex-col sm:flex-row items-center justify-between gap-4 p-3 bg-white dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm">
              <div class="flex items-center gap-2">
                <div class="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                  <span class="material-symbols-outlined text-blue-600 dark:text-blue-400 text-sm">info</span>
                </div>
                <p class="text-[9px] text-slate-500 font-bold max-w-xs leading-tight">
                  <span class="text-blue-600 font-black">REGISTRO AUTOMÁTICO:</span> Actívalo para crear cuentas a usuarios nuevos detectados en el Excel.
                </p>
              </div>
              <div class="flex items-center gap-3 bg-slate-50 dark:bg-black/20 px-4 py-1.5 rounded-xl border border-slate-200 dark:border-white/5">
                <span class="text-[9px] font-black text-slate-500 uppercase tracking-tighter">Desactivado</span>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" v-model="crearUsuarios" class="sr-only peer">
                  <div class="w-8 h-4 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-white/10 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-umsa-blue"></div>
                </label>
                <span class="text-[9px] font-black text-umsa-blue uppercase tracking-tighter">Activado</span>
              </div>
            </div>

            <!-- Lista Estructurada de Eventos -->
            <div class="bg-white dark:bg-gray-900 rounded-2xl border border-slate-200 dark:border-white/5 overflow-hidden shadow-sm">
              <div class="overflow-y-auto max-h-[320px] custom-scrollbar">
                <div 
                  v-for="ev in filteredEventos" 
                  :key="ev.id"
                  @click="selectedEventoId = String(ev.id)"
                  :class="[
                    selectedEventoId === String(ev.id) 
                      ? 'bg-blue-50 dark:bg-blue-500/5 border-l-4 border-umsa-blue' 
                      : 'hover:bg-slate-50 dark:hover:bg-white/5 border-l-4 border-transparent'
                  ]"
                  class="group flex items-center justify-between p-4 border-b border-slate-100 dark:border-white/5 cursor-pointer transition-all duration-200"
                >
                  <div class="flex items-center gap-4 min-w-0">
                    <div 
                      :class="selectedEventoId === String(ev.id) ? 'bg-umsa-blue text-white shadow-md' : 'bg-slate-100 dark:bg-white/10 text-slate-400'"
                      class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all"
                    >
                      <span class="material-symbols-outlined text-[18px]">{{ selectedEventoId === String(ev.id) ? 'check_circle' : 'event' }}</span>
                    </div>
                    <div class="min-w-0">
                      <h4 class="text-[11px] font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight truncate">
                        {{ ev.nombre }}
                      </h4>
                      <div class="flex items-center gap-3 mt-0.5">
                        <span class="flex items-center gap-1 text-[8px] font-bold text-slate-400 uppercase">
                          <span class="material-symbols-outlined text-[10px]">calendar_today</span> {{ ev.gestion }}
                        </span>
                        <span class="w-1 h-1 rounded-full bg-slate-300"></span>
                        <span class="flex items-center gap-1 text-[8px] font-bold text-slate-400 uppercase">
                          <span class="material-symbols-outlined text-[10px]">location_on</span> {{ ev.modalidad || 'Presencial' }}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div class="flex items-center gap-4">
                    <span 
                      class="px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border"
                      :class="ev.estado === 1 ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-amber-500/10 text-amber-600 border-amber-500/20'"
                    >
                      {{ ev.estado === 1 ? 'Activo' : 'En espera' }}
                    </span>
                    <span v-if="selectedEventoId === String(ev.id)" class="material-symbols-outlined text-umsa-blue text-sm animate-bounce">keyboard_arrow_left</span>
                  </div>
                </div>

                <!-- Estado Vacío -->
                <div v-if="filteredEventos.length === 0" class="py-16 flex flex-col items-center justify-center text-slate-300">
                  <span class="material-symbols-outlined text-4xl mb-2 opacity-20">search_off</span>
                  <p class="text-[10px] font-black uppercase tracking-widest">No hay resultados para la búsqueda</p>
                </div>
              </div>
            </div>

            <!-- Barra de Estado Inferior -->
            <div class="flex items-center justify-between px-2 pt-2 border-t border-slate-200 dark:border-white/5">
              <div v-if="!selectedEventoId" class="flex items-center gap-2">
                <div class="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                <p class="text-[9px] text-amber-600 font-black uppercase">Acción pendiente: Selecciona un evento de la lista</p>
              </div>
              <div v-else class="flex items-center gap-2">
                <div class="w-2 h-2 rounded-full bg-emerald-500"></div>
                <p class="text-[9px] text-emerald-600 font-black uppercase">Evento seleccionado: <span class="text-slate-700 dark:text-white underline decoration-emerald-500/50">{{ eventos.find(e => String(e.id) === selectedEventoId)?.nombre }}</span></p>
              </div>
              <p class="text-[8px] text-slate-400 font-bold uppercase">{{ filteredEventos.length }} eventos encontrados</p>
            </div>
          </div>

          <!-- Dropzone -->
          <div 
            v-if="!selectedFile"
            @dragover.prevent
            @drop.prevent="handleDrop"
            class="border-2 border-dashed border-slate-200 dark:border-white/10 rounded-3xl p-12 flex flex-col items-center justify-center transition-all hover:border-umsa-blue/50 hover:bg-umsa-blue/5 group cursor-pointer"
            @click="fileInput?.click()"
          >
            <input type="file" ref="fileInput" class="hidden" accept=".xlsx, .xls" @change="onFileChange">
            <div class="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <span class="material-symbols-outlined text-3xl text-slate-400 group-hover:text-umsa-blue">file_upload</span>
            </div>
            <p class="text-slate-600 dark:text-slate-300 font-bold mb-1">Arrastra tu archivo aquí</p>
            <p class="text-slate-400 text-sm">O haz clic para seleccionar (Máx. 5MB)</p>
          </div>

          <!-- File Info & Preview -->
          <div v-else class="space-y-6">
            <div class="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10">
              <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <span class="material-symbols-outlined text-emerald-500">description</span>
                </div>
                <div>
                  <p class="text-sm font-bold text-slate-800 dark:text-white">{{ selectedFile.name }}</p>
                  <p class="text-xs text-slate-500">{{ (selectedFile.size / 1024).toFixed(2) }} KB</p>
                </div>
              </div>
              <button @click="clearFile" class="w-10 h-10 rounded-full hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-all flex items-center justify-center">
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>

            <div v-if="previewData.length > 0" class="space-y-3">
              <p class="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Previsualización (Primeras 5 filas)</p>
              <div class="overflow-x-auto rounded-2xl border border-slate-200 dark:border-white/10">
                <table class="w-full text-left text-xs">
                  <thead class="bg-slate-50 dark:bg-white/5 text-slate-500 font-black uppercase tracking-wider">
                    <tr>
                      <th v-for="(val, key) in previewData[0]" :key="key" class="px-4 py-3">{{ key }}</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100 dark:divide-white/5">
                    <tr v-for="(row, idx) in previewData" :key="idx" class="text-slate-600 dark:text-slate-300">
                      <td v-for="(val, key) in row" :key="key" class="px-4 py-3 whitespace-nowrap">{{ val }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div class="flex flex-col md:flex-row items-center justify-between gap-6 pt-4 border-t border-slate-100 dark:border-white/5">
              <div class="flex items-center gap-3">
                <label class="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" v-model="notificar" class="sr-only peer">
                  <div class="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-white/10 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-umsa-blue"></div>
                </label>
                <div>
                  <span class="text-sm font-bold text-slate-700 dark:text-slate-300">Notificar por correo</span>
                  <p class="text-[10px] text-slate-400">Sujeto a límite diario</p>
                </div>
              </div>


              <div class="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                <!-- Botón de Verificar (Siempre disponible si hay archivo) -->
                <button 
                  @click="importar('verificar')"
                  :disabled="isUploading"
                  class="w-full sm:w-auto px-6 py-3.5 bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-200 dark:hover:bg-white/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2 border border-slate-300 dark:border-white/10"
                >
                  <span v-if="isUploading && ultimoModo === 'verificar'" class="animate-spin material-symbols-outlined text-sm">progress_activity</span>
                  <span v-else class="material-symbols-outlined text-sm">fact_check</span>
                  Verificar
                </button>

                <!-- Botón de Guardar (Bloqueado si no se ha verificado o si hay errores) -->
                <button 
                  @click="importar('guardar')"
                  :disabled="isUploading || ultimoModo !== 'verificar' || (results && results.errores > 0)"
                  :class="[
                    'w-full sm:w-auto px-6 py-3.5 rounded-2xl font-black uppercase text-xs tracking-widest transition-all flex items-center justify-center gap-2 border',
                    (ultimoModo === 'verificar' && results && results.errores === 0) 
                      ? 'bg-umsa-blue text-white hover:bg-blue-700 shadow-lg shadow-blue-500/30 border-blue-600'
                      : 'bg-slate-50 dark:bg-white/5 text-slate-400 border-slate-200 dark:border-white/5 cursor-not-allowed opacity-60'
                  ]"
                  title="Debes verificar primero y asegurar que no haya errores"
                >
                  <span v-if="isUploading && ultimoModo === 'guardar'" class="animate-spin material-symbols-outlined text-sm">progress_activity</span>
                  <span v-else class="material-symbols-outlined text-sm">save</span>
                  Guardar Datos
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Progress/Result Details Table -->
        <div v-if="results && results.detalle" class="bg-white dark:bg-[#0d0d14] rounded-3xl border border-slate-200 dark:border-white/5 shadow-xl p-8 animate-in zoom-in duration-500">
          <h2 class="text-xl font-black text-slate-800 dark:text-white mb-6 flex items-center gap-2">
            <span class="material-symbols-outlined text-umsa-blue">list_alt</span>
            Detalle del Proceso
          </h2>
          <div class="overflow-x-auto rounded-2xl border border-slate-200 dark:border-white/10">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-50 dark:bg-white/5 text-slate-500 font-black uppercase tracking-wider">
                <tr>
                  <th class="px-4 py-3 w-16">Fila</th>
                  <th class="px-4 py-3">Email</th>
                  <th class="px-4 py-3">Estado</th>
                  <th class="px-4 py-3">Resultado</th>
                  <th class="px-4 py-3">Correo</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-white/5">
                <tr v-for="(item, idx) in results.detalle" :key="idx" class="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                  <td class="px-4 py-4 font-bold text-slate-400">{{ item.fila }}</td>
                  <td class="px-4 py-4 text-slate-700 dark:text-slate-300 font-medium">{{ item.email || '-' }}</td>
                  <td class="px-4 py-4">
                    <span :class="getStatusClass(item.estado)" class="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border flex items-center gap-1.5 w-fit">
                      <span class="material-symbols-outlined text-[14px]">{{ getStatusIcon(item.estado) }}</span>
                      {{ item.estado }}
                    </span>
                  </td>
                  <td class="px-4 py-4 text-slate-500 text-[11px] leading-snug">{{ item.mensaje }}</td>
                  <td class="px-4 py-4">
                    <div v-if="item.correoEnviado" class="text-emerald-500 flex items-center gap-1">
                      <span class="material-symbols-outlined text-[16px]">mail</span>
                      <span class="font-bold">Enviado</span>
                    </div>
                    <div v-else-if="item.correoAdvertencia" class="text-amber-500 group relative">
                      <span class="material-symbols-outlined text-[16px]">mail_lock</span>
                      <div class="absolute bottom-full mb-2 hidden group-hover:block bg-slate-800 text-white p-2 rounded text-[10px] w-48 z-10">
                        {{ item.correoAdvertencia }}
                      </div>
                    </div>
                    <span v-else class="text-slate-300 dark:text-white/10">-</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Stats Sidebar -->
      <div class="space-y-6">
        <div class="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
          <div class="absolute -right-12 -top-12 w-48 h-48 bg-white/5 rounded-full blur-3xl"></div>
          <h3 class="text-lg font-black mb-6 flex items-center gap-2">
            <span class="material-symbols-outlined text-blue-400">analytics</span>
            Estadísticas
          </h3>
          
          <div v-if="results" class="space-y-4">
            <div class="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
              <span class="text-sm font-medium text-slate-300">Total procesados</span>
              <span class="text-xl font-black">{{ results.total }}</span>
            </div>
            
            <div v-if="activeTab === 'usuarios'" class="flex items-center justify-between p-4 bg-emerald-500/20 rounded-2xl border border-emerald-500/20">
              <span class="text-sm font-medium text-emerald-100">Usuarios creados</span>
              <span class="text-xl font-black text-emerald-400">{{ results.creados }}</span>
            </div>
            
            <div v-if="activeTab === 'inscripciones'" class="flex items-center justify-between p-4 bg-emerald-500/20 rounded-2xl border border-emerald-500/20">
              <span class="text-sm font-medium text-emerald-100">Inscritos</span>
              <span class="text-xl font-black text-emerald-400">{{ results.inscritos }}</span>
            </div>

            <div v-if="activeTab === 'ponentes'" class="flex items-center justify-between p-4 bg-emerald-500/20 rounded-2xl border border-emerald-500/20">
              <span class="text-sm font-medium text-emerald-100">Ponentes Asignados</span>
              <span class="text-xl font-black text-emerald-400">{{ results.asignados }}</span>
            </div>

            <div class="flex items-center justify-between p-4 bg-amber-500/20 rounded-2xl border border-amber-500/20">
              <span class="text-sm font-medium text-amber-100">Omitidos (Duplicados)</span>
              <span class="text-xl font-black text-amber-400">{{ results.omitidos }}</span>
            </div>

            <div class="flex items-center justify-between p-4 bg-red-500/20 rounded-2xl border border-red-500/20">
              <span class="text-sm font-medium text-red-100">Errores</span>
              <span class="text-xl font-black text-red-400">{{ results.errores }}</span>
            </div>

            <div class="flex items-center justify-between p-4 bg-blue-500/20 rounded-2xl border border-blue-500/20">
              <span class="text-sm font-medium text-blue-100">Advertencias correo</span>
              <span class="text-xl font-black text-blue-400">{{ results.advertenciasCorreo }}</span>
            </div>
          </div>

          <div v-else class="flex flex-col items-center justify-center py-12 text-slate-500">
            <span class="material-symbols-outlined text-4xl mb-2">query_stats</span>
            <p class="text-sm font-bold">Esperando archivo...</p>
          </div>
        </div>

        <div class="bg-white dark:bg-[#0d0d14] rounded-3xl border border-slate-200 dark:border-white/5 p-8">
          <h3 class="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">Instrucciones</h3>
          <ul class="space-y-4">
            <li class="flex gap-3">
              <div class="flex-shrink-0 w-6 h-6 rounded-full bg-umsa-blue/10 text-umsa-blue flex items-center justify-center text-[10px] font-black">1</div>
              <p class="text-xs text-slate-600 dark:text-slate-400 font-medium">Descarga la plantilla Excel correspondiente a la pestaña seleccionada.</p>
            </li>
            <li class="flex gap-3">
              <div class="flex-shrink-0 w-6 h-6 rounded-full bg-umsa-blue/10 text-umsa-blue flex items-center justify-center text-[10px] font-black">2</div>
              <p class="text-xs text-slate-600 dark:text-slate-400 font-medium">Completa los datos. No modifiques los encabezados de las columnas.</p>
            </li>
            <li class="flex gap-3">
              <div class="flex-shrink-0 w-6 h-6 rounded-full bg-umsa-blue/10 text-umsa-blue flex items-center justify-center text-[10px] font-black">3</div>
              <p class="text-xs text-slate-600 dark:text-slate-400 font-medium">Sube el archivo y revisa la previsualización.</p>
            </li>
            <li class="flex gap-3">
              <div class="flex-shrink-0 w-6 h-6 rounded-full bg-umsa-blue/10 text-umsa-blue flex items-center justify-center text-[10px] font-black">4</div>
              <p class="text-xs text-slate-600 dark:text-slate-400 font-medium">Inicia el proceso y descarga los resultados si es necesario.</p>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Modal de Previsualización de Plantilla -->
    <div v-if="showPreviewModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div class="bg-white dark:bg-[#1a1a24] w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-white/10 flex flex-col max-h-[90vh]">
        <div class="p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-black/20">
          <h3 class="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
            <span class="material-symbols-outlined text-blue-500">visibility</span>
            Previsualización de Correo
          </h3>
          <button @click="showPreviewModal = false" class="w-10 h-10 rounded-full hover:bg-slate-200 dark:hover:bg-white/10 flex items-center justify-center transition-all">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        <div class="flex-1 overflow-y-auto bg-slate-100 dark:bg-black/40 p-4 md:p-8">
          <div class="bg-white rounded-xl shadow-sm overflow-hidden mx-auto max-w-[600px] border border-slate-200">
            <div v-html="previewTemplateHtml" class="mail-preview-content"></div>
          </div>
        </div>
        <div class="p-4 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-black/20 text-center">
          <p class="text-[10px] text-slate-400 font-medium">※ Los datos mostrados (Juan Perez, etc.) son solo para fines de previsualización.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-in {
  animation: animate-in 0.5s ease-out;
}

@keyframes animate-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.material-symbols-outlined {
  font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
}

/* Scrollbar styling */
.overflow-x-auto::-webkit-scrollbar {
  height: 6px;
}
.overflow-x-auto::-webkit-scrollbar-track {
  background: transparent;
}
.overflow-x-auto::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.2);
  border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 5px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.2);
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(148, 163, 184, 0.4);
}
</style>
