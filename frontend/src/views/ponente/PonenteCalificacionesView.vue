<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '@/services/api';
import Swal from 'sweetalert2';

const route = useRoute();
const router = useRouter();

const actividadId = ref(route.params.actividadId);
const loading = ref(false);
const saving = ref(false);
const searchQuery = ref('');
const filterStatus = ref('todos'); // todos, aprobados, reprobados, pendientes

const actividadInfo = ref({
  nombre: 'Cargando...',
  evento: '...'
});

// Estudiantes reales vendrán del backend
const estudiantes = ref<any[]>([]);

const fetchEstudiantes = async () => {
    if (!actividadId.value) return;
    
    loading.value = true;
    try {
        // Verificar estado de la actividad primero
        const actRes = await api.get(`/actividades-academicas/${actividadId.value}`);
        if (Number(actRes.data.estado) === -1) {
            Swal.fire({
                icon: 'warning',
                title: 'Actividad Inhabilitada',
                text: 'No se pueden gestionar calificaciones para una actividad inhabilitada.',
                confirmButtonColor: '#003B71'
            });
            router.push({ name: 'ponente-catalogo' });
            return;
        }

        // Cargar información de la actividad
        actividadInfo.value.nombre = actRes.data.nombre;
        actividadInfo.value.evento = actRes.data.evento?.nombre || 'Evento';

        // Cargar estudiantes
        const response = await api.get(`/inscripciones/ponente/${actividadId.value}`);
        estudiantes.value = response.data.map((ins: any) => ({
            id: ins.id,
            nombre: `${ins.usuario.persona.nombres} ${ins.usuario.persona.primer_apellido}`,
            correo: ins.usuario.email,
            nota: ins.note_principal || 0,
            originalNota: ins.note_principal || 0,
            guardado: true
        }));
        
        if (response.data.length > 0) {
            actividadInfo.value.nombre = response.data[0].actividadAcademica.nombre;
            actividadInfo.value.evento = response.data[0].actividadAcademica.evento?.nombre || 'Evento';
        }
    } catch (error: any) {
        console.error('Error al cargar estudiantes:', error);
        // Datos mock para desarrollo si el endpoint no existe
        estudiantes.value = [
            { id: 1, nombre: 'Ana Gómez', correo: 'ana@umsa.bo', nota: 85, originalNota: 85, guardado: true },
            { id: 2, nombre: 'Luis Martínez', correo: 'luis@umsa.bo', nota: 60, originalNota: 60, guardado: true },
            { id: 3, nombre: 'María Vargas', correo: 'maria@umsa.bo', nota: 0, originalNota: 0, guardado: true }
        ];
        actividadInfo.value.nombre = 'Actividad de Prueba';
    } finally {
        loading.value = false;
    }
};

const guardarNotas = async () => {
    saving.value = true;
    const modificados = estudiantes.value.filter(e => e.nota !== e.originalNota);
    
    if (modificados.length === 0) {
        Swal.fire('Sin cambios', 'No hay notas nuevas para guardar.', 'info');
        saving.value = false;
        return;
    }

    try {
        // En un escenario real, podríamos enviar uno por uno o un bulk
        // Tu compañero definirá: PATCH /inscripciones/ponente/:actividadId/:inscripcionId/nota
        for (const est of modificados) {
            await api.patch(`/inscripciones/ponente/${actividadId.value}/${est.id}/nota`, {
                nota: est.nota
            });
            est.originalNota = est.nota;
            est.guardado = true;
        }
        
        Swal.fire({
            icon: 'success',
            title: 'Notas Guardadas',
            text: `Se han actualizado ${modificados.length} calificaciones correctamente.`,
            confirmButtonColor: '#005a96'
        });
    } catch (error) {
        Swal.fire('Error', 'Hubo un problema al guardar las notas. El backend podría no estar listo.', 'error');
    } finally {
        saving.value = false;
    }
};

const filteredEstudiantes = computed(() => {
    return estudiantes.value.filter(e => {
        const matchesSearch = e.nombre.toLowerCase().includes(searchQuery.value.toLowerCase()) || 
                             e.correo.toLowerCase().includes(searchQuery.value.toLowerCase());
        
        if (filterStatus.value === 'aprobados') return matchesSearch && e.nota >= 65;
        if (filterStatus.value === 'reprobados') return matchesSearch && e.nota < 65 && e.nota > 0;
        if (filterStatus.value === 'pendientes') return matchesSearch && (e.nota === 0 || !e.nota);
        
        return matchesSearch;
    });
});

