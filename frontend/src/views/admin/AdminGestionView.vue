<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useAdminHistorialStore } from '@/stores/adminHistorial';
import api, { getImageUrl } from '@/services/api';
import { coordinacionesService } from '@/services/coordinaciones.service';
import { usuariosService } from '@/services/usuarios.service';
import Swal from 'sweetalert2';

const router = useRouter();

const authStore = useAuthStore();
const historialStore = useAdminHistorialStore();

// ─── Estado Global ─────────────────────────────────────────
const tabActivo = ref<'eventos' | 'actividades' | 'solicitudes' | 'soporte'>('eventos');
const isLoading = ref(false);
const filtroTexto = ref('');
const filtroEstado = ref('');


// ─── Estado de Eventos ────────────────────────────────────
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
  frase_destacada: '', cronograma: '', fase: 1
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

const eventosFiltrados = computed(() => {
  const data = Array.isArray(eventos.value) ? eventos.value : [];
  const search = (filtroTexto.value || '').toLowerCase().trim();
  const estado = filtroEstado.value;

  return data.filter(e => {
    const matchesTexto = !search || (e.nombre || '').toLowerCase().includes(search);
    const matchesEstado = estado === '' || String(e.estado) === String(estado);
    return matchesTexto && matchesEstado;
  });
});

const limpiarFiltros = () => {
  filtroTexto.value = '';
  filtroEstado.value = '';
};

const abrirCrearEvento = () => {
  router.push({ 
    name: 'admin-gestion-eventos', 
    query: { create: 'true' } 
  });
};

