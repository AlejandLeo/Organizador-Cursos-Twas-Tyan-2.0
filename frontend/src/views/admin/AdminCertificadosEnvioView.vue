<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { certificadosService } from '@/services/certificados.service';
import Swal from 'sweetalert2';

interface Certificado {
  id: number;
  codigo_certificado: string;
  estado_envio: string;
  fecha_ultimo_envio: string | null;
  log_error_envio: string | null;
  reintentos: number;
  usuario: {
    id: number;
    email: string;
    persona: {
      nombres: string;
      primer_apellido: string;
    }
  };
  actividadAcademica: {
    nombre: string;
    evento: {
      nombre: string;
      fase: number;
    }
  }
}

// ── Estado principal ──────────────────────────────────────────
const certificados = ref<Certificado[]>([]);
const isLoading = ref(true);
const isSending = ref(false);
const isRetryingAll = ref(false);
const selectedIds = ref<number[]>([]);
const filterEvent = ref('');
const filterStatus = ref('');

// ── Estado del modal de edición de email ──────────────────────
const showEmailModal = ref(false);
const emailModalCert = ref<Certificado | null>(null);
const emailModalValue = ref('');
const isSavingEmail = ref(false);

// ── Datos computados ──────────────────────────────────────────
const filteredCertificados = computed(() => {
  return certificados.value.filter(c => {
    const matchEvent = !filterEvent.value ||
      c.actividadAcademica.evento.nombre.toLowerCase().includes(filterEvent.value.toLowerCase()) ||
      c.actividadAcademica.nombre.toLowerCase().includes(filterEvent.value.toLowerCase());
    const matchStatus = !filterStatus.value || c.estado_envio === filterStatus.value;
    return matchEvent && matchStatus;
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

// ── Selección ─────────────────────────────────────────────────
const toggleSelectAll = (event: any) => {
  selectedIds.value = event.target.checked
    ? filteredCertificados.value.map(c => c.id)
    : [];
};

// ── Envío masivo (seleccionados) ──────────────────────────────
const handleSendMasivo = async () => {
  if (selectedIds.value.length === 0) return;

  const problematicos = certificados.value.filter(
    c => selectedIds.value.includes(c.id) && c.actividadAcademica.evento.fase < 4
  );

  if (problematicos.length > 0) {
    Swal.fire({
      title: 'Acción Bloqueada',
      text: `${problematicos.length} certificados pertenecen a eventos aún no finalizados (fase < 4).`,
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
  if (cert.actividadAcademica.evento.fase < 4) {
    Swal.fire('Atención', 'El evento aún no está en fase "Finalizado".', 'warning');
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
  emailModalValue.value = cert.usuario.email;
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
    await certificadosService.editarEmailUsuario(emailModalCert.value.usuario.id, nuevoEmail);
    // Actualizar localmente sin recargar
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

onMounted(fetchCertificados);
</script>

<template>
  <div class="space-y-6 animate-in fade-in duration-500">

    <!-- HEADER -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-3 mb-2">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-800 to-slate-950 flex items-center justify-center shadow-lg shadow-slate-900/50">
            <span class="material-symbols-outlined text-white text-[22px]">mail</span>
          </div>
          <div>
            <p class="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Trazabilidad de Entrega</p>
            <h1 class="text-2xl font-black text-slate-800 dark:text-white tracking-tight uppercase italic">Envío de Certificados</h1>
          </div>
        </div>
        <p class="text-slate-500 text-sm ml-1">Gestiona el envío y monitorea errores de entrega. Los envíos se procesan en segundo plano.</p>
      </div>

      <div class="flex items-center gap-2 flex-wrap justify-end">
        <!-- Refrescar -->
        <button @click="fetchCertificados"
                class="p-3 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl text-slate-600 dark:text-gray-400 hover:bg-slate-50 transition-all"
                title="Refrescar tabla">
          <span class="material-symbols-outlined" :class="{'animate-spin': isLoading}">refresh</span>
        </button>

        <!-- Reintentar TODOS los fallidos -->
        <button @click="handleReintentarFallidos"
                :disabled="totalFallidos === 0 || isRetryingAll"
                :class="totalFallidos === 0 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-rose-700'"
                class="flex items-center gap-2 px-4 py-3 bg-rose-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest transition-all disabled:grayscale">
          <span class="material-symbols-outlined text-[18px]">{{ isRetryingAll ? 'progress_activity' : 'replay' }}</span>
          Reintentar Fallidos
          <span v-if="totalFallidos > 0" class="bg-white/20 px-1.5 py-0.5 rounded-full text-[9px]">{{ totalFallidos }}</span>
        </button>

        <!-- Enviar seleccionados -->
        <button @click="handleSendMasivo"
                :disabled="selectedIds.length === 0 || isSending"
                :class="selectedIds.length === 0 ? 'opacity-50 grayscale' : 'hover:bg-slate-900 shadow-xl shadow-slate-900/20'"
                class="flex items-center gap-2 px-5 py-3 bg-slate-800 text-white rounded-xl font-black uppercase text-[10px] tracking-widest transition-all">
          <span class="material-symbols-outlined text-[18px]">{{ isSending ? 'progress_activity' : 'send' }}</span>
          {{ isSending ? 'Encolando...' : `Enviar (${selectedIds.length})` }}
        </button>
      </div>
    </div>

    <!-- FILTROS -->
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

    <!-- TABLA -->
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
                    {{ cert.usuario.persona?.nombres?.charAt(0) || '?' }}
                  </div>
                  <div class="min-w-0">
                    <p class="text-sm font-bold text-slate-800 dark:text-white truncate">
                      {{ cert.usuario.persona?.nombres }} {{ cert.usuario.persona?.primer_apellido }}
                    </p>
                    <p class="text-[10px] text-slate-500 font-medium truncate">{{ cert.usuario.email }}</p>
                  </div>
                </div>
              </td>

              <!-- Evento -->
              <td class="px-6 py-4">
                <p class="text-[10px] font-black text-slate-400 uppercase tracking-tighter flex items-center gap-1">
                  {{ cert.actividadAcademica.evento.nombre }}
                  <span v-if="cert.actividadAcademica.evento.fase < 4"
                        class="text-[8px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-black">
                    No Finalizado
                  </span>
                </p>
                <p class="text-xs font-bold text-slate-700 dark:text-gray-300 mt-0.5">{{ cert.actividadAcademica.nombre }}</p>
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
                  <span v-if="cert.reintentos > 0" class="text-[8px] text-slate-400">
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
                  {{ emailModalCert?.usuario.persona?.nombres }} {{ emailModalCert?.usuario.persona?.primer_apellido }}
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
