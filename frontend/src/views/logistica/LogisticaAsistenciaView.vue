<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { Html5QrcodeScanner } from 'html5-qrcode';
import api from '@/services/api';
import Swal from 'sweetalert2';

const events = ref<any[]>([]);
const activities = ref<any[]>([]);
const sessions = ref<any[]>([]);

const selectedEventId = ref<number | null>(null);
const selectedActivityId = ref<number | null>(null);
const selectedSessionId = ref<number | null>(null);

const loading = ref(false);
const scannerActive = ref(false);
let scanner: Html5QrcodeScanner | null = null;

const fetchEvents = async () => {
  try {
    const res = await api.get('/eventos');
    events.value = Array.isArray(res.data) ? res.data : res.data.data || [];
  } catch (err) {
    console.error('Error fetching events', err);
  }
};

const fetchActivities = async () => {
  if (!selectedEventId.value) return;
  try {
    const res = await api.get(`/eventos/${selectedEventId.value}/actividades`);
    activities.value = res.data || [];
    selectedActivityId.value = null;
    selectedSessionId.value = null;
    sessions.value = [];
  } catch (err) {
    console.error('Error fetching activities', err);
  }
};

const fetchSessions = async () => {
  if (!selectedActivityId.value) return;
  try {
    // Necesitamos un endpoint que nos dé las sesiones de una actividad
    // Por ahora intentaremos buscar en la actividad o usar un endpoint común
    const res = await api.get(`/sesiones-academicas/actividad/${selectedActivityId.value}`);
    sessions.value = res.data || [];
    selectedSessionId.value = null;
  } catch (err) {
    console.error('Error fetching sessions', err);
    // Fallback: Si el endpoint no existe, mostrar error
    Swal.fire('Error', 'No se pudieron cargar las sesiones de esta actividad.', 'error');
  }
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
      /* verbose= */ false
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
  // decodedText es el token
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
      footer: `Código: ${res.data.codigo_asistencia}`,
      timer: 3000
    });
  } catch (err: any) {
    const msg = err.response?.data?.message || 'Error al registrar asistencia';
    Swal.fire('Error', msg, 'error');
  } finally {
    loading.value = false;
    // Reiniciar scanner tras un breve delay si se desea
  }
};

const onScanFailure = (error: any) => {
  // silent
};

onMounted(() => {
  fetchEvents();
});

onUnmounted(() => {
  stopScanner();
});
</script>

