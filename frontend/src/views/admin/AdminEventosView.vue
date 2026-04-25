<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useAdminHistorialStore } from '@/stores/adminHistorial';
import api from '@/services/api';
import Swal from 'sweetalert2';

const historialStore = useAdminHistorialStore();

// --- Estado ---
const eventos = ref<any[]>([]);
const isLoading = ref(true);
const filtroTexto = ref('');
const filtroEstado = ref('');
const showModal = ref(false);
const isEditing = ref(false);
const editId = ref<number | null>(null);

const formEvento = ref({
  nombre: '',
  descripcion: '',
  gestion: new Date().getFullYear().toString(),
  fecha_inicio: '',
  fecha_fin: '',
  ubicacion: '',
  direccion: '',
  estado: 2,
});

const estadoConfig: Record<number, { label: string; color: string; bg: string }> = {
  0: { label: 'Concluido', color: 'text-slate-600', bg: 'bg-slate-100' },
  1: { label: 'Activo', color: 'text-emerald-700', bg: 'bg-emerald-100' },
  2: { label: 'Planificación', color: 'text-blue-700', bg: 'bg-blue-100' },
  3: { label: 'Borrador', color: 'text-amber-700', bg: 'bg-amber-100' },
};

// --- Fetch ---
const fetchEventos = async () => {
  try {
    isLoading.value = true;
    const res = await api.get('/eventos');
    eventos.value = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
  } catch { eventos.value = []; }
  finally { isLoading.value = false; }
};

// --- Filtros ---
const eventosFiltrados = computed(() => {
  return eventos.value.filter(e => {
    const coincideTexto = (e.nombre || '').toLowerCase().includes(filtroTexto.value.toLowerCase());
    const coincideEstado = filtroEstado.value === '' || String(e.estado) === filtroEstado.value;
    return coincideTexto && coincideEstado;
  });
});

// --- Abrir Modal ---
const abrirCrear = () => {
  isEditing.value = false;
  editId.value = null;
  formEvento.value = { nombre: '', descripcion: '', gestion: new Date().getFullYear().toString(), fecha_inicio: '', fecha_fin: '', ubicacion: '', direccion: '', estado: 2 };
  showModal.value = true;
};

const abrirEditar = (evento: any) => {
  isEditing.value = true;
  editId.value = evento.id;
  formEvento.value = {
    nombre: evento.nombre || '',
    descripcion: evento.descripcion || '',
    gestion: evento.gestion || new Date().getFullYear().toString(),
    fecha_inicio: evento.fecha_inicio?.substring(0, 10) || '',
    fecha_fin: evento.fecha_fin?.substring(0, 10) || '',
    ubicacion: evento.ubicacion || '',
    direccion: evento.direccion || '',
    estado: evento.estado ?? 2,
  };
  showModal.value = true;
};

// --- Guardar ---
const guardar = async () => {
  try {
    if (isEditing.value && editId.value) {
      await api.patch(`/eventos/${editId.value}`, formEvento.value);
      historialStore.registrar('evento', 'editar', `Editó el evento: ${formEvento.value.nombre}`, { entidadId: String(editId.value), entidadNombre: formEvento.value.nombre });
      Swal.fire({ toast: true, icon: 'success', title: 'Evento actualizado', timer: 2000, showConfirmButton: false, position: 'top-end' });
    } else {
      const res = await api.post('/eventos', formEvento.value);
      historialStore.registrar('evento', 'crear', `Creó el evento: ${formEvento.value.nombre}`, { entidadNombre: formEvento.value.nombre });
      Swal.fire({ toast: true, icon: 'success', title: 'Evento creado', timer: 2000, showConfirmButton: false, position: 'top-end' });
    }
    showModal.value = false;
    fetchEventos();
  } catch (e: any) {
    Swal.fire('Error', e.response?.data?.message || 'No se pudo guardar', 'error');
  }
};

