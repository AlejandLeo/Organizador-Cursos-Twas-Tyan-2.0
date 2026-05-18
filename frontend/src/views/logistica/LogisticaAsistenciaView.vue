<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { Html5QrcodeScanner } from 'html5-qrcode';
import api from '@/services/api';
import Swal from 'sweetalert2';

const misEventos = ref<any[]>([]);
const selectedEventId = ref<number | null>(null);
const selectedActivityId = ref<number | null>(null);
const selectedSessionId = ref<number | null>(null);
const activeMode = ref<'qr' | 'pin'>('qr');

const loading = ref(false);
const scannerActive = ref(false);
let scanner: Html5QrcodeScanner | null = null;

// PIN mode
const pinCode = ref('');
const pinLoading = ref(false);

const fetchMisEventos = async () => {
  try {
    const res = await api.get('/logistica/sesiones-academicas/mis-eventos');
    misEventos.value = Array.isArray(res.data) ? res.data : [];
  } catch (err) {
    console.error('Error fetching mis eventos', err);
  }
};

const selectedEvent = () => misEventos.value.find(e => e.id === selectedEventId.value);
const selectedActivity = () => selectedEvent()?.actividades?.find((a: any) => a.id === selectedActivityId.value);

const onEventChange = () => {
  selectedActivityId.value = null;
  selectedSessionId.value = null;
};

const onActivityChange = () => {
  selectedSessionId.value = null;
};

const startScanner = () => {
  if (!selectedSessionId.value) {
    Swal.fire('Atención', 'Por favor selecciona una sesión académica primero.', 'warning');
    return;
  }
  scannerActive.value = true;
  setTimeout(() => {
    scanner = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );
    scanner.render(onScanSuccess, onScanFailure);
  }, 100);
};

const stopScanner = () => {
  if (scanner) {
    scanner.clear().catch(error => console.error("Failed to clear scanner", error));
    scanner = null;
  }
  scannerActive.value = false;
};

const onScanSuccess = async (decodedText: string) => {
  stopScanner();
  loading.value = true;
  try {
    const res = await api.post('/logistica/asistencias/registro-qr', {
      token: decodedText,
      id_sesion: selectedSessionId.value
    });
    Swal.fire({
      icon: 'success',
      title: '¡Asistencia Registrada!',
      text: res.data.mensaje,
      footer: `Código: ${res.data.codigo_asistencia || ''}`,
      timer: 3000
    });
  } catch (err: any) {
    const msg = err.response?.data?.message || 'Error al registrar asistencia';
    Swal.fire('Error', msg, 'error');
  } finally {
    loading.value = false;
  }
};

const onScanFailure = (_error: any) => {};

const registrarPorPin = async () => {
  if (!selectedSessionId.value) {
    Swal.fire('Atención', 'Selecciona una sesión primero.', 'warning');
    return;
  }
  if (!pinCode.value.trim()) {
    Swal.fire('Atención', 'Ingresa el código PIN del estudiante.', 'warning');
    return;
  }
  pinLoading.value = true;
  try {
    const res = await api.post('/logistica/asistencias/registro-qr', {
      token: pinCode.value.trim(),
      id_sesion: selectedSessionId.value,
    });
    Swal.fire({ icon: 'success', title: '¡Asistencia Registrada!', text: res.data.mensaje, timer: 3000 });
    pinCode.value = '';
  } catch (err: any) {
    const msg = err.response?.data?.message || 'PIN no válido o ya registrado';
    Swal.fire('Error', msg, 'error');
  } finally {
    pinLoading.value = false;
  }
};

onMounted(fetchMisEventos);
onUnmounted(() => stopScanner());
</script>

