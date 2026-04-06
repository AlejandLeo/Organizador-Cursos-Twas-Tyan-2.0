<script setup lang="ts">
import { ref, onMounted } from 'vue';

// Mock Data de Inscritos
const inscripciones = ref([
  { id: 1, nombre: 'Ana', apellido: 'García', documento: '12345678', asistencia: 'P', calificacion: 85, estado: 'Aprobado' },
  { id: 2, nombre: 'Carlos', apellido: 'Méndez', documento: '87654321', asistencia: 'F', calificacion: 40, estado: 'Reprobado' },
  { id: 3, nombre: 'Luis', apellido: 'Torres', documento: '11223344', asistencia: 'P', calificacion: null, estado: 'Pendiente' },
]);

const curso = ref({
  nombre: 'Curso de Python Avanzado',
  descripcion: 'Aprende estructuras de datos complejas en Python.'
});

const isEditing = ref(false);

const updateGrade = (id: number, val: number) => {
  console.log(`Actualizando nota estudiante ${id} a ${val}`);
};

const updateAttendance = (id: number, status: string) => {
  console.log(`Actualizando asistencia estudiante ${id} a ${status}`);
};

</script>

<template>
  <div class="space-y-6">
    <!-- Header del Curso -->
    <div class="bg-white shadow rounded-lg p-6 border-l-4 border-blue-600">
      <h2 class="text-2xl font-bold text-gray-800">{{ curso.nombre }}</h2>
      <p class="text-gray-600 mt-2">{{ curso.descripcion }}</p>
    </div>

    <!-- Tabla de Estudiantes -->
    <div class="bg-white shadow rounded-lg overflow-hidden">
      <div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h3 class="text-lg font-medium text-gray-900">Estudiantes Inscritos</h3>
        <button 
          @click="isEditing = !isEditing"
          class="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          {{ isEditing ? 'Guardar Cambios' : 'Editar Notas' }}
        </button>
      </div>

      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Documento</th>
              <th scope="col" class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Asistencia</th>
              <th scope="col" class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Calificación</th>
              <th scope="col" class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="std in inscripciones" :key="std.id">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">{{ std.apellido }}, {{ std.nombre }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ std.documento }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-center">
                <select 
                  v-if="isEditing" 
                  v-model="std.asistencia"
                  class="border-gray-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="P">Presente</option>
                  <option value="F">Falta</option>
                  <option value="J">Justificado</option>
                </select>
                <span 
                  v-else 
                  class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                  :class="{
                    'bg-green-100 text-green-800': std.asistencia === 'P',
                    'bg-red-100 text-red-800': std.asistencia === 'F',
                    'bg-yellow-100 text-yellow-800': std.asistencia === 'J'
                  }"
                >
                  {{ std.asistencia === 'P' ? 'Presente' : (std.asistencia === 'F' ? 'Falta' : 'Justificado') }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-center">
                 <input 
                   v-if="isEditing" 
                   type="number" 
                   v-model="std.calificacion" 
                   max="100" 
                   min="0"
                   class="w-16 border-gray-300 rounded text-center text-sm focus:ring-blue-500 focus:border-blue-500"
                 />
                 <span v-else class="text-sm font-bold text-gray-900">{{ std.calificacion ?? '-' }}</span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-center">
                <span 
                  class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                  :class="{
                    'bg-green-100 text-green-800': std.calificacion >= 51,
                    'bg-red-100 text-red-800': std.calificacion < 51 && std.calificacion !== null,
                    'bg-gray-100 text-gray-800': std.calificacion === null
                  }"
                >
                  {{ std.calificacion >= 51 ? 'Aprobado' : (std.calificacion === null ? 'Pendiente' : 'Reprobado') }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>