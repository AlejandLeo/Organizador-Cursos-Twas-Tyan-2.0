<template>
  <div class="p-6 md:p-12 min-h-[calc(100vh-100px)] flex flex-col items-center justify-center bg-gray-50">
    <div class="max-w-4xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
      
      <!-- Lado Izquierdo: Información y PIN -->
      <div class="flex-1 p-8 md:p-12 bg-indigo-600 text-white flex flex-col justify-center items-center text-center">
        <h2 class="text-3xl md:text-4xl font-bold mb-4">Registro de Asistencia</h2>
        <p class="text-indigo-100 mb-8 text-lg">Sesión Académica #{{ idSesion }}</p>
        
        <div class="bg-white/10 p-6 rounded-xl border border-white/20 w-full mb-6">
          <p class="text-sm uppercase tracking-wider font-semibold text-indigo-200 mb-2">Ingresa este PIN</p>
          <p class="text-5xl md:text-6xl font-mono font-bold tracking-widest">{{ codVerificacion || '------' }}</p>
        </div>
        
        <p class="text-indigo-100 mt-auto">Opción 1: Ingresa el PIN en tu dispositivo</p>
      </div>

      <!-- Lado Derecho: Código QR -->
      <div class="flex-1 p-8 md:p-12 flex flex-col items-center justify-center bg-white relative">
        <h3 class="text-xl font-bold text-gray-800 mb-6 uppercase tracking-wider">Opción 2: Escanea el QR</h3>
        
        <div v-if="loading" class="flex flex-col items-center justify-center h-64">
          <div class="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mb-4"></div>
          <p class="text-gray-500">Generando QR dinámico...</p>
        </div>

        <div v-else-if="error" class="text-red-500 text-center flex flex-col items-center">
          <svg class="w-16 h-16 mb-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          <p class="text-lg font-medium">{{ error }}</p>
          <button @click="fetchQrAndSessionDetails" class="mt-6 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">Reintentar</button>
        </div>

        <div v-else class="flex flex-col items-center">
          <div class="p-6 border-8 border-gray-100 rounded-3xl shadow-sm">
            <qrcode-vue :value="qrToken" :size="300" level="H" />
          </div>
          
          <div class="mt-8 flex items-center text-sm text-gray-500 bg-gray-50 px-4 py-2 rounded-full">
            <svg class="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
            Código seguro. Se actualiza cada 15 min.
          </div>
        </div>
      </div>
      
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import QrcodeVue from 'qrcode.vue';
import { QrService } from '@/services/qr.service';
import { sesionesAcademicasService } from '@/services/sesiones-academicas.service'; // Supuesto servicio para obtener detalles de la sesión

const route = useRoute();
const idSesion = Number(route.params.id);

const qrToken = ref('');
const codVerificacion = ref('');
const loading = ref(true);
const error = ref('');
let intervalId: ReturnType<typeof setInterval>;

const fetchQrAndSessionDetails = async () => {
  loading.value = true;
  error.value = '';
  try {
    // 1. Obtener el QR
    const data = await QrService.getSesionQr(idSesion);
    qrToken.value = data.qr_token;

    // 2. Obtener el código PIN de la sesión (opcional si ya viene o lo sacas del endpoint)
    // Asumiendo que tienes un servicio para pedir la sesión:
    try {
      const sesionData = await sesionesAcademicasService.getById(idSesion);
      codVerificacion.value = sesionData.data.cod_verificacion || 'NO PIN';
    } catch (e) {
      console.warn("No se pudo obtener el PIN de la sesión", e);
      codVerificacion.value = 'NO PIN';
    }
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Error al obtener el código QR de la sesión';
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchQrAndSessionDetails();
  // Refrescar cada 14.5 minutos (870,000 ms) antes de que expire a los 15 min
  intervalId = setInterval(fetchQrAndSessionDetails, 870000);
});

onUnmounted(() => {
  if (intervalId) clearInterval(intervalId);
});
</script>
