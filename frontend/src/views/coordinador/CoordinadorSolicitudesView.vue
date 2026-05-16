<script setup lang="ts">
import { ref, onMounted } from 'vue';
import api from '@/services/api';
import Swal from 'sweetalert2';
import type { Persona } from '@/types/admin';
import { useAuthStore } from '@/stores/auth';


const authStore = useAuthStore();

const activeTab = ref('cuentas');
const personalLogistica = ref<any[]>([]);
const cuentasPendientes = ref<any[]>([]);
const allUsers = ref<any[]>([]);
const loading = ref(true);
const searchTerm = ref('');

// ── Plantilla correo bienvenida ────────────────────────────────────────────
const plantillasCorreo = ref<any[]>([]);
const selectedTemplateId = ref('');
const showMailPreview = ref(false);
const mailPreviewHtml = ref('');

const fetchPlantillas = async () => {
  try {
    const res = await api.get('/admin/mail-templates');
    plantillasCorreo.value = res.data || [];
  } catch { /* silencioso */ }
};

const openMailPreview = async () => {
  mailPreviewHtml.value = '';
  if (!selectedTemplateId.value) {
    try {
      const res = await api.get('/admin/mail-templates/default-preview');
      mailPreviewHtml.value = res.data?.html || '<p>No se pudo cargar.</p>';
    } catch {
      mailPreviewHtml.value = '<p style="color:red">Error al cargar admission.hbs</p>';
    }
  } else {
    const t = plantillasCorreo.value.find((p: any) => String(p.id) === selectedTemplateId.value);
    if (!t) return;
    try {
      const resLayout = await api.get('/admin/configuracion/key/MAIL_MASTER_LAYOUT');
      const resUrl    = await api.get('/admin/configuracion/key/SYSTEM_URL');
      const masterLayout = resLayout.data?.valor || '<html><body>{{{content}}}</body></html>';
      const systemUrl    = resUrl.data?.valor    || window.location.origin;
      const ctx: Record<string, string | number> = {
        nombre: 'Juan Pérez', name: 'Juan Pérez', email: 'ejemplo@correo.com',
        password: 'Contraseña123', url_sistema: systemUrl, loginUrl: systemUrl,
        year: new Date().getFullYear(),
      };
      let html = (t.cuerpo || '').replace(/\n/g, '<br>');
      Object.keys(ctx).forEach(k => { html = html.replace(new RegExp(`{{${k}}}`, 'g'), String(ctx[k])); });
      mailPreviewHtml.value = masterLayout.replace('{{{content}}}', html).replace('{{year}}', String(new Date().getFullYear()));
    } catch {
      mailPreviewHtml.value = '<p style="color:red">Error al renderizar.</p>';
    }
  }
  showMailPreview.value = true;
};

// ──────────────────────────────────────────────────────────────────────────



const parseFullName = (persona?: Persona) => {
  if (!persona) return 'Usuario Sin Datos';
  return `${persona.primer_apellido} ${persona.segundo_apellido || ''} ${persona.nombres}`.trim();
};

const fetchCuentasPendientes = async () => {
    try {
        loading.value = true;
        const response = await api.get('/usuarios/solicitudes/pendientes');
        cuentasPendientes.value = response.data || [];
    } catch (error) {
        console.error('Error fetching cuentas pendientes', error);
        Swal.fire('Error', 'No se pudieron recuperar las solicitudes de registro de cuentas', 'error');
    } finally {
        loading.value = false;
    }
};

const fetchPersonalLogistica = async () => {
    try {
        loading.value = true;
        // El seeder usa 'Logistica' (sin tilde)
        const response = await api.get('/usuarios', { params: { rol: 'Logistica' } });
        // findConFiltros devuelve { data, total, ... }
        personalLogistica.value = response.data.data || [];
    } catch (error) {
        console.error('Error fetching personal logistica', error);
    } finally {
        loading.value = false;
    }
};

const fetchAllUsers = async () => {
    if (searchTerm.value.length < 3) return;
    try {
        const response = await api.get('/usuarios', { params: { q: searchTerm.value } });
        // findConFiltros devuelve { data, total, ... }, tomamos data
        allUsers.value = response.data.data || [];
    } catch (error) {
        console.error('Error searching users', error);
    }
};

