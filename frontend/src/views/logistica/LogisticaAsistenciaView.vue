<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { Html5QrcodeScanner } from 'html5-qrcode';
import api from '@/services/api';
import Swal from 'sweetalert2';

const misEventos = ref<any[]>([]);
const loading = ref(true);
const activeMode = ref<'qr' | 'pin'>('qr');
const scannerActive = ref(false);
let scanner: Html5QrcodeScanner | null = null;

// Actividad y sesión seleccionada
const actividadSeleccionada = ref<any>(null);
const selectedSessionId = ref<number | null>(null);

// PIN mode
const pinCode = ref('');
const pinLoading = ref(false);

// Lista plana de todas las actividades asignadas
const todasActividades = computed(() => {
  const acts: any[] = [];
  for (const ev of misEventos.value) {
    for (const act of (ev.actividades || [])) {
      acts.push({ ...act, eventoNombre: ev.nombre, eventoId: ev.id });
    }
  }
  return acts;
});

const fetchMisEventos = async () => {
  loading.value = true;
  try {
    const res = await api.get('/logistica/sesiones-academicas/mis-eventos');
    misEventos.value = Array.isArray(res.data) ? res.data : [];

    // Auto-seleccionar si solo hay una actividad
    if (todasActividades.value.length === 1) {
      actividadSeleccionada.value = todasActividades.value[0];
      // Si esa única actividad tiene sesiones, auto-seleccionar la primera
      if (actividadSeleccionada.value.sesiones && actividadSeleccionada.value.sesiones.length > 0) {
        selectedSessionId.value = actividadSeleccionada.value.sesiones[0].id;
      }
    }
  } catch (err) {
    console.error('Error fetching mis eventos', err);
  } finally {
    loading.value = false;
  }
};

const seleccionarActividad = (act: any) => {
  actividadSeleccionada.value = act;
  selectedSessionId.value = act.sesiones && act.sesiones.length > 0 ? act.sesiones[0].id : null;
  stopScanner();
};

const seleccionarSesion = (sesionId: number) => {
  selectedSessionId.value = sesionId;
  stopScanner();
};

const startScanner = () => {
  if (!selectedSessionId.value) {
    Swal.fire('Atención', 'Por favor selecciona una sesión primero.', 'warning');
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
    Swal.fire('Error', err.response?.data?.message || 'Error al registrar asistencia', 'error');
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
    Swal.fire('Error', err.response?.data?.message || 'PIN no válido o ya registrado', 'error');
  } finally {
    pinLoading.value = false;
  }
};

onMounted(fetchMisEventos);
onUnmounted(() => stopScanner());
</script>