const abrirEditarEvento = (ev: any) => {
  router.push({ 
    name: 'admin-gestion-eventos', 
    query: { edit: ev.id }
  });
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
      await api.put(`/admin/eventos/${editEventoId.value}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      historialStore.registrar('evento', 'editar', `Editó el evento: ${formEvento.value.nombre}`, { entidadId: String(editEventoId.value), entidadNombre: formEvento.value.nombre });
    } else {
      await api.post('/admin/eventos', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
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
    await api.patch(`/admin/eventos/${ev.id}`, { estado: 0 });
    historialStore.registrar('evento', 'eliminar', `Inhabilitó el evento: ${ev.nombre}`, { entidadId: String(ev.id), entidadNombre: ev.nombre });
    Swal.fire({ toast: true, icon: 'info', title: 'Evento inhabilitado', timer: 2000, showConfirmButton: false, position: 'top-end' });
    fetchEventos();
  } catch { Swal.fire('Error', 'No se pudo inhabilitar', 'error'); }
};

// ─── Coordinadores y Logística ─────────────────────────────
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
      const isAlreadyAssigned = coordinadoresActuales.value.some(c => c.usuario?.id === u.id);
      return !isAlreadyAssigned;
    });
  } catch (err) {
    console.error('Error fetching candidatos', err);
  }
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
    Swal.fire({ toast: true, icon: 'success', title: 'Responsable asignado', timer: 2000, showConfirmButton: false, position: 'top-end' });
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

const abrirCrearActividad = async () => {
  // Pedir al usuario que seleccione el evento primero (Formal)
  const eventOptions = eventos.value.reduce((acc, ev) => {
    acc[ev.id] = ev.nombre;
    return acc;
  }, {} as Record<number, string>);

  const { value: eventId } = await Swal.fire({
    title: '<span class="text-red-600 font-black italic">NUEVA ACTIVIDAD ACADÉMICA</span>',
    text: 'Selecciona el evento al que pertenecerá esta actividad:',
    input: 'select',
    inputOptions: eventOptions,
    inputPlaceholder: 'Seleccionar evento...',
    showCancelButton: true,
    confirmButtonColor: '#dc2626',
    cancelButtonText: 'Cancelar',
    inputValidator: (value) => {
      if (!value) return '¡Debes seleccionar un evento!'
    }
  });

  if (eventId) {
    router.push({ 
      name: 'admin-gestion-eventos',
      query: { 
        eventoId: eventId,
        newAct: 'true' 
      }
    });
  }
};

const abrirEditarActividad = (act: any) => {
  router.push({ 
    name: 'admin-gestion-eventos', 
    query: { 
      eventoId: act.evento?.id || act.id_evento,
      editAct: act.id 
    }
  });
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

// ─── Soporte / Tickets ────────────────────────────────────
const tickets = ref<any[]>([]);
const soporteTab = ref('pendientes');

const fetchTickets = async () => {
  try {
    const res = await api.get('/soporte');
    tickets.value = res.data;
  } catch (e) { console.error('Error fetching tickets:', e); tickets.value = []; }
};

const ticketsFiltrados = computed(() => {
  if (soporteTab.value === 'pendientes') return tickets.value.filter(t => t.estado === 0);
  if (soporteTab.value === 'resueltos') return tickets.value.filter(t => t.estado === 1);
  return tickets.value.filter(t => t.estado === 2);
});

const resolverTicket = async (id: number) => {
  const { isConfirmed } = await Swal.fire({ title: '¿Marcar como resuelto?', icon: 'question', showCancelButton: true, confirmButtonText: 'Sí, resolver', confirmButtonColor: '#10b981' });
  if (!isConfirmed) return;
  try { await api.patch(`/soporte/${id}/resolver`); Swal.fire({ icon: 'success', title: 'Ticket Resuelto', timer: 1500, showConfirmButton: false }); fetchTickets(); } catch { Swal.fire({ icon: 'error', title: 'Error al resolver' }); }
};

const archivarTicket = async (id: number) => {
  const { isConfirmed } = await Swal.fire({ title: '¿Mover al historial?', icon: 'warning', showCancelButton: true, confirmButtonText: 'Sí, archivar', confirmButtonColor: '#64748b' });
  if (!isConfirmed) return;
  try { await api.patch(`/soporte/${id}/archivar`); Swal.fire({ icon: 'success', title: 'Archivado', timer: 1000, showConfirmButton: false }); fetchTickets(); } catch { Swal.fire({ icon: 'error', title: 'Error al archivar' }); }
};

const vincularUsuario = async (ticketId: number, emailSugerido: string) => {
  const { value: email } = await Swal.fire({ title: 'Vincular Usuario', text: 'Ingresa el correo exacto del usuario:', input: 'text', inputValue: emailSugerido, showCancelButton: true, confirmButtonText: 'Buscar', confirmButtonColor: '#dc2626', inputValidator: (v) => { if (!v) return 'Debes ingresar un correo'; } });
  if (!email) return;
  try { const res = await api.get(`/usuarios/email/${email}`); await api.patch(`/soporte/${ticketId}/vincular/${res.data.id}`); Swal.fire('¡Vinculado!', `Ticket vinculado a ${res.data.persona?.nombres}.`, 'success'); fetchTickets(); } catch { Swal.fire('Error', 'No se encontró ningún usuario con ese correo.', 'error'); }
};

const resetearPassword = async (usuario: any, ticketId: number, emailSugerido: string = '') => {
  if (!usuario) { const r = await Swal.fire({ title: 'Usuario no vinculado', text: 'Primero vincule al usuario.', icon: 'info', showCancelButton: true, confirmButtonText: 'Vincular', confirmButtonColor: '#dc2626' }); if (r.isConfirmed) await vincularUsuario(ticketId, emailSugerido); return; }
  const { value: formValues } = await Swal.fire({ title: 'Restablecer Contraseña', html: `<div class="text-left space-y-4"><p class="text-xs text-slate-500">Cambiar acceso de: <b>${usuario.email}</b></p><div><label class="text-[10px] font-bold text-slate-400 uppercase block mb-1">Portal</label><select id="swal-tipo" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none"><option value="principal">Estudiante</option><option value="ponente">Ponente</option></select></div><div><label class="text-[10px] font-bold text-slate-400 uppercase block mb-1">Nueva Contraseña</label><input id="swal-pass" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none" value="${usuario.persona?.documento_identidad || ''}"></div></div>`, showCancelButton: true, confirmButtonText: 'Cambiar y Resolver', confirmButtonColor: '#dc2626', preConfirm: () => { const p = (document.getElementById('swal-pass') as HTMLInputElement).value; const t = (document.getElementById('swal-tipo') as HTMLSelectElement).value; if (!p || p.length < 4) { Swal.showValidationMessage('Mínimo 4 caracteres'); return false; } return { password: p, tipo: t }; } });
  if (!formValues) return;
  try { await api.patch(`/usuarios/${usuario.id}/forzar-reset`, formValues); await api.patch(`/soporte/${ticketId}/resolver`); Swal.fire('¡Éxito!', 'Contraseña actualizada y ticket resuelto.', 'success'); fetchTickets(); } catch { Swal.fire('Error', 'No se pudo completar.', 'error'); }
};

const habilitarEdicion = async (usuario: any, ticketId: number, emailSugerido: string = '') => {
  if (!usuario) { const r = await Swal.fire({ title: 'Usuario no vinculado', text: 'Primero vincule al usuario.', icon: 'info', showCancelButton: true, confirmButtonText: 'Vincular', confirmButtonColor: '#dc2626' }); if (r.isConfirmed) await vincularUsuario(ticketId, emailSugerido); return; }
  const { isConfirmed } = await Swal.fire({ title: 'Habilitar Edición', text: `¿Permitir que ${usuario.persona?.nombres} edite su perfil?`, icon: 'question', showCancelButton: true, confirmButtonText: 'Sí, habilitar', confirmButtonColor: '#10b981' });
  if (!isConfirmed) return;
  try { await api.patch(`/usuarios/${usuario.id}/habilitar-edicion`); await api.patch(`/soporte/${ticketId}/resolver`); Swal.fire('¡Habilitado!', 'Edición habilitada y ticket resuelto.', 'success'); fetchTickets(); } catch { Swal.fire('Error', 'No se pudo habilitar.', 'error'); }
};

onMounted(() => { 
  fetchEventos(); 
  fetchActividades(); 
  fetchSolicitudes();
  fetchTickets();
});
</script>

<template>
  <div class="space-y-6 animate-in fade-in duration-500">

    <!-- HEADER -->
    <div class="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
      <div>
        <p class="text-[10px] font-black text-red-600 dark:text-red-500 uppercase tracking-widest mb-1">Panel Unificado</p>
        <h1 class="text-xl sm:text-2xl font-black text-slate-800 dark:text-white uppercase italic tracking-tight">Gestión Académica</h1>
        <p class="text-slate-500 text-xs sm:text-sm mt-1">Administra eventos, actividades y soporte desde un solo lugar</p>
      </div>

      <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <!-- Barra de Tabs -->
        <div class="flex flex-wrap bg-slate-100 dark:bg-white/5 p-1 rounded-xl border border-slate-200 dark:border-white/10 gap-0.5">
          <button @click="tabActivo = 'eventos'; filtroTexto = ''; filtroEstado = ''"
                  :class="tabActivo === 'eventos' ? 'bg-white dark:bg-red-600 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'"
                  class="flex items-center gap-1.5 px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg text-[9px] sm:text-[10px] font-black uppercase transition-all">
            <span class="material-symbols-outlined text-[14px] sm:text-[16px]">corporate_fare</span>
            Eventos
          </button>
          <button @click="tabActivo = 'actividades'; filtroTexto = ''; filtroEstado = ''"
                  :class="tabActivo === 'actividades' ? 'bg-white dark:bg-amber-600 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'"
                  class="flex items-center gap-1.5 px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg text-[9px] sm:text-[10px] font-black uppercase transition-all">
            <span class="material-symbols-outlined text-[14px] sm:text-[16px]">school</span>
            Actividades
          </button>
          <button @click="tabActivo = 'solicitudes'; filtroTexto = ''; filtroEstado = ''"
                  :class="tabActivo === 'solicitudes' ? 'bg-white dark:bg-emerald-600 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'"
                  class="flex items-center gap-1.5 px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg text-[9px] sm:text-[10px] font-black uppercase transition-all">
            <span class="material-symbols-outlined text-[14px] sm:text-[16px]">notification_important</span>
            <span class="hidden xs:inline">Solicitudes</span><span class="xs:hidden">Solic.</span>
            <span v-if="solicitudes.length > 0" class="flex h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
          </button>
          <button @click="tabActivo = 'soporte'; filtroTexto = ''; filtroEstado = ''"
                  :class="tabActivo === 'soporte' ? 'bg-white dark:bg-sky-600 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'"
                  class="flex items-center gap-1.5 px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg text-[9px] sm:text-[10px] font-black uppercase transition-all">
            <span class="material-symbols-outlined text-[14px] sm:text-[16px]">support_agent</span>
            Soporte
            <span v-if="tickets.filter(t => t.estado === 0).length > 0" class="flex h-2 w-2 rounded-full bg-sky-500 animate-pulse"></span>
          </button>
        </div>

        <!-- Botón de acción -->
        <button v-if="tabActivo === 'eventos'" @click="abrirCrearEvento()"
                class="flex items-center justify-center gap-2 px-5 py-3 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase shadow-lg shadow-red-600/20 hover:bg-red-700 transition-all group">
          <span class="material-symbols-outlined text-[16px] group-hover:rotate-90 transition-transform">add</span>
          Nuevo Evento
        </button>
        <button v-else-if="tabActivo === 'actividades'" @click="abrirCrearActividad()"
                class="flex items-center justify-center gap-2 px-5 py-3 bg-amber-500 text-white rounded-xl text-[10px] font-black uppercase shadow-lg shadow-amber-500/20 hover:bg-amber-600 transition-all group">
          <span class="material-symbols-outlined text-[16px] group-hover:rotate-90 transition-transform">add</span>
          Nueva Actividad
        </button>
        <button v-else-if="tabActivo === 'soporte'" @click="fetchTickets()"
                class="flex items-center justify-center gap-2 px-5 py-3 bg-sky-500 text-white rounded-xl text-[10px] font-black uppercase shadow-lg shadow-sky-500/20 hover:bg-sky-600 transition-all group">
          <span class="material-symbols-outlined text-[16px]">refresh</span>
          Recargar
        </button>
        <button v-else @click="fetchSolicitudes()"
                class="flex items-center justify-center gap-2 px-5 py-3 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all group">
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
          <div class="flex gap-1.5 flex-wrap items-center">
            <button v-for="(cfg, est) in estadoEventoConfig" :key="est"
                    @click="filtroEstado = filtroEstado === String(est) ? '' : String(est)"
                    :class="filtroEstado === String(est) ? 'bg-slate-800 dark:bg-white text-white dark:text-slate-900' : 'bg-slate-100 dark:bg-white/5 text-slate-500'"
                    class="px-3 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all">
              {{ cfg.label }}
            </button>
            <button v-if="filtroEstado || filtroTexto" @click="limpiarFiltros"
                    class="px-3 py-1.5 text-[9px] font-black uppercase rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-all border border-red-100">
              Limpiar Filtros
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
                    <div class="w-10 h-10 rounded-xl overflow-hidden bg-red-50 dark:bg-red-900/20 shrink-0 border border-red-200/50 dark:border-red-900/30">
                      <img v-if="ev.imagen_fondo" 
                           :src="ev.imagen_fondo.startsWith('http') ? ev.imagen_fondo : getImageUrl('eventos', ev.imagen_fondo)" 
                           class="w-full h-full object-cover" :alt="ev.nombre"
                           @error="($event.target as HTMLImageElement).style.display = 'none'">
                      <img v-else-if="ev.logo" 
                           :src="ev.logo.startsWith('http') ? ev.logo : getImageUrl('logo', ev.logo)" 
                           class="w-full h-full object-cover" :alt="ev.nombre"
                           @error="($event.target as HTMLImageElement).style.display = 'none'">
                      <div v-if="!ev.imagen_fondo && !ev.logo" class="w-full h-full flex items-center justify-center">
                        <span class="material-symbols-outlined text-red-500 text-[18px]">corporate_fare</span>
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
                   <div class="flex flex-col items-center gap-1">
                      <span v-if="ev.estado !== undefined && estadoEventoConfig[ev.estado]" 
                            :class="[estadoEventoConfig[ev.estado]?.bg, estadoEventoConfig[ev.estado]?.color]"
                            class="px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-widest border border-current opacity-80">
                        {{ estadoEventoConfig[ev.estado]?.label }}
                      </span>
                      <span v-if="ev.fase" class="text-[7px] font-black text-slate-400 uppercase tracking-tighter">
                         {{ ev.fase === 4 ? '🏁 Finalizado' : ev.fase === 1 ? '📝 Planificación' : ev.fase === 2 ? '👥 Inscripciones' : ev.fase === 3 ? '⚡ Ejecución' : '📁 Archivado' }}
                      </span>
                   </div>
                </td>
                <td class="px-6 py-4 text-right">
                  <div class="flex justify-end items-center gap-2">
                    <!-- Inscripción Masiva (Excel) -->
                    <button @click="router.push({ name: 'admin-inscripciones-excel', query: { eventoId: ev.id } })"
                            title="Inscripción Masiva (Excel)"
                            class="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all shadow-sm">
                      <span class="material-symbols-outlined text-[18px]">grid_on</span>
                    </button>

                    <!-- Gestionar Coordinadores -->
                    <button @click="abrirCoordinadores(ev)"
                            title="Gestionar Responsables"
                            class="p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 text-slate-600 hover:bg-slate-800 hover:text-white transition-all shadow-sm">
                      <span class="material-symbols-outlined text-[18px]">group_add</span>
                    </button>

                    <!-- Emitir Certificados -->
                    <button @click="ev.fase === 4 ? router.push({ name: 'admin-certificados-envio', query: { search: ev.nombre } }) : Swal.fire('Aviso', 'Solo se pueden emitir certificados de eventos en fase FINALIZADO.', 'info')"
                            title="Emitir Certificados"
                            :class="ev.fase === 4 ? 'bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white' : 'bg-slate-50 text-slate-300 cursor-not-allowed'"
                            class="p-2.5 rounded-xl dark:bg-amber-900/20 transition-all shadow-sm">
                      <span class="material-symbols-outlined text-[18px]">verified_user</span>
                    </button>

                    <button @click="abrirEditarEvento(ev)" title="Editar"
                            class="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                      <span class="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                    <button @click="confirmarEliminarEvento(ev)" title="Inhabilitar"
                            class="p-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 hover:bg-red-600 hover:text-white transition-all shadow-sm">
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
                    <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 overflow-hidden border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800">
                      <img v-if="act.imagen" :src="getImageUrl('cursos', act.imagen)" class="w-full h-full object-cover" :alt="act.nombre">
                      <span v-else class="material-symbols-outlined text-amber-600 text-[18px]">school</span>
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

    <!-- TAB: SOPORTE -->
    <div v-else-if="tabActivo === 'soporte'">
      <!-- Sub-tabs del soporte -->
      <div class="flex gap-1 bg-slate-100 dark:bg-white/5 p-1 rounded-2xl w-fit mb-6">
        <button v-for="t in [
          { id: 'pendientes', label: 'Pendientes', icon: 'pending_actions' },
          { id: 'resueltos', label: 'Resueltos', icon: 'check_circle' },
          { id: 'historial', label: 'Historial', icon: 'history' }
        ]" :key="t.id"
          @click="soporteTab = t.id"
          :class="[
            'flex items-center gap-1.5 px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl text-[9px] sm:text-xs font-black uppercase tracking-widest transition-all',
            soporteTab === t.id ? 'bg-white dark:bg-sky-600 text-sky-600 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
          ]">
          <span class="material-symbols-outlined text-sm">{{ t.icon }}</span>
          {{ t.label }}
        </button>
      </div>

      <div v-if="ticketsFiltrados.length === 0" class="bg-white dark:bg-[#13131f] rounded-2xl p-16 sm:p-20 text-center border border-slate-200 dark:border-white/5">
        <span class="material-symbols-outlined text-5xl sm:text-6xl text-slate-200 dark:text-gray-800 mb-4">support_agent</span>
        <p class="text-slate-400 font-bold uppercase tracking-widest text-xs">No hay solicitudes en esta sección</p>
      </div>

      <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div v-for="ticket in ticketsFiltrados" :key="ticket.id" 
          class="bg-white dark:bg-[#13131f] border border-slate-200 dark:border-white/5 rounded-2xl p-4 sm:p-6 hover:shadow-lg transition-all relative overflow-hidden group">
          
          <div :class="[
            ticket.estado === 1 ? 'bg-emerald-500' : ticket.estado === 2 ? 'bg-slate-400' : 'bg-amber-500', 
            'absolute left-0 top-0 bottom-0 w-1.5'
          ]"></div>

          <div class="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 gap-3">
            <div class="flex items-center gap-3">
              <div :class="[
                'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                ticket.tipo === 'password' ? 'bg-sky-100 dark:bg-sky-900/20 text-sky-600' : ticket.tipo === 'datos' ? 'bg-amber-100 dark:bg-amber-900/20 text-amber-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
              ]">
                <span class="material-symbols-outlined text-[20px]">
                  {{ ticket.tipo === 'password' ? 'lock_reset' : ticket.tipo === 'datos' ? 'edit_note' : 'help' }}
                </span>
              </div>
              <div>
                <p class="text-[10px] font-black uppercase text-slate-400 leading-none mb-1">Asunto:</p>
                <h4 class="text-xs sm:text-sm font-black text-slate-800 dark:text-white uppercase">{{ ticket.tipo === 'password' ? 'Acceso / Password' : ticket.tipo }}</h4>
              </div>
            </div>
            
            <div class="flex items-center gap-2">
              <span :class="[
                'text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-widest',
                ticket.estado === 1 ? 'bg-emerald-100 text-emerald-600' : ticket.estado === 2 ? 'bg-slate-100 text-slate-500' : 'bg-amber-100 text-amber-600'
              ]">
                {{ ticket.estado === 1 ? 'Resuelto' : ticket.estado === 2 ? 'Archivado' : 'Pendiente' }}
              </span>
              <button v-if="ticket.estado === 1" @click="archivarTicket(ticket.id)" 
                class="text-slate-300 hover:text-red-500 transition-colors">
                <span class="material-symbols-outlined text-lg">delete</span>
              </button>
            </div>
          </div>

          <div class="bg-slate-50 dark:bg-white/3 rounded-xl p-3 sm:p-4 mb-4 border border-slate-100 dark:border-white/5">
            <p class="text-[10px] font-black uppercase text-slate-400 mb-2">Mensaje del Usuario:</p>
            <p class="text-xs sm:text-sm text-slate-700 dark:text-gray-300 font-medium leading-relaxed italic">
              "{{ ticket.mensaje }}"
            </p>
          </div>

          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 sm:pt-4 border-t border-slate-100 dark:border-white/5">
            <div class="flex items-center gap-2">
               <div class="w-8 h-8 rounded-full bg-slate-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden shrink-0">
                  <span class="material-symbols-outlined text-slate-400 text-xl">account_circle</span>
               </div>
               <div>
                  <p class="text-[9px] font-black text-slate-800 dark:text-white uppercase leading-none">
                    {{ ticket.usuario?.persona ? `${ticket.usuario.persona.nombres} ${ticket.usuario.persona.primer_apellido}` : 'Usuario Externo' }}
                  </p>
                  <div class="flex items-center gap-2 mt-0.5">
                    <p class="text-[8px] text-slate-400 font-medium truncate max-w-[150px]">{{ ticket.usuario?.email || 'Sin cuenta' }}</p>
                    <button v-if="!ticket.usuario" @click="vincularUsuario(ticket.id, ticket.email || '')"
                      class="text-sky-500 hover:underline text-[8px] font-bold uppercase tracking-tighter">
                      [Vincular]
                    </button>
                  </div>
               </div>
            </div>
            <div class="flex flex-wrap items-center gap-2">
              <span class="text-[8px] font-bold text-slate-400 uppercase hidden sm:block">{{ new Date(ticket.fechaCreacion).toLocaleString() }}</span>
              
              <template v-if="ticket.estado === 0">
                <button @click="resetearPassword(ticket.usuario, ticket.id, ticket.email)"
                  class="bg-red-600 hover:bg-red-700 text-white px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-[8px] sm:text-[9px] font-black uppercase tracking-widest transition-colors flex items-center gap-1 shadow-sm">
                  <span class="material-symbols-outlined text-[12px] sm:text-[14px]">key</span>
                  Clave
                </button>
                <button @click="habilitarEdicion(ticket.usuario, ticket.id, ticket.email)"
                  class="bg-emerald-500 hover:bg-emerald-600 text-white px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-[8px] sm:text-[9px] font-black uppercase tracking-widest transition-colors flex items-center gap-1 shadow-sm">
                  <span class="material-symbols-outlined text-[12px] sm:text-[14px]">edit</span>
                  Edición
                </button>
                <button @click="resolverTicket(ticket.id)"
                  class="bg-slate-800 hover:bg-slate-900 text-white px-3 py-1.5 sm:py-2 rounded-lg text-[8px] sm:text-[10px] font-black uppercase tracking-widest transition-colors shadow-sm">
                  Resolver
                </button>
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>

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

    <!-- ══════════════════════════════════════════════ -->
    <!--  MODAL COORDINADORES (ADMIN GESTION)           -->
    <!-- ══════════════════════════════════════════════ -->
    <Teleport to="body">
      <div v-if="showModalCoordinadores" class="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
        <div class="bg-white dark:bg-[#0d0d14] w-full max-w-2xl rounded-[2.5rem] border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden animate-in zoom-in duration-300">
          <div class="p-8">
            <div class="flex justify-between items-center mb-8">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center">
                  <span class="material-symbols-outlined text-white text-[20px]">manage_accounts</span>
                </div>
                <div>
                  <h2 class="text-xl font-black text-slate-800 dark:text-white uppercase italic leading-tight">Responsables del Evento</h2>
                  <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{{ eventoParaCoordinadores?.nombre }}</p>
                </div>
              </div>
              <button @click="showModalCoordinadores = false" class="text-slate-400 hover:text-red-600 transition-colors">
                <span class="material-symbols-outlined text-[28px]">close</span>
              </button>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
              <!-- Actuales -->
              <div class="space-y-4">
                <h3 class="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <span class="material-symbols-outlined text-sm">groups</span> Responsables Actuales
                </h3>
                <div v-if="cargandoCoordinadores" class="py-10 flex justify-center"><div class="w-6 h-6 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin"></div></div>
                <div v-else-if="coordinadoresActuales.length === 0" class="py-10 text-center border-2 border-dashed border-slate-100 rounded-2xl text-[10px] font-bold text-slate-300 uppercase">Sin responsables asignados</div>
                <div v-else class="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  <div v-for="c in coordinadoresActuales" :key="c.id" class="flex items-center justify-between p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5">
                    <div class="flex items-center gap-3">
                      <div class="w-8 h-8 rounded-full bg-slate-200 dark:bg-gray-700 flex items-center justify-center text-[10px] font-black text-slate-500">
                        {{ c.usuario?.persona?.nombres?.charAt(0) }}{{ c.usuario?.persona?.primer_apellido?.charAt(0) }}
                      </div>
                      <div>
                        <p class="text-[10px] font-black text-slate-800 dark:text-white uppercase">{{ c.usuario?.persona?.nombres }} {{ c.usuario?.persona?.primer_apellido }}</p>
                        <p class="text-[8px] text-slate-400 font-bold uppercase tracking-tighter">{{ c.usuario?.email }}</p>
                      </div>
                    </div>
                    <button @click="quitarCoordinador(c)" class="text-slate-300 hover:text-red-500 transition-colors"><span class="material-symbols-outlined text-lg">remove_circle</span></button>
                  </div>
                </div>
              </div>

              <!-- Candidatos -->
              <div class="space-y-4">
                <h3 class="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <span class="material-symbols-outlined text-sm">person_search</span> Asignar Nuevo
                </h3>
                <input v-model="queryCandidato" type="text" placeholder="BUSCAR POR NOMBRE O EMAIL..." class="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-[10px] font-bold uppercase outline-none focus:border-slate-800/50 transition-all" />
                <div class="space-y-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                  <div v-for="u in candidatosFiltrados" :key="u.id" @click="asignarCoordinador(u)" class="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl cursor-pointer transition-colors border border-transparent hover:border-slate-100">
                    <div class="w-8 h-8 rounded-full bg-slate-100 dark:bg-gray-800 flex items-center justify-center text-[10px] font-black text-slate-400 group-hover:bg-white">
                      <span class="material-symbols-outlined text-sm">person</span>
                    </div>
                    <div>
                      <p class="text-[10px] font-black text-slate-700 dark:text-gray-200 uppercase">{{ u.persona?.nombres }} {{ u.persona?.primer_apellido }}</p>
                      <p class="text-[8px] text-slate-400">{{ u.email }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>


  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
.dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; }
</style>
