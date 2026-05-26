<script setup lang="ts">
import { ref, onMounted } from 'vue';
import api from '@/services/api';

const misEventos = ref<any[]>([]);
const loading = ref(true);
const expandedEvento = ref<number | null>(null);

const fetchMisEventos = async () => {
  loading.value = true;
  try {
    const res = await api.get('/logistica/sesiones-academicas/mis-eventos');
    misEventos.value = Array.isArray(res.data) ? res.data : [];
  } catch (err) {
    console.error('Error fetching mis eventos', err);
  } finally {
    loading.value = false;
  }
};

const toggleEvento = (id: number) => {
  expandedEvento.value = expandedEvento.value === id ? null : id;
};

const faseLabel = (fase: number) => {
  const map: Record<number, string> = { 1: 'Planificación', 2: 'Inscripciones', 3: 'En Curso', 4: 'Finalizado', 5: 'Archivado' };
  return map[fase] || `Fase ${fase}`;
};

const faseColor = (fase: number) => {
  if (fase <= 2) return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400';
  if (fase === 3) return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400';
  return 'bg-slate-100 text-slate-500 dark:bg-gray-800 dark:text-gray-400';
};

onMounted(fetchMisEventos);
</script>

<template>
  <div class="space-y-8 animate-in fade-in duration-500">
    <div class="border-b border-slate-200 dark:border-gray-800 pb-6 flex justify-between items-end">
      <div>
        <h2 class="text-3xl font-black text-teal-600 dark:text-teal-400 uppercase tracking-tighter italic">Eventos Asignados</h2>
        <p class="text-slate-500 dark:text-gray-400 font-medium mt-1">Eventos donde estás asignado como personal de apoyo.</p>
      </div>
      <div class="h-10 w-10 rounded-xl bg-teal-50 dark:bg-teal-900/20 text-teal-600 flex items-center justify-center border border-teal-100 dark:border-teal-800">
        <span class="material-symbols-outlined">event_note</span>
      </div>
    </div>

    <div v-if="loading" class="flex justify-center py-20">
      <span class="material-symbols-outlined animate-spin text-4xl text-teal-500">progress_activity</span>
    </div>

    <div v-else-if="misEventos.length === 0" class="text-center py-20">
      <div class="w-20 h-20 mx-auto rounded-full bg-slate-100 dark:bg-gray-800 flex items-center justify-center mb-6">
        <span class="material-symbols-outlined text-4xl text-slate-300">event_busy</span>
      </div>
      <p class="text-slate-500 dark:text-gray-400 font-bold uppercase tracking-widest text-xs">No tienes eventos asignados aún</p>
      <p class="text-slate-400 text-xs mt-2">Contacta a tu coordinador para que te asigne a un evento.</p>
    </div>

    <div v-else class="space-y-6">
      <div v-for="evento in misEventos" :key="evento.id"
           class="bg-white dark:bg-gray-900 rounded-3xl border border-slate-200 dark:border-gray-800 shadow-sm overflow-hidden transition-all">
        
        <!-- Evento Header (clickable) -->
        <div @click="toggleEvento(evento.id)" 
             class="p-6 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-gray-800/50 transition-colors">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white flex items-center justify-center shadow-lg shadow-teal-900/20">
              <span class="material-symbols-outlined text-[28px]">event</span>
            </div>
            <div>
              <h3 class="text-lg font-black text-slate-800 dark:text-white uppercase leading-tight">{{ evento.nombre }}</h3>
              <div class="flex items-center gap-3 mt-1.5">
                <span :class="faseColor(evento.fase)" class="text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-widest">
                  {{ faseLabel(evento.fase) }}
                </span>
                <span class="text-[10px] font-bold text-slate-400">
                  {{ evento.actividades?.length || 0 }} actividades
                </span>
              </div>
            </div>
          </div>
          <span class="material-symbols-outlined text-slate-400 transition-transform duration-300"
                :class="{ 'rotate-180': expandedEvento === evento.id }">
            expand_more
          </span>
        </div>

        <!-- Actividades (expandable) -->
        <div v-if="expandedEvento === evento.id" class="border-t border-slate-100 dark:border-gray-800 p-6 space-y-4 animate-in slide-in-from-top-2 duration-300">
          <div v-if="!evento.actividades || evento.actividades.length === 0" class="text-center py-6">
            <p class="text-sm text-slate-400 font-bold">Este evento no tiene actividades registradas.</p>
          </div>

          <div v-for="act in (evento.actividades || [])" :key="act.id"
               class="bg-slate-50 dark:bg-gray-800/50 rounded-2xl p-5 border border-slate-100 dark:border-gray-700">
            <div class="flex items-center justify-between mb-3">
              <h4 class="text-sm font-black text-slate-700 dark:text-white uppercase">{{ act.nombre }}</h4>
              <router-link :to="'/logistica/asistencia'" 
                class="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-teal-700 transition-colors shadow-sm">
                <span class="material-symbols-outlined text-sm">qr_code_scanner</span>
                Tomar Asistencia
              </router-link>
            </div>

            <div v-if="act.sesiones && act.sesiones.length > 0" class="space-y-2">
              <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Sesiones Programadas</p>
              <div v-for="s in act.sesiones" :key="s.id" class="flex items-center gap-3 text-xs">
                <span class="material-symbols-outlined text-teal-500 text-sm">schedule</span>
                <span class="font-bold text-slate-600 dark:text-gray-300">{{ s.fecha }}</span>
                <span class="text-slate-400">{{ s.hora_inicio }} - {{ s.hora_fin }}</span>
                <span v-if="s.aula" class="text-slate-400">({{ s.aula }})</span>
              </div>
            </div>
            <div v-else class="text-xs text-slate-400 italic">Sin sesiones programadas</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
