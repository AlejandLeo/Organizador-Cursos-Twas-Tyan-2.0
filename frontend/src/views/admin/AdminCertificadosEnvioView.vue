<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { certificadosService } from '@/services/certificados.service';
import api from '@/services/api';
import Swal from 'sweetalert2';

const route = useRoute();

// ── Tabs ──────────────────────────────────────────────────────
const activeTab = ref<'trazabilidad' | 'emision' | 'auditoria'>('trazabilidad');

interface Certificado {
  id: number;
  codigo_certificado: string;
  estado_envio?: string;
  fecha_ultimo_envio?: string | null;
  log_error_envio?: string | null;
  reintentos?: number;
  usuario?: {
    id: number;
    email: string;
    persona: {
      nombres: string;
      primer_apellido: string;
    }
  };
  actividadAcademica?: {
    id: number;
    nombre: string;
    evento: {
      id: number;
      nombre: string;
      fase: number;
      estado: number;
    }
  }
}

// ── Estado principal ──────────────────────────────────────────
const certificados = ref<Certificado[]>([]);
const listEventos = ref<any[]>([]);
const selectedEventId = ref<number | null>(null);

const isLoading = ref(true);
const isSending = ref(false);
const isSendingEvent = ref(false);
const isRetryingAll = ref(false);
const selectedIds = ref<number[]>([]);
const filterEvent = ref('');
const filterStatus = ref('');

// ── Estado de Auditoría de Correos ────────────────────────────
const isStatsLoading = ref(false);
const statsData = ref({ total: 0, pendientes: 0, enviados: 0, fallidos: 0, pausados: 0, cancelados: 0 });
const auditData = ref({ logs: [] as any[], totalLogs: 0, colaFallidos: [] as any[], maxIntentos: 3 });

// ── Estado del modal de edición de email ──────────────────────
const showEmailModal = ref(false);
const emailModalCert = ref<Certificado | null>(null);
const emailModalValue = ref('');
const isSavingEmail = ref(false);

// ── Datos computados ──────────────────────────────────────────
const filteredCertificados = computed(() => {
  return certificados.value.filter(c => {
    // Filtrar por evento seleccionado en el select dropdown
    const matchEventSelected = !selectedEventId.value || c.actividadAcademica?.evento.id === selectedEventId.value;
    
    // Filtrar por texto de búsqueda libre
    const matchEvent = !filterEvent.value ||
      c.actividadAcademica?.evento.nombre.toLowerCase().includes(filterEvent.value.toLowerCase()) ||
      c.actividadAcademica?.nombre.toLowerCase().includes(filterEvent.value.toLowerCase());
      
    // Filtrar por estado
    const matchStatus = !filterStatus.value || c.estado_envio === filterStatus.value;
    
    return matchEventSelected && matchEvent && matchStatus;
  });
});

const totalFallidos = computed(() =>
  certificados.value.filter(c => c.estado_envio === 'error').length
);

// ── Carga de datos ────────────────────────────────────────────
const fetchCertificados = async () => {
  try {
    isLoading.value = true;
    const res = await certificadosService.adminGetAll();
    certificados.value = res.data;
  } catch {
    Swal.fire('Error', 'No se pudieron cargar los certificados', 'error');
  } finally {
    isLoading.value = false;
  }
};

const fetchEventos = async () => {
  try {
    const res = await api.get('/admin/eventos/lista?limit=1000');
    listEventos.value = res.data.data || [];
  } catch (error) {
    console.error('Error fetching events:', error);
  }
};

const fetchAuditoria = async () => {
  try {
    isStatsLoading.value = true;
    const [resStats, resAudit] = await Promise.all([
      api.get('/admin/configuracion/mail-stats'),
      api.get('/admin/configuracion/mail-audit'),
    ]);
    statsData.value = resStats.data;
    auditData.value = resAudit.data;
  } catch {
    Swal.fire('Error', 'No se pudieron cargar las estadísticas y logs de auditoría de correos', 'error');
  } finally {
    isStatsLoading.value = false;
  }
};

// ── Selección ─────────────────────────────────────────────────
const toggleSelectAll = (event: any) => {
  selectedIds.value = event.target.checked
    ? filteredCertificados.value.map(c => c.id)
    : [];
};

// ── Envío masivo (seleccionados) ──────────────────────────────
const handleSendMasivo = async () => {
  if (selectedIds.value.length === 0) return;

  const problematicos = certificados.value.filter(c => {
    if (!selectedIds.value.includes(c.id)) return false;
    const ev = c.actividadAcademica?.evento;
    return (ev?.fase || 0) < 4 && ev?.estado !== 0;
  });

  if (problematicos.length > 0) {
    Swal.fire({
      title: 'Acción Bloqueada',
      text: `${problematicos.length} certificados pertenecen a eventos aún no finalizados o activos.`,
      icon: 'warning',
      confirmButtonColor: '#0f172a',
    });
    return;
  }

  const result = await Swal.fire({
    title: '¿Iniciar envío masivo?',
    text: `Se encolarán ${selectedIds.value.length} certificados para envío en segundo plano.`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Sí, encolar envío',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#0f172a',
  });

  if (!result.isConfirmed) return;

  try {
    isSending.value = true;
    const res = await certificadosService.enviarMasivo(selectedIds.value);
    Swal.fire('¡Encolado!', res.data.mensaje, 'success');
    selectedIds.value = [];
    setTimeout(fetchCertificados, 2000);
  } catch (error: any) {
    let msg = error.response?.data?.message || 'Error al encolar el envío';
    if (Array.isArray(msg)) msg = msg.join(' | ');
    Swal.fire('Error', String(msg), 'error');
  } finally {
    isSending.value = false;
  }
};

