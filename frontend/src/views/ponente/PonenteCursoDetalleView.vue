<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import api from '@/services/api';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const activeTab = ref('resumen');
const loading = ref(true);
const actividadId = route.params.id;
const qrCodeUrl = ref(`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=attendance-${actividadId}`);

const curso = ref<any>(null);
const estudiantes = ref<any[]>([]);

// Verificar si el ponente tiene permisos de edición en esta actividad
const tienePermisos = computed(() => {
    if (!curso.value || !authStore.user) return false;
    const userId = (authStore.user as any)?.id_usuario;
    return curso.value.imparticiones?.some((i: any) => i.usuario?.id_usuario === userId || i.usuarioId === userId);
});

const fetchDetalleActividad = async () => {
    loading.value = true;
    try {
        const res = await api.get(`/actividades-academicas/${actividadId}`);
        curso.value = {
            id: res.data.id,
            evento: res.data.evento?.nombre || 'Evento Académico',
            version: res.data.version || 'Gestión 2026',
            fechas: `${res.data.fecha_inicio ? new Date(res.data.fecha_inicio).toLocaleDateString() : 'Pendiente'} - ${res.data.fecha_fin ? new Date(res.data.fecha_fin).toLocaleDateString() : 'Pendiente'}`,
            estudiantesInscritos: res.data.inscripciones?.length || 0,
            estado: res.data.estado === 1 ? 'Activo' : 'Cerrado',
            modalidad: res.data.modalidad || 'Presencial',
            descripcion: res.data.descripcion || 'Sin descripción disponible.',
            imparticiones: res.data.imparticiones || []
        };
        
        // Estudiantes
        estudiantes.value = (res.data.inscripciones || []).map((ins: any) => ({
            id: ins.id,
            nombre: `${ins.usuario.persona.nombres} ${ins.usuario.persona.primer_apellido}`,
            correo: ins.usuario.email,
            asistencia: '---', // Esto vendría de otra tabla
            estado: ins.nota_principal >= 65 ? 'Excelente' : 'Regular'
        }));
    } catch (error) {
        console.error('Error al cargar detalle:', error);
    } finally {
        loading.value = false;
    }
};

onMounted(fetchDetalleActividad);

const navigateToCalificaciones = () => {
    router.push({ 
        name: 'ponente-actividad-calificaciones',
        params: { actividadId: actividadId }
    });
};
</script>

