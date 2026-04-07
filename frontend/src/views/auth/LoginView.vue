<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
// import { useAuthStore } from '@/stores/auth'; // Descomentar cuando exista el store

const router = useRouter();
// const authStore = useAuthStore();

const email = ref('');
const password = ref('');
const error = ref('');
const loading = ref(false);

const handleLogin = async () => {
  loading.value = true;
  error.value = '';
  
  try {
    // await authStore.login(email.value, password.value);
    console.log('Login attempt:', email.value);
    // Simulación de redirección
    router.push('/coordinador'); // Redirigir al dashboard del coordinador
  } catch (e) {
    error.value = 'Credenciales inválidas';
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-background">
    <div class="w-full max-w-md p-8 space-y-8 bg-white rounded-3xl shadow-2xl border-t-8 border-umsa-blue">
      
      <div class="text-center">
        <div class="inline-block">
          <h2 class="text-primary-dark font-black italic text-5xl tracking-tighter leading-none">twas</h2>
          <p class="text-[9px] leading-tight text-primary-dark/60 uppercase font-bold tracking-tighter">The World Academy of Sciences</p>
        </div>
        <div class="h-px w-24 bg-slate-200 my-4 mx-auto"></div>
        <h1 class="text-2xl font-black text-primary-dark tracking-widest uppercase italic">Acceso Plataforma</h1>
      </div>

      <form @submit.prevent="handleLogin" class="space-y-6">
        <div>
          <label for="email" class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Correo Electrónico</label>
          <div class="mt-1 relative">
            <span class="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
              <span class="material-symbols-outlined text-lg">mail</span>
            </span>
            <input 
              id="email" 
              v-model="email" 
              type="email" 
              required 
              placeholder="usuario@umsa.bo"
              class="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-xl text-sm font-bold text-primary-dark focus:ring-4 focus:ring-umsa-gold/20 focus:border-umsa-gold outline-none transition-all"
            />
          </div>
        </div>
        
        <div>
          <label for="password" class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contraseña</label>
          <div class="mt-1 relative">
            <span class="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
              <span class="material-symbols-outlined text-lg">lock</span>
            </span>
            <input 
              id="password" 
              v-model="password" 
              type="password" 
              required 
              placeholder="••••••••"
              class="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-xl text-sm font-bold text-primary-dark focus:ring-4 focus:ring-umsa-gold/20 focus:border-umsa-gold outline-none transition-all"
            />
          </div>
        </div>

        <div v-if="error" class="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
          <p class="text-sm font-bold text-red-800">{{ error }}</p>
        </div>

        <div>
          <button 
            type="submit" 
            :disabled="loading" 
            class="w-full flex justify-center items-center gap-2 py-4 px-4 border border-transparent rounded-xl shadow-lg text-sm font-black uppercase tracking-widest text-primary-dark bg-umsa-gold hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-umsa-gold transition-all disabled:opacity-50"
          >
            <span v-if="loading" class="material-symbols-outlined animate-spin">autorenew</span>
            {{ loading ? 'Verificando...' : 'Ingresar' }}
          </button>
        </div>
        
        <p class="text-center text-xs font-bold text-slate-400">
          ¿No tienes una cuenta? 
          <router-link to="/register" class="font-black text-umsa-blue hover:text-umsa-gold uppercase">
            Regístrate
          </router-link>
        </p>
      </form>
    </div>
  </div>
</template>

<style scoped>
.material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; vertical-align: middle; }
</style>