// ── Envío Inteligente por Evento Completo ──────────────────────
const handleEnviarTodoElEvento = async () => {
  if (!selectedEventId.value) return;

  const eventoSeleccionado = listEventos.value.find(e => e.id === selectedEventId.value);
  const nombreEvento = eventoSeleccionado?.nombre || 'este evento';

  const result = await Swal.fire({
    title: '¿Generar y Enviar Todo el Evento?',
    text: `Se iniciará el motor inteligente de certificación para "${nombreEvento}". Se evaluará la elegibilidad de los estudiantes (calificación y asistencias), ponentes y personal de logística. Se generarán los certificados faltantes y se encolará su envío masivo de inmediato.`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Sí, procesar y enviar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#d97706',
  });

  if (!result.isConfirmed) return;

  try {
    isSendingEvent.value = true;
    const res = await certificadosService.enviarPorEvento(selectedEventId.value);
    Swal.fire({
      title: '¡Proceso en Marcha!',
      text: res.data.mensaje,
      icon: 'success',
      confirmButtonColor: '#0f172a'
    });
    setTimeout(fetchCertificados, 2000);
  } catch (error: any) {
    let msg = error.response?.data?.message || 'Error al procesar el envío por evento';
    if (Array.isArray(msg)) msg = msg.join(' | ');
    Swal.fire('Error', String(msg), 'error');
  } finally {
    isSendingEvent.value = false;
  }
};

// ── Reintentar TODOS los fallidos ─────────────────────────────
const handleReintentarFallidos = async () => {
  if (totalFallidos.value === 0) return;

  const result = await Swal.fire({
    title: `Reintentar ${totalFallidos.value} fallidos`,
    text: 'Se encolarán automáticamente todos los certificados con error para reintento.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, reintentar todos',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#dc2626',
  });

  if (!result.isConfirmed) return;

  try {
    isRetryingAll.value = true;
    const res = await certificadosService.reintentarFallidos();
    Swal.fire('¡Encolado!', res.data.mensaje, 'success');
    setTimeout(fetchCertificados, 2000);
  } catch (error: any) {
    let msg = error.response?.data?.message || 'Error al reintentar';
    if (Array.isArray(msg)) msg = msg.join(' | ');
    Swal.fire('Error', String(msg), 'error');
  } finally {
    isRetryingAll.value = false;
  }
};

// ── Reintento individual ──────────────────────────────────────
const reintentarUno = async (cert: Certificado) => {
  const ev = cert.actividadAcademica?.evento;
  if ((ev?.fase || 0) < 4 && ev?.estado !== 0) {
    Swal.fire('Atención', 'El evento asociado aún no está finalizado.', 'warning');
    return;
  }
  try {
    cert.estado_envio = 'procesando';
    const res = await certificadosService.reintentarEnvio(cert.id);
    Swal.fire('¡Encolado!', res.data.mensaje || 'El reintento fue encolado.', 'success');
    setTimeout(fetchCertificados, 2000);
  } catch (error: any) {
    let msg = error.response?.data?.message || 'No se pudo encolar el reintento';
    if (Array.isArray(msg)) msg = msg.join(' | ');
    Swal.fire('Error', String(msg), 'error');
    fetchCertificados();
  }
};

// ── Modal edición de email ────────────────────────────────────
const abrirEditarEmail = (cert: Certificado) => {
  emailModalCert.value = cert;
  emailModalValue.value = cert.usuario?.email || '';
  showEmailModal.value = true;
};

const cerrarEditarEmail = () => {
  showEmailModal.value = false;
  emailModalCert.value = null;
  emailModalValue.value = '';
};

const guardarEmail = async () => {
  if (!emailModalCert.value) return;
  const nuevoEmail = emailModalValue.value.trim();
  if (!nuevoEmail || !nuevoEmail.includes('@')) {
    Swal.fire('Email inválido', 'Por favor ingresa un correo electrónico válido.', 'warning');
    return;
  }

  try {
    isSavingEmail.value = true;
    if (!emailModalCert.value.usuario) return;
    await certificadosService.editarEmailUsuario(emailModalCert.value.usuario.id, nuevoEmail);
    emailModalCert.value.usuario.email = nuevoEmail;
    cerrarEditarEmail();
    Swal.fire({
      icon: 'success',
      title: 'Email actualizado',
      text: 'El correo fue corregido. Ahora puede reintentar el envío.',
      timer: 2500,
      showConfirmButton: false,
    });
  } catch (error: any) {
    let msg = error.response?.data?.message || 'No se pudo actualizar el email';
    if (Array.isArray(msg)) msg = msg.join(' | ');
    Swal.fire('Error', String(msg), 'error');
  } finally {
    isSavingEmail.value = false;
  }
};

// ── Ver detalle de error ──────────────────────────────────────
const verError = (log: string) => {
  Swal.fire({
    title: 'Detalle del Error',
    html: `<pre style="text-align:left;font-size:12px;white-space:pre-wrap;word-break:break-all;background:#1e293b;color:#f1f5f9;padding:16px;border-radius:8px;">${log}</pre>`,
    icon: 'error',
    confirmButtonColor: '#ef4444',
    width: '560px',
  });
};

// ══════════════════════════════════════════════════════════
//  MAIL TRACE MODAL
// ══════════════════════════════════════════════════════════
const showTraceModal = ref(false);
const traceData = ref<any>(null);
const traceLoading = ref(false);

const abrirMailTrace = async (certId: number) => {
  traceLoading.value = true;
  showTraceModal.value = true;
  traceData.value = null;
  try {
    const res = await certificadosService.getMailTrace(certId);
    traceData.value = res.data;
  } catch {
    Swal.fire('Error', 'No se pudo obtener la traza de envío.', 'error');
    showTraceModal.value = false;
  } finally {
    traceLoading.value = false;
  }
};

// ══════════════════════════════════════════════════════════
//  EMISIÓN MASIVA POR TIPO
// ══════════════════════════════════════════════════════════
const emisionTipo = ref(1);
const emisionEventos = ref<any[]>([]);
const emisionEventoId = ref<number | null>(null);
const emisionActividades = ref<any[]>([]);
const emisionActividadId = ref<number | null>(null);
const emisionCandidatos = ref<any[]>([]);
const emisionSelectedIds = ref<number[]>([]);
const emisionLoading = ref(false);
const emisionFirma = ref('');
const emisionInfoCerts = ref<any[]>([]);
const emisionInfoCertId = ref<number | null>(null);

