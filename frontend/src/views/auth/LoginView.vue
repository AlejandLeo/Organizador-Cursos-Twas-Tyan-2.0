<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const email = ref('');
const password = ref('');
const error = ref('');
const loading = ref(false);

const handleLogin = async () => {
  loading.value = true;
  error.value = '';
  
  try {
    // Limpiar sesión anterior para evitar conflictos
    localStorage.removeItem('token');
    
    await authStore.login(email.value, password.value);
    
    // Detectar rol y redirigir al panel correspondiente
    const userRoles = (authStore.user as any)?.usuariosRoles || [];

    const isSuperAdmin = userRoles.some((ur: any) =>
      ur.rol?.nombre_rol === 'Super Usuario' || ur.rol?.id === 1
    );
    const isCoordinador = userRoles.some((ur: any) =>
      ur.rol?.nombre_rol === 'Coordinador'
    );
    const isPonente = userRoles.some((ur: any) =>
      ur.rol?.nombre_rol === 'Ponente'
    );

    if (isSuperAdmin) {
      // El Super Admin tiene su propio panel diferenciado
      router.push('/admin');
    } else if (isCoordinador) {
      router.push('/coordinador');
    } else if (isPonente) {
      router.push('/ponente');
    } else {
      // Por defecto: panel de estudiante
      router.push('/estudiante');
    }
  } catch (e: any) {
    error.value = e.response?.data?.message || 'Credenciales inválidas';
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-gray-950 p-4">
    <div class="w-full max-w-5xl flex flex-col md:flex-row bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 dark:border-gray-800">
      
      <!-- Left Box (Form) -->
      <div class="w-full md:w-1/2 p-8 md:p-14 lg:p-20 flex flex-col justify-center">
        <div class="text-center md:text-left mb-10">
          <div class="inline-block mb-6">
            <h2 class="text-primary-dark dark:text-primary-light font-black italic text-5xl tracking-tighter leading-none">twas</h2>
            <p class="text-[10px] leading-tight text-primary-dark/60 dark:text-primary-light/60 uppercase font-bold tracking-widest mt-1">The World Academy of Sciences</p>
          </div>
          <h1 class="text-3xl font-black text-primary-dark dark:text-white tracking-tight uppercase">Acceso Plataforma</h1>
          <p class="text-slate-500 dark:text-slate-400 mt-2 text-sm font-medium">Ingresa tus credenciales para acceder a los servicios de TYAN.</p>
        </div>

        <form @submit.prevent="handleLogin" class="space-y-6">
          <div>
            <label for="email" class="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 block">Correo Electrónico</label>
            <div class="relative group">
              <span class="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 group-focus-within:text-primary-light transition-colors">
                <span class="material-symbols-outlined text-[20px]">mail</span>
              </span>
              <input 
                id="email" 
                v-model="email" 
                type="email" 
                required 
                placeholder="usuario@umsa.bo"
                class="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-gray-800/50 border border-slate-200 dark:border-gray-700/50 rounded-2xl text-sm font-semibold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 shadow-sm focus:ring-2 focus:ring-primary-light/50 focus:border-primary-light focus:bg-white dark:focus:bg-gray-800 outline-none transition-all duration-300"
              />
            </div>
          </div>
          
          <div>
            <label for="password" class="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 block">Contraseña</label>
            <div class="relative group">
              <span class="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 group-focus-within:text-primary-light transition-colors">
                <span class="material-symbols-outlined text-[20px]">lock</span>
              </span>
              <input 
                id="password" 
                v-model="password" 
                type="password" 
                required 
                placeholder="••••••••"
                class="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-gray-800/50 border border-slate-200 dark:border-gray-700/50 rounded-2xl text-sm font-semibold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 shadow-sm focus:ring-2 focus:ring-primary-light/50 focus:border-primary-light focus:bg-white dark:focus:bg-gray-800 outline-none transition-all duration-300"
              />
            </div>
          </div>

          <div v-if="error" class="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-xl shadow-sm">
            <p class="text-sm font-bold text-red-800 dark:text-red-400">{{ error }}</p>
          </div>

          <div class="pt-4">
            <button 
              type="submit" 
              :disabled="loading" 
              class="w-full flex justify-center items-center gap-2 py-4 px-4 rounded-2xl text-sm font-black uppercase tracking-widest text-white bg-gradient-to-r from-primary-light to-primary-dark shadow-xl shadow-primary-light/30 hover:shadow-primary-light/50 hover:-translate-y-0.5 active:translate-y-[2px] active:shadow-none focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-light dark:focus:ring-offset-gray-900 transition-all duration-300 disabled:opacity-70 disabled:hover:translate-y-0"
            >
              <span v-if="loading" class="material-symbols-outlined animate-spin text-[20px]">autorenew</span>
              {{ loading ? 'Verificando...' : 'Ingresar al Sistema' }}
            </button>
          </div>
          
          <p class="text-center text-xs font-semibold text-slate-500 mt-6">
            ¿No tienes una cuenta? 
            <router-link to="/register" class="font-black text-primary-light hover:text-primary-dark dark:text-blue-400 dark:hover:text-blue-300 uppercase transition-colors ml-1">
              Regístrate aquí
            </router-link>
          </p>
        </form>
      </div>

      <!-- Right Side (Visual/Image) -->
      <div class="hidden md:flex w-1/2 relative bg-primary-dark items-center justify-center overflow-hidden">
        <div class="absolute inset-0 bg-gradient-to-b from-primary-dark/80 via-primary-dark/60 to-primary-dark/95 z-10"></div>
        <img 
          src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80" 
          alt="Campus UMSA" 
          class="absolute inset-0 w-full h-full object-cover animate-[pulse_12s_ease-in-out_infinite] scale-110 opacity-60"
        />
        
        <div class="relative z-20 text-center px-12 text-white flex flex-col items-center">
          <div class="mb-8 p-6 bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 shadow-2xl">
            <span class="material-symbols-outlined text-6xl text-white">school</span>
          </div>
          <h2 class="text-4xl font-bold tracking-tight leading-tight mb-4 text-white">
            Excelencia en <br/>
            <span class="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-white">Gestión Académica</span>
          </h2>
          <p class="text-blue-100 font-medium tracking-wide">
            Plataforma oficial de eventos y cursos.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; vertical-align: middle; }
</style>
