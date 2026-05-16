<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useAdminHistorialStore } from '@/stores/adminHistorial';
import { coordinacionesService } from '@/services/coordinaciones.service';
import { usuariosService } from '@/services/usuarios.service';
import api from '@/services/api';
import Swal from 'sweetalert2';

const authStore = useAuthStore();
const userRoles = computed(() => authStore.userRoles);
const historialStore = useAdminHistorialStore();

onMounted(() => {
  console.log('--- DEBUG ADMIN VIEW ---');
  console.log('User roles:', userRoles.value);
  console.log('Es Super Usuario:', authStore.esSuperUsuario);
});

// --- Gestión de Coordinadores ---
const showModalCoordinadores = ref(false);
const eventoParaCoordinadores = ref<any>(null);
const coordinadoresActuales = ref<any[]>([]);
const candidatosCoordinadores = ref<any[]>([]);
const cargandoCoordinadores = ref(false);
const queryCandidato = ref('');

const fetchCoordinadores = async (eventoId: number) => {
  try {
    cargandoCoordinadores.value = true;
    const res = await coordinacionesService.getByEvento(eventoId);
    coordinadoresActuales.value = res.data || [];
  } catch (err) {
    console.error('Error fetching coordinadores', err);
  } finally {
    cargandoCoordinadores.value = false;
  }
};

const fetchCandidatos = async () => {
  try {
    const res = await usuariosService.getAll({ soloActivos: 'true' });
    const allUsers = (res.data as any)?.data ?? res.data;
    candidatosCoordinadores.value = allUsers.filter((u: any) => {
      // Filtrar solo Coordinadores (2) y Logística (3)
      const roles = u.usuariosRoles?.map((ur: any) => ur.rol?.id) || [];
      const hasValidRole = roles.includes(2) || roles.includes(3);
      
      const isAlreadyAssigned = coordinadoresActuales.value.some(c => c.usuario?.id === u.id);
      return hasValidRole && !isAlreadyAssigned;
    });
  } catch (err) {
    console.error('Error fetching candidatos', err);
  }
};

const getRoleName = (u: any) => {
  const roles = u?.usuariosRoles?.map((ur: any) => ur.rol?.nombre_rol) || [];
  if (roles.includes('Coordinador')) return 'Coordinador';
  if (roles.includes('Logística')) return 'Logística';
  return roles[0] || 'Usuario';
};

const abrirCoordinadores = async (evento: any) => {
  eventoParaCoordinadores.value = evento;
  showModalCoordinadores.value = true;
  await fetchCoordinadores(evento.id);
  await fetchCandidatos();
};

const asignarCoordinador = async (usuario: any) => {
  try {
    await coordinacionesService.asignar(eventoParaCoordinadores.value.id, usuario.id);
    Swal.fire('¡Éxito!', `Se ha asignado a ${usuario.persona?.nombres} como responsable.`, 'success');
    await fetchCoordinadores(eventoParaCoordinadores.value.id);
    await fetchCandidatos();
  } catch (err) {
    Swal.fire('Error', 'No se pudo asignar.', 'error');
  }
};

