<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import api from '@/services/api';
import StatCard from '@/components/dashboard/StatCard.vue';
import {
    generarPdfEventos,     generarExcelEventos,
    generarPdfActividades, generarExcelActividades,
    generarPdfGeneral,     generarExcelGeneral,
} from '@/services/reportes.service';

// ─────────────────────────────────────────────────────── Tipos ───
interface Stat {
    title: string;
    value: string;
    icon: string;
    variant: 'primary' | 'success' | 'warning' | 'info' | 'danger';
}

type TipoReporte = 'general' | 'eventos' | 'actividades';

const router = useRouter();

// ─────────────────────────────────────────────────────── Estado ──
const stats = ref<Stat[]>([
    { title: 'Eventos Activos',       value: '…', icon: 'event_available', variant: 'primary'  },
    { title: 'Actividades Totales',   value: '…', icon: 'school',          variant: 'success'  },
    { title: 'Usuarios Registrados',  value: '…', icon: 'group',           variant: 'info'     },
    { title: 'Solicitudes Pendientes',value: '—', icon: 'pending_actions', variant: 'warning'  },
]);

const actividadesGrafico = ref<{ nombre: string; inscritos: number }[]>([]);
const rawEventos         = ref<any[]>([]);
const rawActividades     = ref<any[]>([]);
const cargando           = ref(true);

// Modal de reportes
const modal = ref(false);
const tipoActivo = ref<TipoReporte>('general');
const generando  = ref(false);

// ─────────────────────────────────────────────── Carga de datos ──
async function cargarDatos() {
    cargando.value = true;
    try {
        const [resEv, resAct, resUsr, resIns] = await Promise.all([
            api.get('/admin/eventos/lista?limit=1000'),
            api.get('/actividades-academicas'),
            api.get('/usuarios'),
            api.get('/inscripciones'),
        ]);

        const extractData = (res: any) => {
            const d = res.data?.data ?? res.data;
            return Array.isArray(d) ? d : [];
        };

        const eventos      = extractData(resEv);
        const actividades  = extractData(resAct);
        const usuarios     = extractData(resUsr);
        const inscrip      = extractData(resIns);

        rawEventos.value     = eventos;
        rawActividades.value = actividades;

        // Eventos Activos
        if (stats.value[0]) {
            stats.value[0].value = eventos.filter((e: any) => e.estado === 1).length.toString();
        }
        // Actividades Totales
        if (stats.value[1]) {
            stats.value[1].value = actividades.length.toString();
        }
        // Usuarios Registrados
        if (stats.value[2]) {
            stats.value[2].value = usuarios.length.toString();
        }
        // Solicitudes Pendientes (Inscripciones a cursos + Cuentas nuevas)
        if (stats.value[3]) {
            const pendingInscrip = inscrip.filter((i: any) => i.estado === 0).length;
            const pendingCuentas = usuarios.filter((u: any) => u.estado === 2).length;
            stats.value[3].value = (pendingInscrip + pendingCuentas).toString();
        }

        // Ordenar por inscritos y tomar los primeros 6
        actividadesGrafico.value = [...actividades]
            .sort((a, b) => (b.inscripciones?.length ?? 0) - (a.inscripciones?.length ?? 0))
            .slice(0, 6)
            .map((a: any) => ({
                nombre:    a.nombre || 'Sin nombre',
                inscritos: a.inscripciones?.length ?? 0,
            }));
    } catch (err) {
        console.error('Error al cargar estadísticas:', err);
    } finally {
        cargando.value = false;
    }
}

// ─────────────────────────────────────────────── Lógica modal ───
function abrirModal(tipo: TipoReporte) {
    tipoActivo.value = tipo;
    modal.value = true;
}

const INFO_REPORTE: Record<TipoReporte, { titulo: string; descripcion: string; icono: string }> = {
    general:     { titulo: 'Reporte General Consolidado', descripcion: 'Incluye eventos y actividades en un documento completo con portada, resumen ejecutivo y tablas detalladas.', icono: 'summarize' },
    eventos:     { titulo: 'Reporte de Eventos',          descripcion: 'Lista detallada de todos los eventos: nombre, gestión, ubicación, fechas, estado y número de actividades asociadas.', icono: 'event' },
    actividades: { titulo: 'Reporte de Actividades',      descripcion: 'Detalle de cada actividad académica: tipo, evento asociado, fechas, horas y cantidad de inscritos.', icono: 'school' },
};

