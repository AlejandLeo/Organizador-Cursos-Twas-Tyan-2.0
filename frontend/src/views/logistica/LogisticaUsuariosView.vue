<script setup lang="ts">
import { ref } from 'vue';
import api from '@/services/api';
import Swal from 'sweetalert2';

const loading = ref(false);
const formData = ref({
  nombres: '',
  primer_apellido: '',
  segundo_apellido: '',
  email: '',
  password: '',
  documento_identidad: '',
  id_rol: 4 // Estudiante por defecto
});

const handleRegister = async () => {
  loading.value = true;
  try {
    await api.post('/usuarios/registro', formData.value);
    Swal.fire('Éxito', 'Usuario registrado correctamente.', 'success');
    formData.value = {
      nombres: '',
      primer_apellido: '',
      segundo_apellido: '',
      email: '',
      password: '',
      documento_identidad: '',
      id_rol: 4
    };
  } catch (err: any) {
    Swal.fire('Error', err.response?.data?.message || 'Error al registrar usuario', 'error');
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="space-y-8 animate-in fade-in duration-500 max-w-4xl">
    <div class="border-b border-slate-200 dark:border-gray-800 pb-6 flex justify-between items-end">
      <div>
        <h2 class="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic">Gestión de Usuarios</h2>
        <p class="text-slate-500 dark:text-gray-400 font-medium mt-1">Registro rápido de nuevos participantes.</p>
      </div>
      <div class="h-10 w-10 rounded-xl bg-teal-50 dark:bg-teal-900/20 text-teal-600 flex items-center justify-center border border-teal-100">
        <span class="material-symbols-outlined">person_add</span>
      </div>
    </div>

    <div class="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-slate-200 dark:border-gray-800 shadow-sm">
      <h3 class="text-sm font-black uppercase text-slate-800 dark:text-white mb-8 tracking-widest flex items-center gap-2">
        <span class="material-symbols-outlined text-teal-500">how_to_reg</span>
        Formulario de Registro Rápido
      </h3>

      <form @submit.prevent="handleRegister" class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-2">
            <label class="text-[10px] font-black uppercase text-slate-400 pl-1">Nombres</label>
            <input v-model="formData.nombres" type="text" required class="w-full bg-slate-50 dark:bg-gray-800 border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3.5 text-sm font-bold outline-none focus:ring-2 focus:ring-teal-500 transition-all" placeholder="Ej. Juan Pablo" />
          </div>
          <div class="space-y-2">
            <label class="text-[10px] font-black uppercase text-slate-400 pl-1">Primer Apellido</label>
            <input v-model="formData.primer_apellido" type="text" required class="w-full bg-slate-50 dark:bg-gray-800 border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3.5 text-sm font-bold outline-none focus:ring-2 focus:ring-teal-500 transition-all" placeholder="Ej. Pérez" />
          </div>
          <div class="space-y-2">
            <label class="text-[10px] font-black uppercase text-slate-400 pl-1">Correo Electrónico</label>
            <input v-model="formData.email" type="email" required class="w-full bg-slate-50 dark:bg-gray-800 border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3.5 text-sm font-bold outline-none focus:ring-2 focus:ring-teal-500 transition-all" placeholder="usuario@ejemplo.com" />
          </div>
          <div class="space-y-2">
            <label class="text-[10px] font-black uppercase text-slate-400 pl-1">Contraseña Temporal</label>
            <input v-model="formData.password" type="password" required class="w-full bg-slate-50 dark:bg-gray-800 border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3.5 text-sm font-bold outline-none focus:ring-2 focus:ring-teal-500 transition-all" placeholder="••••••••" />
          </div>
          <div class="space-y-2">
            <label class="text-[10px] font-black uppercase text-slate-400 pl-1">Documento Identidad (C.I.)</label>
            <input v-model="formData.documento_identidad" type="text" required class="w-full bg-slate-50 dark:bg-gray-800 border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3.5 text-sm font-bold outline-none focus:ring-2 focus:ring-teal-500 transition-all" placeholder="1234567 LP" />
          </div>
          <div class="space-y-2">
            <label class="text-[10px] font-black uppercase text-slate-400 pl-1">Rol de Usuario</label>
            <select v-model="formData.id_rol" class="w-full bg-slate-50 dark:bg-gray-800 border-slate-200 dark:border-gray-700 rounded-xl px-4 py-3.5 text-sm font-bold outline-none focus:ring-2 focus:ring-teal-500 transition-all">
              <option :value="4">Estudiante</option>
              <option :value="5">Ponente</option>
              <option :value="3">Logística</option>
            </select>
          </div>
        </div>

        <div class="pt-6 flex justify-end">
          <button type="submit" :disabled="loading" class="px-10 py-4 bg-teal-600 hover:bg-teal-700 text-white font-black rounded-2xl shadow-xl shadow-teal-600/20 transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 uppercase tracking-widest text-xs flex items-center gap-3">
            <span class="material-symbols-outlined text-sm">person_add</span>
            {{ loading ? 'Registrando...' : 'Registrar Usuario' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
