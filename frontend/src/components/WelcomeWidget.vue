<script setup lang="ts">
import { ref } from 'vue';

const showVideos = ref(false);

const videos = ref([
  { id: 1, title: 'Palabras del Rector', url: '', thumbnail: '' },
  { id: 2, title: 'Bienvenida Decanato', url: '', thumbnail: '' }
]);
</script>

<template>
  <div>
    
    <button
      @click="showVideos = true" 
      class="fixed bottom-6 right-6 lg:bottom-10 lg:right-10 z-50 bg-white dark:bg-slate-800 text-primary-dark dark:text-primary-light p-4 rounded-full shadow-[0_8px_0_0_rgba(203,213,225,1)] dark:shadow-[0_8px_0_0_rgba(30,41,59,1)] hover:shadow-[0_4px_0_0_rgba(203,213,225,1)] dark:hover:shadow-[0_4px_0_0_rgba(30,41,59,1)] hover:translate-y-[4px] active:translate-y-[8px] active:shadow-none border-2 border-slate-200 dark:border-slate-700 transition-all flex items-center justify-center gap-3 group"
      title="Videos de Bienvenida"
    >
      <div class="relative flex items-center justify-center bg-primary-light/10 dark:bg-primary-dark/20 rounded-full p-1">
        <!-- El halo animado detrás del ícono -->
        <div class="absolute inset-0 bg-primary-light/40 dark:bg-primary-dark/40 rounded-full scale-150 animate-ping opacity-75 group-hover:bg-primary-light/60"></div>
        <span class="material-symbols-outlined text-[28px] relative z-10 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110">movie_creation</span>
      </div>
      <span class="max-w-0 overflow-hidden whitespace-nowrap opacity-0 group-hover:max-w-[200px] group-hover:opacity-100 transition-all duration-500 font-bold text-sm tracking-wide text-slate-700 dark:text-gray-200">
        Videos de Bienvenida
      </span>
    </button>

    <!-- Modal idéntico al de la imagen -->
    <Teleport to="body">
      <transition enter-active-class="transition duration-300 ease-out" enter-from-class="opacity-0" enter-to-class="opacity-100" leave-active-class="transition duration-200 ease-in" leave-from-class="opacity-100" leave-to-class="opacity-0">
        <div v-if="showVideos" class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm p-4">
          <!-- Contenedor principal del modal -->
          <div class="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col transform transition-all scale-100" @click.stop>
            
            <!-- Header limpio como la imagen -->
            <div class="flex justify-between items-center px-8 py-5 border-b-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <div class="flex items-center gap-3">
                <span class="material-symbols-outlined text-primary-light dark:text-primary-dark text-3xl">smart_display</span>
                <h2 class="text-xl font-bold text-slate-800 dark:text-white uppercase tracking-wider">Videos de Bienvenida</h2>
              </div>
              <button @click="showVideos = false" class="text-slate-400 hover:text-white transition-all w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 shadow-[0_4px_0_0_rgba(203,213,225,1)] dark:shadow-[0_4px_0_0_rgba(30,41,59,1)] hover:translate-y-[2px] hover:shadow-[0_2px_0_0_rgba(203,213,225,1)] dark:hover:shadow-[0_2px_0_0_rgba(30,41,59,1)] active:translate-y-[4px] active:shadow-none border-2 border-slate-200 dark:border-slate-700 hover:bg-red-500 dark:hover:bg-red-600 dark:hover:border-red-600 group">
                <span class="material-symbols-outlined text-[24px] group-hover:rotate-90 transition-transform duration-300">close</span>
              </button>
            </div>
            
            <!-- Cuerpo de los videos -->
            <div class="p-8">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Bloque Video 1 -->
                <button class="relative bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-[0_6px_0_0_rgba(203,213,225,1)] dark:shadow-[0_6px_0_0_rgba(30,41,59,1)] border-2 border-slate-200 dark:border-slate-700 flex flex-col group cursor-pointer hover:translate-y-[2px] hover:shadow-[0_4px_0_0_rgba(203,213,225,1)] dark:hover:shadow-[0_4px_0_0_rgba(30,41,59,1)] active:translate-y-[6px] active:shadow-none transition-all duration-200 overflow-hidden">
                  <!-- Fondo decorativo -->
                  <div class="absolute inset-0 bg-gradient-to-br from-primary-light/5 to-transparent dark:from-primary-dark/20 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  <!-- Thumbnail area -->
                  <div class="aspect-video bg-slate-100 dark:bg-slate-700/50 rounded-xl mb-4 flex items-center justify-center relative overflow-hidden border border-slate-200 dark:border-slate-600/50 group-hover:border-primary-light/50 dark:group-hover:border-primary-dark/50 transition-colors">
                    <!-- Botón Play flotante estilizado -->
                    <div class="w-14 h-14 bg-white dark:bg-slate-800 rounded-full shadow-lg flex items-center justify-center relative z-10 group-hover:scale-110 group-hover:bg-primary-light dark:group-hover:bg-primary-dark transition-all duration-300 transform">
                      <div class="absolute inset-0 bg-primary-light/30 dark:bg-primary-dark/30 rounded-full animate-ping opacity-0 group-hover:opacity-100"></div>
                      <span class="material-symbols-outlined text-3xl text-primary-dark dark:text-white ml-1 group-hover:text-white transition-colors">play_arrow</span>
                    </div>
                  </div>
                  
                  <div class="flex items-center justify-center gap-2 w-full">
                    <span class="material-symbols-outlined text-[18px] text-primary-light dark:text-primary-dark opacity-0 group-hover:opacity-100 transition-opacity -ml-4 group-hover:ml-0">movie</span>
                    <h3 class="font-bold text-[16px] text-slate-700 dark:text-slate-200 group-hover:text-primary-dark dark:group-hover:text-white transition-colors">{{ videos[0].title }}</h3>
                  </div>
                </button>

                <!-- Bloque Video 2 -->
                <button class="relative bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-[0_6px_0_0_rgba(203,213,225,1)] dark:shadow-[0_6px_0_0_rgba(30,41,59,1)] border-2 border-slate-200 dark:border-slate-700 flex flex-col group cursor-pointer hover:translate-y-[2px] hover:shadow-[0_4px_0_0_rgba(203,213,225,1)] dark:hover:shadow-[0_4px_0_0_rgba(30,41,59,1)] active:translate-y-[6px] active:shadow-none transition-all duration-200 overflow-hidden">
                  <!-- Fondo decorativo -->
                  <div class="absolute inset-0 bg-gradient-to-br from-primary-light/5 to-transparent dark:from-primary-dark/20 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  <!-- Thumbnail area -->
                  <div class="aspect-video bg-slate-100 dark:bg-slate-700/50 rounded-xl mb-4 flex items-center justify-center relative overflow-hidden border border-slate-200 dark:border-slate-600/50 group-hover:border-primary-light/50 dark:group-hover:border-primary-dark/50 transition-colors">
                    <!-- Botón Play flotante estilizado -->
                    <div class="w-14 h-14 bg-white dark:bg-slate-800 rounded-full shadow-lg flex items-center justify-center relative z-10 group-hover:scale-110 group-hover:bg-primary-light dark:group-hover:bg-primary-dark transition-all duration-300 transform">
                      <div class="absolute inset-0 bg-primary-light/30 dark:bg-primary-dark/30 rounded-full animate-ping opacity-0 group-hover:opacity-100"></div>
                      <span class="material-symbols-outlined text-3xl text-primary-dark dark:text-white ml-1 group-hover:text-white transition-colors">play_arrow</span>
                    </div>
                  </div>
                  
                  <div class="flex items-center justify-center gap-2 w-full">
                    <span class="material-symbols-outlined text-[18px] text-primary-light dark:text-primary-dark opacity-0 group-hover:opacity-100 transition-opacity -ml-4 group-hover:ml-0">movie</span>
                    <h3 class="font-bold text-[16px] text-slate-700 dark:text-slate-200 group-hover:text-primary-dark dark:group-hover:text-white transition-colors">{{ videos[1].title }}</h3>
                  </div>
                </button>
              </div>
            </div>

          </div>
        </div>
      </transition>
    </Teleport>
  </div>
</template>