const refreshData = () => {
    if (activeTab.value === 'cuentas') fetchCuentasPendientes();
    else fetchPersonalLogistica();
};

onMounted(() => { refreshData(); fetchPlantillas(); });




const asignarLogistica = async (userId: number) => {
    try {
        const { isConfirmed } = await Swal.fire({
            title: '¿Designar como Logística?',
            text: 'Este usuario podrá escanear QRs y registrar asistencias.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, Designar',
            cancelButtonText: 'Cancelar'
        });

        if (!isConfirmed) return;

        // Endpoint para asignar rol
        await api.post(`/usuarios/${userId}/roles/asignar`, { rolId: 3 });
        Swal.fire('Éxito', 'Usuario designado como personal de logística', 'success');
        searchTerm.value = '';
        allUsers.value = [];
        fetchPersonalLogistica();
    } catch (error: any) {
        console.error(error);
        const msg = error.response?.data?.message || 'No se pudo asignar el rol';
        Swal.fire('Error', msg, 'error');
    }
};

const quitarLogistica = async (userId: number) => {
    try {
        const { isConfirmed } = await Swal.fire({
            title: '¿Quitar cargo de Logística?',
            text: 'El usuario perderá el acceso al portal de logística.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí, Quitar',
            cancelButtonText: 'No, Mantener'
        });

        if (!isConfirmed) return;

        await api.post(`/usuarios/${userId}/roles/quitar`, { rolId: 3 });
        Swal.fire('Actualizado', 'Se ha retirado el rol de logística', 'success');
        fetchPersonalLogistica();
    } catch (error: any) {
        console.error(error);
        const msg = error.response?.data?.message || 'No se pudo retirar el rol';
        Swal.fire('Error', msg, 'error');
    }
};

const eliminarFisico = async (userId: number) => {
    try {
        const { isConfirmed } = await Swal.fire({
            title: '¿ELIMINAR COMPLETAMENTE?',
            text: 'Esta acción borrará al usuario y su perfil de la base de datos de forma permanente. Use esto solo para limpiar errores de creación.',
            icon: 'error',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Sí, Borrar de Raíz',
            cancelButtonText: 'Cancelar'
        });

        if (!isConfirmed) return;

        await api.delete(`/usuarios/${userId}/fisico`);
        Swal.fire('Eliminado', 'Usuario borrado de la base de datos.', 'success');
        fetchPersonalLogistica();
    } catch (error: any) {
        console.error(error);
        const msg = error.response?.data?.message || 'No se pudo eliminar físicamente';
        Swal.fire('Error', msg, 'error');
    }
};

// Eliminada lógica de reactivación de actividades por petición del usuario

// ============================================
// LOGICA DE CUENTAS PENDIENTES
// ============================================
// ... rest of logic stays similar but integrated ...

const aprobarCuenta = async (id: number) => {
    try {
        const { isConfirmed } = await Swal.fire({
            title: '¿Aprobar Cuenta?',
            text: 'El usuario podrá iniciar sesión en la plataforma.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Aprobar',
            cancelButtonText: 'Cancelar'
        });

        if (!isConfirmed) return;

        const res = await api.patch(`/usuarios/${id}/solicitud/aprobar`);
        const data = res.data as any;
        if (data.correoEnviado) {
            Swal.fire({ icon: 'success', title: 'Cuenta Aprobada', text: 'El usuario ya puede acceder al sistema y su correo fue encolado.', timer: 2000, showConfirmButton: false });
        } else {
            Swal.fire({ icon: 'success', title: 'Cuenta Aprobada', text: 'El usuario ya puede acceder al sistema.', timer: 1500, showConfirmButton: false });
        }
        await fetchCuentasPendientes();
    } catch (error) {
        console.error(error);
        Swal.fire('Error', 'No se pudo aprobar la cuenta', 'error');
    }
};

