<script setup lang="ts">
import { ref, onMounted } from 'vue';
import api from '@/services/api';
import Swal from 'sweetalert2';
import type { Persona } from '@/types/admin';

const cuentasPendientes = ref<any[]>([]);
const loading = ref(true);

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

onMounted(fetchCuentasPendientes);

// ============================================
// LOGICA DE CUENTAS PENDIENTES
// ============================================

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

        await api.patch(`/usuarios/${id}/solicitud/aprobar`);
        Swal.fire({ icon: 'success', title: 'Cuenta Aprobada', text: 'El usuario ya puede acceder al sistema.', timer: 1500, showConfirmButton: false });
        await fetchCuentasPendientes();
    } catch (error) {
        console.error(error);
        Swal.fire('Error', 'No se pudo aprobar la cuenta', 'error');
    }
};

const rechazarCuenta = async (id: number) => {
    try {
        const { isConfirmed } = await Swal.fire({
            title: '¿Rechazar Cuenta?',
            text: 'La solicitud será rechazada y la cuenta quedará inactiva.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Rechazar',
            cancelButtonText: 'Cancelar'
        });

        if (!isConfirmed) return;

        await api.patch(`/usuarios/${id}/solicitud/rechazar`);
        Swal.fire({ icon: 'success', title: 'Cuenta Rechazada', text: 'La solicitud de cuenta ha sido rechazada.', timer: 1500, showConfirmButton: false });
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
            responseType: 'blob'
        });
        
        const blob = new Blob([response.data], { type: (response.headers['content-type'] as string) || undefined });
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

    <!-- Tabla Cuentas Pendientes -->
    <div class="bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-gray-800 overflow-hidden relative z-0">
      <div class="p-6 bg-slate-50 dark:bg-gray-800 border-b border-slate-200 dark:border-gray-700 flex justify-between items-center">
            <div>
                <h3 class="text-[12px] font-black text-primary-dark dark:text-white uppercase tracking-widest">
                    Postulantes a la Plataforma
                </h3>
                <p class="text-[10px] text-slate-500 mt-1 font-bold">
                    {{ cuentasPendientes.length }} Cuentas nuevas por revisar
                </p>
            </div>
            <button @click="fetchCuentasPendientes" class="p-2 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg text-slate-400 hover:text-sky-500 transition-colors">
                <span class="material-symbols-outlined text-[18px]">refresh</span>
            </button>
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
  </div>
</template>

<style scoped>
.material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; vertical-align: middle; }
</style>
