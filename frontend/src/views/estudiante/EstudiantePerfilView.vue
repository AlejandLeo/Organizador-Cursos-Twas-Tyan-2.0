<script setup lang="ts">
import { ref, onMounted } from 'vue';
import api from '@/services/api';
import Swal from 'sweetalert2';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();

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
  grado_academico: '',
  afiliaciones: [] as any[]
});

const isCoordinator = ref(false);
const firmaUrl = ref('');
const isDraggingFirma = ref(false);

const addAfiliacion = () => {
  if (isCompleted.value) return;
  formData.value.afiliaciones.push({
    institucion: '',
    id_grado_academico: null,
    id_grado_administrativo: null,
    tipo_afiliacion: '',
    area_tematica: '',
    disciplina_cientifica: ''
  });
};

const removeAfiliacion = (index: number) => {
  if (isCompleted.value) return;
  formData.value.afiliaciones.splice(index, 1);
};

const profilePhotoUrl = ref('');
const originalData = ref<Record<string, any>>({});

// Lista dinámica de grados académicos
const gradosAcademicos = ref<any[]>([]);

const loadGradosAcademicos = async () => {
  try {
    const res = await api.get('/grados-academicos');
    gradosAcademicos.value = res.data.data || res.data;
  } catch (err) {
    console.error('Error fetching grados académicos', err);
  }
};

// Lista dinámica de grados/cargos administrativos
const gradosAdministrativos = ref<any[]>([]);

const loadGradosAdministrativos = async () => {
  try {
    const res = await api.get('/admin/grados-administrativos');
    gradosAdministrativos.value = res.data || [];
  } catch (err) {
    console.error('Error fetching grados administrativos', err);
  }
};

const isCompleted = ref(false);

const loadProfile = async () => {
  try {
    const res = await api.get('/auth/me'); 
    
    if (res.data?.persona) {
      isCompleted.value = res.data.persona.perfil_completado || false;
      formData.value = { ...formData.value, ...res.data.persona };
      if (formData.value.fecha_nacimiento) {
        const isoStr = new Date(formData.value.fecha_nacimiento).toISOString();
        formData.value.fecha_nacimiento = isoStr.split('T')[0] || '';
      }
    }
    
    if (res.data?.afiliaciones) {
      formData.value.afiliaciones = res.data.afiliaciones.map((af: any) => ({
        id: af.id,
        institucion: af.institucion,
        id_grado_academico: af.id_grado_academico,
        id_grado_administrativo: af.id_grado_administrativo,
        tipo_afiliacion: af.tipo_afiliacion,
        area_tematica: af.area_tematica,
        disciplina_cientifica: af.disciplina_cientifica
      }));
    }

    // Detectar si es Coordinador, Super Usuario o Ponente para mostrar la firma (case-insensitive)
    const roles = res.data?.usuariosRoles?.map((ur: any) => (ur.rol?.nombre_rol || '').toLowerCase()) || [];
    isCoordinator.value = roles.includes('coordinador') || roles.includes('super usuario') || roles.includes('admin') || roles.includes('ponente');
    
    // Si no hay afiliaciones, añadir una vacía por defecto para que no se vea vacío
    if (formData.value.afiliaciones.length === 0 && !isCompleted.value) {
      addAfiliacion();
    }
    
    originalData.value = { ...formData.value };
    
    await loadPhoto();
    if (isCoordinator.value) await loadFirma();
  } catch (err) {
    console.error('Error loading profile', err);
  }
};

const loadFirma = async () => {
  try {
    const res = await api.get('/usuarios/perfil/firma', { responseType: 'arraybuffer' });
    if (!res.data || res.data.byteLength === 0) {
      firmaUrl.value = '';
      return;
    }
    const blob = new Blob([res.data], { type: 'image/png' });
    if (firmaUrl.value) URL.revokeObjectURL(firmaUrl.value);
    firmaUrl.value = URL.createObjectURL(blob);
  } catch (e) {
    firmaUrl.value = '';
  }
};

