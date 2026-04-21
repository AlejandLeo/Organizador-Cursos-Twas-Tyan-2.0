<script setup lang="ts">
import { ref, onMounted, computed, reactive } from 'vue';
import api from '@/services/api';
import Swal from 'sweetalert2';

const estudiantes = ref<any[]>([]);
const loading = ref(true);
const searchQuery = ref('');
const isEditing = ref(false);
const selectedUser = ref<any>(null);

// Formulario reactivo para edición
const form = reactive({
    persona: {
        nombres: '',
        primer_apellido: '',
        segundo_apellido: '',
        documento_identidad: '',
        genero: '',
        pais_origen: '',
        pais_residencia: '',
        celular: '',
        fecha_nacimiento: ''
    },
    institucion: '',
    especialidad: '',
    id_grado_academico: null as number | null
});

const fetchEstudiantes = async () => {
    try {
        loading.value = true;
        // El backend enriquecido devolverá inscripciones->actividad->evento
        const response = await api.get('/usuarios', { params: { rol: 'Estudiante', limit: 100 } });
        estudiantes.value = response.data.data || response.data;
    } catch (error) {
        Swal.fire('Error', 'No se pudo cargar el directorio de estudiantes', 'error');
    } finally {
        loading.value = false;
    }
};

onMounted(fetchEstudiantes);

const filteredEstudiantes = computed(() => {
    if (!searchQuery.value) return estudiantes.value;
    const q = searchQuery.value.toLowerCase();
    return estudiantes.value.filter(e => 
        e.persona?.nombres?.toLowerCase().includes(q) || 
        e.persona?.primer_apellido?.toLowerCase().includes(q) ||
        e.persona?.documento_identidad?.toLowerCase().includes(q)
    );
});

const parseName = (p: any) => `${p?.primer_apellido || ''} ${p?.segundo_apellido || ''} ${p?.nombres || ''}`.trim();

const openFicha = (usuario: any) => {
    selectedUser.value = usuario;
    // Cargar datos al formulario
    Object.assign(form.persona, usuario.persona || {});
    form.institucion = usuario.afiliaciones?.[0]?.institucion || '';
    form.especialidad = usuario.afiliaciones?.[0]?.disciplina_cientifica || '';
    form.id_grado_academico = usuario.afiliaciones?.[0]?.id_grado_academico || null;
    
    isEditing.value = false;
    const m = document.getElementById('modal-ficha-estudiante');
    if (m) m.style.display = 'flex';
};

const closeFicha = () => {
    const m = document.getElementById('modal-ficha-estudiante');
    if (m) m.style.display = 'none';
};

const saveChanges = async () => {
    try {
        // Limpiar payload para evitar circularidad
        const cleanPersona = {
            nombres: form.persona.nombres,
            primer_apellido: form.persona.primer_apellido,
            segundo_apellido: form.persona.segundo_apellido,
            documento_identidad: form.persona.documento_identidad,
            genero: form.persona.genero,
            pais_origen: form.persona.pais_origen,
            pais_residencia: form.persona.pais_residencia,
            celular: form.persona.celular,
            fecha_nacimiento: form.persona.fecha_nacimiento || null
        };

        const payload = {
            ...cleanPersona,
            institucion: form.institucion,
            especialidad: form.especialidad,
            id_grado_academico: form.id_grado_academico
        };
        
        await api.patch(`/usuarios/${selectedUser.value.id}/perfil-completo`, payload);
        
        Swal.fire({
            title: '¡Actualizado!',
            text: 'La ficha del estudiante se ha actualizado correctamente',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
        });
        
        closeFicha();
        fetchEstudiantes();
    } catch (error: any) {
        const msg = error.response?.data?.message || 'Error desconocido al guardar';
        Swal.fire('Error al Guardar', msg, 'error');
        console.error('Error detallado:', error);
    }
};
</script>

