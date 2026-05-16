<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import api from '@/services/api';
import Swal from 'sweetalert2';

const router = useRouter();
const actividades = ref<any[]>([]);
const eventos = ref<any[]>([]);
const isLoading = ref(true);
const filtroTexto = ref('');
const filtroEvento = ref('');

const fetchDatos = async () => {
  try {
    isLoading.value = true;
    const [resAct, resEv] = await Promise.all([
      api.get('/actividades-academicas'),
      api.get('/eventos')
    ]);
    
    actividades.value = Array.isArray(resAct.data) ? resAct.data : resAct.data?.data || [];
    eventos.value = resEv.data?.data || resEv.data || [];
  } catch (e) {
    console.error('Error fetching data:', e);
    Swal.fire('Error', 'No se pudieron cargar las actividades.', 'error');
  } finally {
    isLoading.value = false;
  }
};

const actividadesFiltradas = computed(() => {
  return actividades.value.filter(a => {
    const matchesTexto = !filtroTexto.value || a.nombre.toLowerCase().includes(filtroTexto.value.toLowerCase());
    const matchesEvento = !filtroEvento.value || String(a.evento?.id || a.id_evento) === String(filtroEvento.value);
    return matchesTexto && matchesEvento;
  });
});

const abrirCrearActividad = async () => {
  const eventOptions = eventos.value.reduce((acc, ev) => {
    acc[ev.id] = ev.nombre;
    return acc;
  }, {} as Record<number, string>);

  const { value: eventId } = await Swal.fire({
    title: '<span class="text-amber-600 font-black italic">NUEVA ACTIVIDAD</span>',
    text: 'Selecciona el evento padre:',
    input: 'select',
    inputOptions: eventOptions,
    inputPlaceholder: 'Seleccionar evento...',
    showCancelButton: true,
    confirmButtonColor: '#f59e0b',
  });

  if (eventId) {
    router.push({ 
      name: 'admin-gestion-eventos',
      query: { eventoId: eventId, newAct: 'true' }
    });
  }
};

const abrirEditar = (act: any) => {
  router.push({ 
    name: 'admin-gestion-eventos', 
    query: { eventoId: act.evento?.id || act.id_evento, editAct: act.id }
  });
};

const irADetalle = (act: any) => {
  router.push({ name: 'admin-gestion-eventos-detalle', params: { id: act.id } });
};

onMounted(fetchDatos);
</script>

<template>
  <div class="space-y-8 animate-in fade-in duration-500">
    <!-- HEADER -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-3 mb-2">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-700 flex items-center justify-center shadow-lg shadow-amber-900/40">
            <span class="material-symbols-outlined text-white text-[22px]">school</span>
          </div>
          <div>
            <p class="text-[10px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-widest leading-none">Académico</p>
            <h1 class="text-2xl font-black text-slate-800 dark:text-white tracking-tight uppercase italic">Directorio de Actividades</h1>
          </div>
        </div>
        <p class="text-slate-500 text-sm ml-1">Cursos, talleres y conferencias de todos los eventos</p>
      </div>
      <button @click="abrirCrearActividad"
              class="flex items-center gap-2 px-6 py-3 bg-amber-500 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20">
        <span class="material-symbols-outlined text-[18px]">add_circle</span>
        Nueva Actividad
      </button>
    </div>

    <!-- FILTROS -->
    <div class="bg-white dark:bg-[#13131f] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm">
      <div class="flex flex-wrap items-center gap-4">
        <div class="flex-1 min-w-[250px] relative">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400">search</span>
          <input v-model="filtroTexto" type="text" placeholder="Buscar por nombre..."
                 class="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm outline-none focus:border-amber-500/50 transition-all" />
        </div>
        <select v-model="filtroEvento" class="px-4 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold uppercase outline-none focus:border-amber-500/50">
          <option value="">Todos los eventos</option>
          <option v-for="ev in eventos" :key="ev.id" :value="ev.id">{{ ev.nombre }}</option>
        </select>
      </div>
    </div>

    <!-- TABLA -->
    <div class="bg-white dark:bg-[#13131f] border border-slate-200 dark:border-white/5 rounded-[2rem] overflow-hidden shadow-sm">
      <div v-if="isLoading" class="flex justify-center items-center py-20">
        <div class="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
      <div v-else-if="actividadesFiltradas.length === 0" class="flex flex-col items-center py-20 text-slate-400">
        <span class="material-symbols-outlined text-6xl opacity-20 mb-2">inventory_2</span>
        <p class="text-xs font-black uppercase tracking-widest">No se encontraron actividades</p>
      </div>
      <div v-else class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-50 dark:bg-white/5 text-[10px] font-black text-slate-500 uppercase tracking-widest">
              <th class="px-6 py-4">Actividad / Tipo</th>
              <th class="px-6 py-4">Evento Padre</th>
              <th class="px-6 py-4">Fechas</th>
              <th class="px-6 py-4 text-center">Horas</th>
              <th class="px-6 py-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-white/5">
            <tr v-for="act in actividadesFiltradas" :key="act.id" class="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 flex items-center justify-center font-black">
                    <span class="material-symbols-outlined text-[20px]">menu_book</span>
                  </div>
                  <div>
                    <p class="text-sm font-black text-slate-800 dark:text-white leading-tight">{{ act.nombre }}</p>
                    <p class="text-[9px] text-amber-600 font-bold uppercase tracking-widest">{{ act.tipo }}</p>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4">
                <span class="text-[10px] font-bold bg-slate-100 dark:bg-white/5 text-slate-500 px-2 py-1 rounded-lg border border-slate-200 dark:border-white/10 uppercase">
                  {{ act.evento?.nombre || 'Independiente' }}
                </span>
              </td>
              <td class="px-6 py-4">
                <p class="text-[10px] font-bold text-slate-500">{{ act.fecha_inicio?.split('T')[0] }} <span v-if="act.fecha_fin">/ {{ act.fecha_fin?.split('T')[0] }}</span></p>
              </td>
              <td class="px-6 py-4 text-center">
                <span class="text-sm font-black text-slate-700 dark:text-slate-300">{{ act.horas || '—' }}h</span>
              </td>
              <td class="px-6 py-4">
                <div class="flex items-center justify-end gap-2">
                  <button @click="irADetalle(act)" title="Gestionar Estudiantes"
                          class="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all shadow-sm">
                    <span class="material-symbols-outlined text-[18px]">groups</span>
                  </button>
                  <button @click="abrirEditar(act)" title="Editar"
                          class="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                    <span class="material-symbols-outlined text-[18px]">edit</span>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
