<script setup lang="ts">
import { ref, onMounted } from 'vue';
import api from '@/services/api';
import Swal from 'sweetalert2';

const configs = ref<any[]>([]);
const stats = ref<any>(null);
const isLoading = ref(true);
const previewHtml = ref('');

const showPreview = (config: any) => {
  const masterLayout = configs.value.find(c => c.clave === 'MAIL_MASTER_LAYOUT')?.valor || '{{{content}}}';
  let body = configs.value.find(c => c.clave === 'WELCOME_MESSAGE_BODY')?.valor || '';
  
  if (config.clave === 'MAIL_MASTER_LAYOUT') {
    // Si previsualizamos el layout, inyectamos un texto de ejemplo
    previewHtml.value = config.valor
      .replace('{{{content}}}', '<p>Este es un <b>mensaje de ejemplo</b> inyectado en el layout maestro.</p>')
      .replace('{{year}}', new Date().getFullYear().toString());
  } else {
    // Si previsualizamos el cuerpo, lo envolvemos en el layout
    let contentHtml = body
      .replace(/{{nombre}}/g, 'Juan Pérez')
      .replace(/{{email}}/g, 'juan.perez@ejemplo.com')
      .replace(/{{password}}/g, 'Admin123*')
      .replace(/\n/g, '<br>');

    previewHtml.value = masterLayout
      .replace('{{{content}}}', contentHtml)
      .replace('{{year}}', new Date().getFullYear().toString());
  }
};

const downloadTemplate = (config: any) => {
  const blob = new Blob([config.valor], { type: 'text/html' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${config.clave.toLowerCase()}.html`;
  a.click();
  window.URL.revokeObjectURL(url);
};

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
              <div class="flex items-center gap-2">
                <h3 class="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">{{ config.clave }}</h3>
                <span v-if="config.clave === 'MAIL_MASTER_LAYOUT'" class="text-[9px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-black uppercase">Crítico</span>
              </div>
              <p class="text-xs text-slate-500 mt-1">{{ config.descripcion }}</p>
            </div>
            <div class="flex gap-2">
              <button v-if="config.clave.includes('BODY') || config.clave.includes('LAYOUT')"
                      @click="showPreview(config)"
                      class="px-4 py-2 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 text-[10px] font-black uppercase rounded-lg hover:bg-slate-200 transition-all flex items-center gap-2">
                <span class="material-symbols-outlined text-[16px]">visibility</span>
                Previsualizar
              </button>
              <button v-if="config.clave === 'MAIL_MASTER_LAYOUT'"
                      @click="downloadTemplate(config)"
                      class="px-4 py-2 bg-slate-800 text-white text-[10px] font-black uppercase rounded-lg hover:bg-slate-900 transition-all flex items-center gap-2">
                <span class="material-symbols-outlined text-[16px]">download</span>
                Exportar
              </button>
              <button @click="updateConfig(config)"
                      class="px-4 py-2 bg-red-600 text-white text-[10px] font-black uppercase rounded-lg shadow-lg shadow-red-600/20 hover:bg-red-700 transition-all">
                Guardar Cambios
              </button>
            </div>
          </div>
          
          <textarea v-if="config.clave.includes('BODY') || config.clave.includes('LAYOUT')" 
                    v-model="config.valor" rows="12"
                    class="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-4 text-xs font-mono outline-none focus:border-red-600/50 transition-all shadow-inner"></textarea>
          <input v-else v-model="config.valor" type="text"
                 class="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-4 text-sm font-bold outline-none focus:border-red-600/50 transition-all" />
          
          <div v-if="config.clave === 'WELCOME_MESSAGE_BODY'" class="mt-4 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/30">
            <div class="flex items-center gap-2 mb-3">
              <span class="material-symbols-outlined text-blue-500 text-[18px]">info</span>
              <p class="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider">Etiquetas Dinámicas Soportadas:</p>
            </div>
            <div class="flex flex-wrap gap-3">
              <div class="flex flex-col gap-1">
                <code class="px-2 py-1 bg-white dark:bg-black/20 text-[11px] rounded border border-blue-200 text-blue-700 font-bold w-fit">\{\{nombre\}\}</code>
                <span class="text-[9px] text-slate-400 uppercase pl-1">Nombre Completo</span>
              </div>
              <div class="flex flex-col gap-1">
                <code class="px-2 py-1 bg-white dark:bg-black/20 text-[11px] rounded border border-blue-200 text-blue-700 font-bold w-fit">\{\{email\}\}</code>
                <span class="text-[9px] text-slate-400 uppercase pl-1">Correo Electrónico</span>
              </div>
              <div class="flex flex-col gap-1">
                <code class="px-2 py-1 bg-white dark:bg-black/20 text-[11px] rounded border border-blue-200 text-blue-700 font-bold w-fit">\{\{password\}\}</code>
                <span class="text-[9px] text-slate-400 uppercase pl-1">Contraseña Temporal</span>
              </div>
              <div class="flex flex-col gap-1">
                <code class="px-2 py-1 bg-white dark:bg-black/20 text-[11px] rounded border border-blue-200 text-blue-700 font-bold w-fit">\{\{url_sistema\}\}</code>
                <span class="text-[9px] text-slate-400 uppercase pl-1">Link de Acceso</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- PREVIEW MODAL -->
    <div v-if="previewHtml" 
         class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
      <div class="bg-white dark:bg-[#13131f] w-full max-w-4xl h-[85vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-white/10">
        <div class="p-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50 dark:bg-white/2">
          <div class="flex items-center gap-3">
            <span class="material-symbols-outlined text-red-500">mark_email_read</span>
            <h3 class="text-sm font-black uppercase tracking-tight text-slate-800 dark:text-white">Vista Previa del Correo</h3>
          </div>
          <button @click="previewHtml = ''" class="w-10 h-10 rounded-full hover:bg-slate-200 dark:hover:bg-white/10 flex items-center justify-center transition-all">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        <div class="flex-1 overflow-y-auto p-8 bg-slate-100 dark:bg-black/20">
          <div class="bg-white rounded-2xl shadow-xl overflow-hidden max-w-[600px] mx-auto border border-slate-200" v-html="previewHtml"></div>
        </div>
        <div class="p-6 border-t border-slate-100 dark:border-white/5 text-center">
          <p class="text-[10px] text-slate-400 uppercase font-black tracking-widest">Este es un ejemplo de cómo el usuario final verá el mensaje</p>
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
