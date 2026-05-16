<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import api from '@/services/api';
import Swal from 'sweetalert2';

const templates = ref<any[]>([]);
const isLoading = ref(false);
const isEditing = ref(false);
const showModal = ref(false);

const currentTemplate = ref({
  id: null,
  nombre: '',
  descripcion: '',
  asunto: '',
  cuerpo: '',
  tipo: 'WELCOME'
});

const fetchTemplates = async () => {
  try {
    isLoading.value = true;
    const res = await api.get('/admin/mail-templates');
    templates.value = res.data;
  } catch (e) {
    console.error(e);
  } finally {
    isLoading.value = false;
  }
};

onMounted(fetchTemplates);

const openCreate = () => {
  currentTemplate.value = { id: null, nombre: '', descripcion: '', asunto: '', cuerpo: '', tipo: 'WELCOME' };
  isEditing.value = false;
  showModal.value = true;
};

const openEdit = (t: any) => {
  currentTemplate.value = { ...t };
  isEditing.value = true;
  showModal.value = true;
};

const save = async () => {
  try {
    if (isEditing.value) {
      await api.patch(`/admin/mail-templates/${currentTemplate.value.id}`, currentTemplate.value);
    } else {
      await api.post('/admin/mail-templates', currentTemplate.value);
    }
    Swal.fire('Éxito', 'Plantilla guardada correctamente', 'success');
    showModal.value = false;
    fetchTemplates();
  } catch (e: any) {
    Swal.fire('Error', e.response?.data?.message || 'Error al guardar', 'error');
  }
};

const deleteTemplate = async (id: number) => {
  const result = await Swal.fire({
    title: '¿Estás seguro?',
    text: "Esta acción no se puede deshacer",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    confirmButtonText: 'Sí, eliminar'
  });

  if (result.isConfirmed) {
    try {
      await api.delete(`/admin/mail-templates/${id}`);
      Swal.fire('Eliminado', 'La plantilla ha sido eliminada', 'success');
      fetchTemplates();
    } catch (e) {
      Swal.fire('Error', 'No se pudo eliminar', 'error');
    }
  }
};

const getTipoColor = (tipo: string) => {
  switch (tipo) {
    case 'WELCOME': return 'bg-blue-500/20 text-blue-500 border-blue-500/20';
    case 'ENROLLMENT': return 'bg-emerald-500/20 text-emerald-500 border-emerald-500/20';
    case 'CERTIFICATE': return 'bg-amber-500/20 text-amber-500 border-amber-500/20';
    default: return 'bg-slate-500/20 text-slate-500 border-slate-500/20';
  }
};
</script>

