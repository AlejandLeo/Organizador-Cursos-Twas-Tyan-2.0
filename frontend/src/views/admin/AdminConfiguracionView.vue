<script setup lang="ts">
import { ref, onMounted } from 'vue';
import api from '@/services/api';
import Swal from 'sweetalert2';

const configs = ref<any[]>([]);
const stats = ref<any>(null);
const isLoading = ref(true);

const fetchConfigs = async () => {
  try {
    isLoading.value = true;
    const res = await api.get('/admin/configuracion');
    configs.value = res.data;
    
    const statsRes = await api.get('/admin/configuracion/mail-stats');
    stats.value = statsRes.data;
  } catch (error) {
    console.error('Error fetching configs:', error);
    Swal.fire('Error', 'No se pudo cargar la configuración', 'error');
  } finally {
    isLoading.value = false;
  }
};

const updateConfig = async (config: any) => {
  try {
    await api.patch('/admin/configuracion', {
      clave: config.clave,
      valor: config.valor
    });
    Swal.fire('¡Éxito!', 'Configuración actualizada', 'success');
  } catch (error) {
    Swal.fire('Error', 'No se pudo actualizar', 'error');
  }
};

onMounted(fetchConfigs);
</script>

<template>
  <div class="space-y-8 animate-in fade-in duration-500">
    <!-- HEADER -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-3 mb-2">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-800 to-black flex items-center justify-center shadow-lg">
            <span class="material-symbols-outlined text-white text-[22px]">settings</span>
          </div>
          <div>
            <p class="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Sistema</p>
            <h1 class="text-2xl font-black text-slate-800 dark:text-white tracking-tight uppercase italic">Configuración Global</h1>
          </div>
        </div>
        <p class="text-slate-500 text-sm ml-1">Personaliza el comportamiento del sistema y correos electrónicos</p>
      </div>
    </div>

    <!-- STATS (MAIL QUEUE) -->
    <div v-if="stats" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      <div class="bg-white dark:bg-[#13131f] p-5 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm">
        <p class="text-[10px] font-black text-slate-400 uppercase mb-1">Total Cola</p>
        <p class="text-2xl font-black text-slate-800 dark:text-white">{{ stats.total }}</p>
      </div>
      <div class="bg-white dark:bg-[#13131f] p-5 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm">
        <p class="text-[10px] font-black text-slate-400 uppercase mb-1">Pendientes</p>
        <p class="text-2xl font-black text-amber-500">{{ stats.pendientes }}</p>
      </div>
      <div class="bg-white dark:bg-[#13131f] p-5 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm">
        <p class="text-[10px] font-black text-slate-400 uppercase mb-1">Enviados</p>
        <p class="text-2xl font-black text-emerald-500">{{ stats.enviados }}</p>
      </div>
      <div class="bg-white dark:bg-[#13131f] p-5 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm">
        <p class="text-[10px] font-black text-slate-400 uppercase mb-1">Pausados (Cuota)</p>
        <p class="text-2xl font-black text-blue-500">{{ stats.pausados }}</p>
      </div>
      <div class="bg-white dark:bg-[#13131f] p-5 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm">
        <p class="text-[10px] font-black text-slate-400 uppercase mb-1">Fallidos</p>
        <p class="text-2xl font-black text-red-500">{{ stats.fallidos }}</p>
      </div>
    </div>

    <!-- CONFIG LIST -->
    <div class="grid grid-cols-1 gap-6">
      <div v-for="config in configs" :key="config.clave" 
           class="bg-white dark:bg-[#13131f] border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm">
        <div class="p-6">
          <div class="flex justify-between items-start mb-4">
            <div>
              <h3 class="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">{{ config.clave }}</h3>
              <p class="text-xs text-slate-500 mt-1">{{ config.descripcion }}</p>
            </div>
            <button @click="updateConfig(config)"
                    class="px-4 py-2 bg-red-600 text-white text-[10px] font-black uppercase rounded-lg shadow-lg shadow-red-600/20 hover:bg-red-700 transition-all">
              Guardar Cambios
            </button>
          </div>
          
          <textarea v-if="config.clave.includes('BODY')" 
                    v-model="config.valor" rows="8"
                    class="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-4 text-sm font-mono outline-none focus:border-red-600/50 transition-all"></textarea>
          <input v-else v-model="config.valor" type="text"
                 class="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-4 text-sm font-bold outline-none focus:border-red-600/50 transition-all" />
          
          <div v-if="config.clave === 'WELCOME_MESSAGE_BODY'" class="mt-4 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/30">
            <p class="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase mb-2">Variables disponibles:</p>
            <div class="flex gap-2">
              <code class="px-2 py-1 bg-white dark:bg-black/20 text-[10px] rounded border">\{\{nombre\}\}</code>
              <code class="px-2 py-1 bg-white dark:bg-black/20 text-[10px] rounded border">\{\{email\}\}</code>
              <code class="px-2 py-1 bg-white dark:bg-black/20 text-[10px] rounded border">\{\{password\}\}</code>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- SCALABILITY INFO -->
    <div class="p-6 bg-slate-800 text-white rounded-2xl shadow-xl">
      <div class="flex items-center gap-4 mb-4">
        <span class="material-symbols-outlined text-amber-400">info</span>
        <h3 class="text-lg font-black italic uppercase tracking-tight">Arquitectura de Escalabilidad</h3>
      </div>
      <p class="text-sm text-slate-300 leading-relaxed">
        El sistema utiliza una <b>Cola de Mensajería (Mail Queue)</b>. Al registrar usuarios masivamente, los correos no se envían inmediatamente; se encolan y un proceso en segundo plano los distribuye. Si se alcanza el límite diario de tu proveedor (ej: Gmail), la cola se pausará automáticamente y se reanudará el día siguiente, asegurando que ningún usuario se quede sin su mensaje de bienvenida.
      </p>
    </div>
  </div>
</template>
