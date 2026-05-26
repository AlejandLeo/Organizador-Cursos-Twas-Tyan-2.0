<script setup lang="ts">
import { ref } from 'vue';
import Swal from 'sweetalert2';
import { useAuthStore } from '@/stores/auth';
import api from '@/services/api';
import QRAsistencia from '@/components/QRAsistencia.vue';

const authStore = useAuthStore();
const isEditing = ref(false);
const successMessage = ref('');

const formData = ref({
   nombres: 'Federico',
   apellidos: 'Brown',
   email: 'juan@gmail.com', // Basado en la imagen de referencia aunque es inconsistente con el nombre
   telefono: '+591 76543210',
   institucion: 'Universidad Mayor de San Andrés',
   grado: 'Ph.D.'
});

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
            Swal.fire({ icon: 'success', title: 'Solicitud Enviada', text: 'El SuperUsuario revisará tus datos.', timer: 2000, showConfirmButton: false });
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

const saveChanges = () => {
    isEditing.value = false;
    successMessage.value = 'Tus datos se actualizaron correctamente.';
    setTimeout(() => {
        successMessage.value = '';
    }, 3000);
};
</script>

<template>
  <div class="space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto">
    <div class="flex items-end justify-between border-b border-slate-200 dark:border-gray-800 pb-6">
        <div>
            <h2 class="text-3xl md:text-4xl font-black text-umsa-blue dark:text-blue-400 tracking-tighter uppercase italic">Mis Datos Personales</h2>
            <p class="text-slate-500 dark:text-gray-400 font-medium mt-2 flex items-center gap-2">
               <span class="material-symbols-outlined text-[16px]">info</span>
               Revisa y mantén actualizada tu información de contacto.
            </p>
        </div>
        <div class="flex items-center gap-3">
          <button v-if="!isEditing" @click="abrirSoporteDatos" class="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 text-amber-600 dark:text-amber-400 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-100 transition-all flex items-center gap-2">
              <span class="material-symbols-outlined text-[16px]">support_agent</span>
              ¿Error en datos?
          </button>
          
          <button v-if="!isEditing" @click="isEditing = true" class="bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 text-slate-600 dark:text-gray-300 px-5 py-2.5 rounded-xl text-[10px] font-black hover:bg-slate-100 dark:hover:bg-gray-700 transition-all uppercase flex items-center gap-2 shadow-sm tracking-widest">
              <span class="material-symbols-outlined text-[16px]">edit</span>
              Editar Información
          </button>
          
          <button v-else @click="saveChanges" class="bg-umsa-blue text-white shadow-md shadow-umsa-blue/20 px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-primary-accent transition-all uppercase flex items-center gap-2 border border-blue-600">
              <span class="material-symbols-outlined text-[16px]">check_circle</span>
              Guardar Cambios
          </button>
        </div>
    </div>

    <!-- Mensaje de éxito -->
    <div v-if="successMessage" class="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
        <span class="material-symbols-outlined">check_circle</span>
        <p class="text-sm font-bold">{{ successMessage }}</p>
    </div>

    <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-800 overflow-hidden relative">
        <div class="absolute left-0 top-0 bottom-0 w-1.5 bg-umsa-blue dark:bg-blue-500"></div>
        
        <div class="p-6 md:p-10 space-y-6 lg:space-y-8 pl-8 md:pl-12">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
                <!-- Columna Izquierda -->
                <div class="space-y-6">
                    <div class="space-y-2 relative group focus-within:z-10">
                        <label class="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-gray-500 pl-1">Nombres</label>
                        <input type="text" v-model="formData.nombres" :readonly="!isEditing"
                            :class="[isEditing ? 'bg-white dark:bg-gray-800 border-umsa-blue dark:border-blue-500 focus:ring-4 focus:ring-umsa-blue/10' : 'bg-slate-50 dark:bg-gray-800/50 border-slate-200 dark:border-gray-700 cursor-not-allowed opacity-80', 'w-full border rounded-xl px-4 py-3.5 text-primary-dark dark:text-white font-bold transition-all outline-none']">
                    </div>
                    
                    <div class="space-y-2 relative group focus-within:z-10">
                        <label class="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-gray-500 pl-1">Correo Electrónico Principal</label>
                        <div class="relative">
                           <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">mail</span>
                           <input type="email" v-model="formData.email" :readonly="!isEditing"
                              :class="[isEditing ? 'bg-white dark:bg-gray-800 border-umsa-blue dark:border-blue-500 focus:ring-4 focus:ring-umsa-blue/10' : 'bg-slate-50 dark:bg-gray-800/50 border-slate-200 dark:border-gray-700 cursor-not-allowed opacity-80', 'w-full border rounded-xl pl-12 pr-4 py-3.5 text-primary-dark dark:text-white font-bold transition-all outline-none']">
                        </div>
                    </div>

                    <div class="space-y-2 relative group focus-within:z-10">
                        <label class="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-gray-500 pl-1">Institución Perteneciente</label>
                        <div class="relative">
                           <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">account_balance</span>
                           <input type="text" v-model="formData.institucion" :readonly="!isEditing"
                              :class="[isEditing ? 'bg-white dark:bg-gray-800 border-umsa-blue dark:border-blue-500 focus:ring-4 focus:ring-umsa-blue/10' : 'bg-slate-50 dark:bg-gray-800/50 border-slate-200 dark:border-gray-700 cursor-not-allowed opacity-80', 'w-full border rounded-xl pl-12 pr-4 py-3.5 text-primary-dark dark:text-white font-bold transition-all outline-none']">
                        </div>
                    </div>
                </div>

                <!-- Columna Derecha -->
                <div class="space-y-6">
                    <div class="space-y-2 relative group focus-within:z-10">
                        <label class="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-gray-500 pl-1">Apellidos</label>
                        <input type="text" v-model="formData.apellidos" :readonly="!isEditing"
                            :class="[isEditing ? 'bg-white dark:bg-gray-800 border-umsa-blue dark:border-blue-500 focus:ring-4 focus:ring-umsa-blue/10' : 'bg-slate-50 dark:bg-gray-800/50 border-slate-200 dark:border-gray-700 cursor-not-allowed opacity-80', 'w-full border rounded-xl px-4 py-3.5 text-primary-dark dark:text-white font-bold transition-all outline-none']">
                    </div>
                    
                    <div class="space-y-2 relative group focus-within:z-10">
                        <label class="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-gray-500 pl-1">Celular / Teléfono</label>
                        <div class="relative">
                           <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">call</span>
                           <input type="tel" v-model="formData.telefono" :readonly="!isEditing"
                              :class="[isEditing ? 'bg-white dark:bg-gray-800 border-umsa-blue dark:border-blue-500 focus:ring-4 focus:ring-umsa-blue/10' : 'bg-slate-50 dark:bg-gray-800/50 border-slate-200 dark:border-gray-700 cursor-not-allowed opacity-80', 'w-full border rounded-xl pl-12 pr-4 py-3.5 text-primary-dark dark:text-white font-bold transition-all outline-none']">
                        </div>
                    </div>

                    <div class="space-y-2 relative group focus-within:z-10">
                        <label class="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-gray-500 pl-1">Grado Académico</label>
                        <div class="relative">
                           <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">school</span>
                           <input type="text" v-model="formData.grado" :readonly="!isEditing"
                              :class="[isEditing ? 'bg-white dark:bg-gray-800 border-umsa-blue dark:border-blue-500 focus:ring-4 focus:ring-umsa-blue/10' : 'bg-slate-50 dark:bg-gray-800/50 border-slate-200 dark:border-gray-700 cursor-not-allowed opacity-80', 'w-full border rounded-xl pl-12 pr-4 py-3.5 text-primary-dark dark:text-white font-bold transition-all outline-none']">
                        </div>
                    </div>
                </div>
            </div>
            
            <div v-if="isEditing" class="pt-6 mt-6 border-t border-slate-200 dark:border-gray-800 flex justify-end animate-in fade-in slide-in-from-top-4">
               <div class="flex gap-3">
                  <button @click="isEditing = false" class="bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 text-slate-600 dark:text-gray-300 px-6 py-3 rounded-xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-gray-700 transition-all uppercase tracking-widest">
                     Cancelar
                  </button>
                  <button @click="saveChanges" class="bg-umsa-blue text-white px-8 py-3 rounded-xl text-xs font-bold hover:bg-primary-accent transition-all uppercase tracking-widest flex items-center shadow-md shadow-umsa-blue/20">
                     Guardar Perfil
                  </button>
               </div>
            </div>
        </div>
    </div>

    <!-- QR de Asistencia -->
    <div class="max-w-md mx-auto">
      <QRAsistencia />
    </div>
  </div>
</template>