async function descargar(formato: 'pdf' | 'excel') {
    generando.value = true;
    try {
        const tipo = tipoActivo.value;
        if (formato === 'pdf') {
            if (tipo === 'general')     generarPdfGeneral(rawEventos.value, rawActividades.value);
            if (tipo === 'eventos')     generarPdfEventos(rawEventos.value);
            if (tipo === 'actividades') generarPdfActividades(rawActividades.value);
        } else {
            if (tipo === 'general')     generarExcelGeneral(rawEventos.value, rawActividades.value);
            if (tipo === 'eventos')     generarExcelEventos(rawEventos.value);
            if (tipo === 'actividades') generarExcelActividades(rawActividades.value);
        }
        modal.value = false;
    } catch (err) {
        console.error('Error generando reporte:', err);
    } finally {
        generando.value = false;
    }
}

// ─────────────────────────────────────────────── Escala barras ──
function escala(inscritos: number): number {
    const max = Math.max(...actividadesGrafico.value.map(a => a.inscritos), 1);
    return Math.max((inscritos / max) * 100, 4);
}

onMounted(cargarDatos);
</script>

<template>
  <div class="space-y-10 animate-in fade-in duration-700 pb-24">

    <!-- ══════════════════ CABECERA ══════════════════ -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-gray-800">
      <div>
        <h2 class="text-3xl md:text-4xl font-black text-sky-600 dark:text-sky-400 uppercase italic tracking-tighter">
          Centro de Mando
        </h2>
        <p class="text-sm text-slate-400 dark:text-gray-500 mt-1">
          Monitoreo en tiempo real · TYAN Gestión Académica UMSA
        </p>
      </div>
      <div class="flex items-center gap-3 flex-wrap">
        <button @click="abrirModal('general')"
          class="inline-flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-gray-800 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800 rounded-2xl font-bold text-xs uppercase tracking-widest shadow-sm hover:shadow-md hover:border-sky-400 transition-all">
          <span class="material-symbols-outlined text-[17px]">summarize</span> Reporte General
        </button>
      </div>
    </div>

    <!-- ══════════════════ STAT CARDS ══════════════════ -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      <StatCard v-for="(s, i) in stats" :key="i"
        :title="s.title" :value="s.value" :icon="s.icon" :variant="s.variant as any" />
    </div>

    <!-- ══════════════════ SECCIÓN CENTRAL ══════════════════ -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">

      <!-- Gráfico de barras: inscritos por actividad -->
      <div class="lg:col-span-2 bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-gray-800 shadow-sm relative overflow-hidden">
        <!-- Ícono decorativo -->
        <span class="material-symbols-outlined absolute -right-6 -top-6 text-[130px] text-slate-50 dark:text-gray-800/20 select-none pointer-events-none">
          bar_chart
        </span>

        <!-- Cabecera sección -->
        <div class="flex items-start justify-between mb-8 relative z-10">
          <div>
            <h3 class="text-lg font-black text-sky-600 dark:text-sky-400 uppercase italic tracking-tight">
              Top Participación
            </h3>
            <p class="text-[11px] font-medium text-slate-400 uppercase tracking-widest mt-0.5">
              Actividades con más inscritos
            </p>
          </div>
          <button @click="abrirModal('actividades')"
            class="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-emerald-100 transition-colors">
            <span class="material-symbols-outlined text-[13px]">download</span> Exportar
          </button>
        </div>

        <!-- Barras -->
        <div v-if="cargando" class="flex items-center justify-center h-52 text-slate-300">
          <div class="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
        
        <div v-else-if="actividadesGrafico.length === 0" class="flex flex-col items-center justify-center h-52 text-center">
          <div class="w-16 h-16 bg-slate-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-3">
              <span class="material-symbols-outlined text-slate-300 text-3xl">inbox</span>
          </div>
          <p class="text-xs font-bold text-slate-400 uppercase tracking-widest">No hay actividades registradas</p>
          <p class="text-[10px] text-slate-300 mt-1">Crea actividades en la gestión de eventos para ver estadísticas.</p>
        </div>

        <div v-else class="flex items-end gap-4 h-52 relative z-10">
          <div v-for="(a, i) in actividadesGrafico" :key="i"
            class="flex flex-col items-center flex-1 group/bar relative">
            <!-- Tooltip -->
            <div class="absolute -top-9 left-1/2 -translate-x-1/2 bg-sky-700 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap shadow-lg z-20">
              {{ a.inscritos }} inscrito{{ a.inscritos !== 1 ? 's' : '' }}
            </div>
            <!-- Barra -->
            <div class="w-full rounded-t-xl bg-gradient-to-t from-sky-500 to-emerald-400 transition-all duration-700 group-hover/bar:brightness-110 shadow-sm"
              :style="{ height: `${escala(a.inscritos)}%` }">
            </div>
            <!-- Etiqueta -->
            <span class="text-[9px] font-bold text-slate-400 mt-2 text-center leading-tight w-full truncate px-1 uppercase">
              {{ a.nombre }}
            </span>
          </div>
        </div>
      </div>

      <!-- Panel de estado académico -->
      <div class="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-gray-800 shadow-sm flex flex-col gap-6">
        <div class="flex items-center justify-between border-b border-slate-50 dark:border-gray-800 pb-4">
          <h3 class="text-sm font-black text-sky-600 dark:text-sky-400 uppercase italic tracking-widest">
            Estado Académico
          </h3>
          <button @click="abrirModal('eventos')"
            class="p-1.5 rounded-xl text-slate-400 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-sky-900/20 transition-colors"
            title="Exportar reporte de eventos">
            <span class="material-symbols-outlined text-[19px]">download</span>
          </button>
        </div>

        <!-- Anillo decorativo -->
        <div class="relative w-40 h-40 mx-auto group shrink-0">
          <div class="absolute inset-0 rounded-full border-[10px] border-slate-50 dark:border-gray-800"></div>
          <div class="absolute inset-0 rounded-full border-[10px] border-transparent border-t-emerald-500 border-r-sky-500 rotate-45 transition-transform group-hover:rotate-[180deg] duration-1000"></div>
          <div class="absolute inset-0 flex flex-col items-center justify-center">
            <p class="text-3xl font-black text-sky-600 dark:text-white italic leading-none">{{ stats[1]?.value || '0' }}</p>
            <p class="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">Actividades</p>
          </div>
        </div>

        <!-- Indicadores rápidos -->
        <div class="space-y-3 mt-auto">
          <div class="flex items-center justify-between px-4 py-2.5 bg-emerald-50/60 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-800">
            <div class="flex items-center gap-2.5">
              <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
              <span class="text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">Eventos activos</span>
            </div>
            <span class="text-[11px] font-black text-emerald-800 dark:text-white">{{ stats[0]?.value || '0' }}</span>
          </div>
          <div class="flex items-center justify-between px-4 py-2.5 bg-sky-50/60 dark:bg-sky-900/10 rounded-2xl border border-sky-100 dark:border-sky-800">
            <div class="flex items-center gap-2.5">
              <span class="w-2 h-2 rounded-full bg-sky-400 shrink-0"></span>
              <span class="text-[10px] font-black text-sky-700 dark:text-sky-400 uppercase tracking-wide">Usuarios totales</span>
            </div>
            <span class="text-[11px] font-black text-sky-800 dark:text-white">{{ stats[2]?.value || '0' }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ══════════════════ ACCESOS RÁPIDOS ══════════════════ -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
      <button @click="router.push({ name: 'coordinador-usuarios' })"
        class="p-6 bg-white dark:bg-gray-900 rounded-[2rem] border border-slate-100 dark:border-gray-800 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all flex items-center gap-4 group text-left">
        <div class="w-12 h-12 p-3 rounded-2xl bg-sky-50 dark:bg-sky-900/20 text-sky-500 group-hover:bg-sky-500 group-hover:text-white transition-colors shrink-0">
          <span class="material-symbols-outlined text-2xl">manage_accounts</span>
        </div>
        <div>
          <p class="text-xs font-black text-sky-700 dark:text-sky-300 uppercase tracking-tight italic">Gestionar Usuarios</p>
          <p class="text-[10px] text-slate-400 mt-0.5">Control de accesos y roles</p>
        </div>
      </button>

      <button @click="router.push({ name: 'coordinador-solicitudes' })"
        class="p-6 bg-white dark:bg-gray-900 rounded-[2rem] border border-slate-100 dark:border-gray-800 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all flex items-center gap-4 group text-left">
        <div class="w-12 h-12 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-colors shrink-0">
          <span class="material-symbols-outlined text-2xl">how_to_reg</span>
        </div>
        <div>
          <p class="text-xs font-black text-emerald-700 dark:text-emerald-300 uppercase tracking-tight italic">Revisar Solicitudes</p>
          <p class="text-[10px] text-slate-400 mt-0.5">Aprobación de inscripciones</p>
        </div>
      </button>

      <button @click="router.push({ name: 'home' })"
        class="p-6 bg-white dark:bg-gray-900 rounded-[2rem] border-2 border-dashed border-sky-100 dark:border-gray-700 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all flex items-center gap-4 group text-left">
        <div class="w-12 h-12 p-3 rounded-2xl bg-slate-50 dark:bg-gray-800 text-slate-400 group-hover:bg-sky-500 group-hover:text-white transition-colors shrink-0">
          <span class="material-symbols-outlined text-2xl">visibility</span>
        </div>
        <div>
          <p class="text-xs font-black text-slate-600 dark:text-gray-300 uppercase tracking-tight italic">Vista Pública</p>
          <p class="text-[10px] text-slate-400 mt-0.5">Ver portal externo TYAN</p>
        </div>
      </button>
    </div>

    <!-- ══════════════════ MODAL DE REPORTES ══════════════════ -->
    <Teleport to="body">
      <Transition name="fadein">
        <div v-if="modal" class="fixed inset-0 z-[9000] flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <!-- Backdrop -->
          <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="modal = false"></div>

          <!-- Tarjeta del modal -->
          <div class="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 dark:border-gray-800">

            <!-- Paso 1: tipo de reporte seleccionado (cabecera) -->
            <div class="bg-gradient-to-br from-sky-600 to-emerald-500 p-8">
              <button @click="modal = false" class="absolute top-5 right-5 text-white/60 hover:text-white transition-colors">
                <span class="material-symbols-outlined text-2xl">close</span>
              </button>
              <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                  <span class="material-symbols-outlined text-white text-2xl">{{ INFO_REPORTE[tipoActivo].icono }}</span>
                </div>
                <div>
                  <p class="text-[10px] font-black text-sky-100 uppercase tracking-widest">Generar Reporte</p>
                  <h3 class="text-white font-black text-lg leading-snug mt-0.5">{{ INFO_REPORTE[tipoActivo].titulo }}</h3>
                </div>
              </div>
              <p class="text-sky-100/80 text-xs mt-4 leading-relaxed">{{ INFO_REPORTE[tipoActivo].descripcion }}</p>
            </div>

            <!-- Paso 2: cambiar tipo de reporte -->
            <div class="px-8 pt-6">
              <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Tipo de reporte</p>
              <div class="grid grid-cols-3 gap-2">
                <button v-for="(info, key) in INFO_REPORTE" :key="key" @click="tipoActivo = key as TipoReporte"
                  :class="[
                    'flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 text-center transition-all',
                    tipoActivo === key
                      ? 'border-sky-400 bg-sky-50 dark:bg-sky-900/20 text-sky-600'
                      : 'border-slate-100 dark:border-gray-800 text-slate-400 hover:border-sky-200'
                  ]">
                  <span class="material-symbols-outlined text-xl">{{ info.icono }}</span>
                  <span class="text-[9px] font-black uppercase tracking-wide leading-tight">
                    {{ key === 'general' ? 'General' : key === 'eventos' ? 'Eventos' : 'Actividades' }}
                  </span>
                </button>
              </div>
            </div>

            <!-- Paso 3: selección de formato -->
            <div class="px-8 py-6 space-y-3">
              <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Formato de descarga</p>

              <!-- PDF -->
              <button @click="descargar('pdf')" :disabled="generando"
                class="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-red-100 dark:border-red-900/30 hover:border-red-400 bg-red-50/40 dark:bg-red-900/10 hover:bg-red-50 transition-all group/pdf disabled:opacity-50 disabled:cursor-not-allowed">
                <div class="w-11 h-11 rounded-xl bg-red-500 text-white flex items-center justify-center shadow-md shadow-red-400/20 group-hover/pdf:scale-105 transition-transform shrink-0">
                  <span class="material-symbols-outlined text-xl">picture_as_pdf</span>
                </div>
                <div class="text-left">
                  <p class="text-sm font-black text-red-700 dark:text-red-400">Descargar PDF</p>
                  <p class="text-[10px] text-slate-400 mt-0.5">Documento con portada, tablas formateadas y pie de página institucional</p>
                </div>
                <span class="material-symbols-outlined text-slate-300 ml-auto">chevron_right</span>
              </button>

              <!-- Excel -->
              <button @click="descargar('excel')" :disabled="generando"
                class="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-emerald-100 dark:border-emerald-900/30 hover:border-emerald-400 bg-emerald-50/40 dark:bg-emerald-900/10 hover:bg-emerald-50 transition-all group/xls disabled:opacity-50 disabled:cursor-not-allowed">
                <div class="w-11 h-11 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-400/20 group-hover/xls:scale-105 transition-transform shrink-0">
                  <span class="material-symbols-outlined text-xl">table_view</span>
                </div>
                <div class="text-left">
                  <p class="text-sm font-black text-emerald-700 dark:text-emerald-400">Descargar Excel (.xlsx)</p>
                  <p class="text-[10px] text-slate-400 mt-0.5">Hojas separadas por sección, columnas ajustadas, listo para analizar</p>
                </div>
                <span class="material-symbols-outlined text-slate-300 ml-auto">chevron_right</span>
              </button>

              <!-- Spinner de carga -->
              <div v-if="generando" class="flex items-center justify-center gap-3 pt-2 text-sky-600">
                <div class="w-5 h-5 border-2 border-sky-400 border-t-transparent rounded-full animate-spin"></div>
                <span class="text-sm font-bold">Generando archivo…</span>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<style scoped>
.fadein-enter-active,
.fadein-leave-active {
    transition: opacity 0.2s ease;
}
.fadein-enter-from,
.fadein-leave-to {
    opacity: 0;
}
</style>