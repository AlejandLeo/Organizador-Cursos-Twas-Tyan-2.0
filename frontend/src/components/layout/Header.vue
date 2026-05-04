<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useEventoStore } from '@/stores/eventoStore'

const eventoStore = useEventoStore()
</script>

<template>
  <header class="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm font-sans">
    <nav class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex flex-col md:flex-row justify-between items-center h-auto md:h-24 py-2">
        
        <!-- Logos IZQUIERDA (DISEÑO INSTITUCIONAL DINÁMICO) -->
        <div class="flex items-center gap-4 mb-2 md:mb-0">
          <RouterLink to="/" class="hover:opacity-80 transition-all duration-300 flex items-center gap-3">
            <!-- Escudo Institucional UMSA -->
            <img src="https://upload.wikimedia.org/wikipedia/commons/a/af/Escudo_de_la_Universidad_Mayor_de_San_Andr%C3%A9s.png" alt="UMSA" class="h-14 w-auto object-contain hidden sm:block" />
            
            <div class="h-10 w-px bg-slate-200 hidden sm:block mx-1"></div>

            <!-- Nombre y Sigla del Evento -->
            <div class="flex items-center gap-3 overflow-hidden">
               <span class="text-[11px] md:text-sm font-black text-umsa-blue uppercase tracking-tighter truncate max-w-[200px] md:max-w-[400px] leading-tight">
                 {{ eventoStore.activeEvento?.nombre || 'Portal Académico' }}
               </span>
              
              <!-- Sigla Badge Dinámico -->
              <div v-if="eventoStore.activeEvento?.sigla" 
                   :style="{ backgroundColor: eventoStore.activeEvento.color_principal || '#0070b4' }"
                   class="px-3 py-1.5 rounded-lg shadow-md shadow-blue-500/20 transform -skew-x-12">
                <span class="text-[11px] font-black text-white uppercase block transform skew-x-12 leading-none italic">{{ eventoStore.activeEvento.sigla }}</span>
              </div>
            </div>
          </RouterLink>
        </div>

        <!-- MENU CENTRO -->
        <div class="flex flex-wrap justify-center gap-4 md:gap-8 text-[11px] font-black text-slate-500 uppercase tracking-widest">
          <a href="#inicio" class="hover:text-blue-600 transition-colors">Inicio</a>
          <a href="#informacion" class="hover:text-blue-600 transition-colors">Información</a>
          <a href="#organizacion" class="hover:text-blue-600 transition-colors">Organización</a>
          <a href="#ubicacion" class="hover:text-blue-600 transition-colors">Ubicación</a>
          <a href="#footer" class="hover:text-blue-600 transition-colors">Contacto</a>
        </div>

          <!-- ACCCIONES DERECHA -->
          <div class="flex items-center gap-4 mt-2 md:mt-0">
            <RouterLink to="/login" class="bg-umsa-blue hover:bg-primary-dark text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2">
              <span class="material-symbols-outlined text-sm">login</span> Ingresar
            </RouterLink>

            <div class="flex items-center gap-2 border-l pl-4 border-slate-200">
               <div class="w-10 h-10 rounded-full border border-slate-200 p-1 flex items-center justify-center bg-white shadow-sm overflow-hidden">
                 <img src="https://fcpn.umsa.bo/fcpn-theme/images/logo_fcpn.png" class="w-full h-full object-contain" alt="FCPN" />
               </div>
               <div class="w-10 h-10 rounded-full border border-slate-200 p-1 flex items-center justify-center bg-white shadow-sm overflow-hidden">
                 <img src="https://upload.wikimedia.org/wikipedia/commons/a/af/Escudo_de_la_Universidad_Mayor_de_San_Andr%C3%A9s.png" class="w-full h-full object-contain" alt="UMSA" />
               </div>
            </div>
          </div>

      </div>
    </nav>
  </header>
</template>