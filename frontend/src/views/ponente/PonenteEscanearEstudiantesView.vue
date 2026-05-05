<template>
  <div class="p-6 max-w-2xl mx-auto mt-6 bg-white rounded-lg shadow-md">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold text-gray-800">Escanear Asistencia (Sesión #{{ idSesion }})</h1>
      <span class="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium border border-green-200">
        Escaneo Continuo Activo
      </span>
    </div>

    <p class="text-gray-600 mb-6">Apunta la cámara al QR del estudiante. El escaneo registrará la asistencia automáticamente y la cámara seguirá encendida para el siguiente estudiante.</p>

    <div class="flex flex-col items-center">
      <div class="w-full max-w-md rounded-xl overflow-hidden border-4 border-indigo-100 bg-black aspect-square relative shadow-inner">
        <qrcode-stream @detect="onDetect" @init="onInit"></qrcode-stream>
        
        <div v-if="cameraLoading" class="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 bg-opacity-70 text-white">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-3"></div>
          Iniciando cámara...
        </div>
        
        <div v-if="cameraError" class="absolute inset-0 flex items-center justify-center bg-red-900 bg-opacity-90 text-white text-center p-6">
          <div>
            <svg class="w-12 h-12 mx-auto mb-3 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            <p class="font-bold text-lg mb-1">Error de Cámara</p>
            <p class="text-sm text-red-200">{{ cameraError }}</p>
          </div>
        </div>

        <!-- Feedback overlay flash (green/red) -->
        <transition name="fade">
          <div v-if="scanFeedback" 
               :class="['absolute inset-0 z-10 opacity-60 mix-blend-overlay', 
                       scanFeedback === 'success' ? 'bg-green-500' : 'bg-red-500']">
          </div>
        </transition>
      </div>
      
      <p class="mt-6 text-sm text-gray-500 bg-gray-50 px-4 py-2 rounded-lg border border-gray-100">
        💡 <strong class="text-gray-700">Tip:</strong> Asegúrate de que el código QR esté bien iluminado.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRoute } from 'vue-router';
import { QrcodeStream } from 'vue-qrcode-reader';
import { asistenciasService } from '@/services/asistencias.service';
import Swal from 'sweetalert2';

const route = useRoute();
const idSesion = Number(route.params.id);

const cameraLoading = ref(true);
const cameraError = ref('');
const scanFeedback = ref<'success' | 'error' | null>(null);

// Para evitar escaneos dobles rápidos del mismo QR
let lastScanned = '';
let scanTimeout: any = null;

const onInit = async (promise: Promise<any>) => {
  try {
    await promise;
    cameraLoading.value = false;
  } catch (error: any) {
    cameraLoading.value = false;
    if (error.name === 'NotAllowedError') {
      cameraError.value = "Se denegó el permiso para usar la cámara.";
    } else if (error.name === 'NotFoundError') {
      cameraError.value = "No se encontró cámara disponible.";
    } else {
      cameraError.value = error.message || "Error al iniciar la cámara.";
    }
  }
};

const onDetect = async (detectedCodes: any[]) => {
  if (detectedCodes.length === 0) return;
  const token = detectedCodes[0].rawValue;
  
  if (token === lastScanned) return; // Ya se escaneó este mismo QR recientemente
  
  lastScanned = token;
  clearTimeout(scanTimeout);
  scanTimeout = setTimeout(() => { lastScanned = ''; }, 3000); // Permitir escanear al mismo alumno otra vez después de 3s (por si hubo error)

  await procesarAsistencia(token);
};

const procesarAsistencia = async (qr_token: string) => {
  const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 2000,
    timerProgressBar: true,
  });

  try {
    const res = await asistenciasService.scanEstudianteQr(qr_token, idSesion);
    
    // Feedback visual en la cámara
    scanFeedback.value = 'success';
    setTimeout(() => { scanFeedback.value = null; }, 300);

    Toast.fire({
      icon: 'success',
      title: res.data?.mensaje || 'Asistencia registrada.'
    });

  } catch (error: any) {
    // Feedback visual en la cámara
    scanFeedback.value = 'error';
    setTimeout(() => { scanFeedback.value = null; }, 300);

    // Si ya está registrado, lo manejamos amigablemente
    const msg = error.response?.data?.message || 'QR inválido o error de red.';
    const isAlreadyRegistered = msg.toLowerCase().includes('ya tiene asistencia') || msg.toLowerCase().includes('ya se registró');

    Toast.fire({
      icon: isAlreadyRegistered ? 'info' : 'error',
      title: msg
    });
  }
};
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
