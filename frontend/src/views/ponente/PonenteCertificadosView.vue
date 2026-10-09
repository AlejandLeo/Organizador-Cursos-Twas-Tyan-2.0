<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import api, { imagenActividad, imagenEvento } from '@/services/api';
import Swal from 'sweetalert2';

const certificados = ref<any[]>([]);
const loading = ref(false);
const vistaPdf = ref('');
const vistaBlob = ref('');
const vistaTitulo = ref('');

const cerrarVista = () => {
  if (vistaBlob.value) URL.revokeObjectURL(vistaBlob.value);
  vistaBlob.value = '';
  vistaPdf.value = '';
  vistaTitulo.value = '';
};

const fetchCertificados = async () => {
  loading.value = true;
  try {
    const response = await api.get('/me/certificados');
    certificados.value = (response.data || [])
      .filter((c: any) => Number(c.tipo) === 2)
      .map((c: any) => {
        const actividad = c.actividadAcademica;
        const evento = actividad?.evento;
        return {
          id: c.id,
          actividad: actividad?.nombre || 'Actividad',
          evento: evento?.nombre || 'Evento',
          imagen: actividad?.imagen ? imagenActividad(actividad) : imagenEvento(evento),
          emitido: c.fecha_emision ? new Date(c.fecha_emision).toLocaleDateString('es-BO') : 'Sin fecha',
          codigo: c.codigo_certificado,
        };
      });
  } catch (error) {
    console.error('Error al cargar certificados:', error);
  } finally {
    loading.value = false;
  }
};

const previsualizar = async (cert: any) => {
  try {
    const res = await api.get(`/me/certificados/${cert.id}/download`, { responseType: 'blob' });
    cerrarVista();
    vistaTitulo.value = cert.actividad;
    const blobUrl = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
    vistaBlob.value = blobUrl;
    vistaPdf.value = `${blobUrl}#navpanes=0&view=Fit`;
  } catch (error) {
    console.error('Error al previsualizar el certificado:', error);
    Swal.fire('Error', 'No se pudo abrir la vista previa del certificado.', 'error');
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
onUnmounted(cerrarVista);
</script>

<template>
  <div class="animate-in fade-in duration-500 max-w-6xl mx-auto space-y-8">
    <div class="border-b border-slate-200 dark:border-gray-800 pb-6">
      <h1 class="text-3xl font-black text-primary-dark dark:text-white uppercase tracking-tighter flex items-center gap-3">
        <span class="material-symbols-outlined text-umsa-gold text-4xl">workspace_premium</span>
        Mis certificados de expositor
      </h1>
      <p class="text-sm text-slate-500 mt-2">Certificados emitidos por tu participación como ponente. El de estudiante no aparece en este portal.</p>
    </div>

    <div v-if="loading" class="p-20 flex flex-col items-center justify-center gap-4 text-slate-400">
      <span class="material-symbols-outlined animate-spin text-4xl">sync</span>
      <p class="text-xs font-black uppercase tracking-widest">Cargando certificados...</p>
    </div>

    <div v-else-if="certificados.length === 0" class="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-3xl p-20 text-center shadow-sm">
      <span class="material-symbols-outlined text-6xl text-slate-200 dark:text-gray-800 mb-4 font-light">workspace_premium</span>
      <h3 class="text-lg font-black text-slate-600 dark:text-gray-400 uppercase tracking-tighter mb-1">Sin certificados de expositor</h3>
      <p class="text-xs text-slate-400 max-w-xs mx-auto">Aún no se ha emitido un certificado de ponente a tu nombre.</p>
    </div>

    <article v-for="cert in certificados" :key="cert.id" class="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-[2rem] overflow-hidden shadow-sm">
      <div class="grid grid-cols-1 md:grid-cols-[280px_1fr]">
        <div class="relative h-48 md:h-full min-h-[220px] bg-[#003B71]">
          <img :src="cert.imagen" alt="" class="absolute inset-0 w-full h-full object-cover">
          <div class="absolute inset-0 bg-gradient-to-t from-[#003B71] via-[#003B71]/40 to-transparent"></div>
          <span class="absolute top-4 left-4 bg-white/15 text-white border border-white/30 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">Expositor</span>
        </div>
        <div class="p-6 md:p-8 flex flex-col justify-between gap-6">
          <div>
            <p class="text-[10px] font-black text-umsa-gold uppercase tracking-[0.2em]">{{ cert.evento }}</p>
            <h2 class="text-2xl md:text-3xl font-black text-primary-dark dark:text-white uppercase tracking-tight mt-1">{{ cert.actividad }}</h2>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="rounded-2xl bg-slate-50 dark:bg-gray-800 px-4 py-3">
              <p class="text-[10px] font-bold uppercase tracking-widest text-slate-400">Emisión</p>
              <p class="font-black text-slate-800 dark:text-white mt-1">{{ cert.emitido }}</p>
            </div>
            <div class="rounded-2xl bg-slate-50 dark:bg-gray-800 px-4 py-3">
              <p class="text-[10px] font-bold uppercase tracking-widest text-slate-400">Código</p>
              <p class="font-black text-slate-800 dark:text-white mt-1 tracking-wider">{{ cert.codigo }}</p>
            </div>
          </div>
          <div class="flex flex-wrap gap-3">
            <button @click="previsualizar(cert)" class="bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 text-[#003B71] dark:text-white hover:border-umsa-blue font-black text-xs uppercase tracking-widest px-5 py-3.5 rounded-xl flex items-center justify-center gap-2">
              <span class="material-symbols-outlined text-[18px]">visibility</span>
              Previsualizar
            </button>
            <button @click="downloadPdf(cert.id)" class="bg-[#003B71] hover:bg-umsa-blue text-white font-black text-xs uppercase tracking-widest px-5 py-3.5 rounded-xl flex items-center justify-center gap-2">
              <span class="material-symbols-outlined text-[18px]">download</span>
              Descargar
            </button>
          </div>
        </div>
      </div>
    </article>

    <Teleport to="body">
      <div v-if="vistaPdf" class="fixed inset-0 z-[400] bg-black/75 flex items-center justify-center p-3 md:p-6" @click.self="cerrarVista">
        <div class="bg-white dark:bg-gray-900 w-full max-w-6xl h-[92vh] rounded-2xl overflow-hidden flex flex-col shadow-2xl">
          <div class="flex items-center justify-between px-5 py-3 border-b border-slate-200 dark:border-gray-800 shrink-0">
            <p class="font-black uppercase tracking-wide text-sm text-slate-800 dark:text-white truncate pr-4">{{ vistaTitulo }}</p>
            <button @click="cerrarVista" class="w-10 h-10 rounded-full hover:bg-slate-100 dark:hover:bg-gray-800 flex items-center justify-center shrink-0" type="button">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>
          <iframe :src="vistaPdf" class="flex-1 w-full min-h-0 bg-slate-200" title="Vista previa del certificado"></iframe>
        </div>
      </div>
    </Teleport>
  </div>
</template>
