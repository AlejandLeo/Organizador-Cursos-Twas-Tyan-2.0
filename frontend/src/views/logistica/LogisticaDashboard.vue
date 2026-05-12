<script setup lang="ts">
import { ref, onMounted } from 'vue';
import api from '@/services/api';

const stats = ref({
  eventos: 0,
  inscritos: 0,
  asistenciasHoy: 0
});

const fetchStats = async () => {
  // Mock o fetch real si hay endpoints
  stats.value = {
    eventos: 5,
    inscritos: 120,
    asistenciasHoy: 45
  };
};

onMounted(fetchStats);
</script>

<template>
  <div class="space-y-8 animate-in fade-in duration-500">
    <div class="border-b border-slate-200 dark:border-gray-800 pb-6">
      <h2 class="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Resumen de Logística</h2>
      <p class="text-slate-500 dark:text-gray-400 font-medium mt-1">Panel de control rápido para personal de apoyo.</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-slate-200 dark:border-gray-800 shadow-sm relative overflow-hidden group hover:scale-[1.02] transition-all duration-300">
        <div class="absolute right-[-20px] top-[-20px] opacity-10 group-hover:scale-125 transition-transform duration-700">
          <span class="material-symbols-outlined text-[120px] text-teal-600">event</span>
        </div>
        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Eventos Activos</p>
        <h3 class="text-5xl font-black text-teal-600 dark:text-teal-400">{{ stats.eventos }}</h3>
      </div>

      <div class="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-slate-200 dark:border-gray-800 shadow-sm relative overflow-hidden group hover:scale-[1.02] transition-all duration-300">
        <div class="absolute right-[-20px] top-[-20px] opacity-10 group-hover:scale-125 transition-transform duration-700">
          <span class="material-symbols-outlined text-[120px] text-blue-600">group</span>
        </div>
        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Inscritos</p>
        <h3 class="text-5xl font-black text-blue-600 dark:text-blue-400">{{ stats.inscritos }}</h3>
      </div>

      <div class="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-slate-200 dark:border-gray-800 shadow-sm relative overflow-hidden group hover:scale-[1.02] transition-all duration-300">
        <div class="absolute right-[-20px] top-[-20px] opacity-10 group-hover:scale-125 transition-transform duration-700">
          <span class="material-symbols-outlined text-[120px] text-emerald-600">done_all</span>
        </div>
        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Asistencias Hoy</p>
        <h3 class="text-5xl font-black text-emerald-600 dark:text-emerald-400">{{ stats.asistenciasHoy }}</h3>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
       <div class="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-slate-200 dark:border-gray-800 shadow-sm">
          <h3 class="text-sm font-black uppercase text-slate-800 dark:text-white mb-6 flex items-center gap-2">
            <span class="material-symbols-outlined text-teal-500">qr_code_scanner</span>
            Acceso Directo Escáner
          </h3>
          <p class="text-sm text-slate-500 dark:text-gray-400 mb-6">Inicie el registro de asistencias seleccionando la sesión académica activa.</p>
          <router-link to="/logistica/asistencia" class="inline-flex items-center gap-3 px-8 py-4 bg-teal-600 hover:bg-teal-700 text-white font-black rounded-2xl shadow-xl shadow-teal-600/20 transition-all uppercase tracking-widest text-xs">
            Ir al Escáner QR
          </router-link>
       </div>

       <div class="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-slate-200 dark:border-gray-800 shadow-sm">
          <h3 class="text-sm font-black uppercase text-slate-800 dark:text-white mb-6 flex items-center gap-2">
            <span class="material-symbols-outlined text-teal-500">info</span>
            Manual de Usuario
          </h3>
          <ul class="space-y-3">
            <li class="flex items-center gap-3 text-xs font-bold text-slate-600 dark:text-gray-300">
              <span class="material-symbols-outlined text-teal-500 text-sm">check_circle</span>
              Verificar el horario antes de escanear.
            </li>
            <li class="flex items-center gap-3 text-xs font-bold text-slate-600 dark:text-gray-300">
              <span class="material-symbols-outlined text-teal-500 text-sm">check_circle</span>
              Solicitar el QR dinámico del usuario.
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