const loadPhoto = async () => {
  try {
    const photoRes = await api.get('/usuarios/perfil/foto', { responseType: 'arraybuffer' });
    
    // Si no hay datos (200 OK vacío), limpiar foto
    if (!photoRes.data || photoRes.data.byteLength === 0) {
      profilePhotoUrl.value = '';
      return;
    }

    const blob = new Blob([photoRes.data], { type: (photoRes.headers['content-type'] as any) || 'image/jpeg' });
    
    // Verificar si el contenido es el texto "NONE" (caso especial del backend)
    const text = new TextDecoder().decode(photoRes.data);
    if (text === 'NONE') {
      profilePhotoUrl.value = '';
      return;
    }

    if (profilePhotoUrl.value) URL.revokeObjectURL(profilePhotoUrl.value);
    profilePhotoUrl.value = URL.createObjectURL(blob);
  } catch (e) {
    profilePhotoUrl.value = '';
  }
};

const handleUpdateProfile = async (finalizar = false) => {
  // Verificación básica: al menos una afiliación debe tener institución
  if (formData.value.afiliaciones.length === 0 || !formData.value.afiliaciones[0].institucion) {
    error.value = 'Debe registrar al menos una institución de afiliación.';
    return;
  }

  loading.value = true;
  error.value = '';
  success.value = '';
  try {
    const dataToSend = { ...formData.value, finalizar };
    await api.patch('/usuarios/perfil/datos', dataToSend);
    
    if (finalizar) {
      success.value = '¡Su información de perfil fue registrada exitosamente y ya no podrá ser modificada!';
      isCompleted.value = true;
    } else {
      success.value = 'Perfil actualizado temporalmente. Recuerde finalizar para bloquear el registro.';
    }
    
    // Recargar para sincronizar estado
    await loadProfile();
  } catch (e: unknown) {
    const errorRes = e as { response?: { data?: { message?: string } } };
    error.value = errorRes.response?.data?.message || 'Ocurrió un error al actualizar el perfil.';
  } finally {
    loading.value = false;
  }
};

const photoRef = ref<HTMLInputElement | null>(null);
const isDragging = ref(false);

const uploadFile = async (file: File) => {
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

const handlePhotoUpload = async (e: Event) => {
  if (isCompleted.value && !!profilePhotoUrl.value) return;
  const target = e.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    await uploadFile(target.files[0] as File);
  }
};

const handleDrop = async (e: DragEvent) => {
  e.preventDefault();
  e.stopPropagation();
  isDragging.value = false;
  if (isCompleted.value && !!profilePhotoUrl.value) return;
  if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      await uploadFile(file);
    } else {
      error.value = 'El archivo debe ser una imagen.';
    }
  }
};

const firmaRef = ref<HTMLInputElement | null>(null);

const uploadFirmaFile = async (file: File) => {
  if (file.type !== 'image/png') {
    error.value = 'La firma digital debe estar en formato PNG (fondo transparente recomendado).';
    return;
  }
  
  const fd = new FormData();
  fd.append('file', file);
  
  try {
    loading.value = true;
    await api.post('/usuarios/perfil/upload-firma', fd, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    success.value = 'Firma digital actualizada correctamente.';
    await loadFirma();
  } catch (err: unknown) {
    const errorRes = err as { response?: { data?: { message?: string } } };
    error.value = errorRes.response?.data?.message || 'Error al subir la firma.';
  } finally {
    loading.value = false;
  }
};

const handleFirmaUpload = async (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    const file = target.files[0];
    if (file) await uploadFirmaFile(file);
  }
};

const handleFirmaDrop = async (e: DragEvent) => {
  e.preventDefault();
  e.stopPropagation();
  isDraggingFirma.value = false;
  if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
    const file = e.dataTransfer.files[0];
    if (file) await uploadFirmaFile(file);
  }
};

