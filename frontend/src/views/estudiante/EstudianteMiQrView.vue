<template>
  <div class="p-6 max-w-lg mx-auto bg-white rounded-lg shadow-md text-center mt-10">
    <h1 class="text-2xl font-bold mb-4 text-gray-800">Mi Código QR</h1>
    <p class="text-gray-600 mb-6">Muestra este código al docente o personal de logística para registrar tu asistencia.</p>
    
    <div v-if="loading" class="flex justify-center my-10">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>

    <div v-else-if="error" class="text-red-500 my-10">
      {{ error }}
      <br>
      <button @click="fetchQr" class="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">Reintentar</button>
    </div>

    <div v-else class="flex flex-col items-center">
      <div class="p-4 bg-white border-4 border-indigo-100 rounded-xl shadow-inner inline-block">
        <qrcode-vue :value="qrToken" :size="250" level="H" />
      </div>
      <p class="text-sm text-gray-400 mt-4">Este código se actualiza automáticamente cada 5 minutos por seguridad.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import QrcodeVue from 'qrcode.vue';
import { QrService } from '@/services/qr.service';

const qrToken = ref('');
const loading = ref(true);
const error = ref('');
let intervalId: ReturnType<typeof setInterval>;

const fetchQr = async () => {
  loading.value = true;
  error.value = '';
  try {
    const data = await QrService.getEstudianteQr();
    qrToken.value = data.qr_token;
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Error al obtener el código QR';
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchQr();
  // Refrescar cada 4.5 minutos (270,000 ms) antes de que expire a los 5 minutos
  intervalId = setInterval(fetchQr, 270000);
});

onUnmounted(() => {
  if (intervalId) clearInterval(intervalId);
});
</script>