onMounted(fetchEstudiantes);

const getNotaClass = (nota: number) => {
    if (nota === 0) return 'text-slate-400';
    return nota >= 65 ? 'text-emerald-600' : 'text-rose-600';
};
</script>

<template>
  <div class="animate-in fade-in duration-500 space-y-6">
    <!-- Header de Navegación -->
    <div class="flex items-center justify-between">
        <button @click="router.back()" class="flex items-center gap-2 text-slate-500 hover:text-umsa-blue transition-colors font-black text-[11px] uppercase tracking-widest">
            <span class="material-symbols-outlined text-[16px]">arrow_back</span>
            Volver al Detalle
        </button>
        
        <div class="flex items-center gap-3">
             <button @click="fetchEstudiantes" class="p-2.5 text-slate-400 hover:text-umsa-blue hover:bg-blue-50 rounded-xl transition-all" title="Recargar lista">
                <span class="material-symbols-outlined" :class="{'animate-spin': loading}">refresh</span>
            </button>
            <button @click="guardarNotas" :disabled="saving" class="bg-umsa-blue hover:bg-blue-700 disabled:opacity-50 text-white font-black px-6 py-3 rounded-2xl uppercase tracking-widest text-[11px] transition-all flex items-center gap-2 shadow-xl shadow-umsa-blue/20">
                <span class="material-symbols-outlined text-[18px]">{{ saving ? 'sync' : 'save_as' }}</span>
                {{ saving ? 'Guardando...' : 'Publicar Calificaciones' }}
            </button>
        </div>
    </div>

    <!-- Banner Info -->
    <div class="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-[2rem] p-8 shadow-sm">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
                <div class="flex items-center gap-2 mb-2">
                    <span class="px-3 py-1 bg-umsa-gold/10 text-umsa-gold text-[9px] font-black uppercase tracking-widest rounded-lg border border-umsa-gold/20">
                        {{ actividadInfo.evento }}
                    </span>
                    <span class="text-slate-300">|</span>
                    <span class="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Gestión de Notas</span>
                </div>
                <h1 class="text-2xl md:text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic">
                    {{ actividadInfo.nombre }}
                </h1>
            </div>
            <div class="flex gap-4">
                <div class="bg-slate-50 dark:bg-gray-800/50 px-6 py-4 rounded-2xl border border-slate-100 dark:border-gray-800">
                    <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Inscritos</p>
                    <p class="text-xl font-black text-slate-800 dark:text-white">{{ estudiantes.length }}</p>
                </div>
                <div class="bg-emerald-50 dark:bg-emerald-900/10 px-6 py-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/20">
                    <p class="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">Aprobados</p>
                    <p class="text-xl font-black text-emerald-700 dark:text-emerald-500">{{ estudiantes.filter(e => e.nota >= 65).length }}</p>
                </div>
            </div>
        </div>
    </div>

    <!-- Controles de Tabla -->
    <div class="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-100/50 dark:bg-gray-900/50 p-4 rounded-3xl border border-slate-200 dark:border-gray-800">
        <div class="relative w-full md:w-96">
            <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
            <input v-model="searchQuery" type="text" placeholder="Nombre o correo del estudiante..." class="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-umsa-blue/20">
        </div>
        
        <div class="flex items-center gap-2 w-full md:w-auto">
            <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2 ml-4">Filtrar:</span>
            <button v-for="st in ['todos', 'aprobados', 'reprobados', 'pendientes']" :key="st" 
                @click="filterStatus = st"
                :class="[filterStatus === st ? 'bg-umsa-blue text-white shadow-lg shadow-umsa-blue/20' : 'bg-white dark:bg-gray-900 text-slate-500 hover:bg-slate-50']"
                class="px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border border-slate-200 dark:border-gray-800">
                {{ st }}
            </button>
        </div>
    </div>

    <!-- Tabla de Calificaciones -->
    <div class="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-[2rem] overflow-hidden shadow-sm">
        <div v-if="loading" class="p-20 flex flex-col items-center justify-center gap-4 text-slate-400">
            <span class="material-symbols-outlined animate-spin text-4xl">sync</span>
            <p class="text-xs font-black uppercase tracking-widest">Sincronizando nómina...</p>
        </div>
        
        <table v-else class="w-full text-left">
            <thead>
                <tr class="bg-slate-50/50 dark:bg-black/20 border-b border-slate-100 dark:border-gray-800">
                    <th class="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Estudiante</th>
                    <th class="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nota Final (0-100)</th>
                    <th class="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Estado Académico</th>
                    <th class="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Acción</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="est in filteredEstudiantes" :key="est.id" class="group hover:bg-slate-50/50 dark:hover:bg-gray-800/30 transition-all border-b border-slate-50 dark:border-gray-800/50">
                    <td class="px-8 py-6">
                        <div class="flex items-center gap-4">
                            <div class="w-10 h-10 rounded-xl bg-slate-100 dark:bg-gray-800 flex items-center justify-center font-black text-slate-400 group-hover:bg-umsa-blue group-hover:text-white transition-all shadow-sm">
                                {{ est.nombre.charAt(0) }}
                            </div>
                            <div>
                                <div class="text-sm font-black text-slate-700 dark:text-white mb-0.5">{{ est.nombre }}</div>
                                <div class="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                    <span class="material-symbols-outlined text-[12px]">mail</span> {{ est.correo }}
                                </div>
                            </div>
                        </div>
                    </td>
                    <td class="px-8 py-6 w-56">
                        <div class="relative">
                            <input type="number" v-model="est.nota" min="0" max="100"
                                class="w-full bg-slate-50 dark:bg-gray-800 border-2 border-slate-100 dark:border-gray-800 rounded-2xl px-5 py-3 text-lg font-black focus:outline-none focus:border-umsa-blue transition-all"
                                :class="getNotaClass(est.nota)">
                            <div v-if="est.nota !== est.originalNota" class="absolute -right-2 -top-2 flex h-5 w-5 animate-bounce items-center justify-center rounded-full bg-umsa-gold text-[10px] text-white shadow-lg">
                                !
                            </div>
                        </div>
                    </td>
                    <td class="px-8 py-6 text-center">
                        <div v-if="est.nota > 0" :class="[est.nota >= 65 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100']" class="inline-flex px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest shadow-sm">
                            {{ est.nota >= 65 ? 'Aprobado' : 'Reprobado' }}
                        </div>
                        <div v-else class="inline-flex px-4 py-2 bg-slate-100 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-200">
                            Pendiente
                        </div>
                    </td>
                    <td class="px-8 py-6 text-right">
                        <div v-if="est.nota !== est.originalNota" class="text-[9px] font-black text-umsa-gold uppercase animate-pulse">
                            Sin guardar
                        </div>
                        <div v-else-if="est.nota > 0" class="flex items-center justify-end gap-1 text-emerald-500 font-bold text-[9px] uppercase tracking-widest">
                            <span class="material-symbols-outlined text-[14px]">check_circle</span> Sincronizado
                        </div>
                    </td>
                </tr>
            </tbody>
        </table>

        <!-- Estado Vacío -->
        <div v-if="filteredEstudiantes.length === 0 && !loading" class="p-20 text-center space-y-4">
            <div class="w-20 h-20 bg-slate-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <span class="material-symbols-outlined text-4xl text-slate-300">person_off</span>
            </div>
            <h3 class="text-xl font-black text-slate-600 dark:text-gray-400 uppercase tracking-tighter">No se encontraron estudiantes</h3>
            <p class="text-xs text-slate-400 max-w-xs mx-auto font-medium">Prueba ajustando tu búsqueda o los filtros de estado académico.</p>
        </div>
    </div>

    <!-- Footer de Información -->
    <div class="flex flex-col md:flex-row items-center gap-6 justify-between text-slate-400">
        <div class="flex items-center gap-6">
            <div class="flex items-center gap-2">
                <div class="w-3 h-3 rounded-full bg-emerald-500"></div>
                <span class="text-[10px] font-black uppercase tracking-widest">Aprobación >= 65 Pts</span>
            </div>
            <div class="flex items-center gap-2">
                <div class="w-3 h-3 rounded-full bg-umsa-gold"></div>
                <span class="text-[10px] font-black uppercase tracking-widest">Cambios pendientes</span>
            </div>
        </div>
        <p class="text-[10px] font-bold italic">© 2026 Sistema TYAN · Universidad Mayor de San Andrés</p>
    </div>
  </div>
</template>

<style scoped>
/* Eliminar flechas del input number */
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
input[type=number] {
  -moz-appearance: textfield;
}
</style>
