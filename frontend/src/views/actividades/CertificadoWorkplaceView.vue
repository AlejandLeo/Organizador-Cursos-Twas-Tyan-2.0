<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const actividadId = route.params.id

const goBack = () => {
    router.push({ name: 'coordinador-actividades-detalle', params: { id: actividadId } })
}
</script>

<template>
  <div class="h-screen w-full bg-slate-50 dark:bg-[#0B1120] flex flex-col font-sans overflow-hidden">
    
    <!-- Topbar (Fullscreen Mode) -->
    <header class="h-16 bg-white dark:bg-gray-900 border-b border-slate-200 dark:border-gray-800 flex items-center justify-between px-6 shrink-0 z-10 shadow-sm relative">
      <div class="flex items-center gap-4">
        <button @click="goBack" class="w-10 h-10 rounded-full bg-slate-50 dark:bg-gray-800 flex items-center justify-center text-slate-500 hover:text-primary-dark dark:hover:text-white hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors shadow-inner border border-slate-200 dark:border-gray-700 hover:border-umsa-blue">
          <span class="material-symbols-outlined text-lg">arrow_back</span>
        </button>
        <div>
          <h1 class="text-sm font-black text-primary-dark dark:text-white uppercase tracking-tight">Workplace del Certificado</h1>
          <p class="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Edición en Lienzo - Actividad #{{ actividadId }}</p>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <button class="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-slate-500 dark:text-gray-300 text-[10px] font-black uppercase tracking-widest hover:border-umsa-gold shadow-sm transition-all flex items-center gap-2">
            <span class="material-symbols-outlined text-[14px]">visibility</span> Previsualizar
        </button>
        <button class="px-6 py-2.5 rounded-xl bg-primary-dark text-white text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 shadow-lg hover:shadow-emerald-500/20 transition-all flex items-center gap-2">
            <span class="material-symbols-outlined text-[14px]">save</span> Guardar Diseño
        </button>
      </div>
    </header>

    <!-- Main Editor Area -->
    <div class="flex flex-1 overflow-hidden">
        
        <!-- Sidebar Izquierdo: Herramientas -->
        <aside class="w-72 bg-white dark:bg-gray-900 border-r border-slate-200 dark:border-gray-800 flex flex-col h-full shrink-0 z-10 shadow-lg">
            <div class="p-6 border-b border-slate-100 dark:border-gray-800">
                <h2 class="text-xs font-black text-umsa-gold uppercase tracking-widest flex items-center gap-2">
                   <span class="material-symbols-outlined text-sm">build</span> Herramientas
                </h2>
            </div>
            
            <div class="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
                <!-- Seccion 1: Capas/Fondos -->
                <div>
                    <h3 class="text-[10px] font-black text-slate-500 dark:text-gray-400 uppercase tracking-widest mb-3">Imágenes</h3>
                    <div class="space-y-2">
                        <button class="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 hover:border-umsa-blue transition-colors group">
                            <div class="w-8 h-8 rounded-lg bg-white dark:bg-gray-900 flex items-center justify-center shadow-sm">
                                <span class="material-symbols-outlined text-slate-400 text-[16px] group-hover:text-umsa-blue transition-colors">image</span>
                            </div>
                            <span class="text-xs font-bold text-primary-dark dark:text-white">Fondo Base</span>
                        </button>
                    </div>
                </div>

                <!-- Seccion 2: Variables Dinámicas -->
                <div>
                    <h3 class="text-[10px] font-black text-slate-500 dark:text-gray-400 uppercase tracking-widest mb-3">Variables Dinámicas (Arrastrar)</h3>
                    <div class="space-y-2">
                        <div draggable="true" class="flex items-center gap-3 p-2.5 rounded-lg bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 hover:border-emerald-500 transition-colors cursor-move group">
                            <span class="material-symbols-outlined text-slate-300 text-[14px]">drag_indicator</span>
                            <span class="text-[10px] font-black font-mono text-primary-dark dark:text-white flex-1">{{ '{' }} NOMBRE_ESTUDIANTE {{ '}' }}</span>
                            <span class="material-symbols-outlined text-xs text-slate-400">text_fields</span>
                        </div>
                        <div draggable="true" class="flex items-center gap-3 p-2.5 rounded-lg bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 hover:border-emerald-500 transition-colors cursor-move group">
                            <span class="material-symbols-outlined text-slate-300 text-[14px]">drag_indicator</span>
                            <span class="text-[10px] font-black font-mono text-primary-dark dark:text-white flex-1">{{ '{' }} NOMBRE_CURSO {{ '}' }}</span>
                            <span class="material-symbols-outlined text-xs text-slate-400">text_fields</span>
                        </div>
                        <div draggable="true" class="flex items-center gap-3 p-2.5 rounded-lg bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 hover:border-emerald-500 transition-colors cursor-move group">
                            <span class="material-symbols-outlined text-slate-300 text-[14px]">drag_indicator</span>
                            <span class="text-[10px] font-black font-mono text-primary-dark dark:text-white flex-1">{{ '{' }} CODIGO_CERTIFICADO {{ '}' }}</span>
                            <span class="material-symbols-outlined text-xs text-slate-400">123</span>
                        </div>
                    </div>
                </div>

                <!-- Seccion 3: Códigos y Firmas -->
                <div>
                    <h3 class="text-[10px] font-black text-slate-500 dark:text-gray-400 uppercase tracking-widest mb-3">Trazabilidad</h3>
                    <div class="grid grid-cols-2 gap-2">
                        <div draggable="true" class="aspect-square rounded-xl bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 hover:border-umsa-gold transition-colors flex flex-col items-center justify-center gap-2 cursor-move">
                            <span class="material-symbols-outlined text-[24px] text-slate-400">qr_code_2</span>
                            <span class="text-[9px] font-black uppercase text-slate-500">QR Code</span>
                        </div>
                        <div draggable="true" class="aspect-square rounded-xl bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 hover:border-umsa-gold transition-colors flex flex-col items-center justify-center gap-2 cursor-move">
                            <span class="material-symbols-outlined text-[24px] text-slate-400">draw</span>
                            <span class="text-[9px] font-black uppercase text-slate-500 text-center">Firma 1<br>(Director)</span>
                        </div>
                    </div>
                </div>
            </div>
        </aside>

        <!-- Canvas Central -->
        <main class="flex-1 bg-slate-100 dark:bg-[#0B1120] relative flex items-center justify-center overflow-auto p-12 relative inner-shadow-workplace">
            
            <!-- Controls Overlay (Zoom, etc) -->
            <div class="absolute bottom-8 right-8 flex gap-2 z-20">
                <button class="w-10 h-10 rounded-full bg-white dark:bg-gray-800 shadow-lg border border-slate-200 dark:border-gray-700 flex items-center justify-center text-slate-500 hover:text-umsa-blue hover:-translate-y-0.5 transition-all">
                    <span class="material-symbols-outlined text-[18px]">zoom_out</span>
                </button>
                <div class="h-10 px-4 rounded-full bg-white dark:bg-gray-800 shadow-lg border border-slate-200 dark:border-gray-700 flex items-center justify-center text-xs font-black text-primary-dark dark:text-white">
                    100%
                </div>
                <button class="w-10 h-10 rounded-full bg-white dark:bg-gray-800 shadow-lg border border-slate-200 dark:border-gray-700 flex items-center justify-center text-slate-500 hover:text-umsa-blue hover:-translate-y-0.5 transition-all">
                    <span class="material-symbols-outlined text-[18px]">zoom_in</span>
                </button>
            </div>

            <!-- The Document Canvas -->
            <div class="w-full max-w-[1024px] aspect-[1.414/1] bg-white dark:bg-gray-900 shadow-2xl border border-slate-200 dark:border-gray-800 relative flex items-center justify-center group ring-4 ring-black/5 dark:ring-white/5 mx-auto">
                <!-- Placeholder when empty -->
                <div class="text-center absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-50 dark:opacity-20">
                    <span class="material-symbols-outlined text-[80px] text-slate-300 dark:text-gray-600 mb-4">aspect_ratio</span>
                    <h3 class="text-2xl font-black text-slate-400 dark:text-gray-500 uppercase tracking-tight">Formato A4 Horizontal</h3>
                    <p class="text-xs text-slate-400 font-bold mt-2 font-mono">1123 x 794 px</p>
                </div>
                
                <!-- Floating Element Simulations (Workspace bounds) -->
                <div class="absolute bottom-[20%] right-[15%] w-[160px] h-[50px] bg-slate-50/80 dark:bg-black/80 border border-emerald-500 rounded border-dashed flex items-center justify-center backdrop-blur-md shadow-lg shadow-emerald-500/10 cursor-move hover:border-solid hover:scale-105 transition-all group/el">
                    <span class="material-symbols-outlined text-xs absolute -top-3 -right-3 w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover/el:opacity-100 transition-opacity z-10 hover:bg-emerald-600 cursor-pointer">close</span>
                    <span class="text-[10px] font-black font-mono text-emerald-600 dark:text-emerald-400">{{ '{' }} FIRMA_1 {{ '}' }}</span>
                </div>
                
                <div class="absolute top-[40%] left-1/2 -translate-x-1/2 w-[400px] h-[60px] bg-slate-50/80 dark:bg-black/80 border border-blue-500 rounded border-dashed flex items-center justify-center backdrop-blur-md shadow-lg shadow-blue-500/10 cursor-move hover:border-solid hover:scale-105 transition-all group/el">
                    <span class="material-symbols-outlined text-xs absolute -top-3 -right-3 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover/el:opacity-100 transition-opacity z-10 hover:bg-blue-600 cursor-pointer">close</span>
                    <span class="text-[12px] font-black font-mono text-blue-600 dark:text-blue-400">{{ '{' }} NOMBRES_ESTUDIANTE {{ '}' }}</span>
                </div>
                
                <div class="absolute bottom-[10%] left-[8%] w-[80px] h-[80px] bg-slate-50/80 dark:bg-black/80 border border-slate-400 rounded border-dashed flex items-center justify-center backdrop-blur-md shadow-lg cursor-move hover:border-solid hover:border-umsa-gold hover:scale-105 transition-all group/el">
                    <span class="material-symbols-outlined text-xs absolute -top-3 -right-3 w-6 h-6 bg-slate-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover/el:opacity-100 transition-opacity z-10 hover:bg-red-500 cursor-pointer">close</span>
                    <span class="material-symbols-outlined text-[32px] text-slate-500">qr_code_2</span>
                </div>
            </div>
        </main>
        
        <!-- Panel Derecho: Propiedades -->
        <aside class="w-64 bg-white dark:bg-gray-900 border-l border-slate-200 dark:border-gray-800 flex flex-col h-full shrink-0 z-10 shadow-lg">
             <div class="p-6 border-b border-slate-100 dark:border-gray-800">
                <h2 class="text-xs font-black text-primary-dark dark:text-white uppercase tracking-widest flex items-center gap-2">
                   <span class="material-symbols-outlined text-sm">tune</span> Propiedades
                </h2>
            </div>
            
            <div class="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center text-center opacity-60">
                <span class="material-symbols-outlined text-4xl text-slate-300 dark:text-gray-600 mb-3">touch_app</span>
                <p class="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">Selecciona un elemento<br>en el lienzo para editar</p>
            </div>
        </aside>
    </div>

  </div>
</template>

<style scoped>
.inner-shadow-workplace {
    box-shadow: inset 0 0 100px rgba(0,0,0,0.02);
}
:global(.dark) .inner-shadow-workplace {
    box-shadow: inset 0 0 100px rgba(0,0,0,0.5);
}
.scrollbar-hide::-webkit-scrollbar {
    display: none;
}
.scrollbar-hide {
    -ms-overflow-style: none;  /* IE and Edge */
    scrollbar-width: none;  /* Firefox */
}
</style>
