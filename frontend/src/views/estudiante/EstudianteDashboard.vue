<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import api, { imagenActividad, imagenEvento } from '@/services/api';

const router = useRouter();
const authStore = useAuthStore();
const nombreUsuario = computed(() => authStore.user?.persona?.nombres || 'Estudiante');
const loading = ref(true);
  // Estadísticas del dashboard
  const userStats = ref({
    inscritos: 0,
    finalizados: 0,
    certificados: 0,
  });
const eventoData = ref({
  id: 1,
  nombreCorto: 'Mis Cursos',
  nombreLargo: 'Mis Cursos y Actividades Inscritas',
  version: 'Edición General',
  descripcion: 'Gestiona tu progreso, material y certificados de participación de manera sencilla y eficiente.',
  estado: 'En Progreso',
  colorEstado: 'bg-emerald-500 text-white border border-emerald-400',
  imagen: '/bienvenida.png',
  mostrarActividades: true,
  actividadesInscritas: [] as any[]
});

const eventosInscritos = ref<any[]>([]);

const fechaCorta = (valor: string | Date | null | undefined) => {
  if (!valor) return '';
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return '';
  return fecha.toLocaleDateString('es-BO', { day: 'numeric', month: 'short', year: 'numeric' });
};

const datosEvento = (evento: any) => {
  const inicio = fechaCorta(evento?.fecha_inicio);
  const fin = fechaCorta(evento?.fecha_fin);
  const fechas = inicio && fin ? `${inicio} – ${fin}` : inicio || fin || '';
  const cerrado = Number(evento?.estado) === 0 || Number(evento?.fase) >= 4;
  return {
    eventoId: evento?.id || 0,
    eventoNombre: evento?.nombre || 'Evento',
    eventoImagen: imagenEvento(evento),
    eventoGestion: evento?.gestion || '',
    eventoDescripcion: evento?.descripcion || '',
    eventoUbicacion: evento?.ubicacion || '',
    eventoFechas: fechas,
    eventoEstado: cerrado ? 'Finalizado' : 'En curso',
  };
};

const cursoFinalizado = (ins: any) =>
  Number(ins.estado) === 3 || Number(ins.actividadAcademica?.estado) === 0;