<template>
  <div class="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

    <!-- HEADER -->
    <div class="flex items-center justify-between border-b border-slate-200 dark:border-gray-800 pb-5">
      <div>
        <h2 class="text-2xl font-black text-teal-600 dark:text-teal-400 uppercase tracking-tight italic">Control de Asistencias</h2>
        <p class="text-xs text-slate-500 dark:text-gray-400 font-medium mt-1">
          Panel logístico para el registro de presencia en actividades.
        </p>
      </div>
      <div class="h-10 w-10 rounded-xl bg-teal-50 dark:bg-teal-900/20 text-teal-600 flex items-center justify-center border border-teal-100 dark:border-teal-800 shadow-sm">
        <span class="material-symbols-outlined text-[24px]">qr_code_scanner</span>
      </div>
    </div>

    <!-- LOADING -->
    <div v-if="loading" class="flex justify-center py-16">
      <span class="material-symbols-outlined animate-spin text-3xl text-teal-500">progress_activity</span>
    </div>

    <template v-else>
      <!-- SIN ACTIVIDADES ASIGNADAS -->
      <div v-if="todasActividades.length === 0"
           class="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-gray-900 rounded-[2rem] border border-slate-200 dark:border-gray-800 shadow-sm">
        <div class="w-20 h-20 rounded-full bg-amber-50 dark:bg-amber-900/10 flex items-center justify-center mb-6 border-2 border-dashed border-amber-300 dark:border-amber-700">
          <span class="material-symbols-outlined text-3xl text-amber-400">assignment_late</span>
        </div>
        <h3 class="text-base font-black text-slate-700 dark:text-white uppercase tracking-tight">Sin actividades asignadas</h3>
        <p class="text-slate-400 dark:text-gray-500 text-xs mt-2 max-w-xs">
          No tienes actividades académicas asignadas. Contacta a tu coordinador para que te asigne a una actividad.
        </p>
      </div>

      <!-- MAIN SPLIT LAYOUT -->
      <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        <!-- COL 1: LISTADO DE ACTIVIDADES ASIGNADAS -->
        <div class="lg:col-span-1 space-y-4">
          <div class="flex items-center justify-between px-1">
            <span class="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-gray-500">
              Mis Actividades ({{ todasActividades.length }})
            </span>
          </div>

          <div class="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
            <div
              v-for="act in todasActividades"
              :key="act.id"
              @click="seleccionarActividad(act)"
              :class="[
                actividadSeleccionada?.id === act.id
                  ? 'border-teal-500 bg-teal-50/40 dark:bg-teal-900/10 shadow-md shadow-teal-500/5 ring-1 ring-teal-500/20'
                  : 'border-slate-200 dark:border-gray-800 hover:border-slate-300 dark:hover:border-gray-700 bg-white dark:bg-gray-900'
              ]"
              class="relative p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer flex flex-col justify-between"
            >
              <div class="space-y-2">
                <div class="flex justify-between items-start gap-2">
                  <p class="text-[9px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest truncate max-w-[140px]">{{ act.eventoNombre }}</p>
                  <span class="text-[8px] font-black uppercase px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-400">Asignado</span>
                </div>
                <h4 class="text-xs font-black text-slate-800 dark:text-white leading-tight line-clamp-2">{{ act.nombre }}</h4>
              </div>

              <div class="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 dark:border-gray-800/80">
                <span class="text-[10px] font-bold text-slate-500 dark:text-gray-400 flex items-center gap-1">
                  <span class="material-symbols-outlined text-teal-500 text-[14px]">calendar_today</span>
                  {{ act.sesiones?.length || 0 }} Sesión(es)
                </span>
                <span v-if="actividadSeleccionada?.id === act.id" class="text-[9px] font-black text-teal-600 dark:text-teal-400 uppercase tracking-wider">Activo</span>
              </div>
            </div>
          </div>
        </div>

        <!-- COL 2 & 3: CONTROL DE SESIÓN Y REGISTRO -->
        <div class="lg:col-span-2 space-y-6">
          <div v-if="!actividadSeleccionada" class="bg-white dark:bg-gray-900 rounded-[2rem] p-12 text-center border border-slate-200 dark:border-gray-800 shadow-sm">
            <span class="material-symbols-outlined text-4xl text-slate-300 dark:text-gray-600 mb-4 block">arrow_back</span>
            <h4 class="font-black text-slate-700 dark:text-white uppercase text-sm">Selecciona una Actividad</h4>
            <p class="text-xs text-slate-400 dark:text-gray-500 mt-2">Elige una de tus actividades asignadas en el panel izquierdo.</p>
          </div>

          <template v-else>
            <!-- CABECERA DE ACTIVIDAD SELECCIONADA -->
            <div class="bg-gradient-to-r from-teal-600 to-emerald-600 dark:from-teal-950 dark:to-emerald-950 rounded-[2rem] p-6 text-white shadow-lg">
              <p class="text-[9px] font-black uppercase tracking-[0.2em] text-teal-200">Actividad Seleccionada</p>
              <h3 class="text-lg font-black mt-1 leading-tight">{{ actividadSeleccionada.nombre }}</h3>
              <p class="text-[10px] text-teal-100/80 font-medium mt-2">{{ actividadSeleccionada.eventoNombre }}</p>
            </div>

            <!-- PASO 2: SELECCIONAR LA SESIÓN -->
            <div class="bg-white dark:bg-gray-900 rounded-[2rem] p-6 border border-slate-200 dark:border-gray-800 shadow-sm space-y-4">
              <div class="flex items-center gap-2 border-b border-slate-100 dark:border-gray-800 pb-3">
                <span class="material-symbols-outlined text-teal-600 text-[18px]">calendar_today</span>
                <h4 class="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-gray-200">Selecciona la Sesión de Hoy</h4>
              </div>

              <!-- Sin sesiones -->
              <div v-if="!actividadSeleccionada.sesiones || actividadSeleccionada.sesiones.length === 0"
                   class="p-6 bg-slate-50 dark:bg-gray-800 rounded-2xl border border-slate-100 dark:border-gray-700 text-center flex flex-col items-center justify-center">
                <span class="material-symbols-outlined text-slate-400 text-3xl mb-2">event_busy</span>
                <p class="text-xs text-slate-500 dark:text-gray-400 font-bold">Esta actividad no cuenta con sesiones programadas.</p>
              </div>

              <!-- Listado de sesiones horizontal/grid -->
              <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  v-for="s in actividadSeleccionada.sesiones"
                  :key="s.id"
                  @click="seleccionarSesion(s.id)"
                  :class="[
                    selectedSessionId === s.id
                      ? 'border-teal-500 bg-teal-50/30 dark:bg-teal-900/10 shadow-sm ring-1 ring-teal-500/20'
                      : 'border-slate-200 dark:border-gray-800 hover:border-teal-400 hover:bg-slate-50 dark:hover:bg-gray-800',
                  ]"
                  class="p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 bg-white dark:bg-gray-950 relative flex flex-col justify-between"
                >
                  <div class="flex justify-between items-start">
                    <p class="text-[9px] font-black text-teal-600 dark:text-teal-400 uppercase tracking-widest">Sesión programada</p>
                    <span v-if="selectedSessionId === s.id" class="w-4 h-4 rounded-full bg-teal-600 flex items-center justify-center text-white text-[10px] font-bold">✓</span>
                  </div>
                  <h4 class="text-xs font-black text-slate-800 dark:text-white mt-2">{{ s.fecha }}</h4>
                  <div class="flex items-center justify-between text-[10px] text-slate-500 dark:text-gray-400 mt-2 pt-2 border-t border-slate-100 dark:border-gray-900">
                    <span>{{ s.hora_inicio }} — {{ s.hora_fin }}</span>
                    <span v-if="s.aula" class="flex items-center gap-0.5"><span class="material-symbols-outlined text-xs">meeting_room</span>{{ s.aula }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- PASO 3: REGISTRO (QR/PIN) -->
            <div v-if="selectedSessionId" class="bg-white dark:bg-gray-900 rounded-[2rem] p-6 border border-slate-200 dark:border-gray-800 shadow-sm space-y-4">
              <div class="flex items-center justify-between border-b border-slate-100 dark:border-gray-800 pb-3">
                <div class="flex items-center gap-2">
                  <span class="material-symbols-outlined text-teal-600 text-[18px]">verified</span>
                  <h4 class="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-gray-200">Método de Registro</h4>
                </div>
                <!-- Active session info badge -->
                <span class="text-[9px] font-black bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-400 px-3 py-1 rounded-full uppercase tracking-wider">
                  Sesión Activa: {{ actividadSeleccionada.sesiones?.find((s: any) => s.id === selectedSessionId)?.fecha }}
                </span>
              </div>

              <!-- Selector QR/PIN -->
              <div class="flex gap-2 max-w-xs bg-slate-50 dark:bg-gray-950 p-1.5 rounded-2xl border border-slate-100 dark:border-gray-800/80">
                <button @click="activeMode = 'qr'; stopScanner()"
                  :class="activeMode === 'qr' ? 'bg-teal-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-gray-900'"
                  class="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all">
                  <span class="material-symbols-outlined text-xs">qr_code_scanner</span> QR
                </button>
                <button @click="activeMode = 'pin'; stopScanner()"
                  :class="activeMode === 'pin' ? 'bg-teal-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-gray-900'"
                  class="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all">
                  <span class="material-symbols-outlined text-xs">pin</span> PIN
                </button>
              </div>

              <!-- QR Mode Camera Area -->
              <div v-if="activeMode === 'qr'" class="pt-2">
                <div v-if="!scannerActive"
                     class="bg-slate-50 dark:bg-gray-950 border-2 border-dashed border-slate-200 dark:border-gray-850 rounded-2xl p-8 flex flex-col items-center justify-center text-center max-w-md mx-auto">
                  <div class="w-16 h-16 rounded-full bg-teal-50 dark:bg-teal-900/20 text-teal-600 flex items-center justify-center mb-4">
                    <span class="material-symbols-outlined text-2xl">photo_camera</span>
                  </div>
                  <h4 class="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">Activar Cámara Escáner</h4>
                  <p class="text-[10px] text-slate-400 mt-1 max-w-xs">Permite el acceso a la cámara para escanear el código QR del estudiante.</p>
                  <button @click="startScanner"
                    class="mt-5 px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-black rounded-xl shadow-lg shadow-teal-600/10 transition-all uppercase tracking-widest text-[10px] flex items-center gap-2">
                    <span class="material-symbols-outlined text-sm">qr_code_scanner</span> Iniciar Escaneo
                  </button>
                </div>

                <div v-show="scannerActive" class="bg-black rounded-2xl overflow-hidden shadow-xl relative max-w-md mx-auto">
                  <div id="qr-reader" class="w-full"></div>
                  <button @click="stopScanner" class="absolute top-3 right-3 z-10 bg-white/20 backdrop-blur-md text-white p-2 rounded-full hover:bg-red-500 hover:text-white transition-colors shadow-md">
                    <span class="material-symbols-outlined text-sm">close</span>
                  </button>
                </div>
              </div>

              <!-- PIN Mode Area -->
              <div v-else class="pt-2">
                <div class="bg-slate-50 dark:bg-gray-950 border border-slate-200 dark:border-gray-800 rounded-2xl p-6 text-center max-w-md mx-auto">
                  <h4 class="text-xs font-black text-slate-700 dark:text-gray-200 uppercase tracking-widest mb-1">Registro Manual</h4>
                  <p class="text-[10px] text-slate-400 mb-5">Ingresa el código PIN o token proporcionado por el estudiante.</p>
                  
                  <input v-model="pinCode" type="text" placeholder="Código PIN..."
                    class="w-full bg-white dark:bg-gray-900 border-2 border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 text-center text-base font-mono font-black tracking-[0.2em] outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all mb-4"
                    @keyup.enter="registrarPorPin" />
                  
                  <button @click="registrarPorPin" :disabled="pinLoading"
                    class="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-black rounded-xl shadow-lg shadow-teal-600/10 transition-all uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 disabled:opacity-50">
                    <span v-if="pinLoading" class="material-symbols-outlined animate-spin text-xs">progress_activity</span>
                    <span v-else class="material-symbols-outlined text-xs">check_circle</span>
                    {{ pinLoading ? 'Registrando...' : 'Registrar Asistencia' }}
                  </button>
                </div>
              </div>
            </div>
          </template>
        </div>

      </div>
    </template>

  </div>
</template>

<style scoped>
#qr-reader { border: none !important; }
#qr-reader__scan_region { background: white; }
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
