<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useAdminHistorialStore } from '@/stores/adminHistorial';
import Swal from 'sweetalert2';

const historialStore = useAdminHistorialStore();

// ─── Filtros ───────────────────────────────────────────────
const filtroModulo = ref('');
const filtroAccion = ref('');
const busqueda = ref('');
const fechaDesde = ref('');
const fechaHasta = ref('');
const expandedId = ref<number | null>(null);

const moduloConfig: Record<string, { icon: string; label: string; color: string; bg: string }> = {
  evento: { icon: 'corporate_fare', label: 'Evento', color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-900/20' },
  actividad: { icon: 'school', label: 'Actividad', color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
  usuario: { icon: 'manage_accounts', label: 'Usuario', color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
  certificado: { icon: 'workspace_premium', label: 'Certificado', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
};

const accionConfig: Record<string, { label: string; color: string; bg: string }> = {
  crear: { label: 'Creación', color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
  editar: { label: 'Edición', color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  eliminar: { label: 'Eliminación', color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30' },
};

// ─── Carga y paginación ─────────────────────────────────────
const cargarDatos = async (page = 1) => {
  await historialStore.cargar({
    page,
    limit: 15,
    modulo: filtroModulo.value || undefined,
    accion: filtroAccion.value || undefined,
    busqueda: busqueda.value || undefined,
    fechaDesde: fechaDesde.value || undefined,
    fechaHasta: fechaHasta.value || undefined,
  });
};

// Debounce para búsqueda
let searchTimeout: any;
const onBusquedaChange = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => cargarDatos(1), 400);
};

const cambiarPagina = (delta: number) => {
  const newPage = historialStore.page + delta;
  if (newPage >= 1 && newPage <= historialStore.totalPages) {
    cargarDatos(newPage);
  }
};

const irAPagina = (page: number) => cargarDatos(page);

// Watcher para filtros
watch([filtroModulo, filtroAccion, fechaDesde, fechaHasta], () => cargarDatos(1));

onMounted(() => {
  cargarDatos(1);
  historialStore.marcarTodosLeidos();
});

// ─── Formato ────────────────────────────────────────────────
const formatFecha = (iso: string) => {
  return new Date(iso).toLocaleDateString('es-ES', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
};

const formatHora = (iso: string) => {
  return new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

const formatFechaCompleta = (iso: string) => {
  return new Date(iso).toLocaleDateString('es-ES', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
};

// ─── Expand/Collapse ────────────────────────────────────────
const toggleExpand = (id: number) => {
  expandedId.value = expandedId.value === id ? null : id;
};

// ─── Paginación visual ─────────────────────────────────────
const paginasVisibles = computed(() => {
  const pages: number[] = [];
  const total = historialStore.totalPages;
  const current = historialStore.page;
  const maxVisible = 5;
  let start = Math.max(1, current - Math.floor(maxVisible / 2));
  let end = Math.min(total, start + maxVisible - 1);
  if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  return pages;
});

// ─── Exportación ────────────────────────────────────────────
const exportarExcel = async () => {
  try {
    const data = await historialStore.exportar({
      modulo: filtroModulo.value || undefined,
      accion: filtroAccion.value || undefined,
      busqueda: busqueda.value || undefined,
      fechaDesde: fechaDesde.value || undefined,
      fechaHasta: fechaHasta.value || undefined,
    });

    const XLSX = await import('xlsx');
    const rows = data.map((r: any) => ({
      'ID': r.id,
      'Fecha': formatFecha(r.fecha_creacion),
      'Hora': formatHora(r.fecha_creacion),
      'Módulo': moduloConfig[r.modulo]?.label || r.modulo,
      'Acción': accionConfig[r.accion]?.label || r.accion,
      'Descripción': r.descripcion,
      'Usuario': r.usuario,
      'Entidad': r.entidad_nombre || '—',
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Auditoría');
    
    // Ajustar anchos de columna
    ws['!cols'] = [
      { wch: 6 }, { wch: 14 }, { wch: 10 }, { wch: 14 },
      { wch: 12 }, { wch: 50 }, { wch: 22 }, { wch: 30 },
    ];

    XLSX.writeFile(wb, `Auditoria_SGEA_${new Date().toISOString().slice(0, 10)}.xlsx`);
    Swal.fire({ toast: true, icon: 'success', title: 'Excel exportado', timer: 2000, showConfirmButton: false, position: 'top-end' });
  } catch (e) {
    console.error('Error exportando Excel:', e);
    Swal.fire('Error', 'No se pudo exportar a Excel. Verifica que xlsx esté instalado.', 'error');
  }
};

const exportarPDF = async () => {
  try {
    const data = await historialStore.exportar({
      modulo: filtroModulo.value || undefined,
      accion: filtroAccion.value || undefined,
      busqueda: busqueda.value || undefined,
      fechaDesde: fechaDesde.value || undefined,
      fechaHasta: fechaHasta.value || undefined,
    });

    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');

    const doc = new jsPDF('landscape', 'mm', 'letter');

    // Header
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('REPORTE DE AUDITORÍA', 14, 20);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Sistema SGEA — Generado: ${new Date().toLocaleString('es-ES')}`, 14, 27);
    doc.text(`Total de registros: ${data.length}`, 14, 33);

    // Línea divisoria
    doc.setDrawColor(220, 38, 38);
    doc.setLineWidth(0.5);
    doc.line(14, 36, 265, 36);

    const rows = data.map((r: any) => [
      r.id,
      formatFecha(r.fecha_creacion),
      formatHora(r.fecha_creacion),
      moduloConfig[r.modulo]?.label || r.modulo,
      accionConfig[r.accion]?.label || r.accion,
      r.descripcion?.substring(0, 60) || '',
      r.usuario,
      r.entidad_nombre || '—',
    ]);

    autoTable(doc, {
      startY: 40,
      head: [['ID', 'Fecha', 'Hora', 'Módulo', 'Acción', 'Descripción', 'Usuario', 'Entidad']],
      body: rows,
      styles: { fontSize: 7, cellPadding: 2 },
      headStyles: { fillColor: [220, 38, 38], textColor: 255, fontSize: 7, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [252, 245, 245] },
      margin: { left: 14, right: 14 },
    });

    doc.save(`Auditoria_SGEA_${new Date().toISOString().slice(0, 10)}.pdf`);
    Swal.fire({ toast: true, icon: 'success', title: 'PDF exportado', timer: 2000, showConfirmButton: false, position: 'top-end' });
  } catch (e) {
    console.error('Error exportando PDF:', e);
    Swal.fire('Error', 'No se pudo exportar a PDF. Verifica que jspdf esté instalado.', 'error');
  }
};

// ─── Limpiar bitácora ───────────────────────────────────────
const confirmarLimpiar = async () => {
  const { isConfirmed } = await Swal.fire({
    title: '¿Limpiar TODA la bitácora?',
    text: 'Esta acción eliminará permanentemente todos los registros de auditoría.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc2626',
    confirmButtonText: 'Sí, limpiar todo',
    cancelButtonText: 'Cancelar',
  });
  if (!isConfirmed) return;
  await historialStore.limpiarTodo();
  Swal.fire({ toast: true, icon: 'info', title: 'Bitácora limpiada', timer: 2000, showConfirmButton: false, position: 'top-end' });
};

const limpiarFiltros = () => {
  filtroModulo.value = '';
  filtroAccion.value = '';
  busqueda.value = '';
  fechaDesde.value = '';
  fechaHasta.value = '';
  cargarDatos(1);
};
</script>

<template>
  <div class="space-y-6 animate-in fade-in duration-500">
    
    <!-- HEADER -->
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-3 mb-2">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-800 to-slate-950 flex items-center justify-center shadow-xl">
            <span class="material-symbols-outlined text-white text-[22px]">gavel</span>
          </div>
          <div>
            <p class="text-[10px] font-black text-red-600 dark:text-red-500 uppercase tracking-widest leading-none">Auditoría del Sistema</p>
            <h1 class="text-xl sm:text-2xl font-black text-slate-800 dark:text-white tracking-tight uppercase italic">Bitácora de Cambios</h1>
          </div>
        </div>
        <p class="text-slate-500 text-xs sm:text-sm ml-1">
          Registro de Cambios del Sistema
          <span v-if="historialStore.total > 0" class="text-red-600 font-bold">({{ historialStore.total }} registros)</span>
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <button @click="exportarExcel()"
                class="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all">
          <span class="material-symbols-outlined text-[16px]">table_chart</span>
          Excel
        </button>
        <button @click="exportarPDF()"
                class="flex items-center gap-1.5 px-4 py-2.5 bg-red-600 text-white rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-600/20 hover:bg-red-700 transition-all">
          <span class="material-symbols-outlined text-[16px]">picture_as_pdf</span>
          PDF
        </button>
        <button @click="confirmarLimpiar()" 
                class="flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 dark:bg-white/5 text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest rounded-xl hover:bg-red-50 hover:text-red-600 transition-all border border-slate-200 dark:border-white/10">
          <span class="material-symbols-outlined text-[16px]">delete_sweep</span>
          Limpiar
        </button>
      </div>
    </div>

    <!-- FILTROS -->
    <div class="bg-white dark:bg-[#13131f] border border-slate-200 dark:border-white/5 rounded-2xl p-4 shadow-sm space-y-4">
      <!-- Buscador -->
      <div class="relative">
        <span class="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-[18px]">search</span>
        <input v-model="busqueda" @input="onBusquedaChange" type="text" 
               placeholder="Buscar en descripción, entidad o usuario..."
               class="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm outline-none focus:border-red-600/50 text-slate-800 dark:text-white transition-all" />
      </div>

      <!-- Filtros de módulo/acción + fechas -->
      <div class="flex flex-wrap items-center gap-4">
        <!-- Módulo -->
        <div class="flex items-center gap-2">
          <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest hidden sm:block">Módulo:</span>
          <div class="flex gap-1 flex-wrap">
            <button v-for="(cfg, key) in moduloConfig" :key="key"
                    @click="filtroModulo = filtroModulo === key ? '' : (key as string)"
                    :class="[filtroModulo === key ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md' : 'bg-slate-100 dark:bg-white/5 text-slate-500 hover:bg-slate-200']"
                    class="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[8px] sm:text-[9px] font-black uppercase transition-all">
              {{ cfg.label }}
            </button>
          </div>
        </div>

        <!-- Acción -->
        <div class="flex items-center gap-2">
          <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest hidden sm:block">Acción:</span>
          <div class="flex gap-1 flex-wrap">
            <button v-for="(cfg, key) in accionConfig" :key="key"
                    @click="filtroAccion = filtroAccion === key ? '' : (key as string)"
                    :class="[filtroAccion === key ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md' : 'bg-slate-100 dark:bg-white/5 text-slate-500 hover:bg-slate-200']"
                    class="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[8px] sm:text-[9px] font-black uppercase transition-all">
              {{ cfg.label }}
            </button>
          </div>
        </div>

        <!-- Fechas -->
        <div class="flex items-center gap-2">
          <input v-model="fechaDesde" type="date" title="Desde"
                 class="px-2 py-1.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-[10px] text-slate-600 dark:text-white outline-none" />
          <span class="text-slate-400 text-xs">→</span>
          <input v-model="fechaHasta" type="date" title="Hasta"
                 class="px-2 py-1.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-[10px] text-slate-600 dark:text-white outline-none" />
        </div>

        <!-- Limpiar -->
        <button v-if="filtroModulo || filtroAccion || busqueda || fechaDesde || fechaHasta" 
                @click="limpiarFiltros"
                class="px-3 py-1.5 text-[9px] font-black uppercase rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-all border border-red-100">
          Limpiar
        </button>
      </div>
    </div>

    <!-- LOADING -->
    <div v-if="historialStore.loading" class="py-20 flex justify-center">
      <div class="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
    </div>

    <!-- EMPTY STATE -->
    <div v-else-if="historialStore.registros.length === 0" class="py-20 flex flex-col items-center text-slate-300">
      <span class="material-symbols-outlined text-6xl mb-2 opacity-20">history_edu</span>
      <p class="text-xs font-black uppercase tracking-widest italic">No hay cambios registrados</p>
    </div>

    <!-- REGISTROS -->
    <div v-else class="space-y-3">
      <div v-for="log in historialStore.registros" :key="log.id"
           @click="toggleExpand(log.id)"
           class="bg-white dark:bg-[#13131f] border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm hover:border-red-600/20 transition-all cursor-pointer group">
        
        <!-- Row principal -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5">
          <div class="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
            <!-- Ícono módulo -->
            <div :class="[moduloConfig[log.modulo]?.color, moduloConfig[log.modulo]?.bg]" 
                 class="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0 border border-current/10">
              <span class="material-symbols-outlined text-[20px] sm:text-[22px]">{{ moduloConfig[log.modulo]?.icon || 'help' }}</span>
            </div>
            
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap mb-1">
                <span :class="[accionConfig[log.accion]?.color, accionConfig[log.accion]?.bg]"
                      class="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest">
                  {{ accionConfig[log.accion]?.label || log.accion }}
                </span>
                <span class="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{{ log.usuario }}</span>
              </div>
              <p class="text-xs sm:text-sm font-bold text-slate-800 dark:text-white truncate">{{ log.descripcion }}</p>
              <p v-if="log.entidad_nombre" class="text-[10px] font-bold text-red-500 dark:text-red-400 italic truncate">{{ log.entidad_nombre }}</p>
            </div>
          </div>

          <!-- Fecha + chevron -->
          <div class="flex items-center gap-3 shrink-0">
            <div class="text-right hidden sm:block">
              <p class="text-[10px] font-black text-slate-400 uppercase">{{ formatFecha(log.fecha_creacion) }}</p>
              <p class="text-[9px] font-bold text-slate-300">{{ formatHora(log.fecha_creacion) }}</p>
            </div>
            <span class="material-symbols-outlined text-slate-300 text-[18px] transition-transform"
                  :class="expandedId === log.id ? 'rotate-180' : ''">
              expand_more
            </span>
          </div>
        </div>

        <!-- Detalle expandible -->
        <div v-if="expandedId === log.id" 
             class="border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/2 p-4 sm:p-5 space-y-4 animate-in slide-in-from-top duration-200">
          
          <!-- Info general -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div class="bg-white dark:bg-[#13131f] rounded-xl p-3 border border-slate-100 dark:border-white/5">
              <p class="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Módulo</p>
              <p class="text-xs font-bold text-slate-800 dark:text-white">{{ moduloConfig[log.modulo]?.label || log.modulo }}</p>
            </div>
            <div class="bg-white dark:bg-[#13131f] rounded-xl p-3 border border-slate-100 dark:border-white/5">
              <p class="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Realizado por</p>
              <p class="text-xs font-bold text-slate-800 dark:text-white">{{ log.usuario }}</p>
            </div>
            <div class="bg-white dark:bg-[#13131f] rounded-xl p-3 border border-slate-100 dark:border-white/5">
              <p class="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Fecha y Hora</p>
              <p class="text-xs font-bold text-slate-800 dark:text-white">{{ formatFechaCompleta(log.fecha_creacion) }}</p>
              <p class="text-[10px] text-slate-500">{{ formatHora(log.fecha_creacion) }}</p>
            </div>
            <div class="bg-white dark:bg-[#13131f] rounded-xl p-3 border border-slate-100 dark:border-white/5">
              <p class="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">ID Entidad</p>
              <p class="text-xs font-bold text-slate-800 dark:text-white">{{ log.entidad_id || '—' }}</p>
            </div>
          </div>

          <!-- Cambios realizados -->
          <div v-if="log.cambios && log.cambios.length > 0">
            <p class="text-[9px] font-black text-red-600 uppercase tracking-widest mb-3">Detalle de cambios:</p>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div v-for="cambio in log.cambios" :key="cambio.campo" 
                   class="bg-white dark:bg-[#13131f] rounded-xl p-3 border border-slate-100 dark:border-white/5">
                <p class="text-[8px] font-black text-red-600 uppercase mb-2">{{ cambio.campo }}</p>
                <div class="flex items-center justify-between gap-3">
                  <div class="flex-1 min-w-0">
                    <p class="text-[7px] text-slate-400 uppercase font-black mb-0.5">Anterior</p>
                    <p class="text-[10px] font-bold text-slate-500 line-through decoration-red-500/50 truncate">{{ cambio.antes || '(vacío)' }}</p>
                  </div>
                  <span class="material-symbols-outlined text-slate-300 text-[14px] shrink-0">trending_flat</span>
                  <div class="flex-1 min-w-0">
                    <p class="text-[7px] text-emerald-500 uppercase font-black mb-0.5">Nuevo</p>
                    <p class="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 truncate">{{ cambio.despues || '(vacío)' }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Acciones -->
          <div class="flex justify-end">
            <button @click.stop="historialStore.eliminarRegistro(log.id)"
                    class="text-[9px] font-black text-slate-400 hover:text-red-600 uppercase tracking-widest transition-colors flex items-center gap-1">
              <span class="material-symbols-outlined text-[14px]">delete</span>
              Eliminar registro
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- PAGINACIÓN -->
    <div v-if="historialStore.totalPages > 1" 
         class="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-[#13131f] border border-slate-200 dark:border-white/5 rounded-2xl p-4 shadow-sm">
      <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
        Mostrando {{ ((historialStore.page - 1) * historialStore.limit) + 1 }}–{{ Math.min(historialStore.page * historialStore.limit, historialStore.total) }} de {{ historialStore.total }}
      </p>
      <div class="flex items-center gap-1">
        <button @click="cambiarPagina(-1)" :disabled="historialStore.page <= 1"
                class="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-all disabled:opacity-30">
          <span class="material-symbols-outlined text-[18px] text-slate-500">chevron_left</span>
        </button>
        <button v-for="p in paginasVisibles" :key="p" @click="irAPagina(p)"
                :class="p === historialStore.page ? 'bg-red-600 text-white shadow-md' : 'bg-slate-100 dark:bg-white/5 text-slate-500 hover:bg-slate-200'"
                class="w-8 h-8 rounded-lg text-[10px] font-black transition-all">
          {{ p }}
        </button>
        <button @click="cambiarPagina(1)" :disabled="historialStore.page >= historialStore.totalPages"
                class="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-all disabled:opacity-30">
          <span class="material-symbols-outlined text-[18px] text-slate-500">chevron_right</span>
        </button>
      </div>
    </div>

  </div>
</template>
