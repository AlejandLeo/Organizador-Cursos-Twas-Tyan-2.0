<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import api from '@/services/api';
import Swal from 'sweetalert2';

const usuarios = ref<any[]>([]);
const loading = ref(true);
const searchQuery = ref('');

const fetchCoordinadores = async () => {
    try {
        loading.value = true;
        // Filtramos por rol Coordinador desde el backend
        const response = await api.get('/usuarios', { params: { rol: 'Coordinador', limit: 50 } });
        usuarios.value = response.data.data || response.data;
    } catch (error) {
        Swal.fire('Error', 'No se pudo cargar la lista de coordinadores', 'error');
    } finally {
        loading.value = false;
    }
};

onMounted(fetchCoordinadores);

const filteredUsuarios = computed(() => {
    if (!searchQuery.value) return usuarios.value;
    const q = searchQuery.value.toLowerCase();
    return usuarios.value.filter(u => 
        u.persona?.nombres?.toLowerCase().includes(q) || 
        u.persona?.primer_apellido?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q)
    );
});

const parseName = (p: any) => `${p?.primer_apellido || ''} ${p?.segundo_apellido || ''} ${p?.nombres || ''}`.trim();
</script>

<template>
    <div class="flex flex-col lg:flex-row lg:items-center justify-between border-b border-slate-200 dark:border-gray-800 mb-8 pb-6 gap-6">
        <div class="text-center lg:text-left">
            <h2 class="text-2xl md:text-3xl font-black text-primary-dark dark:text-white uppercase italic">Directorio de Coordinación</h2>
            <p class="text-[9px] md:text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mt-1">Personal administrativo con rol de Coordinador</p>
        </div>
        <div class="bg-blue-50 dark:bg-blue-900/10 px-4 md:px-6 py-3 rounded-2xl border border-blue-100 dark:border-blue-800 flex items-center gap-3 self-center lg:self-auto">
            <span class="material-symbols-outlined text-blue-500 text-sm md:text-base">info</span>
            <p class="text-[8px] md:text-[9px] font-bold text-blue-600 dark:text-blue-400 uppercase leading-tight">Vista de solo lectura.<br>Contacta al Super-Admin para cambios.</p>
        </div>
    </div>

    <!-- Buscador -->
    <div class="relative w-full max-w-md group mx-auto lg:mx-0">
        <label class="absolute -top-3 left-6 px-2 bg-slate-50 dark:bg-gray-950 lg:bg-[#f8f9fc] lg:dark:bg-black z-10 text-[9px] font-black text-slate-400 uppercase tracking-widest italic transition-colors">Buscar coordinador</label>
        <span class="absolute inset-y-0 left-5 flex items-center text-slate-400">
            <span class="material-symbols-outlined text-xl group-focus-within:text-umsa-blue transition-colors">search</span>
        </span>
        <input v-model="searchQuery" class="w-full pl-14 pr-6 py-4 bg-white dark:bg-gray-900 border-2 border-slate-200 dark:border-gray-800 rounded-full shadow-sm text-sm focus:ring-4 focus:ring-umsa-blue/10 focus:border-umsa-blue outline-none transition-all font-bold text-primary-dark dark:text-gray-200 placeholder-slate-400" placeholder="Nombre o correo..." type="text">
    </div>

    <!-- Tabla con Scroll -->
    <div class="bg-white dark:bg-gray-900 rounded-3xl md:rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-gray-800 overflow-hidden">
        <div class="overflow-x-auto custom-scrollbar">
            <table class="w-full text-left min-w-[700px]">
                <thead class="bg-slate-50 dark:bg-gray-800/50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-200 dark:border-gray-800">
                    <tr>
                        <th class="px-6 md:px-8 py-5">Nombre Completo</th>
                        <th class="px-6 md:px-8 py-5">Correo Electrónico</th>
                        <th class="px-6 md:px-8 py-5 text-center">Estado de Acceso</th>
                        <th class="px-6 md:px-8 py-5 text-center">Rol Sistema</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 dark:divide-gray-800">
                <tr v-if="loading">
                    <td colspan="4" class="px-8 py-12 text-center text-slate-400 font-bold uppercase text-xs tracking-widest animate-pulse">Consultando base de datos...</td>
                </tr>
                <tr v-else-if="filteredUsuarios.length === 0">
                    <td colspan="4" class="px-8 py-12 text-center text-slate-400 font-bold uppercase text-xs tracking-widest">No hay otros coordinadores registrados</td>
                </tr>
                <tr v-for="user in filteredUsuarios" :key="user.id" class="hover:bg-slate-50 dark:hover:bg-gray-800/80 transition-colors">
                    <td class="px-8 py-6 font-black text-primary-dark dark:text-white uppercase text-sm">{{ parseName(user.persona) }}</td>
                    <td class="px-8 py-6 text-xs font-bold text-slate-500 dark:text-gray-400">{{ user.email }}</td>
                    <td class="px-8 py-6 text-center">
                        <span v-if="user.estado === 1" class="text-emerald-500 font-black text-[10px] uppercase tracking-tighter flex items-center justify-center gap-1">
                            <span class="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span> Activo
                        </span>
                        <span v-else class="text-slate-400 font-black text-[10px] uppercase">Inactivo</span>
                    </td>
                    <td class="px-8 py-6 text-center">
                        <span class="bg-umsa-gold/20 text-umsa-gold px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-umsa-gold/30">Coordinador</span>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
  </div>
</template>
