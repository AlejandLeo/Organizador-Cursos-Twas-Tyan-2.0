<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { authService } from '@/services/auth.service';

const router = useRouter();

const formData = ref({
  nombres: '',
  primer_apellido: '',
  segundo_apellido: '',
  documento_identidad: '',
  genero: '',
  pais_origen: '',
  pais_residencia: '',
  fecha_nacimiento: '',
  celular: '',
  email: '',
  password: '',
  confirmPassword: '',
  id_rol: ''
});

// readonly date just to show if needed or you can just add it server side
const fecha_registro = new Date().toISOString().split('T')[0]; 

const error = ref('');
const loading = ref(false);

const handleRegister = async () => {
    loading.value = true;
    error.value = '';

    if (formData.value.password !== formData.value.confirmPassword) {
        error.value = 'Las contraseñas no coinciden';
        loading.value = false;
        return;
    }

    try {
        const payload = {
            email: formData.value.email,
            password: formData.value.password,
            nombres: formData.value.nombres,
            primer_apellido: formData.value.primer_apellido,
            segundo_apellido: formData.value.segundo_apellido || undefined,
            documento_identidad: formData.value.documento_identidad,
            genero: formData.value.genero !== '' ? Number(formData.value.genero) : undefined,
            id_rol: formData.value.id_rol !== '' ? Number(formData.value.id_rol) : 4, // 4 Estudiante, 2 Coordinador, 3 Ponente
            pais_origen: formData.value.pais_origen,
            pais_residencia: formData.value.pais_residencia,
            fecha_nacimiento: formData.value.fecha_nacimiento || undefined,
            celular: formData.value.celular || undefined,
        };

        // Enviamos los datos al backend real
        await authService.register(payload as any);
        
        // Limpiamos cualquier rastro de token
        localStorage.removeItem('token');

        // Si es exitoso, mandamos a login
        router.push('/login');
    } catch (e: any) {
        console.error(e);
        error.value = e.response?.data?.message || 'Ocurrió un error al registrarse. Verifique los datos o su conexión.';
    } finally {
        loading.value = false;
    }
};
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-gray-950 p-4 sm:p-6 lg:p-8 transition-colors duration-300">
    <div class="w-full max-w-4xl p-8 md:p-12 space-y-8 bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-2xl border-t-8 border-primary-light dark:border-primary-dark">
      
      <div class="text-center">
        <div class="inline-block">
          <h2 class="text-primary-dark dark:text-primary-light font-black italic text-5xl tracking-tighter leading-none">twas</h2>
          <p class="text-[9px] leading-tight text-primary-dark/60 dark:text-primary-light/60 uppercase font-bold tracking-tighter mt-1">The World Academy of Sciences</p>
        </div>
        <h1 class="text-3xl font-black text-primary-dark dark:text-white tracking-tight uppercase mt-6">Formulario de Registro</h1>
        <p class="mt-2 text-center text-xs font-bold text-slate-500 dark:text-slate-400">
          ¿Ya tienes una cuenta? 
          <router-link to="/login" class="font-black text-primary-light hover:text-primary-dark dark:text-blue-400 dark:hover:text-blue-300 uppercase transition-colors">
            Inicia Sesión
          </router-link>
        </p>
      </div>

      <form class="space-y-8" @submit.prevent="handleRegister">
        
        <!-- Bloque 1: Información Personal -->
        <div class="border-b border-slate-200 dark:border-gray-800 pb-8">
          <h3 class="flex items-center gap-2 text-sm font-black text-primary-light dark:text-primary-dark uppercase tracking-widest mb-6">
            <span class="material-symbols-outlined text-[20px]">person</span>
            Información Personal
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5">
            <div>
              <label for="nombres" class="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 block">Nombres</label>
              <input id="nombres" v-model="formData.nombres" type="text" required class="w-full py-3 px-4 bg-slate-50 dark:bg-gray-800/50 border border-slate-200 dark:border-gray-700/50 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-primary-light/50 focus:border-primary-light dark:focus:bg-gray-800 outline-none transition-all" />
            </div>
            <div>
              <label for="primer_apellido" class="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 block">Primer Apellido</label>
              <input id="primer_apellido" v-model="formData.primer_apellido" type="text" required class="w-full py-3 px-4 bg-slate-50 dark:bg-gray-800/50 border border-slate-200 dark:border-gray-700/50 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-primary-light/50 focus:border-primary-light dark:focus:bg-gray-800 outline-none transition-all" />
            </div>
            <div>
              <label for="segundo_apellido" class="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 block">Seg. Apellido (Opcional)</label>
              <input id="segundo_apellido" v-model="formData.segundo_apellido" type="text" class="w-full py-3 px-4 bg-slate-50 dark:bg-gray-800/50 border border-slate-200 dark:border-gray-700/50 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-primary-light/50 focus:border-primary-light dark:focus:bg-gray-800 outline-none transition-all" />
            </div>
            
            <div>
              <label for="documento" class="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 block">Documento de Identidad</label>
              <input id="documento" v-model="formData.documento_identidad" type="text" required class="w-full py-3 px-4 bg-slate-50 dark:bg-gray-800/50 border border-slate-200 dark:border-gray-700/50 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-primary-light/50 focus:border-primary-light dark:focus:bg-gray-800 outline-none transition-all" />
            </div>
            <div>
              <label for="genero" class="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 block">Género</label>
              <select id="genero" v-model="formData.genero" required class="w-full py-3 px-4 bg-slate-50 dark:bg-gray-800/50 border border-slate-200 dark:border-gray-700/50 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-primary-light/50 focus:border-primary-light dark:focus:bg-gray-800 outline-none transition-all appearance-none cursor-pointer">
                <option value="" disabled selected>Seleccionar...</option>
                <option value="0">Masculino</option>
                <option value="1">Femenino</option>
                <option value="2">Otro</option>
                <option value="3">Prefiero no decirlo</option>
              </select>
            </div>
            <div>
              <label for="fecha_nacimiento" class="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 block">Fecha de Nacimiento</label>
              <input id="fecha_nacimiento" v-model="formData.fecha_nacimiento" type="date" required class="w-full py-3 px-4 bg-slate-50 dark:bg-gray-800/50 border border-slate-200 dark:border-gray-700/50 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-primary-light/50 focus:border-primary-light dark:focus:bg-gray-800 outline-none transition-all" />
            </div>
          </div>
        </div>

        <!-- Bloque 2: Nacionalidad y Contacto -->
        <div class="border-b border-slate-200 dark:border-gray-800 pb-8">
          <h3 class="flex items-center gap-2 text-sm font-black text-primary-light dark:text-primary-dark uppercase tracking-widest mb-6">
             <span class="material-symbols-outlined text-[20px]">public</span>
             Ubicación y Contacto
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5">
            <div>
              <label for="pais_origen" class="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 block">País de Origen</label>
              <input id="pais_origen" v-model="formData.pais_origen" type="text" required placeholder="Ej: Bolivia" class="w-full py-3 px-4 bg-slate-50 dark:bg-gray-800/50 border border-slate-200 dark:border-gray-700/50 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-primary-light/50 focus:border-primary-light dark:focus:bg-gray-800 outline-none transition-all" />
            </div>
            <div>
              <label for="pais_residencia" class="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 block">País de Residencia</label>
              <input id="pais_residencia" v-model="formData.pais_residencia" type="text" required placeholder="Ej: Bolivia" class="w-full py-3 px-4 bg-slate-50 dark:bg-gray-800/50 border border-slate-200 dark:border-gray-700/50 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-primary-light/50 focus:border-primary-light dark:focus:bg-gray-800 outline-none transition-all" />
            </div>
            <div>
              <label for="celular" class="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 block">Número de Celular</label>
              <input id="celular" v-model="formData.celular" type="tel" required class="w-full py-3 px-4 bg-slate-50 dark:bg-gray-800/50 border border-slate-200 dark:border-gray-700/50 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-primary-light/50 focus:border-primary-light dark:focus:bg-gray-800 outline-none transition-all" />
            </div>
          </div>
        </div>

        <!-- Bloque 3: Cuenta y Rol -->
        <div class="border-b border-slate-200 dark:border-gray-800 pb-8">
          <h3 class="flex items-center gap-2 text-sm font-black text-primary-light dark:text-primary-dark uppercase tracking-widest mb-6">
             <span class="material-symbols-outlined text-[20px]">manage_accounts</span>
             Cuenta y Rol
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-x-6 gap-y-5">
            <div>
              <label for="id_rol" class="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 block">Tipo de Cuenta</label>
              <select id="id_rol" v-model="formData.id_rol" required class="w-full py-3 px-4 bg-slate-50 dark:bg-gray-800/50 border border-slate-200 dark:border-gray-700/50 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-primary-light/50 focus:border-primary-light dark:focus:bg-gray-800 outline-none transition-all appearance-none cursor-pointer">
                <option value="" disabled selected>Seleccionar...</option>
                <option value="4">Estudiante</option>
                <option value="2">Coordinador</option>
                <option value="3">Ponente/Docente</option>
              </select>
            </div>
            <!-- empty diff filler or more elements could go here -->
          </div>
        </div>

        <!-- Bloque 4: Acceso y Seguridad -->
        <div class="border-b border-slate-200 dark:border-gray-800 pb-8">
          <h3 class="flex items-center gap-2 text-sm font-black text-primary-light dark:text-primary-dark uppercase tracking-widest mb-6">
             <span class="material-symbols-outlined text-[20px]">lock</span>
             Credenciales y Seguridad
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
            <div class="md:col-span-2">
              <label for="email" class="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 block">Correo Electrónico (Será tu Usuario)</label>
              <input id="email" v-model="formData.email" type="email" autocomplete="email" required class="w-full py-3 px-4 bg-slate-50 dark:bg-gray-800/50 border border-slate-200 dark:border-gray-700/50 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-primary-light/50 focus:border-primary-light dark:focus:bg-gray-800 outline-none transition-all" />
            </div>
            <div>
              <label for="password" class="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 block">Contraseña</label>
              <input id="password" v-model="formData.password" type="password" required class="w-full py-3 px-4 bg-slate-50 dark:bg-gray-800/50 border border-slate-200 dark:border-gray-700/50 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-primary-light/50 focus:border-primary-light dark:focus:bg-gray-800 outline-none transition-all" />
            </div>
            <div>
              <label for="confirmPassword" class="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 block">Confirmar Contraseña</label>
              <input id="confirmPassword" v-model="formData.confirmPassword" type="password" required class="w-full py-3 px-4 bg-slate-50 dark:bg-gray-800/50 border border-slate-200 dark:border-gray-700/50 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-primary-light/50 focus:border-primary-light dark:focus:bg-gray-800 outline-none transition-all" />
            </div>
          </div>
        </div>

        <div v-if="error" class="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-xl shadow-sm">
          <p class="text-sm font-bold text-red-800 dark:text-red-400">{{ error }}</p>
        </div>

        <div class="pt-2">
          <button type="submit" :disabled="loading" class="w-full flex justify-center items-center gap-2 py-4 px-4 rounded-2xl text-sm font-black uppercase tracking-widest text-white bg-gradient-to-r from-primary-light to-primary-dark shadow-xl hover:shadow-primary-light/50 hover:-translate-y-0.5 active:translate-y-[2px] active:shadow-none focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-light dark:focus:ring-offset-gray-900 transition-all duration-300 disabled:opacity-70 disabled:hover:translate-y-0">
            <span v-if="loading" class="material-symbols-outlined animate-spin text-[20px]">autorenew</span>
            {{ loading ? 'Creando Cuenta...' : 'Registrarme en TYAN' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; vertical-align: middle; }
</style>
