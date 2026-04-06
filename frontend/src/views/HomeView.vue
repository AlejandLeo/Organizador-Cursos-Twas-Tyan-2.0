<script setup lang="ts">
import { ref } from 'vue';

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
    <!-- HERO SECTION -->
    <section id="inicio" class="relative bg-gray-900 dark:bg-black text-white min-h-[80vh] flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-gray-900 dark:from-blue-950 dark:via-gray-900 dark:to-black">
      <!-- Overlay image placeholder -->
      <div class="absolute inset-0 bg-black opacity-50 dark:opacity-70 z-0"></div> 
      <!-- Content -->
      <div class="container mx-auto px-4 text-center relative z-10 py-20">
        <div class="bg-white/10 dark:bg-black/30 backdrop-blur-md rounded-2xl p-8 md:p-16 max-w-5xl mx-auto border border-white/20 shadow-2xl">
          <h1 class="text-4xl md:text-6xl font-bold mb-6 leading-tight tracking-tight drop-shadow-lg text-white">
            TYAN Hands-on Schools en Bolivia 2025<br>
            <span class="text-blue-300 dark:text-blue-400 block mt-2 text-2xl md:text-4xl font-light tracking-widest">3RA VERSIÓN</span>
          </h1>
          <h3 class="text-xl md:text-2xl font-semibold mb-8 text-gray-200 uppercase tracking-widest border-b border-white/30 pb-4 inline-block">
            Universidad Mayor de San Andrés
          </h3>
          <p class="text-lg md:text-xl text-gray-100 max-w-3xl mx-auto leading-relaxed font-light">
            La escuelas TYAN hands-on schools en Bolivia, da la bienvenida a expositores y estudiantes a la tercera versión, 
            auspiciada por la red de jóvenes afiliados (TYAN), La academia internacional de ciencias (TWAS) y la UMSA.
          </p>
          <div class="mt-10 flex flex-col sm:flex-row justify-center gap-4">
             <a href="#informacion" class="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-bold transition-all transform hover:scale-105 shadow-lg">Más Información</a>
             <a href="#organizacion" class="px-8 py-3 bg-transparent border-2 border-white dark:border-gray-400 hover:bg-white hover:text-blue-900 dark:hover:bg-gray-800 dark:hover:text-white text-white rounded-full font-bold transition-all">Expositores</a>
          </div>
        </div>
      </div>
    </section>

    <!-- INFO SECTION -->
    <section id="informacion" class="py-20 bg-white dark:bg-gray-900 transition-colors duration-300">
      <div class="container mx-auto px-4">
        <div class="max-w-4xl mx-auto">
          <h2 class="text-3xl font-bold text-center text-blue-900 dark:text-blue-400 mb-10 pb-4 border-b-4 border-blue-500 inline-block mx-auto">INFORMACIÓN</h2>
          
          <div class="text-gray-600 dark:text-gray-300 text-lg leading-relaxed text-justify space-y-6">
            <p>
              Esta versión establece una red de colaboración que vincula a universidades bolivianas con sus homólogas latinoamericanas e internacionales, 
              centrándose este año en la <strong class="text-blue-700 dark:text-blue-400">"Agroindustria y las ciencias ambientales"</strong> para abordar los desafíos de seguridad alimentaria en Bolivia y la región.
            </p>
            <p>
              Basado en el éxito de las escuelas prácticas de 2023 y 2024, esta iniciativa, liderada por TYAN-TWAS, prioriza el fortalecimiento de la colaboración científica 
              para combatir la pobreza y promover el desarrollo sostenible a largo plazo, en consonancia con la misión de la UNESCO.
            </p>
            <div class="bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-500 p-6 rounded-r-lg mt-8">
              <p class="italic text-blue-800 dark:text-blue-300 font-medium">
                Este encuentro representa una oportunidad única para conectar con investigadores y expertos de diversas áreas, compartir conocimientos y fortalecer la colaboración científica.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- SCHEDULE SECTION -->
    <section class="py-20 bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      <div class="container mx-auto px-4">
        <div class="text-center mb-16">
          <h2 class="text-3xl font-bold text-gray-800 dark:text-gray-100 uppercase tracking-wide">Cronograma de Actividades</h2>
          <p class="text-xl text-blue-600 dark:text-blue-400 font-medium mt-3">Semana del 6 al 10 de Octubre de 2025</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-5 gap-6 max-w-7xl mx-auto">
          <div v-for="day in days" :key="day.day" class="bg-white dark:bg-gray-800 rounded-xl shadow-md border dark:border-gray-700 hover:shadow-xl transition-all transform hover:-translate-y-2 duration-300 overflow-hidden flex flex-col h-full">
            <div class="bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-800 dark:to-blue-700 text-white p-6 text-center relative overflow-hidden">
               <div class="text-6xl font-black opacity-20 absolute -bottom-4 -right-4">{{ day.day }}</div>
               <span class="block text-5xl font-bold relative z-10">{{ day.day }}</span>
               <span class="block text-sm uppercase tracking-widest font-semibold mt-1 relative z-10">{{ day.name }}</span>
            </div>
            <div class="p-6 space-y-4 flex-1">
              <div v-for="(evt, idx) in day.events" :key="idx" class="flex items-start gap-3 border-l-2 border-blue-200 dark:border-blue-800 pl-3">
                 <div class="flex flex-col">
                    <span class="text-blue-800 dark:text-blue-400 text-xs font-bold">{{ evt.time }}</span>
                    <span class="text-sm font-medium text-gray-700 dark:text-gray-300 leading-tight">{{ evt.title }}</span>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- SPEAKERS SECTION -->
    <section id="organizacion" class="py-20 bg-white dark:bg-gray-900 transition-colors duration-300">
      <div class="container mx-auto px-4">
        <h2 class="text-3xl font-bold text-center text-blue-900 dark:text-blue-400 mb-6 uppercase">Plantel Expositor</h2>
        <p class="text-center text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-16 text-lg">
           Expertos internacionales y locales abordan el futuro de la agroindustria.
        </p>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          <div v-for="(spk, idx) in speakers" :key="idx" class="group bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-2xl transition-all duration-300">
            <div class="aspect-square bg-gray-100 dark:bg-gray-700 relative overflow-hidden">
                <!-- Placeholder when no image -->
               <div class="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-600 text-gray-400 dark:text-gray-500 group-hover:scale-110 transition-transform duration-700 rounded-t-2xl">
                    <span class="text-4xl text-gray-300 dark:text-gray-400"><i class="fas fa-user"></i></span>
                    <img v-if="spk.img" :src="spk.img" class="w-full h-full object-cover absolute inset-0" onerror="this.style.display='none'" />
               </div>
               <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <p class="text-white text-xs font-bold uppercase tracking-wider">{{ spk.country }}</p>
               </div>
            </div>
            <div class="p-6">
               <h4 class="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1 leading-tight">{{ spk.name }}</h4>
               <span class="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 text-xs rounded-full font-bold mb-3 mt-2">{{ spk.country }}</span>
               <p class="text-sm text-gray-600 dark:text-gray-400 leading-snug border-t pt-3 mt-1 border-gray-100 dark:border-gray-700">
                 {{ spk.topic }}
               </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- LOCATION SECTION -->
    <section id="ubicacion" class="py-20 bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
       <div class="container mx-auto px-4 text-center">
          <h2 class="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-12 uppercase">Ubicación del Evento</h2>
          <div class="max-w-6xl mx-auto bg-white dark:bg-gray-800 p-2 rounded-2xl shadow-xl overflow-hidden">
             <!-- Google Maps Embed -->
             <iframe 
               src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3824.964177264858!2d-68.06456762391062!3d-16.53856114138612!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x915f219717cb25a9%3A0x67db233157297349!2sFacultad%20de%20Ciencias%20Puras%20y%20Naturales%20-%20UMSA!5e0!3m2!1ses!2sbo!4v1709664448530!5m2!1ses!2sbo" 
               width="100%" 
               height="450" 
               style="border:0;" 
               allowfullscreen="true" 
               loading="lazy" 
               referrerpolicy="no-referrer-when-downgrade"
               class="rounded-xl filter grayscale dark:invert dark:contrast-90 hover:grayscale-0 dark:hover:invert-0 dark:hover:contrast-100 transition-all duration-500"
             ></iframe>
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