<template>
  <div class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div class="flex items-center justify-between border-b border-slate-200 dark:border-gray-800 pb-6">
      <div>
        <h2 class="text-3xl font-black text-teal-600 dark:text-teal-400 uppercase tracking-tighter italic">Registro de Asistencia</h2>
        <p class="text-slate-500 dark:text-gray-400 font-medium mt-1">Escaneo QR o ingreso de PIN para confirmar asistencias.</p>
      </div>
      <div class="h-12 w-12 rounded-2xl bg-teal-50 dark:bg-teal-900/20 text-teal-600 flex items-center justify-center border border-teal-100 dark:border-teal-800 shadow-sm">
        <span class="material-symbols-outlined text-[28px]">qr_code_scanner</span>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Config Panel -->
      <div class="lg:col-span-1 space-y-6">
        <div class="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-slate-200 dark:border-gray-800 shadow-sm space-y-5">
          <h3 class="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <span class="material-symbols-outlined text-sm">settings</span>
            Parámetros de Registro
          </h3>

          <div class="space-y-4">
            <div>
              <label class="text-[10px] font-black uppercase text-slate-500 dark:text-gray-400 pl-1 mb-1 block">Evento Asignado</label>
              <select v-model="selectedEventId" @change="onEventChange" class="w-full bg-slate-50 dark:bg-gray-800 border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-teal-500 transition-all">
                <option :value="null">Elija un evento...</option>
                <option v-for="e in misEventos" :key="e.id" :value="e.id">{{ e.nombre }}</option>
              </select>
            </div>

            <div v-if="selectedEventId">
              <label class="text-[10px] font-black uppercase text-slate-500 dark:text-gray-400 pl-1 mb-1 block">Actividad</label>
              <select v-model="selectedActivityId" @change="onActivityChange" class="w-full bg-slate-50 dark:bg-gray-800 border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-teal-500 transition-all">
                <option :value="null">Elija una actividad...</option>
                <option v-for="a in selectedEvent()?.actividades || []" :key="a.id" :value="a.id">{{ a.nombre }}</option>
              </select>
            </div>

            <div v-if="selectedActivityId">
              <label class="text-[10px] font-black uppercase text-slate-500 dark:text-gray-400 pl-1 mb-1 block">Sesión / Horario</label>
              <select v-model="selectedSessionId" class="w-full bg-slate-50 dark:bg-gray-800 border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-teal-500 transition-all">
                <option :value="null">Seleccione el horario...</option>
                <option v-for="s in selectedActivity()?.sesiones || []" :key="s.id" :value="s.id">
                  {{ s.fecha }} | {{ s.hora_inicio }} - {{ s.hora_fin }} ({{ s.aula || 'Sin aula' }})
                </option>
              </select>
            </div>
          </div>

          <div v-if="selectedSessionId" class="pt-4">
            <div class="p-4 bg-teal-50 dark:bg-teal-900/20 border border-teal-100 dark:border-teal-800 rounded-2xl">
              <p class="text-[10px] font-black text-teal-600 dark:text-teal-400 uppercase">Sesión Lista</p>
              <p class="text-xs font-bold text-slate-700 dark:text-gray-300 mt-1">El sistema verificará automáticamente la inscripción y el horario del usuario.</p>
            </div>
          </div>
        </div>

        <!-- Mode Switch -->
        <div class="bg-white dark:bg-gray-900 p-4 rounded-3xl border border-slate-200 dark:border-gray-800 shadow-sm">
          <p class="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3 px-1">Modo de Registro</p>
          <div class="grid grid-cols-2 gap-2">
            <button @click="activeMode = 'qr'; stopScanner()"
              :class="activeMode === 'qr' ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/30' : 'bg-slate-100 dark:bg-gray-800 text-slate-500'"
              class="flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all">
              <span class="material-symbols-outlined text-sm">qr_code_scanner</span>
              QR
            </button>
            <button @click="activeMode = 'pin'; stopScanner()"
              :class="activeMode === 'pin' ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/30' : 'bg-slate-100 dark:bg-gray-800 text-slate-500'"
              class="flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all">
              <span class="material-symbols-outlined text-sm">pin</span>
              PIN
            </button>
          </div>
        </div>
      </div>

      <!-- Scanner / PIN Area -->
      <div class="lg:col-span-2">
        <!-- QR Mode -->
        <template v-if="activeMode === 'qr'">
          <div v-if="!scannerActive" class="bg-white dark:bg-gray-900 aspect-video rounded-3xl border-2 border-dashed border-slate-200 dark:border-gray-800 flex flex-col items-center justify-center p-12 text-center group">
            <div class="w-24 h-24 rounded-full bg-teal-50 dark:bg-teal-900/20 text-teal-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
              <span class="material-symbols-outlined text-5xl">photo_camera</span>
            </div>
            <h3 class="text-xl font-black text-slate-800 dark:text-white uppercase">Activar Escáner QR</h3>
            <p class="text-slate-400 dark:text-gray-500 max-w-sm mt-2 text-sm">Asegúrese de haber seleccionado la sesión correcta antes de iniciar.</p>
            <button @click="startScanner" :disabled="!selectedSessionId"
              class="mt-8 px-10 py-4 bg-teal-600 hover:bg-teal-700 text-white font-black rounded-2xl shadow-xl shadow-teal-600/20 transition-all transform hover:scale-105 active:scale-95 disabled:opacity-30 disabled:grayscale uppercase tracking-widest text-xs flex items-center gap-3">
              <span class="material-symbols-outlined">qr_code_scanner</span>
              Iniciar Cámara
            </button>
          </div>

          <div v-show="scannerActive" class="bg-black rounded-3xl overflow-hidden shadow-2xl relative">
            <div id="qr-reader" class="w-full"></div>
            <button @click="stopScanner" class="absolute top-4 right-4 z-10 bg-white/20 backdrop-blur-md text-white p-3 rounded-full hover:bg-red-500 transition-colors shadow-lg">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>
        </template>

        <!-- PIN Mode -->
        <template v-else>
          <div class="bg-white dark:bg-gray-900 rounded-3xl border border-slate-200 dark:border-gray-800 p-12 text-center shadow-sm">
            <div class="w-20 h-20 mx-auto rounded-full bg-teal-50 dark:bg-teal-900/20 text-teal-600 flex items-center justify-center mb-6">
              <span class="material-symbols-outlined text-4xl">pin</span>
            </div>
            <h3 class="text-xl font-black text-slate-800 dark:text-white uppercase mb-2">Registro por PIN / Código</h3>
            <p class="text-slate-400 text-sm mb-8 max-w-sm mx-auto">Ingresa el código PIN o token del estudiante para registrar su asistencia.</p>

            <div class="max-w-md mx-auto space-y-4">
              <input v-model="pinCode" type="text" placeholder="Ingresar código PIN o token..." 
                class="w-full bg-slate-50 dark:bg-gray-800 border-2 border-slate-200 dark:border-gray-700 rounded-2xl px-6 py-4 text-center text-lg font-mono font-black tracking-[0.3em] outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                @keyup.enter="registrarPorPin" />

              <button @click="registrarPorPin" :disabled="!selectedSessionId || pinLoading"
                class="w-full px-8 py-4 bg-teal-600 hover:bg-teal-700 text-white font-black rounded-2xl shadow-xl shadow-teal-600/20 transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-3 disabled:opacity-30 disabled:grayscale">
                <span v-if="pinLoading" class="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                <span v-else class="material-symbols-outlined text-sm">check_circle</span>
                Registrar Asistencia
              </button>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- Instructions -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="p-6 bg-white dark:bg-gray-900 rounded-3xl border border-slate-200 dark:border-gray-800 flex gap-4 items-start">
        <div class="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center shrink-0">1</div>
        <p class="text-xs font-medium text-slate-500 dark:text-gray-400"><strong class="text-slate-700 dark:text-gray-200 uppercase block mb-1">Cargar Datos</strong>Selecciona el evento, la actividad y finalmente el horario de la sesión.</p>
      </div>
      <div class="p-6 bg-white dark:bg-gray-900 rounded-3xl border border-slate-200 dark:border-gray-800 flex gap-4 items-start">
        <div class="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 flex items-center justify-center shrink-0">2</div>
        <p class="text-xs font-medium text-slate-500 dark:text-gray-400"><strong class="text-slate-700 dark:text-gray-200 uppercase block mb-1">Escanear / PIN</strong>El estudiante muestra su QR o dicta su código PIN. El código expira cada 15 min.</p>
      </div>
      <div class="p-6 bg-white dark:bg-gray-900 rounded-3xl border border-slate-200 dark:border-gray-800 flex gap-4 items-start">
        <div class="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 flex items-center justify-center shrink-0">3</div>
        <p class="text-xs font-medium text-slate-500 dark:text-gray-400"><strong class="text-slate-700 dark:text-gray-200 uppercase block mb-1">Confirmar</strong>El sistema notificará si el registro fue exitoso o si hubo algún error de horario o inscripción.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
#qr-reader {
  border: none !important;
}
#qr-reader__scan_region {
  background: white;
}
#qr-reader__dashboard_section_csr button {
  background: #0d9488 !important;
  color: white !important;
  border-radius: 12px !important;
  padding: 8px 16px !important;
  font-weight: bold !important;
  text-transform: uppercase !important;
  font-size: 10px !important;
  border: none !important;
}
</style>
