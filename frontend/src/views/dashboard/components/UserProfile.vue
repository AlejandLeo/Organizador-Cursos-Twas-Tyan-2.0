<script setup lang="ts">
import { ref } from 'vue';

// Mock data (En futuro vendrá de API /usuarios/mi-perfil)
const user = ref({
  nombre: 'Juan',
  apellido: 'Perez',
  email: 'juan.perez@example.com',
  documento: '12345678',
  pais: 'Bolivia',
  telefono: '+591 70000000',
  rol: 'Docente'
});

const isEditing = ref(false);

const saveProfile = () => {
  // Lógica para guardar (PUT /usuarios/1)
  isEditing.value = false;
  console.log('Perfil guardado:', user.value);
};
</script>

<template>
  <div class="bg-white shadow rounded-lg p-6">
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-xl font-bold text-gray-800">Datos Personales</h2>
      <button 
        @click="isEditing = !isEditing"
        class="text-sm px-4 py-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors"
      >
        {{ isEditing ? 'Cancelar' : 'Editar' }}
      </button>
    </div>

    <form @submit.prevent="saveProfile" class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Nombre -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
        <input 
          v-model="user.nombre" 
          type="text" 
          :disabled="!isEditing"
          class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500 p-2 border"
        />
      </div>

      <!-- Apellido -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
        <input 
          v-model="user.apellido" 
          type="text" 
          :disabled="!isEditing"
          class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500 p-2 border"
        />
      </div>

      <!-- Email -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
        <input 
          v-model="user.email" 
          type="email" 
          disabled
          class="w-full rounded-md border-gray-300 shadow-sm bg-gray-100 text-gray-500 p-2 border cursor-not-allowed"
        />
        <p class="text-xs text-gray-400 mt-1">El correo no se puede cambiar.</p>
      </div>

      <!-- Documento -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Documento de Identidad</label>
        <input 
          v-model="user.documento" 
          type="text" 
          :disabled="!isEditing"
          class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500 p-2 border"
        />
      </div>

      <!-- País -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">País</label>
        <select 
          v-model="user.pais" 
          :disabled="!isEditing"
          class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500 p-2 border"
        >
          <option>Bolivia</option>
          <option>Argentina</option>
          <option>Chile</option>
          <option>Perú</option>
          <option>Otro</option>
        </select>
      </div>

      <!-- Botón Guardar -->
      <div v-if="isEditing" class="md:col-span-2 flex justify-end mt-4">
        <button 
          type="submit" 
          class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Guardar Cambios
        </button>
      </div>
    </form>
  </div>
</template>