const rechazarCuenta = async (id: number) => {
    try {
        const { value: motivo, isConfirmed } = await Swal.fire({
            title: '¿Rechazar Cuenta?',
            text: 'Indique el motivo del rechazo para informar al usuario:',
            input: 'textarea',
            inputPlaceholder: 'Ej: El documento de aval es ilegible...',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Rechazar',
            cancelButtonText: 'Cancelar',
            inputValidator: (value) => {
                if (!value) {
                    return '¡Debes escribir un motivo para el rechazo!';
                }
            }
        });

        if (!isConfirmed) return;

        const res = await api.patch(`/usuarios/${id}/solicitud/rechazar`, { motivo });
        const data = res.data as any;
        if (data.correoEnviado) {
            Swal.fire({ icon: 'success', title: 'Cuenta Rechazada', text: 'La solicitud ha sido rechazada y el correo de notificación fue encolado.', timer: 2000, showConfirmButton: false });
        } else {
            Swal.fire({ icon: 'success', title: 'Cuenta Rechazada', text: 'La solicitud ha sido rechazada.', timer: 1500, showConfirmButton: false });
        }
        await fetchCuentasPendientes();
    } catch (error) {
        console.error(error);
        Swal.fire('Error', 'No se pudo rechazar la cuenta', 'error');
    }
};

