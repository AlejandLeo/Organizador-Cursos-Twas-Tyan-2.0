<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import api from '@/services/api';
import Swal from 'sweetalert2';

const tickets = ref<any[]>([]);
const loading = ref(false);
const activeTab = ref('pendientes'); // pendientes, resueltos, historial

const fetchTickets = async () => {
  loading.value = true;
  try {
    const response = await api.get('/soporte');
    tickets.value = response.data;
  } catch (error) {
    console.error('Error al cargar tickets:', error);
  } finally {
    loading.value = false;
  }
};

const filteredTickets = computed(() => {
  if (activeTab.value === 'pendientes') {
    return tickets.value.filter(t => t.estado === 0);
  } else if (activeTab.value === 'resueltos') {
    return tickets.value.filter(t => t.estado === 1);
  } else {
    return tickets.value.filter(t => t.estado === 2);
  }
});

const resolverTicket = async (id: number) => {
  const result = await Swal.fire({
    title: '¿Marcar como resuelto?',
    text: "El ticket pasará al estado final.",
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Sí, resolver',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#10b981'
  });

  if (result.isConfirmed) {
    try {
      await api.patch(`/soporte/${id}/resolver`);
      Swal.fire({ icon: 'success', title: 'Ticket Resuelto', timer: 1500, showConfirmButton: false });
      fetchTickets();
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Error al resolver' });
    }
  }
};

const archivarTicket = async (id: number) => {
  const result = await Swal.fire({
    title: '¿Mover al historial?',
    text: "El ticket se archivará y saldrá de la vista principal.",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, archivar',
    confirmButtonColor: '#64748b'
  });

  if (result.isConfirmed) {
    try {
      await api.patch(`/soporte/${id}/archivar`);
      Swal.fire({ icon: 'success', title: 'Archivado', timer: 1000, showConfirmButton: false });
      fetchTickets();
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Error al archivar' });
    }
  }
};

