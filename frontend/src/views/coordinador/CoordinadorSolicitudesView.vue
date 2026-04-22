<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import api from '@/services/api';
import Swal from 'sweetalert2';
import type { Inscripcion, Actividad, Persona } from '@/types/admin';

const inscripciones = ref<Inscripcion[]>([]);
const loading = ref(true);
const selectActividadId = ref<number | 'todas'>('todas');
const actividadesList = ref<Actividad[]>([]);

const parseFullName = (persona?: Persona) => {
  if (!persona) return 'Usuario Sin Datos';
  return `${persona.primer_apellido} ${persona.segundo_apellido || ''} ${persona.nombres}`.trim();
};

const fetchInscripciones = async () => {
    try {
        loading.value = true;
        const response = await api.get('/inscripciones');
        const data = response.data.data || response.data; // Handles paginated or raw array
        if(Array.isArray(data)){
            inscripciones.value = data;
            
            // Extract distinct activities for filtering
            const actsMap = new Map<number, Actividad>();
            data.forEach(i => {
                if(i.actividadAcademica) {
                    actsMap.set(i.actividadAcademica.id, i.actividadAcademica);
                }
            });
            actividadesList.value = Array.from(actsMap.values());
        }
    } catch (error) {
        console.error('Error fetched pre-inscripciones', error);
        Swal.fire('Error', 'No se pudieron recuperar las solicitudes', 'error');
    } finally {
        loading.value = false;
    }
};

onMounted(fetchInscripciones);

const pendingInscripciones = computed(() => {
  let list = inscripciones.value.filter(i => i.estado === 0);
  if (selectActividadId.value !== 'todas') {
      list = list.filter(i => i.actividadAcademica?.id === selectActividadId.value);
  }
  return list;
});

const aprobar = async (id: number) => {
  try {
    const { isConfirmed } = await Swal.fire({
      title: '¿Aprobar Solicitud?',
      text: 'El estudiante será inscrito formalmente en la actividad.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Aprobar',
      cancelButtonText: 'Cancelar'
    });

    if (!isConfirmed) return;

    // Call PUT /inscripciones/:id with estado 1 (Aprobado)
    await api.put(`/inscripciones/${id}`, { estado: 1 });
    
    Swal.fire({
        icon: 'success',
        title: 'Aprobado',
        text: 'La inscripción ha sido confirmada.',
        timer: 1500,
        showConfirmButton: false
    });
    
    await fetchInscripciones();
  } catch (error) {
    console.error(error);
    Swal.fire('Error', 'No se pudo aprobar la solicitud', 'error');
  }
};

const rechazar = async (id: number) => {
  try {
    const { isConfirmed } = await Swal.fire({
      title: '¿Rechazar Solicitud?',
      text: 'El estudiante no será inscrito en la actividad.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Rechazar',
      cancelButtonText: 'Cancelar'
    });

    if (!isConfirmed) return;

    // Call PUT /inscripciones/:id con estado 2 (Rechazado)
    await api.put(`/inscripciones/${id}`, { estado: 2 });
    
    Swal.fire({
        icon: 'success',
        title: 'Rechazado',
        text: 'La pre-inscripción ha sido rechazada.',
        timer: 1500,
        showConfirmButton: false
    });
    
    await fetchInscripciones();
  } catch (error) {
    console.error(error);
    Swal.fire('Error', 'No se pudo rechazar la solicitud', 'error');
  }
};

