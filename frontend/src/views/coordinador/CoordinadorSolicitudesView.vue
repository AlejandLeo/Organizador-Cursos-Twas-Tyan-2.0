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
    const persona = item.usuario?.persona;
    const af = item.usuario?.afiliaciones?.[0];

    // Helper para campos de información personal
    const renderInfoRow = (label: string, value?: any, icon?: string) => {
        if (!value || value === 'No especificado' || value === '') return '';
        return `
            <div class="flex items-center gap-4 py-3 border-b border-slate-100 dark:border-gray-800/50 last:border-0 hover:bg-slate-50/50 dark:hover:bg-gray-800/30 transition-colors px-2 rounded-lg">
                <div class="w-8 h-8 rounded-lg bg-slate-100 dark:bg-gray-800 flex items-center justify-center text-slate-400">
                    <span class="material-symbols-outlined text-[18px]">${icon || 'info'}</span>
                </div>
                <div class="flex-1">
                    <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">${label}</p>
                    <p class="text-xs font-bold text-slate-700 dark:text-gray-200">${value}</p>
                </div>
            </div>
        `;
    };

    // Generar bloque de información personal
    const infoPersonalHtml = [
        renderInfoRow('Documento ID', persona?.documento_identidad, 'fingerprint'),
        renderInfoRow('Género', persona?.genero === 0 ? 'Masculino' : (persona?.genero === 1 ? 'Femenino' : 'Otro'), 'person'),
        renderInfoRow('Fecha Nacimiento', persona?.fecha_nacimiento ? new Date(persona.fecha_nacimiento).toLocaleDateString() : null, 'calendar_today'),
        renderInfoRow('Celular', persona?.celular, 'call'),
        renderInfoRow('País de Origen', persona?.pais_origen, 'public'),
        renderInfoRow('País de Residencia', persona?.pais_residencia, 'home_pin'),
    ].join('');

    // Generar bloque de requisitos adicionales
    let extraFieldsHtml = '';
    if (item.datos_adicionales && Object.keys(item.datos_adicionales).length > 0) {
        extraFieldsHtml = `
            <div class="mt-8">
                <p class="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                    <span class="w-6 h-px bg-emerald-200 dark:bg-emerald-800"></span> Requisitos de la Actividad
                </p>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    ${Object.entries(item.datos_adicionales).map(([label, value]) => `
                        <div class="p-4 bg-emerald-50/50 dark:bg-emerald-900/5 border border-emerald-100 dark:border-emerald-800/40 rounded-2xl">
                            <p class="text-[8px] font-black text-emerald-500 uppercase tracking-widest mb-1">${label}</p>
                            <p class="text-[11px] font-bold text-slate-700 dark:text-gray-200">${value}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    Swal.fire({
        html: `
            <div class="text-left text-sm max-h-[75vh] overflow-y-auto pr-2 custom-scrollbar">
                <!-- Header del Estudiante -->
                <div class="bg-gradient-to-br from-primary-dark to-sky-900 -mx-6 -mt-6 p-8 mb-8 relative overflow-hidden">
                    <div class="absolute top-0 right-0 p-4">
                        <span class="bg-white/10 backdrop-blur-md text-white/80 text-[9px] font-bold px-3 py-1 rounded-full border border-white/10 uppercase tracking-widest italic">Postulante ID: ${item.usuario?.id}</span>
                    </div>
                    <div class="relative z-10 flex items-center gap-6">
                        <div class="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-2xl">
                             <span class="material-symbols-outlined text-4xl text-primary-dark font-black">person_outline</span>
                        </div>
                        <div>
                             <h2 class="text-3xl font-black text-white italic uppercase tracking-tighter leading-none mb-2">${parseFullName(persona)}</h2>
                             <div class="flex flex-wrap gap-2">
                                <span class="bg-umsa-gold text-white text-[9px] font-black px-3 py-1 rounded-full uppercase flex items-center gap-1">
                                    <span class="material-symbols-outlined text-[10px]">workspace_premium</span>
                                    ${item.miembro_tyan === 1 ? 'Miembro TYAN' : 'No Miembro'}
                                </span>
                                <span class="bg-white/20 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase">Actividad Académica</span>
                             </div>
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <!-- Columna Izquierda: Personal y Académico -->
                    <div class="lg:col-span-12 space-y-8">
                        <div>
                            <p class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                <span class="w-6 h-px bg-slate-200 dark:bg-gray-800"></span> Información Personal
                            </p>
                            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-2 gap-x-6 bg-slate-50/50 dark:bg-gray-800/20 p-5 rounded-[2rem] border border-slate-100 dark:border-gray-800/50">
                                ${infoPersonalHtml || '<p class="text-xs text-slate-400 col-span-full py-4 text-center">No hay información personal adicional registrada.</p>'}
                            </div>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <p class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                    <span class="w-6 h-px bg-slate-200 dark:bg-gray-800"></span> Perfil Académico
                                </p>
                                <div class="bg-blue-50/50 dark:bg-blue-900/5 border border-blue-100 dark:border-blue-900/30 p-6 rounded-[2rem] relative overflow-hidden group">
                                    <span class="material-symbols-outlined absolute -right-2 -bottom-2 text-6xl text-blue-500/5 group-hover:scale-110 transition-transform">school</span>
                                    ${af ? `
                                        <div class="space-y-4 relative z-10">
                                            <div>
                                                <p class="text-[8px] font-black text-blue-400 uppercase tracking-widest mb-1">Institución / Afiliación</p>
                                                <p class="text-xs font-black text-primary-dark dark:text-blue-100 uppercase">${af.institucion}</p>
                                            </div>
                                            <div>
                                                <p class="text-[8px] font-black text-blue-400 uppercase tracking-widest mb-1">Grado Académico</p>
                                                <p class="text-xs font-black text-primary-dark dark:text-blue-200 uppercase">${af.gradoAcademico?.nombre_grado || 'S/N'}</p>
                                            </div>
                                        </div>
                                    ` : `
                                        <div class="text-center py-6">
                                            <span class="material-symbols-outlined text-slate-300 text-3xl mb-2">no_accounts</span>
                                            <p class="text-[10px] font-bold text-slate-400 uppercase">Sin información académica</p>
                                        </div>
                                    `}
                                </div>
                            </div>

                            <div>
                                <p class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                    <span class="w-6 h-px bg-slate-200 dark:bg-gray-800"></span> Motivación de Inscripción
                                </p>
                                <div class="bg-indigo-50/50 dark:bg-indigo-900/5 border border-indigo-100 dark:border-indigo-900/30 p-6 rounded-[2rem] h-full italic">
                                    <p class="text-xs text-indigo-900 dark:text-indigo-200 leading-relaxed font-medium">"${item.razon || 'No se proporcionó una razón específica.'}"</p>
                                </div>
                            </div>
                        </div>

                        ${extraFieldsHtml}
                    </div>
                </div>

                <div class="mt-8 pt-6 border-t border-slate-100 dark:border-gray-800 flex justify-between items-center text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    <span>Actividad Académica solicitada:</span>
                    <span class="text-primary-dark dark:text-sky-400">${item.actividadAcademica?.nombre}</span>
                </div>
            </div>
        `,
        width: '900px',
        showConfirmButton: false,
        showCancelButton: false,
        padding: '24px',
        customClass: {
            popup: 'rounded-[2.5rem] border-none shadow-2xl dark:bg-slate-900',
            htmlContainer: 'p-0 overflow-hidden'
        }
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
