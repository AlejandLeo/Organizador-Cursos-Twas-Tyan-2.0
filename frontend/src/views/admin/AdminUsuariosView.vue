<script setup lang="ts">
<<<<<<< HEAD
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useAdminHistorialStore } from '@/stores/adminHistorial';
import { usuariosService } from '@/services/usuarios.service';
import Swal from 'sweetalert2';
=======
import { useAuthStore } from '@/stores/auth';
>>>>>>> dd5dcbbcab549efef3d4630361299364dfd06cf3

const authStore = useAuthStore();
const historialStore = useAdminHistorialStore();
const usuarios = ref<any[]>([]);
const isLoading = ref(true);
const filtroTexto = ref('');
const filtroRol = ref('');

// Modales
const isCreating = ref(false);
const isGestionandoRoles = ref(false);
const usuarioSeleccionado = ref<any>(null);
const rolesCargando = ref(false);

// IDs de roles (deben coincidir con la BD)
const ROLE_IDS = { COORDINADOR: 2, LOGISTICA: 3, ESTUDIANTE: 4, PONENTE: 5 };

const rolesDisponibles = [
  { id: ROLE_IDS.COORDINADOR, nombre: 'Coordinador' },
  { id: ROLE_IDS.LOGISTICA,    nombre: 'Logística' },
  { id: ROLE_IDS.PONENTE,     nombre: 'Ponente' },
  { id: ROLE_IDS.ESTUDIANTE,  nombre: 'Estudiante' },
];

const formUsuario = ref({
  email: '',
  password: '',
  nombres: '',
  primer_apellido: '',
  segundo_apellido: '',
  cedula: '',
  id_rol: ROLE_IDS.COORDINADOR,
});

const fetchUsuarios = async () => {
  try {
    isLoading.value = true;
    const res = await usuariosService.getAll({ soloActivos: 'false' });
    const data = (res.data as any)?.data ?? res.data;
    usuarios.value = Array.isArray(data) ? data : [];
  } catch {
    Swal.fire('Error', 'No se pudo cargar la lista de usuarios', 'error');
  } finally {
    isLoading.value = false;
  }
};

const usuariosFiltrados = computed(() => {
  return usuarios.value.filter(u => {
    const nombresFull = `${u.persona?.nombres ?? ''} ${u.persona?.primer_apellido ?? ''}`.toLowerCase();
    const coincideTexto =
      nombresFull.includes(filtroTexto.value.toLowerCase()) ||
      (u.email ?? '').toLowerCase().includes(filtroTexto.value.toLowerCase());
    const coincideRol =
      !filtroRol.value ||
      u.usuariosRoles?.some((ur: any) => ur.rol?.id === Number(filtroRol.value));
    return coincideTexto && coincideRol;
  });
});

const getRoles = (u: any): string[] =>
  u.usuariosRoles?.map((ur: any) => ur.rol?.nombre_rol).filter(Boolean) ?? [];

const tienePonente = (u: any) => getRoles(u).includes('Ponente');

// ── Crear usuario ──────────────────────────────────────────────────────────
const handleSaveUsuario = async () => {
  const { email, password, nombres, primer_apellido, id_rol } = formUsuario.value;
  if (!email || !password || !nombres || !primer_apellido) {
    return Swal.fire('Campos requeridos', 'Complete todos los campos obligatorios.', 'warning');
  }
  try {
    await usuariosService.crearConRol({
      email,
      password,
      nombres,
      primer_apellido,
      segundo_apellido: formUsuario.value.segundo_apellido || undefined,
      cedula: formUsuario.value.cedula || undefined,
      id_rol,
    });
    const rolName = rolesDisponibles.find(r => r.id === id_rol)?.nombre || 'Usuario';
    historialStore.registrar('usuario', 'crear', `Creó nuevo ${rolName}: ${email}`, { entidadNombre: email });
    Swal.fire('¡Éxito!', `${rolName} creado correctamente. Se ha enviado un correo con las credenciales temporales.`, 'success');
    isCreating.value = false;
    formUsuario.value = { email: '', password: '', nombres: '', primer_apellido: '', segundo_apellido: '', cedula: '', id_rol: ROLE_IDS.COORDINADOR };
    fetchUsuarios();
  } catch (error: any) {
    const msg = error?.response?.data?.message || 'No se pudo crear el usuario.';
    Swal.fire('Error', msg, 'error');
  }
};

