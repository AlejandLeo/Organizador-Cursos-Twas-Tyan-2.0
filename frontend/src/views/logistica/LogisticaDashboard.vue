<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import api from '@/services/api';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();

const misEventos = ref<any[]>([]);
const misCertificados = ref<any[]>([]);
const loading = ref(true);

const userName = computed(() => {
  const p = (authStore.user as any)?.persona;
  if (p) return `${p.nombres || ''} ${p.primer_apellido || ''}`.trim();
  return 'Usuario';
});

const userEmail = computed(() => (authStore.user as any)?.email || '');

const fetchData = async () => {
  loading.value = true;
  try {
    const [eventosRes, certsRes] = await Promise.allSettled([
      api.get('/logistica/sesiones-academicas/mis-eventos'),
      api.get('/logistica/certificados/mis-certificados'),
    ]);
    
    if (eventosRes.status === 'fulfilled') {
      misEventos.value = Array.isArray(eventosRes.value.data) ? eventosRes.value.data : [];
    }
    if (certsRes.status === 'fulfilled') {
      misCertificados.value = Array.isArray(certsRes.value.data) ? certsRes.value.data : [];
    }
  } catch (err) {
    console.error('Error fetching dashboard data', err);
  } finally {
    loading.value = false;
  }
};

const totalActividades = computed(() => misEventos.value.reduce((sum, e) => sum + (e.actividades?.length || 0), 0));

onMounted(fetchData);
</script>

<template>
  <div class="space-y-8 animate-in fade-in duration-500">
    <!-- Welcome Banner -->
    <div class="bg-gradient-to-br from-teal-600 to-emerald-700 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl shadow-teal-900/30">
      <div class="absolute right-[-40px] top-[-40px] opacity-10">
        <span class="material-symbols-outlined text-[200px]">support_agent</span>
      </div>
      <p class="text-teal-200 text-[10px] font-black uppercase tracking-[0.3em]">Panel de Logística</p>
      <h2 class="text-3xl font-black mt-1">¡Bienvenido, {{ userName }}!</h2>
      <p class="text-teal-100 text-sm mt-2 max-w-lg">Gestiona la asistencia de los estudiantes y ponentes en los eventos asignados a tu cargo.</p>
      <div class="mt-4 flex items-center gap-2 text-teal-200 text-xs">
        <span class="material-symbols-outlined text-sm">mail</span>
        {{ userEmail }}
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-slate-200 dark:border-gray-800 shadow-sm relative overflow-hidden group hover:scale-[1.02] transition-all duration-300">
        <div class="absolute right-[-20px] top-[-20px] opacity-10 group-hover:scale-125 transition-transform duration-700">
          <span class="material-symbols-outlined text-[120px] text-teal-600">event</span>
        </div>
        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Eventos Asignados</p>
        <h3 class="text-5xl font-black text-teal-600 dark:text-teal-400">{{ misEventos.length }}</h3>
      </div>

      <div class="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-slate-200 dark:border-gray-800 shadow-sm relative overflow-hidden group hover:scale-[1.02] transition-all duration-300">
        <div class="absolute right-[-20px] top-[-20px] opacity-10 group-hover:scale-125 transition-transform duration-700">
          <span class="material-symbols-outlined text-[120px] text-blue-600">school</span>
        </div>
        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Actividades a Cargo</p>
        <h3 class="text-5xl font-black text-blue-600 dark:text-blue-400">{{ totalActividades }}</h3>
      </div>

      <div class="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-slate-200 dark:border-gray-800 shadow-sm relative overflow-hidden group hover:scale-[1.02] transition-all duration-300">
        <div class="absolute right-[-20px] top-[-20px] opacity-10 group-hover:scale-125 transition-transform duration-700">
          <span class="material-symbols-outlined text-[120px] text-amber-600">workspace_premium</span>
        </div>
        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Mis Certificados</p>
        <h3 class="text-5xl font-black text-amber-600 dark:text-amber-400">{{ misCertificados.length }}</h3>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div class="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-slate-200 dark:border-gray-800 shadow-sm">
        <h3 class="text-sm font-black uppercase text-slate-800 dark:text-white mb-6 flex items-center gap-2">
          <span class="material-symbols-outlined text-teal-500">qr_code_scanner</span>
          Acceso Directo Escáner
        </h3>
        <p class="text-sm text-slate-500 dark:text-gray-400 mb-6">Inicie el registro de asistencias seleccionando la sesión académica activa.</p>
        <router-link to="/logistica/asistencia" class="inline-flex items-center gap-3 px-8 py-4 bg-teal-600 hover:bg-teal-700 text-white font-black rounded-2xl shadow-xl shadow-teal-600/20 transition-all uppercase tracking-widest text-xs">
          <span class="material-symbols-outlined">qr_code_scanner</span>
          Ir al Escáner QR / PIN
        </router-link>
      </div>

      <div class="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-slate-200 dark:border-gray-800 shadow-sm">
        <h3 class="text-sm font-black uppercase text-slate-800 dark:text-white mb-6 flex items-center gap-2">
          <span class="material-symbols-outlined text-teal-500">info</span>
          Guía Rápida
        </h3>
        <ul class="space-y-3">
          <li class="flex items-center gap-3 text-xs font-bold text-slate-600 dark:text-gray-300">
            <span class="material-symbols-outlined text-teal-500 text-sm">check_circle</span>
            Verificar el horario antes de escanear.
          </li>
          <li class="flex items-center gap-3 text-xs font-bold text-slate-600 dark:text-gray-300">
            <span class="material-symbols-outlined text-teal-500 text-sm">check_circle</span>
            Solicitar el QR dinámico o PIN del usuario.
          </li>
          <li class="flex items-center gap-3 text-xs font-bold text-slate-600 dark:text-gray-300">
            <span class="material-symbols-outlined text-teal-500 text-sm">check_circle</span>
            Reportar fallos técnicos a coordinación.
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
