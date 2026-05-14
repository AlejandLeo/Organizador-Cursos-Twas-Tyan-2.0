<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAdminHistorialStore } from '@/stores/adminHistorial';
import { useUIStore } from '@/stores/ui';
import api from '@/services/api';

const router = useRouter();
const historialStore = useAdminHistorialStore();
const uiStore = useUIStore();

// --- Estado ---
const stats = ref({ eventos: 0, actividades: 0, usuarios: 0, inscripciones: 0, ponentes: 0, estudiantes: 0 });
const isLoading = ref(true);

// --- Configuración Visual ---
const moduloConfig: Record<string, { icon: string; label: string }> = {
  evento: { icon: 'corporate_fare', label: 'Evento' },
  actividad: { icon: 'school', label: 'Actividad' },
  usuario: { icon: 'manage_accounts', label: 'Usuario' },
  certificado: { icon: 'workspace_premium', label: 'Certificado' },
  solicitud: { icon: 'how_to_reg', label: 'Solicitud' },
  auth: { icon: 'shield_person', label: 'Autenticación' },
  ponente: { icon: 'record_voice_over', label: 'Ponente' },
  estudiante: { icon: 'groups', label: 'Estudiante' },
};

const accionConfig: Record<string, { icon: string; color: string; bg: string }> = {
  crear: { icon: 'add_circle', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  editar: { icon: 'edit', color: 'text-blue-500', bg: 'bg-blue-500/10' },
  eliminar: { icon: 'delete', color: 'text-red-500', bg: 'bg-red-500/10' },
  aprobar: { icon: 'check_circle', color: 'text-green-500', bg: 'bg-green-500/10' },
  ver: { icon: 'visibility', color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
};

const formatRelativo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `hace ${d}d`;
  if (h > 0) return `hace ${h}h`;
  if (m > 0) return `hace ${m}min`;
  return 'ahora mismo';
};

// --- Tarjetas de stats ---
const statCards = computed(() => [
  { label: 'Eventos', value: stats.value.eventos, icon: 'corporate_fare', color: 'from-red-600 to-rose-700', route: 'admin-eventos' },
  { label: 'Actividades', value: stats.value.actividades, icon: 'school', color: 'from-orange-600 to-amber-700', route: 'admin-actividades' },
  { label: 'Usuarios', value: stats.value.usuarios, icon: 'manage_accounts', color: 'from-purple-600 to-violet-700', route: 'admin-usuarios' },
  { label: 'Solicitudes', value: stats.value.inscripciones, icon: 'how_to_reg', color: 'from-blue-600 to-indigo-700', route: 'admin-solicitudes' },
  { label: 'Ponentes', value: stats.value.ponentes, icon: 'record_voice_over', color: 'from-emerald-600 to-teal-700', route: 'admin-ponentes' },
  { label: 'Estudiantes', value: stats.value.estudiantes, icon: 'groups', color: 'from-cyan-600 to-sky-700', route: 'admin-estudiantes' },
]);

// --- Otros datos ---
const accionesHoy = computed(() => {
  const hoy = new Date().toDateString();
  return historialStore.registros.filter(r => new Date(r.timestamp).toDateString() === hoy).length;
});

// --- Fetch data ---
onMounted(async () => {
  try {
    const [eventosRes, actividadesRes, usuariosRes] = await Promise.allSettled([
      api.get('/admin/eventos/lista?limit=1000'),
      api.get('/actividades-academicas'),
      api.get('/usuarios'),
    ]);
    if (eventosRes.status === 'fulfilled') stats.value.eventos = eventosRes.value.data?.total || eventosRes.value.data?.length || 0;
    if (actividadesRes.status === 'fulfilled') stats.value.actividades = actividadesRes.value.data?.length || 0;
    if (usuariosRes.status === 'fulfilled') stats.value.usuarios = usuariosRes.value.data?.length || 0;
  } catch { /* silently */ }
  finally { isLoading.value = false; }
});
</script>

<template>
  <div class="space-y-8 animate-in fade-in duration-500">

    <!-- PAGE HEADER -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-3 mb-2">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-rose-800 flex items-center justify-center shadow-lg shadow-red-900/50">
            <span class="material-symbols-outlined text-white text-[22px]">monitoring</span>
          </div>
          <div>
            <p class="text-[10px] font-black text-red-600 dark:text-red-500 uppercase tracking-widest leading-none">Super Administrador</p>
            <h1 class="text-2xl font-black text-slate-800 dark:text-white tracking-tight uppercase italic">Dashboard Global</h1>
          </div>
        </div>
        <p class="text-slate-500 text-sm ml-1">Vista general del sistema TYAN · Acceso total garantizado</p>
      </div>
      <div class="flex items-center gap-3">
        <div class="px-4 py-2 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-700/30 rounded-xl text-center">
          <p class="text-[9px] text-red-600 dark:text-red-500 uppercase tracking-widest font-bold">Acciones hoy</p>
          <p class="text-2xl font-black text-slate-800 dark:text-white">{{ accionesHoy }}</p>
        </div>
        <div class="px-4 py-2 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-center">
          <p class="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Total historial</p>
          <p class="text-2xl font-black text-slate-800 dark:text-white">{{ historialStore.registros.length }}</p>
        </div>
      </div>
    </div>

    <!-- STAT CARDS -->
    <div class="grid grid-cols-2 lg:grid-cols-6 gap-4">
      <div v-for="card in statCards" :key="card.label"
           @click="router.push({ name: card.route })"
           class="bg-white dark:bg-[#13131f] border border-slate-200 dark:border-white/5 rounded-2xl p-5 cursor-pointer hover:border-red-500/50 hover:-translate-y-1 transition-all duration-300 group shadow-sm dark:shadow-none">
        <div :class="`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`">
          <span class="material-symbols-outlined text-white text-[20px]">{{ card.icon }}</span>
        </div>
        <p class="text-3xl font-black text-slate-800 dark:text-white leading-none mb-1">
          <span v-if="isLoading" class="inline-block w-8 h-6 bg-slate-200 dark:bg-white/10 rounded animate-pulse"></span>
          <span v-else>{{ card.value }}</span>
        </p>
        <p class="text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest">{{ card.label }}</p>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- ACTIVIDAD RECIENTE -->
      <div class="lg:col-span-2 space-y-4">
        <div class="flex items-center justify-between px-2">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-red-600">history</span>
            <h2 class="text-xs font-black text-slate-800 dark:text-white uppercase tracking-widest italic">Actividad Reciente</h2>
          </div>
          <button @click="router.push('/admin/historial')" 
                  class="text-[9px] font-black text-red-600 dark:text-red-500 uppercase tracking-widest flex items-center gap-1 group">
            Ver todo <span class="material-symbols-outlined text-[14px] group-hover:translate-x-1 transition-transform">trending_flat</span>
          </button>
        </div>

        <div class="bg-white dark:bg-[#13131f] border border-slate-200 dark:border-white/5 rounded-[2.5rem] overflow-hidden shadow-sm dark:shadow-none">
          <div v-if="historialStore.registros.length === 0" class="py-20 flex flex-col items-center text-slate-400">
            <span class="material-symbols-outlined text-5xl mb-2 opacity-20">history_toggle_off</span>
            <p class="text-[10px] font-black uppercase tracking-widest">Sin actividad registrada aún</p>
          </div>
          <div v-else class="divide-y divide-slate-100 dark:divide-white/5">
            <div v-for="log in historialStore.registros.slice(0, 6)" :key="log.id"
                 class="flex items-center gap-4 p-5 hover:bg-slate-50 dark:hover:bg-white/5 transition-all group">
              <div :class="[accionConfig[log.accion]?.bg || 'bg-slate-100 dark:bg-white/10', 'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-slate-200 dark:border-white/10']">
                <span class="material-symbols-outlined text-[18px]" :class="accionConfig[log.accion]?.color || 'text-slate-400'">
                  {{ accionConfig[log.accion]?.icon || 'visibility' }}
                </span>
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-0.5">
                  <span class="text-[8px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded border border-slate-200 dark:border-white/10">
                    {{ moduloConfig[log.modulo]?.label || log.modulo }}
                  </span>
                  <div v-if="!log.leido" class="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></div>
                </div>
                <p class="text-xs font-black text-slate-700 dark:text-slate-300 truncate">{{ log.descripcion }}</p>
                <p v-if="log.entidadNombre" class="text-[9px] text-red-600 dark:text-red-400 font-bold italic truncate mt-0.5">→ {{ log.entidadNombre }}</p>
              </div>
              <p class="text-[9px] font-black text-slate-400 dark:text-slate-600 shrink-0 italic">{{ formatRelativo(log.timestamp) }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- SIDEBAR DASHBOARD CONTENT -->
      <div class="space-y-8">
        <!-- QUICK LINKS -->
        <div class="bg-white dark:bg-[#13131f] border border-slate-200 dark:border-white/5 rounded-[2.5rem] p-6 shadow-sm dark:shadow-none">
          <div class="flex items-center gap-2 mb-6">
            <span class="material-symbols-outlined text-red-600">bolt</span>
            <h2 class="text-xs font-black text-slate-800 dark:text-white uppercase tracking-widest italic">Accesos Rápidos</h2>
          </div>
          <div class="space-y-3">
            <button @click="router.push('/admin/eventos')"
                    class="w-full flex items-center gap-3 p-4 bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/5 rounded-2xl hover:border-red-500/50 hover:bg-slate-100 dark:hover:bg-red-900/10 transition-all group text-left">
              <span class="material-symbols-outlined text-slate-400 dark:text-slate-600 group-hover:text-red-600 transition-colors">corporate_fare</span>
              <span class="text-[10px] font-black text-slate-700 dark:text-slate-400 uppercase tracking-widest">Gestionar Eventos</span>
            </button>
            <button @click="router.push('/admin/actividades')"
                    class="w-full flex items-center gap-3 p-4 bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/5 rounded-2xl hover:border-red-500/50 hover:bg-slate-100 dark:hover:bg-red-900/10 transition-all group text-left">
              <span class="material-symbols-outlined text-slate-400 dark:text-slate-600 group-hover:text-red-600 transition-colors">school</span>
              <span class="text-[10px] font-black text-slate-700 dark:text-slate-400 uppercase tracking-widest">Actividades Académicas</span>
            </button>
          </div>
        </div>

        <!-- ACTIVITY BY MODULE -->
        <div class="bg-white dark:bg-[#13131f] border border-slate-200 dark:border-white/5 rounded-[2.5rem] p-6 shadow-sm dark:shadow-none">
          <div class="flex items-center gap-2 mb-6 text-red-600">
            <span class="material-symbols-outlined">analytics</span>
            <h2 class="text-xs font-black dark:text-white uppercase tracking-widest italic">Actividad por Módulo</h2>
          </div>
          <div class="space-y-5">
            <div v-for="(count, mod) in historialStore.porModulo" :key="mod" class="space-y-1.5">
              <div class="flex justify-between items-center px-1">
                <span class="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1">
                  <span class="material-symbols-outlined text-[11px]">{{ moduloConfig[mod]?.icon || 'circle' }}</span>
                  {{ moduloConfig[mod]?.label || mod }}
                </span>
                <span class="text-[10px] font-black text-slate-800 dark:text-white">{{ count }}</span>
              </div>
              <div class="h-1.5 w-full bg-slate-100 dark:bg-black/50 rounded-full overflow-hidden">
                <div class="h-full bg-red-600 transition-all duration-1000" :style="{ width: (count / (historialStore.registros.length || 1) * 100) + '%' }"></div>
              </div>
            </div>
            <p v-if="Object.keys(historialStore.porModulo).length === 0" class="text-[10px] text-slate-400 uppercase italic text-center py-4">Sin datos registrados</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
