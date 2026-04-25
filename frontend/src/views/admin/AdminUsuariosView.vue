<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useAdminHistorialStore } from '@/stores/adminHistorial';
import api from '@/services/api';
import Swal from 'sweetalert2';

const historialStore = useAdminHistorialStore();
const usuarios = ref<any[]>([]);
const isLoading = ref(true);
const filtroTexto = ref('');
const filtroRol = ref('');

// --- Estado del Formulario ---
const isCreating = ref(false);
const rolesDisponibles = [
  { id: 2, nombre: 'Coordinador' },
  { id: 4, nombre: 'Ponente' },
  { id: 3, nombre: 'Estudiante' }
];

const formUsuario = ref({
  email: '',
  password: '',
  nombres: '',
  primer_apellido: '',
  segundo_apellido: '',
  cedula: '',
  rol_id: 2 
});

const fetchUsuarios = async () => {
  try {
    isLoading.value = true;
    const res = await api.get('/usuarios');
    usuarios.value = res.data;
  } catch (error) {
    // Silently handle for now
  } finally {
    isLoading.value = false;
  }
};

const usuariosFiltrados = computed(() => {
  return usuarios.value.filter(u => {
    const nombresFull = `${u.persona?.nombres} ${u.persona?.primer_apellido}`.toLowerCase();
    const coincideTexto = nombresFull.includes(filtroTexto.value.toLowerCase()) || u.email.toLowerCase().includes(filtroTexto.value.toLowerCase());
    const coincideRol = !filtroRol.value || u.usuariosRoles?.some((ur: any) => ur.rol?.id === Number(filtroRol.value));
    return coincideTexto && coincideRol;
  });
});

const handleSaveUsuario = async () => {
  try {
    // await api.post('/usuarios', formUsuario.value);
    
    // REGISTRO PRIMORDIAL EN HISTORIAL
    const rolName = rolesDisponibles.find(r => r.id === formUsuario.value.rol_id)?.nombre || 'Usuario';
    historialStore.registrar(
      'usuario', 
      'crear', 
      `Creó nuevo ${rolName}: ${formUsuario.value.email}`,
      { entidadNombre: formUsuario.value.email }
    );
    
    Swal.fire('Éxito', `${rolName} creado correctamente`, 'success');
    isCreating.value = false;
    fetchUsuarios();
  } catch (error: any) {
    Swal.fire('Error', 'No se pudo crear el usuario', 'error');
  }
};

const toggleEstado = async (user: any) => {
  const nuevoEstado = !user.activo;
  try {
    // await api.patch(`/usuarios/${user.id}/status`, { activo: nuevoEstado });
    user.activo = nuevoEstado;
    
    // REGISTRO PRIMORDIAL EN HISTORIAL
    historialStore.registrar(
      'usuario', 
      'editar', 
      `Cambió estado de ${user.email} a ${nuevoEstado ? 'Activo' : 'Bloqueado'}`,
      { entidadId: user.id, entidadNombre: user.email }
    );
    Swal.fire('Éxito', 'Estado actualizado', 'success');
  } catch (error) {
    Swal.fire('Error', 'No se pudo actualizar', 'error');
  }
};

