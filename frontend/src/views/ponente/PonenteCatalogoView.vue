<script setup lang="ts">
import { ref } from 'vue';

const actividadesPublicadas = ref([
  {
    id: 1,
    actividad: 'Programa de Especialidad en Biofertilizantes',
    tipo: 'Diplomado',
    modalidad: 'Virtual',
    sesiones: 3,
    fecha: '10/05/2026 - 15/09/2026',
    image: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&q=80',
    description: 'Profundiza en la producciÃ³n y aplicaciÃ³n de fertilizantes orgÃ¡nicos y microorganismos beneficiosos.',
    area: 'Ciencias AgrÃ­colas'
  },
  {
    id: 2,
    actividad: 'Modelado Geoespacial para Ciencias Exactas',
    tipo: 'Taller Especializado',
    modalidad: 'Presencial',
    sesiones: 1,
    fecha: '20/06/2026 - 22/06/2026',
    image: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800&q=80',
    description: 'AnÃ¡lisis de datos espaciales y proyecciones geogrÃ¡ficas aplicadas utilizando sistemas de informaciÃ³n.',    
    area: 'IngenierÃ­a GeogrÃ¡fica'
  },
  {
    id: 3,
    actividad: 'BiotecnologÃ­a Molecular BÃ¡sica',
    tipo: 'Curso Corto',
    modalidad: 'Semi-Presencial',
    sesiones: 5,
    fecha: '01/08/2026 - 30/08/2026',
    image: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800&q=80',
    description: 'Fundamentos de biotecnologÃ­a aplicada a nivel molecular en laboratorios.',    
    area: 'BiologÃ­a y Medicina'
  },
  {
    id: 4,
    actividad: 'Congreso Internacional de Recursos HÃ­dricos',
    tipo: 'Conferencia',
    modalidad: 'Presencial',
    sesiones: 12,
    fecha: '12/10/2026 - 15/10/2026',
    image: 'https://images.unsplash.com/photo-1541680670548-2204cb73c713?w=800&q=80',
    description: 'GestiÃ³n moderna y tratamiento de recursos hÃ­dricos en el contexto del cambio climÃ¡tico actual.',
    area: 'IngenierÃ­a Ambiental'  }
]);
</script>
<template>
  <div class="space-y-10 animate-in fade-in duration-500">
    <!-- HERO SECCIÃ“N TIPO NETFLIX (Destacado) -->
    <div class="relative w-full min-h-[350px] md:min-h-[450px] rounded-3xl overflow-hidden shadow-2xl group flex flex-col justify-end">
        <div class="absolute inset-0 bg-primary-dark/40 dark:bg-black/60 z-10 group-hover:bg-primary-dark/30 dark:group-hover:bg-black/40 transition-colors duration-700"></div>
        <img src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1600&q=80" class="absolute inset-0 w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-1000" alt="Hero Course">
        <div class="absolute inset-0 bg-gradient-to-t from-primary-dark via-primary-dark/80 to-transparent dark:from-black dark:via-black/80 z-20"></div>
        
        <div class="relative z-30 p-8 md:p-12 pt-16 w-full md:w-2/3 lg:w-1/2">
            <div class="flex items-center gap-3 mb-4">
              <span class="inline-flex items-center gap-1.5 px-4 py-1.5 bg-emerald-500 text-white border border-emerald-400/30 text-[10px] font-black uppercase tracking-widest rounded-lg shadow-lg shadow-emerald-500/20">
                <span class="material-symbols-outlined text-[14px]">public</span> Evento Activo
              </span>
              <span class="inline-flex items-center gap-1.5 px-4 py-1.5 bg-umsa-blue border border-blue-400/30 text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-lg shadow-umsa-blue/40">
                <span class="material-symbols-outlined text-[14px]">workspace_premium</span> VersiÃ³n 2026
              </span>
            </div>
            
            <h1 class="text-3xl md:text-5xl font-black text-white leading-tight uppercase italic tracking-tighter mb-4 drop-shadow-lg">
              <span class="text-blue-200">TWAS</span><br>
              The World Academy of Sciences
            </h1>
            
            <div class="flex items-center gap-3 mb-6 hidden md:flex">
              <span class="px-3 py-1.5 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-inner">
                <span class="material-symbols-outlined text-[16px] text-emerald-400">check_circle</span> Inscripciones Abiertas
              </span>
              <span class="px-3 py-1.5 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-inner">
                <span class="material-symbols-outlined text-[16px] text-emerald-400">school</span> 4 Actividades AcadÃ©micas
              </span>
            </div>
            
            <p class="text-slate-200 dark:text-gray-300 text-sm mb-8 leading-relaxed hidden md:block drop-shadow-md font-medium max-w-xl">
               EstÃ¡s explorando el catÃ¡logo oficial de la <strong class="text-white">VersiÃ³n 2026</strong> del evento TWAS. Ãšnete a nuestra red global e inscrÃ­bete a las actividades acadÃ©micas, diplomados y conferencias disponibles para esta gestiÃ³n.
            </p>
            
            <div class="flex gap-4">
                <button class="bg-white text-umsa-blue hover:bg-slate-50 px-6 md:px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 border border-white/90 flex items-center gap-2">
                    <span class="material-symbols-outlined text-[18px]">info</span>
                    Sobre el Evento
                </button>
                <button class="bg-umsa-blue/90 backdrop-blur-sm text-white hover:bg-umsa-blue px-6 hidden md:flex py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-umsa-blue/30 hover:shadow-xl hover:shadow-umsa-blue/40 hover:-translate-y-1 border border-white/20 items-center gap-2">
                    <span class="material-symbols-outlined text-[18px]">explore</span>
                    Ver Actividades
                </button>
            </div>
        </div>
    </div>

    <!-- SECCIÃ“N CAROUSEL: NUEVOS EVENTOS -->
    <div class="space-y-6">
        <div class="flex items-center justify-between px-2">
            <h2 class="text-xl md:text-2xl font-black text-primary-dark dark:text-white uppercase tracking-tighter italic flex items-center gap-2">
                <span class="material-symbols-outlined text-umsa-blue dark:text-blue-400 text-2xl">local_library</span>
                Actividades AcadÃ©micas Disponibles
            </h2>
            <div class="flex gap-2">
                <button class="h-8 w-8 rounded-full bg-slate-200 dark:bg-gray-800 flex items-center justify-center text-slate-500 hover:text-primary-dark dark:hover:text-white transition-colors">
                   <span class="material-symbols-outlined text-sm">chevron_left</span>
                </button>
                <button class="h-8 w-8 rounded-full bg-slate-200 dark:bg-gray-800 flex items-center justify-center text-slate-500 hover:text-primary-dark dark:hover:text-white transition-colors">
                   <span class="material-symbols-outlined text-sm">chevron_right</span>
                </button>
            </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div v-for="course in actividadesPublicadas" :key="course.id" class="bg-white dark:bg-gray-900 rounded-3xl overflow-hidden shadow-sm border border-slate-100 dark:border-gray-800 group hover:-translate-y-2 hover:shadow-xl hover:shadow-primary-dark/5 dark:hover:shadow-black/50 transition-all duration-300 cursor-pointer flex flex-col h-full relative">
                <!-- Imagen Header -->
                <div class="relative h-48 w-full overflow-hidden">
                    <div class="absolute inset-0 bg-primary-dark/20 dark:bg-black/40 group-hover:bg-transparent transition-colors z-10"></div>
                    <img :src="course.image" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" :alt="course.actividad">
                    <span class="absolute top-4 left-4 z-20 bg-black/60 backdrop-blur-md text-white text-[9px] font-bold px-3 py-1.5 rounded-lg uppercase tracking-widest border border-white/10">
                        {{ course.modalidad }}
                    </span>
                </div>
                
                <!-- Body Content -->
                <div class="p-6 flex-1 flex flex-col">
                    <p class="text-[10px] uppercase tracking-widest text-blue-600 dark:text-blue-400 font-bold mb-2">{{ course.area }}</p>
                    <h3 class="text-base font-black text-primary-dark dark:text-white leading-tight uppercase mb-1 line-clamp-2">{{ course.actividad }}</h3>
                    <p class="text-xs font-bold text-slate-500 mb-3 uppercase tracking-widest flex items-center justify-between">
                      <span>{{ course.tipo }}</span>
                      <span class="bg-umsa-blue/10 text-umsa-blue px-2 py-0.5 rounded-md text-[9px]">{{ course.sesiones }} mÃ³dulos</span>
                    </p>
                    <p class="text-xs text-slate-500 dark:text-gray-400 mb-4 line-clamp-2 leading-relaxed">{{ course.description }}</p>
                    
                    <div class="mt-auto pt-4 border-t border-slate-100 dark:border-gray-800 flex items-center justify-between text-[10px] font-bold text-slate-400">
                        <div class="flex items-center gap-1.5 bg-slate-50 dark:bg-gray-800 px-2.5 py-1.5 rounded-lg">
                            <span class="material-symbols-outlined text-[13px]">calendar_today</span>
                            {{ course.fecha.split(' - ')[0] }}
                        </div>
                        <span class="material-symbols-outlined text-umsa-blue dark:text-blue-400 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all">arrow_forward</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
  </div>
</template>