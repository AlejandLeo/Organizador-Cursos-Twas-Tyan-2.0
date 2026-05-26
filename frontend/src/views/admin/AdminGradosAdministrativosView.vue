<template>
  <div class="space-y-6 animate-fade-in pb-12">
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <h1 class="text-2xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
          <span class="material-symbols-outlined text-umsa-blue dark:text-blue-400 text-3xl md:text-4xl">badge</span>
          Catálogo de Grados Administrativos
        </h1>
        <p class="text-slate-500 dark:text-gray-400 mt-1">
          Gestione los cargos o grados administrativos (ej. Decano, Director) para las firmas de coordinadores.
        </p>
      </div>

      <button @click="abrirModal()" class="btn-primary flex items-center gap-2 whitespace-nowrap bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-all">
        <span class="material-symbols-outlined">add</span> Nuevo Grado
      </button>
    </div>

    <!-- Tabla -->
    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 overflow-hidden relative">
      <div v-if="isLoading" class="absolute inset-0 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
        <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        <p class="mt-3 text-sm font-semibold text-slate-600 dark:text-gray-300">Cargando catálogo...</p>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-50 dark:bg-gray-900/50 text-slate-500 dark:text-gray-400 text-xs uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-gray-700">
              <th class="p-4 pl-6">ID</th>
              <th class="p-4">Nombre Completo</th>
              <th class="p-4">Abreviatura</th>
              <th class="p-4 pr-6 text-right w-32">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-gray-700">
            <tr v-for="g in grados" :key="g.id" class="hover:bg-slate-50/80 dark:hover:bg-gray-700/50 transition-colors group">
              <td class="p-4 pl-6 text-slate-500 font-mono text-sm">#{{ g.id }}</td>
              <td class="p-4 font-semibold text-slate-700 dark:text-gray-200">{{ g.nombre }}</td>
              <td class="p-4">
                <span v-if="g.abreviatura" class="px-2.5 py-1 bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-gray-300 rounded-md text-sm font-mono border border-slate-200 dark:border-gray-600">
                  {{ g.abreviatura }}
                </span>
                <span v-else class="text-slate-400 text-sm italic">Sin abrev.</span>
              </td>
              <td class="p-4 pr-6 text-right">
                <div class="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button @click="abrirModal(g)" class="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg" title="Editar">
                    <span class="material-symbols-outlined text-[20px]">edit</span>
                  </button>
                  <button @click="eliminar(g.id)" class="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg" title="Eliminar">
                    <span class="material-symbols-outlined text-[20px]">delete</span>
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="grados.length === 0 && !isLoading">
              <td colspan="4" class="p-8 text-center text-slate-500 dark:text-gray-400">
                <span class="material-symbols-outlined text-4xl mb-3 opacity-50">search_off</span>
                <p>No hay grados administrativos registrados.</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Formulario -->
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" @click.self="showModal = false">
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-scale-in flex flex-col">
        <div class="p-5 border-b border-slate-100 dark:border-gray-700 flex justify-between items-center bg-slate-50 dark:bg-gray-800/50">
          <h3 class="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
            <span class="material-symbols-outlined text-blue-600">{{ isEditing ? 'edit' : 'add_circle' }}</span>
            {{ isEditing ? 'Editar' : 'Nuevo' }} Grado
          </h3>
          <button @click="showModal = false" class="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-full hover:bg-slate-200 dark:hover:bg-gray-700 transition-colors">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        
        <form @submit.prevent="guardar" class="p-6 flex flex-col gap-4">
          <div>
            <label class="block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-1">Nombre Completo <span class="text-red-500">*</span></label>
            <input v-model="form.nombre" type="text" required class="w-full px-4 py-2 bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ej. Decano, Vicedecano, Director">
          </div>
          <div>
            <label class="block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-1">Abreviatura</label>
            <input v-model="form.abreviatura" type="text" class="w-full px-4 py-2 bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ej. Dec., Dir., Jefe">
          </div>

          <div class="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-gray-700">
            <button type="button" @click="showModal = false" class="px-5 py-2 font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-xl transition-colors">
              Cancelar
            </button>
            <button type="submit" class="px-5 py-2 font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl flex items-center gap-2 transition-colors">
              <span class="material-symbols-outlined text-[20px]">save</span> Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import api from '@/services/api';
import Swal from 'sweetalert2';

const grados = ref<any[]>([]);
const isLoading = ref(false);
const showModal = ref(false);
const isEditing = ref(false);
const currentId = ref<number | null>(null);

const form = ref({
  nombre: '',
  abreviatura: ''
});

const fetchGrados = async () => {
  try {
    isLoading.value = true;
    const res = await api.get('/admin/grados-administrativos');
    grados.value = res.data;
  } catch (error) {
    console.error(error);
  } finally {
    isLoading.value = false;
  }
};

const abrirModal = (item?: any) => {
  if (item) {
    isEditing.value = true;
    currentId.value = item.id;
    form.value = { nombre: item.nombre, abreviatura: item.abreviatura };
  } else {
    isEditing.value = false;
    currentId.value = null;
    form.value = { nombre: '', abreviatura: '' };
  }
  showModal.value = true;
};

const guardar = async () => {
  try {
    if (isEditing.value && currentId.value) {
      await api.patch(`/admin/grados-administrativos/${currentId.value}`, form.value);
      Swal.fire({ toast: true, icon: 'success', title: 'Actualizado', timer: 2000, showConfirmButton: false, position: 'top-end' });
    } else {
      await api.post('/admin/grados-administrativos', form.value);
      Swal.fire({ toast: true, icon: 'success', title: 'Creado', timer: 2000, showConfirmButton: false, position: 'top-end' });
    }
    showModal.value = false;
    fetchGrados();
  } catch (error: any) {
    Swal.fire('Error', error.response?.data?.message || 'Error al guardar', 'error');
  }
};

const eliminar = async (id: number) => {
  const { isConfirmed } = await Swal.fire({
    title: '¿Eliminar grado?',
    text: "Esta acción no se puede deshacer.",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar'
  });

  if (isConfirmed) {
    try {
      await api.delete(`/admin/grados-administrativos/${id}`);
      Swal.fire({ toast: true, icon: 'success', title: 'Eliminado', timer: 2000, showConfirmButton: false, position: 'top-end' });
      fetchGrados();
    } catch (error: any) {
      Swal.fire('Error', error.response?.data?.message || 'Error al eliminar', 'error');
    }
  }
};

onMounted(() => {
  fetchGrados();
});
</script>