<template>
  <div v-if="loading" class="animate-in fade-in flex flex-col items-center justify-center p-40 text-slate-400">
      <span class="material-symbols-outlined animate-spin text-5xl">sync</span>
      <p class="text-[10px] font-black uppercase tracking-widest mt-4">Sincronizando información académica...</p>
  </div>

  <div v-else-if="curso" class="animate-in fade-in duration-500 max-w-7xl mx-auto space-y-8 pb-20">
    <!-- Header Retorno -->
    <button @click="router.back()" class="flex items-center gap-2 text-slate-500 hover:text-umsa-blue transition-colors font-black text-[11px] uppercase tracking-widest">
      <span class="material-symbols-outlined text-[16px]">arrow_back</span>
      Volver al Listado
    </button>

    <!-- Header Principal -->
    <div class="bg-gradient-to-br from-umsa-blue via-[#005a96] to-[#004270] rounded-[2.5rem] p-8 md:p-12 text-white relative overflow-hidden shadow-2xl shadow-umsa-blue/20 flex flex-col md:flex-row justify-between items-center gap-8 border border-white/10">
      <div class="absolute top-0 right-0 w-96 h-96 bg-umsa-gold/20 rounded-full blur-3xl -mr-32 -mt-32 mix-blend-screen pointer-events-none"></div>
      
      <div class="relative z-10 w-full md:w-2/3">
        <div class="flex items-center gap-3 mb-6 flex-wrap">
          <span class="px-4 py-1.5 bg-umsa-gold text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-umsa-gold/30">
            {{ curso.version }}
          </span>
          <span class="px-4 py-1.5 bg-white/10 backdrop-blur-md border border-white/20 text-white text-[10px] font-black uppercase tracking-widest rounded-full">
            <span class="mr-1 inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> {{ curso.estado }}
          </span>
        </div>
        
        <h1 class="text-3xl md:text-5xl font-black leading-tight uppercase italic mb-4 tracking-tight">
          {{ curso.evento }}
        </h1>
        <p class="text-blue-50 text-sm md:text-base leading-relaxed max-w-3xl border-l-4 border-umsa-gold pl-4 font-medium opacity-90">
          {{ curso.descripcion }}
        </p>
      </div>

      <!-- Acciones Rápidas: SOLAMENTE SI TIENE PERMISOS -->
      <div v-if="tienePermisos" class="relative z-10 flex flex-col gap-3 w-full md:w-auto min-w-[220px]">
        <button @click="activeTab = 'qr'" class="group bg-white text-umsa-blue hover:bg-slate-50 font-black text-xs uppercase tracking-widest px-6 py-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1">
            <span class="material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform">qr_code_scanner</span>
            Generar QR
        </button>
        <button @click="navigateToCalificaciones()" class="group bg-umsa-gold hover:bg-yellow-600 text-white font-black text-xs uppercase tracking-widest px-6 py-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl hover:shadow-2xl shadow-umsa-gold/20 hover:-translate-y-1">
            <span class="material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform">grading</span>
            Gestionar Notas
        </button>
      </div>
      
      <!-- Si no tiene permisos, mostrar badge de catálogo -->
      <div v-else class="relative z-10 bg-white/5 backdrop-blur-xl p-6 rounded-3xl border border-white/10 text-center flex flex-col items-center gap-2">
            <span class="material-symbols-outlined text-4xl text-umsa-gold/50">visibility</span>
            <p class="text-[10px] font-black uppercase tracking-widest text-white/60">Vista de Catálogo</p>
            <p class="text-[8px] font-bold text-white/40 uppercase">No asignado como ponente</p>
      </div>
    </div>

    <!-- Pestañas Modernas -->
    <div class="flex gap-2 overflow-x-auto no-scrollbar p-1 bg-slate-100 dark:bg-gray-900 rounded-2xl border border-slate-200 dark:border-gray-800">
      <button v-for="tab in ['resumen', 'estudiantes']" :key="tab" @click="activeTab = tab" :class="[activeTab === tab ? 'bg-white dark:bg-gray-800 text-umsa-blue dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700']" class="px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-2 flex-shrink-0">
        <span class="material-symbols-outlined text-[18px]" :class="{'text-umsa-gold': activeTab === tab}">{{ tab === 'resumen' ? 'dashboard' : 'groups' }}</span>
        {{ tab === 'resumen' ? 'Panel Central' : `Nómina (${curso.estudiantesInscritos})` }}
      </button>
      
      <!-- Pestañas Extras solo si tiene permisos -->
      <template v-if="tienePermisos">
          <button @click="activeTab = 'qr'" :class="[activeTab === 'qr' ? 'bg-white dark:bg-gray-800 text-umsa-blue dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700']" class="px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-2 flex-shrink-0 relative">
            <span class="material-symbols-outlined text-[18px]" :class="{'text-umsa-gold': activeTab === 'qr'}">qr_code_2</span>
            Asistencia
          </button>
          <button @click="activeTab = 'certificados'" :class="[activeTab === 'certificados' ? 'bg-white dark:bg-gray-800 text-umsa-blue dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700']" class="px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center gap-2 flex-shrink-0">
            <span class="material-symbols-outlined text-[18px]" :class="{'text-umsa-gold': activeTab === 'certificados'}">workspace_premium</span>
            Mis Certificados
          </button>
      </template>
    </div>

    <!-- Contenido dinámico según permisos -->
    <div v-show="activeTab === 'resumen'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
       <div class="col-span-1 md:col-span-2 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-[2.5rem] p-8 shadow-sm flex items-center justify-between group hover:border-umsa-blue/30 transition-all">
            <div>
                <p class="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2 flex items-center gap-2">Modalidad y Fechas</p>
                <h4 class="text-xl md:text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter italic">{{ curso.modalidad }} - {{ curso.fechas }}</h4>
            </div>
            <div class="w-14 h-14 bg-blue-50 dark:bg-gray-800 rounded-2xl flex items-center justify-center text-umsa-blue">
                <span class="material-symbols-outlined text-3xl">event_upcoming</span>
            </div>
       </div>

       <div class="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-[2.5rem] p-8 shadow-sm group hover:border-umsa-gold/50 transition-all text-center md:text-left">
           <p class="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-3">Participantes Inscritos</p>
           <h4 class="text-4xl font-black text-slate-800 dark:text-white leading-none">{{ curso.estudiantesInscritos }}</h4>
       </div>

       <div v-if="tienePermisos" class="bg-gradient-to-br from-slate-800 to-slate-900 rounded-[2.5rem] p-8 shadow-lg flex flex-col justify-between text-white group cursor-pointer" @click="activeTab='qr'">
            <p class="text-[10px] font-black uppercase tracking-widest text-umsa-gold mb-1">Módulo Docente</p>
            <h4 class="text-lg font-black leading-tight italic">Registrar Asistencia Hoy</h4>
            <div class="mt-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                Lanzar <span class="material-symbols-outlined text-sm">qr_code</span>
            </div>
       </div>
       <div v-else class="bg-slate-50 dark:bg-gray-800/20 rounded-[2.5rem] p-8 border border-dashed border-slate-200 flex items-center justify-center flex-col text-center opacity-60">
            <span class="material-symbols-outlined text-3xl text-slate-300">lock</span>
            <p class="text-[10px] font-black text-slate-400 uppercase mt-2">Funciones restringidas</p>
       </div>
    </div>

    <!-- Tabla de Estudiantes (Disponible para todos) -->
    <div v-if="activeTab === 'estudiantes'" class="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-[2.5rem] shadow-sm overflow-hidden p-2">
        <table class="w-full text-left">
            <thead class="bg-slate-50/50 dark:bg-black/20">
                <tr>
                    <th class="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Estudiante</th>
                    <th class="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Correo Institucional</th>
                    <th class="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Estatus Académico</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="est in estudiantes" :key="est.id" class="border-b border-slate-50 dark:border-gray-800/50 hover:bg-slate-50 dark:hover:bg-gray-800/30 transition-all">
                    <td class="px-8 py-5">
                       <div class="text-sm font-black text-slate-700 dark:text-white uppercase italic tracking-tighter">{{ est.nombre }}</div>
                    </td>
                    <td class="px-8 py-5 text-xs text-slate-500 font-bold">{{ est.correo }}</td>
                    <td class="px-8 py-5 text-right">
                        <span class="px-3 py-1 bg-blue-50 dark:bg-blue-900/10 text-umsa-blue text-[9px] font-black uppercase rounded-lg border border-blue-100 dark:border-blue-800/50">
                            Pre-Inscrito
                        </span>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>

    <!-- SECCIONES SEGURAS -->
    <div v-if="activeTab === 'qr' && tienePermisos" class="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-[2.5rem] p-12 shadow-xl flex flex-col items-center gap-6 text-center">
        <div class="max-w-2xl mx-auto">
            <h3 class="text-3xl font-black text-slate-800 dark:text-white uppercase italic mb-4">Módulo de Asistencia Dinámico</h3>
            <p class="text-slate-500 text-sm leading-relaxed mb-8">Selecciona la modalidad de asistencia que deseas activar para esta sesión. Puedes proyectar un código para que los alumnos lo escaneen, o abrir tu cámara para escanear los códigos de los alumnos a medida que ingresan.</p>
            <div class="flex flex-col sm:flex-row justify-center gap-4">
                <button @click="router.push({ name: 'ponente-proyectar-qr', params: { id: actividadId } })" class="bg-umsa-blue text-white px-8 py-5 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-umsa-blue/20 hover:bg-blue-800 transition-all flex items-center justify-center gap-2">
                    <span class="material-symbols-outlined">present_to_all</span>
                    Proyectar QR a la Clase
                </button>
                <button @click="router.push({ name: 'ponente-escanear-alumnos', params: { id: actividadId } })" class="bg-emerald-600 text-white px-8 py-5 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-emerald-600/20 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2">
                    <span class="material-symbols-outlined">camera_alt</span>
                    Escanear a Estudiantes
                </button>
            </div>
        </div>
    </div>

  </div>
</template>