const tipoLabels: Record<number, string> = { 1: 'Asistentes (Inscripciones)', 2: 'Expositores (Imparticiones)', 3: 'Logística (Apoyo)', 4: 'Docentes' };

const fetchEmisionEventos = async () => {
  try {
    const res = await api.get('/eventos');
    emisionEventos.value = Array.isArray(res.data) ? res.data : res.data.data || [];
  } catch { emisionEventos.value = []; }
};

const fetchEmisionActividades = async () => {
  if (!emisionEventoId.value) { emisionActividades.value = []; return; }
  try {
    const res = await api.get(`/admin/eventos/${emisionEventoId.value}/actividades-academicas`);
    emisionActividades.value = res.data || [];
    emisionActividadId.value = null;
    emisionCandidatos.value = [];
  } catch { emisionActividades.value = []; }
};

const fetchEmisionInfoCerts = async () => {
  if (!emisionEventoId.value) return;
  try {
    const res = await api.get(`/info-certificados/evento/${emisionEventoId.value}`);
    emisionInfoCerts.value = Array.isArray(res.data) ? res.data : [];
  } catch { emisionInfoCerts.value = []; }
};

const fetchCandidatos = async () => {
  emisionLoading.value = true;
  try {
    const res = await certificadosService.getCandidatos(
      emisionTipo.value,
      emisionActividadId.value || undefined,
      emisionEventoId.value || undefined,
    );
    emisionCandidatos.value = res.data?.candidatos || [];
    emisionSelectedIds.value = [];
  } catch (error: any) {
    console.error('Error fetching candidates:', error);
    const detail = error.response?.data?.message || error.message || 'Error desconocido';
    Swal.fire('Error', `No se pudieron cargar los candidatos: ${Array.isArray(detail) ? detail.join(', ') : detail}`, 'error');
    emisionCandidatos.value = [];
  }
  emisionLoading.value = false;
};

const handleEmitirLote = async () => {
  const sinCert = emisionCandidatos.value.filter(c => emisionSelectedIds.value.includes(c.id) && !c.yaTieneCertificado);
  if (sinCert.length === 0) {
    Swal.fire('Atención', 'No hay candidatos seleccionados sin certificado previo.', 'warning');
    return;
  }
  if (!emisionInfoCertId.value) {
    Swal.fire('Atención', 'Selecciona una plantilla de certificado.', 'warning');
    return;
  }
  const result = await Swal.fire({
    title: `Emitir ${sinCert.length} certificados?`,
    text: `Tipo: ${tipoLabels[emisionTipo.value]}`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Emitir',
    confirmButtonColor: '#0f172a',
  });
  if (!result.isConfirmed) return;

  try {
    emisionLoading.value = true;
    const res = await certificadosService.emitirLoteTipo({
      id_info_certificado: emisionInfoCertId.value,
      id_actividad_academica: emisionActividadId.value || undefined,
      id_evento: emisionEventoId.value || undefined,
      tipo: emisionTipo.value,
      personasIds: sinCert.map(c => c.id),
      firma: emisionFirma.value || 'Firma Digital',
    });
    Swal.fire('¡Éxito!', res.data.mensaje, 'success');
    fetchCandidatos();
    fetchCertificados();
  } catch (err: any) {
    Swal.fire('Error', err.response?.data?.message || 'Error al emitir certificados', 'error');
  } finally {
    emisionLoading.value = false;
  }
};

const toggleEmisionSelectAll = (event: any) => {
  emisionSelectedIds.value = event.target.checked
    ? emisionCandidatos.value.filter(c => !c.yaTieneCertificado).map(c => c.id)
    : [];
};

onMounted(() => {
  if (route.query.search) {
    filterEvent.value = String(route.query.search);
  }
  fetchCertificados();
  fetchEmisionEventos();
});
</script>

