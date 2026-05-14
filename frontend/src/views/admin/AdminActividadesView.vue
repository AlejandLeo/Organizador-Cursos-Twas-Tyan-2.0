<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useAdminHistorialStore } from '@/stores/adminHistorial';
import api from '@/services/api';
import Swal from 'sweetalert2';

const historialStore = useAdminHistorialStore();

// --- Estado ---
const actividades = ref<any[]>([]);
const eventos = ref<any[]>([]);
const isLoading = ref(true);
const filtroTexto = ref('');
const filtroEvento = ref('');
const showModal = ref(false);
const isEditing = ref(false);
const editId = ref<number | null>(null);

const formActividad = ref({
  nombre: '',
  descripcion: '',
  tipo: '',
  fecha_inicio: '',
  fecha_fin: '',
  numero_horas: '',
  modalidad: 'Presencial',
  cupos: '',
  evento_id: '',
});

const modalidades = ['Presencial', 'Virtual', 'Híbrida'];
const tiposActividad = ['Curso', 'Taller', 'Conferencia', 'Seminario', 'Simposio', 'Congreso'];

// --- Fetch ---
const fetchActividades = async () => {
  try {
    isLoading.value = true;
    const res = await api.get('/actividades-academicas');
    actividades.value = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
  } catch { actividades.value = []; }
  finally { isLoading.value = false; }
};

const fetchEventos = async () => {
  try {
    const res = await api.get('/admin/eventos/lista');
    eventos.value = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
  } catch { eventos.value = []; }
};

// --- Filtros ---
const actividadesFiltradas = computed(() => {
  return actividades.value.filter(a => {
    const coincideTexto = (a.nombre || '').toLowerCase().includes(filtroTexto.value.toLowerCase());
    const coincideEvento = !filtroEvento.value || String(a.evento?.id || a.evento_id) === filtroEvento.value;
    return coincideTexto && coincideEvento;
  });
});

// --- Modal ---
const abrirCrear = () => {
  isEditing.value = false;
  editId.value = null;
  formActividad.value = { nombre: '', descripcion: '', tipo: '', fecha_inicio: '', fecha_fin: '', numero_horas: '', modalidad: 'Presencial', cupos: '', evento_id: '' };
  showModal.value = true;
};

const abrirEditar = (actividad: any) => {
  isEditing.value = true;
  editId.value = actividad.id;
  formActividad.value = {
    nombre: actividad.nombre || '',
    descripcion: actividad.descripcion || '',
    tipo: actividad.tipo || '',
    fecha_inicio: actividad.fecha_inicio?.substring(0, 10) || '',
    fecha_fin: actividad.fecha_fin?.substring(0, 10) || '',
    numero_horas: String(actividad.numero_horas || ''),
    modalidad: actividad.modalidad || 'Presencial',
    cupos: String(actividad.cupos || ''),
    evento_id: String(actividad.evento?.id || actividad.evento_id || ''),
  };
  showModal.value = true;
};

// --- Guardar ---
const guardar = async () => {
  try {
    if (!formActividad.value.evento_id) {
        Swal.fire('Atención', 'Debes seleccionar un evento padre.', 'warning');
        return;
    }

    const payload = {
      nombre: formActividad.value.nombre,
      descripcion: formActividad.value.descripcion,
      tipo: formActividad.value.tipo,
      fecha_inicio: formActividad.value.fecha_inicio || null,
      fecha_fin: formActividad.value.fecha_fin || null,
      numero_horas: Number(formActividad.value.numero_horas) || 0,
      modalidad: formActividad.value.modalidad,
      cupos: Number(formActividad.value.cupos) || 0,
      id_evento: Number(formActividad.value.evento_id),
    };

    if (isEditing.value && editId.value) {
      await api.put(`/actividades-academicas/${editId.value}`, payload);
      historialStore.registrar('actividad', 'editar', `Editó actividad: ${payload.nombre}`, { entidadId: String(editId.value) });
      Swal.fire({ icon: 'success', title: 'Actualizado', text: 'Cambios guardados con éxito.', timer: 1500, showConfirmButton: false });
    } else {
      await api.post('/actividades-academicas', payload);
      historialStore.registrar('actividad', 'crear', `Creó actividad: ${payload.nombre}`);
      Swal.fire({ icon: 'success', title: 'Creado', text: 'Nueva actividad registrada.', timer: 1500, showConfirmButton: false });
    }
    showModal.value = false;
    fetchActividades();
  } catch (e: any) {
    Swal.fire('Error', e.response?.data?.message || 'No se pudo procesar la solicitud', 'error');
  }
};

