const fs = require('fs');
const file = 'src/views/estudiante/EstudianteActividadDetalleView.vue';
let content = fs.readFileSync(file, 'utf8');

const sStart = content.indexOf('<script setup lang="ts">');
const sEnd = content.indexOf('</script>') + 9;

const newScript = `
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '@/services/api';
import Swal from 'sweetalert2';

const route = useRoute();
const router = useRouter();
const actividadId = Number(route.params.id);
const loading = ref(true);

const myInscripcion = ref<any>(null); // Guardará la inscripción si existe
const preinscripcionMenu = ref(false);
const preinscribiendo = ref(false);
const errorMensaje = ref('');

const preinscripcionForm = ref({
  razon: '',
  miembro_tyan: 0
});

// Usamos el dummy init
const actividad = ref({
  id: actividadId,
  nombre: 'Cargando...',
  tipo: 'Cargando',
  fecha: '',
  estado: 'Cargando',
  progreso: 0,
  promedio: 0,
  asistencia: 0,
  horas: 0,
  docente: 'Sin asignar',
  descripcion: 'Cargando detalle...',
  imagen: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=1200&q=80',
  materiales: [] as any[],
  tareas: [] as any[],
  certificadoRequisitos: {
    asistenciaMinima: 80,
    notaMinima: 71,
    completado: false
  }
});

const loadActividad = async () => {
  try {
    const res = await api.get('/actividades-academicas/' + actividadId);
    const act = res.data;
    actividad.value = {
      id: act.id,
      nombre: act.nombre,
      tipo: act.tipo || 'General',
      fecha: act.fecha_inicio ? \`\${new Date(act.fecha_inicio).toLocaleDateString()} al \${new Date(act.fecha_fin).toLocaleDateString()}\` : 'Por definir',
      estado: 'Disponible',
      progreso: 0,
      promedio: 0,
      asistencia: 0,
      horas: act.horas || 40,
      docente: act.imparticiones && act.imparticiones.length > 0 ? \`\${act.imparticiones[0].usuario.persona.nombres} \${act.imparticiones[0].usuario.persona.primer_apellido}\` : 'Sin Docente',
      descripcion: act.descripcion || 'Sin descripción detallada.',
      imagen: act.imagen || 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=1200&q=80',
      materiales: [], // To fetch if needed
      tareas: [],
      certificadoRequisitos: {
        asistenciaMinima: 80,
        notaMinima: 71,
        completado: false
      }
    };
  } catch (e) {
    console.error('Error cargando actividad:', e);
  }
};

const checkInscripcionStatus = async () => {
  try {
    const res = await api.get('/inscripciones/mis-inscripciones');
    const all = res.data;
    const found = all.find((i: any) => i.actividadAcademica.id === actividadId);
    if (found) {
      myInscripcion.value = found;
      if (found.estado === 1) actividad.value.estado = 'Inscrito';
      else if (found.estado === 3) actividad.value.estado = 'Finalizado';
      else if (found.estado === 2) actividad.value.estado = 'Rechazado';
      else actividad.value.estado = 'Pre-Inscrito';
      
      actividad.value.progreso = found.estado === 1 ? 50 : (found.estado === 3 ? 100 : 0);
      actividad.value.certificadoRequisitos.completado = (found.estado === 3);
    } else {
      myInscripcion.value = null; 
      actividad.value.estado = 'Disponible';
      actividad.value.progreso = 0;
    }
  } catch (e) {
    console.error('Error checando pre-inscripcion', e);
  }
};

onMounted(async () => {
  loading.value = true;
  await loadActividad();
  await checkInscripcionStatus();
  loading.value = false;
});

const submitPreinscripcion = async () => {
  preinscribiendo.value = true;
  errorMensaje.value = '';
  try {
    await api.post('/inscripciones/preinscribir', {
      id_actividad: actividadId,
      miembro_tyan: Number(preinscripcionForm.value.miembro_tyan),
      razon: preinscripcionForm.value.razon
    });
    preinscripcionMenu.value = false;
    
    Swal.fire({
      icon: 'success',
      title: 'Solicitud Enviada',
      text: 'Tu pre-inscripción ha sido registrada exitosamente. Un coordinador revisará tu caso.',
      confirmButtonColor: '#10b981'
    });
    
    await checkInscripcionStatus();
  } catch (e: any) {
    console.error(e);
    errorMensaje.value = e.response?.data?.message || 'Error al procesar la solicitud.';
  } finally {
    preinscribiendo.value = false;
  }
};

const getStatusColor = (status: string) => {
  if (status === 'Inscrito' || status === 'Finalizado' || status === 'En curso' || status === 'Entregado') return 'bg-emerald-500 text-white';
  if (status === 'Pre-Inscrito' || status === 'Pendiente') return 'bg-amber-500 text-white';
  if (status === 'Rechazado') return 'bg-red-500 text-white';
  return 'bg-blue-600 text-white';
};

const activeTab = ref(route.query.tab ? String(route.query.tab) : 'resumen');
const tabs = computed(() => {
  if (myInscripcion.value?.estado === 1 || myInscripcion.value?.estado === 3) {
    const t = [
      { id: 'resumen', label: 'Resumen', icon: 'info' },
      { id: 'material', label: 'Material & Tareas', icon: 'library_books' },
      { id: 'calificaciones', label: 'Mi Progreso', icon: 'leaderboard' },
    ];
    if (myInscripcion.value?.estado === 3) {
      t.push({ id: 'certificados', label: 'Mi Certificado', icon: 'workspace_premium' });
    }
    return t;
  }
  return [{ id: 'resumen', label: 'Información General', icon: 'info' }];
});

const goBack = () => {
    router.push({ name: 'estudiante-eventos' });
};
</script>
`;