const quitarCoordinador = async (coordinacion: any) => {
  const result = await Swal.fire({
    title: '¿Quitar responsable?',
    text: `¿Remover a ${coordinacion.usuario?.persona?.nombres}?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, quitar'
  });
  if (!result.isConfirmed) return;
  try {
    await coordinacionesService.quitar(coordinacion.id);
    await fetchCoordinadores(eventoParaCoordinadores.value.id);
    await fetchCandidatos();
  } catch (err) {
    Swal.fire('Error', 'No se pudo quitar.', 'error');
  }
};

const candidatosFiltrados = computed(() => {
  if (!queryCandidato.value) return candidatosCoordinadores.value;
  return candidatosCoordinadores.value.filter(u => 
    u.email.toLowerCase().includes(queryCandidato.value.toLowerCase()) ||
    u.persona?.nombres.toLowerCase().includes(queryCandidato.value.toLowerCase())
  );
});

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
  telefono: '',
  email: '',
  organizadores: '',
  logo: null as any,
  fase: 1
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
    const res = await api.get('/admin/eventos/lista?limit=1000');
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
  formEvento.value = { 
    nombre: '', 
    descripcion: '', 
    gestion: new Date().getFullYear().toString(), 
    fecha_inicio: '', 
    fecha_fin: '', 
    ubicacion: '', 
    direccion: '', 
    estado: 2,
    telefono: '',
    email: '',
    organizadores: '',
    logo: null,
    fase: 1
  };
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
    telefono: evento.telefono || '',
    email: evento.email || '',
    organizadores: evento.organizadores || '',
    logo: null,
    fase: evento.fase || 1
  };
  showModal.value = true;
};

// --- Guardar ---
const guardar = async () => {
  try {
    const formData = new FormData();
    Object.entries(formEvento.value).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        formData.append(key, value);
      }
    });

    if (isEditing.value && editId.value) {
      // Cambio de ruta: /admin/eventos/
      await api.put(`/admin/eventos/${editId.value}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      historialStore.registrar('evento', 'editar', `Editó el evento: ${formEvento.value.nombre}`, { entidadId: String(editId.value), entidadNombre: formEvento.value.nombre });
      Swal.fire({ toast: true, icon: 'success', title: 'Evento actualizado', timer: 2000, showConfirmButton: false, position: 'top-end' });
    } else {
      // Cambio de ruta: /admin/eventos
      await api.post('/admin/eventos', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
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
    // Cambio de ruta: /admin/eventos/
    await api.patch(`/admin/eventos/${evento.id}/estado`, { activo: false });
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
            <p class="text-[10px] font-black text-red-600 dark:text-red-500 uppercase tracking-widest leading-none">Módulo SGEA</p>
            <h1 class="text-2xl font-black text-slate-800 dark:text-white tracking-tight uppercase italic">Gestión de Eventos</h1>
          </div>
        </div>
        <p class="text-slate-500 text-sm ml-1">Control total de eventos del sistema SGEA · {{ eventosFiltrados.length }} registros</p>
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
                  <!-- Inscripción Masiva (Excel) -->
                  <button @click="$router.push({ name: 'admin-inscripciones-excel', query: { eventoId: evento.id } })"
                          title="Inscripción Masiva (Excel)"
                          class="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 hover:bg-emerald-100 transition-all border border-emerald-100 dark:border-emerald-800/30 shadow-sm">
                    <span class="material-symbols-outlined text-[20px]">grid_on</span>
                  </button>

                  <!-- Emitir Certificados -->
                  <button @click="$router.push({ name: 'admin-certificados-envio', query: { search: evento.nombre } })"
                          title="Emitir Certificados"
                          class="p-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 hover:bg-amber-100 transition-all border border-amber-100 dark:border-amber-800/30 shadow-sm">
                    <span class="material-symbols-outlined text-[20px]">verified_user</span>
                  </button>

                  <!-- Botón Gestión de Coordinadores -->
                  <button @click="abrirCoordinadores(evento)" 
                          title="Asignar Responsables (Coordinadores/Logística)"
                          class="p-2 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 hover:bg-red-100 transition-all border border-red-100 dark:border-red-800/30 shadow-sm">
                    <span class="material-symbols-outlined text-[20px]">group_add</span>
                  </button>
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

              <!-- NUEVOS CAMPOS AGREGADOS -->
              <div class="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-white/5 mt-2">
                <div class="space-y-1">
                  <label class="text-[10px] font-black text-red-600 uppercase ml-2">Teléfono de Contacto</label>
                  <input v-model="formEvento.telefono" type="text" placeholder="+591 ..."
                         class="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm text-slate-800 dark:text-white outline-none focus:border-red-600/50 transition-all" />
                </div>
                <div class="space-y-1">
                  <label class="text-[10px] font-black text-red-600 uppercase ml-2">Email de Contacto</label>
                  <input v-model="formEvento.email" type="email" placeholder="ejemplo@correo.com"
                         class="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm text-slate-800 dark:text-white outline-none focus:border-red-600/50 transition-all" />
                </div>
              </div>

              <div class="space-y-1">
                <label class="text-[10px] font-black text-red-600 uppercase ml-2">Dirección Exacta (Para el Footer)</label>
                <input v-model="formEvento.direccion" type="text" placeholder="Calle, Número, Edificio..."
                       class="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm text-slate-800 dark:text-white outline-none focus:border-red-600/50 transition-all" />
              </div>

              <div class="space-y-1">
                <label class="text-[10px] font-black text-red-600 uppercase ml-2">Organización y Auspicio (Lista de nombres)</label>
                <textarea v-model="formEvento.organizadores" rows="2" placeholder="TWAS, TYAN, UMSA, FCPN..."
                          class="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm text-slate-800 dark:text-white outline-none focus:border-red-600/50 transition-all resize-none"></textarea>
              </div>

              <div class="space-y-1">
                <label class="text-[10px] font-black text-red-600 uppercase ml-2">Logo del Evento (Imagen)</label>
                <input type="file" @change="(e: any) => formEvento.logo = e.target.files[0]" accept="image/*"
                       class="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-black file:uppercase file:bg-red-50 file:text-red-700 hover:file:bg-red-100 transition-all cursor-pointer" />
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

    <!-- MODAL: GESTIÓN DE COORDINADORES (Solo Super Usuario) -->
    <Teleport to="body">
      <div v-if="showModalCoordinadores" class="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md">
        <div class="bg-white dark:bg-[#0d0d14] w-full max-w-2xl rounded-[3rem] border border-white/10 shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 duration-500">
          
          <div class="p-10">
            <!-- Header Modal -->
            <div class="flex justify-between items-start mb-8">
              <div>
                <h2 class="text-2xl font-black text-slate-800 dark:text-white uppercase italic tracking-tight">Personal Responsable</h2>
                <p class="text-xs text-red-600 font-bold uppercase mt-1">Evento: {{ eventoParaCoordinadores?.nombre }}</p>
              </div>
              <button @click="showModalCoordinadores = false" class="p-2 rounded-full hover:bg-red-50 text-slate-400 hover:text-red-600 transition-all">
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              <!-- Columna 1: Lista Actual -->
              <div class="space-y-4">
                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-white/5 pb-2">Asignados Actualmente</p>
                
                <div v-if="cargandoCoordinadores" class="flex justify-center py-10">
                  <span class="material-symbols-outlined animate-spin text-red-600">progress_activity</span>
                </div>

                <div v-else-if="coordinadoresActuales.length === 0" class="py-10 text-center bg-slate-50 dark:bg-white/3 rounded-3xl border-2 border-dashed border-slate-200 dark:border-white/5">
                  <p class="text-[10px] font-bold text-slate-400 uppercase">Sin personal asignado</p>
                </div>

                <div v-else class="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  <div v-for="coord in coordinadoresActuales" :key="coord.id" 
                       class="flex items-center justify-between p-3 bg-white dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5 group">
                    <div class="flex items-center gap-3">
                      <div class="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 flex items-center justify-center text-xs font-black">
                        {{ coord.usuario?.persona?.nombres?.charAt(0) }}
                      </div>
                      <div>
                        <p class="text-xs font-black text-slate-700 dark:text-white">{{ coord.usuario?.persona?.nombres }}</p>
                        <div class="flex items-center gap-1.5">
                          <span class="text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-white/10 text-slate-500">
                            {{ getRoleName(coord.usuario) }}
                          </span>
                          <span class="text-[9px] text-slate-400 truncate w-24">{{ coord.usuario?.email }}</span>
                        </div>
                      </div>
                    </div>
                    <button @click="quitarCoordinador(coord)" 
                            class="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-600 transition-all">
                      <span class="material-symbols-outlined text-[18px]">person_remove</span>
                    </button>
                  </div>
                </div>
              </div>

              <!-- Columna 2: Buscar y Añadir -->
              <div class="space-y-4">
                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-white/5 pb-2">Añadir Nuevo Responsable</p>
                
                <div class="relative">
                  <span class="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-[18px]">search</span>
                  <input v-model="queryCandidato" type="text" placeholder="Buscar por nombre o email..."
                         class="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-[11px] outline-none focus:border-red-600/50 transition-all" />
                </div>

                <div class="space-y-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                  <div v-for="user in candidatosFiltrados" :key="user.id"
                       class="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-white/3 rounded-2xl transition-colors cursor-pointer group"
                       @click="asignarCoordinador(user)">
                    <div class="flex items-center gap-3">
                      <div class="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/10 text-slate-500 flex items-center justify-center text-xs font-bold">
                        {{ user.persona?.nombres?.charAt(0) }}
                      </div>
                      <div>
                        <p class="text-xs font-bold text-slate-600 dark:text-slate-300">{{ user.persona?.nombres }} {{ user.persona?.primer_apellido }}</p>
                        <div class="flex items-center gap-1.5">
                          <span :class="getRoleName(user) === 'Coordinador' ? 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'text-teal-500 bg-teal-50 dark:bg-teal-900/20'"
                                class="text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md">
                            {{ getRoleName(user) }}
                          </span>
                          <p class="text-[9px] text-slate-400">{{ user.email }}</p>
                        </div>
                      </div>
                    </div>
                    <span class="material-symbols-outlined text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">add_circle</span>
                  </div>
                  
                  <div v-if="candidatosFiltrados.length === 0" class="py-10 text-center italic text-slate-400 text-[10px]">
                    No se encontraron candidatos disponibles
                  </div>
                </div>
              </div>

            </div>

            <div class="mt-10 pt-6 border-t border-slate-100 dark:border-white/5 flex justify-end">
              <button @click="showModalCoordinadores = false"
                      class="px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:-translate-y-1 transition-all">
                Finalizar Gestión
              </button>
            </div>

          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #e2e8f0;
  border-radius: 10px;
}
.dark .custom-scrollbar::-webkit-scrollbar-thumb {
  background: #1e293b;
}
</style>