// --- Inhabilitar (Soft Delete Estándar) ---
const inhabilitarActividad = async (actividad: any) => {
  const { value: motivo } = await Swal.fire({
    title: '¿Inhabilitar actividad?',
    text: `Indique el motivo para inactivar "${actividad.nombre}":`,
    input: 'textarea',
    inputPlaceholder: 'Motivo de la inhabilitación...',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    confirmButtonText: 'SÍ, INHABILITAR',
    cancelButtonText: 'CANCELAR',
    inputValidator: (value) => {
      if (!value) return '¡El motivo es obligatorio!'
    }
  });

  if (motivo) {
    try {
      await api.patch(`/actividades-academicas/${actividad.id}`, { 
          estado: -1,
          descripcion: `${actividad.descripcion}\n[INHABILITACION_MOTIVO]:${motivo}` 
      });
      historialStore.registrar('actividad', 'eliminar', `Inhabilitó: ${actividad.nombre}`, { entidadId: String(actividad.id) });
      Swal.fire('Inhabilitada', 'La actividad ya no será visible.', 'success');
      fetchActividades();
    } catch {
      Swal.fire('Error', 'No se pudo completar la acción.', 'error');
    }
  }
};

onMounted(() => {
  fetchActividades();
  fetchEventos();
});
</script>

