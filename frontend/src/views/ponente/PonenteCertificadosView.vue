<script setup lang="ts">
import { ref, onMounted } from 'vue';
import api from '@/services/api';
import Swal from 'sweetalert2';

const certificados = ref<any[]>([]);
const loading = ref(false);

const fetchCertificados = async () => {
  loading.value = true;
  try {
    const response = await api.get('/me/certificados');
    certificados.value = response.data.map((c: any) => {
      const getRolText = (tipo: number) => {
        if (tipo === 1) return 'Asistente';
        if (tipo === 2) return 'Expositor';
        if (tipo === 3) return 'Organizador';
        if (tipo === 4) return 'Docente';
        return 'Ponente';
      };
      
      const ev = c.actividadAcademica?.evento || {};
      return {
        id: c.id,
        evento: c.actividadAcademica?.nombre || 'Actividad Académica',
        version: ev.sigla || ev.nombre || 'Evento',
        rol: getRolText(c.tipo),
        emitido: c.fecha_emision ? new Date(c.fecha_emision).toLocaleDateString() : 'Sin fecha',
        codigo: c.codigo_certificado
      };
    });
  } catch (error) {
    console.error('Error al cargar certificados:', error);
  } finally {
    loading.value = false;
  }
};

const downloadPdf = async (certId: number) => {
  try {
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
    Swal.fire('Error', 'No se pudo descargar el certificado.', 'error');
  }
};

onMounted(fetchCertificados);
</script>

<template>
  <div class="animate-in fade-in duration-500">
    <div class="mb-8">
      <h1 class="text-2xl font-black text-primary-dark dark:text-white uppercase tracking-tighter flex items-center gap-2">
        <span class="material-symbols-outlined text-umsa-gold text-3xl">workspace_premium</span>
        Mis Certificados de Ponente
      </h1>
      <p class="text-sm text-slate-500 mt-2">Descarga y visualiza los certificados emitidos a tu nombre por tu participación académica.</p>
    </div>

    <div v-if="loading" class="p-20 flex flex-col items-center justify-center gap-4 text-slate-400">
      <span class="material-symbols-outlined animate-spin text-4xl">sync</span>
      <p class="text-xs font-black uppercase tracking-widest">Cargando certificados...</p>
    </div>

    <div v-else-if="certificados.length === 0" class="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-3xl p-20 text-center shadow-sm">
      <span class="material-symbols-outlined text-6xl text-slate-200 dark:text-gray-800 mb-4 font-light">workspace_premium</span>
      <h3 class="text-lg font-black text-slate-600 dark:text-gray-400 uppercase tracking-tighter mb-1">Sin certificados</h3>
      <p class="text-xs text-slate-400 max-w-xs mx-auto">Aún no se han emitido certificados a tu nombre.</p>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div v-for="cert in certificados" :key="cert.id" class="relative bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-3xl p-8 shadow-sm flex flex-col h-full group overflow-hidden">
        <!-- Decoracion dorada -->
        <div class="absolute top-0 right-0 w-32 h-32 bg-umsa-gold/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-umsa-gold/20 transition-all duration-500"></div>

        <div class="relative z-10 flex-1">
          <div class="w-12 h-12 bg-slate-50 dark:bg-gray-800 rounded-xl flex items-center justify-center mb-6 shadow-inner border border-slate-100 dark:border-gray-700 text-umsa-gold">
            <span class="material-symbols-outlined text-2xl">verified</span>
          </div>
          
          <h3 class="font-black text-xl text-primary-dark dark:text-white leading-tight uppercase mb-1">{{ cert.evento }}</h3>
          <p class="text-xs font-bold text-umsa-gold tracking-widest uppercase mb-4">{{ cert.version }}</p>
          
          <div class="space-y-3 mb-6">
            <div class="flex items-center justify-between text-sm border-b border-slate-100 dark:border-gray-800 pb-2">
              <span class="text-slate-500 dark:text-gray-400 font-medium">Rol:</span>
              <span class="font-bold text-primary-dark dark:text-white">{{ cert.rol }}</span>
            </div>
            <div class="flex items-center justify-between text-sm border-b border-slate-100 dark:border-gray-800 pb-2">
              <span class="text-slate-500 dark:text-gray-400 font-medium">Fecha de Emisión:</span>
              <span class="font-bold text-primary-dark dark:text-white">{{ cert.emitido }}</span>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-slate-500 dark:text-gray-400 font-medium">Código:</span>
              <span class="font-bold text-primary-dark dark:text-white uppercase tracking-wider">{{ cert.codigo }}</span>
            </div>
          </div>
        </div>

        <button @click="downloadPdf(cert.id)" class="relative z-10 w-full mt-auto bg-primary-dark dark:bg-black text-white hover:bg-umsa-gold dark:hover:bg-umsa-gold font-bold text-xs uppercase tracking-widest py-3.5 rounded-xl transition-all border border-transparent shadow flex items-center justify-center gap-2">
          <span class="material-symbols-outlined text-[18px]">download</span>
          Descargar PDF
        </button>
      </div>
    </div>
  </div>
</template>
