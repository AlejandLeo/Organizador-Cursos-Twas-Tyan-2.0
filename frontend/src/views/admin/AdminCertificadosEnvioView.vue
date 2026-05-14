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

const certificados = ref<Certificado[]>([]);
const isLoading = ref(true);
const isSending = ref(false);
const selectedIds = ref<number[]>([]);
const filterEvent = ref('');
const filterStatus = ref('');

const fetchCertificados = async () => {
  try {
    isLoading.value = true;
    const res = await certificadosService.adminGetAll();
    certificados.value = res.data;
  } catch (error) {
    Swal.fire('Error', 'No se pudieron cargar los certificados', 'error');
  } finally {
    isLoading.value = false;
  }
};

const filteredCertificados = computed(() => {
  return certificados.value.filter(c => {
    const matchEvent = !filterEvent.value || 
      c.actividadAcademica.evento.nombre.toLowerCase().includes(filterEvent.value.toLowerCase()) ||
      c.actividadAcademica.nombre.toLowerCase().includes(filterEvent.value.toLowerCase());
    
    const matchStatus = !filterStatus.value || c.estado_envio === filterStatus.value;
    
    return matchEvent && matchStatus;
  });
});

const toggleSelectAll = (event: any) => {
  if (event.target.checked) {
    selectedIds.value = filteredCertificados.value.map(c => c.id);
  } else {
    selectedIds.value = [];
  }
};

const handleSendMasivo = async () => {
  if (selectedIds.value.length === 0) return;

  // Validar si hay certificados de eventos no finalizados
  const problematicos = certificados.value.filter(c => selectedIds.value.includes(c.id) && c.actividadAcademica.evento.fase < 4);
  
  if (problematicos.length > 0) {
    Swal.fire({
      title: 'Acción Bloqueada',
      text: `Has seleccionado ${problematicos.length} certificados de eventos que aún no están en fase de "Finalizado". Por normativa, solo se pueden emitir certificados de eventos concluidos.`,
      icon: 'warning',
      confirmButtonColor: '#0f172a'
    });
    return;
  }

  const result = await Swal.fire({
    title: '¿Iniciar envío masivo?',
    text: `Se enviarán ${selectedIds.value.length} certificados por correo electrónico.`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Sí, iniciar envío',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#0f172a'
  });

  if (!result.isConfirmed) return;

  try {
    isSending.value = true;
    const res = await certificadosService.enviarMasivo(selectedIds.value);
    Swal.fire('Proceso Completado', res.data.mensaje, 'success');
    fetchCertificados();
    selectedIds.value = [];
  } catch (error: any) {
    Swal.fire('Error', error.response?.data?.message || 'Error en el proceso de envío', 'error');
  } finally {
    isSending.value = false;
  }
};

const reintentarUno = async (cert: Certificado) => {
  if (cert.actividadAcademica.evento.fase < 4) {
    Swal.fire('Atención', 'El evento asociado aún no ha sido marcado como "Finalizado". No se puede emitir el certificado todavía.', 'warning');
    return;
  }
  
  try {
    cert.estado_envio = 'procesando';
    await certificadosService.reintentarEnvio(cert.id);
    Swal.fire('¡Éxito!', 'Certificado enviado correctamente.', 'success');
    fetchCertificados();
  } catch (error: any) {
    Swal.fire('Error', error.response?.data?.message || 'No se pudo enviar el correo', 'error');
    fetchCertificados();
  }
};

const verError = (log: string) => {
  Swal.fire({
    title: 'Detalle del Error',
    text: log,
    icon: 'error',
    confirmButtonColor: '#ef4444'
  });
};

onMounted(fetchCertificados);
</script>

