<script setup lang="ts">
import { ref, onMounted, computed, reactive } from 'vue';
import api from '@/services/api';
import Swal from 'sweetalert2';
import type { Usuario } from '@/types/admin';

const ponentes = ref<Usuario[]>([]);
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
        grado_academico: ''
    },
    especialidad: '',
    institucion: '',
    id_grado_academico: null as number | null
});

const fetchPonentes = async () => {
    try {
        loading.value = true;
        // Backend enriquecido con imparticiones->actividad->evento
        const response = await api.get('/usuarios', { params: { rol: 'Ponente', limit: 100 } });
        ponentes.value = response.data.data || response.data;
    } catch (error) {
        Swal.fire('Error', 'No se pudo cargar el plantel de ponentes', 'error');
    } finally {
        loading.value = false;
    }
};

onMounted(fetchPonentes);

const filteredPonentes = computed(() => {
    if (!searchQuery.value) return ponentes.value;
    const q = searchQuery.value.toLowerCase();
    return ponentes.value.filter(p => 
        p.persona?.nombres?.toLowerCase().includes(q) || 
        p.persona?.primer_apellido?.toLowerCase().includes(q) ||
        p.persona?.documento_identidad?.toLowerCase().includes(q)
    );
});

const parseName = (p: any) => `${p?.primer_apellido || ''} ${p?.segundo_apellido || ''} ${p?.nombres || ''}`.trim();

const openFicha = (usuario: any) => {
    selectedUser.value = usuario;
    Object.assign(form.persona, usuario.persona || {});
    form.persona.grado_academico = usuario.persona?.grado_academico || '';
    form.institucion = usuario.afiliaciones?.[0]?.institucion || '';
    form.especialidad = usuario.afiliaciones?.[0]?.disciplina_cientifica || '';
    form.id_grado_academico = usuario.afiliaciones?.[0]?.id_grado_academico || null;
    
    isEditing.value = false;
    const m = document.getElementById('modal-ficha-ponente');
    if (m) m.style.display = 'flex';
};

const closeFicha = () => {
    const m = document.getElementById('modal-ficha-ponente');
    if (m) m.style.display = 'none';
};