content = newScript + content.substring(sEnd);

// Metric section UI mapping
const metricHtml = `<!-- Metric Cards Flotantes -->
        <div class="flex gap-4 shrink-0 mt-4 md:mt-0">`;
const hEnd = `</div>
      </div>
\n      <!-- Tabs de Navegación -->`;

const mStart = content.indexOf('<!-- Metric Cards Flotantes -->');
const mEnd = content.indexOf('      <!-- Tabs de Navegación -->', mStart);

const newHTML = `<!-- Acciones o Metric -->
        <div class="flex gap-4 shrink-0 mt-4 md:mt-0">
          <template v-if="myInscripcion">
            <div :class="myInscripcion.estado === 1 ? 'bg-emerald-500' : (myInscripcion.estado === 2 ? 'bg-red-500' : (myInscripcion.estado === 3 ? 'bg-blue-500' : 'bg-amber-500'))" 
                 class="backdrop-blur-xl border border-white/20 rounded-2xl p-6 flex flex-col items-center justify-center min-w-[180px] shadow-2xl">
              <span class="text-white text-base font-black uppercase text-center w-full block">
                {{ myInscripcion.estado === 1 ? 'Inscrito' : (myInscripcion.estado === 2 ? 'Rechazado' : (myInscripcion.estado === 3 ? 'Finalizado' : 'Pre-Inscrito')) }}
              </span>
              <span class="text-[10px] text-white/80 font-bold uppercase tracking-widest mt-2">ESTADO</span>
            </div>
          </template>
          <template v-else>
            <button @click="preinscripcionMenu = true" class="bg-umsa-blue hover:bg-blue-600 text-white px-8 py-5 rounded-2xl font-black uppercase tracking-widest transition-all shadow-[0_0_40px_-5px_rgba(37,99,235,0.5)] flex items-center justify-center gap-3 min-w-[180px] border border-blue-400/50">
               <span class="material-symbols-outlined text-[24px]">approval</span>
               Pre-inscribirme
            </button>
          </template>
        </div>
      </div>
    </div>

    <!-- Modal Preinscripcion -->
    <div v-if="preinscripcionMenu" class="fixed inset-0 z-[100] flex items-center justify-center bg-gray-950/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div class="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 dark:border-gray-800">
         <div class="bg-slate-50 dark:bg-gray-800 px-6 py-5 border-b border-slate-200 dark:border-gray-700 flex justify-between items-center">
            <h3 class="text-xl font-black text-primary-dark dark:text-white uppercase italic">Formulario de Pre-Inscripción</h3>
            <button @click="preinscripcionMenu = false" class="text-slate-400 hover:text-red-500"><span class="material-symbols-outlined text-[24px]">close</span></button>
         </div>
         <div class="p-6 space-y-5">
            <div v-if="errorMensaje" class="bg-red-50 text-red-600 p-4 rounded-xl text-xs font-bold border border-red-200">{{ errorMensaje }}</div>
            <div>
              <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">¿Eres miembro de TYAN?</label>
              <select v-model="preinscripcionForm.miembro_tyan" class="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 outline-none">
                <option :value="0">No soy miembro</option>
                <option :value="1">Sí, soy miembro</option>
              </select>
            </div>
            <div>
              <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Motivación</label>
              <textarea v-model="preinscripcionForm.razon" rows="4" placeholder="¿Por qué deseas participar?" class="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 resize-none"></textarea>
            </div>
            <button @click="submitPreinscripcion" :disabled="preinscribiendo" class="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase text-xs py-4 rounded-xl shadow-lg flex items-center justify-center gap-2">
               {{ preinscribiendo ? 'Enviando...' : 'Confirmar Pre-Inscripción' }}
            </button>
         </div>
      </div>
    </div>\n
`;

if (mStart !== -1) {
  content = content.substring(0, mStart) + newHTML + content.substring(mEnd);
}

fs.writeFileSync(file, content);
console.log("Done");