const abrirSoporteDatos = () => {
  Swal.fire({
    title: 'Reportar Error en Datos',
    html: `
      <div class="text-left space-y-4">
        <p class="text-sm text-slate-600 font-medium italic">¿Qué información deseas corregir?</p>
        <div class="space-y-2">
          <button id="btn-soporte-datos" class="w-full p-4 bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-200 rounded-2xl flex items-center gap-3 transition-all group text-left">
            <span class="material-symbols-outlined text-amber-500 group-hover:scale-110 transition-transform">edit_note</span>
            <span class="text-xs font-bold text-slate-700">Hay un error en mis datos personales</span>
          </button>
          <button id="btn-soporte-otro" class="w-full p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl flex items-center gap-3 transition-all group text-left">
            <span class="material-symbols-outlined text-slate-400 group-hover:scale-110 transition-transform">help</span>
            <span class="text-xs font-bold text-slate-700">Tengo otro tipo de problema</span>
          </button>
        </div>
      </div>
    `,
    showConfirmButton: false,
    showCloseButton: true,
    didOpen: () => {
      const showTicketForm = (tipo: string) => {
        Swal.fire({
          title: 'Enviar Ticket de Corrección',
          html: `
            <div class="text-left space-y-4">
              <div class="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800">
                <p class="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400">Tipo de Corrección:</p>
                <p class="text-xs font-bold text-slate-700 dark:text-gray-300">${tipo}</p>
              </div>
              <div class="space-y-2">
                <label class="text-[10px] font-black uppercase text-slate-400 pl-1">Detalla los datos erróneos:</label>
                <textarea id="swal-ticket-msg" class="swal2-textarea w-full rounded-2xl border-slate-200 text-sm" placeholder="Ej: Mi apellido correcto es..." style="margin: 0; height: 120px;"></textarea>
              </div>
            </div>
          `,
          showCancelButton: true,
          confirmButtonText: 'Enviar Solicitud',
          cancelButtonText: 'Volver',
          confirmButtonColor: '#d97706',
          showLoaderOnConfirm: true,
          preConfirm: async () => {
            const mensaje = (document.getElementById('swal-ticket-msg') as HTMLTextAreaElement).value;
            if (!mensaje) { Swal.showValidationMessage('Por favor detalla el error.'); return false; }
            try {
              await api.post('/soporte', { tipo, mensaje });
              return true;
            } catch (error) {
              Swal.showValidationMessage('Error al enviar la solicitud.');
            }
          }
        }).then((result) => {
          if (result.isConfirmed) {
            Swal.fire({ icon: 'success', title: 'Solicitud Enviada', text: 'Soporte revisará tus datos pronto.', timer: 2000, showConfirmButton: false });
          } else if (result.dismiss === Swal.DismissReason.cancel) {
            abrirSoporteDatos();
          }
        });
      };
      document.getElementById('btn-soporte-datos')?.addEventListener('click', () => showTicketForm('Error en mis datos personales'));
      document.getElementById('btn-soporte-otro')?.addEventListener('click', () => showTicketForm('Problema técnico en mi perfil'));
    }
  });
};

