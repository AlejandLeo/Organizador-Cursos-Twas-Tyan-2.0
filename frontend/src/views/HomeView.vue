<script setup lang="ts">
import { ref, onMounted } from 'vue';
import api from '@/services/api';
import { useEventoStore } from '@/stores/eventoStore';

const eventoStore = useEventoStore();

const eventosActivos = ref<any[]>([]);
const ponentesDB = ref<any[]>([]);
const eventoSeleccionado = ref<any>(null);
const isDropdownOpen = ref(false);
const icons = ['school', 'memory', 'public', 'biotech', 'eco', 'science'];
const colors = ['bg-emerald-500', 'bg-umsa-gold', 'bg-blue-500', 'bg-purple-500', 'bg-orange-500', 'bg-teal-500'];

const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return `${date.getDate()} de ${monthNames[date.getMonth()]}`;
};

const getStatusColor = (status: string) => {
  if (status === 'Inscripciones Abiertas' || status === 'Activo') return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800';
  if (status === 'Próximamente' || status === 'Planificación') return 'text-umsa-blue bg-blue-50 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-800';
  return 'text-slate-500 bg-slate-100 dark:bg-gray-800 dark:text-gray-400 border border-slate-200 dark:border-gray-700';
};

const cargarEventos = async () => {
    try {
        const response = await api.get('/eventos');
        const eventosDB = Array.isArray(response.data) ? response.data : (response.data.data || []);
        
        // Filtramos solo Activos (1) y Planificación (2) para el home
        const filtrados = eventosDB.filter((e: any) => e.estado === 1 || e.estado === 2);
        
        // Procesamos los eventos y cargamos sus ponentes reales
        const eventosProcesados = await Promise.all(filtrados.map(async (ev: any, index: number) => {
            let ponentesArr: any[] = [];
            
            try {
                // LLAMADA AUTOMÁTICA: Traer ponentes de las actividades del evento
                const resP = await api.get(`/eventos/${ev.id}/imparticiones`);
                const dataP = Array.isArray(resP.data) ? resP.data : (resP.data.data || []);
                
                ponentesArr = dataP.map((p: any) => ({
                    id: p.id,
                    name: `${p.grado_abreviacion} ${p.nombres} ${p.primer_apellido}`.trim(),
                    topic: p.profesion || 'Expositor',
                    country: p.email, // Podríamos usar país si existiera en el modelo
                    img: p.foto || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=800&q=80'
                }));
            } catch (e) {
                console.error(`Error cargando ponentes para evento ${ev.id}`, e);
            }

            return {
                id: ev.id,
                title: ev.nombre,
                subtitle: ev.ubicacion || 'Universidad Mayor de San Andrés', 
                status: ev.estado === 1 ? 'Activo' : 'Planificación',
                gestion: ev.gestion || 'Actual',
                date: `${ev.fecha_inicio || 'TBD'} - ${ev.fecha_fin || 'TBD'}`,
                dateShort: formatDate(ev.fecha_inicio) || 'Fechas por definir',
                description: (ev.descripcion || 'Sin descripción').split('\n[PONENTES_METADATA]:')[0],
                version: ev.version || '',
                color: colors[index % colors.length],
                icon: icons[index % icons.length],
                imagen_fondo: ev.imagen_fondo || 'https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?w=1600&q=80',
                logo: ev.imagen_portada || null,
                google_maps_link: ev.google_maps_link || null,
                direccion: ev.direccion || null,
                sobre_evento_1: ev.sobre_evento_1 || null,
                frase_destacada: ev.frase_destacada || null,
                sigla: ev.sigla || 'TYAN',
                color_principal: ev.color_principal || '#0070b4',
                institucion_badge: ev.institucion_badge || 'Evento Oficial OEA/TYAN',
                link_facebook: ev.link_facebook || null,
                link_web: ev.link_web || null,
                cronograma: (() => {
                    if (!ev.cronograma) return null;
                    try { 
                        return typeof ev.cronograma === 'string' ? JSON.parse(ev.cronograma) : ev.cronograma; 
                    } catch(e) { 
                        console.error("Error parsing cronograma JSON", e);
                        return null; 
                    } 
                })(),
                ponentes: ponentesArr
            };
        }));

        eventosActivos.value = eventosProcesados;

        // Set default to first active event
        if (eventosActivos.value.length > 0) {
            eventoSeleccionado.value = eventosActivos.value[0];
            // Sincronizar con el store global si no hay uno seleccionado
            if (!eventoStore.selectedEventoId) {
                eventoStore.setVersion(eventoSeleccionado.value.id);
            }
        } else {
            eventoSeleccionado.value = {
                title: 'Bienvenidos al Portal TYAN',
                subtitle: 'Universidad Mayor de San Andrés',
                dateShort: 'Próximamente',
                description: 'Actualmente no hay eventos programados. Manténgase atento para futuras actualizaciones y convocatorias en la red académica.',
                imagen_fondo: 'https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?w=1600&q=80',
                google_maps_link: '<iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15301.761763784013!2d-68.1332029785816!3d-16.505086782352123!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x915edf0a00000001%3A0x6420546944e8574d!2sUniversidad%20Mayor%20de%20San%20Andr%C3%A9s!5e0!3m2!1ses!2sbo!4v1713670000000!5m2!1ses!2sbo" width="600" height="450" style="border:0;" allowfullscreen loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>',
                direccion: 'Av. Villazón Nro 1995, Plaza del Bicentenario - La Paz',
                ponentes: []
            };
        }
    } catch(err) {
        console.error("Error al cargar eventos en Home", err);
    }
};

