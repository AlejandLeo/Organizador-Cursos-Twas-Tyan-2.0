<script setup lang="ts">
import { ref, onMounted } from 'vue';
import api from '@/services/api';

const loading = ref(false);
const error = ref('');
const success = ref('');

const formData = ref({
  nombres: '',
  primer_apellido: '',
  segundo_apellido: '',
  documento_identidad: '',
  genero: '',
  pais_origen: '',
  pais_residencia: '',
  fecha_nacimiento: '',
  celular: '',
  institucion: '',
  id_grado_academico: null as number | null
});

const profilePhotoUrl = ref('');

// Lista estática o dinámica de grados académicos
const gradosAcademicos = ref([
  { id: 1, nombre: 'Estudiante de Grado / Undergraduate Student' },
  { id: 2, nombre: 'Licenciatura / Bachelor' },
  { id: 3, nombre: 'Maestría / Master' },
  { id: 4, nombre: 'Doctorado / PhD' },
  { id: 5, nombre: 'Postdoctorado / Postdoc' },
  { id: 6, nombre: 'Investigador / Researcher' },
  { id: 7, nombre: 'Profesor / Professor' },
  { id: 8, nombre: 'Otro / Other' }
]);

const loadProfile = async () => {
  try {
    const res = await api.get('/auth/me'); 
    
    if (res.data?.persona) {
      formData.value = { ...formData.value, ...res.data.persona };
      if (formData.value.fecha_nacimiento) {
        const isoStr = new Date(formData.value.fecha_nacimiento).toISOString();
        formData.value.fecha_nacimiento = isoStr.split('T')[0] || '';
      }
    }
    
    if (res.data?.afiliaciones && res.data.afiliaciones.length > 0) {
      const afiliacion = res.data.afiliaciones[0];
      formData.value.institucion = afiliacion.institucion;
      formData.value.id_grado_academico = afiliacion.id_grado_academico;
    }
    
    // Attempt to load photo
    await loadPhoto();
  } catch (err) {
    console.error('Error loading profile', err);
  }
};

const loadPhoto = async () => {
  try {
    const photoRes = await api.get('/usuarios/perfil/foto', { responseType: 'blob' });
    if (profilePhotoUrl.value) URL.revokeObjectURL(profilePhotoUrl.value);
    profilePhotoUrl.value = URL.createObjectURL(photoRes.data);
  } catch (e) {
    profilePhotoUrl.value = '';
  }
};

const handleUpdateProfile = async () => {
  loading.value = true;
  error.value = '';
  success.value = '';
  try {
     
    const dataToSend = { ...formData.value };
    await api.patch('/usuarios/perfil/datos', dataToSend);
    success.value = 'Perfil actualizado correctamente.';
  } catch (e: unknown) {
    const errorRes = e as { response?: { data?: { message?: string } } };
    error.value = errorRes.response?.data?.message || 'Ocurrió un error al actualizar el perfil.';
  } finally {
    loading.value = false;
  }
};

const photoRef = ref<HTMLInputElement | null>(null);

