<script setup lang="ts">
import { ref, onMounted } from 'vue';
import api from '@/services/api';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();
const certificados = ref<any[]>([]);
const loading = ref(true);
const downloading = ref<number | null>(null);

const fetchMisCertificados = async () => {
  try {
    loading.value = true;
    const res = await api.get('/logistica/certificados/mis-certificados');
    certificados.value = Array.isArray(res.data) ? res.data : [];
  } catch (err) {
    console.error('Error fetching certificados', err);
  } finally {
    loading.value = false;
  }
};

const downloadPdf = async (certId: number) => {
  try {
    downloading.value = certId;
    const res = await api.get(`/me/certificados/${certId}/download`, { responseType: 'blob' });
    const blob = new Blob([res.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `certificado_${certId}.pdf`;
    link.click();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error al descargar certificado:', error);
  } finally {
    downloading.value = null;
  }
};

const tiposMap: Record<number, string> = { 1: 'Asistente', 2: 'Expositor', 3: 'Logística', 4: 'Docente' };

onMounted(fetchMisCertificados);
</script>

<template>
  <div class="space-y-8 animate-in fade-in duration-500">
    <div class="border-b border-slate-200 dark:border-gray-800 pb-6 flex justify-between items-end">
      <div>
        <h2 class="text-3xl font-black text-teal-600 dark:text-teal-400 uppercase tracking-tighter italic">Mis Certificados</h2>
        <p class="text-slate-500 dark:text-gray-400 font-medium mt-1">Certificados emitidos a tu nombre por participación en eventos.</p>
      </div>
      <div class="h-10 w-10 rounded-xl bg-teal-50 dark:bg-teal-900/20 text-teal-600 flex items-center justify-center border border-teal-100 dark:border-teal-800">
        <span class="material-symbols-outlined">workspace_premium</span>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-20">
      <span class="material-symbols-outlined animate-spin text-4xl text-teal-500">progress_activity</span>
    </div>

    <!-- Empty -->
    <div v-else-if="certificados.length === 0" class="text-center py-20">
      <div class="w-20 h-20 mx-auto rounded-full bg-slate-100 dark:bg-gray-800 flex items-center justify-center mb-6">
        <span class="material-symbols-outlined text-4xl text-slate-300">inventory_2</span>
      </div>
      <p class="text-slate-500 dark:text-gray-400 font-bold uppercase tracking-widest text-xs">Aún no tienes certificados emitidos</p>
    </div>

    <!-- Certificados List -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="cert in certificados" :key="cert.id"
           class="bg-white dark:bg-gray-900 rounded-3xl border border-slate-200 dark:border-gray-800 overflow-hidden shadow-sm hover:shadow-xl transition-all group">
        <div class="h-3 bg-gradient-to-r from-teal-500 to-emerald-600"></div>
        <div class="p-6 space-y-4">
          <div class="flex items-center justify-between">
            <span class="text-[9px] font-black uppercase px-2.5 py-1 rounded-full tracking-widest"
                  :class="{
                    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400': cert.estado_envio === 'enviado',
                    'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400': cert.estado_envio === 'pendiente',
                    'bg-rose-100 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400': cert.estado_envio === 'error',
                  }">
              {{ cert.estado_envio || 'pendiente' }}
            </span>
            <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest">
              {{ tiposMap[cert.tipo] || 'Participante' }}
            </span>
          </div>

          <div>
            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Actividad</p>
            <h3 class="text-sm font-black text-slate-800 dark:text-white mt-1 leading-tight">
              {{ cert.actividadAcademica?.nombre || 'Sin actividad' }}
            </h3>
          </div>

          <div v-if="cert.actividadAcademica?.evento">
            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Evento</p>
            <p class="text-xs font-bold text-slate-600 dark:text-gray-300 mt-0.5">{{ cert.actividadAcademica.evento.nombre }}</p>
          </div>

          <div class="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-gray-800">
            <div>
              <p class="text-[9px] font-black text-slate-400 uppercase">Código</p>
              <p class="text-[10px] font-mono font-bold text-teal-600 dark:text-teal-400">{{ cert.codigo_certificado }}</p>
            </div>
            <div>
              <p class="text-[9px] font-black text-slate-400 uppercase">Emitido</p>
              <p class="text-[10px] font-mono text-slate-500">{{ cert.fecha_emision ? new Date(cert.fecha_emision).toLocaleDateString('es-BO') : '—' }}</p>
            </div>
          </div>
          
          <div class="mt-4 pt-4 border-t border-slate-100 dark:border-gray-800">
              <button @click="downloadPdf(cert.id)" :disabled="downloading === cert.id" class="w-full bg-teal-600 hover:bg-teal-700 text-white text-[10px] font-black uppercase py-2.5 rounded-xl tracking-widest transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer">
                  <span class="material-symbols-outlined text-[16px]">{{ downloading === cert.id ? 'sync' : 'download' }}</span> 
                  {{ downloading === cert.id ? 'Descargando...' : 'Descargar PDF' }}
              </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
