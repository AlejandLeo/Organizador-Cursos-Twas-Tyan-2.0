<script setup lang="ts">
import { ref, onMounted } from 'vue';
import api from '@/services/api';

const events = ref<any[]>([]);
const loading = ref(false);

const fetchEvents = async () => {
  loading.value = true;
  try {
    const res = await api.get('/eventos');
    events.value = Array.isArray(res.data) ? res.data : res.data.data || [];
  } catch (err) {
    console.error('Error fetching events', err);
  } finally {
    loading.value = false;
  }
};

onMounted(fetchEvents);
</script>

<template>
  <div class="space-y-8 animate-in fade-in duration-500">
    <div class="border-b border-slate-200 dark:border-gray-800 pb-6 flex justify-between items-end">
      <div>
        <h2 class="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic">Información de Eventos</h2>
        <p class="text-slate-500 dark:text-gray-400 font-medium mt-1">Consulta los detalles de los eventos vigentes.</p>
      </div>
      <div class="h-10 w-10 rounded-xl bg-teal-50 dark:bg-teal-900/20 text-teal-600 flex items-center justify-center border border-teal-100">
        <span class="material-symbols-outlined">event_note</span>
      </div>
    </div>

    <div v-if="loading" class="flex justify-center py-20">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="evento in events" :key="evento.id" class="bg-white dark:bg-gray-900 rounded-3xl border border-slate-200 dark:border-gray-800 overflow-hidden shadow-sm hover:shadow-xl transition-all group">
        <div class="h-32 bg-slate-100 dark:bg-gray-800 relative overflow-hidden">
          <img v-if="evento.logo_url" :src="evento.logo_url" class="w-full h-full object-cover opacity-80 group-hover:scale-110 transition-transform duration-700" />
          <div v-else class="w-full h-full flex items-center justify-center text-slate-300">
            <span class="material-symbols-outlined text-5xl">image</span>
          </div>
          <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          <div class="absolute bottom-3 left-4">
             <span class="text-[9px] font-black uppercase bg-teal-600 text-white px-2 py-1 rounded-md tracking-widest">Activo</span>
          </div>
        </div>
        <div class="p-6">
          <h3 class="text-lg font-black text-slate-800 dark:text-white leading-tight mb-2 uppercase">{{ evento.nombre_evento }}</h3>
          <p class="text-xs text-slate-500 dark:text-gray-400 line-clamp-2 mb-4">{{ evento.descripcion }}</p>
          
          <div class="flex items-center gap-3 pt-4 border-t border-slate-100 dark:border-gray-800">
             <div class="flex flex-col">
                <span class="text-[9px] font-black uppercase text-slate-400">Modalidad</span>
                <span class="text-xs font-bold text-slate-700 dark:text-gray-300">Presencial / Virtual</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
