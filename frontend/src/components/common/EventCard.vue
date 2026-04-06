<template>
  <div class="card flex flex-col h-full group hover:shadow-lg transition-all duration-300">
    <!-- Course Image/Icon Placeholder -->
    <div class="bg-gradient-to-br from-[#0052a3] to-[#1976d2] rounded-lg h-48 flex items-center justify-center text-5xl mb-4 group-hover:scale-[1.02] transition-transform overflow-hidden relative">
       <!-- Si tuviera imagen real: <img :src="event.logo" class="w-full h-full object-cover" /> -->
       <span v-if="!event.logo">🎓</span>
       <img v-else :src="event.logo" alt="Logo evento" class="w-full h-full object-cover"/>
    </div>

    <!-- Course Info -->
    <div class="flex-grow p-4 pt-0">
      <div class="flex justify-between items-start mb-2">
        <span class="inline-block px-3 py-1 bg-blue-50 text-[#0052a3] text-xs font-semibold rounded-full">
          {{ event.gestion }}
        </span>
        <!-- Estado placeholder -->
        <span class="text-xs font-medium" :class="event.descripcion ? 'text-green-600' : 'text-gray-500'">
            {{ event.descripcion ? 'Abierto' : 'Próximamente' }}
        </span>
      </div>

      <h3 class="font-bold text-lg text-[#0052a3] mb-2 group-hover:text-[#003d7a] transition-colors line-clamp-2">
        {{ event.nombre }}
      </h3>

      <p class="text-sm text-gray-600 mb-4 line-clamp-3">
        {{ event.descripcion || 'Sin descripción disponible.' }}
      </p>
    </div>

    <!-- Button -->
    <div class="p-4 pt-0">
        <RouterLink :to="`/eventos/${event.id_evento || event.id_eventos}`" class="btn btn-primary w-full text-center block">
        Ver Detalles
        </RouterLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router';
// Importamos el tipo 'Evento' o usamos 'any' si preferimos flexibilidad por ahora
import type { Evento } from '@/types'; 

defineProps<{
  event: any // Dejo any temporalmente para flexibilidad con la prop del zip vs nuestro tipo
}>();
</script>