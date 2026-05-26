<script setup lang="ts">
import { useEventoStore } from '@/stores/eventoStore'

const eventoStore = useEventoStore()
</script>

<template>
  <footer id="footer" class="bg-gray-100 border-t border-gray-200 mt-auto font-sans text-sm">
    <div class="max-w-7xl mx-auto px-4 py-8">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        
        <!-- Dónde estamos -->
        <div>
           <strong class="block text-gray-800 mb-2">Dónde estamos:</strong>
           <p class="text-gray-600">
             {{ eventoStore.activeEvento?.direccion || eventoStore.activeEvento?.ubicacion || 'Cota Cota, Calle 27, Edif. Facultad de Ciencias Puras y Naturales - La Paz, Bolivia' }}
           </p>
        </div>

        <!-- Contáctanos -->
        <div>
           <strong class="block text-gray-800 mb-2">Contáctanos:</strong>
           <p class="text-gray-600">
             Telefono: {{ eventoStore.activeEvento?.telefono || '+591 76706873' }}
           </p>
           <p class="text-gray-600">
             Email: {{ eventoStore.activeEvento?.email || 'lktejeda@umsa.bo' }}
           </p>
        </div>

        <!-- Logos Partners -->
        <div class="md:col-span-2 flex flex-col items-center md:items-end gap-4">
           <div class="flex flex-wrap justify-center md:justify-end gap-4 p-4 bg-white rounded-lg shadow-sm border border-gray-100">
              <!-- Grid 1 -->
               <div class="h-10 w-24 bg-blue-100 flex items-center justify-center text-blue-800 text-[10px]">UNESCO TWAS</div>
               <div class="h-10 w-16 bg-green-100 flex items-center justify-center text-green-800 text-[10px]">TYAN</div>
               <div class="h-10 w-16 bg-yellow-100 flex items-center justify-center text-yellow-800 text-[10px]">BRASIL</div>
           </div>
           
           <div class="flex flex-wrap justify-center md:justify-end gap-2 opacity-80">
               <div class="h-8 w-8 bg-red-100 flex items-center justify-center text-red-800 text-[8px]">UMSA</div>
               <div class="h-8 w-8 bg-yellow-100 flex items-center justify-center text-yellow-800 text-[8px]">FCPN</div>
               <div class="h-8 w-8 bg-gray-200 flex items-center justify-center text-gray-800 text-[8px]">QUIMICA</div>
           </div>
        </div>

      </div>
    </div>
  </footer>
</template>