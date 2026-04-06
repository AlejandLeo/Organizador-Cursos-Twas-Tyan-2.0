<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <header class="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm font-sans">
    <nav class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex flex-col md:flex-row justify-between items-center h-auto md:h-24 py-2">
        
        <!-- Logos IZQUIERDA (UNESCO - TYAN) -->
        <div class="flex items-center gap-4 mb-2 md:mb-0">
          <a href="https://twas.org/" target="_blank" class="hover:opacity-80 transition-opacity">
            <!-- Placeholder UNESCO -->
            <div class="h-12 w-12 bg-blue-100 flex items-center justify-center text-blue-800 text-xs font-bold rounded">UNESCO TWAS</div>
          </a>
          <a href="https://twas.org/tyan" target="_blank" class="hover:opacity-80 transition-opacity">
             <!-- Placeholder TYAN -->
             <div class="h-10 w-24 bg-green-100 flex items-center justify-center text-green-800 text-xs font-bold rounded">TYAN</div>
          </a>
        </div>

        <!-- MENU CENTRO -->
        <div class="flex flex-wrap justify-center gap-4 md:gap-8 text-sm font-semibold text-gray-700 uppercase tracking-wide">
          <a href="#inicio" class="hover:text-blue-600 transition-colors border-b-2 border-transparent hover:border-blue-600 pb-1">Inicio</a>
          <a href="#informacion" class="hover:text-blue-600 transition-colors border-b-2 border-transparent hover:border-blue-600 pb-1">Información</a>
          <a href="#organizacion" class="hover:text-blue-600 transition-colors border-b-2 border-transparent hover:border-blue-600 pb-1">Organización</a>
          <a href="#ubicacion" class="hover:text-blue-600 transition-colors border-b-2 border-transparent hover:border-blue-600 pb-1">Ubicación</a>
          <a href="#footer" class="hover:text-blue-600 transition-colors border-b-2 border-transparent hover:border-blue-600 pb-1">Contacto</a>
        </div>

        <!-- AACCIONES DERECHA (Login, Idioma, FCPN, UMSA) -->
        <div class="flex items-center gap-3 mt-2 md:mt-0">
          <button class="text-xs px-2 py-1 border border-gray-300 rounded hover:bg-gray-100 text-gray-600">
             ES/EN
          </button>

          <RouterLink to="/login" class="text-sm px-4 py-2 border border-blue-600 text-blue-600 rounded hover:bg-blue-50 font-medium transition-colors">
            Iniciar Sesión
          </RouterLink>

          <div class="flex items-center gap-2 border-l pl-3 ml-1 border-gray-300">
             <a href="https://www.fcpn.edu.bo/" target="_blank">
               <div class="h-10 w-8 bg-yellow-100 flex items-center justify-center text-yellow-800 text-[10px] font-bold rounded">FCPN</div>
             </a>
             <a href="https://www.umsa.bo/" target="_blank">
               <div class="h-10 w-8 bg-red-100 flex items-center justify-center text-red-800 text-[10px] font-bold rounded">UMSA</div>
             </a>
          </div>
        </div>

      </div>
    </nav>
  </header>
</template>