onMounted(() => {
    cargarEventos();
});

const seleccionarEvento = (evento: any) => {
  eventoSeleccionado.value = evento;
  eventoStore.setVersion(evento.id); // Sincronizar con el resto de la app (logo, contacto, etc)
  isDropdownOpen.value = false;
};

const abrirMapa = (url: string) => {
  if (url) window.open(url, '_blank');
};


</script>

<template>
  <main class="font-sans text-gray-800 dark:text-gray-200 transition-colors duration-300">
    <!-- SECCIÓN PRINCIPAL (HERO) -->
    <section id="inicio" class="relative w-full min-h-[95vh] group flex flex-col justify-end text-left pt-36 pb-20 overflow-hidden">
        <div class="absolute inset-0 bg-primary-dark/40 dark:bg-black/60 z-10 transition-colors duration-700"></div>
        <img :src="eventoSeleccionado?.imagen_fondo || 'https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?w=1600&q=80'" class="absolute inset-0 w-full h-full object-cover object-center transition-all duration-[1.5s]" alt="Fondo del Evento">
        <div class="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/80 to-transparent dark:from-black dark:via-black/80 z-20"></div>

        <div class="relative z-30 w-full px-6 md:px-16 lg:px-24 max-w-[2500px] mx-auto flex flex-col items-start mt-auto">
            <!-- ROW 1: SELECTOR DE EVENTO Y BADGE OFICIAL (Lineales Izquierda) -->
            <div class="flex flex-col md:flex-row items-center justify-start gap-4 mb-8 w-full md:w-auto relative z-50 animate-in fade-in slide-in-from-bottom-2 duration-500">
               <!-- Elegante Selector de Eventos -->
               <div class="relative w-full sm:w-auto min-w-[300px]">
                   <button @click="isDropdownOpen = !isDropdownOpen" class="w-full flex items-center justify-between gap-4 px-5 py-3.5 bg-black/40 backdrop-blur-xl border border-white/10 hover:border-emerald-400/50 rounded-2xl text-white shadow-2xl transition-all group">
                       <div class="flex items-center gap-3">
                           <div :style="{ backgroundColor: eventoSeleccionado?.color_principal || '#10b981' }" class="w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-lg">
                              <span class="material-symbols-outlined text-white text-[16px] group-hover:animate-pulse">event_available</span>
                           </div>
                           <div class="text-left overflow-hidden">
                               <p :style="{ color: eventoSeleccionado?.color_principal || '#10b981' }" class="text-[8px] font-black uppercase tracking-widest mb-0.5">Gestión Actual</p>
                               <p class="text-xs font-black truncate max-w-[200px]">{{ eventoSeleccionado?.title || 'Seleccionar Evento' }}</p>
                           </div>
                       </div>
                       <span class="material-symbols-outlined transition-transform duration-300 text-[18px]" :class="isDropdownOpen ? 'rotate-180 text-emerald-400' : 'text-slate-400'">expand_more</span>
                   </button>
                   
                   <transition enter-active-class="transition duration-300 ease-out" enter-from-class="transform scale-95 opacity-0 -translate-y-2" enter-to-class="transform scale-100 opacity-100 translate-y-0" leave-active-class="transition duration-200 ease-in" leave-from-class="transform scale-100 opacity-100 translate-y-0" leave-to-class="transform scale-95 opacity-0 -translate-y-2">
                       <div v-if="isDropdownOpen" class="absolute top-[110%] left-0 w-full sm:w-[350px] bg-black/80 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden z-[100]">
                           <div class="max-h-[350px] overflow-y-auto thin-scrollbar p-3 group/list">
                               <button v-for="evento in eventosActivos" :key="`drop-${evento.id}`" @click="seleccionarEvento(evento)" class="w-full text-left p-3 rounded-xl flex items-center gap-4 transition-all hover:bg-white/10 mb-1 border" :class="eventoSeleccionado?.id === evento.id ? 'bg-emerald-500/20 border-emerald-500/30' : 'border-transparent'">
                                   <div class="w-10 h-10 rounded-full flex flex-shrink-0 items-center justify-center transition-all bg-opacity-80" :class="[evento.color, eventoSeleccionado?.id === evento.id ? 'scale-110 shadow-lg shadow-white/10 text-white' : 'text-white/80']">
                                       <span class="material-symbols-outlined text-[20px]">{{ evento.icon }}</span>
                                   </div>
                                   <div class="min-w-0 flex-1">
                                       <p class="text-[9px] font-black uppercase tracking-widest mb-0.5 transition-colors" :class="eventoSeleccionado?.id === evento.id ? 'text-emerald-400' : 'text-emerald-500/70'">Gestión {{ evento.gestion }}</p>
                                       <p class="text-[13px] font-black text-white leading-tight truncate">{{ evento.title }}</p>
                                   </div>
                                   <span v-if="eventoSeleccionado?.id === evento.id" class="material-symbols-outlined text-emerald-400 shrink-0 text-[18px]">check_circle</span>
                                </button>
                           </div>
                       </div>
                   </transition>
               </div>
               
               <!-- Etiqueta Oficial Dinámica -->
                <span :style="{ backgroundColor: eventoSeleccionado?.color_principal || '#10b981' }" class="inline-flex items-center w-full sm:w-auto h-[56px] px-6 text-white border border-white/20 text-[10px] md:text-sm font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-black/20 animate-in slide-in-from-right-4 duration-700">
                  <span class="material-symbols-outlined text-[18px] mr-2">public</span> {{ eventoSeleccionado?.institucion_badge || 'Evento Oficial OEA/TYAN' }}
                </span>
            </div>
            
            <!-- ROW 2: TÍTULO PRINCIPAL -->
            <h1 :key="`title-${eventoSeleccionado?.id}`" class="text-5xl md:text-6xl lg:text-[5rem] xl:text-[6.5rem] font-black text-white leading-[0.95] uppercase tracking-tighter mb-4 drop-shadow-2xl animate-in fade-in slide-in-from-bottom-5 duration-700 max-w-[95%] xl:max-w-[85%]">
              {{ eventoSeleccionado?.title }}
            </h1>
            
            <!-- ROW 3: SUBTÍTULO -->
            <h3 :key="`subtitle-${eventoSeleccionado?.id}`" class="text-xl md:text-3xl lg:text-4xl font-black text-slate-300 uppercase tracking-widest mb-6 font-serif max-w-[95%]">
               {{ eventoSeleccionado?.subtitle || 'Universidad Mayor de San Andrés' }}
            </h3>
            
            <!-- ROW 4: BADGES ADICIONALES (Versión, Fechas, Ubicación) -->
            <div :key="`tags-${eventoSeleccionado?.id}`" class="flex flex-row flex-wrap items-center justify-start gap-3 mb-6 relative z-40 animate-in fade-in slide-in-from-bottom-5 duration-700 delay-100">
               <span v-if="eventoSeleccionado?.version" :style="{ backgroundColor: eventoSeleccionado?.color_principal || '#0070b4' }" class="inline-flex items-center gap-1.5 px-4 py-2 text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-black/20">
                 <span class="material-symbols-outlined text-[16px]">workspace_premium</span> {{ eventoSeleccionado?.version }}
               </span>
               <span class="px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-inner uppercase tracking-widest">
                 <span class="material-symbols-outlined text-[18px] text-emerald-400">calendar_month</span> {{ eventoSeleccionado?.dateShort }}
               </span>
               <span class="px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-inner uppercase tracking-widest">
                 <span class="material-symbols-outlined text-[18px] text-emerald-400">location_on</span> {{ eventoSeleccionado?.direccion || 'La Paz, Bolivia' }}
               </span>
            </div>
            
            <!-- ROW 5: DESCRIPCIÓN -->
            <p :key="`desc-${eventoSeleccionado?.id}`" class="text-base md:text-xl text-slate-200 font-medium max-w-4xl leading-relaxed mb-10 drop-shadow-md animate-in fade-in slide-in-from-bottom-5 duration-700 delay-200">
               {{ eventoSeleccionado?.description || 'Un evento de talla mundial donde la ciencia latinoamericana converge en La Paz para discutir temas de actualidad, desarrollo y sostenibilidad, enfocados en el progreso de la región y sus desafíos futuros.' }}
            </p>
            
            <!-- ROW 6: BOTONES DE ACCIÓN -->
            <div class="flex flex-col sm:flex-row flex-wrap items-center justify-start gap-4 w-full relative z-40 animate-in fade-in slide-in-from-bottom-5 duration-700 delay-300">
                <button @click="$router.push('/login')" :style="{ backgroundColor: eventoSeleccionado?.color_principal || '#10b981' }" class="w-full sm:w-auto text-white px-8 py-4 rounded-xl font-black text-xs md:text-sm uppercase tracking-widest transition-all shadow-xl hover:shadow-2xl hover:shadow-black/40 hover:-translate-y-1 flex items-center justify-center gap-2 border border-white/20">
                    <span class="material-symbols-outlined text-[20px]">login</span>
                    Ingresar al Portal
                </button>
                <a href="#informacion" class="w-full sm:w-auto bg-white/10 backdrop-blur-md text-white hover:bg-white/20 px-8 py-4 rounded-xl font-black text-xs md:text-sm uppercase tracking-widest transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 border border-white/30 flex items-center justify-center gap-2">
                    <span class="material-symbols-outlined text-[20px]">expand_circle_down</span>
                    Detalles del Evento
                </a>
            </div>
        </div>
    </section>

    <!-- SECCIÓN DE INFORMACIÓN -->
    <section id="informacion" class="py-24 bg-white dark:bg-black transition-colors duration-300 -mt-2">
      <div class="w-full px-6 md:px-16 lg:px-24 max-w-[2500px] mx-auto">
        <div class="flex flex-col md:flex-row items-center md:items-start gap-12">
          
          <div class="md:w-1/3 flex-shrink-0 space-y-6">
             <div class="bg-blue-50/50 dark:bg-blue-950/20 p-8 rounded-[2rem] border border-blue-100 dark:border-blue-900/40 relative overflow-hidden group">
                <div class="absolute -right-4 -top-4 text-umsa-blue/10 rotate-12 group-hover:scale-110 transition-transform duration-700">
                    <span class="material-symbols-outlined text-[100px]">public</span>
                </div>
                <h4 class="text-xs font-black text-umsa-blue mb-4 uppercase tracking-widest flex items-center gap-2">
                    <span class="w-2 h-2 bg-umsa-gold rounded-full"></span> Acerca de TWAS
                </h4>
                <p class="text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed italic">
                    The World Academy of Sciences (TWAS) trabaja para promover el avance científico en los países en desarrollo, fomentando la excelencia a través de la cooperación sur-sur.
                </p>
                <div class="mt-6 flex items-center gap-4">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/a/af/Escudo_de_la_Universidad_Mayor_de_San_Andr%C3%A9s.png" class="h-12 grayscale opacity-50 contrast-125 dark:invert" alt="Logo UMSA">
                    <div class="h-8 w-px bg-slate-200 dark:bg-slate-700"></div>
                    <span class="text-[10px] uppercase font-black tracking-tighter text-slate-400">Co-Organizador Oficial</span>
                </div>
             </div>

             <div class="bg-emerald-50/50 dark:bg-emerald-950/20 p-8 rounded-[2rem] border border-emerald-100 dark:border-emerald-900/40 relative overflow-hidden group">
                <h4 class="text-xs font-black text-emerald-600 mb-4 uppercase tracking-widest flex items-center gap-2">
                    <span class="w-2 h-2 bg-emerald-500 rounded-full"></span> Red TYAN
                </h4>
                <p class="text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
                    The TWAS Young Affiliates Network (TYAN) conecta a jóvenes científicos de excelencia, facilitando el intercambio de conocimientos y fortaleciendo la investigación científica global.
                </p>
             </div>
          </div>

          <div class="md:w-2/3 text-left">
            <h2 class="text-3xl md:text-5xl font-black text-umsa-blue dark:text-white mb-8 pb-4 border-b-4 border-umsa-blue inline-block uppercase italic tracking-tighter">Sobre el Evento</h2>
            <h3 class="text-xl font-bold text-slate-500 -mt-6 mb-8 uppercase tracking-widest">{{ eventoSeleccionado?.title }}</h3>
            
            <div class="text-slate-600 dark:text-gray-400 text-lg md:text-xl leading-relaxed space-y-6 font-medium">
              <p v-if="eventoSeleccionado?.sobre_evento_1" v-html="eventoSeleccionado.sobre_evento_1"></p>
              <p v-if="eventoSeleccionado?.sobre_evento_2" v-html="eventoSeleccionado.sobre_evento_2"></p>
              <div v-if="eventoSeleccionado?.frase_destacada" class="bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-950/50 border-l-4 border-umsa-blue p-6 md:p-8 rounded-r-2xl mt-12 shadow-sm dark:shadow-none">
                <p class="italic text-blue-800 dark:text-blue-300 font-bold text-xl md:text-2xl leading-none">
                  "{{ eventoSeleccionado.frase_destacada }}"
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- SECCIÓN DEL CRONOGRAMA -->
    <section class="py-24 bg-slate-50 dark:bg-gray-950 transition-colors duration-300 w-full">
      <div class="w-full px-6 md:px-16 lg:px-24 max-w-[2500px] mx-auto">
        <div class="flex items-center gap-4 mb-2">
            <div class="h-1 w-12 bg-emerald-500 rounded-full"></div>
            <span class="text-emerald-600 dark:text-emerald-500 font-bold uppercase tracking-widest text-xs md:text-sm">Actividades Programadas</span>
        </div>
        <div class="flex items-end justify-between mb-16">
          <h2 class="text-4xl md:text-6xl font-black text-primary-dark dark:text-white uppercase tracking-tighter italic">Cronograma {{ eventoSeleccionado?.gestion }}</h2>
          <p class="text-base md:text-lg text-umsa-blue font-bold uppercase tracking-widest hidden md:block bg-blue-50 dark:bg-umsa-blue/10 px-4 py-2 rounded-xl border border-blue-100 dark:border-umsa-blue/30">{{ eventoSeleccionado?.dateShort }}</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 max-w-[1400px] mx-auto">
          <div v-for="day in (eventoSeleccionado?.cronograma || [])" :key="day.day" class="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-3xl shadow-lg hover:-translate-y-4 hover:shadow-2xl hover:shadow-umsa-blue/10 dark:hover:shadow-black/50 hover:border-umsa-blue/30 transition-all duration-300 overflow-hidden flex flex-col group h-full">
            <div class="bg-slate-100 dark:bg-gray-900 text-primary-dark dark:text-white p-8 relative overflow-hidden group-hover:bg-gradient-to-br group-hover:from-slate-100 group-hover:to-slate-200 dark:group-hover:from-gray-800 dark:group-hover:to-gray-900 transition-colors">
               <div class="text-8xl font-black opacity-5 dark:opacity-5 absolute -top-4 -right-4 text-umsa-blue group-hover:opacity-10 transition-all">{{ day.day }}</div>
               <span class="block text-6xl font-black text-umsa-blue dark:text-blue-200 group-hover:text-blue-800 dark:group-hover:text-white relative z-10 font-serif leading-none mb-2">{{ day.day }}</span>
               <span class="block text-xs uppercase tracking-widest font-bold text-slate-400 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 relative z-10">{{ day.name }}</span>
               <span v-if="day.date" class="block text-[10px] font-black text-umsa-gold mt-1 uppercase tracking-widest relative z-10">{{ formatDate(day.date) }}</span>
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
          
          <!-- Estado vacío para cronograma -->
          <div v-if="!(eventoSeleccionado?.cronograma?.length)" class="col-span-full py-20 flex flex-col items-center justify-center text-center opacity-60">
             <div class="w-20 h-20 bg-slate-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
                <span class="material-symbols-outlined text-4xl text-slate-400">calendar_today</span>
             </div>
             <h3 class="text-xl font-black text-slate-500 uppercase tracking-widest">Cronograma en Preparación</h3>
             <p class="text-sm text-slate-400 mt-2 max-w-md">Próximamente se publicarán las actividades detalladas para este evento. Manténgase informado a través de nuestras redes académicas.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- SECCIÓN DE EXPOSITORES -->
    <section id="organizacion" class="py-24 bg-white dark:bg-black transition-colors duration-300 border-t border-slate-100 dark:border-gray-800 w-full">
      <div class="w-full px-6 md:px-16 lg:px-24 max-w-[2500px] mx-auto">
        <div class="flex items-center justify-center gap-4 mb-2">
            <span class="text-umsa-blue font-black uppercase tracking-widest text-xs md:text-sm">Red Especializada TWAS</span>
        </div>
        <h2 class="text-4xl md:text-6xl font-black text-center text-primary-dark dark:text-white mb-20 uppercase tracking-tighter italic"><span class="text-umsa-blue dark:text-blue-400">Directorio</span> Expositor</h2>

        <div v-if="eventoSeleccionado?.ponentes?.length" class="grid grid-cols-1 md:grid-cols-2 gap-0 overflow-hidden w-full lg:min-w-[600px] border-t border-slate-100 dark:border-gray-800">
            <div v-for="(spk, i) in eventoSeleccionado.ponentes" :key="i" class="group flex flex-col md:flex-row min-h-[300px] border-b border-r border-slate-100 dark:border-gray-800 relative cursor-pointer">
              
              <!-- Imagen de fondo Netflix style -->
              <div class="absolute inset-0 md:relative md:w-2/5 overflow-hidden">
                 <img v-if="spk.img" :src="spk.img" class="w-full h-full object-cover absolute inset-0 filter grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-1000 z-0" onerror="this.src='https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=800&q=80'; this.onerror=null" />
               
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
        <div v-else class="text-center py-10 opacity-70">
           <span class="material-symbols-outlined text-6xl text-slate-300 dark:text-gray-600 mb-4">groups</span>
           <p class="text-lg font-black text-slate-400 uppercase tracking-widest">Ponentes por confirmar</p>
        </div>
      </div>
    </section>

    <!-- SECCIÓN DE UBICACIÓN -->
    <section id="ubicacion" class="py-24 bg-slate-50 dark:bg-gray-950 transition-colors duration-300 border-t border-slate-100 dark:border-gray-900 w-full">
       <div class="w-full px-6 md:px-16 lg:px-24 max-w-[2500px] mx-auto">
          <div class="flex flex-col md:flex-row items-center justify-between mb-16 gap-8 px-4">
             <div>
                <h2 class="text-4xl md:text-6xl font-black text-primary-dark dark:text-white uppercase italic tracking-tighter">Campus del Evento</h2>
                <p class="text-sm font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-2">
                   <span class="material-symbols-outlined text-emerald-500">place</span> {{ eventoSeleccionado?.direccion || 'Av. Villazón Nro 1995, Plaza del Bicentenario - La Paz' }}
                </p>
             </div>
             <div>
                <a :href="eventoSeleccionado?.google_maps_link && !eventoSeleccionado.google_maps_link.startsWith('<') ? eventoSeleccionado.google_maps_link : 'https://maps.app.goo.gl/4fuD4Dd8XWc493VV6'" target="_blank" class="px-6 py-3.5 bg-umsa-blue dark:bg-gray-900 hover:bg-primary-dark dark:hover:bg-gray-800 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-xl hover:-translate-y-1 border border-transparent dark:border-gray-700 flex items-center gap-2">
                    Visualizar Ubicación <span class="material-symbols-outlined text-[16px]">open_in_new</span>
                </a>
             </div>
          </div>
          
          <div class="w-full bg-white dark:bg-gray-900 p-3 md:p-4 rounded-[2rem] md:rounded-[3rem] shadow-2xl border border-slate-200 dark:border-gray-800 overflow-hidden relative group">
             <!-- Google Maps Embed o Url directa procesada -->
             <div v-if="eventoSeleccionado?.google_maps_link?.startsWith('<')" v-html="eventoSeleccionado?.google_maps_link" class="google-maps-container w-full min-h-[300px] md:h-[500px] rounded-[1.5rem] md:rounded-[2.5rem] filter md:grayscale-[80%] dark:invert text-sm contrast-125 group-hover:grayscale-0 group-hover:invert-0 group-hover:contrast-100 transition-all duration-1000"></div>
             
             <!-- Iframe fallback fallback -->
             <iframe v-else-if="eventoSeleccionado?.google_maps_link?.includes('google.com/maps/embed')"
               :src="eventoSeleccionado.google_maps_link" 
               width="100%" 
               height="500" 
               style="border:0;" 
               allowfullscreen
               loading="lazy" 
               referrerpolicy="no-referrer-when-downgrade"
               class="rounded-[1.5rem] md:rounded-[2.5rem] filter md:grayscale-[80%] dark:invert opacity-90 text-sm contrast-125 group-hover:grayscale-0 group-hover:invert-0 group-hover:contrast-100 transition-all duration-1000 w-full"
             ></iframe>

             <!-- Imagen ilustrativa en caso de URL directa (No iframe embebible) -->
             <div v-else-if="eventoSeleccionado?.google_maps_link" class="w-full h-[400px] md:h-[500px] bg-slate-100 dark:bg-gray-800 flex items-center justify-center rounded-[1.5rem] md:rounded-[2.5rem] relative overflow-hidden group/link cursor-pointer" @click="abrirMapa(eventoSeleccionado.google_maps_link)">
                 <img src="https://images.unsplash.com/photo-1524661135-423995f22d0b?w=1200&q=80" class="absolute inset-0 w-full h-full object-cover filter grayscale contrast-125 opacity-40 group-hover/link:opacity-80 group-hover/link:grayscale-0 transition-all duration-1000" />
                 <div class="relative z-10 flex flex-col items-center bg-white/90 dark:bg-black/80 backdrop-blur-md px-10 py-8 rounded-[2rem] shadow-2xl group-hover/link:scale-105 transition-transform duration-500">
                     <span class="material-symbols-outlined text-6xl text-umsa-blue mb-4">map</span>
                     <h3 class="text-2xl font-black text-primary-dark dark:text-white uppercase">Abrir en Google Maps</h3>
                     <p class="text-xs font-bold text-slate-500 dark:text-gray-400 mt-2 uppercase tracking-widest text-center max-w-[200px] truncate">{{ eventoSeleccionado.google_maps_link }}</p>
                     
                     <a :href="eventoSeleccionado.google_maps_link" target="_blank" class="mt-6 px-6 py-2.5 bg-emerald-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl hover:-translate-y-1 block max-w-max" @click.stop>IR AL MAPA O SEDE <span class="material-symbols-outlined text-[14px] align-middle ml-1">open_in_new</span></a>
                 </div>
             </div>

             <!-- Fallback si NO hay link (Mapa UMSA por defecto) -->
             <div v-else class="google-maps-container w-full h-[500px] rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden">
                <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15301.761763784013!2d-68.1332029785816!3d-16.505086782352123!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x915edf0a00000001%3A0x6420546944e8574d!2sUniversidad%20Mayor%20de%20San%20Andr%C3%A9s!5e0!3m2!1ses!2sbo!4v1713670000000!5m2!1ses!2sbo" width="100%" height="500" style="border:0;" allowfullscreen loading="lazy" referrerpolicy="no-referrer-when-downgrade" class="filter md:grayscale-[80%] dark:invert text-sm contrast-125 hover:grayscale-0 hover:invert-0 transition-all duration-700"></iframe>
             </div>

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

:deep(.google-maps-container iframe) {
  width: 100% !important;
  height: 100% !important;
  border-radius: 1.5rem;
}
@media (min-width: 768px) {
  :deep(.google-maps-container iframe) {
    border-radius: 2.5rem;
  }
}
</style>