<template>
  <div class="space-y-6 animate-in fade-in duration-500">

    <!-- HEADER -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-3 mb-2">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-800 to-slate-950 flex items-center justify-center shadow-lg shadow-slate-900/50">
            <span class="material-symbols-outlined text-white text-[22px]">workspace_premium</span>
          </div>
          <div>
            <p class="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Panel de Control</p>
            <h1 class="text-2xl font-black text-slate-800 dark:text-white tracking-tight uppercase italic">Certificados</h1>
          </div>
        </div>
        <p class="text-slate-500 text-sm ml-1">Emisión, envío y trazabilidad de certificados del sistema.</p>
      </div>

      <div class="flex items-center gap-2 flex-wrap justify-end">
        <!-- Refrescar -->
        <button @click="activeTab === 'trazabilidad' ? fetchCertificados() : fetchAuditoria()"
                class="p-3 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl text-slate-600 dark:text-gray-400 hover:bg-slate-50 transition-all shadow-sm"
                title="Refrescar vista actual">
          <span class="material-symbols-outlined" :class="{'animate-spin': isLoading || isStatsLoading}">refresh</span>
        </button>

        <template v-if="activeTab === 'trazabilidad'">
          <!-- Reintentar TODOS los fallidos -->
          <button @click="handleReintentarFallidos"
                  :disabled="totalFallidos === 0 || isRetryingAll"
                  :class="totalFallidos === 0 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-rose-700'"
                  class="flex items-center gap-2 px-4 py-3 bg-rose-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest transition-all disabled:grayscale shadow-sm">
            <span class="material-symbols-outlined text-[18px]">{{ isRetryingAll ? 'progress_activity' : 'replay' }}</span>
            Reintentar Fallidos
            <span v-if="totalFallidos > 0" class="bg-white/20 px-1.5 py-0.5 rounded-full text-[9px]">{{ totalFallidos }}</span>
          </button>

          <!-- Enviar seleccionados -->
          <button @click="handleSendMasivo"
                  :disabled="selectedIds.length === 0 || isSending"
                  :class="selectedIds.length === 0 ? 'opacity-50 grayscale' : 'hover:bg-slate-900 shadow-xl shadow-slate-900/20'"
                  class="flex items-center gap-2 px-5 py-3 bg-slate-800 text-white rounded-xl font-black uppercase text-[10px] tracking-widest transition-all shadow-sm">
            <span class="material-symbols-outlined text-[18px]">{{ isSending ? 'progress_activity' : 'send' }}</span>
            {{ isSending ? 'Encolando...' : `Enviar (${selectedIds.length})` }}
          </button>
        </template>
      </div>
    </div>

    <!-- TAB NAVIGATION -->
    <div class="flex gap-2">
      <button @click="activeTab = 'trazabilidad'" :class="activeTab === 'trazabilidad' ? 'bg-slate-800 text-white shadow-lg shadow-slate-900/20' : 'bg-white dark:bg-gray-900 text-slate-500 border border-slate-200 dark:border-gray-800 hover:bg-slate-50'" class="flex items-center gap-2 px-5 py-3 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all">
        <span class="material-symbols-outlined text-sm">mail</span>
        Trazabilidad y Envío
      </button>
      <button @click="activeTab = 'emision'" :class="activeTab === 'emision' ? 'bg-slate-800 text-white shadow-lg shadow-slate-900/20' : 'bg-white dark:bg-gray-900 text-slate-500 border border-slate-200 dark:border-gray-800 hover:bg-slate-50'" class="flex items-center gap-2 px-5 py-3 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all">
        <span class="material-symbols-outlined text-sm">add_circle</span>
        Emisión Masiva
      </button>
      <button @click="activeTab = 'auditoria'; fetchAuditoria()" :class="activeTab === 'auditoria' ? 'bg-slate-800 text-white shadow-lg shadow-slate-900/20' : 'bg-white dark:bg-gray-900 text-slate-500 border border-slate-200 dark:border-gray-800 hover:bg-slate-50'" class="flex items-center gap-2 px-5 py-3 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all">
        <span class="material-symbols-outlined text-sm">analytics</span>
        Auditoría SMTP
      </button>
    </div>

    <!-- TAB: TRAZABILIDAD -->
    <div v-if="activeTab === 'trazabilidad'" class="space-y-6 animate-in fade-in duration-300">


      <!-- FILTROS DE BÚSQUEDA LIBRE -->
      <div class="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm">
        <div class="flex flex-wrap items-center gap-4">
          <div class="flex-1 min-w-[250px] relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-[20px]">search</span>
            <input v-model="filterEvent" type="text" placeholder="Buscar por evento o actividad..."
                   class="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-gray-800/50 border border-slate-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:border-slate-400 transition-all" />
          </div>
          <select v-model="filterStatus"
                  class="px-4 py-2.5 bg-slate-50 dark:bg-gray-800/50 border border-slate-200 dark:border-gray-700 rounded-xl text-xs font-bold uppercase outline-none cursor-pointer">
            <option value="">Todos los estados</option>
            <option value="pendiente">Pendiente</option>
            <option value="enviado">Enviado</option>
            <option value="error">Con Error</option>
            <option value="procesando">Procesando</option>
          </select>
        </div>
      </div>

      <!-- TABLA DE CERTIFICADOS -->
      <div class="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-[2rem] overflow-hidden shadow-sm">
        <div v-if="isLoading" class="flex justify-center items-center py-20">
          <span class="material-symbols-outlined animate-spin text-3xl text-slate-400">progress_activity</span>
        </div>
        <div v-else class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-slate-50 dark:bg-gray-800/50 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-gray-800">
                <th class="px-6 py-4 w-10">
                  <input type="checkbox" @change="toggleSelectAll"
                         :checked="selectedIds.length === filteredCertificados.length && filteredCertificados.length > 0"
                         class="w-4 h-4 rounded border-slate-300 cursor-pointer" />
                </th>
                <th class="px-6 py-4">Usuario / Email</th>
                <th class="px-6 py-4">Evento / Actividad</th>
                <th class="px-6 py-4 text-center">Estado</th>
                <th class="px-6 py-4">Último Intento</th>
                <th class="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50 dark:divide-gray-800">
              <tr v-for="cert in filteredCertificados" :key="cert.id"
                  class="hover:bg-slate-50/50 dark:hover:bg-gray-800/30 transition-colors group">

                <!-- Checkbox -->
                <td class="px-6 py-4">
                  <input type="checkbox" v-model="selectedIds" :value="cert.id"
                         class="w-4 h-4 rounded border-slate-300 cursor-pointer" />
                </td>

                <!-- Usuario -->
                <td class="px-6 py-4">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full bg-slate-100 dark:bg-gray-800 text-slate-600 flex items-center justify-center font-black text-xs flex-shrink-0">
                      {{ cert.usuario?.persona?.nombres?.charAt(0) || '?' }}
                    </div>
                    <div class="min-w-0">
                      <p class="text-sm font-bold text-slate-800 dark:text-white truncate">
                        {{ cert.usuario?.persona?.nombres }} {{ cert.usuario?.persona?.primer_apellido }}
                      </p>
                      <p class="text-[10px] text-slate-500 font-medium truncate">{{ cert.usuario?.email }}</p>
                    </div>
                  </div>
                </td>

                <!-- Evento -->
                <td class="px-6 py-4">
                  <p class="text-[10px] font-black text-slate-400 uppercase tracking-tighter flex items-center gap-1">
                    {{ cert.actividadAcademica?.evento.nombre }}
                    <span v-if="(cert.actividadAcademica?.evento.fase || 0) < 4 && cert.actividadAcademica?.evento.estado !== 0"
                          class="text-[8px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-black">
                      No Finalizado
                    </span>
                  </p>
                  <p class="text-xs font-bold text-slate-700 dark:text-gray-300 mt-0.5">{{ cert.actividadAcademica?.nombre }}</p>
                </td>

                <!-- Estado -->
                <td class="px-6 py-4 text-center">
                  <div class="flex flex-col items-center gap-1">
                    <span :class="{
                      'bg-amber-50 text-amber-600 border-amber-200': cert.estado_envio === 'pendiente',
                      'bg-emerald-50 text-emerald-600 border-emerald-200': cert.estado_envio === 'enviado',
                      'bg-rose-50 text-rose-600 border-rose-200': cert.estado_envio === 'error',
                      'bg-slate-100 text-slate-500 border-slate-200 animate-pulse': cert.estado_envio === 'procesando',
                    }" class="px-2.5 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-widest">
                      {{ cert.estado_envio }}
                    </span>
                    <span v-if="(cert.reintentos || 0) > 0" class="text-[8px] text-slate-400">
                      {{ cert.reintentos }} intento{{ cert.reintentos !== 1 ? 's' : '' }}
                    </span>
                  </div>
                </td>

                <!-- Último intento -->
                <td class="px-6 py-4">
                  <span class="text-[10px] font-mono text-slate-500">
                    {{ cert.fecha_ultimo_envio ? new Date(cert.fecha_ultimo_envio).toLocaleString('es-BO') : '—' }}
                  </span>
                </td>

              <!-- Acciones -->
              <td class="px-6 py-4">
                <div class="flex items-center justify-end gap-1">
                  <!-- Validar envío / Trazabilidad -->
                  <button @click="abrirMailTrace(cert.id)"
                          title="Ver traza de envío"
                          class="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-all">
                    <span class="material-symbols-outlined text-[18px]">history</span>
                  </button>

                  <!-- Ver error -->
                  <button v-if="cert.estado_envio === 'error'"
                          @click="verError(cert.log_error_envio || '')"
                          title="Ver detalle del error"
                          class="p-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-400 transition-all">
                    <span class="material-symbols-outlined text-[18px]">bug_report</span>
                  </button>

                  <!-- Editar email -->
                  <button @click="abrirEditarEmail(cert)"
                          title="Editar email del usuario"
                          class="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-400 hover:text-blue-600 transition-all">
                    <span class="material-symbols-outlined text-[18px]">edit</span>
                  </button>

                  <!-- Reintentar individual -->
                  <button @click="reintentarUno(cert)"
                          :title="cert.estado_envio === 'enviado' ? 'Ya enviado' : 'Reintentar envío'"
                          :class="cert.estado_envio === 'enviado'
                            ? 'text-slate-300 dark:text-slate-600 cursor-default'
                            : 'hover:bg-slate-100 dark:hover:bg-gray-700 text-slate-400 hover:text-slate-800'"
                          class="p-2 rounded-lg transition-all">
                    <span class="material-symbols-outlined text-[18px]">
                      {{ cert.estado_envio === 'enviado' ? 'done_all' : 'send' }}
                    </span>
                  </button>
                </div>
              </td>
            </tr>

            <tr v-if="filteredCertificados.length === 0">
              <td colspan="6" class="py-20 text-center text-slate-400 italic text-sm">
                No se encontraron certificados para los filtros aplicados.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

    </div>
    </div> <!-- end trazabilidad tab -->

    <!-- ──────────────────────────────────────────────────────────── -->
    <!-- CONTENIDO PESTAÑA 2: AUDITORÍA SMTP DE CORREOS -->
    <!-- ──────────────────────────────────────────────────────────── -->
    <div v-else-if="activeTab === 'auditoria'" class="space-y-6">

      <div v-if="isStatsLoading" class="flex justify-center items-center py-20">
        <span class="material-symbols-outlined animate-spin text-3xl text-slate-400">progress_activity</span>
      </div>

      <template v-else>
        <!-- CUOTA Y PROGRESO DIARIO -->
        <div class="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm space-y-4">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs font-black text-slate-500 uppercase tracking-widest">
            <span class="flex items-center gap-1.5 text-primary-dark dark:text-white">
              <span class="material-symbols-outlined text-[18px]">analytics</span>
              Consumo de Cuota de Envío Diario SMTP
            </span>
            <span class="text-slate-600 font-mono">{{ statsData.enviados }} / 100 correos salientes hoy</span>
          </div>

          <div class="w-full h-3.5 bg-slate-100 dark:bg-gray-800 rounded-full overflow-hidden shadow-inner">
            <div :style="{ width: `${Math.min(100, (statsData.enviados / 100) * 100)}%` }" 
                 class="h-full bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full transition-all duration-500 shadow-inner"></div>
          </div>

          <div class="flex justify-between items-center text-[10px] text-slate-400 font-bold italic">
            <span>Nota: La cuota SMTP se gestiona de forma rotativa para garantizar la reputación del servidor IP.</span>
            <span v-if="statsData.pausados > 0" class="text-amber-500 flex items-center gap-1">
              <span class="material-symbols-outlined text-[12px] animate-pulse">hourglass_top</span>
              {{ statsData.pausados }} en pausa por límite diario
            </span>
          </div>
        </div>

        <!-- TARJETAS DE ESTADÍSTICAS -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 p-5 rounded-2xl shadow-sm text-center">
            <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Enviados (Bitácora)</p>
            <h3 class="text-2xl font-black text-emerald-600 dark:text-emerald-400">{{ statsData.enviados }}</h3>
          </div>
          <div class="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 p-5 rounded-2xl shadow-sm text-center">
            <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">En Cola (Pendientes)</p>
            <h3 class="text-2xl font-black text-blue-600 dark:text-blue-400">{{ statsData.pendientes }}</h3>
          </div>
          <div class="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 p-5 rounded-2xl shadow-sm text-center">
            <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Fallas Activas</p>
            <h3 class="text-2xl font-black text-rose-600 dark:text-rose-400">{{ statsData.fallidos }}</h3>
          </div>
          <div class="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 p-5 rounded-2xl shadow-sm text-center">
            <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Cancelados</p>
            <h3 class="text-2xl font-black text-slate-500">{{ statsData.cancelados }}</h3>
          </div>
        </div>

        <!-- COLA FALLIDOS -->
        <div class="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-[2rem] overflow-hidden shadow-sm">
          <div class="p-6 border-b border-slate-100 dark:border-gray-800 flex justify-between items-center bg-slate-50/50 dark:bg-gray-800/20">
            <h3 class="text-xs font-black text-rose-600 uppercase tracking-widest flex items-center gap-2">
              <span class="material-symbols-outlined text-[18px]">error</span>
              Fallas en Cola de Envíos (Activas)
            </h3>
            <span class="text-[10px] font-bold text-slate-400">Total: {{ auditData.colaFallidos.length }} pendientes</span>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-slate-50 dark:bg-gray-800/50 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-gray-800">
                  <th class="px-6 py-4">Destinatario</th>
                  <th class="px-6 py-4">Asunto</th>
                  <th class="px-6 py-4 text-center">Estado</th>
                  <th class="px-6 py-4 text-center">Intentos</th>
                  <th class="px-6 py-4">Detalle del Error</th>
                  <th class="px-6 py-4">Fecha Creación</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-50 dark:divide-gray-800">
                <tr v-for="mail in auditData.colaFallidos" :key="mail.id"
                    class="hover:bg-slate-50/50 dark:hover:bg-gray-800/30 transition-colors">
                  <td class="px-6 py-4 text-xs font-bold text-slate-800 dark:text-white">{{ mail.destinatario }}</td>
                  <td class="px-6 py-4 text-xs text-slate-600 dark:text-gray-400 truncate max-w-[200px]">{{ mail.asunto }}</td>
                  <td class="px-6 py-4 text-center">
                    <span :class="mail.estado === 'FAILED' ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-amber-50 text-amber-600 border-amber-200'" 
                          class="px-2 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-widest">
                      {{ mail.estado }}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-center text-xs font-bold text-slate-700 dark:text-gray-300">
                    {{ mail.intentos }} / {{ auditData.maxIntentos }}
                  </td>
                  <td class="px-6 py-4">
                    <div class="flex items-center gap-2">
                      <span class="text-[10px] text-slate-500 font-medium truncate max-w-[220px]" :title="mail.ultimo_error">
                        {{ mail.ultimo_error || 'Fallo SMTP genérico' }}
                      </span>
                      <button @click="verError(mail.ultimo_error || '')" class="p-1 rounded hover:bg-slate-100 dark:hover:bg-gray-800 text-slate-400">
                        <span class="material-symbols-outlined text-[15px]">bug_report</span>
                      </button>
                    </div>
                  </td>
                  <td class="px-6 py-4 text-[10px] font-mono text-slate-400">
                    {{ new Date(mail.fecha_creacion).toLocaleString('es-BO') }}
                  </td>
                </tr>
                <tr v-if="auditData.colaFallidos.length === 0">
                  <td colspan="6" class="py-12 text-center text-slate-400 italic text-xs">No hay correos en cola con fallos actualmente. ¡Tu servidor funciona al 100%!</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- BITÁCORA SMTP -->
        <div class="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-[2rem] overflow-hidden shadow-sm">
          <div class="p-6 border-b border-slate-100 dark:border-gray-800 flex justify-between items-center bg-slate-50/50 dark:bg-gray-800/20">
            <h3 class="text-xs font-black text-slate-800 dark:text-white uppercase tracking-widest flex items-center gap-2">
              <span class="material-symbols-outlined text-[18px]">history</span>
              Bitácora de Salida SMTP (Envíos Finalizados)
            </h3>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-slate-50 dark:bg-gray-800/50 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-gray-800">
                  <th class="px-6 py-4">Destinatario</th>
                  <th class="px-6 py-4">Asunto</th>
                  <th class="px-6 py-4 text-center">Estado</th>
                  <th class="px-6 py-4">Fecha Transmisión</th>
                  <th class="px-6 py-4">Detalle / Log</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-50 dark:divide-gray-800">
                <tr v-for="log in auditData.logs" :key="log.id"
                    class="hover:bg-slate-50/50 dark:hover:bg-gray-800/30 transition-colors">
                  <td class="px-6 py-4 text-xs font-bold text-slate-800 dark:text-white">{{ log.destinatario }}</td>
                  <td class="px-6 py-4 text-xs text-slate-600 dark:text-gray-400 truncate max-w-[200px]">{{ log.asunto }}</td>
                  <td class="px-6 py-4 text-center">
                    <span :class="log.estado === 'enviado' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'" 
                          class="px-2 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-widest">
                      {{ log.estado }}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-[10px] font-mono text-slate-500">
                    {{ log.fecha_envio ? new Date(log.fecha_envio).toLocaleString('es-BO') : new Date(log.fecha_creacion).toLocaleString('es-BO') }}
                  </td>
                  <td class="px-6 py-4">
                    <div v-if="log.error" class="flex items-center gap-2">
                      <span class="text-[10px] text-rose-500 max-w-[200px] truncate" :title="log.error">{{ log.error }}</span>
                      <button @click="verError(log.error)" class="p-1 rounded hover:bg-rose-50 text-rose-500">
                        <span class="material-symbols-outlined text-sm">bug_report</span>
                      </button>
                    </div>
                    <span v-else class="text-[10px] text-emerald-600 font-bold">Entrega Exitosa</span>
                  </td>
                </tr>
                <tr v-if="auditData.logs.length === 0">
                  <td colspan="5" class="py-12 text-center text-slate-400 italic text-xs">No hay envíos registrados en la bitácora SMTP aún.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </template>

    </div>


    <!-- TAB: EMISIÓN MASIVA -->
    <div v-else-if="activeTab === 'emision'" class="space-y-6 animate-in fade-in duration-300">
      <div class="bg-white dark:bg-gray-900 rounded-3xl border border-slate-200 dark:border-gray-800 shadow-sm p-6 space-y-6">
        <h3 class="text-sm font-black uppercase text-slate-800 dark:text-white flex items-center gap-2">
          <span class="material-symbols-outlined text-amber-500">add_circle</span>
          Generar Certificados por Tipo de Rol
        </h3>

        <!-- Tipo selector -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button v-for="(label, key) in tipoLabels" :key="key" @click="emisionTipo = Number(key); emisionCandidatos = []; emisionSelectedIds = []"
            :class="emisionTipo === Number(key) ? 'bg-slate-800 text-white shadow-lg' : 'bg-slate-100 dark:bg-gray-800 text-slate-500 hover:bg-slate-200'"
            class="px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all text-center">
            {{ label }}
          </button>
        </div>

        <!-- Evento + Actividad -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="text-[10px] font-black uppercase text-slate-400 mb-1 block">Evento</label>
            <select v-model="emisionEventoId" @change="fetchEmisionActividades(); fetchEmisionInfoCerts()" class="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-slate-500">
              <option :value="null">Seleccionar evento...</option>
              <option v-for="e in emisionEventos" :key="e.id" :value="e.id">{{ e.nombre || e.nombre_evento }}</option>
            </select>
          </div>
          <div>
            <label class="text-[10px] font-black uppercase text-slate-400 mb-1 block">Actividad</label>
            <select v-model="emisionActividadId" class="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-slate-500">
              <option :value="null">{{ emisionTipo === 3 ? 'No aplica (por evento)' : 'Seleccionar...' }}</option>
              <option v-for="a in emisionActividades" :key="a.id" :value="a.id">{{ a.nombre }}</option>
            </select>
          </div>
          <div>
            <label class="text-[10px] font-black uppercase text-slate-400 mb-1 block">Plantilla Certificado</label>
            <select v-model="emisionInfoCertId" class="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-slate-500">
              <option :value="null">Seleccionar plantilla...</option>
              <option v-for="ic in emisionInfoCerts" :key="ic.id" :value="ic.id">{{ ic.cabecera || `Plantilla #${ic.id}` }}</option>
            </select>
          </div>
        </div>

        <div class="flex items-center gap-4">
          <input v-model="emisionFirma" type="text" placeholder="Firma (ej: Firma del Director)" class="flex-1 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-slate-500" />
          <button @click="fetchCandidatos" :disabled="emisionLoading" class="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all disabled:opacity-50">
            <span class="material-symbols-outlined text-sm">search</span>
            Buscar Candidatos
          </button>
        </div>
      </div>

      <!-- Candidatos table -->
      <div v-if="emisionCandidatos.length > 0" class="bg-white dark:bg-gray-900 rounded-3xl border border-slate-200 dark:border-gray-800 shadow-sm overflow-hidden">
        <div class="p-5 border-b border-slate-100 dark:border-gray-800 flex items-center justify-between">
          <p class="text-sm font-black text-slate-800 dark:text-white uppercase">{{ emisionCandidatos.length }} candidatos encontrados</p>
          <button @click="handleEmitirLote" :disabled="emisionSelectedIds.length === 0 || emisionLoading" class="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-700 transition-all disabled:opacity-50">
            <span class="material-symbols-outlined text-sm">{{ emisionLoading ? 'progress_activity' : 'workspace_premium' }}</span>
            Emitir Seleccionados ({{ emisionSelectedIds.length }})
          </button>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left">
            <thead>
              <tr class="bg-slate-50 dark:bg-gray-800/50">
                <th class="p-4 w-12"><input type="checkbox" @change="toggleEmisionSelectAll" class="rounded" /></th>
                <th class="p-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Usuario</th>
                <th class="p-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Email</th>
                <th class="p-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Estado</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="c in emisionCandidatos" :key="c.id" class="border-t border-slate-100 dark:border-gray-800 hover:bg-slate-50 dark:hover:bg-gray-800/50 transition-colors">
                <td class="p-4">
                  <input v-if="!c.yaTieneCertificado" type="checkbox" :value="c.id" v-model="emisionSelectedIds" class="rounded" />
                  <span v-else class="material-symbols-outlined text-emerald-500 text-sm" title="Ya tiene certificado">check_circle</span>
                </td>
                <td class="p-4 text-sm font-bold text-slate-700 dark:text-gray-300">{{ c.nombres }} {{ c.primer_apellido }}</td>
                <td class="p-4 text-xs font-mono text-slate-500">{{ c.email }}</td>
                <td class="p-4">
                  <span v-if="c.yaTieneCertificado" class="text-[9px] font-black uppercase px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 tracking-widest">Emitido</span>
                  <span v-else class="text-[9px] font-black uppercase px-2 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 tracking-widest">Pendiente</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- MAIL TRACE MODAL -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="showTraceModal" class="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" @click.self="showTraceModal = false">
          <div class="bg-white dark:bg-gray-900 rounded-3xl border border-slate-200 dark:border-gray-800 shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div class="p-6 border-b border-slate-100 dark:border-gray-800 flex items-center justify-between">
              <div>
                <h3 class="text-lg font-black text-slate-800 dark:text-white uppercase">Traza de Envío</h3>
                <p class="text-xs text-slate-400 mt-1">Historial detallado de entrega del certificado.</p>
              </div>
              <button @click="showTraceModal = false" class="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-gray-800 transition-all">
                <span class="material-symbols-outlined text-slate-400">close</span>
              </button>
            </div>

            <div v-if="traceLoading" class="p-12 text-center">
              <span class="material-symbols-outlined animate-spin text-3xl text-slate-400">progress_activity</span>
            </div>

            <div v-else-if="traceData" class="p-6 space-y-6">
              <!-- Cert status -->
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div class="bg-slate-50 dark:bg-gray-800 rounded-xl p-4">
                  <p class="text-[9px] font-black uppercase text-slate-400 tracking-widest">Estado</p>
                  <p class="text-sm font-black mt-1" :class="traceData.estado_certificado === 'enviado' ? 'text-emerald-600' : traceData.estado_certificado === 'error' ? 'text-rose-600' : 'text-amber-600'">{{ traceData.estado_certificado || 'pendiente' }}</p>
                </div>
                <div class="bg-slate-50 dark:bg-gray-800 rounded-xl p-4">
                  <p class="text-[9px] font-black uppercase text-slate-400 tracking-widest">Reintentos</p>
                  <p class="text-sm font-black text-slate-700 dark:text-white mt-1">{{ traceData.reintentos || 0 }}</p>
                </div>
                <div class="bg-slate-50 dark:bg-gray-800 rounded-xl p-4">
                  <p class="text-[9px] font-black uppercase text-slate-400 tracking-widest">Destinatario</p>
                  <p class="text-xs font-mono text-slate-600 mt-1 truncate">{{ traceData.destinatario }}</p>
                </div>
                <div class="bg-slate-50 dark:bg-gray-800 rounded-xl p-4">
                  <p class="text-[9px] font-black uppercase text-slate-400 tracking-widest">Último Envío</p>
                  <p class="text-xs font-mono text-slate-600 mt-1">{{ traceData.fecha_ultimo_envio ? new Date(traceData.fecha_ultimo_envio).toLocaleString('es-BO') : '—' }}</p>
                </div>
              </div>

              <!-- Error log -->
              <div v-if="traceData.log_error" class="bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-800 rounded-xl p-4">
                <p class="text-[9px] font-black uppercase text-rose-600 tracking-widest mb-1">Error Registrado</p>
                <pre class="text-xs text-rose-700 dark:text-rose-300 whitespace-pre-wrap break-words">{{ traceData.log_error }}</pre>
              </div>

              <!-- Mail Logs -->
              <div>
                <p class="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3">Historial de Correos (mail_logs)</p>
                <div v-if="traceData.logs?.length === 0" class="text-xs text-slate-400 italic">Sin registros en mail_logs.</div>
                <div v-else class="space-y-2">
                  <div v-for="log in traceData.logs" :key="log.id" class="bg-slate-50 dark:bg-gray-800 rounded-xl p-3 flex items-center justify-between text-xs">
                    <div>
                      <span class="font-black" :class="log.estado === 'enviado' ? 'text-emerald-600' : log.estado === 'fallido' ? 'text-rose-600' : 'text-amber-600'">{{ log.estado }}</span>
                      <span class="text-slate-400 ml-2">{{ new Date(log.fecha_creacion).toLocaleString('es-BO') }}</span>
                    </div>
                    <span v-if="log.message_id" class="font-mono text-[10px] text-slate-400 truncate max-w-[200px]" :title="log.message_id">{{ log.message_id }}</span>
                  </div>
                </div>
              </div>

              <!-- Mail Queue -->
              <div>
                <p class="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3">Cola de Envío (mail_queue)</p>
                <div v-if="traceData.cola?.length === 0" class="text-xs text-slate-400 italic">Sin registros en cola.</div>
                <div v-else class="space-y-2">
                  <div v-for="q in traceData.cola" :key="q.id" class="bg-slate-50 dark:bg-gray-800 rounded-xl p-3 flex items-center justify-between text-xs">
                    <div>
                      <span class="font-black" :class="q.estado === 'PENDING' ? 'text-blue-600' : q.estado === 'FAILED' ? 'text-rose-600' : 'text-amber-600'">{{ q.estado }}</span>
                      <span class="text-slate-400 ml-2">Intentos: {{ q.intentos }}</span>
                    </div>
                    <span class="text-slate-400">{{ new Date(q.fecha_creacion).toLocaleString('es-BO') }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- MODAL: Editar Email -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="showEmailModal"
             class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
             @click.self="cerrarEditarEmail">
          <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

            <!-- Header modal -->
            <div class="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100 dark:border-gray-800">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                  <span class="material-symbols-outlined text-blue-600 text-[20px]">edit</span>
                </div>
                <div>
                  <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Corrección rápida</p>
                  <h2 class="text-base font-black text-slate-800 dark:text-white">Editar Email del Usuario</h2>
                </div>
              </div>
              <button @click="cerrarEditarEmail"
                      class="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-gray-800 text-slate-400 transition-all">
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>

            <!-- Body modal -->
            <div class="px-6 py-5">
              <p class="text-sm text-slate-500 mb-4">
                Corrija el correo electrónico de
                <strong class="text-slate-800 dark:text-white">
                  {{ emailModalCert?.usuario?.persona?.nombres }} {{ emailModalCert?.usuario?.persona?.primer_apellido }}
                </strong>
                y luego reintente el envío.
              </p>

              <label class="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Nuevo Email</label>
              <div class="relative">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-[20px]">mail</span>
                <input v-model="emailModalValue"
                       type="email"
                       placeholder="correo@ejemplo.com"
                       @keyup.enter="guardarEmail"
                       class="w-full pl-10 pr-4 py-3 border border-slate-200 dark:border-gray-700 rounded-xl text-sm bg-slate-50 dark:bg-gray-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all" />
              </div>
            </div>

            <!-- Footer modal -->
            <div class="flex gap-3 px-6 pb-6">
              <button @click="cerrarEditarEmail"
                      class="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-gray-700 text-sm font-bold text-slate-600 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-gray-800 transition-all">
                Cancelar
              </button>
              <button @click="guardarEmail"
                      :disabled="isSavingEmail"
                      class="flex-1 py-2.5 rounded-xl bg-slate-800 text-white text-sm font-black hover:bg-slate-900 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                <span v-if="isSavingEmail" class="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                {{ isSavingEmail ? 'Guardando...' : 'Guardar Email' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<style scoped>
.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: .5; }
}

/* Modal transition */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
.modal-fade-enter-from .bg-white,
.modal-fade-leave-to .bg-white {
  transform: scale(0.96) translateY(8px);
}
</style>