const verDocumento = async (id: number, parte?: 'anverso' | 'reverso') => {
    try {
        const response = await api.get(`/usuarios/${id}/doc-aval`, {
            params: { parte },
            responseType: 'arraybuffer'
        });
        
        const blob = new Blob([response.data], { type: (response.headers['content-type'] as string) || 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
    } catch (error) {
        console.error(error);
        Swal.fire('Error', 'No se pudo cargar el documento. Asegúrese de que su sesión esté activa.', 'error');
    }
};

const tieneReverso = (firmaDig?: string) => {
    return firmaDig?.includes('|');
};
</script>

<template>
  <div class="animate-in fade-in duration-500 max-w-7xl mx-auto space-y-8">
    <div class="relative bg-white dark:bg-slate-800 rounded-[2.5rem] p-8 md:p-12 overflow-hidden shadow-sm border border-sky-100 dark:border-slate-700 group">
      <div class="absolute top-0 right-0 w-64 h-64 bg-sky-50 dark:bg-sky-900/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
      <div class="absolute inset-0 bg-gradient-to-br from-sky-50/50 to-transparent dark:from-sky-900/5 pointer-events-none"></div>

      <div class="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
        <div class="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
          <div class="w-20 h-20 bg-sky-100 dark:bg-sky-900/30 rounded-3xl flex items-center justify-center shadow-sm border border-sky-200 dark:border-sky-800 transition-transform duration-500">
            <span class="material-symbols-outlined text-4xl text-sky-600 dark:text-sky-400">person_add_check</span>
          </div>
          <div>
            <h2 class="text-4xl md:text-5xl font-black text-sky-950 dark:text-white italic uppercase tracking-tighter leading-none">
              Aprobación de <span class="text-sky-600">Registros</span>
            </h2>
            <p class="text-slate-400 dark:text-slate-500 text-[10px] md:text-xs font-black uppercase tracking-[0.3em] mt-3 flex items-center justify-center md:justify-start gap-2">
               <span class="w-5 h-px bg-sky-400"></span> Validación de Cuentas Pendientes
            </p>
          </div>
        </div>

        <div class="hidden sm:flex flex-col items-end border-l border-sky-100 dark:border-slate-700 pl-6">
            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Solicitudes</p>
            <p class="text-3xl font-black text-sky-900 dark:text-white italic">{{ cuentasPendientes.length }}</p>
        </div>
      </div>
    </div>

    <!-- SELECTOR DE PESTAÑAS -->
    <div class="flex items-center gap-4 bg-white dark:bg-slate-900 p-2 rounded-[2rem] border border-slate-100 dark:border-slate-800 w-fit mx-auto shadow-sm">
        <button @click="activeTab = 'cuentas'; refreshData()" 
          :class="[activeTab === 'cuentas' ? 'bg-sky-600 text-white shadow-lg shadow-sky-500/30' : 'text-slate-400 hover:text-sky-500']"
          class="flex items-center gap-3 px-8 py-4 rounded-full font-black text-[10px] uppercase tracking-widest transition-all duration-300">
          <span class="material-symbols-outlined text-sm">person_add</span>
          Cuentas Pendientes
          <span v-if="cuentasPendientes.length > 0" class="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
        </button>
        <button @click="activeTab = 'logistica'; refreshData()" 
          :class="[activeTab === 'logistica' ? 'bg-teal-600 text-white shadow-lg shadow-teal-500/30' : 'text-slate-400 hover:text-teal-500']"
          class="flex items-center gap-3 px-8 py-4 rounded-full font-black text-[10px] uppercase tracking-widest transition-all duration-300">
          <span class="material-symbols-outlined text-sm">support_agent</span>
          Designación de Logística
        </button>
    </div>

    <!-- PESTAÑA: CUENTAS -->
    <div v-if="activeTab === 'cuentas'" class="bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-gray-800 overflow-hidden relative z-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div class="p-6 bg-slate-50 dark:bg-gray-800 border-b border-slate-200 dark:border-gray-700 flex justify-between items-center">
            <div>
                <h3 class="text-[12px] font-black text-primary-dark dark:text-white uppercase tracking-widest">
                    Postulantes a la Plataforma
                </h3>
                <p class="text-[10px] text-slate-500 mt-1 font-bold">
                    {{ cuentasPendientes.length }} Cuentas nuevas por revisar
                </p>
            </div>
            <div class="flex items-center gap-3">
              <!-- Selector plantilla correo bienvenida -->
              <div class="hidden md:flex items-center gap-2 bg-white dark:bg-gray-700 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-gray-600">
                <span class="material-symbols-outlined text-slate-400 text-sm">mail</span>
                <select v-model="selectedTemplateId"
                        class="bg-transparent text-[11px] font-bold text-slate-600 dark:text-slate-300 outline-none cursor-pointer min-w-[140px]">
                  <option value="">Plantilla por Defecto (admission)</option>
                  <option v-for="p in plantillasCorreo" :key="p.id" :value="String(p.id)">{{ p.nombre }}</option>
                </select>
                <button @click="openMailPreview" class="w-6 h-6 flex items-center justify-center text-sky-500 hover:bg-sky-500/10 rounded-lg transition-all" title="Previsualizar plantilla">
                  <span class="material-symbols-outlined text-[17px]">visibility</span>
                </button>
              </div>
              <button @click="refreshData" class="p-2 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg text-slate-400 hover:text-sky-500 transition-colors">
                  <span class="material-symbols-outlined text-[18px]">refresh</span>
              </button>
            </div>
      </div>

      <div class="w-full overflow-x-auto">
        <table class="w-full text-left">
            <thead class="bg-slate-50 dark:bg-gray-800/50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-200 dark:border-gray-800">
                <tr>
                    <th class="px-6 py-4">Fecha Solicitud</th>
                    <th class="px-6 py-4">Correo (Usuario)</th>
                    <th class="px-6 py-4">Datos de Identidad</th>
                    <th class="px-6 py-4 text-center">Documento de Aval</th>
                    <th class="px-6 py-4 text-center">Acciones</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-gray-800">
                <tr v-if="loading" class="bg-white dark:bg-gray-900">
                    <td colspan="5" class="py-12 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">
                        <span class="material-symbols-outlined animate-spin align-middle mr-2">refresh</span> Cargando...
                    </td>
                </tr>
                <tr v-if="!loading && cuentasPendientes.length === 0" class="bg-white dark:bg-gray-900">
                    <td colspan="5" class="py-12 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">
                        No hay solicitudes de registro pendientes
                    </td>
                </tr>
                <tr v-for="item in cuentasPendientes" :key="item.id" class="hover:bg-slate-50 dark:hover:bg-gray-800/80 transition-colors">
                    <td class="px-6 py-4">
                        <span class="text-xs font-bold text-slate-500 dark:text-gray-400">{{ new Date(item.fecha_creacion).toLocaleDateString() }}</span>
                    </td>
                    <td class="px-6 py-4">
                        <div class="flex items-center gap-3">
                            <div class="w-8 h-8 rounded-full bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center">
                                <span class="material-symbols-outlined text-sky-600 dark:text-sky-400 text-[16px]">mail</span>
                            </div>
                            <p class="text-xs font-black text-slate-700 dark:text-slate-200">{{ item.email }}</p>
                        </div>
                    </td>
                    <td class="px-6 py-4">
                        <p class="font-black text-primary-dark dark:text-white text-xs uppercase">{{ parseFullName(item.persona) }}</p>
                        <p class="text-[10px] text-slate-400 font-medium mt-0.5">ID: {{ item.persona?.documento_identidad }}</p>
                    </td>
                    <td class="px-6 py-4 text-center">
                        <div v-if="item.persona?.firma_dig" class="flex flex-col gap-1 items-center">
                            <button @click="verDocumento(item.id)" class="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors">
                                <span class="material-symbols-outlined text-[14px]">visibility</span> 
                                {{ tieneReverso(item.persona.firma_dig) ? 'Anverso' : 'Ver Doc' }}
                            </button>
                            <button v-if="tieneReverso(item.persona.firma_dig)" @click="verDocumento(item.id, 'reverso')" class="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors">
                                <span class="material-symbols-outlined text-[14px]">visibility</span> Reverso
                            </button>
                        </div>
                        <span v-else class="text-[10px] font-bold text-slate-400 italic">No proporcionado</span>
                    </td>
                    <td class="px-6 py-4 flex justify-center gap-2">
                        <button @click="aprobarCuenta(item.id)" class="p-2 border border-emerald-200 dark:border-emerald-900/50 text-emerald-500 rounded-lg hover:bg-emerald-500 hover:text-white transition-all group" title="Aprobar Registro">
                            <span class="material-symbols-outlined text-[18px]">how_to_reg</span>
                        </button>
                        <button @click="rechazarCuenta(item.id)" class="p-2 border border-red-200 dark:border-red-900/50 text-red-500 rounded-lg hover:bg-red-50 hover:text-white transition-all group" title="Rechazar Registro">
                            <span class="material-symbols-outlined text-[18px]">person_off</span>
                        </button>
                    </td>
                </tr>
            </tbody>
        </table>
      </div>
    </div>

    <!-- PESTAÑA: LOGISTICA -->
    <div v-if="activeTab === 'logistica'" class="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        <!-- Buscador de Usuarios y Botón Crear -->
        <div class="flex flex-col lg:flex-row gap-6">
            <div class="flex-1 bg-white dark:bg-gray-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-gray-800 shadow-sm">
                <h3 class="text-[12px] font-black text-teal-600 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <span class="material-symbols-outlined">person_search</span>
                    Designar desde Usuarios Existentes
                </h3>
                
                <div class="relative max-w-2xl">
                    <input v-model="searchTerm" @input="fetchAllUsers" type="text" placeholder="Buscar por nombre, correo o documento (min. 3 caracteres)..." 
                    class="w-full bg-slate-50 dark:bg-gray-800 border-none rounded-2xl px-6 py-4 text-sm font-bold placeholder:text-slate-400 focus:ring-2 focus:ring-teal-500 transition-all outline-none">
                    <div v-if="allUsers.length > 0 && searchTerm.length >= 3" class="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-gray-700 z-20 max-h-64 overflow-y-auto overflow-x-hidden">
                        <div v-for="u in allUsers" :key="u.id" 
                        class="p-4 hover:bg-slate-50 dark:hover:bg-gray-700/50 cursor-pointer flex items-center justify-between border-b border-slate-50 dark:border-gray-700 last:border-none">
                            <div>
                                <p class="text-xs font-black text-slate-800 dark:text-white uppercase">{{ parseFullName(u.persona) }}</p>
                                <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{{ u.email }} | {{ u.persona?.documento_identidad }}</p>
                            </div>
                            <button @click="asignarLogistica(u.id)" class="px-4 py-2 bg-teal-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-teal-700 transition-colors">
                                Designar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Listado de Personal Actual -->
        <div class="bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-gray-800 overflow-hidden relative z-0">
            <div class="p-6 bg-slate-50 dark:bg-gray-800 border-b border-slate-200 dark:border-gray-700 flex justify-between items-center">
                    <div>
                        <h3 class="text-[12px] font-black text-teal-600 uppercase tracking-widest">
                            Personal de Logística Activo
                        </h3>
                        <p class="text-[10px] text-slate-500 mt-1 font-bold">
                            {{ personalLogistica.length }} usuarios autorizados para escaneo de QR
                        </p>
                    </div>
                    <button @click="refreshData" class="p-2 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg text-slate-400 hover:text-teal-500 transition-colors">
                        <span class="material-symbols-outlined text-[18px]">refresh</span>
                    </button>
            </div>

            <div class="w-full overflow-x-auto">
                <table class="w-full text-left">
                    <thead class="bg-slate-50 dark:bg-gray-800/50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-200 dark:border-gray-800">
                        <tr>
                            <th class="px-6 py-4">Usuario</th>
                            <th class="px-6 py-4">Identificación</th>
                            <th class="px-6 py-4">Correo</th>
                            <th class="px-6 py-4 text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100 dark:divide-gray-800">
                        <tr v-if="loading" class="bg-white dark:bg-gray-900">
                            <td colspan="4" class="py-12 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">
                                <span class="material-symbols-outlined animate-spin align-middle mr-2">refresh</span> Cargando...
                            </td>
                        </tr>
                        <tr v-if="!loading && personalLogistica.length === 0" class="bg-white dark:bg-gray-900">
                            <td colspan="4" class="py-12 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">
                                No se ha designado personal de logística aún
                            </td>
                        </tr>
                        <tr v-for="p in personalLogistica" :key="p.id" class="hover:bg-slate-50 dark:hover:bg-gray-800/80 transition-colors">
                            <td class="px-6 py-4">
                                <div class="flex items-center gap-4">
                                    <div class="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-900/20 text-teal-600 flex items-center justify-center font-black">
                                        {{ p.persona?.nombres?.[0] || 'L' }}
                                    </div>
                                    <div>
                                        <p class="text-[12px] font-black text-slate-800 dark:text-white uppercase">{{ parseFullName(p.persona) }}</p>
                                        <p class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Logística</p>
                                    </div>
                                </div>
                            </td>
                            <td class="px-6 py-4">
                                <p class="text-xs font-black text-slate-600 dark:text-slate-300 uppercase">{{ p.persona?.documento_identidad }}</p>
                            </td>
                            <td class="px-6 py-4">
                                <p class="text-xs font-bold text-slate-500 dark:text-gray-400">{{ p.email }}</p>
                            </td>
                            <td class="px-6 py-4 text-center flex justify-center gap-2">
                                <button @click="quitarLogistica(p.id)" 
                                  class="p-2 border border-orange-200 dark:border-orange-900/50 text-orange-500 rounded-lg hover:bg-orange-500 hover:text-white transition-all group" title="Quitar Rol de Logística">
                                  <span class="material-symbols-outlined text-[18px]">person_remove</span>
                                </button>
                                
                                <button v-if="authStore.esAdmin" @click="eliminarFisico(p.id)" 
                                  class="p-2 border border-red-200 dark:border-red-900/50 text-red-500 rounded-lg hover:bg-red-600 hover:text-white transition-all group" title="Eliminar Cuenta Permanentemente">
                                  <span class="material-symbols-outlined text-[18px]">delete_forever</span>
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <!-- Modal Previsualización Correo de Bienvenida -->
    <div v-if="showMailPreview" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div class="bg-white dark:bg-[#1a1a24] w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-white/10 flex flex-col max-h-[90vh]">
        <div class="p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-black/20">
          <h3 class="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
            <span class="material-symbols-outlined text-sky-500">mark_email_read</span>
            Vista Previa — Correo de Bienvenida
          </h3>
          <button @click="showMailPreview = false" class="w-10 h-10 rounded-full hover:bg-slate-200 dark:hover:bg-white/10 flex items-center justify-center transition-all">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        <div class="flex-1 overflow-y-auto bg-slate-100 dark:bg-black/40 p-4 md:p-8">
          <div class="bg-white rounded-xl shadow-sm overflow-hidden mx-auto max-w-[600px] border border-slate-200">
            <div v-html="mailPreviewHtml"></div>
          </div>
        </div>
        <div class="p-4 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-black/20 text-center">
          <p class="text-[10px] text-slate-400 font-medium">※ Los datos mostrados son solo de ejemplo para previsualización.</p>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
.material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; vertical-align: middle; }
</style>
