<script setup lang="ts">
import { ref } from 'vue';

const estudiantes = ref([
 { id: 1, nombre: 'Ana', apellido: 'García', email: 'anag@example.com', activo: true },
 { id: 2, nombre: 'Luis', apellido: 'Torres', email: 'luist@example.com', activo: false },
]);

const buscarEstudiante = ref('');

const filtrarEstudiantes = () => {
  // Lógica de filtrado
};

const eliminarEstudiante = (id: number) => {
  // Confirmar y eliminar
};

</script>

<template>
  <div class="bg-white shadow rounded-lg overflow-hidden">
    <div class="p-6 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
      <h2 class="text-xl font-bold text-gray-800">Gestión de Estudiantes</h2>
      <div class="flex space-x-2 w-full sm:w-auto">
        <input 
          v-model="buscarEstudiante"
          type="text" 
          placeholder="Buscar estudiante..." 
          class="w-full sm:w-64 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
        />
        <button class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium">
          Nuevo
        </button>
      </div>
    </div>

    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
            <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="est in estudiantes" :key="est.id" class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">#{{ est.id }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{{ est.apellido }}, {{ est.nombre }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ est.email }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-center">
              <span 
                class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                :class="est.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'"
              >
                {{ est.activo ? 'Activo' : 'Inactivo' }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
              <button class="text-blue-600 hover:text-blue-900 mr-3">Editar</button>
              <button @click="eliminarEstudiante(est.id)" class="text-red-600 hover:text-red-900">Eliminar</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>