onMounted(() => {
  fetchUsuarios();
});
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
        <p class="text-slate-500 text-sm ml-1">Crea y administra cualquier rol del sistema desde un solo lugar</p>
      </div>

      <button @click="isCreating = true" 
              class="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-600/20 group">
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
    <div class="bg-white dark:bg-[#13131f] border border-slate-200 dark:border-white/5 rounded-[2.5rem] overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead class="bg-slate-50 dark:bg-white/5 text-[10px] font-black text-slate-500 uppercase tracking-widest">
            <tr>
              <th class="px-6 py-4">Usuario</th>
              <th class="px-6 py-4">Rol</th>
              <th class="px-6 py-4 text-center">Estado</th>
              <th class="px-6 py-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-white/5">
            <tr v-for="user in usuariosFiltrados" :key="user.id" class="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/20 text-red-600 flex items-center justify-center font-black">
                    {{ user.persona?.nombres?.charAt(0) || '?' }}
                  </div>
                  <div>
                    <p class="text-sm font-black text-slate-800 dark:text-white">{{ user.persona?.nombres }} {{ user.persona?.primer_apellido }}</p>
                    <p class="text-[10px] text-slate-500 font-bold uppercase">{{ user.email }}</p>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4">
                <div class="flex gap-1 flex-wrap">
                  <span v-for="ur in user.usuariosRoles" :key="ur.rol?.id"
                        class="px-2 py-0.5 rounded bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-[9px] font-black text-slate-500 uppercase">
                    {{ ur.rol?.nombre_rol }}
                  </span>
                </div>
              </td>
              <td class="px-6 py-4 text-center">
                <span :class="user.activo ? 'text-emerald-500' : 'text-red-500'" class="text-[9px] font-black uppercase">
                  {{ user.activo ? 'ACTIVO' : 'BLOQUEADO' }}
                </span>
              </td>
              <td class="px-6 py-4 text-right">
                <button @click="toggleEstado(user)" :title="user.activo ? 'Desactivar' : 'Activar'"
                        class="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-600 transition-all">
                  <span class="material-symbols-outlined text-[18px]">{{ user.activo ? 'lock' : 'lock_open' }}</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- MODAL NUEVO USUARIO -->
    <div v-if="isCreating" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm shadow-2xl">
      <div class="bg-white dark:bg-[#0d0d14] w-full max-w-lg rounded-[2.5rem] border border-white/10 overflow-hidden animate-in zoom-in duration-300">
        <div class="p-8">
          <div class="flex justify-between items-center mb-8">
            <h2 class="text-xl font-black text-slate-800 dark:text-white uppercase italic">Crear Nuevo Acceso</h2>
            <button @click="isCreating = false" class="text-slate-400 hover:text-red-600 transition-colors">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>

          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-1">
                <label class="text-[10px] font-black text-slate-500 uppercase ml-2">Nombres</label>
                <input v-model="formUsuario.nombres" type="text" class="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm text-slate-800 dark:text-white outline-none focus:border-red-600/50" />
              </div>
              <div class="space-y-1">
                <label class="text-[10px] font-black text-slate-500 uppercase ml-2">Apellidos</label>
                <input v-model="formUsuario.primer_apellido" type="text" class="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm text-slate-800 dark:text-white outline-none focus:border-red-600/50" />
              </div>
            </div>

            <div class="space-y-1">
              <label class="text-[10px] font-black text-slate-500 uppercase ml-2">Rol del Sistema</label>
              <select v-model="formUsuario.rol_id" class="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm text-slate-800 dark:text-white outline-none focus:border-red-600/50 font-bold uppercase">
                <option v-for="rol in rolesDisponibles" :key="rol.id" :value="rol.id">{{ rol.nombre }}</option>
              </select>
            </div>

            <div class="space-y-1">
              <label class="text-[10px] font-black text-slate-500 uppercase ml-2">Correo Electrónico</label>
              <input v-model="formUsuario.email" type="email" class="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm text-slate-800 dark:text-white outline-none focus:border-red-600/50" />
            </div>

            <div class="space-y-1">
              <label class="text-[10px] font-black text-slate-500 uppercase ml-2">Password Temporal</label>
              <input v-model="formUsuario.password" type="password" class="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 text-sm text-slate-800 dark:text-white outline-none focus:border-red-600/50" placeholder="••••••••" />
            </div>
          </div>

          <div class="mt-8 flex gap-3">
            <button @click="isCreating = false" class="flex-1 py-4 bg-slate-100 dark:bg-white/5 text-[10px] font-black text-slate-400 uppercase rounded-2xl">Cancelar</button>
            <button @click="handleSaveUsuario()" class="flex-1 py-4 bg-red-600 text-[10px] font-black text-white uppercase rounded-2xl shadow-lg shadow-red-600/20">Registrar Usuario</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