<template>
  <div class="space-y-8 animate-in fade-in duration-500">
    
    <!-- HEADER -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-3 mb-2">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
            <span class="material-symbols-outlined text-white text-[22px]">school</span>
          </div>
          <div>
            <p class="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest leading-none">Módulo Independiente</p>
            <h1 class="text-2xl font-black text-slate-800 dark:text-white tracking-tight uppercase italic">Gestión de Actividades</h1>
          </div>
        </div>
        <p class="text-slate-500 text-sm ml-1">Control total de actividades académicas · {{ actividadesFiltradas.length }} registros</p>
      </div>

      <button @click="abrirCrear()"
              class="flex items-center gap-2 px-6 py-3 bg-amber-500 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20 group">
        <span class="material-symbols-outlined text-[18px] group-hover:rotate-90 transition-transform">add</span>
        Nueva Actividad
      </button>
    </div>

    <!-- FILTROS -->
    <div class="bg-white dark:bg-[#13131f] border border-slate-200 dark:border-white/5 rounded-2xl p-4 shadow-sm">
      <div class="flex flex-wrap gap-4 items-center">
        <div class="flex-1 min-w-[220px] relative">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-[18px]">search</span>
          <input v-model="filtroTexto" type="text" placeholder="Buscar actividad..."
                 class="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm outline-none focus:border-amber-500/50 transition-all text-slate-800 dark:text-white" />
        </div>
        <select v-model="filtroEvento"
                class="px-4 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 outline-none uppercase">
          <option value="">Todos los eventos</option>
          <option v-for="ev in eventos" :key="ev.id" :value="String(ev.id)">{{ ev.nombre }}</option>
        </select>
      </div>
    </div>

    <!-- TABLA -->
    <div class="bg-white dark:bg-[#13131f] border border-slate-200 dark:border-white/5 rounded-[2.5rem] overflow-hidden shadow-sm">
      <div v-if="isLoading" class="py-20 flex justify-center">
        <div class="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
      <div v-else-if="actividadesFiltradas.length === 0" class="py-20 flex flex-col items-center text-slate-400">
        <span class="material-symbols-outlined text-5xl mb-2 opacity-20">school</span>
        <p class="text-xs font-black uppercase tracking-widest">No hay actividades</p>
      </div>
      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-slate-50 dark:bg-white/5">
            <tr class="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <th class="px-6 py-4 text-left">Actividad</th>
              <th class="px-6 py-4 text-left">Evento</th>
              <th class="px-6 py-4 text-left">Tipo / Modalidad</th>
              <th class="px-6 py-4 text-center">Horas</th>
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
                    <p class="text-[10px] text-slate-400 font-medium">
                      {{ act.fecha_inicio?.substring(0, 10) || '—' }}
                      <span v-if="act.fecha_fin"> → {{ act.fecha_fin?.substring(0, 10) }}</span>
                    </p>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4">
                <span class="text-[10px] font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-white/5 px-2 py-1 rounded-lg border border-slate-200 dark:border-white/10">
                  {{ act.evento?.nombre || 'Sin evento' }}
                </span>
              </td>
              <td class="px-6 py-4">
                <div class="space-y-1">
                  <span class="block text-[10px] font-black text-amber-700 dark:text-amber-400 uppercase">{{ act.tipo || '—' }}</span>
                  <span class="text-[9px] font-bold text-slate-400 dark:text-slate-600 uppercase">{{ act.modalidad || '—' }}</span>
                </div>
              </td>
              <td class="px-6 py-4 text-center">
                <span class="text-sm font-black text-slate-700 dark:text-slate-300">{{ act.numero_horas || '—' }}h</span>
              </td>
              <td class="px-6 py-4 text-right">
                <div class="flex items-center justify-end gap-1">
                  <button @click="abrirEditar(act)" title="Editar"
                          class="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-slate-400 hover:text-blue-600 transition-all">
                    <span class="material-symbols-outlined text-[18px]">edit</span>
                  </button>
                  <button @click="inhabilitarActividad(act)" title="Inhabilitar"
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
        <div class="bg-white dark:bg-[#0d0d14] w-full max-w-xl rounded-[2.5rem] border border-slate-200 dark:border-white/10 shadow-2xl overflow-auto max-h-[90vh] animate-in zoom-in duration-300">
          <div class="p-8">
            <div class="flex justify-between items-center mb-8">
              <h2 class="text-xl font-black text-slate-800 dark:text-white uppercase italic">
                {{ isEditing ? 'Editar Actividad' : 'Nueva Actividad' }}
              </h2>
              <button @click="showModal = false" class="text-slate-400 hover:text-red-600 transition-colors">
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>

            <div class="space-y-4">
              <div class="space-y-1">
                <label class="text-[10px] font-black text-slate-400 uppercase ml-2">Evento Padre</label>
                <select v-model="formActividad.evento_id"
                        class="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm text-slate-800 dark:text-white outline-none focus:border-amber-500/50">
                  <option value="">Seleccionar evento...</option>
                  <option v-for="ev in eventos" :key="ev.id" :value="String(ev.id)">{{ ev.nombre }}</option>
                </select>
              </div>

              <div class="space-y-1">
                <label class="text-[10px] font-black text-slate-400 uppercase ml-2">Nombre de la Actividad</label>
                <input v-model="formActividad.nombre" type="text"
                       class="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm text-slate-800 dark:text-white outline-none focus:border-amber-500/50 transition-all" />
              </div>

              <div class="space-y-1">
                <label class="text-[10px] font-black text-slate-400 uppercase ml-2">Descripción</label>
                <textarea v-model="formActividad.descripcion" rows="2"
                          class="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm text-slate-800 dark:text-white outline-none focus:border-amber-500/50 resize-none"></textarea>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-1">
                  <label class="text-[10px] font-black text-slate-400 uppercase ml-2">Tipo</label>
                  <select v-model="formActividad.tipo"
                          class="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm text-slate-800 dark:text-white outline-none focus:border-amber-500/50">
                    <option value="">Seleccionar...</option>
                    <option v-for="t in tiposActividad" :key="t" :value="t">{{ t }}</option>
                  </select>
                </div>
                <div class="space-y-1">
                  <label class="text-[10px] font-black text-slate-400 uppercase ml-2">Modalidad</label>
                  <select v-model="formActividad.modalidad"
                          class="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm text-slate-800 dark:text-white outline-none focus:border-amber-500/50">
                    <option v-for="m in modalidades" :key="m" :value="m">{{ m }}</option>
                  </select>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-1">
                  <label class="text-[10px] font-black text-slate-400 uppercase ml-2">Fecha Inicio</label>
                  <input v-model="formActividad.fecha_inicio" type="date"
                         class="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm text-slate-800 dark:text-white outline-none focus:border-amber-500/50" />
                </div>
                <div class="space-y-1">
                  <label class="text-[10px] font-black text-slate-400 uppercase ml-2">Fecha Fin</label>
                  <input v-model="formActividad.fecha_fin" type="date"
                         class="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm text-slate-800 dark:text-white outline-none focus:border-amber-500/50" />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-1">
                  <label class="text-[10px] font-black text-slate-400 uppercase ml-2">Horas</label>
                  <input v-model="formActividad.numero_horas" type="number" min="1"
                         class="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm text-slate-800 dark:text-white outline-none focus:border-amber-500/50" />
                </div>
                <div class="space-y-1">
                  <label class="text-[10px] font-black text-slate-400 uppercase ml-2">Cupos</label>
                  <input v-model="formActividad.cupos" type="number" min="1"
                         class="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm text-slate-800 dark:text-white outline-none focus:border-amber-500/50" />
                </div>
              </div>
            </div>

            <div class="mt-8 flex gap-3">
              <button @click="showModal = false"
                      class="flex-1 py-4 bg-slate-100 dark:bg-white/5 text-[10px] font-black text-slate-400 uppercase rounded-2xl hover:bg-slate-200 transition-all">
                Cancelar
              </button>
              <button @click="guardar()"
                      class="flex-1 py-4 bg-amber-500 text-[10px] font-black text-white uppercase rounded-2xl shadow-lg shadow-amber-500/20 hover:bg-amber-600 transition-all">
                {{ isEditing ? 'Guardar Cambios' : 'Crear Actividad' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
