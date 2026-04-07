<script setup lang="ts">
import { ref } from 'vue';

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
        <button v-if="!isEditing" @click="isEditing = true" class="bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 text-slate-600 dark:text-gray-300 px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-100 dark:hover:bg-gray-700 transition-all uppercase flex items-center gap-2 shadow-sm">
            <span class="material-symbols-outlined text-[16px]">edit</span>
            Editar Información
        </button>
        <button v-else @click="saveChanges" class="bg-umsa-blue text-white shadow-md shadow-umsa-blue/20 px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-primary-accent transition-all uppercase flex items-center gap-2 border border-blue-600">
            <span class="material-symbols-outlined text-[16px]">check_circle</span>
            Guardar Cambios
        </button>
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
  </div>
</template>