const fetchInscripciones = async () => {
  try {
    const [response, certs] = await Promise.all([
      api.get('/me/inscripciones'),
      api.get('/me/certificados').catch(() => ({ data: [] })),
    ]);

    const inscripcionesReales = Array.isArray(response.data) ? response.data : [];
    const listaCerts = (Array.isArray(certs.data) ? certs.data : []).filter((c: any) => Number(c.tipo) === 1 || Number(c.tipo) === 4 || !c.tipo);
    const actividadesConCertificado = new Set(
      listaCerts.map((c: any) => c.actividadAcademica?.id).filter((id: number) => id != null),
    );
    const estaFinalizado = (ins: any) =>
      cursoFinalizado(ins) || actividadesConCertificado.has(ins.actividadAcademica?.id);

    userStats.value.inscritos = inscripcionesReales.filter((i: any) => Number(i.estado) === 1 && !estaFinalizado(i)).length;
    userStats.value.certificados = listaCerts.length;

    const cursos = inscripcionesReales
      .filter((ins: any) => Number(ins.actividadAcademica?.estado) !== -1)
      .map((ins: any) => {
        const act = ins.actividadAcademica;
        const finalizado = estaFinalizado(ins);
        let statusText = 'Inscrito';
        if (finalizado) statusText = 'Finalizado';
        else if (ins.estado === 0) statusText = 'Pre-Inscrito';
        else if (ins.estado === 2) statusText = 'Rechazado';

        return {
          id: act.id,
          title: act.nombre,
          status: statusText,
          statusCode: ins.estado,
          ...datosEvento(act.evento),
          date: act.fecha_inicio ? new Date(act.fecha_inicio).toLocaleDateString() : 'Por definir',
          progress: finalizado ? 100 : (ins.estado === 1 ? 50 : 0),
          image: imagenActividad(act),
        };
      });

    const idsYaListados = new Set(cursos.map((c) => c.id));
    for (const cert of listaCerts) {
      const act = cert.actividadAcademica;
      if (!act || idsYaListados.has(act.id) || Number(act.estado) === -1) continue;
      idsYaListados.add(act.id);
      cursos.push({
        id: act.id,
        title: act.nombre,
        status: 'Finalizado',
        statusCode: 3,
        ...datosEvento(act.evento),
        date: act.fecha_inicio ? new Date(act.fecha_inicio).toLocaleDateString() : 'Por definir',
        progress: 100,
        image: imagenActividad(act),
      });
    }

    const porEvento = new Map<number, any>();
    for (const curso of cursos) {
      if (!porEvento.has(curso.eventoId)) {
        porEvento.set(curso.eventoId, {
          id: curso.eventoId,
          nombre: curso.eventoNombre,
          imagen: curso.eventoImagen,
          gestion: curso.eventoGestion,
          descripcion: curso.eventoDescripcion,
          ubicacion: curso.eventoUbicacion,
          fechas: curso.eventoFechas,
          estado: curso.eventoEstado,
          cursos: [],
        });
      }
      porEvento.get(curso.eventoId).cursos.push(curso);
    }
    eventosInscritos.value = Array.from(porEvento.values());
    eventoData.value.actividadesInscritas = cursos;
    userStats.value.finalizados = cursos.filter((c) => c.status === 'Finalizado').length;
  } catch (error) {
    console.error('Error cargando inscripciones:', error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchInscripciones();
});

const getStatusColor = (status: string) => {
  if (status === 'Finalizado') return 'text-white bg-red-500 border border-red-400 shadow-md';
  if (status === 'Inscrito' || status === 'En curso') return 'text-white bg-blue-500 border border-blue-400 shadow-md';
  if (status === 'Pre-Inscrito') return 'text-white bg-amber-500 border border-amber-400 shadow-md';
  if (status === 'Rechazado') return 'text-white bg-slate-600 border border-slate-500 shadow-md';
  return 'text-white bg-emerald-500 border border-emerald-400 shadow-md'; // Default Disponible
};
</script>

<template>
  <div class="animate-in fade-in duration-500 max-w-7xl mx-auto space-y-8">
    <div class="border-b border-slate-200 dark:border-gray-800 pb-6 mb-8 mt-2 flex justify-between items-end">
      <div>
        <h2 class="text-3xl font-black text-primary-dark dark:text-white uppercase italic">Hola, {{ nombreUsuario }}</h2>
        <p class="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mt-1">Gestiona tu progreso, material y certificados desde tu plataforma académica</p>
      </div>
      <div>
        <button @click="$router.push({ name: 'estudiante-catalogo' })" class="bg-umsa-blue hover:bg-blue-800 text-white px-5 py-2 rounded-xl font-bold shadow-lg shadow-umsa-blue/30 transition-all flex items-center space-x-2 text-sm uppercase tracking-widest">
          <span class="material-symbols-outlined text-[18px]">travel_explore</span>
          <span>Explorar Más Cursos</span>
        </button>
      </div>
    </div>

    <!-- Mini Dashboard Stats -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div class="bg-white dark:bg-gray-900 rounded-[1.5rem] p-6 shadow-sm border border-slate-100 dark:border-gray-800 flex items-center justify-between">
            <div>
                <p class="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-1">Cursos en Progreso</p>
                <h3 class="text-3xl font-black text-umsa-blue dark:text-blue-400">{{ userStats.inscritos }}</h3>
            </div>
            <div class="w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-500">
                <span class="material-symbols-outlined text-2xl">auto_stories</span>
            </div>
        </div>
        <div class="bg-white dark:bg-gray-900 rounded-[1.5rem] p-6 shadow-sm border border-slate-100 dark:border-gray-800 flex items-center justify-between">
            <div>
                <p class="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-1">Cursos Finalizados</p>
                <h3 class="text-3xl font-black text-emerald-500">{{ userStats.finalizados }}</h3>
            </div>
            <div class="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-500">
                <span class="material-symbols-outlined text-2xl">check_circle</span>
            </div>
        </div>
        <div class="bg-white dark:bg-gray-900 rounded-[1.5rem] p-6 shadow-sm border border-slate-100 dark:border-gray-800 flex items-center justify-between">
            <div>
                <p class="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-1">Certificados Disponibles</p>
                <h3 class="text-3xl font-black text-umsa-gold">{{ userStats.certificados }}</h3>
            </div>
            <div class="w-14 h-14 rounded-full bg-yellow-50 dark:bg-yellow-900/20 flex items-center justify-center text-yellow-500">
                <span class="material-symbols-outlined text-2xl">workspace_premium</span>
            </div>
        </div>
    </div>

    <div class="w-full bg-white dark:bg-gray-900 rounded-[2rem] overflow-hidden shadow-sm border border-slate-100 dark:border-gray-800 flex flex-col group/card mb-12">
        
        <!-- Header Evento Banner (Estilo Netflix) -->
        <div class="relative w-full h-[320px] overflow-hidden">
          <img :src="eventoData.imagen" alt="Banner" class="w-full h-full object-cover object-center group-hover/card:scale-105 transition-transform duration-[1.5s] ease-out">
          <div class="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/60 to-transparent"></div>
          
          <!-- Etiqueta de Estado en la parte superior izquierda, destacada -->
          <span class="absolute top-6 left-6 z-30" :class="[eventoData.colorEstado, 'text-[12px] font-black uppercase px-4 py-2 rounded-full tracking-widest w-fit shadow-2xl backdrop-blur-md border-2 border-white/20']">
            ● {{ eventoData.estado }}
          </span>

          <div class="absolute bottom-0 left-0 right-0 p-8 pt-24 z-20 flex flex-col">
            <div class="flex items-end justify-between">
              <div>
                <p class="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-2">{{ eventoData.version }}</p>
                <h1 class="text-4xl md:text-5xl font-black text-white tracking-tighter leading-none mb-4">{{ eventoData.nombreLargo }}</h1>
                <p class="text-sm font-medium text-gray-300 max-w-2xl line-clamp-2 leading-relaxed">{{ eventoData.descripcion }}</p>
              </div>
            </div>
          </div>
        </div>

      </div>

      <div v-if="eventosInscritos.length === 0" class="rounded-[2rem] border border-slate-100 bg-white px-8 py-12 text-center dark:border-gray-800 dark:bg-gray-900">
        <p class="text-sm font-bold uppercase tracking-widest text-gray-500">No tienes actividades inscritas.</p>
      </div>

      <article
        v-for="(evento, indice) in eventosInscritos"
        :key="evento.id"
        class="overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900"
      >
        <div class="relative h-64 md:h-72">
          <img :src="evento.imagen" :alt="evento.nombre" class="h-full w-full object-cover">
          <div class="absolute inset-0 bg-gradient-to-r from-[#003B71]/95 via-[#003B71]/45 to-transparent"></div>
          <div class="absolute inset-0 flex flex-col justify-end p-6 md:p-8">
            <div class="mb-3 flex flex-wrap items-center gap-2">
              <span class="rounded-full border border-white/30 bg-white/15 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white">
                Evento {{ indice + 1 }} de {{ eventosInscritos.length }}
              </span>
              <span
                class="rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white"
                :class="evento.estado === 'Finalizado' ? 'bg-red-500' : 'bg-emerald-500'"
              >
                {{ evento.estado }}
              </span>
              <span v-if="evento.gestion" class="rounded-full bg-emerald-400/20 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-200">
                Gestión {{ evento.gestion }}
              </span>
            </div>
            <h3 class="text-3xl font-black uppercase tracking-tight text-white md:text-4xl">{{ evento.nombre }}</h3>
            <p v-if="evento.descripcion" class="mt-2 max-w-3xl text-sm leading-relaxed text-white/85 line-clamp-2">{{ evento.descripcion }}</p>
            <div class="mt-3 flex flex-wrap gap-4 text-[11px] font-bold uppercase tracking-widest text-white/80">
              <span v-if="evento.ubicacion" class="inline-flex items-center gap-1">
                <span class="material-symbols-outlined text-[16px]">location_on</span>{{ evento.ubicacion }}
              </span>
              <span v-if="evento.fechas" class="inline-flex items-center gap-1">
                <span class="material-symbols-outlined text-[16px]">calendar_month</span>{{ evento.fechas }}
              </span>
              <span class="inline-flex items-center gap-1">
                <span class="material-symbols-outlined text-[16px]">school</span>{{ evento.cursos.length }} curso(s) inscrito(s)
              </span>
            </div>
          </div>
        </div>

        <div class="grid gap-6 bg-slate-50 p-6 dark:bg-gray-950/40 md:grid-cols-2 xl:grid-cols-3">
          <div
            v-for="act in evento.cursos"
            :key="act.id"
            class="group flex cursor-pointer flex-col overflow-hidden rounded-[1.5rem] border border-slate-200/60 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all hover:-translate-y-1 hover:border-emerald-500/50 dark:border-gray-800 dark:bg-gray-900"
            @click="router.push({ name: 'estudiante-actividades-detalle', params: { id: act.id } })"
          >
            <div class="relative h-44 w-full overflow-hidden">
              <img :src="act.image" class="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110" :alt="act.title">
              <span class="absolute right-3 top-3 z-20 rounded-md px-2 py-1 text-[8px] font-black uppercase tracking-widest shadow-sm" :class="getStatusColor(act.status)">
                {{ act.status }}
              </span>
              <div class="absolute inset-0 z-20 flex items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  class="flex items-center gap-2 rounded-xl bg-umsa-gold px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white"
                  @click.stop="router.push({ name: 'estudiante-actividades-detalle', params: { id: act.id }, query: { tab: 'certificados' } })"
                >
                  <span class="material-symbols-outlined text-[16px]">workspace_premium</span> Ver Certificado
                </button>
              </div>
            </div>
            <div class="flex flex-1 flex-col bg-white p-5 dark:bg-gray-900">
              <h3 class="mb-3 line-clamp-2 h-[2.5rem] text-sm font-black leading-tight text-slate-800 dark:text-white">{{ act.title }}</h3>
              <div class="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-gray-800">
                <div class="h-1.5 rounded-full bg-emerald-500" :style="{ width: `${act.progress}%` }"></div>
              </div>
              <div class="mt-auto flex flex-col gap-3 border-t border-slate-100 pt-3 dark:border-gray-800">
                <span class="w-fit rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-slate-500">{{ act.date }}</span>
                <div class="flex items-center justify-between">
                  <span class="text-[10px] font-bold uppercase text-emerald-600">Ingresar</span>
                  <span class="text-[10px] font-black uppercase tracking-widest text-slate-400">{{ act.progress }}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </article>
  </div>
</template>
