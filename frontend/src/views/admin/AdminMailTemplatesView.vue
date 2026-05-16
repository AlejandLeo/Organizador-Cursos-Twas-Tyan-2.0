<script setup lang="ts">
import { ref, onMounted } from 'vue';
import api from '@/services/api';
import Swal from 'sweetalert2';

// ── Tabs ───────────────────────────────────────────────────────────────────
const activeTab = ref<'plantillas' | 'auditoria'>('plantillas');

// ── Plantillas State ───────────────────────────────────────────────────────
const templates = ref<any[]>([]);
const isLoading = ref(false);
const isEditing = ref(false);
const showModal = ref(false);
const showPreviewModal = ref(false);
const previewHtml = ref('');
const previewName = ref('');

const currentTemplate = ref({
  id: null as number | null,
  nombre: '',
  descripcion: '',
  asunto: '',
  cuerpo: '',
  tipo: 'WELCOME'
});

// ── Auditoría State ────────────────────────────────────────────────────────
const auditData = ref<any>(null);
const isLoadingAudit = ref(false);

const fetchTemplates = async () => {
  try {
    isLoading.value = true;
    const res = await api.get('/admin/mail-templates');
    templates.value = res.data;
  } catch (e) {
    console.error(e);
  } finally {
    isLoading.value = false;
  }
};

const fetchAudit = async () => {
  try {
    isLoadingAudit.value = true;
    const res = await api.get('/admin/configuracion/mail-audit');
    auditData.value = res.data;
  } catch (e) {
    console.error('Error loading audit data', e);
  } finally {
    isLoadingAudit.value = false;
  }
};

onMounted(() => {
  fetchTemplates();
  fetchAudit();
});

// ── Preview ────────────────────────────────────────────────────────────────
const openDefaultPreview = async () => {
  previewHtml.value = '';
  previewName.value = 'admission.hbs (Plantilla por Defecto)';
  try {
    const res = await api.get('/admin/mail-templates/default-preview');
    previewHtml.value = res.data?.html || '<p>No se pudo cargar.</p>';
  } catch {
    previewHtml.value = '<p style="color:red">Error al cargar admission.hbs</p>';
  }
  showPreviewModal.value = true;
};

const openCustomPreview = async (t: any) => {
  previewHtml.value = '';
  previewName.value = t.nombre;
  try {
    const resLayout = await api.get('/admin/configuracion/key/MAIL_MASTER_LAYOUT');
    const resUrl    = await api.get('/admin/configuracion/key/SYSTEM_URL');
    const masterLayout = resLayout.data?.valor || '<html><body>{{{content}}}</body></html>';
    const systemUrl    = resUrl.data?.valor    || window.location.origin;
    const ctx: Record<string, string | number> = {
      nombre: 'Juan', apellidos: 'Pérez', email: 'ejemplo@correo.com',
      password: 'Contraseña123', actividad: 'Curso de Especialización',
      evento: 'Congreso Internacional 2026', url_sistema: systemUrl, loginUrl: systemUrl,
      year: new Date().getFullYear(),
    };
    let html = (t.cuerpo || '').replace(/\n/g, '<br>');
    Object.keys(ctx).forEach(k => { html = html.replace(new RegExp(`{{${k}}}`, 'g'), String(ctx[k])); });
    previewHtml.value = masterLayout.replace('{{{content}}}', html).replace('{{year}}', String(new Date().getFullYear()));
  } catch {
    previewHtml.value = '<p style="color:red">Error al renderizar.</p>';
  }
  showPreviewModal.value = true;
};

// ── Download ───────────────────────────────────────────────────────────────
const downloadHtml = (filename: string, html: string) => {
  const blob = new Blob([html], { type: 'text/html' });
  const url  = window.URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
};

// ── CRUD ───────────────────────────────────────────────────────────────────
const openCreate = () => {
  currentTemplate.value = { id: null, nombre: '', descripcion: '', asunto: '', cuerpo: '', tipo: 'WELCOME' };
  isEditing.value = false;
  showModal.value = true;
};

const openEdit = (t: any) => {
  currentTemplate.value = { ...t };
  isEditing.value = true;
  showModal.value = true;
};

const save = async () => {
  try {
    if (isEditing.value) {
      await api.patch(`/admin/mail-templates/${currentTemplate.value.id}`, currentTemplate.value);
    } else {
      await api.post('/admin/mail-templates', currentTemplate.value);
    }
    Swal.fire('Éxito', 'Plantilla guardada correctamente', 'success');
    showModal.value = false;
    fetchTemplates();
  } catch (e: any) {
    Swal.fire('Error', e.response?.data?.message || 'Error al guardar', 'error');
  }
};

