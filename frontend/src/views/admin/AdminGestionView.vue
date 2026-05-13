<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useAdminHistorialStore } from '@/stores/adminHistorial';
import api, { getImageUrl } from '@/services/api';
import Swal from 'sweetalert2';

const historialStore = useAdminHistorialStore();

// ─── Estado Global ─────────────────────────────────────────
const tabActivo = ref<'eventos' | 'actividades' | 'solicitudes'>('eventos');
const isLoading = ref(false);
const filtroTexto = ref('');
const filtroEstado = ref('');

// ─── Eventos ───────────────────────────────────────────────
const eventos = ref<any[]>([]);
const showModalEvento = ref(false);
const isEditingEvento = ref(false);
const editEventoId = ref<number | null>(null);
const previewImg = ref<string | null>(null);
const imagenFile = ref<File | null>(null);

const formEvento = ref({
  nombre: '', descripcion: '', gestion: new Date().getFullYear().toString(),
  version: '', fecha_inicio: '', fecha_fin: '', ubicacion: '', direccion: '',
  estado: 2, google_maps_link: '', sobre_evento_1: '', sobre_evento_2: '',
  frase_destacada: '', cronograma: '',
});

const estadoEventoConfig: Record<number, { label: string; color: string; bg: string }> = {
  0: { label: 'Concluido', color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-slate-800' },
  1: { label: 'Activo',    color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
  2: { label: 'Planificación', color: 'text-blue-700 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  3: { label: 'Borrador',  color: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30' },
};

const fetchEventos = async () => {
  try {
    isLoading.value = true;
    const res = await api.get('/eventos');
    eventos.value = res.data?.data || res.data || [];
  } catch (e) {
    console.error('Error fetching eventos:', e);
    eventos.value = [];
  } finally { isLoading.value = false; }
};

const eventosFiltrados = computed(() =>
  eventos.value.filter(e => {
    const texto = (e.nombre || '').toLowerCase().includes(filtroTexto.value.toLowerCase());
    const estado = filtroEstado.value === '' || String(e.estado) === filtroEstado.value;
    return texto && estado;
  })
);

const abrirCrearEvento = () => {
  isEditingEvento.value = false;
  editEventoId.value = null;
  previewImg.value = null;
  imagenFile.value = null;
  formEvento.value = {
    nombre: '', descripcion: '', gestion: new Date().getFullYear().toString(),
    version: '', fecha_inicio: '', fecha_fin: '', ubicacion: '', direccion: '',
    estado: 2, google_maps_link: '', sobre_evento_1: '', sobre_evento_2: '',
    frase_destacada: '', cronograma: '',
  };
  showModalEvento.value = true;
};

const abrirEditarEvento = (ev: any) => {
  isEditingEvento.value = true;
  editEventoId.value = ev.id;
  previewImg.value = getImageUrl('eventos', ev.imagen_fondo) || null;
  imagenFile.value = null;
  formEvento.value = {
    nombre: ev.nombre || ev.nombreCorto || '',
    descripcion: ev.descripcion || '',
    gestion: String(ev.gestion || new Date().getFullYear()),
    version: ev.version || '',
    fecha_inicio: ev.fecha_inicio?.substring(0, 10) || '',
    fecha_fin: ev.fecha_fin?.substring(0, 10) || '',
    ubicacion: ev.ubicacion || '',
    direccion: ev.direccion || '',
    estado: typeof ev.estado === 'number' ? ev.estado : 2,
    google_maps_link: ev.google_maps_link || '',
    sobre_evento_1: ev.sobre_evento_1 || '',
    sobre_evento_2: ev.sobre_evento_2 || '',
    frase_destacada: ev.frase_destacada || '',
    cronograma: typeof ev.cronograma === 'string' ? ev.cronograma : JSON.stringify(ev.cronograma || ''),
  };
  showModalEvento.value = true;
};

const onImagenChange = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (file) { imagenFile.value = file; previewImg.value = URL.createObjectURL(file); }
};

const guardarEvento = async () => {
  try {
    const fd = new FormData();
    Object.entries(formEvento.value).forEach(([k, v]) => { if (v !== null && v !== undefined) fd.append(k, String(v)); });
    if (imagenFile.value) { fd.append('imagen_fondo', imagenFile.value); fd.append('imagen_portada', imagenFile.value); }

    if (isEditingEvento.value && editEventoId.value) {
      await api.put(`/eventos/${editEventoId.value}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      historialStore.registrar('evento', 'editar', `Editó el evento: ${formEvento.value.nombre}`, { entidadId: String(editEventoId.value), entidadNombre: formEvento.value.nombre });
    } else {
      await api.post('/eventos', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      historialStore.registrar('evento', 'crear', `Creó el evento: ${formEvento.value.nombre}`, { entidadNombre: formEvento.value.nombre });
    }
    Swal.fire({ toast: true, icon: 'success', title: isEditingEvento.value ? 'Evento actualizado' : 'Evento creado', timer: 2500, showConfirmButton: false, position: 'top-end' });
    showModalEvento.value = false;
    fetchEventos();
  } catch (e: any) {
    Swal.fire('Error', e.response?.data?.message || 'No se pudo guardar el evento', 'error');
  }
};

const confirmarEliminarEvento = async (ev: any) => {
  const { isConfirmed } = await Swal.fire({
    title: '¿Inhabilitar evento?',
    html: `<p>El evento <strong>"${ev.nombre}"</strong> quedará inhabilitado.<br><small>Los datos no se eliminarán de la base de datos.</small></p>`,
    icon: 'warning', showCancelButton: true,
    confirmButtonColor: '#dc2626', cancelButtonText: 'Cancelar', confirmButtonText: 'Sí, inhabilitar',
  });
  if (!isConfirmed) return;
  try {
    await api.patch(`/eventos/${ev.id}`, { estado: 0 });
    historialStore.registrar('evento', 'eliminar', `Inhabilitó el evento: ${ev.nombre}`, { entidadId: String(ev.id), entidadNombre: ev.nombre });
    Swal.fire({ toast: true, icon: 'info', title: 'Evento inhabilitado', timer: 2000, showConfirmButton: false, position: 'top-end' });
    fetchEventos();
  } catch { Swal.fire('Error', 'No se pudo inhabilitar', 'error'); }
};

// ─── Actividades ───────────────────────────────────────────
const actividades = ref<any[]>([]);
const showModalAct = ref(false);
const isEditingAct = ref(false);
const editActId = ref<number | null>(null);

const formActividad = ref({
  nombre: '', descripcion: '', tipo: 'Curso', fecha_inicio: '',
  fecha_fin: '', horas: '', id_evento: '' as string | number,
  imagen: '',
});

const tiposActividad = ['Curso', 'Taller', 'Conferencia', 'Seminario', 'Diplomado', 'Workshop'];

const fetchActividades = async () => {
  try {
    isLoading.value = true;
    const res = await api.get('/actividades-academicas');
    actividades.value = Array.isArray(res.data) ? res.data : res.data?.data || [];
  } catch { actividades.value = []; }
  finally { isLoading.value = false; }
};

const actividadesFiltradas = computed(() =>
  actividades.value.filter(a =>
    (a.nombre || '').toLowerCase().includes(filtroTexto.value.toLowerCase())
  )
);

const abrirCrearActividad = () => {
  isEditingAct.value = false;
  editActId.value = null;
  formActividad.value = { nombre: '', descripcion: '', tipo: 'Curso', fecha_inicio: '', fecha_fin: '', horas: '', id_evento: '', imagen: '' };
  showModalAct.value = true;
};

const abrirEditarActividad = async (act: any) => {
  try {
    const res = await api.get(`/actividades-academicas/${act.id}`);
    const full = res.data;
    isEditingAct.value = true;
    editActId.value = act.id;
    formActividad.value = {
      nombre: full.nombre || '',
      descripcion: full.descripcion || '',
      tipo: full.tipo || 'Curso',
      fecha_inicio: full.fecha_inicio?.substring(0, 10) || '',
      fecha_fin: full.fecha_fin?.substring(0, 10) || '',
      horas: String(full.horas || ''),
      id_evento: full.evento?.id || '',
      imagen: full.imagen || '',
    };
    showModalAct.value = true;
  } catch { Swal.fire('Error', 'No se pudieron cargar los datos', 'error'); }
};

const guardarActividad = async () => {
  try {
    const payload = {
      ...formActividad.value,
      horas: Number(formActividad.value.horas) || undefined,
      id_evento: Number(formActividad.value.id_evento),
    };

    if (isEditingAct.value && editActId.value) {
      await api.put(`/actividades-academicas/${editActId.value}`, payload);
      historialStore.registrar('actividad', 'editar', `Editó la actividad: ${formActividad.value.nombre}`, { entidadId: String(editActId.value), entidadNombre: formActividad.value.nombre });
    } else {
      await api.post('/actividades-academicas', payload);
      historialStore.registrar('actividad', 'crear', `Creó la actividad: ${formActividad.value.nombre}`, { entidadNombre: formActividad.value.nombre });
    }
    Swal.fire({ toast: true, icon: 'success', title: isEditingAct.value ? 'Actividad actualizada' : 'Actividad creada', timer: 2500, showConfirmButton: false, position: 'top-end' });
    showModalAct.value = false;
    fetchActividades();
  } catch (e: any) {
    Swal.fire('Error', e.response?.data?.message || 'No se pudo guardar la actividad', 'error');
  }
};

const confirmarEliminarActividad = async (act: any) => {
  const { isConfirmed } = await Swal.fire({
    title: '¿Eliminar actividad?',
    html: `<p>La actividad <strong>"${act.nombre}"</strong> será eliminada.<br><small>Los inscritos podrían verse afectados.</small></p>`,
    icon: 'warning', showCancelButton: true,
    confirmButtonColor: '#dc2626', cancelButtonText: 'Cancelar', confirmButtonText: 'Sí, eliminar',
  });
  if (!isConfirmed) return;
  try {
    await api.delete(`/actividades-academicas/${act.id}`);
    historialStore.registrar('actividad', 'eliminar', `Eliminó la actividad: ${act.nombre}`, { entidadId: String(act.id), entidadNombre: act.nombre });
    Swal.fire({ toast: true, icon: 'info', title: 'Actividad eliminada', timer: 2000, showConfirmButton: false, position: 'top-end' });
    fetchActividades();
  } catch { Swal.fire('Error', 'No se pudo eliminar', 'error'); }
};

// ─── Solicitudes de Activación ────────────────────────────
const solicitudes = ref<any[]>([]);

const fetchSolicitudes = async () => {
  try {
    isLoading.value = true;
    const res = await api.get('/actividades-academicas/solicitudes/pendientes');
    solicitudes.value = res.data || [];
  } catch (e) {
    console.error('Error fetching solicitudes:', e);
    solicitudes.value = [];
  } finally {
    isLoading.value = false;
  }
};

const aprobarSolicitud = async (sol: any) => {
  const { isConfirmed } = await Swal.fire({
    title: '¿Aprobar Reactivación?',
    text: `¿Estás seguro de reactivar la actividad "${sol.nombre}"?`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#10b981',
    confirmButtonText: 'Sí, reactivar'
  });

  if (!isConfirmed) return;

  try {
    await api.patch(`/actividades-academicas/${sol.id}/activar`);
    Swal.fire('Activada', 'La actividad ha sido reactivada correctamente.', 'success');
    fetchSolicitudes();
  } catch (e: any) {
    Swal.fire('Error', e.response?.data?.message || 'No se pudo activar la actividad.', 'error');
  }
};

onMounted(() => { 
  fetchEventos(); 
  fetchActividades(); 
  fetchSolicitudes();
});
</script>

<template>
  <div class="space-y-6 animate-in fade-in duration-500">

    <!-- HEADER -->
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div>
        <p class="text-[10px] font-black text-red-600 dark:text-red-500 uppercase tracking-widest mb-1">Panel Unificado</p>
        <h1 class="text-2xl font-black text-slate-800 dark:text-white uppercase italic tracking-tight">Gestión Académica</h1>
        <p class="text-slate-500 text-sm mt-1">Administra eventos y actividades desde un solo lugar</p>
      </div>

      <div class="flex items-center gap-3">
        <!-- Barra de Tabs -->
        <div class="flex bg-slate-100 dark:bg-white/5 p-1 rounded-xl border border-slate-200 dark:border-white/10">
          <button @click="tabActivo = 'eventos'; filtroTexto = ''; filtroEstado = ''"
                  :class="tabActivo === 'eventos' ? 'bg-white dark:bg-red-600 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'"
                  class="flex items-center gap-2 px-5 py-2.5 rounded-lg text-[10px] font-black uppercase transition-all">
            <span class="material-symbols-outlined text-[16px]">corporate_fare</span>
            Eventos
          </button>
          <button @click="tabActivo = 'actividades'; filtroTexto = ''; filtroEstado = ''"
                  :class="tabActivo === 'actividades' ? 'bg-white dark:bg-amber-600 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'"
                  class="flex items-center gap-2 px-5 py-2.5 rounded-lg text-[10px] font-black uppercase transition-all">
            <span class="material-symbols-outlined text-[16px]">school</span>
            Actividades
          </button>
          <button @click="tabActivo = 'solicitudes'; filtroTexto = ''; filtroEstado = ''"
                  :class="tabActivo === 'solicitudes' ? 'bg-white dark:bg-emerald-600 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'"
                  class="flex items-center gap-2 px-5 py-2.5 rounded-lg text-[10px] font-black uppercase transition-all">
            <span class="material-symbols-outlined text-[16px]">notification_important</span>
            Solicitudes
            <span v-if="solicitudes.length > 0" class="flex h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
          </button>
        </div>

        <!-- Botón de acción -->
        <button v-if="tabActivo === 'eventos'" @click="abrirCrearEvento()"
                class="flex items-center gap-2 px-5 py-3 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase shadow-lg shadow-red-600/20 hover:bg-red-700 transition-all group">
          <span class="material-symbols-outlined text-[16px] group-hover:rotate-90 transition-transform">add</span>
          Nuevo Evento
        </button>
        <button v-else-if="tabActivo === 'actividades'" @click="abrirCrearActividad()"
                class="flex items-center gap-2 px-5 py-3 bg-amber-500 text-white rounded-xl text-[10px] font-black uppercase shadow-lg shadow-amber-500/20 hover:bg-amber-600 transition-all group">
          <span class="material-symbols-outlined text-[16px] group-hover:rotate-90 transition-transform">add</span>
          Nueva Actividad
        </button>
        <button v-else @click="fetchSolicitudes()"
                class="flex items-center gap-2 px-5 py-3 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all group">
          <span class="material-symbols-outlined text-[16px]">refresh</span>
          Recargar
        </button>
      </div>
    </div>

    <!-- FILTROS -->
    <div class="bg-white dark:bg-[#13131f] border border-slate-200 dark:border-white/5 rounded-2xl p-4 shadow-sm">
      <div class="flex flex-wrap gap-3 items-center">
        <div class="flex-1 min-w-[200px] relative">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-[18px]">search</span>
          <input v-model="filtroTexto" type="text" :placeholder="`Buscar ${tabActivo === 'eventos' ? 'evento' : 'actividad'}...`"
                 class="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm outline-none focus:border-red-600/50 text-slate-800 dark:text-white transition-all" />
        </div>
        <template v-if="tabActivo === 'eventos'">
          <div class="flex gap-1.5 flex-wrap">
            <button v-for="(cfg, est) in estadoEventoConfig" :key="est"
                    @click="filtroEstado = filtroEstado === String(est) ? '' : String(est)"
                    :class="filtroEstado === String(est) ? 'bg-slate-800 dark:bg-white text-white dark:text-slate-900' : 'bg-slate-100 dark:bg-white/5 text-slate-500'"
                    class="px-3 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all">
              {{ cfg.label }}
            </button>
          </div>
        </template>
      </div>
    </div>

    <!-- TAB: EVENTOS -->
    <div v-if="tabActivo === 'eventos'">
      <div v-if="isLoading" class="py-20 flex justify-center">
        <div class="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
      <div v-else-if="eventosFiltrados.length === 0" class="py-20 flex flex-col items-center text-slate-400">
        <span class="material-symbols-outlined text-6xl mb-2 opacity-20">corporate_fare</span>
        <p class="text-xs font-black uppercase tracking-widest">No hay eventos que mostrar</p>
      </div>
      <div v-else class="bg-white dark:bg-[#13131f] border border-slate-200 dark:border-white/5 rounded-[2.5rem] overflow-hidden shadow-sm">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-slate-50 dark:bg-white/5">
              <tr class="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th class="px-6 py-4 text-left">Evento</th>
                <th class="px-6 py-4 text-left">Gestión</th>
                <th class="px-6 py-4 text-left">Fechas</th>
                <th class="px-6 py-4 text-left">Ubicación</th>
                <th class="px-6 py-4 text-center">Estado</th>
                <th class="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-white/5">
              <tr v-for="ev in eventosFiltrados" :key="ev.id"
                  class="hover:bg-slate-50 dark:hover:bg-white/3 transition-colors group">
                <td class="px-6 py-4">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl overflow-hidden bg-red-100 dark:bg-red-900/20 shrink-0 border border-red-200 dark:border-red-900/30">
                      <img v-if="ev.imagen_fondo" :src="getImageUrl('eventos', ev.imagen_fondo)" class="w-full h-full object-cover" />
                      <div v-else class="w-full h-full flex items-center justify-center">
                        <span class="material-symbols-outlined text-red-600 text-[18px]">corporate_fare</span>
                      </div>
                    </div>
                    <div>
                      <p class="text-sm font-black text-slate-800 dark:text-white">{{ ev.nombre }}</p>
                      <p v-if="ev.version" class="text-[10px] text-red-500 font-bold uppercase italic">{{ ev.version }}</p>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4">
                  <span class="text-sm font-black text-slate-700 dark:text-slate-300">{{ ev.gestion || '—' }}</span>
                </td>
                <td class="px-6 py-4">
                  <p class="text-[10px] font-bold text-slate-500">
                    {{ ev.fecha_inicio?.substring(0, 10) || '—' }}
                    <span v-if="ev.fecha_fin"> → {{ ev.fecha_fin?.substring(0, 10) }}</span>
                  </p>
                </td>
                <td class="px-6 py-4">
                  <p class="text-[10px] font-bold text-slate-500 truncate max-w-[150px]">{{ ev.ubicacion || '—' }}</p>
                </td>
                <td class="px-6 py-4 text-center">
                  <span :class="[estadoEventoConfig[ev.estado]?.color, estadoEventoConfig[ev.estado]?.bg]"
                        class="px-3 py-1 rounded-lg text-[9px] font-black uppercase border border-current/10">
                    {{ estadoEventoConfig[ev.estado]?.label || '—' }}
                  </span>
                </td>
                <td class="px-6 py-4 text-right">
                  <div class="flex justify-end items-center gap-1">
                    <button @click="abrirEditarEvento(ev)" title="Editar"
                            class="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-slate-400 hover:text-blue-600 transition-all">
                      <span class="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                    <button @click="confirmarEliminarEvento(ev)" title="Inhabilitar"
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
    </div>

    <!-- TAB: ACTIVIDADES -->
    <div v-else-if="tabActivo === 'actividades'">
      <div v-if="isLoading" class="py-20 flex justify-center">
        <div class="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
      <div v-else-if="actividadesFiltradas.length === 0" class="py-20 flex flex-col items-center text-slate-400">
        <span class="material-symbols-outlined text-6xl mb-2 opacity-20">school</span>
        <p class="text-xs font-black uppercase tracking-widest">No hay actividades que mostrar</p>
      </div>
      <div v-else class="bg-white dark:bg-[#13131f] border border-slate-200 dark:border-white/5 rounded-[2.5rem] overflow-hidden shadow-sm">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-slate-50 dark:bg-white/5">
              <tr class="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th class="px-6 py-4 text-left">Actividad</th>
                <th class="px-6 py-4 text-left">Evento Padre</th>
                <th class="px-6 py-4 text-left">Tipo</th>
                <th class="px-6 py-4 text-center">Horas</th>
                <th class="px-6 py-4 text-left">Fechas</th>
                <th class="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-white/5">
              <tr v-for="act in actividadesFiltradas" :key="act.id"
                  class="hover:bg-slate-50 dark:hover:bg-white/3 transition-colors group">
                <td class="px-6 py-4">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center border border-amber-200 dark:border-amber-900/30 shrink-0">
                      <span class="material-symbols-outlined text-amber-600 text-[18px]">school</span>
                    </div>
                    <div>
                      <p class="text-sm font-black text-slate-800 dark:text-white">{{ act.nombre }}</p>
                      <p class="text-[10px] text-slate-500 font-medium">{{ act.descripcion?.substring(0, 50) || '' }}</p>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4">
                  <span class="text-[10px] font-bold bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 px-2 py-1 rounded-lg border border-slate-200 dark:border-white/10">
                    {{ act.evento?.nombre || '—' }}
                  </span>
                </td>
                <td class="px-6 py-4">
                  <span class="text-[10px] font-black text-amber-700 dark:text-amber-400 uppercase">{{ act.tipo || '—' }}</span>
                </td>
                <td class="px-6 py-4 text-center">
                  <span class="text-sm font-black text-slate-700 dark:text-slate-300">{{ act.horas ? `${act.horas}h` : '—' }}</span>
                </td>
                <td class="px-6 py-4">
                  <p class="text-[10px] font-bold text-slate-500">
                    {{ act.fecha_inicio?.substring(0, 10) || '—' }}
                    <span v-if="act.fecha_fin"> → {{ act.fecha_fin?.substring(0, 10) }}</span>
                  </p>
                </td>
                <td class="px-6 py-4 text-right">
                  <div class="flex justify-end items-center gap-1">
                    <router-link :to="{ name: 'admin-gestion-eventos-detalle', params: { id: act.id } }" title="Administrar Estudiantes y Notas"
                            class="p-2 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-slate-400 hover:text-emerald-600 transition-all">
                      <span class="material-symbols-outlined text-[18px]">manage_accounts</span>
                    </router-link>
                    <button @click="abrirEditarActividad(act)" title="Editar"
                            class="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-slate-400 hover:text-blue-600 transition-all">
                      <span class="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                    <button @click="confirmarEliminarActividad(act)" title="Eliminar"
                            class="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-600 transition-all">
                      <span class="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- TAB: SOLICITUDES -->
    <div v-else-if="tabActivo === 'solicitudes'">
      <div v-if="isLoading" class="py-20 flex justify-center">
        <div class="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
      <div v-else-if="solicitudes.length === 0" class="py-20 flex flex-col items-center text-slate-400">
        <span class="material-symbols-outlined text-6xl mb-2 opacity-20">notification_important</span>
        <p class="text-xs font-black uppercase tracking-widest">No hay solicitudes pendientes</p>
      </div>
      <div v-else class="bg-white dark:bg-[#13131f] border border-slate-200 dark:border-white/5 rounded-[2.5rem] overflow-hidden shadow-sm">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-slate-50 dark:bg-white/5">
              <tr class="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th class="px-6 py-4 text-left">Actividad</th>
                <th class="px-6 py-4 text-left">Evento</th>
                <th class="px-6 py-4 text-left">Motivo / Descripción</th>
                <th class="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-white/5">
              <tr v-for="sol in solicitudes" :key="sol.id"
                  class="hover:bg-slate-50 dark:hover:bg-white/3 transition-colors group">
                <td class="px-6 py-4">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center border border-emerald-200 dark:border-emerald-900/30 shrink-0">
                      <span class="material-symbols-outlined text-emerald-600 text-[18px]">school</span>
                    </div>
                    <div>
                      <p class="text-sm font-black text-slate-800 dark:text-white">{{ sol.nombre }}</p>
                      <p class="text-[9px] text-emerald-600 font-bold uppercase tracking-widest">{{ sol.tipo }}</p>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4">
                  <span class="text-xs font-bold text-slate-500">{{ sol.evento?.nombre || '—' }}</span>
                </td>
                <td class="px-6 py-4">
                  <p class="text-xs text-slate-600 dark:text-gray-400 max-w-md line-clamp-2">
                    {{ sol.descripcion?.replace('[SOLICITUD_ACTIVACION]', '').trim() || 'Sin motivo especificado' }}
                  </p>
                </td>
                <td class="px-6 py-4 text-right">
                  <button @click="aprobarSolicitud(sol)"
                          class="px-4 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase hover:bg-emerald-700 transition-all shadow-md shadow-emerald-600/20 flex items-center gap-2 ml-auto">
                    <span class="material-symbols-outlined text-[14px]">check_circle</span>
                    Aprobar Activación
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════ -->
    <!--  MODAL EVENTO                                  -->
    <!-- ══════════════════════════════════════════════ -->
    <Teleport to="body">
      <div v-if="showModalEvento" class="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
        <div class="bg-white dark:bg-[#0d0d14] w-full max-w-2xl rounded-[2.5rem] border border-slate-200 dark:border-white/10 shadow-2xl overflow-auto max-h-[92vh] animate-in zoom-in duration-300">
          <div class="p-8">
            <div class="flex justify-between items-center mb-8">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center">
                  <span class="material-symbols-outlined text-white text-[20px]">corporate_fare</span>
                </div>
                <h2 class="text-xl font-black text-slate-800 dark:text-white uppercase italic">
                  {{ isEditingEvento ? 'Editar Evento' : 'Nuevo Evento' }}
                </h2>
              </div>
              <button @click="showModalEvento = false" class="text-slate-400 hover:text-red-600 transition-colors">
                <span class="material-symbols-outlined text-[28px]">close</span>
              </button>
            </div>

            <div class="space-y-5">
              <!-- Imagen -->
              <div class="space-y-2">
                <label class="text-[10px] font-black text-slate-400 uppercase ml-2">Imagen de portada</label>
                <div class="relative w-full h-36 rounded-2xl overflow-hidden bg-slate-50 dark:bg-white/5 border-2 border-dashed border-slate-200 dark:border-white/10 hover:border-red-500/50 transition-all group cursor-pointer"
                     @click="($refs.imgInput as HTMLElement)?.click()">
                  <img v-if="previewImg" :src="previewImg" class="w-full h-full object-cover" />
                  <div v-else class="absolute inset-0 flex flex-col items-center justify-center">
                    <span class="material-symbols-outlined text-slate-400 text-4xl mb-1">add_photo_alternate</span>
                    <p class="text-[10px] font-black text-slate-400 uppercase">Clic para subir imagen</p>
                  </div>
                  <input ref="imgInput" type="file" accept="image/*" class="hidden" @change="onImagenChange" />
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="space-y-1">
                  <label class="text-[10px] font-black text-slate-400 uppercase ml-2">Nombre del Evento</label>
                  <input v-model="formEvento.nombre" type="text"
                         class="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm text-slate-800 dark:text-white outline-none focus:border-red-600/50 transition-all" />
                </div>
                <div class="space-y-1">
                  <label class="text-[10px] font-black text-slate-400 uppercase ml-2">Versión / Slogan</label>
                  <input v-model="formEvento.version" type="text" placeholder="Ej: 3ra Edición"
                         class="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm text-slate-800 dark:text-white outline-none focus:border-red-600/50 transition-all" />
                </div>
              </div>

              <div class="space-y-1">
                <label class="text-[10px] font-black text-slate-400 uppercase ml-2">Descripción General</label>
                <textarea v-model="formEvento.descripcion" rows="3"
                          class="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm text-slate-800 dark:text-white outline-none focus:border-red-600/50 transition-all resize-none"></textarea>
              </div>

              <div class="grid grid-cols-3 gap-4">
                <div class="space-y-1">
                  <label class="text-[10px] font-black text-slate-400 uppercase ml-2">Gestión</label>
                  <input v-model="formEvento.gestion" type="text" placeholder="2025"
                         class="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm text-slate-800 dark:text-white outline-none focus:border-red-600/50 transition-all" />
                </div>
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
                  <input v-model="formEvento.ubicacion" type="text" placeholder="Ciudad, País"
                         class="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm text-slate-800 dark:text-white outline-none focus:border-red-600/50 transition-all" />
                </div>
                <div class="space-y-1">
                  <label class="text-[10px] font-black text-slate-400 uppercase ml-2">Dirección</label>
                  <input v-model="formEvento.direccion" type="text" placeholder="Av. Principal 123"
                         class="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm text-slate-800 dark:text-white outline-none focus:border-red-600/50 transition-all" />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-1">
                  <label class="text-[10px] font-black text-slate-400 uppercase ml-2">Estado</label>
                  <select v-model="formEvento.estado"
                          class="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm text-slate-800 dark:text-white outline-none focus:border-red-600/50 font-bold">
                    <option v-for="(cfg, est) in estadoEventoConfig" :key="est" :value="Number(est)">{{ cfg.label }}</option>
                  </select>
                </div>
                <div class="space-y-1">
                  <label class="text-[10px] font-black text-slate-400 uppercase ml-2">Google Maps Link</label>
                  <input v-model="formEvento.google_maps_link" type="text"
                         class="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm text-slate-800 dark:text-white outline-none focus:border-red-600/50 transition-all" />
                </div>
              </div>

              <div class="space-y-1">
                <label class="text-[10px] font-black text-slate-400 uppercase ml-2">Frase Destacada</label>
                <input v-model="formEvento.frase_destacada" type="text"
                       class="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm text-slate-800 dark:text-white outline-none focus:border-red-600/50 transition-all" />
              </div>
            </div>

            <div class="mt-8 flex gap-3">
              <button @click="showModalEvento = false"
                      class="flex-1 py-4 bg-slate-100 dark:bg-white/5 text-[10px] font-black text-slate-500 uppercase rounded-2xl hover:bg-slate-200 transition-all">Cancelar</button>
              <button @click="guardarEvento()"
                      class="flex-2 px-10 py-4 bg-red-600 text-[10px] font-black text-white uppercase rounded-2xl shadow-lg shadow-red-600/20 hover:bg-red-700 transition-all">
                {{ isEditingEvento ? 'Guardar Cambios' : 'Crear Evento' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ══════════════════════════════════════════════ -->
    <!--  MODAL ACTIVIDAD                               -->
    <!-- ══════════════════════════════════════════════ -->
    <Teleport to="body">
      <div v-if="showModalAct" class="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
        <div class="bg-white dark:bg-[#0d0d14] w-full max-w-xl rounded-[2.5rem] border border-slate-200 dark:border-white/10 shadow-2xl overflow-auto max-h-[92vh] animate-in zoom-in duration-300">
          <div class="p-8">
            <div class="flex justify-between items-center mb-8">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center">
                  <span class="material-symbols-outlined text-white text-[20px]">school</span>
                </div>
                <h2 class="text-xl font-black text-slate-800 dark:text-white uppercase italic">
                  {{ isEditingAct ? 'Editar Actividad' : 'Nueva Actividad' }}
                </h2>
              </div>
              <button @click="showModalAct = false" class="text-slate-400 hover:text-red-600 transition-colors">
                <span class="material-symbols-outlined text-[28px]">close</span>
              </button>
            </div>

            <div class="space-y-4">
              <div class="space-y-1">
                <label class="text-[10px] font-black text-slate-400 uppercase ml-2">Evento al que pertenece</label>
                <select v-model="formActividad.id_evento"
                        class="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm text-slate-800 dark:text-white outline-none focus:border-amber-500/50">
                  <option value="">Seleccionar evento padre...</option>
                  <option v-for="ev in eventos" :key="ev.id" :value="ev.id">{{ ev.nombre }}</option>
                </select>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-1 col-span-2">
                  <label class="text-[10px] font-black text-slate-400 uppercase ml-2">Nombre de la Actividad</label>
                  <input v-model="formActividad.nombre" type="text"
                         class="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm text-slate-800 dark:text-white outline-none focus:border-amber-500/50 transition-all" />
                </div>
                <div class="space-y-1">
                  <label class="text-[10px] font-black text-slate-400 uppercase ml-2">Tipo</label>
                  <select v-model="formActividad.tipo"
                          class="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm text-slate-800 dark:text-white outline-none focus:border-amber-500/50">
                    <option v-for="t in tiposActividad" :key="t" :value="t">{{ t }}</option>
                  </select>
                </div>
                <div class="space-y-1">
                  <label class="text-[10px] font-black text-slate-400 uppercase ml-2">Duración (horas)</label>
                  <input v-model="formActividad.horas" type="number" min="1"
                         class="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm text-slate-800 dark:text-white outline-none focus:border-amber-500/50 transition-all" />
                </div>
              </div>

              <div class="space-y-1">
                <label class="text-[10px] font-black text-slate-400 uppercase ml-2">Descripción</label>
                <textarea v-model="formActividad.descripcion" rows="3"
                          class="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm text-slate-800 dark:text-white outline-none focus:border-amber-500/50 resize-none transition-all"></textarea>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-1">
                  <label class="text-[10px] font-black text-slate-400 uppercase ml-2">Fecha Inicio</label>
                  <input v-model="formActividad.fecha_inicio" type="date"
                         class="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm text-slate-800 dark:text-white outline-none focus:border-amber-500/50 transition-all" />
                </div>
                <div class="space-y-1">
                  <label class="text-[10px] font-black text-slate-400 uppercase ml-2">Fecha Fin</label>
                  <input v-model="formActividad.fecha_fin" type="date"
                         class="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm text-slate-800 dark:text-white outline-none focus:border-amber-500/50 transition-all" />
                </div>
              </div>
            </div>

            <div class="mt-8 flex gap-3">
              <button @click="showModalAct = false"
                      class="flex-1 py-4 bg-slate-100 dark:bg-white/5 text-[10px] font-black text-slate-500 uppercase rounded-2xl hover:bg-slate-200 transition-all">Cancelar</button>
              <button @click="guardarActividad()"
                      class="flex-2 px-10 py-4 bg-amber-500 text-[10px] font-black text-white uppercase rounded-2xl shadow-lg shadow-amber-500/20 hover:bg-amber-600 transition-all">
                {{ isEditingAct ? 'Guardar Cambios' : 'Crear Actividad' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

  </div>
</template>
