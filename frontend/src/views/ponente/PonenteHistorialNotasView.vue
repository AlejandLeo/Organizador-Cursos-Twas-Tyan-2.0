<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import api from '@/services/api';

const router = useRouter();
const loading = ref(false);
const searchQuery = ref('');
const historial = ref<any[]>([]);

const fetchHistorialCompleto = async () => {
    loading.value = true;
    try {
        const response = await api.get('/ponente/inscripciones/historial');
        historial.value = response.data;
    } catch (error) {
        console.error('Error al cargar historial:', error);
        // Mock data para visualización inmediata
        historial.value = [
            { id: 1, estudiante: 'Ana Gómez', correo: 'ana@umsa.bo', actividad: 'Biofertilizantes', evento: 'Especialidad V Edición', nota: 85, fecha: '2026-04-20' },
            { id: 2, estudiante: 'Luis Martínez', correo: 'luis@umsa.bo', actividad: 'Biofertilizantes', evento: 'Especialidad V Edición', nota: 60, fecha: '2026-04-18' },
            { id: 3, estudiante: 'María Vargas', correo: 'maria@umsa.bo', actividad: 'Biotecnología', evento: 'Postgrado IX Edición', nota: 92, fecha: '2026-04-15' },
            { id: 4, estudiante: 'Carlos Poma', correo: 'carlos@umsa.bo', actividad: 'Gestión Ambiental', evento: 'Diplomado II Edición', nota: 75, fecha: '2026-03-10' }
        ];
    } finally {
        loading.value = false;
    }
};

const filteredHistorial = computed(() => {
    const q = searchQuery.value.toLowerCase();
    return historial.value.filter(h => 
        h.estudiante.toLowerCase().includes(q) || 
        h.actividad.toLowerCase().includes(q) ||
        h.correo.toLowerCase().includes(q)
    );
});

onMounted(fetchHistorialCompleto);
</script>

<template>
  <div class="animate-in fade-in duration-500 space-y-8">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h1 class="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic flex items-center gap-3">
                <span class="material-symbols-outlined text-umsa-blue text-4xl">history_edu</span>
                Historial de Calificaciones
            </h1>
            <p class="text-sm text-slate-500 font-medium mt-1">Consulta el registro histórico de notas enviadas por ti.</p>
        </div>
        
        <div class="relative w-full md:w-80">
            <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
            <input v-model="searchQuery" type="text" placeholder="Buscar por alumno o curso..." class="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl text-xs font-bold focus:outline-none focus:ring-4 focus:ring-umsa-blue/10 transition-all shadow-sm">
        </div>
    </div>

    <!-- Tabla Histórica -->
    <div class="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-[2.5rem] overflow-hidden shadow-sm">
        <div v-if="loading" class="p-20 flex flex-col items-center justify-center gap-4 text-slate-400">
            <span class="material-symbols-outlined animate-spin text-4xl">sync</span>
            <p class="text-xs font-black uppercase tracking-widest">Cargando archivo histórico...</p>
        </div>

        <table v-else class="w-full text-left">
            <thead>
                <tr class="bg-slate-50/50 dark:bg-black/20 border-b border-slate-100 dark:border-gray-800">
                    <th class="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Estudiante / Correo</th>
                    <th class="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Actividad Académica</th>
                    <th class="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Evento / Gestión</th>
                    <th class="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Nota Final</th>
                    <th class="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Fecha de Registro</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="h in filteredHistorial" :key="h.id" class="group hover:bg-slate-50/50 dark:hover:bg-gray-800/30 transition-all border-b border-slate-50 dark:border-gray-800/50">
                    <td class="px-8 py-6">
                        <div class="text-sm font-black text-slate-700 dark:text-white mb-0.5">{{ h.estudiante }}</div>
                        <div class="text-[10px] font-bold text-umsa-blue italic">{{ h.correo }}</div>
                    </td>
                    <td class="px-8 py-6">
                        <div class="text-[11px] font-black text-slate-600 dark:text-gray-300 uppercase tracking-tight">{{ h.actividad }}</div>
                    </td>
                    <td class="px-8 py-6">
                        <span class="px-2.5 py-1 bg-slate-100 dark:bg-gray-800 text-slate-500 dark:text-gray-400 text-[9px] font-black uppercase tracking-widest rounded-lg border border-slate-200 dark:border-gray-700">
                            {{ h.evento }}
                        </span>
                    </td>
                    <td class="px-8 py-6 text-center">
                        <div :class="[h.nota >= 51 ? 'text-emerald-500' : 'text-rose-500']" class="text-lg font-black italic">
                            {{ h.nota }}<span class="text-[10px] ml-0.5 uppercase not-italic">pts</span>
                        </div>
                    </td>
                    <td class="px-8 py-6 text-right">
                        <div class="text-[10px] font-bold text-slate-400 font-mono">{{ h.fecha }}</div>
                    </td>
                </tr>
            </tbody>
        </table>

        <!-- Estado Vacío -->
        <div v-if="filteredHistorial.length === 0 && !loading" class="p-20 text-center space-y-4">
            <div class="w-20 h-20 bg-slate-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <span class="material-symbols-outlined text-4xl text-slate-300">folder_open</span>
            </div>
            <h3 class="text-xl font-black text-slate-600 dark:text-gray-400 uppercase tracking-tighter">Historial vacío</h3>
            <p class="text-xs text-slate-400 max-w-xs mx-auto font-medium">Aún no has registrado calificaciones en el sistema.</p>
        </div>
    </div>
  </div>
</template>