// --- Inhabilitar (Soft Delete) ---
const inhabilitarEvento = async (evento: any) => {
  const { isConfirmed } = await Swal.fire({
    title: '¿Inhabilitar evento?',
    html: `<p class="text-slate-600 text-sm">El evento <strong>${evento.nombre}</strong> quedará inactivo pero no se eliminará de la base de datos.</p>`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc2626',
    cancelButtonText: 'Cancelar',
    confirmButtonText: 'Sí, inhabilitar',
  });
  if (!isConfirmed) return;

  try {
    await api.patch(`/eventos/${evento.id}/estado`, { activo: false });
    historialStore.registrar('evento', 'eliminar', `Inhabilitó el evento: ${evento.nombre}`, { entidadId: String(evento.id), entidadNombre: evento.nombre });
    Swal.fire({ toast: true, icon: 'info', title: 'Evento inhabilitado', timer: 2000, showConfirmButton: false, position: 'top-end' });
    fetchEventos();
  } catch {
    Swal.fire('Error', 'No se pudo inhabilitar el evento', 'error');
  }
};

onMounted(fetchEventos);
</script>

<template>
  <div class="space-y-8 animate-in fade-in duration-500">
    
    <!-- HEADER -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-3 mb-2">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-rose-800 flex items-center justify-center shadow-lg">
            <span class="material-symbols-outlined text-white text-[22px]">corporate_fare</span>
          </div>
          <div>
            <p class="text-[10px] font-black text-red-600 dark:text-red-500 uppercase tracking-widest leading-none">Módulo Independiente</p>
            <h1 class="text-2xl font-black text-slate-800 dark:text-white tracking-tight uppercase italic">Gestión de Eventos</h1>
          </div>
        </div>
        <p class="text-slate-500 text-sm ml-1">Control total de eventos del sistema · {{ eventosFiltrados.length }} registros</p>
      </div>

      <button @click="abrirCrear()"
              class="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-600/20 group">
        <span class="material-symbols-outlined text-[18px] group-hover:rotate-90 transition-transform">add</span>
        Nuevo Evento
      </button>
    </div>

    <!-- FILTROS -->
    <div class="bg-white dark:bg-[#13131f] border border-slate-200 dark:border-white/5 rounded-2xl p-4 shadow-sm">
      <div class="flex flex-wrap gap-4 items-center">
        <div class="flex-1 min-w-[220px] relative">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-[18px]">search</span>
          <input v-model="filtroTexto" type="text" placeholder="Buscar evento..."
                 class="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm outline-none focus:border-red-600/50 transition-all text-slate-800 dark:text-white" />
        </div>
        <div class="flex gap-2 flex-wrap">
          <button v-for="(cfg, estado) in estadoConfig" :key="estado"
                  @click="filtroEstado = filtroEstado === String(estado) ? '' : String(estado)"
                  :class="filtroEstado === String(estado) ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-slate-100 dark:bg-white/5 text-slate-500 hover:bg-slate-200'"
                  class="px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all">
            {{ cfg.label }}
          </button>
        </div>
      </div>
    </div>

    <!-- TABLA -->
    <div class="bg-white dark:bg-[#13131f] border border-slate-200 dark:border-white/5 rounded-[2.5rem] overflow-hidden shadow-sm">
      <div v-if="isLoading" class="py-20 flex justify-center">
        <div class="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
      <div v-else-if="eventosFiltrados.length === 0" class="py-20 flex flex-col items-center text-slate-400">
        <span class="material-symbols-outlined text-5xl mb-2 opacity-20">corporate_fare</span>
        <p class="text-xs font-black uppercase tracking-widest">No hay eventos</p>
      </div>
      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-slate-50 dark:bg-white/5">
            <tr class="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <th class="px-6 py-4 text-left">Evento</th>
              <th class="px-6 py-4 text-left">Gestión</th>
              <th class="px-6 py-4 text-left">Fechas</th>
              <th class="px-6 py-4 text-center">Estado</th>
              <th class="px-6 py-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-white/5">
            <tr v-for="evento in eventosFiltrados" :key="evento.id"
                class="hover:bg-slate-50 dark:hover:bg-white/3 transition-colors group">
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/20 flex items-center justify-center shrink-0 border border-red-200 dark:border-red-900/30">
                    <span class="material-symbols-outlined text-red-600 text-[18px]">corporate_fare</span>
                  </div>
                  <div>
                    <p class="text-sm font-black text-slate-800 dark:text-white">{{ evento.nombre }}</p>
                    <p class="text-[10px] text-slate-500 font-medium truncate max-w-[200px]">{{ evento.ubicacion || 'Sin ubicación' }}</p>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4">
                <span class="text-sm font-black text-slate-700 dark:text-slate-300">{{ evento.gestion }}</span>
              </td>
              <td class="px-6 py-4">
                <p class="text-[10px] font-bold text-slate-500">
                  {{ evento.fecha_inicio?.substring(0, 10) || '—' }}
                  <span v-if="evento.fecha_fin"> → {{ evento.fecha_fin?.substring(0, 10) }}</span>
                </p>
              </td>
              <td class="px-6 py-4 text-center">
                <span :class="[estadoConfig[evento.estado]?.color, estadoConfig[evento.estado]?.bg]"
                      class="px-3 py-1 rounded-lg text-[9px] font-black uppercase">
                  {{ estadoConfig[evento.estado]?.label || 'Desconocido' }}
                </span>
              </td>
              <td class="px-6 py-4 text-right">
                <div class="flex items-center justify-end gap-1">
                  <button @click="abrirEditar(evento)" title="Editar"
                          class="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-slate-400 hover:text-blue-600 transition-all">
                    <span class="material-symbols-outlined text-[18px]">edit</span>
                  </button>
                  <button @click="inhabilitarEvento(evento)" title="Inhabilitar"
                          class="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-600 transition-all">
                    <span class="material-symbols-outlined text-[18px]">do_not_disturb_on</span>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- MODAL CREAR / EDITAR -->
    <Teleport to="body">
      <div v-if="showModal" class="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
        <div class="bg-white dark:bg-[#0d0d14] w-full max-w-xl rounded-[2.5rem] border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden animate-in zoom-in duration-300">
          <div class="p-8">
            <div class="flex justify-between items-center mb-8">
              <h2 class="text-xl font-black text-slate-800 dark:text-white uppercase italic">
                {{ isEditing ? 'Editar Evento' : 'Nuevo Evento' }}
              </h2>
              <button @click="showModal = false" class="text-slate-400 hover:text-red-600 transition-colors">
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>

            <div class="space-y-4">
              <div class="space-y-1">
                <label class="text-[10px] font-black text-slate-400 uppercase ml-2">Nombre del Evento</label>
                <input v-model="formEvento.nombre" type="text"
                       class="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm text-slate-800 dark:text-white outline-none focus:border-red-600/50 transition-all" />
              </div>

              <div class="space-y-1">
                <label class="text-[10px] font-black text-slate-400 uppercase ml-2">Descripción</label>
                <textarea v-model="formEvento.descripcion" rows="3"
                          class="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm text-slate-800 dark:text-white outline-none focus:border-red-600/50 transition-all resize-none"></textarea>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-1">
                  <label class="text-[10px] font-black text-slate-400 uppercase ml-2">Fecha Inicio</label>
                  <input v-model="formEvento.fecha_inicio" type="date"
                         class="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm text-slate-800 dark:text-white outline-none focus:border-red-600/50 transition-all" />
                </div>
                <div class="space-y-1">
                  <label class="text-[10px] font-black text-slate-400 uppercase ml-2">Fecha Fin</label>
                  <input v-model="formEvento.fecha_fin" type="date"
                         class="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm text-slate-800 dark:text-white outline-none focus:border-red-600/50 transition-all" />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-1">
                  <label class="text-[10px] font-black text-slate-400 uppercase ml-2">Ubicación</label>
                  <input v-model="formEvento.ubicacion" type="text"
                         class="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm text-slate-800 dark:text-white outline-none focus:border-red-600/50 transition-all" />
                </div>
                <div class="space-y-1">
                  <label class="text-[10px] font-black text-slate-400 uppercase ml-2">Estado</label>
                  <select v-model="formEvento.estado"
                          class="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm text-slate-800 dark:text-white outline-none focus:border-red-600/50 transition-all font-bold">
                    <option v-for="(cfg, est) in estadoConfig" :key="est" :value="Number(est)">{{ cfg.label }}</option>
                  </select>
                </div>
              </div>
            </div>

            <div class="mt-8 flex gap-3">
              <button @click="showModal = false"
                      class="flex-1 py-4 bg-slate-100 dark:bg-white/5 text-[10px] font-black text-slate-400 uppercase rounded-2xl hover:bg-slate-200 transition-all">
                Cancelar
              </button>
              <button @click="guardar()"
                      class="flex-1 py-4 bg-red-600 text-[10px] font-black text-white uppercase rounded-2xl shadow-lg shadow-red-600/20 hover:bg-red-700 transition-all">
                {{ isEditing ? 'Guardar Cambios' : 'Crear Evento' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