<template>
  <div class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div class="flex items-center justify-between border-b border-slate-200 dark:border-gray-800 pb-6">
      <div>
        <h2 class="text-3xl font-black text-teal-600 dark:text-teal-400 uppercase tracking-tighter italic">Registro de Asistencia</h2>
        <p class="text-slate-500 dark:text-gray-400 font-medium mt-1">Escaneo de códigos QR dinámicos para estudiantes y ponentes.</p>
      </div>
      <div class="h-12 w-12 rounded-2xl bg-teal-50 dark:bg-teal-900/20 text-teal-600 flex items-center justify-center border border-teal-100 dark:border-teal-800 shadow-sm">
        <span class="material-symbols-outlined text-[28px]">qr_code_scanner</span>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Configuración de Sesión -->
      <div class="lg:col-span-1 space-y-6">
        <div class="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-slate-200 dark:border-gray-800 shadow-sm space-y-5">
          <h3 class="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <span class="material-symbols-outlined text-sm">settings</span>
            Parámetros de Registro
          </h3>

          <div class="space-y-4">
            <div>
              <label class="text-[10px] font-black uppercase text-slate-500 dark:text-gray-400 pl-1 mb-1 block">Seleccionar Evento</label>
              <select v-model="selectedEventId" @change="fetchActivities" class="w-full bg-slate-50 dark:bg-gray-800 border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-teal-500 transition-all">
                <option :value="null">Elija un evento...</option>
                <option v-for="e in events" :key="e.id" :value="e.id">{{ e.nombre_evento }}</option>
              </select>
            </div>

            <div v-if="selectedEventId">
              <label class="text-[10px] font-black uppercase text-slate-500 dark:text-gray-400 pl-1 mb-1 block">Seleccionar Actividad</label>
              <select v-model="selectedActivityId" @change="fetchSessions" class="w-full bg-slate-50 dark:bg-gray-800 border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-teal-500 transition-all">
                <option :value="null">Elija una actividad...</option>
                <option v-for="a in activities" :key="a.id" :value="a.id">{{ a.titulo }}</option>
              </select>
            </div>

            <div v-if="selectedActivityId">
              <label class="text-[10px] font-black uppercase text-slate-500 dark:text-gray-400 pl-1 mb-1 block">Sesión Académica / Horario</label>
              <select v-model="selectedSessionId" class="w-full bg-slate-50 dark:bg-gray-800 border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-teal-500 transition-all">
                <option :value="null">Seleccione el horario...</option>
                <option v-for="s in sessions" :key="s.id" :value="s.id">
                  {{ s.fecha }} | {{ s.hora_inicio }} - {{ s.hora_fin }} ({{ s.aula }})
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
      </div>

      <!-- Scanner Area -->
      <div class="lg:col-span-2">
        <div v-if="!scannerActive" class="bg-white dark:bg-gray-900 aspect-video rounded-3xl border-2 border-dashed border-slate-200 dark:border-gray-800 flex flex-col items-center justify-center p-12 text-center group">
          <div class="w-24 h-24 rounded-full bg-teal-50 dark:bg-teal-900/20 text-teal-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
            <span class="material-symbols-outlined text-5xl">photo_camera</span>
          </div>
          <h3 class="text-xl font-black text-slate-800 dark:text-white uppercase">Activar Escáner</h3>
          <p class="text-slate-400 dark:text-gray-500 max-w-sm mt-2 text-sm">Asegúrese de haber seleccionado la sesión académica correcta antes de iniciar.</p>
          
          <button @click="startScanner" :disabled="!selectedSessionId" class="mt-8 px-10 py-4 bg-teal-600 hover:bg-teal-700 text-white font-black rounded-2xl shadow-xl shadow-teal-600/20 transition-all transform hover:scale-105 active:scale-95 disabled:opacity-30 disabled:grayscale uppercase tracking-widest text-xs flex items-center gap-3">
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
      </div>
    </div>

    <!-- Instrucciones Rápidas -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="p-6 bg-white dark:bg-gray-900 rounded-3xl border border-slate-200 dark:border-gray-800 flex gap-4 items-start">
        <div class="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center shrink-0">1</div>
        <p class="text-xs font-medium text-slate-500 dark:text-gray-400"><strong class="text-slate-700 dark:text-gray-200 uppercase block mb-1">Cargar Datos</strong> Selecciona el evento, la actividad y finalmente el horario de la sesión.</p>
      </div>
      <div class="p-6 bg-white dark:bg-gray-900 rounded-3xl border border-slate-200 dark:border-gray-800 flex gap-4 items-start">
        <div class="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 flex items-center justify-center shrink-0">2</div>
        <p class="text-xs font-medium text-slate-500 dark:text-gray-400"><strong class="text-slate-700 dark:text-gray-200 uppercase block mb-1">Escanear</strong> El estudiante debe mostrar su QR desde su perfil. El código expira cada 15 min.</p>
      </div>
      <div class="p-6 bg-white dark:bg-gray-900 rounded-3xl border border-slate-200 dark:border-gray-800 flex gap-4 items-start">
        <div class="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 flex items-center justify-center shrink-0">3</div>
        <p class="text-xs font-medium text-slate-500 dark:text-gray-400"><strong class="text-slate-700 dark:text-gray-200 uppercase block mb-1">Confirmar</strong> El sistema notificará si el registro fue exitoso o si hubo algún error de horario o inscripción.</p>
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
