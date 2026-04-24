<template>
  <main v-if="loading">
    <div class="text-center py-20 text-gray-500">Cargando detalles del evento...</div>
  </main>

  <main v-else-if="!event">
    <div class="text-center py-20 text-red-500">Evento no encontrado.</div>
  </main>

  <main v-else>
    <!-- Hero Section -->
    <section class="bg-gradient-to-r from-[#0052a3] to-[#1976d2] text-white py-12">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <button @click="$router.back()" class="mb-4 text-blue-100 hover:text-white flex items-center gap-2">
          ← Volver
        </button>
        <h1 class="text-4xl font-bold mb-4">{{ event.descripcion }}</h1>
        <div class="flex flex-wrap items-center gap-6 text-blue-100">
          <div class="flex items-center gap-2">
            <span class="bg-blue-500/50 px-3 py-1 rounded-full text-sm">Gestión {{ event.gestion }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Content -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div class="grid md:grid-cols-3 gap-12">
        <!-- Main Content -->
        <div class="md:col-span-2">
          <!-- Event Logo/Image placeholder -->
          <div class="bg-gradient-to-br from-[#0052a3] to-[#1976d2] rounded-2xl h-64 flex items-center justify-center text-9xl mb-8 overflow-hidden relative">
             <span v-if="!event.logo">🎓</span>
             <img v-else :src="event.logo" class="absolute w-full h-full object-cover">
          </div>

          <!-- Description -->
          <div class="mb-12">
            <h2 class="text-3xl font-bold text-[#0052a3] mb-4">Sobre este evento</h2>
            <p class="text-gray-700 text-lg leading-relaxed mb-6">
              {{ event.descripcion }}
            </p>
          </div>

          <!-- Versions List (Optional) Removed for now -->
        </div>

        <!-- Sidebar Info -->
        <div class="md:col-span-1">
            <div class="bg-white rounded-lg border border-[#e2e8f0] p-6 sticky top-24 shadow-md">
                <h3 class="font-bold text-xl mb-6 text-[#0052a3]">Información</h3>
                <div class="space-y-4 mb-8">
                     <p><strong>Gestión:</strong> {{ event.gestion }}</p>
                     <p><strong>Estado:</strong> {{ event.descripcion ? 'Inscripciones Abiertas' : 'Próximamente' }}</p>
                </div>
                
                <button class="w-full btn btn-primary mb-4">
                    Pre-Inscribirse
                </button>
                
                <p class="text-xs text-center text-gray-500">
                    * La inscripción está sujeta a cupos disponibles.
                </p>
            </div>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { eventosService } from '@/services';
import type { Evento } from '@/types';

const route = useRoute();
const event = ref<Evento | null>(null);
const loading = ref(true);

onMounted(async () => {
    const eventId = Number(route.params.id);
    if (!eventId) return;

    try {
        const resEvento = await eventosService.getById(eventId);
        event.value = resEvento.data;

    } catch (error) {
        console.error("Error cargando evento", error);
    } finally {
        loading.value = false;
    }
});
</script>