const verDetalle = (item: Inscripcion) => {
    Swal.fire({
        title: 'Ficha de Inscripción',
        html: `
            <div class="text-left text-sm space-y-4 mt-6">
                <div class="bg-slate-50 dark:bg-gray-800 p-6 rounded-3xl border border-slate-200 dark:border-gray-700">
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Estudiante</p>
                    <p class="font-black text-primary-dark dark:text-white uppercase">${parseFullName(item.usuario?.persona)}</p>
                    <p class="text-xs font-bold text-slate-400">CI: ${item.usuario?.persona?.documento_identidad}</p>
                </div>
                <div>
                   <p class="text-[10px] font-black text-umsa-blue uppercase tracking-widest mb-1">Actividad Académica</p>
                   <p class="text-xs font-bold text-primary-dark dark:text-white uppercase">${item.actividadAcademica?.tipo} en ${item.actividadAcademica?.nombre}</p>
                   <p class="text-[10px] font-black text-umsa-gold uppercase mt-1">Evento: ${item.actividadAcademica?.evento?.nombre}</p>
                </div>
                <div class="bg-blue-50 dark:bg-blue-900/10 p-5 rounded-2xl border-l-4 border-umsa-blue">
                    <p class="font-bold text-[10px] uppercase tracking-widest text-umsa-blue mb-2">Motivación del Estudiante:</p>
                    <p class="italic text-slate-600 dark:text-gray-300">"${item.razon || 'No se proporcionó una razón'}"</p>
                </div>
            </div>
        `,
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#002147'
    });
};

</script>