const cambiarContrasena = () => {
  Swal.fire({
    title: 'Cambiar Contraseña',
    html: `
      <div class="space-y-4 text-left">
        <div>
          <label class="text-xs font-bold text-slate-600">Contraseña Actual</label>
          <input type="password" id="swal-old-pwd" class="w-full mt-1 px-3 py-2 border rounded-xl border-slate-200" placeholder="••••••••">
        </div>
        <div>
          <label class="text-xs font-bold text-slate-600">Nueva Contraseña</label>
          <input type="password" id="swal-new-pwd" class="w-full mt-1 px-3 py-2 border rounded-xl border-slate-200" placeholder="Mínimo 8 caracteres">
        </div>
        <div>
          <label class="text-xs font-bold text-slate-600">Confirmar Nueva Contraseña</label>
          <input type="password" id="swal-confirm-pwd" class="w-full mt-1 px-3 py-2 border rounded-xl border-slate-200" placeholder="••••••••">
        </div>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: 'Actualizar Contraseña',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#2563eb',
    preConfirm: async () => {
      const oldPwd = (document.getElementById('swal-old-pwd') as HTMLInputElement).value;
      const newPwd = (document.getElementById('swal-new-pwd') as HTMLInputElement).value;
      const confirmPwd = (document.getElementById('swal-confirm-pwd') as HTMLInputElement).value;

      if (!oldPwd || !newPwd || !confirmPwd) {
        Swal.showValidationMessage('Todos los campos son obligatorios');
        return false;
      }
      if (newPwd.length < 8) {
        Swal.showValidationMessage('La nueva contraseña debe tener al menos 8 caracteres');
        return false;
      }
      if (newPwd !== confirmPwd) {
        Swal.showValidationMessage('Las contraseñas nuevas no coinciden');
        return false;
      }

      try {
        const userId = authStore.user?.id;
        if (!userId) throw new Error('No se pudo identificar al usuario');
        
        await api.patch(`/usuarios/${userId}/password`, {
          password_actual: oldPwd,
          password_nuevo: newPwd
        });
        return true;
      } catch (error: unknown) {
        const errObj = error as Error;
        const errorRes = error as { response?: { data?: { message?: string } } };
        Swal.showValidationMessage(errorRes.response?.data?.message || errObj.message || 'Error al cambiar la contraseña');
        return false;
      }
    }
  }).then((result) => {
    if (result.isConfirmed) {
      Swal.fire('¡Actualizada!', 'Tu contraseña ha sido cambiada correctamente.', 'success');
    }
  });
};

onMounted(() => {
  loadProfile();
  loadGradosAcademicos();
  loadGradosAdministrativos();
});
</script>

<template>
  <div class="p-4 md:p-8 max-w-4xl mx-auto space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-200 dark:border-gray-800 pb-6 mb-4 md:mb-8 gap-4">
      <div class="max-w-full sm:max-w-[60%]">
        <h1 class="text-xl md:text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tight truncate">Mi Perfil</h1>
        <p class="text-[10px] md:text-sm font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mt-1">Gestiona tus datos personales y credenciales</p>
      </div>
      <div class="flex items-center gap-2 sm:gap-3 shrink-0">
        <button @click="cambiarContrasena" class="bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 text-slate-600 dark:text-gray-300 px-3 md:px-4 py-2 rounded-xl text-[10px] font-black hover:bg-slate-100 dark:hover:bg-gray-700 transition-all uppercase flex items-center gap-1 md:gap-2 shadow-sm tracking-widest">
            <span class="material-symbols-outlined text-[14px] md:text-[16px]">key</span>
            <span class="hidden sm:inline">Contraseña</span>
        </button>
        <button @click="abrirSoporteDatos" class="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 text-amber-600 dark:text-amber-400 px-3 md:px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-100 transition-all flex items-center gap-1 md:gap-2">
            <span class="material-symbols-outlined text-[14px] md:text-[16px]">support_agent</span>
            Soporte
        </button>
      </div>
    </div>

    <!-- Alerta de Firma Digital Faltante -->
    <div v-if="isCoordinator && !firmaUrl && !loading" class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 md:p-6 rounded-2xl flex items-start gap-3 md:gap-4 shadow-sm animate-pulse">
      <span class="material-symbols-outlined text-amber-500 dark:text-amber-400 text-2xl md:text-3xl shrink-0">warning</span>
      <div>
        <h4 class="text-amber-800 dark:text-amber-300 font-black uppercase text-xs md:text-sm">Firma Digital Faltante</h4>
        <p class="text-amber-700/80 dark:text-amber-400/80 text-[10px] md:text-xs mt-1 leading-relaxed">
          Atención: Como autoridad o ponente, es <strong>obligatorio</strong> que suba su firma digital (formato PNG) para garantizar la correcta emisión de los certificados institucionales.
        </p>
      </div>
    </div>

    <div v-if="isCompleted" class="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-4 md:p-6 rounded-2xl flex items-start gap-3 md:gap-4">
      <span class="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-2xl md:text-3xl shrink-0">verified_user</span>
      <div>
        <h4 class="text-emerald-800 dark:text-emerald-300 font-black uppercase text-xs md:text-sm">Perfil Finalizado</h4>
        <p class="text-emerald-600/80 dark:text-emerald-400/80 text-[10px] md:text-xs mt-1 leading-relaxed">Su información ha sido bloqueada. Para cambios críticos, contacte a soporte.</p>
      </div>
    </div>

    <div v-if="error" class="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold border border-red-200 animate-pulse">{{ error }}</div>
    <div v-if="success" class="bg-emerald-50 text-emerald-600 p-4 rounded-xl text-sm font-bold border border-emerald-200">{{ success }}</div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      
      <!-- Panel lateral de Archivos -->
      <div class="space-y-6 md:col-span-1">
        <!-- Foto de Perfil -->
        <div 
          @dragover.prevent="isDragging = true"
          @dragleave.prevent="isDragging = false"
          @drop.prevent="handleDrop"
          :class="[isDragging ? 'border-umsa-blue bg-blue-50 dark:bg-blue-900/10' : 'border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900']"
          class="p-6 rounded-2xl border-2 border-dashed shadow-sm flex flex-col items-center text-center transition-colors duration-300">
          <div class="w-32 h-32 rounded-full overflow-hidden border-4 border-slate-100 dark:border-gray-800 mb-4 bg-slate-50 dark:bg-gray-800">
            <img v-if="profilePhotoUrl" :src="profilePhotoUrl" alt="Foto" class="w-full h-full object-cover" @error="profilePhotoUrl = ''" />
            <span v-else class="material-symbols-outlined text-6xl text-slate-300 dark:text-gray-600 h-full flex items-center justify-center">account_circle</span>
          </div>
          <h3 class="text-sm font-black uppercase text-slate-700 dark:text-gray-200">Foto de Perfil</h3>
          <p class="text-[10px] text-slate-400 mb-4 mt-1">Formatos JPG, PNG<br>Dimensiones: Cuadrada (Tipo 5x5)<br>Fondo sugerido: Blanco / Claro</p>
          
          <input type="file" ref="photoRef" class="hidden" accept="image/jpeg, image/png" @change="handlePhotoUpload" />
          <button @click="photoRef?.click()" :disabled="loading || (isCompleted && !!profilePhotoUrl)" 
            class="text-xs px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-slate-600 dark:text-gray-300 font-bold rounded-lg transition-colors border border-slate-200 dark:border-gray-700 w-full uppercase tracking-wider disabled:opacity-50">
            {{ (isCompleted && !!profilePhotoUrl) ? 'Bloqueado' : 'Subir Foto' }}
          </button>
        </div>

        <!-- Firma Digital (Solo Coordinadores/Admin/Ponente) -->
        <div v-if="isCoordinator" 
          @dragenter.prevent="isDraggingFirma = true"
          @dragover.prevent="isDraggingFirma = true"
          @dragleave.prevent="isDraggingFirma = false"
          @drop.prevent="handleFirmaDrop"
          :class="[isDraggingFirma ? 'border-umsa-blue bg-blue-50 dark:bg-blue-900/10 ring-4 ring-umsa-blue/10' : 'border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900']"
          class="p-6 rounded-2xl border-2 border-dashed shadow-sm flex flex-col items-center text-center transition-all duration-300 relative group overflow-hidden">
          
          <div v-if="loading" class="absolute inset-0 bg-white/60 dark:bg-gray-900/60 z-10 flex flex-col items-center justify-center backdrop-blur-sm">
             <div class="w-8 h-8 border-4 border-umsa-blue border-t-transparent rounded-full animate-spin mb-2"></div>
             <p class="text-[10px] font-black uppercase text-umsa-blue">Subiendo Firma...</p>
          </div>

          <div class="w-full aspect-[3/2] rounded-xl border border-slate-100 dark:border-gray-800 mb-4 bg-slate-50 dark:bg-black/20 flex items-center justify-center overflow-hidden relative">
            <img v-if="firmaUrl" :src="firmaUrl" alt="Firma Digital" class="max-w-[90%] max-h-[90%] object-contain" />
            <div v-else class="flex flex-col items-center text-slate-300 dark:text-gray-600">
              <span class="material-symbols-outlined text-5xl">draw</span>
              <p class="text-[9px] font-bold uppercase mt-1">Sin Firma</p>
            </div>
            
            <div v-if="firmaUrl" class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
               <button @click="firmaRef?.click()" class="bg-white text-slate-900 p-2 rounded-full shadow-lg">
                 <span class="material-symbols-outlined">edit</span>
               </button>
            </div>
          </div>
          
          <h3 class="text-sm font-black uppercase text-slate-700 dark:text-gray-200">Firma Digital</h3>
          <p class="text-[10px] text-slate-400 mb-4 mt-1 leading-tight">Obligatoria para emisión de certificados<br>Formato: <strong class="text-blue-500">Solo PNG</strong> (Transparente)</p>
          
          <input type="file" ref="firmaRef" class="hidden" accept="image/png" @change="handleFirmaUpload" />
          <button @click="firmaRef?.click()" :disabled="loading" 
            class="text-xs px-4 py-2 bg-umsa-blue/10 hover:bg-umsa-blue/20 text-umsa-blue dark:text-blue-400 font-black rounded-lg transition-colors border border-umsa-blue/20 w-full uppercase tracking-wider disabled:opacity-50">
            {{ firmaUrl ? 'Actualizar Firma' : 'Cargar Firma' }}
          </button>
        </div>
      </div>

      <!-- Formulario de Datos Personales -->
      <div class="md:col-span-2 bg-white dark:bg-gray-900 p-6 md:p-8 rounded-2xl border border-slate-200 dark:border-gray-800 shadow-sm">
        <h3 class="text-sm font-black uppercase text-slate-800 dark:text-white mb-6 tracking-widest border-b border-slate-100 dark:border-gray-800 pb-4 flex items-center justify-between">
          <span>Datos Personales</span>
          <span v-if="isCompleted" class="text-[9px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">SOLO LECTURA</span>
        </h3>
        
        <form @submit.prevent="handleUpdateProfile(false)" class="space-y-5">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label class="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 block">Nombres</label>
              <input v-model="formData.nombres" type="text" :disabled="isCompleted && !!originalData.nombres" class="w-full py-2.5 px-3 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-umsa-blue outline-none disabled:bg-slate-100 dark:disabled:bg-gray-950 disabled:text-slate-400" required />
            </div>
            <div>
              <label class="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 block">Primer Apellido</label>
              <input v-model="formData.primer_apellido" type="text" :disabled="isCompleted && !!originalData.primer_apellido" class="w-full py-2.5 px-3 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-umsa-blue outline-none disabled:bg-slate-100 dark:disabled:bg-gray-950 disabled:text-slate-400" required />
            </div>
            <div>
              <label class="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 block">Segundo Apellido</label>
              <input v-model="formData.segundo_apellido" type="text" :disabled="isCompleted && !!originalData.segundo_apellido" class="w-full py-2.5 px-3 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-umsa-blue outline-none disabled:bg-slate-100 dark:disabled:bg-gray-950 disabled:text-slate-400" />
            </div>
            <div>
              <label class="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 block">
                {{ formData.documento_identidad?.includes(':') ? formData.documento_identidad.split(':')[0] : 'Documento Identidad' }}
              </label>
              <input :value="formData.documento_identidad?.includes(':') ? (formData.documento_identidad.split(':')[1] || '').trim() : formData.documento_identidad" 
                     @input="(e) => { 
                       const val = (e.target as HTMLInputElement).value;
                       if (formData.documento_identidad?.includes(':')) {
                         formData.documento_identidad = (formData.documento_identidad.split(':')[0] || 'Documento') + ': ' + val;
                       } else {
                         formData.documento_identidad = val;
                       }
                     }"
                     type="text" :disabled="isCompleted && !!originalData.documento_identidad" class="w-full py-2.5 px-3 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-umsa-blue outline-none disabled:bg-slate-100 dark:disabled:bg-gray-950 disabled:text-slate-400" required />
            </div>
            <div>
              <label class="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 block">Fecha de Nacimiento</label>
              <input v-model="formData.fecha_nacimiento" type="date" :disabled="isCompleted && !!originalData.fecha_nacimiento" class="w-full py-2.5 px-3 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-umsa-blue outline-none disabled:bg-slate-100 dark:disabled:bg-gray-950 disabled:text-slate-400" />
            </div>
             <div>
              <label class="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 block">Celular</label>
              <input v-model="formData.celular" type="text" :disabled="isCompleted && !!originalData.celular" class="w-full py-2.5 px-3 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-umsa-blue outline-none disabled:bg-slate-100 dark:disabled:bg-gray-950 disabled:text-slate-400" />
            </div>
            <div>
              <label class="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 block">Grado Académico (Abreviado)</label>
              <input v-model="formData.grado_academico" type="text" placeholder="Ej: Lic. o MSc." :disabled="isCompleted && !!originalData.grado_academico" class="w-full py-2.5 px-3 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-umsa-blue outline-none disabled:bg-slate-100 dark:disabled:bg-gray-950 disabled:text-slate-400" />
            </div>
            <div>
              <label class="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 block">País Origen</label>
              <input v-model="formData.pais_origen" type="text" :disabled="isCompleted && !!originalData.pais_origen" class="w-full py-2.5 px-3 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-umsa-blue outline-none disabled:bg-slate-100 dark:disabled:bg-gray-950 disabled:text-slate-400" />
            </div>
            <div>
              <label class="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 block">País Residencia</label>
              <input v-model="formData.pais_residencia" type="text" :disabled="isCompleted && !!originalData.pais_residencia" class="w-full py-2.5 px-3 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-umsa-blue outline-none disabled:bg-slate-100 dark:disabled:bg-gray-950 disabled:text-slate-400" />
            </div>
          </div>
          
          <div class="mt-8 border-t border-slate-100 dark:border-gray-800 pt-6">
            <div class="flex items-center justify-between mb-6">
              <h3 class="text-sm font-black uppercase text-slate-800 dark:text-white tracking-widest">Afiliaciones Institucionales</h3>
              <button v-if="!isCompleted" type="button" @click="addAfiliacion" class="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-umsa-blue hover:text-blue-700 transition-colors">
                <span class="material-symbols-outlined text-sm">add_circle</span> Añadir Institución
              </button>
            </div>

            <div class="space-y-6">
              <div v-for="(af, index) in formData.afiliaciones" :key="index" class="p-4 rounded-xl border border-slate-100 dark:border-gray-800 bg-slate-50/50 dark:bg-gray-950/50 relative group">
                <button v-if="!isCompleted && formData.afiliaciones.length > 1" type="button" @click="removeAfiliacion(index)" class="absolute -top-2 -right-2 w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                  <span class="material-symbols-outlined text-sm">close</span>
                </button>
                
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div class="md:col-span-3">
                    <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Institución / Universidad</label>
                    <input v-model="af.institucion" type="text" :disabled="isCompleted && !!af.id" placeholder="Ej. Universidad Mayor de San Andrés" class="w-full py-2 px-3 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-umsa-blue outline-none disabled:bg-slate-50 dark:disabled:bg-gray-800" />
                  </div>
                  <div>
                    <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Grado Académico</label>
                    <select v-model="af.id_grado_academico" :disabled="isCompleted && !!af.id" class="w-full py-2 px-3 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-umsa-blue outline-none text-slate-700 dark:text-gray-200 disabled:bg-slate-50 dark:disabled:bg-gray-800">
                      <option :value="null">Ninguno</option>
                      <option v-for="grado in gradosAcademicos" :key="grado.id" :value="grado.id">{{ grado.descripcion }}</option>
                    </select>
                  </div>
                  <div>
                    <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Grado / Cargo Administrativo</label>
                    <select v-model="af.id_grado_administrativo" :disabled="isCompleted && !!af.id" class="w-full py-2 px-3 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-umsa-blue outline-none text-slate-700 dark:text-gray-200 disabled:bg-slate-50 dark:disabled:bg-gray-800">
                      <option :value="null">Ninguno</option>
                      <option v-for="adm in gradosAdministrativos" :key="adm.id" :value="adm.id">{{ adm.nombre }} ({{ adm.abreviatura }})</option>
                    </select>
                  </div>
                  <div>
                    <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Disciplina / Especialidad</label>
                    <input v-model="af.disciplina_cientifica" type="text" :disabled="isCompleted && !!af.id" placeholder="Ej. Informática" class="w-full py-2 px-3 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-umsa-blue outline-none disabled:bg-slate-50 dark:disabled:bg-gray-800" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="pt-8 flex flex-col md:flex-row items-center justify-end gap-4">
            <button type="submit" v-if="!isCompleted || Object.keys(originalData).some(k => !originalData[k])" :disabled="loading" class="w-full md:w-auto px-6 py-3 border border-slate-200 dark:border-gray-700 text-slate-600 dark:text-gray-300 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50">
              {{ loading ? '...' : 'Guardar Progreso' }}
            </button>
            <button type="button" v-if="!isCompleted" @click="handleUpdateProfile(true)" :disabled="loading" class="w-full md:w-auto px-8 py-3 bg-umsa-blue hover:bg-blue-800 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-umsa-blue/20 transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50">
              {{ loading ? 'Procesando...' : 'Finalizar y Bloquear Perfil' }}
            </button>
          </div>
        </form>
      </div>

    </div>
  </div>
</template>