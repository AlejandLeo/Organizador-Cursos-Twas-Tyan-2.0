<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import QrcodeVue from 'qrcode.vue';
import api from '@/services/api';

const qrToken = ref('');
const loading = ref(false);
const timeLeft = ref(900); // 15 minutos en segundos
let timer: any = null;
let refreshInterval: any = null;

const fetchQR = async () => {
  try {
    loading.value = true;
    const res = await api.get('/usuarios/me/asistencia-qr');
    qrToken.value = res.data.token;
    timeLeft.value = 900;
  } catch (err) {
    console.error('Error fetching QR token', err);
  } finally {
    loading.value = false;
  }
};

const startTimer = () => {
  timer = setInterval(() => {
    if (timeLeft.value > 0) {
      timeLeft.value--;
    }
  }, 1000);

  // Refrescar cada 14 minutos para asegurar validez
  refreshInterval = setInterval(fetchQR, 14 * 60 * 1000);
};

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

onMounted(() => {
  fetchQR();
  startTimer();
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
  if (refreshInterval) clearInterval(refreshInterval);
});
</script>

<template>
  <div class="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-slate-200 dark:border-gray-800 shadow-sm flex flex-col items-center text-center">
    <h3 class="text-sm font-black uppercase text-slate-700 dark:text-gray-200 mb-4 tracking-widest">Mi QR de Asistencia</h3>
    
    <div class="relative p-4 bg-white rounded-xl border border-slate-100 shadow-inner mb-4">
      <qrcode-vue v-if="qrToken" :value="qrToken" :size="200" level="H" />
      <div v-else-if="loading" class="w-[200px] h-[200px] flex items-center justify-center bg-slate-50 dark:bg-gray-800 rounded-lg">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-umsa-blue"></div>
      </div>
      <div v-else class="w-[200px] h-[200px] flex items-center justify-center bg-slate-50 dark:bg-gray-800 rounded-lg text-slate-400">
        <span class="material-symbols-outlined text-4xl">qr_code_2</span>
      </div>
    </div>

    <div class="flex items-center gap-2 mb-2">
      <div class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
      <span class="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Código Dinámico Activo</span>
    </div>

    <p class="text-[10px] text-slate-400 dark:text-gray-500 leading-tight">
      Este código se renueva automáticamente.<br>
      Expira en: <span class="font-bold text-umsa-blue dark:text-blue-400">{{ formatTime(timeLeft) }}</span>
    </p>

    <button @click="fetchQR" :disabled="loading" class="mt-4 text-[10px] px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-slate-600 dark:text-gray-300 font-bold rounded-lg transition-colors border border-slate-200 dark:border-gray-700 uppercase tracking-wider disabled:opacity-50 flex items-center gap-2">
      <span class="material-symbols-outlined text-xs">refresh</span>
      Actualizar Ahora
    </button>
  </div>
</template>
