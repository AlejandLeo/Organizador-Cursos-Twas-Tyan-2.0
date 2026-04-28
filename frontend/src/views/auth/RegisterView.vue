<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { authService } from '@/services/auth.service';
import Swal from 'sweetalert2';

const router = useRouter();

const formData = ref({
  nombres: '',
  primer_apellido: '',
  segundo_apellido: '',
  tipo_documento: 'Carnet de Identidad',
  numero_documento: '',
  email: '',
  password: '',
  confirmPassword: ''
});

const archivoAval = ref<File | null>(null);
const archivoReverso = ref<File | null>(null);
const isImage = ref(false);

const error = ref('');
const loading = ref(false);

const handleFileUpload = (event: Event) => {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
        archivoAval.value = file;
        isImage.value = file.type.startsWith('image/');
        if (!isImage.value) {
            archivoReverso.value = null;
        }
    }
};

const handleReversoUpload = (event: Event) => {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
        archivoReverso.value = file;
    }
};

const handleRegister = async () => {
    loading.value = true;
    error.value = '';

    if (formData.value.password !== formData.value.confirmPassword) {
        error.value = 'Las contraseñas no coinciden';
        loading.value = false;
        return;
    }

    if (!archivoAval.value) {
        error.value = 'Debe adjuntar el documento de aval.';
        loading.value = false;
        return;
    }

    if (isImage.value && !archivoReverso.value) {
        error.value = 'Para formatos de imagen, debe adjuntar tanto el anverso como el reverso.';
        loading.value = false;
        return;
    }

    try {
        const payload = new FormData();
        payload.append('nombres', formData.value.nombres);
        payload.append('primer_apellido', formData.value.primer_apellido);
        if (formData.value.segundo_apellido) {
            payload.append('segundo_apellido', formData.value.segundo_apellido);
        }
        payload.append('documento_identidad', `${formData.value.tipo_documento}: ${formData.value.numero_documento}`);
        payload.append('email', formData.value.email);
        payload.append('password', formData.value.password);
        payload.append('file', archivoAval.value);
        if (archivoReverso.value) {
            payload.append('fileReverso', archivoReverso.value);
        }

        // Enviamos los datos al nuevo endpoint
        const response: any = await authService.registrarSolicitud(payload);
        
        // Limpiamos cualquier rastro de token
        localStorage.removeItem('token');

        // Mostrar mensaje de éxito usando Swal
        await Swal.fire({
            icon: 'success',
            title: 'Solicitud Recibida',
            text: response.data?.mensaje || 'Su solicitud fue recepcionada correctamente. La confirmación de su cuenta se realizará una vez finalice el proceso de inscripciones y sea validada por administración.',
            confirmButtonText: 'Entendido',
            confirmButtonColor: '#0284c7' // bg-sky-600
        });

        // Si es exitoso, mandamos a login
        router.push('/login');
    } catch (e: any) {
        console.error(e);
        error.value = e.response?.data?.message || 'Ocurrió un error al registrarse. Verifique los datos o el tamaño del archivo adjunto.';
    } finally {
        loading.value = false;
    }
};
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-gray-950 p-4 sm:p-6 lg:p-8 transition-colors duration-300">
    <div class="w-full max-w-4xl p-8 md:p-12 space-y-8 bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-2xl border-t-8 border-sky-600 dark:border-sky-500">
      
      <div class="text-center">
        <div class="inline-block">
          <h2 class="text-sky-900 dark:text-sky-400 font-black italic text-5xl tracking-tighter leading-none">twas</h2>
          <p class="text-[9px] leading-tight text-sky-900/60 dark:text-sky-400/60 uppercase font-bold tracking-tighter mt-1">The World Academy of Sciences</p>
        </div>
        <h1 class="text-3xl font-black text-sky-950 dark:text-white tracking-tight uppercase mt-6">Solicitud de Registro</h1>
        <p class="mt-2 text-center text-xs font-bold text-slate-500 dark:text-slate-400">
          ¿Ya tienes una cuenta aprobada? 
          <router-link to="/login" class="font-black text-sky-600 hover:text-sky-800 dark:text-sky-400 dark:hover:text-sky-300 uppercase transition-colors">
            Inicia Sesión
          </router-link>
        </p>
      </div>

      <form class="space-y-8" @submit.prevent="handleRegister">
        
        <!-- Bloque 1: Información Personal Requerida -->
        <div class="border-b border-slate-200 dark:border-gray-800 pb-8">
          <h3 class="flex items-center gap-2 text-sm font-black text-sky-600 dark:text-sky-500 uppercase tracking-widest mb-6">
            <span class="material-symbols-outlined text-[20px]">person</span>
            Información de Identidad
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
            <div>
              <label for="nombres" class="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 block">Nombre(s) <span class="text-red-500">*</span></label>
              <input id="nombres" v-model="formData.nombres" type="text" required class="w-full py-3 px-4 bg-slate-50 dark:bg-gray-800/50 border border-slate-200 dark:border-gray-700/50 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 dark:focus:bg-gray-800 outline-none transition-all" />
            </div>
            <div>
              <label for="primer_apellido" class="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 block">Primer Apellido <span class="text-red-500">*</span></label>
              <input id="primer_apellido" v-model="formData.primer_apellido" type="text" required class="w-full py-3 px-4 bg-slate-50 dark:bg-gray-800/50 border border-slate-200 dark:border-gray-700/50 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 dark:focus:bg-gray-800 outline-none transition-all" />
            </div>
            <div>
              <label for="segundo_apellido" class="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 block">Seg. Apellido (Opcional)</label>
              <input id="segundo_apellido" v-model="formData.segundo_apellido" type="text" class="w-full py-3 px-4 bg-slate-50 dark:bg-gray-800/50 border border-slate-200 dark:border-gray-700/50 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 dark:focus:bg-gray-800 outline-none transition-all" />
            </div>
            
            <div class="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label for="tipo_doc" class="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 block">Tipo de Documento <span class="text-red-500">*</span></label>
                <select id="tipo_doc" v-model="formData.tipo_documento" required class="w-full py-3 px-4 bg-slate-50 dark:bg-gray-800/50 border border-slate-200 dark:border-gray-700/50 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 dark:focus:bg-gray-800 outline-none transition-all appearance-none cursor-pointer">
                  <option>Carnet de Identidad</option>
                  <option>Licencia de Conducir</option>
                  <option>Pasaporte</option>
                  <option>Documento de Identidad Extranjero</option>
                  <option>Otro Documento Válido</option>
                </select>
              </div>
              <div>
                <label for="numero_doc" class="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 block">Número de Documento <span class="text-red-500">*</span></label>
                <input id="numero_doc" v-model="formData.numero_documento" type="text" required placeholder="Ej: 1234567 LP" class="w-full py-3 px-4 bg-slate-50 dark:bg-gray-800/50 border border-slate-200 dark:border-gray-700/50 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 dark:focus:bg-gray-800 outline-none transition-all" />
              </div>
            </div>
          </div>
        </div>

        <!-- Bloque 2: Credenciales de Acceso -->
        <div class="border-b border-slate-200 dark:border-gray-800 pb-8">
          <h3 class="flex items-center gap-2 text-sm font-black text-sky-600 dark:text-sky-500 uppercase tracking-widest mb-6">
             <span class="material-symbols-outlined text-[20px]">lock</span>
             Credenciales de Acceso
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
            <div class="md:col-span-2">
              <label for="email" class="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 block">Correo Electrónico (Será tu Usuario) <span class="text-red-500">*</span></label>
              <input id="email" v-model="formData.email" type="email" autocomplete="email" required class="w-full py-3 px-4 bg-slate-50 dark:bg-gray-800/50 border border-slate-200 dark:border-gray-700/50 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 dark:focus:bg-gray-800 outline-none transition-all" />
            </div>
            <div>
              <label for="password" class="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 block">Contraseña <span class="text-red-500">*</span></label>
              <input id="password" v-model="formData.password" type="password" required class="w-full py-3 px-4 bg-slate-50 dark:bg-gray-800/50 border border-slate-200 dark:border-gray-700/50 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 dark:focus:bg-gray-800 outline-none transition-all" />
            </div>
            <div>
              <label for="confirmPassword" class="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 block">Confirmar Contraseña <span class="text-red-500">*</span></label>
              <input id="confirmPassword" v-model="formData.confirmPassword" type="password" required class="w-full py-3 px-4 bg-slate-50 dark:bg-gray-800/50 border border-slate-200 dark:border-gray-700/50 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 dark:focus:bg-gray-800 outline-none transition-all" />
            </div>
          </div>
        </div>

        <div class="border-b border-slate-200 dark:border-gray-800 pb-8">
          <h3 class="flex items-center gap-2 text-sm font-black text-sky-600 dark:text-sky-500 uppercase tracking-widest mb-6">
             <span class="material-symbols-outlined text-[20px]">upload_file</span>
             Documento de Aval <span class="text-red-500">*</span>
          </h3>
          <div class="bg-sky-50/50 dark:bg-sky-900/10 p-6 rounded-2xl border border-sky-100 dark:border-sky-900/50">
            <p class="text-xs text-slate-600 dark:text-slate-300 mb-4 font-medium">
              Suba su documento en formato <b>PDF</b> (un solo archivo) o como <b>Imagen</b> (anverso y reverso obligatorios).
            </p>
            
            <div class="space-y-4">
                <div class="relative">
                    <label class="text-[10px] font-black text-sky-600 uppercase mb-1 block">{{ isImage ? 'Anverso de la Imagen' : 'Archivo de Aval (PDF o Imagen)' }}</label>
                    <input id="archivo_aval" type="file" @change="handleFileUpload" accept=".pdf,image/png,image/jpeg,image/jpg" required class="w-full file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-sky-600 file:text-white hover:file:bg-sky-700 transition-all text-sm text-slate-500 dark:text-slate-400 cursor-pointer" />
                </div>

                <div v-if="isImage" class="relative animate-in slide-in-from-top-2 duration-300">
                    <label class="text-[10px] font-black text-sky-600 uppercase mb-1 block">Reverso de la Imagen <span class="text-red-500">*</span></label>
                    <input id="archivo_reverso" type="file" @change="handleReversoUpload" accept="image/png,image/jpeg,image/jpg" required class="w-full file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-sky-600 file:text-white hover:file:bg-sky-700 transition-all text-sm text-slate-500 dark:text-slate-400 cursor-pointer" />
                </div>
            </div>

            <div v-if="archivoAval" class="mt-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800/50">
                <p class="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                    <span class="material-symbols-outlined text-[14px]">check_circle</span>
                    Principal: {{ archivoAval.name }}
                </p>
                <p v-if="archivoReverso" class="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2 mt-1">
                    <span class="material-symbols-outlined text-[14px]">check_circle</span>
                    Reverso: {{ archivoReverso.name }}
                </p>
            </div>
          </div>
        </div>

        <div v-if="error" class="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-xl shadow-sm">
          <p class="text-sm font-bold text-red-800 dark:text-red-400">{{ error }}</p>
        </div>

        <div class="pt-2">
          <button type="submit" :disabled="loading" class="w-full flex justify-center items-center gap-2 py-4 px-4 rounded-2xl text-sm font-black uppercase tracking-widest text-white bg-gradient-to-r from-sky-500 to-sky-700 shadow-xl hover:shadow-sky-500/50 hover:-translate-y-0.5 active:translate-y-[2px] active:shadow-none focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 dark:focus:ring-offset-gray-900 transition-all duration-300 disabled:opacity-70 disabled:hover:translate-y-0">
            <span v-if="loading" class="material-symbols-outlined animate-spin text-[20px]">autorenew</span>
            {{ loading ? 'Enviando Solicitud...' : 'Enviar Solicitud de Registro' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; vertical-align: middle; }
</style>
