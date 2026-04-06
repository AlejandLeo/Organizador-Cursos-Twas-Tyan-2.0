<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

// Estado del sidebar en móvil
const sidebarOpen = ref(false);

const menuItems = [
  { name: 'Datos Personales', path: '/docente/perfil' },
  { name: 'Cursos', path: '/docente/cursos' },
  // { name: 'Calificación', path: '/docente/calificaciones' }, // Implementar luego
];

const handleLogout = () => {
    router.push('/login');
};

const navigate = (path: string) => {
  if (path) router.push(path);
  if (window.innerWidth < 640) sidebarOpen.value = false;
};
</script>

<template>
  <div class="h-screen flex flex-col font-montserrat bg-white overflow-hidden">
    <!-- Top Bar -->
    <header class="bg-white border-b border-gray-200 h-20 flex-shrink-0 flex items-center justify-between px-4 sm:px-6 lg:px-8 shadow-sm relative z-20">
      <div class="flex items-center">
         <!-- Logo Izquierdo (Placeholder) -->
         <div class="h-12 w-12 bg-blue-100 flex items-center justify-center rounded-full text-blue-800 text-xs font-bold mr-3">
            TWAS
         </div>
      </div>
      
      <div class="flex-1 flex justify-center">
        <h1 class="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 tracking-wide text-center uppercase">
          GESTIÓN ACADÉMICA
        </h1>
      </div>

      <div class="flex items-center gap-4">
        <button 
          @click="handleLogout"
          class="hidden sm:block px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-sm transition-colors"
        >
          Cerrar Sesión
        </button>
        <!-- Logo Derecho (Placeholder) -->
         <div class="h-12 w-12 bg-red-100 flex items-center justify-center rounded-full text-red-800 text-xs font-bold">
            UMSA
         </div>
         <!-- Mobile menu button -->
         <button @click="sidebarOpen = !sidebarOpen" class="sm:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500">
            <span class="sr-only">Open sidebar</span>
            <svg class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
         </button>
      </div>
    </header>

    <div class="flex-1 flex overflow-hidden relative">
      <!-- Sidebar -->
      <aside 
        class="bg-gray-50/50 w-64 flex-shrink-0 border-r border-gray-200 flex flex-col transition-transform duration-300 ease-in-out transform absolute sm:relative h-full z-10"
        :class="[sidebarOpen ? 'translate-x-0' : '-translate-x-full sm:translate-x-0']"
      >
        <div class="p-6 flex flex-col items-center text-center">
          <div class="relative mb-4">
             <div class="h-24 w-24 bg-blue-200 rounded-full flex items-center justify-center text-blue-600 font-bold text-2xl border-4 border-white shadow-md">
                JD
             </div>
             <div class="absolute bottom-0 right-0 h-4 w-4 bg-green-400 border-2 border-white rounded-full"></div>
          </div>

          <h2 class="text-lg font-semibold text-gray-700 mb-1 tracking-wide">Juan Doe</h2>
          <h3 class="text-sm font-medium text-gray-500 mb-6 uppercase tracking-wider">
            Docente
          </h3>
          
          <div class="w-full border-t border-gray-200 my-2"></div>
          
          <p class="text-xs font-uppercase text-gray-400 font-bold tracking-wider mt-4 mb-3 self-start pl-2">
            FUNCIONES
          </p>
          
          <nav class="w-full space-y-1">
            <button
              v-for="item in menuItems" 
              :key="item.name" 
              @click="navigate(item.path)"
              class="w-full text-left group flex items-center px-3 py-2.5 text-sm font-medium text-gray-600 rounded-md hover:text-gray-900 hover:bg-gray-100 transition-colors focus:outline-none"
            >
              <span class="truncate">{{ item.name }}</span>
            </button>
             <button 
                @click="handleLogout"
                class="w-full text-left sm:hidden mt-4 px-3 py-2.5 text-sm font-medium text-red-600 rounded-md hover:bg-red-50 transition-colors"
              >
                Cerrar Sesión
              </button>
          </nav>
        </div>
      </aside>

      <!-- Overlay for mobile sidebar -->
      <div 
        v-if="sidebarOpen" 
        @click="sidebarOpen = false"
        class="fixed inset-0 bg-gray-600 bg-opacity-75 z-0 sm:hidden"
      ></div>

      <!-- Main Content Area -->
      <main class="flex-1 overflow-y-auto bg-gray-50 p-4 sm:p-8 relative z-0">
         <div class="max-w-5xl mx-auto">
            <RouterView />
         </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.font-montserrat {
  font-family: 'Montserrat Alternates', sans-serif;
}
</style>