// ── Gestión de Múltiples Roles ─────────────────────────────────────────────
const abrirGestionRoles = (user: any) => {
  usuarioSeleccionado.value = user;
  isGestionandoRoles.value = true;
};

const hasRole = (u: any, roleId: number) => {
  return u.usuariosRoles?.some((ur: any) => ur.rol?.id === roleId);
};

const toggleRol = async (rolId: number, nombreRol: string) => {
  const u = usuarioSeleccionado.value;
  if (!u || rolesCargando.value) return;

  const activo = hasRole(u, rolId);
  rolesCargando.value = true;
  try {
    if (activo) {
      await usuariosService.quitarRol(u.id, rolId);
      historialStore.registrar('usuario', 'editar', `Quitó rol ${nombreRol} de ${u.email}`, { entidadId: u.id });
    } else {
      await usuariosService.asignarRol(u.id, rolId);
      historialStore.registrar('usuario', 'editar', `Asignó rol ${nombreRol} a ${u.email}`, { entidadId: u.id });
    }
    // Refrescar datos localmente o recargar lista
    await fetchUsuarios();
    // Actualizar usuarioSeleccionado para reflejar cambios en el modal
    usuarioSeleccionado.value = usuarios.value.find(usr => usr.id === u.id);
  } catch (error: any) {
    Swal.fire('Error', error.response?.data?.message || 'No se pudo actualizar el rol.', 'error');
  } finally {
    rolesCargando.value = false;
  }
};

// ── Activar / Desactivar cuenta ────────────────────────────────────────────
const toggleEstado = async (user: any) => {
  const nuevoEstado = user.estado === 1 ? 0 : 1;
  const result = await Swal.fire({
    title: nuevoEstado === 0 ? 'Desactivar cuenta' : 'Activar cuenta',
    html: `
      <div class="space-y-4">
        <p>¿Confirmar cambio de estado de <b>${user.email}</b>?</p>
        <div class="flex items-center justify-center gap-2 mt-4">
          <input type="checkbox" id="swal-notificar" checked class="w-4 h-4 cursor-pointer">
          <label for="swal-notificar" class="text-sm cursor-pointer">Notificar por correo electrónico</label>
        </div>
      </div>
    `,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Confirmar',
    cancelButtonText: 'Cancelar',
    preConfirm: () => {
      return (document.getElementById('swal-notificar') as HTMLInputElement).checked;
    }
  });
  
  if (!result.isConfirmed) return;
  const notificar = result.value;

  try {
    await usuariosService.update(user.id, { estado: nuevoEstado } as any, notificar);
    user.estado = nuevoEstado;
    historialStore.registrar('usuario', 'editar', `Cambió estado de ${user.email} a ${nuevoEstado === 1 ? 'Activo' : 'Inactivo'} (Notificar: ${notificar})`, { entidadId: user.id, entidadNombre: user.email });
    Swal.fire('¡Éxito!', 'Estado actualizado.', 'success');
  } catch (error: any) {
    Swal.fire('Error', error.response?.data?.message || 'No se pudo actualizar el estado.', 'error');
  }
};

// ── ELIMINACIÓN DE CUENTA ──────────────────────────────────────────────────
const eliminarProgramada = async (user: any) => {
  const result = await Swal.fire({
    title: '¿Programar eliminación?',
    html: `
      <div class="space-y-4 text-left px-4">
        <p>La cuenta de <b>${user.email}</b> será desactivada ahora y eliminada físicamente de forma automática en 30 días.</p>
        <div class="flex items-center gap-2 mt-4 p-3 bg-slate-50 dark:bg-white/5 rounded-xl">
          <input type="checkbox" id="swal-notificar-del" checked class="w-4 h-4 cursor-pointer">
          <label for="swal-notificar-del" class="text-xs font-bold uppercase cursor-pointer">Notificar al usuario por correo</label>
        </div>
      </div>
    `,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, programar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#e11d48',
    preConfirm: () => {
      return (document.getElementById('swal-notificar-del') as HTMLInputElement).checked;
    }
  });

  if (!result.isConfirmed) return;
  const notificar = result.value;

  try {
    await usuariosService.delete(user.id, notificar);
    Swal.fire('Programado', 'La cuenta se eliminará definitivamente en 30 días.', 'success');
    fetchUsuarios();
  } catch (err: any) {
    Swal.fire('Error', err.response?.data?.message || 'No se pudo programar la eliminación.', 'error');
  }
};

