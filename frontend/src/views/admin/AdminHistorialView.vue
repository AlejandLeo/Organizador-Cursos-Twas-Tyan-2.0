<script setup lang="ts">
import { ref, computed } from 'vue';
import { useAdminHistorialStore } from '@/stores/adminHistorial';

const historialStore = useAdminHistorialStore();

// --- Filtros Primordiales ---
const filtroModulo = ref('');
const filtroAccion = ref('');

const moduloConfig: Record<string, { icon: string; label: string; color: string }> = {
  evento: { icon: 'corporate_fare', label: 'Evento', color: 'text-rose-500' },
  actividad: { icon: 'school', label: 'Actividad', color: 'text-amber-500' },
  usuario: { icon: 'manage_accounts', label: 'Usuario', color: 'text-purple-500' },
  certificado: { icon: 'workspace_premium', label: 'Certificado', color: 'text-blue-500' },
};

const accionConfig: Record<string, { label: string; color: string; bg: string }> = {
  crear: { label: 'Creación', color: 'text-emerald-600', bg: 'bg-emerald-100' },
  editar: { label: 'Edición', color: 'text-blue-600', bg: 'bg-blue-100' },
  eliminar: { label: 'Eliminación', color: 'text-red-600', bg: 'bg-red-100' },
};

const registrosFiltrados = computed(() => {
  return historialStore.registros.filter(log => {
    const coincideModulo = !filtroModulo.value || log.modulo === filtroModulo.value;
    const coincideAccion = !filtroAccion.value || log.accion === filtroAccion.value;
    return coincideModulo && coincideAccion;
  });
});

const registrosAgrupados = computed(() => {
  const grupos: Record<string, any[]> = {};
  registrosFiltrados.value.forEach(log => {
    const fecha = new Date(log.timestamp).toLocaleDateString('es-ES', { 
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
    });
    if (!grupos[fecha]) grupos[fecha] = [];
    grupos[fecha].push(log);
  });
  return grupos;
});

const formatHora = (iso: string) => {
  return new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
};
</script>