const deleteTemplate = async (id: number) => {
  const result = await Swal.fire({
    title: '¿Estás seguro?',
    text: 'Esta acción no se puede deshacer',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    confirmButtonText: 'Sí, eliminar'
  });
  if (result.isConfirmed) {
    try {
      await api.delete(`/admin/mail-templates/${id}`);
      Swal.fire('Eliminado', 'La plantilla ha sido eliminada', 'success');
      fetchTemplates();
    } catch {
      Swal.fire('Error', 'No se pudo eliminar', 'error');
    }
  }
};

// ── Helpers ────────────────────────────────────────────────────────────────
const getTipoColor = (tipo: string) => {
  switch (tipo) {
    case 'WELCOME':     return 'bg-blue-500/20 text-blue-500 border-blue-500/20';
    case 'ENROLLMENT':  return 'bg-emerald-500/20 text-emerald-500 border-emerald-500/20';
    case 'CERTIFICATE': return 'bg-amber-500/20 text-amber-500 border-amber-500/20';
    default:            return 'bg-slate-500/20 text-slate-500 border-slate-500/20';
  }
};

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'enviado':
    case 'sent':         return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30';
    case 'cancelado':
    case 'cancelled':    return 'bg-red-500/10 text-red-500 border-red-500/30';
    case 'fallido':
    case 'failed':       return 'bg-amber-500/10 text-amber-500 border-amber-500/30';
    case 'paused_quota': return 'bg-blue-500/10 text-blue-500 border-blue-500/30';
    default:             return 'bg-slate-500/10 text-slate-500 border-slate-500/30';
  }
};

const getStatusIcon = (status: string) => {
  switch (status.toLowerCase()) {
    case 'enviado':
    case 'sent':         return 'check_circle';
    case 'cancelado':
    case 'cancelled':    return 'cancel';
    case 'fallido':
    case 'failed':       return 'warning';
    case 'paused_quota': return 'pause_circle';
    default:             return 'help';
  }
};
</script>

