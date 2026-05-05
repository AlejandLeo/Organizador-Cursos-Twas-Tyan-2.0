<template>
  <div class="p-6 max-w-2xl mx-auto mt-6 bg-white rounded-lg shadow-md">
    <h1 class="text-2xl font-bold mb-6 text-gray-800 text-center">Marcar Asistencia</h1>

    <!-- Pestañas de opción -->
    <div class="flex border-b mb-6">
      <button 
        @click="mode = 'scan'"
        :class="['flex-1 py-3 text-center font-medium', mode === 'scan' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700']"
      >
        Escanear QR
      </button>
      <button 
        @click="mode = 'pin'"
        :class="['flex-1 py-3 text-center font-medium', mode === 'pin' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700']"
      >
        Ingresar PIN
      </button>
    </div>

    <!-- Opción: Escanear QR -->
    <div v-if="mode === 'scan'" class="flex flex-col items-center">
      <p class="text-gray-600 mb-4 text-center">Apunta la cámara al código QR proyectado por el docente.</p>
      
      <div class="w-full max-w-sm rounded-lg overflow-hidden border-2 border-indigo-200 bg-black aspect-square relative">
        <qrcode-stream @detect="onDetect" @init="onInit"></qrcode-stream>
        <div v-if="cameraLoading" class="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 text-white">
          Cargando cámara...
        </div>
        <div v-if="cameraError" class="absolute inset-0 flex items-center justify-center bg-red-900 bg-opacity-80 text-white text-center p-4">
          {{ cameraError }}
        </div>
      </div>
      
      <p class="mt-4 text-sm text-gray-500">El escaneo es automático.</p>
    </div>

    <!-- Opción: PIN -->
    <div v-else class="flex flex-col items-center">
      <p class="text-gray-600 mb-4 text-center">Ingresa el código PIN proporcionado por el docente para la sesión actual.</p>
      
      <form @submit.prevent="submitPin" class="w-full max-w-sm">
        <input 
          v-model="pinCode" 
          type="text" 
          placeholder="Ej: ABC123" 
          required
          class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-center text-xl uppercase tracking-widest mb-4"
        >
        <button 
          type="submit" 
          :disabled="isSubmitting || !pinCode"
          class="w-full py-3 px-4 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          <span v-if="isSubmitting">Validando...</span>
          <span v-else>Marcar Asistencia</span>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { QrcodeStream } from 'vue-qrcode-reader';
import { asistenciasService } from '@/services/asistencias.service';
import Swal from 'sweetalert2';

const mode = ref<'scan' | 'pin'>('scan');
const pinCode = ref('');
const isSubmitting = ref(false);
const cameraLoading = ref(true);
const cameraError = ref('');

// Para evitar escaneos dobles rápidos
let lastScanned = '';
let scanTimeout: any = null;

const onInit = async (promise: Promise<any>) => {
  try {
    await promise;
    cameraLoading.value = false;
  } catch (error: any) {
    cameraLoading.value = false;
    if (error.name === 'NotAllowedError') {
      cameraError.value = "Necesitas dar permiso para usar la cámara.";
    } else if (error.name === 'NotFoundError') {
      cameraError.value = "No se encontró ninguna cámara en este dispositivo.";
    } else {
      cameraError.value = "Error al iniciar la cámara: " + error.message;
    }
  }
};

const onDetect = async (detectedCodes: any[]) => {
  if (detectedCodes.length === 0) return;
  const token = detectedCodes[0].rawValue;
  
  if (token === lastScanned) return; // Prevenir múltiples llamadas iguales
  
  lastScanned = token;
  clearTimeout(scanTimeout);
  scanTimeout = setTimeout(() => { lastScanned = ''; }, 3000); // Reset tras 3 segundos

  await procesarAsistencia({ qr_token: token });
};

const submitPin = async () => {
  if (!pinCode.value) return;
  await procesarAsistencia({ codigo_manual: pinCode.value.toUpperCase() });
};

const procesarAsistencia = async (data: { qr_token?: string, codigo_manual?: string }) => {
  isSubmitting.value = true;
  
  const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
  });

  try {
    const res = await asistenciasService.scanSesionQr(data);
    Toast.fire({
      icon: 'success',
      title: res.data.mensaje || 'Asistencia registrada correctamente.'
    });
    if (data.codigo_manual) pinCode.value = ''; // Limpiar si fue por PIN
  } catch (error: any) {
    Toast.fire({
      icon: 'error',
      title: error.response?.data?.message || 'Error al registrar asistencia.'
    });
  } finally {
    isSubmitting.value = false;
  }
};
</script>