const saveChanges = async () => {
    try {
        // Limpiar payload para evitar circularidad
        const cleanPersona = {
            nombres: form.persona.nombres || '',
            primer_apellido: form.persona.primer_apellido || '',
            segundo_apellido: form.persona.segundo_apellido || '',
            documento_identidad: form.persona.documento_identidad || '',
            genero: form.persona.genero,
            pais_origen: form.persona.pais_origen || '',
            pais_residencia: form.persona.pais_residencia || '',
            celular: form.persona.celular || '',
            grado_academico: form.persona.grado_academico || ''
        };

        const payload = {
            ...cleanPersona,
            institucion: form.institucion,
            especialidad: form.especialidad,
            id_grado_academico: form.id_grado_academico
        };
        
        await api.patch(`/usuarios/${selectedUser.value.id}/perfil-completo`, payload);
        
        Swal.fire({
            title: '¡Ficha Actualizada!',
            text: 'Los datos del docente han sido actualizados',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
        });
        
        closeFicha();
        fetchPonentes();
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
    <div class="relative bg-white dark:bg-slate-800 rounded-[2.5rem] p-8 md:p-12 overflow-hidden shadow-sm border border-emerald-100 dark:border-emerald-900/30 group mb-10">
      <!-- Decoración sutil -->
      <div class="absolute top-0 right-0 w-96 h-96 bg-emerald-50 dark:bg-emerald-900/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
      <div class="absolute inset-0 bg-gradient-to-br from-emerald-50/30 to-transparent dark:from-emerald-900/5 pointer-events-none"></div>

      <div class="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
        <div class="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
          <div class="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/30 rounded-3xl flex items-center justify-center shadow-sm border border-emerald-100 dark:border-emerald-800 transition-transform duration-500">
            <span class="material-symbols-outlined text-4xl text-emerald-600 dark:text-emerald-400">psychology</span>
          </div>
          <div>
            <h2 class="text-4xl md:text-5xl font-black text-slate-800 dark:text-white italic uppercase tracking-tighter leading-none">
              Plantel <span class="text-emerald-600">Docente</span>
            </h2>
            <p class="text-slate-400 dark:text-slate-500 text-[10px] md:text-xs font-black uppercase tracking-[0.3em] mt-3 flex items-center justify-center md:justify-start gap-2">
               <span class="w-5 h-px bg-emerald-400"></span> Gestión de Ponentes e Investigadores TYAN
            </p>
          </div>
        </div>

        <div class="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
          <div class="relative w-full sm:w-72 group/search">
            <label class="absolute -top-2.5 left-5 px-2 bg-white dark:bg-slate-800 text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest z-10">Buscar experto</label>
            <div class="relative">
              <span class="absolute inset-y-0 left-4 flex items-center text-emerald-500">
                <span class="material-symbols-outlined text-[18px]">search</span>
              </span>
              <input v-model="searchQuery" class="w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-slate-900/50 border border-emerald-100 dark:border-emerald-800 text-slate-800 dark:text-white rounded-2xl text-xs font-bold outline-none focus:border-emerald-500 transition-all placeholder:text-slate-400" placeholder="Nombre, apellido o CI...">
            </div>
          </div>
          
          <div class="hidden sm:flex flex-col items-end border-l border-emerald-100 dark:border-emerald-900/30 pl-6">
            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Docentes</p>
            <p class="text-3xl font-black text-emerald-600 dark:text-white italic">{{ filteredPonentes.length }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Directorio Tabla con Scroll -->
    <div class="bg-white dark:bg-gray-900 rounded-3xl md:rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-gray-800 overflow-hidden">
      <div class="overflow-x-auto custom-scrollbar">
        <table class="w-full text-left border-collapse min-w-[800px]">
          <thead class="bg-slate-50 dark:bg-gray-800/50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-200 dark:border-gray-800">
            <tr>
                <th class="px-6 md:px-8 py-6">Perfil Docente</th>
                <th class="px-6 md:px-8 py-6">ID / Identidad</th>
                <th class="px-6 md:px-8 py-6">Actividades Impartidas</th>
                <th class="px-6 md:px-8 py-6 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-gray-800">
            <tr v-if="loading">
                <td colspan="4" class="px-8 py-16 text-center animate-pulse text-slate-300 font-bold uppercase text-[10px]">Cargando Plantel...</td>
            </tr>
            <tr v-for="pon in filteredPonentes" :key="pon.id" class="hover:bg-slate-50/50 dark:hover:bg-gray-800/40 transition-colors group">
              <td class="px-6 md:px-8 py-6">
                  <div class="flex items-center gap-4">
                      <div class="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform shadow-sm border border-white dark:border-gray-600">
                          <span class="material-symbols-outlined text-xl md:text-2xl">school</span>
                      </div>
                      <div>
                          <p class="font-black text-primary-dark dark:text-white uppercase text-xs md:text-sm leading-tight">{{ parseName(pon.persona) }}</p>
                          <p class="text-[9px] md:text-[10px] text-emerald-600 font-bold tracking-tighter">{{ pon.email }}</p>
                      </div>
                  </div>
              </td>
              <td class="px-6 md:px-8 py-6">
                  <div class="space-y-1">
                      <p class="text-xs font-black text-primary-dark dark:text-gray-300 flex items-center gap-2">
                          <span class="material-symbols-outlined text-[14px] text-umsa-gold">badge</span>
                          {{ pon.persona?.documento_identidad }}
                      </p>
                      <p class="text-[10px] font-bold text-slate-400 italic">
                        <span class="material-symbols-outlined text-[14px]">smartphone</span>
                        {{ pon.persona?.celular || 'Sin contacto' }}
                      </p>
                  </div>
              </td>
              <td class="px-6 md:px-8 py-6">
                  <div v-if="pon.imparticiones?.length" class="flex flex-wrap gap-2">
                      <div v-for="imp in pon.imparticiones.slice(0, 1)" :key="imp.id">
                          <span class="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-tighter border border-emerald-100 dark:border-emerald-800 flex items-center gap-1">
                              <span class="w-1 h-1 bg-emerald-500 rounded-full"></span>
                              {{ imp.actividadAcademica?.nombre || 'Curso' }}
                          </span>
                      </div>
                      <span v-if="pon.imparticiones.length > 1" class="text-[9px] font-black text-slate-300 italic self-center">
                          +{{ pon.imparticiones.length - 1 }} más
                      </span>
                  </div>
                  <p v-else class="text-[10px] font-bold text-slate-300 uppercase italic tracking-widest">Sin asignaciones</p>
              </td>
              <td class="px-6 md:px-8 py-6 text-center">
                <div class="flex justify-center gap-2">
                    <button @click="openFicha(pon)" class="p-2 border border-blue-200 dark:border-blue-900 text-blue-500 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm hover:scale-110">
                        <span class="material-symbols-outlined text-sm">visibility</span>
                    </button>
                    <button @click="openFicha(pon); isEditing = true" class="p-2 border border-slate-200 dark:border-gray-700 text-slate-500 rounded-xl hover:bg-umsa-gold hover:text-white transition-all shadow-sm hover:scale-110">
                        <span class="material-symbols-outlined text-sm">edit</span>
                    </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Ficha de Ponente -->
    <div id="modal-ficha-ponente" class="fixed inset-0 bg-primary-dark/80 backdrop-blur-md z-[500] hidden items-center justify-center p-2 md:p-4">
        <div class="bg-white dark:bg-gray-900 rounded-[2rem] md:rounded-[3rem] w-full max-w-4xl max-h-[95vh] md:max-h-[90vh] overflow-hidden shadow-2xl flex flex-col relative animate-in zoom-in duration-300">
            <!-- Header Ficha -->
            <div class="p-6 md:p-8 bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-900/20 dark:to-gray-900 border-b border-slate-100 dark:border-gray-700 flex justify-between items-center">
                <div class="flex items-center gap-3 md:gap-4">
                    <div class="w-10 h-10 md:w-14 md:h-14 rounded-2xl bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm border border-slate-200 dark:border-gray-700">
                        <span class="material-symbols-outlined text-2xl md:text-3xl text-emerald-500">psychology</span>
                    </div>
                    <div>
                        <h3 class="text-lg md:text-2xl font-black text-primary-dark dark:text-white uppercase italic leading-none">Perfil Ponente</h3>
                        <p class="text-[8px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Expediente docente #{{ selectedUser?.id }}</p>
                    </div>
                </div>
                <button @click="closeFicha" class="w-10 h-10 rounded-full hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors flex items-center justify-center">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </div>

            <!-- Contenido Ficha -->
            <div class="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 md:space-y-10 custom-scrollbar">
                
                <!-- Sección 1: Identidad -->
                <div class="space-y-6">
                    <div class="flex items-center gap-3 border-b-2 border-slate-100 dark:border-gray-800 pb-3">
                        <span class="material-symbols-outlined text-umsa-gold">fingerprint</span>
                        <h4 class="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Identidad y Datos Críticos</h4>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div v-for="(val, key) in {nombres: 'Nombres', primer_apellido: 'Apellido Paterno', segundo_apellido: 'Apellido Materno'}" :key="key">
                            <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">{{ val }}</label>
                            <input v-model="form.persona[key]" :disabled="!isEditing" class="w-full bg-slate-50 dark:bg-gray-800 border-2 border-transparent focus:border-emerald-500 rounded-xl py-3 px-4 font-bold text-primary-dark dark:text-white outline-none transition-all disabled:opacity-70">
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Documento de Identidad</label>
                            <input v-model="form.persona.documento_identidad" :disabled="!isEditing" class="w-full bg-slate-50 dark:bg-gray-800 border-2 border-transparent focus:border-emerald-500 rounded-xl py-3 px-4 font-bold text-primary-dark dark:text-white outline-none transition-all">
                        </div>
                        <div>
                            <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Grado Académico (Abreviado)</label>
                            <input v-model="form.persona.grado_academico" :disabled="!isEditing" placeholder="Ej: Lic. o MSc." class="w-full bg-slate-50 dark:bg-gray-800 border-2 border-transparent focus:border-emerald-500 rounded-xl py-3 px-4 font-bold text-primary-dark dark:text-white outline-none transition-all">
                        </div>
                    </div>
                </div>

                <!-- Sección 2: Especialidad -->
                <div class="space-y-6">
                    <div class="flex items-center gap-3 border-b-2 border-slate-100 dark:border-gray-800 pb-3">
                        <span class="material-symbols-outlined text-emerald-500">workspace_premium</span>
                        <h4 class="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Especialidad e Institución</h4>
                    </div>
                    <div class="grid grid-cols-1 gap-6">
                        <div class="col-span-full">
                            <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Área de Especialidad / Temática</label>
                            <textarea v-model="form.especialidad" :disabled="!isEditing" rows="2" class="w-full bg-slate-50 dark:bg-gray-800 border-2 border-transparent focus:border-emerald-500 rounded-2xl py-3 px-4 font-bold text-primary-dark dark:text-white outline-none transition-all"></textarea>
                        </div>
                        <div>
                            <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Institución de Origen</label>
                            <input v-model="form.institucion" :disabled="!isEditing" class="w-full bg-slate-50 dark:bg-gray-800 border-2 border-transparent focus:border-emerald-500 rounded-xl py-3 px-4 font-bold text-primary-dark dark:text-white outline-none transition-all">
                        </div>
                    </div>
                </div>

                <!-- Sección 3: Historial Docente -->
                <div class="space-y-6">
                    <div class="flex items-center gap-3 border-b-2 border-slate-100 dark:border-gray-800 pb-3">
                        <span class="material-symbols-outlined text-blue-500">history_edu</span>
                        <h4 class="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Registro Histórico de Imparticiones</h4>
                    </div>
                    <div v-if="selectedUser?.imparticiones?.length" class="space-y-3">
                        <div v-for="imp in selectedUser.imparticiones" :key="imp.id" class="flex items-center justify-between p-4 bg-slate-50 dark:bg-gray-800 rounded-2xl border border-slate-100 dark:border-gray-700">
                            <div class="flex items-center gap-4">
                                <span class="material-symbols-outlined text-emerald-600">check_circle</span>
                                <div>
                                    <p class="text-xs font-black text-primary-dark dark:text-white uppercase">{{ imp.actividadAcademica?.nombre }}</p>
                                    <p class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{{ imp.actividadAcademica?.evento?.nombre_corto }}</p>
                                </div>
                            </div>
                            <span class="bg-white dark:bg-gray-700 px-3 py-1 rounded-lg text-[9px] font-black uppercase text-slate-400">Docente</span>
                        </div>
                    </div>
                    <div v-else class="p-8 text-center bg-slate-50 dark:bg-gray-800/50 rounded-3xl border-2 border-dashed border-slate-100 dark:border-gray-700">
                        <p class="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Sin imparticiones registradas</p>
                    </div>
                </div>
            </div>

            <!-- Footer Ficha -->
            <div class="p-8 bg-slate-50 dark:bg-gray-800 border-t border-slate-100 dark:border-gray-700 flex justify-between items-center">
                <div class="text-slate-400 text-[10px] font-bold flex items-center gap-2 uppercase">
                    <span class="material-symbols-outlined text-sm">event</span>
                    Última actualización: {{ new Date(selectedUser?.fecha_actualizacion).toLocaleDateString() }}
                </div>
                <div class="flex gap-4">
                    <button v-if="!isEditing" @click="isEditing = true" class="px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg hover:scale-105 active:scale-95 transition-all">
                        Habilitar Edición
                    </button>
                    <div v-else class="flex gap-3">
                        <button @click="isEditing = false" class="px-6 py-4 text-slate-500 font-black uppercase text-[10px] hover:bg-slate-200 dark:hover:bg-gray-700 rounded-2xl transition-all">Descartar</button>
                        <button @click="saveChanges" class="px-10 py-4 bg-emerald-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg hover:bg-emerald-600 transition-all flex items-center gap-2">
                            <span class="material-symbols-outlined text-sm">cloud_upload</span> Guardar Cambios
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