const eliminarInmediata = async (user: any) => {
  const result = await Swal.fire({
    title: '¿ELIMINACIÓN DEFINITIVA?',
    text: `Esta acción es IRREVERSIBLE. Se borrarán todos los datos de ${user.email} de forma inmediata.`,
    icon: 'error',
    showCancelButton: true,
    confirmButtonText: 'SÍ, BORRAR AHORA',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#991b1b',
  });

  if (!result.isConfirmed) return;

  try {
    await usuariosService.eliminarFisico(user.id);
    Swal.fire('Eliminado', 'Usuario borrado permanentemente.', 'success');
    fetchUsuarios();
  } catch (err: any) {
    Swal.fire('Error', err.response?.data?.message || 'No se pudo realizar la eliminación.', 'error');
  }
};

onMounted(fetchUsuarios);
</script>

<template>
  <div class="space-y-8 animate-in fade-in duration-500">

    <!-- HEADER -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-3 mb-2">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-rose-800 flex items-center justify-center shadow-lg shadow-red-900/50">
            <span class="material-symbols-outlined text-white text-[22px]">manage_accounts</span>
          </div>
          <div>
            <p class="text-[10px] font-black text-red-600 dark:text-red-500 uppercase tracking-widest leading-none">Gestión Global</p>
            <h1 class="text-2xl font-black text-slate-800 dark:text-white tracking-tight uppercase italic">Control de Usuarios</h1>
          </div>
        </div>
        <p class="text-slate-500 text-sm ml-1">Crea, administra y asigna roles desde un solo lugar</p>
      </div>
      <button @click="isCreating = true"
              class="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-600/20">
        <span class="material-symbols-outlined text-[18px]">person_add</span>
        Nuevo Usuario
      </button>
    </div>

    <!-- FILTROS -->
    <div class="bg-white dark:bg-[#13131f] border border-slate-200 dark:border-white/5 rounded-2xl p-5">
      <div class="flex flex-wrap items-center gap-4">
        <div class="flex-1 min-w-[250px] relative">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400">search</span>
          <input v-model="filtroTexto" type="text" placeholder="Buscar usuario..."
                 class="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm outline-none focus:border-red-600/50 transition-all" />
        </div>
        <select v-model="filtroRol" class="px-4 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold uppercase outline-none">
          <option value="">Todos los roles</option>
          <option v-for="rol in rolesDisponibles" :key="rol.id" :value="rol.id">{{ rol.nombre }}</option>
        </select>
      </div>
    </div>

    <!-- TABLA -->
    <div class="bg-white dark:bg-[#13131f] border border-slate-200 dark:border-white/5 rounded-[2rem] overflow-hidden">
      <div v-if="isLoading" class="flex justify-center items-center py-16">
        <span class="material-symbols-outlined animate-spin text-3xl text-red-600">progress_activity</span>
      </div>
      <div v-else class="overflow-x-auto">
        <table class="w-full text-left">
          <thead class="bg-slate-50 dark:bg-white/5 text-[10px] font-black text-slate-500 uppercase tracking-widest">
            <tr>
              <th class="px-6 py-4">Usuario</th>
              <th class="px-6 py-4">Cédula / CI</th>
              <th class="px-6 py-4">Roles</th>
              <th class="px-6 py-4 text-center">Estado</th>
              <th class="px-6 py-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-white/5">
            <tr v-for="user in usuariosFiltrados" :key="user.id" class="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/20 text-red-600 flex items-center justify-center font-black text-sm">
                    {{ user.persona?.nombres?.charAt(0) || '?' }}
                  </div>
                  <div>
                    <p class="text-sm font-black text-slate-800 dark:text-white">{{ user.persona?.nombres }} {{ user.persona?.primer_apellido }}</p>
                    <p class="text-[10px] text-slate-500 font-bold uppercase">{{ user.email }}</p>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4">
                <span class="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                  {{ user.persona?.documento_identidad || 'N/A' }}
                </span>
              </td>
              <td class="px-6 py-4">
                <div class="flex gap-1 flex-wrap">
                  <span v-for="nombre in getRoles(user)" :key="nombre"
                        :class="nombre === 'Ponente' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200 dark:border-blue-800' : 
                                nombre === 'Logística' ? 'bg-teal-100 text-teal-600 dark:bg-teal-900/20 dark:text-teal-400 border-teal-200 dark:border-teal-800' :
                                'bg-slate-100 dark:bg-white/5 text-slate-500 border-slate-200 dark:border-white/10'"
                        class="px-2 py-0.5 rounded border text-[9px] font-black uppercase">
                    {{ nombre }}
                  </span>
                  <span v-if="getRoles(user).length === 0" class="text-[9px] text-slate-400 italic">Sin rol</span>
                </div>
              </td>
              <td class="px-6 py-4 text-center">
                <div class="flex flex-col items-center gap-1">
                  <span :class="user.estado === 1 ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'text-red-500 bg-red-50 dark:bg-red-900/20'"
                        class="text-[9px] font-black uppercase px-2 py-1 rounded-full">
                    {{ user.estado === 1 ? 'ACTIVO' : 'INACTIVO' }}
                  </span>
                  <span v-if="user.fecha_eliminacion" class="text-[8px] bg-red-600 text-white px-2 py-0.5 rounded-full font-black animate-pulse uppercase">
                    Pendiente Borrado
                  </span>
                </div>
              </td>
              <td class="px-6 py-4">
                <div class="flex items-center justify-end gap-1">
                  <!-- Botón gestionar roles -->
                  <button @click="abrirGestionRoles(user)"
                          title="Gestionar Roles"
                          class="p-2 rounded-lg hover:bg-sky-50 dark:hover:bg-sky-900/20 text-slate-400 hover:text-sky-500 transition-all">
                    <span class="material-symbols-outlined text-[18px]">verified_user</span>
                  </button>
                  <!-- Botón activar/desactivar -->
                  <button @click="toggleEstado(user)"
                          :title="user.estado === 1 ? 'Desactivar' : 'Activar'"
                          class="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-600 transition-all">
                    <span class="material-symbols-outlined text-[18px]">{{ user.estado === 1 ? 'lock' : 'lock_open' }}</span>
                  </button>
                  <!-- Botones de eliminación -->
                  <div class="flex items-center border-l border-slate-200 dark:border-white/10 ml-1 pl-1 gap-1">
                    <button @click="eliminarProgramada(user)"
                            v-if="!user.fecha_eliminacion"
                            title="Programar eliminación (30 días)"
                            class="p-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-400 hover:text-rose-600 transition-all">
                      <span class="material-symbols-outlined text-[18px]">delete_sweep</span>
                    </button>
                    <button @click="eliminarInmediata(user)"
                            v-if="authStore.esSuperUsuario"
                            title="Eliminar AHORA (Permanente)"
                            class="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 transition-all">
                      <span class="material-symbols-outlined text-[18px]">delete_forever</span>
                    </button>
                  </div>
                </div>
              </td>
            </tr>
            <tr v-if="usuariosFiltrados.length === 0">
              <td colspan="4" class="py-16 text-center text-sm text-slate-400">No se encontraron usuarios.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- MODAL: CREAR USUARIO -->
    <div v-if="isCreating" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
      <div class="bg-white dark:bg-[#0d0d14] w-full max-w-lg rounded-[2rem] border border-white/10 overflow-hidden animate-in zoom-in duration-300">
        <div class="p-8">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-xl font-black text-slate-800 dark:text-white uppercase italic">Crear Nuevo Acceso</h2>
            <button @click="isCreating = false" class="text-slate-400 hover:text-red-600 transition-colors">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>
          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-1">
                <label class="text-[10px] font-black text-slate-500 uppercase ml-2">Nombres *</label>
                <input v-model="formUsuario.nombres" type="text" class="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm dark:text-white outline-none focus:border-red-600/50" />
              </div>
              <div class="space-y-1">
                <label class="text-[10px] font-black text-slate-500 uppercase ml-2">Primer Apellido *</label>
                <input v-model="formUsuario.primer_apellido" type="text" class="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm dark:text-white outline-none focus:border-red-600/50" />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-1">
                <label class="text-[10px] font-black text-slate-500 uppercase ml-2">Segundo Apellido</label>
                <input v-model="formUsuario.segundo_apellido" type="text" class="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm dark:text-white outline-none focus:border-red-600/50" />
              </div>
              <div class="space-y-1">
                <label class="text-[10px] font-black text-slate-500 uppercase ml-2">Cédula / CI</label>
                <input v-model="formUsuario.cedula" type="text" class="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm dark:text-white outline-none focus:border-red-600/50" />
              </div>
            </div>
            <div class="space-y-1">
              <label class="text-[10px] font-black text-slate-500 uppercase ml-2">Rol del Sistema *</label>
              <select v-model="formUsuario.id_rol" class="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm dark:text-white outline-none focus:border-red-600/50 font-bold uppercase">
                <option v-for="rol in rolesDisponibles" :key="rol.id" :value="rol.id">{{ rol.nombre }}</option>
              </select>
            </div>
            <div class="space-y-1">
              <label class="text-[10px] font-black text-slate-500 uppercase ml-2">Correo Electrónico *</label>
              <input v-model="formUsuario.email" type="email" class="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm dark:text-white outline-none focus:border-red-600/50" />
            </div>
            <div class="space-y-1">
              <label class="text-[10px] font-black text-slate-500 uppercase ml-2">Contraseña Temporal *</label>
              <input v-model="formUsuario.password" type="password" placeholder="••••••••"
                     class="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm dark:text-white outline-none focus:border-red-600/50" />
            </div>
          </div>
          <div class="mt-6 flex gap-3">
            <button @click="isCreating = false" class="flex-1 py-4 bg-slate-100 dark:bg-white/5 text-[10px] font-black text-slate-400 uppercase rounded-xl">Cancelar</button>
            <button @click="handleSaveUsuario()" class="flex-1 py-4 bg-red-600 text-[10px] font-black text-white uppercase rounded-xl shadow-lg shadow-red-600/20 hover:bg-red-700 transition-colors">Registrar Usuario</button>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL: GESTIÓN DE ROLES MÚLTIPLES -->
    <div v-if="isGestionandoRoles && usuarioSeleccionado" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
      <div class="bg-white dark:bg-[#0d0d14] w-full max-w-md rounded-[2.5rem] border border-white/10 overflow-hidden animate-in zoom-in duration-300">
        <div class="p-8">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-xl font-black text-slate-800 dark:text-white uppercase italic">
              Gestionar Permisos
            </h2>
            <button @click="isGestionandoRoles = false" class="text-slate-400 hover:text-red-600 transition-colors">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>

          <!-- Info del usuario -->
          <div class="flex items-center gap-4 p-4 bg-slate-50 dark:bg-white/5 rounded-2xl mb-6 border border-slate-100 dark:border-white/5">
            <div class="w-12 h-12 rounded-full bg-sky-100 dark:bg-sky-900/30 text-sky-600 flex items-center justify-center font-black text-xl shadow-inner">
              {{ usuarioSeleccionado.persona?.nombres?.charAt(0) || '?' }}
            </div>
            <div>
              <p class="font-black text-slate-800 dark:text-white">{{ usuarioSeleccionado.persona?.nombres }} {{ usuarioSeleccionado.persona?.primer_apellido }}</p>
              <p class="text-[10px] text-slate-500 font-bold uppercase tracking-tight">{{ usuarioSeleccionado.email }}</p>
            </div>
          </div>

          <!-- Lista de Roles -->
          <div class="space-y-2 mb-8">
            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-3">Roles asignados al sistema</p>
            
            <div v-for="rol in rolesDisponibles" :key="rol.id"
                 @click="toggleRol(rol.id, rol.nombre)"
                 :class="[
                   hasRole(usuarioSeleccionado, rol.id) 
                    ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-300' 
                    : 'border-slate-100 dark:border-white/5 bg-white dark:bg-white/3 text-slate-400 hover:border-sky-200'
                 ]"
                 class="flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all group">
              <div class="flex items-center gap-3">
                <span class="material-symbols-outlined text-[20px]" 
                      :class="hasRole(usuarioSeleccionado, rol.id) ? 'text-sky-500' : 'text-slate-300'">
                  {{ hasRole(usuarioSeleccionado, rol.id) ? 'check_circle' : 'radio_button_unchecked' }}
                </span>
                <span class="text-xs font-black uppercase tracking-wide">{{ rol.nombre }}</span>
              </div>
              <div v-if="rolesCargando" class="w-4 h-4 border-2 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          </div>

          <div class="flex gap-3">
            <button @click="isGestionandoRoles = false" 
                    class="flex-1 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black uppercase tracking-widest rounded-xl shadow-xl hover:-translate-y-1 transition-all">
              Listo, Guardar
            </button>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>