<template>
  <div class="animate-in fade-in duration-500 max-w-7xl mx-auto space-y-8">
    <!-- Header Minimalista -->
    <div class="bg-slate-50 dark:bg-gray-800 rounded-3xl md:rounded-[2.5rem] p-6 md:p-10 flex flex-col lg:flex-row items-center justify-between shadow-sm relative overflow-hidden border-l-[8px] md:border-l-[12px] border-umsa-blue border-b-4 border-umsa-gold">
      <div class="relative z-10 text-center lg:text-left">
        <h2 class="text-2xl md:text-5xl font-black text-primary-dark dark:text-white italic uppercase tracking-tighter">Expediente Estudiantil</h2>
        <p class="text-slate-400 text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.4em] mt-2 flex items-center justify-center lg:justify-start gap-2">
            Gestión Global de Participantes
        </p>
      </div>
      <div class="relative z-10 flex gap-4 mt-6 lg:mt-0 items-center justify-center w-full lg:w-auto">
         <div class="relative group w-full lg:w-auto">
            <span class="absolute inset-y-0 left-4 flex items-center text-slate-400">
                <span class="material-symbols-outlined">search</span>
            </span>
            <input v-model="searchQuery" class="pl-12 pr-6 py-3 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-2xl text-xs font-bold text-primary-dark outline-none focus:ring-4 focus:ring-umsa-blue/10 transition-all w-full lg:w-64 shadow-sm" placeholder="Buscar Estudiante...">
         </div>
      </div>
    </div>

    <!-- Directorio Tabla con Scroll -->
    <div class="bg-white dark:bg-gray-900 rounded-3xl md:rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-gray-800 overflow-hidden">
      <div class="overflow-x-auto custom-scrollbar">
        <table class="w-full text-left border-collapse min-w-[800px]">
          <thead class="bg-slate-50 dark:bg-gray-800/50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-200 dark:border-gray-800">
            <tr>
                <th class="px-6 md:px-8 py-6">Perfil Estudiante</th>
                <th class="px-6 md:px-8 py-6">ID / Contacto</th>
                <th class="px-6 md:px-8 py-6">Participación Contexto</th>
                <th class="px-6 md:px-8 py-6 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-gray-800">
            <tr v-if="loading">
                <td colspan="4" class="px-8 py-16 text-center animate-pulse">
                  <div class="flex flex-col items-center gap-2">
                      <span class="material-symbols-outlined text-4xl text-slate-200 animate-spin">sync</span>
                      <p class="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Cargando Expedientes...</p>
                  </div>
                </td>
            </tr>
            <tr v-for="est in filteredEstudiantes" :key="est.id" class="hover:bg-slate-50/50 dark:hover:bg-gray-800/40 transition-colors group">
              <td class="px-6 md:px-8 py-6">
                  <div class="flex items-center gap-4">
                      <div class="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center text-slate-400 group-hover:scale-110 transition-transform shadow-sm border border-white dark:border-gray-600">
                          <span class="material-symbols-outlined text-xl md:text-2xl">person</span>
                      </div>
                      <div>
                          <p class="font-black text-primary-dark dark:text-white uppercase text-xs md:text-sm leading-tight">{{ parseName(est.persona) }}</p>
                          <p class="text-[9px] md:text-[10px] text-slate-400 font-bold tracking-tighter">{{ est.email }}</p>
                      </div>
                  </div>
              </td>
              <td class="px-6 md:px-8 py-6">
                  <div class="space-y-1">
                      <p class="text-xs font-black text-primary-dark dark:text-gray-300 flex items-center gap-2">
                          <span class="material-symbols-outlined text-[14px] text-umsa-gold">badge</span>
                          {{ est.persona?.documento_identidad }}
                      </p>
                      <p class="text-[10px] font-bold text-slate-400 flex items-center gap-2 italic">
                          <span class="material-symbols-outlined text-[14px]">smartphone</span>
                          {{ est.persona?.celular || 'Sin celular' }}
                      </p>
                  </div>
              </td>
              <td class="px-6 md:px-8 py-6">
                  <div v-if="est.inscripciones?.length" class="flex flex-wrap gap-2">
                      <div v-for="ins in est.inscripciones.slice(0, 2)" :key="ins.id" class="group/badge relative">
                          <span class="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-tighter border border-blue-100 dark:border-blue-800 flex items-center gap-1">
                              <span class="w-1 h-1 bg-blue-500 rounded-full"></span>
                              {{ ins.actividadAcademica?.nombre || 'Evento' }}
                          </span>
                      </div>
                      <span v-if="est.inscripciones.length > 2" class="text-[9px] font-black text-slate-300 italic self-center">
                          +{{ est.inscripciones.length - 2 }} más
                      </span>
                  </div>
                  <p v-else class="text-[10px] font-bold text-slate-300 uppercase italic tracking-widest">Sin actividad reciente</p>
              </td>
              <td class="px-6 md:px-8 py-6 text-center">
                <div class="flex justify-center gap-2">
                    <button @click="openFicha(est)" class="group-hover:bg-umsa-blue group-hover:text-white p-2 border border-blue-200 dark:border-blue-900 text-blue-500 rounded-xl transition-all shadow-sm hover:scale-110">
                        <span class="material-symbols-outlined text-sm">visibility</span>
                    </button>
                    <button @click="openFicha(est); isEditing = true" class="p-2 border border-slate-200 dark:border-gray-700 text-slate-500 rounded-xl hover:bg-umsa-gold hover:text-white transition-all shadow-sm hover:scale-110">
                        <span class="material-symbols-outlined text-sm">edit</span>
                    </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Expendediente Detallado (Ficha) -->
    <div id="modal-ficha-estudiante" class="fixed inset-0 bg-primary-dark/80 backdrop-blur-md z-[500] hidden items-center justify-center p-2 md:p-4">
        <div class="bg-white dark:bg-gray-900 rounded-[2rem] md:rounded-[3rem] w-full max-w-4xl max-h-[95vh] md:max-h-[90vh] overflow-hidden shadow-2xl flex flex-col relative animate-in zoom-in duration-300">
            <!-- Header Ficha -->
            <div class="p-6 md:p-8 bg-gradient-to-r from-slate-50 to-blue-50 dark:from-gray-800 dark:to-gray-900 border-b border-slate-100 dark:border-gray-700 flex justify-between items-center">
                <div class="flex items-center gap-3 md:gap-4">
                    <div class="w-10 h-10 md:w-14 md:h-14 rounded-2xl bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm border border-slate-200 dark:border-gray-700">
                        <span class="material-symbols-outlined text-2xl md:text-3xl text-umsa-blue">assignment_ind</span>
                    </div>
                    <div>
                        <h3 class="text-lg md:text-2xl font-black text-primary-dark dark:text-white uppercase italic leading-none">Ficha Maestra</h3>
                        <p class="text-[8px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Expediente #{{ selectedUser?.id }}</p>
                    </div>
                </div>
                <button @click="closeFicha" class="w-10 h-10 rounded-full hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors flex items-center justify-center">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </div>

            <!-- Contenido Ficha -->
            <div class="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 md:space-y-10 custom-scrollbar">
                
                <!-- Sección 1: Datos Personales -->
                <div class="space-y-6">
                    <div class="flex items-center gap-3 border-b-2 border-slate-100 dark:border-gray-800 pb-3">
                        <span class="material-symbols-outlined text-umsa-gold">person</span>
                        <h4 class="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Información Personal</h4>
                    </div>
                    
                    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                        <div>
                            <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Nombres</label>
                            <input v-model="form.persona.nombres" :disabled="!isEditing" class="w-full bg-slate-50 dark:bg-gray-800 border-2 border-transparent focus:border-umsa-gold rounded-xl py-3 px-4 font-bold text-primary-dark dark:text-white outline-none transition-all disabled:opacity-70">
                        </div>
                        <div>
                            <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Primer Apellido</label>
                            <input v-model="form.persona.primer_apellido" :disabled="!isEditing" class="w-full bg-slate-50 dark:bg-gray-800 border-2 border-transparent focus:border-umsa-gold rounded-xl py-3 px-4 font-bold text-primary-dark dark:text-white outline-none transition-all disabled:opacity-70">
                        </div>
                        <div>
                            <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Segundo Apellido</label>
                            <input v-model="form.persona.segundo_apellido" :disabled="!isEditing" class="w-full bg-slate-50 dark:bg-gray-800 border-2 border-transparent focus:border-umsa-gold rounded-xl py-3 px-4 font-bold text-primary-dark dark:text-white outline-none transition-all disabled:opacity-70">
                        </div>
                        
                        <div>
                            <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Documento de Identidad (CI)</label>
                            <input v-model="form.persona.documento_identidad" :disabled="!isEditing" class="w-full bg-slate-50 dark:bg-gray-800 border-2 border-transparent focus:border-umsa-gold rounded-xl py-3 px-4 font-bold text-primary-dark dark:text-white outline-none transition-all disabled:opacity-70">
                        </div>
                        <div>
                            <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Celular / WhatsApp</label>
                            <input v-model="form.persona.celular" :disabled="!isEditing" class="w-full bg-slate-50 dark:bg-gray-800 border-2 border-transparent focus:border-umsa-gold rounded-xl py-3 px-4 font-bold text-primary-dark dark:text-white outline-none transition-all disabled:opacity-70">
                        </div>
                        <div>
                            <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Género</label>
                            <select v-model="form.persona.genero" :disabled="!isEditing" class="w-full bg-slate-50 dark:bg-gray-800 border-2 border-transparent focus:border-umsa-gold rounded-xl py-3 px-4 font-bold text-primary-dark dark:text-white outline-none transition-all disabled:opacity-70">
                                <option value="Masculino">Masculino</option>
                                <option value="Femenino">Femenino</option>
                                <option value="Otro">Otro</option>
                            </select>
                        </div>
                        <div>
                            <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Fecha de Nacimiento</label>
                            <input type="date" v-model="form.persona.fecha_nacimiento" :disabled="!isEditing" class="w-full bg-slate-50 dark:bg-gray-800 border-2 border-transparent focus:border-umsa-gold rounded-xl py-3 px-4 font-bold text-primary-dark dark:text-white outline-none transition-all disabled:opacity-70">
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">País de Origen</label>
                            <input v-model="form.persona.pais_origen" :disabled="!isEditing" class="w-full bg-slate-50 dark:bg-gray-800 border-2 border-transparent focus:border-umsa-gold rounded-xl py-3 px-4 font-bold text-primary-dark dark:text-white outline-none transition-all disabled:opacity-70">
                        </div>
                        <div>
                            <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">País de Residencia</label>
                            <input v-model="form.persona.pais_residencia" :disabled="!isEditing" class="w-full bg-slate-50 dark:bg-gray-800 border-2 border-transparent focus:border-umsa-gold rounded-xl py-3 px-4 font-bold text-primary-dark dark:text-white outline-none transition-all disabled:opacity-70">
                        </div>
                    </div>
                </div>

                <!-- Sección 2: Afiliación Institucional -->
                <div class="space-y-6">
                    <div class="flex items-center gap-3 border-b-2 border-slate-100 dark:border-gray-800 pb-3">
                        <span class="material-symbols-outlined text-umsa-blue">account_balance</span>
                        <h4 class="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Contexto Institucional</h4>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Universidad / Institución</label>
                            <input v-model="form.institucion" :disabled="!isEditing" class="w-full bg-slate-50 dark:bg-gray-800 border-2 border-transparent focus:border-umsa-gold rounded-xl py-3 px-4 font-bold text-primary-dark dark:text-white outline-none transition-all disabled:opacity-70">
                        </div>
                        <div>
                            <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Grado Académico Actual</label>
                            <select v-model="form.id_grado_academico" :disabled="!isEditing" class="w-full bg-slate-50 dark:bg-gray-800 border-2 border-transparent focus:border-umsa-gold rounded-xl py-3 px-4 font-bold text-primary-dark dark:text-white outline-none transition-all disabled:opacity-70">
                                <option :value="1">Licenciatura / Pregrado</option>
                                <option :value="2">Diplomado</option>
                                <option :value="3">Especialidad</option>
                                <option :value="4">Maestría</option>
                                <option :value="5">Doctorado (PhD)</option>
                                <option :value="null">Otro / No especificado</option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- Sección 3: Participación en Actividades (Solo Lectura) -->
                <div class="space-y-6">
                    <div class="flex items-center gap-3 border-b-2 border-slate-100 dark:border-gray-800 pb-3">
                        <span class="material-symbols-outlined text-indigo-500">history_edu</span>
                        <h4 class="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Registro de Participación Académica</h4>
                    </div>
                    <div v-if="selectedUser?.inscripciones?.length" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div v-for="ins in selectedUser.inscripciones" :key="ins.id" class="bg-indigo-50/30 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800 rounded-2xl p-5 flex items-center gap-4 transition-all hover:shadow-md">
                            <div class="w-10 h-10 rounded-xl bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm">
                                <span class="material-symbols-outlined text-indigo-500">verified</span>
                            </div>
                            <div>
                                <p class="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400">{{ ins.actividadAcademica?.tipo || 'Actividad' }}</p>
                                <p class="text-xs font-black text-primary-dark dark:text-white uppercase leading-tight">{{ ins.actividadAcademica?.nombre }}</p>
                                <p class="text-[9px] font-bold text-slate-400 italic mt-1">{{ ins.actividadAcademica?.evento?.nombre_corto }}</p>
                            </div>
                        </div>
                    </div>
                    <div v-else class="p-8 text-center bg-slate-50 dark:bg-gray-800/50 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-gray-700">
                        <p class="text-[10px] font-black text-slate-300 uppercase tracking-widest">Sin registros de participación activa</p>
                    </div>
                </div>
            </div>

            <!-- Footer Ficha -->
            <div class="p-8 bg-slate-50 dark:bg-gray-800 border-t border-slate-100 dark:border-gray-700 flex justify-between items-center">
                <div class="flex items-center gap-2 text-slate-400 italic text-[10px] font-bold">
                    <span class="material-symbols-outlined text-[14px]">history</span>
                    Última actualización: {{ new Date(selectedUser?.fecha_actualizacion).toLocaleString() }}
                </div>
                <div class="flex gap-4">
                    <button v-if="!isEditing" @click="isEditing = true" class="px-8 py-4 bg-umsa-blue text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg hover:bg-umsa-gold hover:-translate-y-1 transition-all flex items-center gap-2">
                        <span class="material-symbols-outlined text-sm">edit</span> Editar Expediente
                    </button>
                    <div v-else class="flex gap-2">
                        <button @click="isEditing = false" class="px-6 py-4 text-slate-500 font-black uppercase text-[10px] hover:bg-slate-100 rounded-2xl transition-all">Cancelar</button>
                        <button @click="saveChanges" class="px-10 py-4 bg-emerald-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg hover:bg-emerald-600 hover:-translate-y-1 transition-all flex items-center gap-2">
                            <span class="material-symbols-outlined text-sm">save</span> Guardar Cambios
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
.dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; }
</style>