<template>
  <div class="space-y-8 animate-in fade-in duration-500">
    
    <!-- HEADER AUDITORÍA -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-3 mb-2">
          <div class="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center shadow-xl">
            <span class="material-symbols-outlined text-white text-[22px]">gavel</span>
          </div>
          <div>
            <p class="text-[10px] font-black text-red-600 dark:text-red-500 uppercase tracking-widest leading-none">Auditoría Primordial</p>
            <h1 class="text-2xl font-black text-slate-800 dark:text-white tracking-tight uppercase italic">Bitácora de Cambios</h1>
          </div>
        </div>
        <p class="text-slate-500 text-sm ml-1">Registro estricto de Creaciones, Ediciones y Eliminaciones de datos</p>
      </div>

      <button @click="historialStore.limpiarTodo()" 
              class="px-6 py-3 bg-red-50 dark:bg-red-900/20 text-[10px] font-black text-red-600 dark:text-red-500 uppercase tracking-widest rounded-xl hover:bg-red-100 transition-all border border-red-200 dark:border-red-900/40">
        Borrar bitácora
      </button>
    </div>

    <!-- FILTROS DE AUDITORÍA -->
    <div class="bg-white dark:bg-[#13131f] border border-slate-200 dark:border-white/5 rounded-2xl p-4 shadow-sm">
      <div class="flex flex-wrap items-center gap-6">
        <div class="flex items-center gap-2">
          <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Módulo:</span>
          <div class="flex gap-1">
            <button v-for="(cfg, key) in moduloConfig" :key="key"
                    @click="filtroModulo = filtroModulo === key ? '' : key"
                    :class="[filtroModulo === key ? 'bg-slate-900 text-white shadow-md' : 'bg-slate-100 dark:bg-white/5 text-slate-500 hover:bg-slate-200']"
                    class="px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all">
              {{ cfg.label }}
            </button>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Acción:</span>
          <div class="flex gap-1">
            <button v-for="(cfg, key) in accionConfig" :key="key"
                    @click="filtroAccion = filtroAccion === key ? '' : key"
                    :class="[filtroAccion === key ? 'bg-slate-900 text-white shadow-md' : 'bg-slate-100 dark:bg-white/5 text-slate-500 hover:bg-slate-200']"
                    class="px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all">
              {{ cfg.label }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- LISTADO DE AUDITORÍA -->
    <div v-if="registrosFiltrados.length === 0" class="py-20 flex flex-col items-center text-slate-300">
      <span class="material-symbols-outlined text-6xl mb-2 opacity-20">history_edu</span>
      <p class="text-xs font-black uppercase tracking-widest italic">No hay cambios registrados en este periodo</p>
    </div>

    <div v-else class="space-y-12">
      <div v-for="(registros, fecha) in registrosAgrupados" :key="fecha" class="relative">
        <h2 class="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] mb-6 flex items-center gap-4">
          {{ fecha }}
          <div class="h-px flex-1 bg-slate-100 dark:bg-white/5"></div>
        </h2>

        <div class="space-y-4">
          <div v-for="log in registros" :key="log.id"
               class="bg-white dark:bg-[#13131f] border border-slate-200 dark:border-white/5 rounded-3xl p-6 shadow-sm hover:border-red-600/30 transition-all group overflow-hidden relative">
            
            <div class="flex items-start justify-between gap-6">
              <div class="flex items-start gap-4">
                <div :class="[moduloConfig[log.modulo]?.color || 'text-slate-400']" class="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-white/5 flex items-center justify-center border border-slate-100 dark:border-white/10">
                  <span class="material-symbols-outlined text-[24px]">{{ moduloConfig[log.modulo]?.icon || 'help' }}</span>
                </div>
                
                <div class="space-y-1">
                  <div class="flex items-center gap-2">
                    <span :class="[accionConfig[log.accion]?.color, accionConfig[log.accion]?.bg]"
                          class="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border border-current/20">
                      {{ accionConfig[log.accion]?.label || log.accion }}
                    </span>
                    <span class="text-[10px] font-black text-slate-400 uppercase tracking-wider">Por {{ log.usuario }}</span>
                  </div>
                  <h3 class="text-base font-black text-slate-800 dark:text-white leading-tight">{{ log.descripcion }}</h3>
                  <p v-if="log.entidadNombre" class="text-[11px] font-bold text-red-600 dark:text-red-400 italic">Entidad: {{ log.entidadNombre }}</p>
                </div>
              </div>

              <div class="text-right">
                <p class="text-[11px] font-black text-slate-400 dark:text-slate-600 uppercase">{{ formatHora(log.timestamp) }}</p>
              </div>
            </div>

            <!-- TABLA DE COMPARACIÓN (SÓLO SI HAY CAMBIOS) -->
            <div v-if="log.cambios && log.cambios.length > 0" class="mt-6 pt-6 border-t border-slate-100 dark:border-white/5">
              <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Detalle del cambio:</p>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div v-for="cambio in log.cambios" :key="cambio.campo" 
                     class="bg-slate-50 dark:bg-white/3 rounded-xl p-3 border border-slate-100 dark:border-white/5">
                  <p class="text-[9px] font-black text-red-600 uppercase mb-2">{{ cambio.campo }}</p>
                  <div class="flex items-center justify-between gap-4">
                    <div class="flex-1">
                      <p class="text-[8px] text-slate-400 uppercase font-black mb-1">Anterior</p>
                      <p class="text-xs font-bold text-slate-600 line-through decoration-red-500/50">{{ cambio.antes || '(vacio)' }}</p>
                    </div>
                    <span class="material-symbols-outlined text-slate-300 text-[16px]">trending_flat</span>
                    <div class="flex-1">
                      <p class="text-[8px] text-emerald-500 uppercase font-black mb-1">Nuevo</p>
                      <p class="text-xs font-bold text-slate-800 dark:text-emerald-400">{{ cambio.despues || '(vacio)' }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  </div>
</template>