const handlePhotoUpload = async (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (!target.files || !target.files.length) return;
  const file = target.files[0];
  
  const fd = new FormData();
  fd.append('file', file as Blob);
  
  try {
    loading.value = true;
    await api.post('/usuarios/perfil/upload-foto', fd, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    success.value = 'Foto actualizada correctamente.';
    await loadPhoto();
  } catch (err: unknown) {
     const errorRes = err as { response?: { data?: { message?: string } } };
     error.value = errorRes.response?.data?.message || 'Error al subir foto.';
  } finally {
     loading.value = false;
  }
};

onMounted(() => {
  loadProfile();
});
</script>

<template>
  <div class="p-6 md:p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div class="flex items-center justify-between border-b border-slate-200 dark:border-gray-800 pb-6 mb-8">
      <div>
        <h1 class="text-2xl md:text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Mi Perfil</h1>
        <p class="text-sm font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mt-1">Gestiona tus datos personales y afiliación</p>
      </div>
      <div class="h-12 w-12 rounded-2xl bg-umsa-blue/10 dark:bg-blue-900/20 text-umsa-blue dark:text-blue-400 flex items-center justify-center border border-umsa-blue/20">
        <span class="material-symbols-outlined text-[24px]">manage_accounts</span>
      </div>
    </div>

    <div v-if="error" class="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold border border-red-200">{{ error }}</div>
    <div v-if="success" class="bg-emerald-50 text-emerald-600 p-4 rounded-xl text-sm font-bold border border-emerald-200">{{ success }}</div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      
      <!-- Panel lateral de Archivos -->
      <div class="space-y-6 md:col-span-1">
        <!-- Foto de Perfil -->
        <div class="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-slate-200 dark:border-gray-800 shadow-sm flex flex-col items-center text-center">
          <div class="w-32 h-32 rounded-full overflow-hidden border-4 border-slate-100 dark:border-gray-800 mb-4 bg-slate-50 dark:bg-gray-800">
            <img v-if="profilePhotoUrl" :src="profilePhotoUrl" alt="Foto" class="w-full h-full object-cover" @error="profilePhotoUrl = ''" />
            <span v-else class="material-symbols-outlined text-6xl text-slate-300 dark:text-gray-600 h-full flex items-center justify-center">account_circle</span>
          </div>
          <h3 class="text-sm font-black uppercase text-slate-700 dark:text-gray-200">Foto de Perfil (Opcional)</h3>
          <p class="text-[10px] text-slate-400 mb-4 mt-1">Formatos JPG, PNG<br>Dimensiones recomendadas: 300x300px o 1:1<br>Tamaño máximo 2MB</p>
          
          <input type="file" ref="photoRef" class="hidden" accept="image/jpeg, image/png" @change="handlePhotoUpload" />
          <button @click="photoRef?.click()" :disabled="loading" class="text-xs px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-slate-600 dark:text-gray-300 font-bold rounded-lg transition-colors border border-slate-200 dark:border-gray-700 w-full uppercase tracking-wider">
            Subir Foto
          </button>
        </div>
      </div>

      <!-- Formulario de Datos Personales -->
      <div class="md:col-span-2 bg-white dark:bg-gray-900 p-6 md:p-8 rounded-2xl border border-slate-200 dark:border-gray-800 shadow-sm">
        <h3 class="text-sm font-black uppercase text-slate-800 dark:text-white mb-6 tracking-widest border-b border-slate-100 dark:border-gray-800 pb-4">Datos Personales y Afiliación</h3>
        
        <form @submit.prevent="handleUpdateProfile" class="space-y-5">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label class="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 block">Nombres</label>
              <input v-model="formData.nombres" type="text" class="w-full py-2.5 px-3 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-umsa-blue outline-none" required />
            </div>
            <div>
              <label class="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 block">Primer Apellido</label>
              <input v-model="formData.primer_apellido" type="text" class="w-full py-2.5 px-3 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-umsa-blue outline-none" required />
            </div>
            <div>
              <label class="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 block">Segundo Apellido</label>
              <input v-model="formData.segundo_apellido" type="text" class="w-full py-2.5 px-3 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-umsa-blue outline-none" />
            </div>
            <div>
              <label class="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 block">Documento Identidad</label>
              <input v-model="formData.documento_identidad" type="text" class="w-full py-2.5 px-3 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-umsa-blue outline-none" required />
            </div>
            <div>
              <label class="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 block">Fecha de Nacimiento</label>
              <input v-model="formData.fecha_nacimiento" type="date" class="w-full py-2.5 px-3 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-umsa-blue outline-none" />
            </div>
             <div>
              <label class="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 block">Celular</label>
              <input v-model="formData.celular" type="text" class="w-full py-2.5 px-3 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-umsa-blue outline-none" />
            </div>
            <div>
              <label class="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 block">País Origen</label>
              <input v-model="formData.pais_origen" type="text" class="w-full py-2.5 px-3 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-umsa-blue outline-none" />
            </div>
            <div>
              <label class="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 block">País Residencia</label>
              <input v-model="formData.pais_residencia" type="text" class="w-full py-2.5 px-3 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-umsa-blue outline-none" />
            </div>
          </div>
          
          <div class="mt-6 border-t border-slate-100 dark:border-gray-800 pt-6 grid grid-cols-1 md:grid-cols-2 gap-5">
            <div class="md:col-span-2">
              <label class="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 block">Institución / Universidad</label>
              <input v-model="formData.institucion" type="text" placeholder="Ej. Universidad Mayor de San Andrés" class="w-full py-2.5 px-3 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-umsa-blue outline-none" />
            </div>
            <div class="md:col-span-2">
              <label class="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 block">Grado Académico</label>
              <select v-model="formData.id_grado_academico" class="w-full py-2.5 px-3 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-umsa-blue outline-none text-slate-700 dark:text-gray-200">
                <option :value="null">Seleccione un grado académico</option>
                <option v-for="grado in gradosAcademicos" :key="grado.id" :value="grado.id">
                  {{ grado.nombre }}
                </option>
              </select>
            </div>
          </div>
          
          <div class="pt-4 flex justify-end">
            <button type="submit" :disabled="loading" class="bg-umsa-blue hover:bg-blue-800 text-white font-black text-xs uppercase tracking-widest px-6 py-3 rounded-lg shadow-md transition-colors disabled:opacity-50">
              {{ loading ? 'Guardando...' : 'Guardar Cambios' }}
            </button>
          </div>
        </form>
      </div>

    </div>
  </div>
</template>