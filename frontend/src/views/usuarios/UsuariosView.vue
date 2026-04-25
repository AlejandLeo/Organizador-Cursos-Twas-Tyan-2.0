<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import api from '@/services/api';
import Swal from 'sweetalert2';
import type { Usuario } from '@/types/admin';

const usuarios = ref<Usuario[]>([]);
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
    <div class="relative bg-white dark:bg-slate-800 rounded-[2.5rem] p-8 md:p-12 overflow-hidden shadow-sm border border-sky-100 dark:border-slate-700 group mb-10">
      <!-- Decoración sutil -->
      <div class="absolute top-0 left-0 w-80 h-80 bg-sky-50 dark:bg-sky-900/10 rounded-full -ml-20 -mt-20 blur-3xl"></div>
      <div class="absolute inset-0 bg-gradient-to-br from-indigo-50/30 to-transparent dark:from-indigo-900/5 pointer-events-none"></div>
      
      <div class="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
        <div class="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
          <div class="w-20 h-20 bg-sky-100 dark:bg-sky-900/30 rounded-3xl flex items-center justify-center shadow-sm border border-sky-200 dark:border-sky-800 transition-transform duration-500">
            <span class="material-symbols-outlined text-4xl text-sky-600 dark:text-sky-400">manage_accounts</span>
          </div>
          <div>
            <h2 class="text-4xl md:text-5xl font-black text-sky-950 dark:text-white italic uppercase tracking-tighter leading-none">
              Directorio de <span class="text-sky-600">Coordinación</span>
            </h2>
            <p class="text-slate-400 dark:text-slate-500 text-[10px] md:text-xs font-black uppercase tracking-[0.3em] mt-3 flex items-center justify-center md:justify-start gap-2">
               <span class="w-5 h-px bg-sky-400"></span> Personal Administrativo de Gestión
            </p>
          </div>
        </div>

        <div class="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
          <div class="relative w-full sm:w-96 group/search">
            <label class="absolute -top-2.5 left-5 px-2 bg-white dark:bg-slate-800 text-[9px] font-black text-sky-600 dark:text-sky-400 uppercase tracking-widest z-10">Búsqueda rápida</label>
            <div class="relative">
              <span class="absolute inset-y-0 left-4 flex items-center text-sky-400">
                <span class="material-symbols-outlined text-[20px]">search</span>
              </span>
              <input v-model="searchQuery" class="w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-slate-900/50 border border-sky-100 dark:border-slate-700 text-sky-900 dark:text-white rounded-2xl text-xs font-bold outline-none focus:border-sky-400 transition-all placeholder:text-slate-400" placeholder="Nombre o correo electrónico...">
            </div>
          </div>
          
          <div class="bg-indigo-50/50 dark:bg-slate-900/50 px-5 py-3 rounded-2xl border border-indigo-100 dark:border-slate-700 flex items-center gap-3">
             <div class="w-1.5 h-1.5 bg-indigo-400 rounded-full"></div>
             <p class="text-[9px] font-black text-indigo-700 dark:text-indigo-400 uppercase leading-tight tracking-widest">Acceso<br>Coordinador</p>
          </div>
        </div>
      </div>
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
