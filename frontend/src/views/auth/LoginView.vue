<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import Swal from 'sweetalert2';
import api from '@/services/api';
import { useI18n } from 'vue-i18n';

const router = useRouter();
const authStore = useAuthStore();
const { t } = useI18n();

const email = ref('');
const password = ref('');
const error = ref('');
const loading = ref(false);
const showPassword = ref(false);

const handleLogin = async () => {
  loading.value = true;
  error.value = '';
  
  try {
    // Limpiar sesión anterior para evitar conflictos
    localStorage.removeItem('token');
    
    await authStore.login(email.value, password.value);
    
    // Redirigir al portal correspondiente según el rol
    router.push(authStore.getRutaInicio());
  } catch (e: any) {
    error.value = e.response?.data?.message || 'Credenciales inválidas';
  } finally {
    loading.value = false;
  }
};

const abrirSoporte = () => {
  Swal.fire({
    title: '<span class="text-[#003a70]">¿Olvidaste tu contraseña?</span>',
    html: `
      <div class="text-left space-y-4">
        <p class="text-xs text-slate-500 font-medium leading-relaxed">Envíanos tu correo electrónico institucional o personal registrado y el administrador se pondrá en contacto contigo para restablecer tu acceso.</p>
        <div>
          <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Correo Electrónico</label>
          <input id="swal-email" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:border-[#003a70] outline-none transition-all" placeholder="ejemplo@umsa.bo">
        </div>
        <div>
          <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Mensaje o Detalle</label>
          <textarea id="swal-mensaje" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold min-h-[100px] focus:border-[#003a70] outline-none transition-all" placeholder="Indica tu nombre completo y el problema..."></textarea>
        </div>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: 'Enviar Solicitud',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#003a70',
    cancelButtonColor: '#64748b',
    preConfirm: () => {
      const emailInput = (document.getElementById('swal-email') as HTMLInputElement).value;
      const mensajeInput = (document.getElementById('swal-mensaje') as HTMLTextAreaElement).value;
      if (!emailInput || !mensajeInput) {
        Swal.showValidationMessage('Por favor completa todos los campos');
        return false;
      }
      return { email: emailInput, mensaje: mensajeInput };
    }
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        await api.post('/soporte', {
          tipo: 'password',
          email: result.value.email,
          mensaje: result.value.mensaje
        });
        Swal.fire({
          icon: 'success',
          title: 'Solicitud Enviada',
          text: 'Tu solicitud de recuperación ha sido enviada al SuperUsuario. Por favor, espera el contacto.',
          confirmButtonColor: '#003a70'
        });
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo enviar la solicitud de soporte en este momento.',
          confirmButtonColor: '#003a70'
        });
      }
    }
  });
};
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-gray-950 p-4">
    <div class="w-full max-w-5xl flex flex-col md:flex-row bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 dark:border-gray-800">
      
      <!-- Left Box (Form) -->
      <div class="w-full md:w-1/2 p-8 md:p-14 lg:p-20 flex flex-col justify-center">
        <div class="text-center md:text-left mb-10">
          <div class="inline-block mb-6">
            <h2 class="text-[#003a70] dark:text-blue-400 font-black italic text-5xl tracking-tighter leading-none">{{ t('login.welcome') }}</h2>
            <p class="text-[10px] leading-tight text-[#003a70]/60 dark:text-blue-400/60 uppercase font-bold tracking-widest mt-1 text-center">{{ t('login.subtitle') }}</p>
          </div>
          <h1 class="text-3xl font-black text-[#003a70] dark:text-white tracking-tight uppercase">{{ t('login.access') }}</h1>
          <p class="text-slate-500 dark:text-slate-400 mt-2 text-sm font-medium">{{ t('login.instructions') }}</p>
        </div>

        <form @submit.prevent="handleLogin" class="space-y-6">
          <div>
            <label for="email" class="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 block">{{ t('login.email') }}</label>
            <div class="relative group">
              <span class="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 group-focus-within:text-[#003a70] transition-colors">
                <span class="material-symbols-outlined text-[20px]">mail</span>
              </span>
              <input 
                id="email" 
                v-model="email" 
                type="email" 
                required 
                placeholder="usuario@umsa.bo"
                class="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-gray-800/50 border border-slate-200 dark:border-gray-700/50 rounded-2xl text-sm font-semibold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 shadow-sm focus:ring-2 focus:ring-[#003a70]/50 focus:border-[#003a70] focus:bg-white dark:focus:bg-gray-800 outline-none transition-all duration-300"
              />
            </div>
          </div>
          
          <div>
            <label for="password" class="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 block">{{ t('login.password') }}</label>
            <div class="relative group">
              <span class="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 group-focus-within:text-[#003a70] transition-colors">
                <span class="material-symbols-outlined text-[20px]">lock</span>
              </span>
              <input 
                id="password" 
                v-model="password" 
                :type="showPassword ? 'text' : 'password'" 
                required 
                placeholder="••••••••"
                class="w-full pl-12 pr-12 py-4 bg-slate-50 dark:bg-gray-800/50 border border-slate-200 dark:border-gray-700/50 rounded-2xl text-sm font-semibold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 shadow-sm focus:ring-2 focus:ring-[#003a70]/50 focus:border-[#003a70] focus:bg-white dark:focus:bg-gray-800 outline-none transition-all duration-300"
              />
              <button 
                type="button"
                @click="showPassword = !showPassword"
                class="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-[#003a70] transition-colors"
              >
                <span class="material-symbols-outlined text-[20px]">
                  {{ showPassword ? 'visibility_off' : 'visibility' }}
                </span>
              </button>
            </div>
          </div>

          <div v-if="error" class="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-xl shadow-sm">
            <p class="text-sm font-bold text-red-800 dark:text-red-400">{{ error }}</p>
          </div>

          <div class="flex justify-end">
            <button type="button" @click="abrirSoporte" class="text-[10px] font-black text-slate-400 hover:text-[#003a70] uppercase tracking-widest transition-colors">
              {{ t('login.forgot_password') }}
            </button>
          </div>

          <div class="pt-2">
            <button 
              type="submit" 
              :disabled="loading" 
              class="w-full flex justify-center items-center gap-2 py-4 px-4 rounded-2xl text-sm font-black uppercase tracking-widest text-white bg-[#003a70] shadow-xl shadow-[#003a70]/20 hover:bg-[#002a50] hover:-translate-y-0.5 active:translate-y-[2px] active:shadow-none focus:outline-none transition-all duration-300 disabled:opacity-70 disabled:hover:translate-y-0"
            >
              <span v-if="loading" class="material-symbols-outlined animate-spin text-[20px]">autorenew</span>
              {{ loading ? t('login.verifying') : t('login.submit') }}
            </button>
          </div>
          
          <p class="text-center text-xs font-semibold text-slate-500 mt-6">
            {{ t('login.no_account') }} 
            <router-link to="/register" class="font-black text-[#003a70] hover:underline dark:text-blue-400 uppercase transition-colors ml-1">
              {{ t('login.register_here') }}
            </router-link>
          </p>
        </form>
      </div>

      <!-- Right Side (Visual/Image) -->
      <div class="hidden md:flex w-1/2 relative bg-[#003a70] items-end justify-center overflow-hidden pb-12">
        <div class="absolute inset-0 bg-gradient-to-b from-[#003a70]/80 via-[#003a70]/40 to-[#003a70]/90 z-10"></div>
        <img 
          src="/bienvenida.png" 
          alt="Welcome Background" 
          class="absolute inset-0 w-full h-full object-cover scale-110 opacity-60"
        />
        
        <div class="relative z-20 text-center px-12 text-white flex flex-col items-center">
          <p class="text-white/80 font-bold tracking-[0.3em] uppercase text-[10px] border-b border-white/20 pb-2 backdrop-blur-sm">
            Gestión oficial de eventos y cursos
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; vertical-align: middle; }
</style>
