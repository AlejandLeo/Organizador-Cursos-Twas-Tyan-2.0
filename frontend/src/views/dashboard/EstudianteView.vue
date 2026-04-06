<script setup lang='ts'>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

// Estado del sidebar en móvil
const sidebarOpen = ref(false);

const menuItems = [
  { name: 'Datos Personales', href: '#' },
  { name: 'Cursos', href: '#' },
  { name: 'Asistencia', href: '#' },
];

const handleLogout = () => {
    router.push('/login');
};
</script>

<template>
  <div class='min-h-screen flex flex-col font-montserrat bg-white'>
    <!-- Top Bar -->
    <header class='bg-white border-b border-gray-200 h-20 flex items-center justify-between px-4 sm:px-6 lg:px-8 shadow-sm relative z-20'>
      <div class='flex items-center'>
         <!-- Logo Izquierdo (Placeholder) -->
         <div class='h-12 w-12 bg-blue-100 flex items-center justify-center rounded-full text-blue-800 text-xs font-bold mr-3'>
            TWAS
         </div>
      </div>
      
      <div class='flex-1 flex justify-center'>
        <h1 class='text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 tracking-wide text-center uppercase'>
          GESTIÓN ESTUDIANTE
        </h1>
      </div>

      <div class='flex items-center gap-4'>
        <button 
          @click='handleLogout'
          class='hidden sm:block px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-sm transition-colors'
        >
          Cerrar Sesión
        </button>
        <!-- Logo Derecho (Placeholder) -->
         <div class='h-12 w-12 bg-red-100 flex items-center justify-center rounded-full text-red-800 text-xs font-bold'>
            UMSA
         </div>
         <!-- Mobile menu button -->
         <button @click='sidebarOpen = !sidebarOpen' class='sm:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500'>
            <span class='sr-only'>Open sidebar</span>
            <svg class='h-6 w-6' xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor' aria-hidden='true'>
              <path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M4 6h16M4 12h16M4 18h16' />
            </svg>
         </button>
      </div>
    </header>

    <div class='flex-1 flex overflow-hidden relative'>
      <!-- Sidebar -->
      <aside 
        class="bg-gray-50/50 w-64 flex-shrink-0 border-r border-gray-200 flex flex-col transition-transform duration-300 ease-in-out transform absolute sm:relative h-full z-10"
        :class="[sidebarOpen ? 'translate-x-0' : '-translate-x-full sm:translate-x-0']"
      >
        <div class='p-6 flex flex-col items-center text-center'>
          <h2 class='text-lg font-semibold text-gray-700 mb-2 tracking-wide'>BIENVENIDO</h2>
          <h3 class='text-xl font-bold text-gray-900 mb-6 leading-tight'>
            Nombre<br/>Apellido
          </h3>
          
          <div class='w-full border-t border-gray-200 my-2'></div>
          
          <p class='text-sm font-uppercase text-gray-500 font-bold tracking-wider mt-4 mb-3 self-start pl-2'>
            FUNCIONES
          </p>
          
          <nav class='w-full space-y-1'>
            <a 
              v-for='item in menuItems' 
              :key='item.name' 
              :href='item.href'
              class='group flex items-center px-3 py-2.5 text-sm font-medium text-gray-600 rounded-md hover:text-gray-900 hover:bg-gray-100 transition-colors'
            >
              <span class='truncate'>{{ item.name }}</span>
            </a>
             <button 
                @click='handleLogout'
                class='w-full text-left sm:hidden mt-4 px-3 py-2.5 text-sm font-medium text-red-600 rounded-md hover:bg-red-50 transition-colors'
              >
                Cerrar Sesión
              </button>
          </nav>
        </div>
      </aside>

      <!-- Overlay for mobile sidebar -->
      <div 
        v-if='sidebarOpen' 
        @click='sidebarOpen = false'
        class='fixed inset-0 bg-gray-600 bg-opacity-75 z-0 sm:hidden'
      ></div>

      <!-- Main Content Area -->
      <main class='flex-1 overflow-y-auto bg-white p-4 sm:p-8 relative z-0'>
        <!-- Placeholder for content (iframe replacement) -->
        <div class='max-w-4xl mx-auto'>
           <div class='bg-white shadow overflow-hidden sm:rounded-lg border border-gray-200 min-h-[500px] flex items-center justify-center text-gray-400'>
             <p>Panel de Estudiante - Selecciona una opción</p>
           </div>
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