<template>
  <div class="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

    <!-- Header & Tabs -->
    <div class="flex flex-col gap-6">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <div class="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <span class="material-symbols-outlined text-white text-2xl">mail</span>
          </div>
          <div>
            <h1 class="text-3xl font-black text-slate-800 dark:text-white tracking-tight">Correos del Sistema</h1>
            <p class="text-slate-500 dark:text-slate-400 font-medium text-sm">Gestiona plantillas y monitorea la cola de envíos</p>
          </div>
        </div>
        <button v-if="activeTab === 'plantillas'" @click="openCreate"
                class="flex items-center gap-2 px-6 py-3 bg-umsa-blue text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:-translate-y-1 transition-all">
          <span class="material-symbols-outlined text-[18px]">add</span>
          Nueva Plantilla
        </button>
        <button v-if="activeTab === 'auditoria'" @click="fetchAudit"
                class="flex items-center gap-2 px-6 py-3 bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-white/10 transition-all border border-slate-200 dark:border-white/10">
          <span class="material-symbols-outlined text-[18px]">refresh</span>
          Actualizar
        </button>
      </div>

      <!-- Tab Selector -->
      <div class="flex bg-slate-100 dark:bg-white/5 p-1 rounded-2xl border border-slate-200 dark:border-white/10 w-fit">
        <button 
          @click="activeTab = 'plantillas'"
          :class="[activeTab === 'plantillas' ? 'bg-white dark:bg-white/10 shadow-sm text-umsa-blue dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300']"
          class="px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2"
        >
          <span class="material-symbols-outlined text-[18px]">dashboard</span>
          Gestión de Plantillas
        </button>
        <button 
          @click="activeTab = 'auditoria'"
          :class="[activeTab === 'auditoria' ? 'bg-white dark:bg-white/10 shadow-sm text-umsa-blue dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300']"
          class="px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2"
        >
          <span class="material-symbols-outlined text-[18px]">history</span>
          Auditoría de Envíos
        </button>
      </div>
    </div>

    <!-- ======================================================================= -->
    <!-- TABS CONTENT: PLANTILLAS                                                -->
    <!-- ======================================================================= -->
    <template v-if="activeTab === 'plantillas'">
      <!-- Plantilla por defecto (admission.hbs) — solo lectura -->
      <div class="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-6 border border-white/10 shadow-xl relative overflow-hidden">
        <div class="absolute -right-10 -top-10 w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>
        <div class="flex items-start justify-between gap-4">
          <div>
            <div class="flex items-center gap-2 mb-2">
              <span class="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border bg-blue-500/20 text-blue-300 border-blue-500/20">WELCOME · Default</span>
              <span class="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border bg-amber-500/10 text-amber-400 border-amber-500/20">Solo Lectura</span>
            </div>
            <h3 class="text-lg font-black text-white mb-1">admission.hbs</h3>
            <p class="text-sm text-slate-400">Plantilla por defecto del sistema para bienvenida y aprobación de cuentas. No es editable desde este panel.</p>
          </div>
          <div class="flex gap-2 shrink-0">
            <button @click="openDefaultPreview"
                    class="flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition-all border border-white/10">
              <span class="material-symbols-outlined text-[16px]">visibility</span>
              Previsualizar
            </button>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="isLoading" class="flex justify-center py-20">
        <div class="animate-spin w-10 h-10 border-4 border-umsa-blue border-t-transparent rounded-full"></div>
      </div>

      <!-- Empty -->
      <div v-else-if="templates.length === 0" class="bg-white dark:bg-white/5 rounded-3xl p-16 text-center border border-slate-200 dark:border-white/10">
        <span class="material-symbols-outlined text-6xl text-slate-300 mb-4 block">mail_outline</span>
        <p class="text-slate-500 font-bold">No hay plantillas personalizadas creadas todavía.</p>
      </div>

      <!-- Grid de plantillas custom -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div v-for="t in templates" :key="t.id"
             class="bg-white dark:bg-[#0d0d14] rounded-3xl border border-slate-200 dark:border-white/5 p-6 shadow-xl shadow-slate-200/50 dark:shadow-none hover:border-umsa-blue/30 transition-all group flex flex-col">
          <div class="flex justify-between items-start mb-4">
            <span :class="getTipoColor(t.tipo)" class="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border">
              {{ t.tipo }}
            </span>
            <div class="flex gap-1">
              <button @click="openCustomPreview(t)" class="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-500/10 rounded-xl transition-all" title="Previsualizar">
                <span class="material-symbols-outlined text-[18px]">visibility</span>
              </button>
              <button @click="openEdit(t)" class="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-500/10 rounded-xl transition-all" title="Editar">
                <span class="material-symbols-outlined text-[18px]">edit</span>
              </button>
              <button @click="deleteTemplate(t.id)" class="p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all" title="Eliminar">
                <span class="material-symbols-outlined text-[18px]">delete</span>
              </button>
            </div>
          </div>
          <h3 class="text-lg font-black text-slate-800 dark:text-white mb-1">{{ t.nombre }}</h3>
          <p class="text-xs text-slate-500 mb-4 line-clamp-2 flex-1">{{ t.descripcion || 'Sin descripción' }}</p>
          <div class="pt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            <span>{{ new Date(t.fecha_creacion).toLocaleDateString() }}</span>
            <span>{{ t.asunto?.slice(0, 30) || '—' }}</span>
          </div>
        </div>
      </div>
    </template>

    <!-- ======================================================================= -->
    <!-- TABS CONTENT: AUDITORÍA                                                 -->
    <!-- ======================================================================= -->
    <template v-else-if="activeTab === 'auditoria'">
      <div v-if="isLoadingAudit" class="flex justify-center py-20">
        <div class="animate-spin w-10 h-10 border-4 border-umsa-blue border-t-transparent rounded-full"></div>
      </div>
      <div v-else-if="auditData" class="space-y-6">
        
        <!-- Info Cola con Fallos (si existen) -->
        <div v-if="auditData.colaFallidos?.length > 0" class="bg-amber-50 dark:bg-amber-500/10 rounded-3xl p-6 border border-amber-200 dark:border-amber-500/20">
          <div class="flex items-center gap-3 mb-4">
            <span class="material-symbols-outlined text-amber-500">warning</span>
            <h3 class="text-amber-800 dark:text-amber-400 font-black">Problemas en la Cola ({{ auditData.colaFallidos.length }})</h3>
          </div>
          <p class="text-xs text-amber-700 dark:text-amber-300/80 font-medium mb-4">
            Estos correos superaron el máximo de {{ auditData.maxIntentos }} intentos y han sido CANCELADOS, o están fallando actualmente.
          </p>
          <div class="overflow-x-auto rounded-xl border border-amber-200/50 dark:border-amber-500/20 bg-white dark:bg-black/20">
            <table class="w-full text-left text-xs">
              <thead class="bg-amber-100/50 dark:bg-amber-500/10 text-amber-900 dark:text-amber-200 font-bold">
                <tr>
                  <th class="px-4 py-3">Destinatario</th>
                  <th class="px-4 py-3">Estado</th>
                  <th class="px-4 py-3">Intentos</th>
                  <th class="px-4 py-3">Último Error</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-amber-100 dark:divide-amber-500/10 text-amber-900 dark:text-amber-100/80">
                <tr v-for="cf in auditData.colaFallidos" :key="cf.id">
                  <td class="px-4 py-3">{{ cf.destinatario }}</td>
                  <td class="px-4 py-3 font-bold">{{ cf.estado }}</td>
                  <td class="px-4 py-3 text-center">{{ cf.intentos }}</td>
                  <td class="px-4 py-3 max-w-xs truncate" :title="cf.ultimo_error">{{ cf.ultimo_error }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Tabla general de Historial de Mail Logs -->
        <div class="bg-white dark:bg-[#0d0d14] rounded-3xl border border-slate-200 dark:border-white/5 shadow-xl p-8">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
              <span class="material-symbols-outlined text-umsa-blue">history_edu</span>
              Historial de Envíos ({{ auditData.totalLogs }})
            </h3>
          </div>
          <div class="overflow-x-auto rounded-2xl border border-slate-200 dark:border-white/10">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-50 dark:bg-white/5 text-slate-500 font-black uppercase tracking-wider">
                <tr>
                  <th class="px-4 py-3">Fecha</th>
                  <th class="px-4 py-3">Destinatario</th>
                  <th class="px-4 py-3">Asunto</th>
                  <th class="px-4 py-3">Estado</th>
                  <th class="px-4 py-3">Detalle</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-white/5">
                <tr v-for="log in auditData.logs" :key="log.id" class="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-slate-600 dark:text-slate-300">
                  <td class="px-4 py-3 font-medium whitespace-nowrap">{{ new Date(log.fecha_creacion).toLocaleString() }}</td>
                  <td class="px-4 py-3">{{ log.destinatario }}</td>
                  <td class="px-4 py-3">{{ log.asunto }}</td>
                  <td class="px-4 py-3">
                    <span :class="getStatusColor(log.estado)" class="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border flex items-center gap-1.5 w-fit">
                      <span class="material-symbols-outlined text-[14px]">{{ getStatusIcon(log.estado) }}</span>
                      {{ log.estado }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-[10px] max-w-xs truncate" :title="log.error || log.message_id || 'OK'">
                    {{ log.error ? 'Error: ' + log.error : (log.message_id ? 'MsgID: ' + log.message_id : '-') }}
                  </td>
                </tr>
                <tr v-if="!auditData.logs || auditData.logs.length === 0">
                  <td colspan="5" class="px-4 py-8 text-center text-slate-400 font-bold">No hay registros de envío todavía.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </template>

    <!-- ── Modal Crear/Editar ──────────────────────────────────────────────── -->
    <div v-if="showModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div class="bg-white dark:bg-[#1a1a24] w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] animate-in zoom-in duration-300">
        <div class="p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-black/20">
          <h3 class="text-xl font-black text-slate-800 dark:text-white">
            {{ isEditing ? 'Editar Plantilla' : 'Nueva Plantilla' }}
          </h3>
          <div class="flex items-center gap-2">
            <button v-if="isEditing" @click="openCustomPreview(currentTemplate)"
                    class="flex items-center gap-1.5 px-4 py-2 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all border border-slate-200 dark:border-white/10">
              <span class="material-symbols-outlined text-[16px]">visibility</span>
              Previsualizar
            </button>
            <button v-if="isEditing && currentTemplate.cuerpo" @click="downloadHtml(`${currentTemplate.nombre}.html`, currentTemplate.cuerpo)"
                    class="flex items-center gap-1.5 px-4 py-2 bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all">
              <span class="material-symbols-outlined text-[16px]">download</span>
              Descargar
            </button>
            <button @click="showModal = false" class="w-10 h-10 rounded-full hover:bg-slate-200 dark:hover:bg-white/10 flex items-center justify-center transition-all">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto p-8 space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-2">
              <label class="text-[11px] font-black text-slate-400 uppercase ml-2 tracking-widest">Nombre de la Plantilla</label>
              <input v-model="currentTemplate.nombre" type="text" placeholder="Ej: Bienvenida Curso IA"
                     class="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-3 text-sm outline-none focus:border-umsa-blue transition-all">
            </div>
            <div class="space-y-2">
              <label class="text-[11px] font-black text-slate-400 uppercase ml-2 tracking-widest">Tipo de Notificación</label>
              <select v-model="currentTemplate.tipo"
                      class="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-3 text-sm outline-none focus:border-umsa-blue transition-all">
                <option value="WELCOME">Registro al Sistema (Bienvenida)</option>
                <option value="ENROLLMENT">Inscripción a Evento</option>
                <option value="CERTIFICATE">Envío de Certificado</option>
                <option value="GENERAL">Mensaje General</option>
              </select>
            </div>
          </div>

          <div class="space-y-2">
            <label class="text-[11px] font-black text-slate-400 uppercase ml-2 tracking-widest">Descripción</label>
            <input v-model="currentTemplate.descripcion" type="text" placeholder="Descripción breve de cuándo se usa esta plantilla"
                   class="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-3 text-sm outline-none focus:border-umsa-blue transition-all">
          </div>

          <div class="space-y-2">
            <label class="text-[11px] font-black text-slate-400 uppercase ml-2 tracking-widest">Asunto del Correo (Subject)</label>
            <input v-model="currentTemplate.asunto" type="text" placeholder="Ej: ¡Bienvenido, {{nombre}}!"
                   class="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-3 text-sm outline-none focus:border-umsa-blue transition-all">
          </div>

          <div class="space-y-2">
            <label class="text-[11px] font-black text-slate-400 uppercase ml-2 tracking-widest flex items-center justify-between">
              Cuerpo del Mensaje (HTML)
              <span class="text-[9px] normal-case font-normal text-slate-400 italic">
                Variables: <code>{{nombre}}</code> <code>{{email}}</code> <code>{{password}}</code> <code>{{loginUrl}}</code> <code>{{actividad}}</code>
              </span>
            </label>
            <textarea v-model="currentTemplate.cuerpo" rows="14"
                      class="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-4 text-sm font-mono outline-none focus:border-umsa-blue transition-all"
                      placeholder="Escribe tu mensaje aquí. Puedes usar etiquetas HTML..."></textarea>
          </div>

          <!-- Info box variables -->
          <div class="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/20">
            <p class="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span class="material-symbols-outlined text-[16px]">info</span>
              Variables dinámicas disponibles
            </p>
            <div class="flex flex-wrap gap-3">
              <div v-for="v in ['{{nombre}}','{{apellidos}}','{{email}}','{{password}}','{{loginUrl}}','{{actividad}}','{{evento}}','{{url_sistema}}','{{year}}']" :key="v" class="flex flex-col gap-0.5">
                <code class="px-2 py-1 bg-white dark:bg-black/20 text-[11px] rounded border border-blue-200 text-blue-700 font-bold">{{ v }}</code>
              </div>
            </div>
          </div>
        </div>

        <div class="p-6 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-black/20 flex justify-end gap-3">
          <button @click="showModal = false" class="px-6 py-3 text-slate-500 font-black uppercase text-[10px] tracking-widest hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-all">
            Cancelar
          </button>
          <button @click="save" class="px-8 py-3 bg-umsa-blue text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:scale-105 transition-all">
            Guardar Plantilla
          </button>
        </div>
      </div>
    </div>

    <!-- ── Modal Previsualización ─────────────────────────────────────────── -->
    <div v-if="showPreviewModal" class="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-300">
      <div class="bg-white dark:bg-[#1a1a24] w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden border border-white/10 flex flex-col max-h-[92vh]">
        <div class="p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-black/20">
          <h3 class="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
            <span class="material-symbols-outlined text-blue-500">mark_email_read</span>
            Vista Previa — {{ previewName }}
          </h3>
          <div class="flex items-center gap-2">
            <button @click="downloadHtml(`${previewName}.html`, previewHtml)"
                    class="flex items-center gap-1.5 px-4 py-2 bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all">
              <span class="material-symbols-outlined text-[16px]">download</span>
              Descargar HTML
            </button>
            <button @click="showPreviewModal = false" class="w-10 h-10 rounded-full hover:bg-slate-200 dark:hover:bg-white/10 flex items-center justify-center transition-all">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>
        <div class="flex-1 overflow-y-auto bg-slate-100 dark:bg-black/40 p-4 md:p-8">
          <div class="bg-white rounded-xl shadow-sm overflow-hidden mx-auto max-w-[620px] border border-slate-200">
            <div v-html="previewHtml"></div>
          </div>
        </div>
        <div class="p-4 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-black/20 text-center">
          <p class="text-[10px] text-slate-400 font-medium">※ Los datos mostrados (Juan Pérez, etc.) son solo de ejemplo para previsualización.</p>
        </div>
      </div>
    </div>

  </div>
</template>