<template>
  <div class="animate-in fade-in duration-500 max-w-7xl mx-auto space-y-8">
    <div class="relative bg-white dark:bg-slate-800 rounded-[2.5rem] p-8 md:p-12 overflow-hidden shadow-sm border border-sky-100 dark:border-slate-700 group">
      <!-- Decoración sutil -->
      <div class="absolute top-0 right-0 w-64 h-64 bg-sky-50 dark:bg-sky-900/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
      <div class="absolute inset-0 bg-gradient-to-br from-sky-50/50 to-transparent dark:from-sky-900/5 pointer-events-none"></div>

      <div class="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
        <div class="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
          <div class="w-20 h-20 bg-sky-100 dark:bg-sky-900/30 rounded-3xl flex items-center justify-center shadow-sm border border-sky-200 dark:border-sky-800 transition-transform duration-500">
            <span class="material-symbols-outlined text-4xl text-sky-600 dark:text-sky-400">how_to_reg</span>
          </div>
          <div>
            <h2 class="text-4xl md:text-5xl font-black text-sky-950 dark:text-white italic uppercase tracking-tighter leading-none">
              Gestión de <span class="text-sky-600">Solicitudes</span>
            </h2>
            <p class="text-slate-400 dark:text-slate-500 text-[10px] md:text-xs font-black uppercase tracking-[0.3em] mt-3 flex items-center justify-center md:justify-start gap-2">
               <span class="w-5 h-px bg-sky-400"></span> Registro Global de Postulantes
            </p>
          </div>
        </div>

        <div class="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
          <div class="relative w-full sm:w-72 group/filter">
            <label class="absolute -top-2.5 left-5 px-2 bg-white dark:bg-slate-800 text-[9px] font-black text-sky-600 dark:text-sky-400 uppercase tracking-widest z-10">Filtrar por actividad</label>
            <div class="relative">
              <span class="absolute inset-y-0 left-4 flex items-center text-sky-400">
                <span class="material-symbols-outlined text-[18px]">filter_list</span>
              </span>
              <select v-model="selectActividadId" class="w-full pl-12 pr-10 py-4 bg-slate-50 dark:bg-slate-900/50 border border-sky-100 dark:border-slate-700 text-sky-900 dark:text-white rounded-2xl text-xs font-bold outline-none focus:border-sky-400 transition-all appearance-none cursor-pointer">
                <option value="todas">Todas las Solicitudes</option>
                <option v-for="act in actividadesList" :key="act.id" :value="act.id">
                    {{ act.tipo }} • {{ act.nombre }}
                </option>
              </select>
              <span class="absolute inset-y-0 right-4 flex items-center text-sky-300 pointer-events-none">
                <span class="material-symbols-outlined">expand_more</span>
              </span>
            </div>
          </div>
          
          <div class="hidden sm:flex flex-col items-end border-l border-sky-100 dark:border-slate-700 pl-6">
            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Pendientes</p>
            <p class="text-3xl font-black text-sky-900 dark:text-white italic">{{ pendingInscripciones.length }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Filtros y Estado Generales -->
    <div class="bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-gray-800 overflow-hidden">
      <div class="p-6 bg-slate-50 dark:bg-gray-800 border-b border-slate-200 dark:border-gray-700 flex justify-between items-center">
            <div>
                <h3 class="text-[12px] font-black text-primary-dark dark:text-white uppercase tracking-widest">Solicitudes Pendientes</h3>
                <p class="text-[10px] text-slate-500 mt-1 font-bold">{{ pendingInscripciones.length }} Registros encontrados</p>
            </div>
            <button @click="fetchInscripciones" class="p-2 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg text-slate-400 hover:text-emerald-500 transition-colors">
                <span class="material-symbols-outlined text-[18px]">refresh</span>
            </button>
      </div>

      <div class="w-full overflow-x-auto">
        <table class="w-full text-left">
            <thead class="bg-slate-50 dark:bg-gray-800/50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-200 dark:border-gray-800">
                <tr>
                    <th class="px-6 py-4">Fecha Solicitud</th>
                    <th class="px-6 py-4">Evento / Congreso</th>
                    <th class="px-6 py-4">Estudiante</th>
                    <th class="px-6 py-4">Actividad Académica</th>
                    <th class="px-6 py-4 text-center">Miembro TYAN</th>
                    <th class="px-6 py-4 text-center">Acciones</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-gray-800">
                <tr v-if="loading" class="bg-white dark:bg-gray-900">
                    <td colspan="5" class="py-12 text-center text-slate-400 text-xs font-bold uppercase tracking-widest"><span class="material-symbols-outlined animate-spin align-middle mr-2">refresh</span> Cargando...</td>
                </tr>
                <tr v-if="!loading && pendingInscripciones.length === 0" class="bg-white dark:bg-gray-900">
                    <td colspan="5" class="py-12 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">No hay solicitudes pendientes</td>
                </tr>
                <tr v-for="item in pendingInscripciones" :key="item.id || item.id_inscripcion" class="hover:bg-slate-50 dark:hover:bg-gray-800/80 transition-colors">
                    <td class="px-6 py-4">
                        <span class="text-xs font-bold text-slate-500 dark:text-gray-400">{{ new Date(item.fecha_creacion).toLocaleDateString() }}</span>
                    </td>
                    <td class="px-6 py-4">
                        <p class="text-[10px] font-black text-umsa-gold uppercase tracking-tighter">{{ item.actividadAcademica?.evento?.nombre }}</p>
                    </td>
                    <td class="px-6 py-4">
                        <p class="font-black text-primary-dark dark:text-white text-xs uppercase">{{ parseFullName(item.usuario?.persona) }}</p>
                        <p class="text-[10px] text-slate-400 font-medium">ID Usuario: {{ item.usuario?.id }}</p>
                    </td>
                    <td class="px-6 py-4">
                        <p class="text-[10px] font-black text-sky-600 dark:text-sky-400 uppercase tracking-widest">{{ item.actividadAcademica?.tipo }}</p>
                        <p class="text-xs font-bold text-slate-500 truncate max-w-[200px]">{{ item.actividadAcademica?.nombre }}</p>
                    </td>
                    <td class="px-6 py-4 text-center">
                        <span v-if="item.miembro_tyan == 1" class="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full text-[9px] font-black uppercase">SÍ</span>
                        <span v-else class="bg-slate-100 dark:bg-gray-800 text-slate-500 px-3 py-1 rounded-full text-[9px] font-black uppercase">NO</span>
                    </td>
                    <td class="px-6 py-4 flex justify-center gap-2">
                        <button @click="verDetalle(item)" class="p-2 border border-slate-200 dark:border-gray-700 text-slate-500 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-800 transition-all group" title="Ver Detalles">
                            <span class="material-symbols-outlined text-[16px] group-hover:text-blue-500">visibility</span>
                        </button>
                        <button @click="aprobar(item.id || item.id_inscripcion!)" class="p-2 border border-emerald-200 dark:border-emerald-900/50 text-emerald-500 rounded-lg hover:bg-emerald-500 hover:text-white transition-all group" title="Aprobar Solicitud">
                            <span class="material-symbols-outlined text-[16px]">check</span>
                        </button>
                        <button @click="rechazar(item.id || item.id_inscripcion!)" class="p-2 border border-red-200 dark:border-red-900/50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all group" title="Rechazar Solicitud">
                            <span class="material-symbols-outlined text-[16px]">close</span>
                        </button>
                    </td>
                </tr>
            </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