const resetearPassword = async (usuario: any, ticketId: number, emailSugerido: string = '') => {
  if (!usuario) {
    const result = await Swal.fire({
      title: 'Usuario no vinculado',
      text: 'Para restablecer la clave, primero debemos encontrar al usuario en el sistema. ¿Deseas buscarlo ahora?',
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: 'Sí, Vincular',
      confirmButtonColor: '#003a70'
    });

    if (result.isConfirmed) {
      await vincularUsuario(ticketId, emailSugerido);
    }
    return;
  }
// ...

  const { value: formValues } = await Swal.fire({
    title: 'Restablecer Contraseña',
    html: `
      <div class="text-left space-y-4">
        <p class="text-xs text-slate-500 font-medium">Estás a punto de cambiar el acceso para: <b>${usuario.email}</b></p>
        <div>
          <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">¿Qué portal restablecer?</label>
          <select id="swal-tipo" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:border-[#003a70] outline-none">
            <option value="principal">Portal Estudiante</option>
            <option value="ponente">Portal Ponente (Docente)</option>
          </select>
        </div>
        <div>
          <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Nueva Contraseña</label>
          <input id="swal-pass" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:border-[#003a70] outline-none" placeholder="Ingresa la nueva clave" value="${usuario.persona?.documento_identidad || ''}">
        </div>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: 'Cambiar y Resolver Ticket',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#003a70',
    preConfirm: () => {
      const password = (document.getElementById('swal-pass') as HTMLInputElement).value;
      const tipo = (document.getElementById('swal-tipo') as HTMLSelectElement).value;
      if (!password || password.length < 4) {
        Swal.showValidationMessage('La clave debe tener al menos 4 caracteres');
        return false;
      }
      return { password, tipo };
    }
  });

  if (formValues) {
    try {
      await api.patch(`/usuarios/${usuario.id}/forzar-reset`, { 
        password: formValues.password, 
        tipo: formValues.tipo 
      });
      await api.patch(`/soporte/${ticketId}/resolver`);
      Swal.fire('¡Éxito!', 'La contraseña ha sido actualizada y el ticket resuelto.', 'success');
      fetchTickets();
    } catch (error) {
      Swal.fire('Error', 'No se pudo completar el restablecimiento.', 'error');
    }
  }
};

const vincularUsuario = async (ticketId: number, emailSugerido: string) => {
  const { value: email } = await Swal.fire({
    title: 'Vincular Usuario al Ticket',
    text: 'Ingresa el correo exacto del usuario para vincularlo a este ticket y habilitar las acciones de soporte.',
    input: 'text',
    inputValue: emailSugerido,
    showCancelButton: true,
    confirmButtonText: 'Buscar y Vincular',
    confirmButtonColor: '#003a70',
    inputValidator: (value) => {
      if (!value) return 'Debes ingresar un correo';
    }
  });

  if (email) {
    try {
      // 1. Buscar al usuario
      const res = await api.get(`/usuarios/email/${email}`);
      const usuario = res.data;

      // 2. Vincular el usuario al ticket (usaremos un nuevo endpoint o el de actualizar ticket si existiera)
      // Por ahora, lo vincularemos mediante un parche en el backend
      await api.patch(`/soporte/${ticketId}/vincular/${usuario.id}`);
      
      Swal.fire('¡Vinculado!', `El ticket ahora está vinculado a ${usuario.persona?.nombres}. Ya puedes usar las acciones de soporte.`, 'success');
      fetchTickets();
    } catch (error) {
      Swal.fire('Error', 'No se encontró ningún usuario con ese correo.', 'error');
    }
  }
};

const habilitarEdicion = async (usuario: any, ticketId: number, emailSugerido: string = '') => {
  if (!usuario) {
    const result = await Swal.fire({
      title: 'Usuario no vinculado',
      text: 'Para habilitar la edición de datos, primero debemos encontrar al usuario en el sistema. ¿Deseas buscarlo ahora?',
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: 'Sí, Vincular',
      confirmButtonColor: '#003a70'
    });

    if (result.isConfirmed) {
      await vincularUsuario(ticketId, emailSugerido);
    }
    return;
  }

  const result = await Swal.fire({
    title: 'Habilitar Edición de Datos',
    text: `¿Permitir que ${usuario.persona?.nombres} edite su perfil una vez?`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Sí, habilitar',
    cancelButtonColor: '#10b981'
  });

  if (result.isConfirmed) {
    try {
      await api.patch(`/usuarios/${usuario.id}/habilitar-edicion`);
      await api.patch(`/soporte/${ticketId}/resolver`);
      Swal.fire('¡Habilitado!', 'El usuario ya puede editar sus datos. El ticket se marcó como resuelto.', 'success');
      fetchTickets();
    } catch (error) {
      Swal.fire('Error', 'No se pudo habilitar la edición.', 'error');
    }
  }
};

onMounted(() => {
  fetchTickets();
});
</script>

<template>
  <div class="space-y-6 animate-in fade-in duration-500">
    <div class="flex justify-between items-center border-b border-slate-200 dark:border-gray-800 pb-6">
      <div>
        <h2 class="text-3xl font-black text-umsa-blue dark:text-blue-400 tracking-tighter uppercase italic">Centro de Soporte y Accesos</h2>
        <p class="text-slate-500 text-sm font-medium mt-1">Gestiona solicitudes de ayuda y restablecimiento de credenciales.</p>
      </div>
      <button @click="fetchTickets" class="p-2 hover:bg-slate-100 dark:hover:bg-gray-800 rounded-full transition-colors">
        <span class="material-symbols-outlined text-slate-400">refresh</span>
      </button>
    </div>

    <!-- Pestañas de Navegación -->
    <div class="flex gap-1 bg-slate-100 dark:bg-gray-800 p-1 rounded-2xl w-fit">
      <button v-for="t in [
        { id: 'pendientes', label: 'Pendientes', icon: 'pending_actions' },
        { id: 'resueltos', label: 'Resueltos', icon: 'check_circle' },
        { id: 'historial', label: 'Historial', icon: 'history' }
      ]" :key="t.id"
        @click="activeTab = t.id"
        :class="[
          'flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all',
          activeTab === t.id ? 'bg-white dark:bg-gray-700 text-umsa-blue shadow-sm' : 'text-slate-500 hover:text-slate-700'
        ]">
        <span class="material-symbols-outlined text-sm">{{ t.icon }}</span>
        {{ t.label }}
      </button>
    </div>

    <div v-if="loading" class="flex justify-center py-20">
      <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-umsa-blue"></div>
    </div>

    <div v-else-if="filteredTickets.length === 0" class="bg-white dark:bg-gray-900 rounded-2xl p-20 text-center border border-slate-100 dark:border-gray-800">
      <span class="material-symbols-outlined text-6xl text-slate-200 dark:text-gray-800 mb-4">support_agent</span>
      <p class="text-slate-400 font-bold uppercase tracking-widest text-xs">No hay solicitudes en esta sección</p>
    </div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div v-for="ticket in filteredTickets" :key="ticket.id" 
        class="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-6 hover:shadow-lg transition-all relative overflow-hidden group">
        
        <div :class="[
          ticket.estado === 1 ? 'bg-emerald-500' : ticket.estado === 2 ? 'bg-slate-400' : 'bg-amber-500', 
          'absolute left-0 top-0 bottom-0 w-1.5'
        ]"></div>

        <div class="flex justify-between items-start mb-4">
          <div class="flex items-center gap-3">
            <div :class="[
              'w-10 h-10 rounded-xl flex items-center justify-center',
              ticket.tipo === 'password' ? 'bg-blue-100 text-blue-600' : ticket.tipo === 'datos' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-600'
            ]">
              <span class="material-symbols-outlined text-[20px]">
                {{ ticket.tipo === 'password' ? 'lock_reset' : ticket.tipo === 'datos' ? 'edit_note' : 'help' }}
              </span>
            </div>
            <div>
              <p class="text-[10px] font-black uppercase text-slate-400 leading-none mb-1">Asunto:</p>
              <h4 class="text-sm font-black text-slate-800 dark:text-white uppercase">{{ ticket.tipo === 'password' ? 'Acceso / Password' : ticket.tipo }}</h4>
            </div>
          </div>
          
          <div class="flex items-center gap-2">
            <span :class="[
              'text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-widest',
              ticket.estado === 1 ? 'bg-emerald-100 text-emerald-600' : ticket.estado === 2 ? 'bg-slate-100 text-slate-500' : 'bg-amber-100 text-amber-600'
            ]">
              {{ ticket.estado === 1 ? 'Resuelto' : ticket.estado === 2 ? 'Archivado' : 'Pendiente' }}
            </span>
            
            <!-- Botón de Borrar (solo para resueltos) -->
            <button v-if="ticket.estado === 1" @click="archivarTicket(ticket.id)" 
              class="text-slate-300 hover:text-red-500 transition-colors">
              <span class="material-symbols-outlined text-lg">delete</span>
            </button>
          </div>
        </div>

        <div class="bg-slate-50 dark:bg-gray-800/50 rounded-xl p-4 mb-4 border border-slate-100 dark:border-gray-800">
          <p class="text-[10px] font-black uppercase text-slate-400 mb-2">Mensaje del Usuario:</p>
          <p class="text-sm text-slate-700 dark:text-gray-300 font-medium leading-relaxed italic">
            "{{ ticket.mensaje }}"
          </p>
        </div>

        <div class="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-gray-800">
          <div class="flex items-center gap-2">
             <div class="w-8 h-8 rounded-full bg-slate-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                <span class="material-symbols-outlined text-slate-400 text-xl">account_circle</span>
             </div>
             <div>
                <p class="text-[9px] font-black text-slate-800 dark:text-white uppercase leading-none">
                  {{ ticket.usuario?.persona ? `${ticket.usuario.persona.nombres} ${ticket.usuario.persona.primer_apellido}` : 'Usuario Externo' }}
                </p>
                <div class="flex items-center gap-2 mt-1">
                  <p class="text-[8px] text-slate-400 font-medium">{{ ticket.usuario?.email || 'Sin cuenta vinculada' }}</p>
                  <!-- Botón Vincular si no hay usuario -->
                  <button v-if="!ticket.usuario" @click="vincularUsuario(ticket.id, ticket.email || '')"
                    class="text-umsa-blue hover:underline text-[8px] font-bold uppercase tracking-tighter">
                    [Vincular Usuario]
                  </button>
                </div>
             </div>
          </div>
          <div class="flex items-center gap-3">
            <span class="text-[8px] font-bold text-slate-400 uppercase">{{ new Date(ticket.fechaCreacion).toLocaleString() }}</span>
            
            <template v-if="ticket.estado === 0">
              <!-- Botón Restablecer Clave -->
              <button @click="resetearPassword(ticket.usuario, ticket.id, ticket.email)"
                class="bg-umsa-blue hover:bg-blue-900 text-white px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-colors flex items-center gap-1 shadow-sm">
                <span class="material-symbols-outlined text-[14px]">key</span>
                Restablecer Clave
              </button>

              <!-- Botón Habilitar Edición -->
              <button @click="habilitarEdicion(ticket.usuario, ticket.id, ticket.email)"
                class="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-colors flex items-center gap-1 shadow-sm">
                <span class="material-symbols-outlined text-[14px]">edit</span>
                Habilitar Edición
              </button>

              <!-- Botón Resolver (General) -->
              <button @click="resolverTicket(ticket.id)"
                class="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors shadow-sm">
                Listo / Resolver
              </button>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
