<template>
  <main>
    <!-- Header -->
    <section class="bg-gradient-to-r from-[#0052a3] to-[#1976d2] text-white py-12">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 class="text-4xl font-bold mb-4">Nuestros Eventos</h1>
        <p class="text-xl text-blue-100">Participa en cursos y congresos para tu desarrollo profesional.</p>
      </div>
    </section>

    <!-- Filters and Content -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div class="grid md:grid-cols-4 gap-8">
        <!-- Sidebar Filters -->
        <aside class="md:col-span-1">
          <div class="bg-white rounded-lg border border-[#e2e8f0] p-6 sticky top-24">
            <h3 class="font-bold text-lg mb-6 text-[#0052a3]">Filtros</h3>

            <!-- Gestión Filter -->
            <div class="mb-8">
              <h4 class="font-semibold text-sm mb-4">Gestión</h4>
              <div class="space-y-3">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    v-model="filters.years"
                    value="2026"
                    class="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span class="text-sm text-gray-600">2026</span>
                </label>
                 <label class="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    v-model="filters.years"
                    value="2025"
                    class="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span class="text-sm text-gray-600">2025</span>
                </label>
              </div>
            </div>

            <button 
                class="w-full btn btn-ghost text-sm border border-gray-200"
                @click="resetFilters"
            >
                Limpiar Filtros
            </button>
          </div>
        </aside>

        <!-- Course List -->
        <div class="md:col-span-3">
            <div v-if="loading" class="text-center py-12">
                <p>Cargando eventos...</p>
            </div>

            <div v-else-if="filteredEvents.length > 0" class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <EventCard
                v-for="course in filteredEvents"
                :key="course.id"
                :event="course"
                />
            </div>
            
            <div v-else class="text-center py-12 bg-gray-50 rounded-lg">
                <p class="text-gray-500">No se encontraron eventos con los criterios seleccionados.</p>
            </div>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import EventCard from '@/components/common/EventCard.vue';
import { eventosService } from '@/services';
import type { Evento } from '@/types';

const events = ref<Evento[]>([]);
const loading = ref(true);

const filters = ref({
  years: [] as string[],
});

const filteredEvents = computed(() => {
  if (filters.value.years.length === 0) return events.value;
  
  return events.value.filter(event => {
    return filters.value.years.includes(event.gestion);
  });
});

const resetFilters = () => {
    filters.value.years = [];
};

onMounted(async () => {
    try {
        const response = await eventosService.getAll();
        events.value = response.data;
    } catch (error) {
        console.error("Error fetching events", error);
    } finally {
        loading.value = false;
    }
});
</script>