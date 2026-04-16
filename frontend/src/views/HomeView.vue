<script setup lang="ts">
import { ref } from 'vue';

const eventosActivos = ref([
  {
    id: 1,
    title: 'TYAN Hands-on Schools 3ra Versión',
    subtitle: 'Agroindustria y Ciencias Ambientales',
    status: 'Inscripciones Abiertas',
    gestion: '2025',
    date: '06/10/2025 - 10/10/2025',
    dateShort: '6 al 10 de Octubre',
    description: 'La escuela TYAN Hands-on Schools en Bolivia da la bienvenida a expositores y estudiantes a su tercera versión, auspiciada por la red de jóvenes afiliados (TYAN), La academia internacional de ciencias (TWAS) y la UMSA.',
    color: 'bg-emerald-500',
    icon: 'school'
  },
  {
    id: 2,
    title: 'Simposio Regional de Inteligencia Artificial',
    subtitle: 'Transformación digital aplicada al agro',
    status: 'Próximamente',
    gestion: '2026',
    date: '01/08/2026 - 30/08/2026',
    dateShort: '1 al 30 de Agosto',
    description: 'Este simposio busca establecer un marco colaborativo para aplicar la inteligencia artificial y el aprendizaje automático en las ciencias agronómicas y ambientales en Bolivia.',
    color: 'bg-umsa-gold',
    icon: 'memory'
  }
]);

const getStatusColor = (status: string) => {
  if (status === 'Inscripciones Abiertas') return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800';
  if (status === 'Próximamente') return 'text-umsa-blue bg-blue-50 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-800';
  return 'text-slate-500 bg-slate-100 dark:bg-gray-800 dark:text-gray-400 border border-slate-200 dark:border-gray-700';
};

const eventoSeleccionado = ref(eventosActivos.value[0]);

const seleccionarEvento = (evento: any) => {
  eventoSeleccionado.value = evento;
  // Solo hacer scroll si hacemos click desde un botón general (ya no en los tabs del Hero, porque quita la experiencia visual).
};

// Datos del cronograma (Mocked based on index.html)
const days = [
  { 
    day: 6, 
    name: 'Lunes', 
    events: [
      { time: '08:30', title: 'Registro' }, 
      { time: '09:00', title: 'Inauguración' }
    ] 
  },
  { 
    day: 7, 
    name: 'Martes', 
    events: [
      { time: '09:00', title: 'Presentaciones' }, 
      { time: '14:00', title: 'Prácticas' }
    ] 
  },
  { 
    day: 8, 
    name: 'Miércoles',
    events: [
      { time: '09:00', title: 'Presentaciones' }, 
      { time: '14:00', title: 'Prácticas' }
    ] 
  },
  { 
    day: 9, 
    name: 'Jueves', 
    events: [
      { time: '09:00', title: 'Presentaciones' }, 
      { time: '14:00', title: 'Prácticas' }
    ] 
  },
  { 
    day: 10, 
    name: 'Viernes', 
    events: [
      { time: '09:00', title: 'Presentaciones' }, 
      { time: '12:00', title: 'Clausura' }
    ] 
  },
];

const speakers = [
  { name: 'Dra. Warshi Dandeniya', country: 'Sri Lanka', topic: 'Biofertilizantes para la producción sostenible de cultivos', img: '/images/Dandeniya.webp' },
  { name: 'Dr. Ranga Ambati', country: 'India', topic: 'Algas para la seguridad alimentaria y nutricional', img: '/images/AbantiRaga.webp' },
  { name: 'Dr. Pablo Bolaños-Villegas', country: 'Costa Rica', topic: 'Biología de la reproducción vegetal para fitomejoradores', img: '/images/PabloBollanos.png' },
  { name: 'Dra. Mónica Izurieta Guevara', country: 'Ecuador', topic: 'Agroinnovación para construir resiliencia: modelos gastronómicos sostenibles', img: '/images/MonicaGuevara.webp' },
  { name: 'Dra. Gloria Rodrigo', country: 'Bolivia', topic: 'Modelos animales y aplicaciones en agroindustria y medio ambiente', img: '/images/Exp-Gloria.webp' },
  { name: 'Dr. Federico Brown', country: 'Brasil', topic: 'Modelos animales y aplicaciones en agroindustria y medio ambiente', img: '/images/federicoBrown.jpg' },
  { name: 'Dra. Sdenka Moscoso', country: 'Bolivia', topic: 'Modelos animales y aplicaciones en agroindustria y medio ambiente', img: '/images/Exp-Sdenka.webp' },
];
</script>