<template>
  <div class="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 class="text-3xl font-black text-slate-800 dark:text-white tracking-tight">Gestión de Plantillas</h1>
        <p class="text-slate-500 dark:text-slate-400 font-medium">Personaliza los correos automáticos del sistema</p>
      </div>
      <button @click="openCreate"
              class="flex items-center gap-2 px-6 py-3 bg-umsa-blue text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:-translate-y-1 transition-all">
        <span class="material-symbols-outlined text-[18px]">add</span>
        Nueva Plantilla
      </button>
    </div>

    <!-- Grid -->
    <div v-if="isLoading" class="flex justify-center py-20">
      <div class="animate-spin w-10 h-10 border-4 border-umsa-blue border-t-transparent rounded-full"></div>
    </div>

    <div v-else-if="templates.length === 0" class="bg-white dark:bg-white/5 rounded-3xl p-20 text-center border border-slate-200 dark:border-white/10">
      <span class="material-symbols-outlined text-6xl text-slate-300 mb-4">mail_outline</span>
      <p class="text-slate-500 font-bold">No hay plantillas personalizadas creadas todavía.</p>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="t in templates" :key="t.id" 
           class="bg-white dark:bg-[#0d0d14] rounded-3xl border border-slate-200 dark:border-white/5 p-6 shadow-xl shadow-slate-200/50 dark:shadow-none hover:border-umsa-blue/30 transition-all group">
        <div class="flex justify-between items-start mb-4">
          <span :class="getTipoColor(t.tipo)" class="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border">
            {{ t.tipo }}
          </span>
          <div class="flex gap-2">
            <button @click="openEdit(t)" class="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-500/10 rounded-xl transition-all">
              <span class="material-symbols-outlined text-[20px]">edit</span>
            </button>
            <button @click="deleteTemplate(t.id)" class="p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all">
              <span class="material-symbols-outlined text-[20px]">delete</span>
            </button>
          </div>
        </div>
        <h3 class="text-lg font-black text-slate-800 dark:text-white mb-1">{{ t.nombre }}</h3>
        <p class="text-xs text-slate-500 mb-4 line-clamp-2">{{ t.descripcion || 'Sin descripción' }}</p>
        <div class="pt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-widest">
          <span>Creada: {{ new Date(t.fecha_creacion).toLocaleDateString() }}</span>
          <span class="text-umsa-blue group-hover:translate-x-1 transition-transform">Ver detalle →</span>
        </div>
      </div>
    </div>

    <!-- Modal Form -->
    <div v-if="showModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div class="bg-white dark:bg-[#1a1a24] w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] animate-in zoom-in duration-300">
        <div class="p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-black/20">
          <h3 class="text-xl font-black text-slate-800 dark:text-white">
            {{ isEditing ? 'Editar Plantilla' : 'Nueva Plantilla' }}
          </h3>
          <button @click="showModal = false" class="w-10 h-10 rounded-full hover:bg-slate-200 dark:hover:bg-white/10 flex items-center justify-center transition-all">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <div class="flex-1 overflow-y-auto p-8 space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-2">
              <label class="text-[11px] font-black text-slate-400 uppercase ml-2 tracking-widest">Nombre de la Plantilla</label>
              <input v-model="currentTemplate.nombre" type="text" placeholder="Ej: Bienvenida Curso IA"
                     class="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-3 text-sm outline-none focus:border-umsa-blue transition-all">
            </div>
            <div class="space-y-2">
              <label class="text-[11px] font-black text-slate-400 uppercase ml-2 tracking-widest">Tipo de Notificación</label>
              <select v-model="currentTemplate.tipo"
                      class="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-3 text-sm outline-none focus:border-umsa-blue transition-all">
                <option value="WELCOME">Registro al Sistema (Bienvenida)</option>
                <option value="ENROLLMENT">Inscripción a Evento</option>
                <option value="CERTIFICATE">Envío de Certificado</option>
                <option value="GENERAL">Mensaje General</option>
              </select>
            </div>
          </div>

          <div class="space-y-2">
            <label class="text-[11px] font-black text-slate-400 uppercase ml-2 tracking-widest">Asunto del Correo (Subject)</label>
            <input v-model="currentTemplate.asunto" type="text" placeholder="Ej: ¡Bienvenido a {{nombre}}!"
                   class="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-3 text-sm outline-none focus:border-umsa-blue transition-all">
          </div>

          <div class="space-y-2">
            <label class="text-[11px] font-black text-slate-400 uppercase ml-2 tracking-widest flex items-center justify-between">
              Cuerpo del Mensaje (HTML)
              <span class="text-[9px] lowercase font-normal italic text-slate-400">Usa \{\{nombre\}\}, \{\{email\}\}, \{\{password\}\}, \{\{actividad\}\}</span>
            </label>
            <textarea v-model="currentTemplate.cuerpo" rows="12"
                      class="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-4 text-sm font-mono outline-none focus:border-umsa-blue transition-all"
                      placeholder="Escribe tu mensaje aquí. Puedes usar etiquetas HTML..."></textarea>
          </div>
        </div>

        <div class="p-6 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-black/20 flex justify-end gap-3">
          <button @click="showModal = false" class="px-6 py-3 text-slate-500 font-black uppercase text-[10px] tracking-widest hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-all">
            Cancelar
          </button>
          <button @click="save" class="px-8 py-3 bg-umsa-blue text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:scale-105 transition-all">
            Guardar Plantilla
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
