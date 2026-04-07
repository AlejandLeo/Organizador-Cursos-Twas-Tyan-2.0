<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const formData = ref({
  nombres: '',
  primer_apellido: '',
  segundo_apellido: '',
  email: '',
  password: '',
  confirmPassword: '',
  documento_identidad: '',
  celular: ''
});

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
        // Simulación de registro
        console.log('Registro enviado:', formData.value);
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simular retardo
        router.push('/login');
    } catch (e) {
        error.value = 'Ocurrió un error al registrarse. Intente de nuevo.';
    } finally {
        loading.value = false;
    }
};
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-background p-4 sm:p-6 lg:p-8">
    <div class="w-full max-w-3xl p-8 space-y-8 bg-white rounded-3xl shadow-2xl border-t-8 border-umsa-blue">
      
      <div class="text-center">
        <div class="inline-block">
          <h2 class="text-primary-dark font-black italic text-5xl tracking-tighter leading-none">twas</h2>
          <p class="text-[9px] leading-tight text-primary-dark/60 uppercase font-bold tracking-tighter">The World Academy of Sciences</p>
        </div>
        <h1 class="text-2xl font-black text-primary-dark tracking-widest uppercase italic mt-4">Formulario de Registro</h1>
        <p class="mt-2 text-center text-xs font-bold text-slate-400">
          ¿Ya tienes una cuenta? 
          <router-link to="/login" class="font-black text-umsa-blue hover:text-umsa-gold uppercase">
            Inicia Sesión
          </router-link>
        </p>
      </div>

      <form class="space-y-6" @submit.prevent="handleRegister">
        <div class="border-b border-slate-200 pb-6">
          <h3 class="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Información Personal</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
            <div>
              <label for="nombres" class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nombres</label>
              <input id="nombres" v-model="formData.nombres" type="text" required class="mt-1 w-full py-3 px-4 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-primary-dark focus:ring-2 focus:ring-umsa-gold/20 focus:border-umsa-gold outline-none" />
            </div>
            <div>
              <label for="primer_apellido" class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Primer Apellido</label>
              <input id="primer_apellido" v-model="formData.primer_apellido" type="text" required class="mt-1 w-full py-3 px-4 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-primary-dark focus:ring-2 focus:ring-umsa-gold/20 focus:border-umsa-gold outline-none" />
            </div>
            <div>
              <label for="segundo_apellido" class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Segundo Apellido (Opcional)</label>
              <input id="segundo_apellido" v-model="formData.segundo_apellido" type="text" class="mt-1 w-full py-3 px-4 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-primary-dark focus:ring-2 focus:ring-umsa-gold/20 focus:border-umsa-gold outline-none" />
            </div>
            <div>
              <label for="documento" class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Documento de Identidad</label>
              <input id="documento" v-model="formData.documento_identidad" type="text" required class="mt-1 w-full py-3 px-4 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-primary-dark focus:ring-2 focus:ring-umsa-gold/20 focus:border-umsa-gold outline-none" />
            </div>
          </div>
        </div>

        <div class="border-b border-slate-200 pb-6">
          <h3 class="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Información de Contacto y Acceso</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
            <div>
              <label for="email" class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Correo Electrónico</label>
              <input id="email" v-model="formData.email" type="email" autocomplete="email" required class="mt-1 w-full py-3 px-4 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-primary-dark focus:ring-2 focus:ring-umsa-gold/20 focus:border-umsa-gold outline-none" />
            </div>
            <div>
              <label for="celular" class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Teléfono / Celular</label>
              <input id="celular" v-model="formData.celular" type="tel" class="mt-1 w-full py-3 px-4 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-primary-dark focus:ring-2 focus:ring-umsa-gold/20 focus:border-umsa-gold outline-none" />
            </div>
            <div>
              <label for="password" class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contraseña</label>
              <input id="password" v-model="formData.password" type="password" required class="mt-1 w-full py-3 px-4 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-primary-dark focus:ring-2 focus:ring-umsa-gold/20 focus:border-umsa-gold outline-none" />
            </div>
            <div>
              <label for="confirmPassword" class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Confirmar Contraseña</label>
              <input id="confirmPassword" v-model="formData.confirmPassword" type="password" required class="mt-1 w-full py-3 px-4 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-primary-dark focus:ring-2 focus:ring-umsa-gold/20 focus:border-umsa-gold outline-none" />
            </div>
          </div>
        </div>

        <div v-if="error" class="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
          <p class="text-sm font-bold text-red-800">{{ error }}</p>
        </div>

        <div>
          <button type="submit" :disabled="loading" class="w-full flex justify-center items-center gap-2 py-4 px-4 border border-transparent rounded-xl shadow-lg text-sm font-black uppercase tracking-widest text-white bg-primary-dark hover:bg-umsa-blue focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-umsa-blue transition-all disabled:opacity-50">
            <span v-if="loading" class="material-symbols-outlined animate-spin">autorenew</span>
            {{ loading ? 'Creando Cuenta...' : 'Registrarme' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; vertical-align: middle; }
</style>