<template>
  <div class="space-y-8 animate-in fade-in duration-500">
    
    <!-- HEADER -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-3 mb-2">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-800 to-slate-950 flex items-center justify-center shadow-lg shadow-slate-900/50">
            <span class="material-symbols-outlined text-white text-[22px]">mail</span>
          </div>
          <div>
            <p class="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Trazabilidad de Entrega</p>
            <h1 class="text-2xl font-black text-slate-800 dark:text-white tracking-tight uppercase italic">Envío Masivo de Certificados</h1>
          </div>
        </div>
        <p class="text-slate-500 text-sm ml-1">Gestiona el envío de certificados y monitorea errores de entrega.</p>
      </div>

      <div class="flex items-center gap-2">
        <button @click="fetchCertificados" 
                class="p-3 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl text-slate-600 dark:text-gray-400 hover:bg-slate-50 transition-all">
          <span class="material-symbols-outlined" :class="{'animate-spin': isLoading}">refresh</span>
        </button>
        <button @click="handleSendMasivo"
                :disabled="selectedIds.length === 0 || isSending"
                :class="selectedIds.length === 0 ? 'opacity-50 grayscale' : 'hover:bg-slate-900 shadow-xl shadow-slate-900/20'"
                class="flex items-center gap-2 px-6 py-3 bg-slate-800 text-white rounded-xl font-black uppercase text-[10px] tracking-widest transition-all">
          <span class="material-symbols-outlined text-[18px]">{{ isSending ? 'progress_activity' : 'send' }}</span>
          {{ isSending ? 'Enviando...' : `Enviar Seleccionados (${selectedIds.length})` }}
        </button>
      </div>
    </div>

    <!-- FILTROS -->
    <div class="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm">
      <div class="flex flex-wrap items-center gap-4">
        <div class="flex-1 min-w-[250px] relative">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400">search</span>
          <input v-model="filterEvent" type="text" placeholder="Buscar por evento o actividad..."
                 class="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-gray-800/50 border border-slate-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:border-slate-400 transition-all" />
        </div>
        <select v-model="filterStatus" class="px-4 py-2.5 bg-slate-50 dark:bg-gray-800/50 border border-slate-200 dark:border-gray-700 rounded-xl text-xs font-bold uppercase outline-none">
          <option value="">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="enviado">Enviado</option>
          <option value="error">Con Error</option>
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
                <input type="checkbox" @change="toggleSelectAll" :checked="selectedIds.length === filteredCertificados.length && filteredCertificados.length > 0"
                       class="w-4 h-4 rounded border-slate-300 text-slate-800 focus:ring-slate-500 cursor-pointer" />
              </th>
              <th class="px-6 py-4">Usuario / Email</th>
              <th class="px-6 py-4">Evento / Actividad</th>
              <th class="px-6 py-4 text-center">Estado Envío</th>
              <th class="px-6 py-4">Último Intento</th>
              <th class="px-6 py-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50 dark:divide-gray-800">
            <tr v-for="cert in filteredCertificados" :key="cert.id" 
                class="hover:bg-slate-50/50 dark:hover:bg-gray-800/30 transition-colors group">
              <td class="px-6 py-4">
                <input type="checkbox" v-model="selectedIds" :value="cert.id"
                       class="w-4 h-4 rounded border-slate-300 text-slate-800 focus:ring-slate-500 cursor-pointer" />
              </td>
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full bg-slate-100 dark:bg-gray-800 text-slate-600 flex items-center justify-center font-black text-xs">
                    {{ cert.usuario.persona?.nombres?.charAt(0) || '?' }}
                  </div>
                  <div>
                    <p class="text-sm font-bold text-slate-800 dark:text-white">{{ cert.usuario.persona?.nombres }} {{ cert.usuario.persona?.primer_apellido }}</p>
                    <p class="text-[10px] text-slate-500 font-medium">{{ cert.usuario.email }}</p>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4">
                <p class="text-[10px] font-black text-slate-400 uppercase tracking-tighter flex items-center gap-1">
                  {{ cert.actividadAcademica.evento.nombre }}
                  <span v-if="cert.actividadAcademica.evento.fase < 4" class="text-[8px] bg-amber-100 text-amber-700 px-1 rounded">No Finalizado</span>
                </p>
                <p class="text-xs font-bold text-slate-700 dark:text-gray-300">{{ cert.actividadAcademica.nombre }}</p>
              </td>
              <td class="px-6 py-4 text-center">
                <div class="flex flex-col items-center gap-1">
                  <span :class="{
                    'bg-amber-50 text-amber-600 border-amber-100': cert.estado_envio === 'pendiente',
                    'bg-emerald-50 text-emerald-600 border-emerald-100': cert.estado_envio === 'enviado',
                    'bg-rose-50 text-rose-600 border-rose-100': cert.estado_envio === 'error',
                    'bg-slate-100 text-slate-500 animate-pulse': cert.estado_envio === 'procesando'
                  }" class="px-2 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-widest">
                    {{ cert.estado_envio }}
                  </span>
                  <span v-if="cert.reintentos > 0" class="text-[8px] text-slate-400">Intentos: {{ cert.reintentos }}</span>
                </div>
              </td>
              <td class="px-6 py-4">
                <span class="text-[10px] font-mono text-slate-500">
                  {{ cert.fecha_ultimo_envio ? new Date(cert.fecha_ultimo_envio).toLocaleString() : '---' }}
                </span>
              </td>
              <td class="px-6 py-4">
                <div class="flex items-center justify-end gap-1">
                  <button v-if="cert.estado_envio === 'error'"
                          @click="verError(cert.log_error_envio || '')"
                          title="Ver detalle del error"
                          class="p-2 rounded-lg hover:bg-rose-50 text-rose-400 transition-all">
                    <span class="material-symbols-outlined text-[18px]">bug_report</span>
                  </button>
                  <button @click="reintentarUno(cert)"
                          :title="cert.estado_envio === 'error' ? 'Reintentar envío' : 'Enviar por primera vez'"
                          :class="cert.estado_envio === 'enviado' ? 'text-slate-300 cursor-default' : 'hover:bg-slate-100 text-slate-400 hover:text-slate-800'"
                          class="p-2 rounded-lg transition-all">
                    <span class="material-symbols-outlined text-[18px]">{{ cert.estado_envio === 'enviado' ? 'done_all' : 'send' }}</span>
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="filteredCertificados.length === 0">
              <td colspan="6" class="py-20 text-center text-slate-400 italic text-sm">No se encontraron certificados para los filtros aplicados.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

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
</style>