<template>
  <main class="font-sans text-gray-800 dark:text-gray-200 transition-colors duration-300">
    <!-- SECCIÓN PRINCIPAL (HERO) -->
    <section id="inicio" class="relative w-full min-h-[90vh] md:min-h-[100vh] group flex flex-col justify-center items-center md:items-start text-center md:text-left pt-24 pb-12">
        <div class="absolute inset-0 bg-primary-dark/40 dark:bg-black/60 z-10 transition-colors duration-700"></div>
        <img src="https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?w=1600&q=80" class="absolute inset-0 w-full h-full object-cover object-center" alt="Fondo del Evento">
        <div class="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/80 to-transparent dark:from-black dark:via-black/80 z-20"></div>
        
        <div class="relative z-30 container mx-auto px-4 md:px-8 lg:px-12 max-w-7xl flex flex-col items-center md:items-start w-full mt-auto">
            
            <!-- TABS INTERACTIVOS DE EVENTOS DENTRO DEL CONTENEDOR HERO -->
            <div class="w-full mb-12 hidden md:block relative">
                <div class="flex items-center gap-3 mb-6 ml-2">
                    <span class="material-symbols-outlined text-emerald-400 text-[24px] animate-pulse drop-shadow-[0_0_10px_rgba(52,211,153,0.8)]">new_releases</span>
                    <p class="text-xs font-black text-white uppercase tracking-widest leading-none drop-shadow-md">EVENTOS DEL PROGRAMA (Selecciona un evento)</p>
                </div>
                <div class="flex gap-6 overflow-x-auto pb-8 pt-2 scrollbar-hide snap-x">
                    <button v-for="evento in eventosActivos" :key="`tab-${evento.id}`" @click="seleccionarEvento(evento)" 
                            class="flex-shrink-0 flex items-center gap-6 px-8 py-6 rounded-[2rem] transition-all duration-500 border-2 group text-left min-w-[360px] max-w-[420px] snap-center relative overflow-hidden"
                            :class="eventoSeleccionado.id === evento.id 
                                ? 'bg-white/10 backdrop-blur-xl border-emerald-400/50 shadow-[0_15px_40px_-10px_rgba(16,185,129,0.3)] translate-y-[-8px] scale-[1.02]' 
                                : 'bg-black/50 backdrop-blur-md border-white/5 hover:bg-white/10 hover:border-white/20 hover:shadow-xl hover:translate-y-[-4px]'">
                        
                        <!-- Fondo animado sutil para el seleccionado -->
                        <div v-if="eventoSeleccionado.id === evento.id" class="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent z-0"></div>

                        <div class="w-16 h-16 rounded-full flex items-center justify-center shrink-0 transition-transform duration-500 relative z-10" :class="[evento.color, eventoSeleccionado.id === evento.id ? 'scale-110 shadow-[0_0_25px_inherit]' : 'opacity-70 group-hover:opacity-100 shadow-lg']">
                            <span class="material-symbols-outlined text-white text-[32px] drop-shadow-md" style="font-variation-settings: 'FILL' 1;">{{ evento.icon }}</span>
                        </div>
                        <div class="overflow-hidden flex-1 relative z-10">
                            <p class="text-[10px] font-black uppercase tracking-[0.2em] mb-2 transition-colors" :class="eventoSeleccionado.id === evento.id ? 'text-emerald-400' : 'text-slate-400'">Gestión {{ evento.gestion }}</p>
                            <h4 class="text-base font-black text-white leading-tight transition-all" :class="eventoSeleccionado.id === evento.id ? 'drop-shadow-md text-emerald-50' : 'text-white/80'">{{ evento.title }}</h4>
                        </div>
                    </button>
                </div>
            </div>
            
            <!-- VERSION MÓVIL DEL SELECTOR -->
            <div class="w-full mb-10 md:hidden flex flex-col gap-3">
                <div class="flex items-center gap-2 mb-2 pl-1">
                  <span class="material-symbols-outlined text-emerald-400 text-[18px] animate-pulse">new_releases</span>
                  <p class="text-[11px] font-black text-white uppercase tracking-widest leading-none drop-shadow-md">Selecciona un Evento:</p>
                </div>
                <button v-for="evento in eventosActivos" :key="`tab-mob-${evento.id}`" @click="seleccionarEvento(evento)" 
                        class="w-full flex items-center justify-between px-5 py-4 rounded-2xl border-2 backdrop-blur-md transition-all text-left"
                        :class="eventoSeleccionado.id === evento.id ? 'bg-emerald-500/20 border-emerald-400/50 text-white shadow-[0_10px_30px_-10px_rgba(16,185,129,0.3)] scale-[1.02]' : 'bg-black/60 border-white/5 text-slate-400 hover:bg-white/5'">
                    <div class="flex items-center gap-4 truncate">
                      <div class="w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-lg" :class="[evento.color, eventoSeleccionado.id === evento.id ? 'scale-110 shadow-[0_0_15px_inherit]' : 'opacity-60']">
                          <span class="material-symbols-outlined text-white text-[20px]" style="font-variation-settings: 'FILL' 1;">{{ evento.icon }}</span>
                      </div>
                      <span class="text-sm font-black truncate pr-2" :class="{'text-emerald-50 drop-shadow-md': eventoSeleccionado.id === evento.id}">{{ evento.title }}</span>
                    </div>
                    <span v-if="eventoSeleccionado.id === evento.id" class="material-symbols-outlined text-emerald-400 text-[24px] shrink-0 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]">check_circle</span>
                </button>
            </div>

            <div class="flex flex-wrap flex-col sm:flex-row items-center justify-center md:justify-start gap-3 mb-6">
              <span class="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-500 text-white border border-emerald-400/30 text-[10px] md:text-xs font-black uppercase tracking-widest rounded-lg shadow-lg shadow-emerald-500/20">
                <span class="material-symbols-outlined text-[16px]">public</span> Evento Internacional
              </span>
              <span class="inline-flex items-center gap-1.5 px-4 py-2 bg-umsa-blue border border-blue-400/30 text-white text-[10px] md:text-xs font-black uppercase tracking-widest rounded-lg shadow-lg shadow-umsa-blue/40">
                <span class="material-symbols-outlined text-[16px]">workspace_premium</span> 3ra Versión 2025
              </span>
            </div>
            
            <h1 :key="`title-${eventoSeleccionado.id}`" class="text-5xl md:text-7xl lg:text-8xl font-black text-white leading-none uppercase tracking-tighter mb-4 drop-shadow-2xl animate-in fade-in slide-in-from-bottom-5 duration-700">
              {{ eventoSeleccionado.title }}
            </h1>
            
            <h3 class="text-xl md:text-3xl font-black text-slate-300 uppercase tracking-widest mb-6 font-serif">
              Universidad Mayor de San Andrés
            </h3>
            
            <div :key="`tags-${eventoSeleccionado.id}`" class="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-3 mb-8 hidden md:flex animate-in fade-in slide-in-from-bottom-5 duration-700 delay-100">
              <span class="px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-xl text-xs md:text-sm font-bold flex items-center gap-2 shadow-inner">
                <span class="material-symbols-outlined text-[18px] text-emerald-400">calendar_month</span> {{ eventoSeleccionado.dateShort }}
              </span>
              <span class="px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-xl text-xs md:text-sm font-bold flex items-center gap-2 shadow-inner">
                <span class="material-symbols-outlined text-[18px] text-blue-400">{{ eventoSeleccionado.icon }}</span> {{ eventoSeleccionado.subtitle }}
              </span>
            </div>
            
            <p :key="`desc-${eventoSeleccionado.id}`" class="text-slate-200 dark:text-gray-300 text-base md:text-xl mb-10 leading-relaxed drop-shadow-md font-medium max-w-3xl animate-in fade-in slide-in-from-bottom-5 duration-700 delay-200">
               {{ eventoSeleccionado.description }}
            </p>
            
            <div class="flex flex-col sm:flex-row gap-4 items-center justify-center md:justify-start">
                <button @click="$router.push('/login')" class="bg-emerald-500 text-white hover:bg-emerald-600 px-8 py-4 rounded-xl font-black text-xs md:text-sm uppercase tracking-widest transition-all shadow-xl hover:shadow-2xl hover:shadow-emerald-500/40 hover:-translate-y-1 border border-emerald-400 flex items-center justify-center gap-2">
                    <span class="material-symbols-outlined text-[20px]">login</span>
                    Ingresar al Portal
                </button>
                <a href="#informacion" class="bg-white/10 backdrop-blur-md text-white hover:bg-white/20 px-8 py-4 rounded-xl font-black text-xs md:text-sm uppercase tracking-widest transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 border border-white/30 flex items-center justify-center gap-2 mt-4 md:mt-0">
                    <span class="material-symbols-outlined text-[20px]">expand_circle_down</span>
                    Detalles del Evento
                </a>
            </div>
        </div>
    </section>

    <!-- SECCIÓN DE INFORMACIÓN -->
    <section id="informacion" class="py-24 bg-white dark:bg-black transition-colors duration-300 -mt-2">
      <div class="container mx-auto px-4 md:px-8 lg:px-12 max-w-7xl">
        <div class="flex flex-col md:flex-row items-center md:items-start gap-12">
          
          <div class="md:w-1/3 flex-shrink-0 animate-in fade-in zoom-in-75 duration-1000">
             <img src="https://upload.wikimedia.org/wikipedia/commons/a/af/Escudo_de_la_Universidad_Mayor_de_San_Andr%C3%A9s.png" class="w-full max-w-xs object-contain opacity-10 dark:opacity-20 filter grayscale dark:invert mx-auto md:mx-0" alt="Logo UMSA">
          </div>

          <div class="md:w-2/3 text-left">
            <h2 class="text-3xl md:text-5xl font-black text-umsa-blue dark:text-white mb-8 pb-4 border-b-4 border-umsa-blue inline-block uppercase italic tracking-tighter">Sobre el Evento</h2>
            <h3 class="text-xl font-bold text-slate-500 -mt-6 mb-8 uppercase tracking-widest">{{ eventoSeleccionado.title }}</h3>
            
            <div class="text-slate-600 dark:text-gray-400 text-lg md:text-xl leading-relaxed space-y-6 font-medium">
              <p>
                Esta versión establece una red de colaboración que vincula a universidades bolivianas con sus homólogas latinoamericanas e internacionales, 
                centrándose este año en la <strong class="text-emerald-600 dark:text-emerald-500 uppercase tracking-widest">"Agroindustria y Ciencias Ambientales"</strong> para abordar los desafíos de seguridad alimentaria en Bolivia y la región.
              </p>
              <p>
                Basado en el éxito de las escuelas prácticas de 2023 y 2024, esta iniciativa, liderada por <strong class="text-umsa-blue dark:text-white">TYAN-TWAS</strong>, prioriza el fortalecimiento de la colaboración científica 
                para combatir la pobreza y promover el desarrollo sostenible a largo plazo, en consonancia con la misión de la UNESCO.
              </p>
              <div class="bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-950/50 border-l-4 border-umsa-blue p-6 md:p-8 rounded-r-2xl mt-12 shadow-sm dark:shadow-none">
                <p class="italic text-blue-800 dark:text-blue-300 font-bold text-xl md:text-2xl leading-none">
                  "Un encuentro global para la ciencia, oportunidad única para conectar, innovar y transformar el agroambiente."
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- SECCIÓN DEL CRONOGRAMA -->
    <section class="py-24 bg-slate-50 dark:bg-gray-950 transition-colors duration-300 w-full">
      <div class="container mx-auto px-4 md:px-8 lg:px-12 max-w-7xl">
        <div class="flex items-center gap-4 mb-2">
            <div class="h-1 w-12 bg-emerald-500 rounded-full"></div>
            <span class="text-emerald-600 dark:text-emerald-500 font-bold uppercase tracking-widest text-xs md:text-sm">Actividades Programadas</span>
        </div>
        <div class="flex items-end justify-between mb-16">
          <h2 class="text-4xl md:text-6xl font-black text-primary-dark dark:text-white uppercase tracking-tighter italic">Cronograma {{ eventoSeleccionado.gestion }}</h2>
          <p class="text-base md:text-lg text-umsa-blue font-bold uppercase tracking-widest hidden md:block bg-blue-50 dark:bg-umsa-blue/10 px-4 py-2 rounded-xl border border-blue-100 dark:border-umsa-blue/30">{{ eventoSeleccionado.dateShort }}</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 max-w-[1400px] mx-auto">
          <div v-for="day in days" :key="day.day" class="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-3xl shadow-lg hover:-translate-y-4 hover:shadow-2xl hover:shadow-umsa-blue/10 dark:hover:shadow-black/50 hover:border-umsa-blue/30 transition-all duration-300 overflow-hidden flex flex-col group h-full">
            <div class="bg-slate-100 dark:bg-gray-900 text-primary-dark dark:text-white p-8 relative overflow-hidden group-hover:bg-gradient-to-br group-hover:from-slate-100 group-hover:to-slate-200 dark:group-hover:from-gray-800 dark:group-hover:to-gray-900 transition-colors">
               <div class="text-8xl font-black opacity-5 dark:opacity-5 absolute -top-4 -right-4 text-umsa-blue group-hover:opacity-10 transition-all">{{ day.day }}</div>
               <span class="block text-6xl font-black text-umsa-blue dark:text-blue-200 group-hover:text-blue-800 dark:group-hover:text-white relative z-10 font-serif leading-none mb-2">{{ day.day }}</span>
               <span class="block text-xs uppercase tracking-widest font-bold text-slate-400 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 relative z-10">{{ day.name }}</span>
            </div>
            
            <div class="flex-1 p-8 space-y-6 pt-4 border-t border-slate-100 dark:border-gray-800 bg-white/50 dark:bg-black/20 group-hover:bg-transparent transition-colors">
              <div v-for="(evt, idx) in day.events" :key="idx" class="relative pl-6 before:content-[''] before:absolute before:left-0 before:top-1.5 before:w-2 before:h-2 before:bg-emerald-500 before:rounded-full after:content-[''] after:absolute after:left-[3px] after:top-3.5 after:bottom-[-20px] after:w-[2px] after:bg-slate-200 dark:after:bg-gray-800 last:after:hidden">
                 <div class="flex flex-col gap-1 -mt-1">
                    <span class="text-umsa-blue text-[10px] uppercase font-black tracking-widest">{{ evt.time }}</span>
                    <span class="text-sm font-bold text-slate-600 dark:text-gray-300 group-hover:text-primary-dark dark:group-hover:text-white leading-tight uppercase">{{ evt.title }}</span>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- SECCIÓN DE EXPOSITORES -->
    <section id="organizacion" class="py-24 bg-white dark:bg-black transition-colors duration-300 border-t border-slate-100 dark:border-gray-800 w-full">
      <div class="container mx-auto px-4 md:px-8 lg:px-12 max-w-7xl">
        <div class="flex items-center justify-center gap-4 mb-2">
            <span class="text-umsa-blue font-black uppercase tracking-widest text-xs md:text-sm">Red Especializada TWAS</span>
        </div>
        <h2 class="text-4xl md:text-6xl font-black text-center text-primary-dark dark:text-white mb-20 uppercase tracking-tighter italic"><span class="text-umsa-blue dark:text-blue-400">Directorio</span> Expositor</h2>

        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 px-2">
          <div v-for="(spk, idx) in speakers" :key="idx" class="group bg-slate-50 dark:bg-black rounded-[2.5rem] border border-slate-200 dark:border-gray-800 overflow-hidden hover:border-emerald-500/50 hover:shadow-[0_0_40px_rgba(16,185,129,0.1)] transition-all duration-500 flex flex-col cursor-crosshair">
            <div class="aspect-[4/5] bg-slate-200 dark:bg-gray-900 relative overflow-hidden">
               <div class="absolute inset-0 bg-primary-dark/60 dark:bg-primary-dark/80 group-hover:bg-transparent transition-colors z-10 duration-700"></div>
               <div class="w-full h-full flex flex-col items-center justify-center bg-slate-100 dark:bg-gray-900 absolute inset-0">
                    <span class="material-symbols-outlined text-6xl text-slate-300 dark:text-gray-800 mb-2">face</span>
               </div>
               
               <img v-if="spk.img" :src="spk.img" class="w-full h-full object-cover absolute inset-0 filter grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-1000 z-0" onerror="this.style.display='none'" />
               
               <div class="absolute bottom-0 left-0 right-0 p-6 z-20 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 bg-gradient-to-t from-black via-black/80 to-transparent">
                  <span class="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/90 text-white border border-emerald-400/50 text-[9px] font-black uppercase tracking-widest rounded-lg backdrop-blur-md">
                     <span class="material-symbols-outlined text-[12px]">location_on</span> {{ spk.country }}
                  </span>
               </div>
            </div>
            
            <div class="p-6 md:p-8 flex-1 flex flex-col bg-white dark:bg-gray-900 relative">
               <h4 class="text-xl font-black text-primary-dark dark:text-white mb-4 leading-tight uppercase font-serif italic">{{ spk.name }}</h4>
               <p class="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed mt-auto tracking-wide group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors line-clamp-3">
                 "{{ spk.topic }}"
               </p>
               <!-- Linea decorativa card Netflix -->
               <div class="absolute left-0 bottom-0 top-0 w-1 bg-transparent group-hover:bg-umsa-blue transition-colors duration-500"></div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- SECCIÓN DE UBICACIÓN -->
    <section id="ubicacion" class="py-24 bg-slate-50 dark:bg-gray-950 transition-colors duration-300 border-t border-slate-100 dark:border-gray-900 w-full">
       <div class="container mx-auto px-4 md:px-8 lg:px-12 max-w-7xl">
          <div class="flex flex-col md:flex-row items-center justify-between mb-16 gap-8 px-4">
             <div>
                <h2 class="text-4xl md:text-6xl font-black text-primary-dark dark:text-white uppercase italic tracking-tighter">Campus del Evento</h2>
                <p class="text-sm font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-2">
                   <span class="material-symbols-outlined text-emerald-500">place</span> Centro de Informática, Cota Cota
                </p>
             </div>
             <div>
                <a href="https://maps.app.goo.gl/tB38x36pUK2t89tD8" target="_blank" class="px-6 py-3.5 bg-umsa-blue dark:bg-gray-900 hover:bg-primary-dark dark:hover:bg-gray-800 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-xl hover:-translate-y-1 border border-transparent dark:border-gray-700 flex items-center gap-2">
                    Abrir en Maps <span class="material-symbols-outlined text-[16px]">open_in_new</span>
                </a>
             </div>
          </div>
          
          <div class="w-full bg-white dark:bg-gray-900 p-3 md:p-4 rounded-[2rem] md:rounded-[3rem] shadow-2xl border border-slate-200 dark:border-gray-800 overflow-hidden relative group">
             <!-- Google Maps Embed -->
             <iframe 
               src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3824.964177264858!2d-68.06456762391062!3d-16.53856114138612!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x915f219717cb25a9%3A0x67db233157297349!2sFacultad%20de%20Ciencias%20Puras%20y%20Naturales%20-%20UMSA!5e0!3m2!1ses!2sbo!4v1709664448530!5m2!1ses!2sbo" 
               width="100%" 
               height="500" 
               style="border:0;" 
               allowfullscreen="true" 
               loading="lazy" 
               referrerpolicy="no-referrer-when-downgrade"
               class="rounded-[1.5rem] md:rounded-[2.5rem] filter md:grayscale-[80%] dark:invert opacity-90 text-sm contrast-125 group-hover:grayscale-0 group-hover:invert-0 group-hover:contrast-100 transition-all duration-1000 w-full"
             ></iframe>
             <div class="absolute inset-0 pointer-events-none rounded-[2rem] md:rounded-[3rem] shadow-[inset_0_0_50px_rgba(0,0,0,0.1)] dark:shadow-[inset_0_0_50px_rgba(0,0,0,0.8)]"></div>
          </div>
       </div>
    </section>

  </main>
</template>

<style scoped>
html {
  scroll-behavior: smooth;
}
</style>