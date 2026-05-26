<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAdminHistorialStore } from '@/stores/adminHistorial';
import { useUIStore } from '@/stores/ui';
import { useAuthStore } from '@/stores/auth';
import api from '@/services/api';
import Swal from 'sweetalert2';

const router = useRouter();
const historialStore = useAdminHistorialStore();
const uiStore = useUIStore();
const authStore = useAuthStore();

// --- Configuración Visual ---
const moduloConfig: Record<string, { icon: string; label: string }> = {
  evento: { icon: 'corporate_fare', label: 'Evento' },
  actividad: { icon: 'school', label: 'Actividad' },
  usuario: { icon: 'manage_accounts', label: 'Usuario' },
  certificado: { icon: 'workspace_premium', label: 'Certificado' },
  solicitud: { icon: 'how_to_reg', label: 'Solicitud' },
  auth: { icon: 'shield_person', label: 'Autenticación' },
  ponente: { icon: 'record_voice_over', label: 'Ponente' },
  estudiante: { icon: 'groups', label: 'Estudiante' },
};

const accionConfig: Record<string, { icon: string; color: string; bg: string }> = {
  crear: { icon: 'add_circle', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  editar: { icon: 'edit', color: 'text-blue-500', bg: 'bg-blue-500/10' },
  eliminar: { icon: 'delete', color: 'text-red-500', bg: 'bg-red-500/10' },
  aprobar: { icon: 'check_circle', color: 'text-green-500', bg: 'bg-green-500/10' },
  ver: { icon: 'visibility', color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
};

const formatRelativo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `hace ${d}d`;
  if (h > 0) return `hace ${h}h`;
  if (m > 0) return `hace ${m}min`;
  return 'ahora mismo';
};

// --- Tarjetas de stats ---
const statCards = computed(() => [
  { label: 'Eventos', value: stats.value.eventos, icon: 'corporate_fare', color: 'from-red-600 to-rose-700', route: 'admin-eventos' },
  { label: 'Actividades', value: stats.value.actividades, icon: 'school', color: 'from-orange-600 to-amber-700', route: 'admin-actividades' },
  { label: 'Usuarios', value: stats.value.usuarios, icon: 'manage_accounts', color: 'from-purple-600 to-violet-700', route: 'admin-usuarios' },
  { label: 'Solicitudes', value: stats.value.inscripciones, icon: 'how_to_reg', color: 'from-blue-600 to-indigo-700', route: 'admin-solicitudes' },
  { label: 'Ponentes', value: stats.value.ponentes, icon: 'record_voice_over', color: 'from-emerald-600 to-teal-700', route: 'admin-ponentes' },
  { label: 'Estudiantes', value: stats.value.estudiantes, icon: 'groups', color: 'from-cyan-600 to-sky-700', route: 'admin-estudiantes' },
]);

// --- Otros datos ---
const accionesHoy = computed(() => {
  const hoy = new Date().toDateString();
  return historialStore.registros.filter(r => new Date(r.fecha_creacion).toDateString() === hoy).length;
});

// --- Estado Extendido Maestro ---
const stats = ref({ eventos: 0, actividades: 0, usuarios: 0, inscripciones: 0, ponentes: 0, estudiantes: 0, coordinadores: 0 });
const usuariosDetalle = ref<any[]>([]);
const eventosDetalle = ref<any[]>([]);
const actividadesDetalle = ref<any[]>([]);
const isLoading = ref(true);

// --- Fetch data ---
onMounted(async () => {
  try {
    const [eventosRes, actividadesRes, usuariosRes] = await Promise.allSettled([
      api.get('/eventos'),
      api.get('/actividades-academicas'),
      api.get('/usuarios?soloActivos=false'),
    ]);
    
    if (eventosRes.status === 'fulfilled') {
      const eData = eventosRes.value.data?.data || eventosRes.value.data || [];
      eventosDetalle.value = Array.isArray(eData) ? eData : [];
      stats.value.eventos = eventosDetalle.value.length;
    }

    if (actividadesRes.status === 'fulfilled') {
      const aData = actividadesRes.value.data || [];
      actividadesDetalle.value = Array.isArray(aData) ? aData : [];
      stats.value.actividades = actividadesDetalle.value.length;
    }
    
    if (usuariosRes.status === 'fulfilled') {
      // Extraer datos asegurando que sea un array
      const rawUsers = Array.isArray(usuariosRes.value.data) ? usuariosRes.value.data : (usuariosRes.value.data?.data || []);
      
      usuariosDetalle.value = rawUsers.map((u: any) => ({
        ...u,
        nombreFull: u.persona 
          ? `${u.persona.nombres || ''} ${u.persona.primer_apellido || ''} ${u.persona.segundo_apellido || ''}`.trim() 
          : u.email,
        rolNombre: u.usuariosRoles?.[0]?.rol?.nombre_rol || (u.rol === 'Super Usuario' ? 'Super Administrador' : 'Usuario')
      }));
      
      stats.value.usuarios = usuariosDetalle.value.length;
      stats.value.ponentes = usuariosDetalle.value.filter(u => u.rolNombre === 'Ponente').length;
      stats.value.estudiantes = usuariosDetalle.value.filter(u => u.rolNombre === 'Estudiante').length;
      stats.value.inscripciones = usuariosDetalle.value.filter(u => ['Coordinador', 'Super Usuario', 'Administrador'].includes(u.rolNombre)).length;
      (stats.value as any).coordinadores = stats.value.inscripciones;
      stats.value.coordinadores = usuariosDetalle.value.filter(u => ['Coordinador', 'Super Usuario', 'Administrador'].includes(u.rolNombre)).length;
      stats.value.inscripciones = stats.value.coordinadores;
    }
  } catch (e) {
    console.error('Error en carga maestra:', e);
  } finally {
    isLoading.value = false;
  }
});

// ─── ESTADO DEL EVENTO ────────────────────────────────────
const estadoLabel = (e: number) =>
  e === 1 ? 'ACTIVO' : e === 2 ? 'PLANIFICACIÓN' : e === 0 ? 'CONCLUIDO' : 'BORRADOR';

// --- Gráficos en Tiempo Real (UI) ---
const pieUrl = computed(() => {
  const config = {
    type: 'pie',
    data: {
      labels: ['Ponentes', 'Estudiantes', 'Staff'],
      datasets: [{ data: [stats.value.ponentes, stats.value.estudiantes, (stats.value as any).coordinadores || 0] }]
    },
    options: { 
      title: { display: true, text: 'Distribución de Roles', fontColor: '#64748b' },
      legend: { position: 'bottom' }
    }
  };
  return `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(config))}&w=400&h=250`;
});

const barUrl = computed(() => {
  const config = {
    type: 'bar',
    data: {
      labels: ['Eventos', 'Actividades', 'Usuarios'],
      datasets: [{ label: 'Total', backgroundColor: '#dc2626', data: [stats.value.eventos, stats.value.actividades, stats.value.usuarios] }]
    },
    options: { 
      title: { display: true, text: 'Comparativa de Gestión', fontColor: '#64748b' },
      scales: { yAxes: [{ ticks: { beginAtZero: true } }] }
    }
  };
  return `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(config))}&w=500&h=250`;
});

// ─── EXPORTAR EXCEL (Format PREMIUM Dashboard) ────────
const exportarExcelGlobal = async () => {
  try {
    const fileName = `INFORME_EJECUTIVO_SGEA_${new Date().toISOString().slice(0, 10)}.xls`;

    const pieConfig = {
      type: 'pie',
      data: {
        labels: ['Ponentes', 'Estudiantes', 'Staff'],
        datasets: [{ data: [stats.value.ponentes, stats.value.estudiantes, (stats.value as any).coordinadores || 0] }]
      },
      options: { title: { display: true, text: 'Distribución de Roles' } }
    };
    
    const barConfig = {
      type: 'bar',
      data: {
        labels: ['Eventos', 'Actividades', 'Usuarios'],
        datasets: [{ label: 'Total', backgroundColor: '#003B71', data: [stats.value.eventos, stats.value.actividades, stats.value.usuarios] }]
      },
      options: { title: { display: true, text: 'Comparativa de Gestión' } }
    };

    const pieUrl = `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(pieConfig))}&w=280&h=180`;
    const barUrl = `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(barConfig))}&w=350&h=180`;

    let html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <style>
          .main-title { background-color: #003B71; color: #ffffff; font-size: 20pt; font-weight: bold; text-align: center; height: 50px; border: 2px solid #00264d; }
          .sub-title { background-color: #0070b4; color: #ffffff; font-size: 12pt; text-align: center; height: 25px; }
          .section-banner { background-color: #f1f5f9; color: #0f172a; font-weight: bold; font-size: 11pt; border-bottom: 2px solid #003B71; padding: 10px; }
          
          .card-box { border: 4px solid #ffffff; color: #ffffff; text-align: center; font-weight: bold; vertical-align: middle; }
          .card-eventos { background-color: #dc2626; }
          .card-actividades { background-color: #f59e0b; }
          .card-usuarios { background-color: #7c3aed; }
          .card-ponentes { background-color: #059669; }
          .card-estudiantes { background-color: #0ea5e9; }
          
          .card-val { font-size: 22pt; }
          .card-lbl { font-size: 9pt; text-transform: uppercase; opacity: 0.9; }

          .th-master { background-color: #1e293b; color: #ffffff; font-weight: bold; border: 1px solid #000000; text-align: center; font-size: 10pt; }
          .td-row { border: 1px solid #cbd5e1; font-size: 9pt; padding: 5px; }
          .td-alt { background-color: #f8fafc; border: 1px solid #cbd5e1; font-size: 9pt; }
        </style>
      </head>
      <body>
        <table>
          <tr><td colspan="7" class="main-title">SISTEMA DE GESTIÓN DE EVENTOS Y ACTIVIDADES (SGEA)</td></tr>
          <tr><td colspan="7" class="sub-title">INFORME GERENCIAL Y AUDITORÍA DE GESTIÓN ACADÉMICA</td></tr>
          <tr><td colspan="7" style="text-align: center; font-size: 9pt; color: #64748b;">Generado automáticamente: ${new Date().toLocaleString()}</td></tr>
          <tr><td colspan="7"></td></tr>

          <tr>
            <td colspan="2" class="card-box card-eventos" height="70">
              <span class="card-lbl">EVENTOS</span><br><span class="card-val">${stats.value.eventos}</span>
            </td>
            <td colspan="3" class="card-box card-actividades" height="70">
              <span class="card-lbl">ACTIVIDADES</span><br><span class="card-val">${stats.value.actividades}</span>
            </td>
            <td colspan="2" class="card-box card-usuarios" height="70">
              <span class="card-lbl">USUARIOS</span><br><span class="card-val">${stats.value.usuarios}</span>
            </td>
          </tr>
          <tr>
            <td colspan="4" class="card-box card-ponentes" height="60">
              <span class="card-lbl">PONENTES Y EXPOSITORES</span><br><span class="card-val">${stats.value.ponentes}</span>
            </td>
            <td colspan="3" class="card-box card-estudiantes" height="60">
              <span class="card-lbl">ESTUDIANTES Y ALUMNOS</span><br><span class="card-val">${stats.value.estudiantes}</span>
            </td>
          </tr>
          <tr><td colspan="7"></td></tr>

          <tr><td colspan="7" class="section-banner">📊 ANÁLISIS ESTADÍSTICO DE PARTICIPACIÓN</td></tr>
          <tr>
            <td colspan="3" style="text-align: center; background-color: #ffffff; padding: 15px;">
              <img src="${pieUrl}" width="280" height="180">
            </td>
            <td colspan="4" style="text-align: center; background-color: #ffffff; padding: 15px;">
              <img src="${barUrl}" width="350" height="180">
            </td>
          </tr>
          <tr><td colspan="7"></td></tr>



          <tr><td colspan="7" class="section-banner">📋 DESGLOSE DE PROYECTOS Y EVENTOS</td></tr>
          <tr class="th-master">
            <td colspan="3">Título del Evento</td>
            <td>Modalidad</td>
            <td>Fecha Inicio</td>
            <td>Inscritos</td>
            <td>Estado</td>
          </tr>
          ${eventosDetalle.value.map((e, i) => `
            <tr>
              <td colspan="3" class="${i % 2 === 0 ? 'td-row' : 'td-alt'}">${e.nombre || e.titulo || '—'}</td>
              <td class="${i % 2 === 0 ? 'td-row' : 'td-alt'}" style="text-align: center;">${e.modalidad || '—'}</td>
              <td class="${i % 2 === 0 ? 'td-row' : 'td-alt'}" style="text-align: center;">${e.fecha_inicio ? e.fecha_inicio.substring(0, 10) : '—'}</td>
              <td class="${i % 2 === 0 ? 'td-row' : 'td-alt'}" style="text-align: center;">${e._count?.inscripciones || 0}</td>
              <td class="${i % 2 === 0 ? 'td-row' : 'td-alt'}" style="text-align: center; color: #0369a1; font-weight: bold;">${estadoLabel(e.estado)}</td>
            </tr>
          `).join('')}
          <tr><td colspan="7"></td></tr>

          <tr><td colspan="7" class="section-banner">👤 DIRECTORIO INTEGRAL DE PERSONAL (DOCENTES Y ALUMNOS)</td></tr>
          <tr class="th-master">
            <td colspan="2">Nombre Completo</td>
            <td colspan="2">Correo Institucional</td>
            <td>Rol</td>
            <td>Categoría</td>
            <td>Fecha Registro</td>
          </tr>
          ${usuariosDetalle.value.slice(0, 500).map((u, i) => `
            <tr>
              <td colspan="2" class="${i % 2 === 0 ? 'td-row' : 'td-alt'}">${u.nombreFull || '—'}</td>
              <td colspan="2" class="${i % 2 === 0 ? 'td-row' : 'td-alt'}">${u.email || '—'}</td>
              <td class="${i % 2 === 0 ? 'td-row' : 'td-alt'}" style="text-align: center; font-weight: bold;">${u.rolNombre}</td>
              <td class="${i % 2 === 0 ? 'td-row' : 'td-alt'}" style="text-align: center;">${u.rolNombre === 'Estudiante' ? 'ESTUDIANTE' : u.rolNombre === 'Ponente' ? 'PONENTE' : 'ADMINISTRATIVO'}</td>
              <td class="${i % 2 === 0 ? 'td-row' : 'td-alt'}" style="text-align: center;">${u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</td>
            </tr>
          `).join('')}
        </table>
      </body>
      </html>
    `;

    const blob = new Blob(['\uFEFF', html], { type: 'application/vnd.ms-excel' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    window.URL.revokeObjectURL(url);

    Swal.close();
    Swal.fire({ 
      icon: 'success', 
      title: 'Reporte Premium Generado', 
      text: 'Se ha creado un dashboard visual de alta gama para auditoría con gráficas incrustadas.',
      confirmButtonColor: '#003B71'
    });
  } catch (e) {
    console.error(e);
    Swal.fire('Error', 'No se pudo generar el reporte premium.', 'error');
  }
};

// ─── EXPORTAR PDF ──────────────────────────────────────────
const exportarPDFGlobal = async () => {
  try {
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    const doc = new jsPDF('p', 'mm', 'letter');
    const pageWidth = doc.internal.pageSize.width;
    const AZUL_CORP: [number, number, number] = [0, 59, 113];

    Swal.fire({
      title: 'Generando PDF Oficial...',
      text: 'Procesando tablas e imágenes para auditoría',
      allowOutsideClick: false,
      didOpen: () => { Swal.showLoading(); }
    });

    const drawHeader = (title: string) => {
      doc.setFillColor(...AZUL_CORP);
      doc.rect(0, 0, pageWidth, 40, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18); doc.setFont('helvetica', 'bold');
      doc.text('SISTEMA DE GESTIÓN DE EVENTOS Y ACTIVIDADES (SGEA)', pageWidth / 2, 15, { align: 'center' });
      doc.setFontSize(11); doc.setFont('helvetica', 'normal');
      doc.text(title, pageWidth / 2, 25, { align: 'center' });
      doc.setFontSize(8);
      doc.text(`Documento Oficial de Auditoría - Generado: ${new Date().toLocaleString()}`, pageWidth / 2, 33, { align: 'center' });
    };

    const piePagina = () => {
      const total = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= total; i++) {
        doc.setPage(i);
        doc.setFillColor(240, 244, 248);
        doc.rect(0, doc.internal.pageSize.height - 12, pageWidth, 12, 'F');
        doc.setFontSize(7); doc.setTextColor(100);
        doc.text(`Página ${i} de ${total} | Documento oficial SGEA | ${new Date().toLocaleDateString()}`, pageWidth / 2, doc.internal.pageSize.height - 4, { align: 'center' });
      }
    };

    // PÁGINA 1: RESUMEN Y GRÁFICOS
    drawHeader('INFORME EJECUTIVO DE GESTIÓN Y MÉTRICAS');
    let y = 50;
    doc.setTextColor(51, 65, 85); doc.setFontSize(14); doc.setFont('helvetica', 'bold');
    doc.text('I. RESUMEN DE INDICADORES', 15, y);
    
    autoTable(doc, {
      startY: y + 5,
      head: [['Métrica', 'Total', 'Estado']],
      body: [
        ['Eventos Totales', stats.value.eventos.toString(), 'Auditado'],
        ['Actividades Académicas', stats.value.actividades.toString(), 'Verificado'],
        ['Directorio de Usuarios', stats.value.usuarios.toString(), 'Actualizado'],
        ['Cuerpo de Ponentes', stats.value.ponentes.toString(), 'Activo'],
        ['Alumnado Registrado', stats.value.estudiantes.toString(), 'Activo'],
      ],
      headStyles: { fillColor: AZUL_CORP },
      styles: { fontSize: 10, cellPadding: 4 }
    });

    // Agregar Gráficos al PDF
    const currentY = (doc as any).lastAutoTable.finalY + 15;
    doc.text('II. ANÁLISIS ESTADÍSTICO DE PARTICIPACIÓN', 15, currentY);
    try {
      const pieConfig = {
        type: 'pie',
        data: {
          labels: ['Ponentes', 'Estudiantes', 'Staff'],
          datasets: [{ data: [stats.value.ponentes, stats.value.estudiantes, (stats.value as any).coordinadores || 0] }]
        }
      };
      
      const barConfig = {
        type: 'bar',
        data: {
          labels: ['Eventos', 'Actividades', 'Usuarios'],
          datasets: [{ label: 'Total', backgroundColor: '#003B71', data: [stats.value.eventos, stats.value.actividades, stats.value.usuarios] }]
        }
      };

      const pieUrl = `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(pieConfig))}&w=300&h=200&f=png`;
      const barUrl = `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(barConfig))}&w=400&h=200&f=png`;
      
      const [pieRes, barRes] = await Promise.all([fetch(pieUrl), fetch(barUrl)]);
      const pieBlob = await pieRes.blob();
      const barBlob = await barRes.blob();
      
      const blobToBase64 = (blob: Blob): Promise<string> => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      };
      
      const pieImg = await blobToBase64(pieBlob);
      const barImg = await blobToBase64(barBlob);
      
      doc.addImage(pieImg, 'PNG', 15, currentY + 5, 80, 50);
      doc.addImage(barImg, 'PNG', 100, currentY + 5, 100, 50);
    } catch (e) {
      doc.setFontSize(10);
      doc.text('(Error cargando gráficas visuales)', 15, currentY + 15);
    }

    // PÁGINA 2: EVENTOS
    doc.addPage();
    drawHeader('III. DESGLOSE DE EVENTOS INSTITUCIONALES');
    autoTable(doc, {
      startY: 50,
      head: [['Título del Evento', 'Modalidad', 'Inicio', 'Estado']],
      body: eventosDetalle.value.map((e: any) => [
        e.nombre || e.titulo || '—', 
        e.modalidad || '—', 
        e.fecha_inicio ? e.fecha_inicio.substring(0, 10) : '—', 
        estadoLabel(e.estado)
      ]),
      headStyles: { fillColor: AZUL_CORP },
      styles: { fontSize: 8 }
    });

    // PÁGINA 3: USUARIOS
    doc.addPage();
    drawHeader('IV. DIRECTORIO INTEGRAL DE PERSONAL Y ALUMNADO');
    autoTable(doc, {
      startY: 50,
      head: [['Nombre Completo', 'Correo', 'Rol', 'Categoría']],
      body: usuariosDetalle.value.slice(0, 500).map(u => [u.nombreFull, u.email, u.rolNombre, u.rolNombre === 'Estudiante' ? 'ALUMNO' : 'DOCENTE/STAFF']),
      headStyles: { fillColor: [51, 65, 85] },
      styles: { fontSize: 8 }
    });

    piePagina();
    Swal.close();
    doc.save(`INFORME_MAESTRO_SGEA_${new Date().toISOString().slice(0, 10)}.pdf`);
    Swal.fire({ icon: 'success', title: 'PDF Generado', text: 'Informe corporativo listo para auditoría.', confirmButtonColor: '#003B71' });
  } catch (e) {
    console.error(e);
    Swal.close();
    Swal.fire('Error', 'No se pudo generar el PDF.', 'error');
  }
};



</script>

<template>
  <div class="space-y-8 animate-in fade-in duration-500">

    <!-- PAGE HEADER -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-3 mb-2">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-rose-800 flex items-center justify-center shadow-lg shadow-red-900/50">
            <span class="material-symbols-outlined text-white text-[22px]">monitoring</span>
          </div>
          <div>
            <p class="text-[10px] font-black text-red-600 dark:text-red-500 uppercase tracking-widest leading-none">
              {{ authStore.esSuperUsuario ? 'Super Administrador' : 'Gestión Académica' }}
            </p>
            <h1 class="text-2xl font-black text-slate-800 dark:text-white tracking-tight uppercase italic">
              {{ authStore.esSuperUsuario ? 'Dashboard Global' : 'Panel de Control' }}
            </h1>
          </div>
        </div>
        <p class="text-slate-500 text-sm ml-1">
          {{ authStore.esSuperUsuario ? 'Vista general del sistema SGEA · Acceso total garantizado' : 'Gestión de eventos y actividades académicas' }}
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-3">
        <!-- BOTONES DE REPORTE TOP -->
        <div v-if="authStore.esSuperUsuario" class="flex items-center gap-2 mr-4 bg-slate-100 dark:bg-white/5 p-1.5 rounded-2xl border border-slate-200 dark:border-white/10">
          <button @click="exportarPDFGlobal" 
                  class="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all shadow-lg shadow-red-900/30 group">
            <span class="material-symbols-outlined text-[18px] group-hover:rotate-12 transition-transform">picture_as_pdf</span>
            <span class="text-[10px] font-black uppercase tracking-widest">PDF Auditoría</span>
          </button>
          <button @click="exportarExcelGlobal" 
                  class="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all shadow-lg shadow-emerald-900/30 group">
            <span class="material-symbols-outlined text-[18px] group-hover:scale-110 transition-transform">table_chart</span>
            <span class="text-[10px] font-black uppercase tracking-widest">Excel Gerencial</span>
          </button>
        </div>

        <div class="px-4 py-2 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-700/30 rounded-xl text-center min-w-[100px]">
          <p class="text-[9px] text-red-600 dark:text-red-500 uppercase tracking-widest font-bold">Acciones hoy</p>
          <p class="text-2xl font-black text-slate-800 dark:text-white leading-none mt-1">{{ accionesHoy }}</p>
        </div>
        <div class="px-4 py-2 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-center min-w-[100px]">
          <p class="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Total historial</p>
          <p class="text-2xl font-black text-slate-800 dark:text-white leading-none mt-1">{{ historialStore.registros.length }}</p>
        </div>
      </div>
    </div>

    <!-- STAT CARDS -->
    <div class="grid grid-cols-2 lg:grid-cols-6 gap-4">
      <div v-for="card in statCards" :key="card.label"
           @click="router.push({ name: card.route })"
           class="bg-white dark:bg-[#13131f] border border-slate-200 dark:border-white/5 rounded-2xl p-5 cursor-pointer hover:border-red-500/50 hover:-translate-y-1 transition-all duration-300 group shadow-sm dark:shadow-none">
        <div :class="`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`">
          <span class="material-symbols-outlined text-white text-[20px]">{{ card.icon }}</span>
        </div>
        <p class="text-3xl font-black text-slate-800 dark:text-white leading-none mb-1">
          <span v-if="isLoading" class="inline-block w-8 h-6 bg-slate-200 dark:bg-white/10 rounded animate-pulse"></span>
          <span v-else>{{ card.value }}</span>
        </p>
        <p class="text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest">{{ card.label }}</p>
      </div>
    </div>

    <!-- VISUAL CHARTS SECTION (UI) -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in slide-in-from-bottom-6 duration-1000">
      <div class="bg-white dark:bg-[#13131f] border border-slate-200 dark:border-white/5 rounded-[2.5rem] p-8 shadow-sm dark:shadow-none group hover:border-red-500/30 transition-all">
        <div class="flex items-center gap-2 mb-6">
          <div class="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
            <span class="material-symbols-outlined text-red-600 text-lg">pie_chart</span>
          </div>
          <h3 class="text-[10px] font-black text-slate-800 dark:text-slate-300 uppercase tracking-widest italic">Análisis de Participación</h3>
        </div>
        <div class="flex justify-center p-2 bg-slate-50 dark:bg-black/20 rounded-[2rem] border border-slate-100 dark:border-white/5">
          <img :src="pieUrl" alt="Gráfico de Roles" class="max-w-full h-auto rounded-xl group-hover:scale-105 transition-transform duration-700" />
        </div>
      </div>

      <div class="bg-white dark:bg-[#13131f] border border-slate-200 dark:border-white/5 rounded-[2.5rem] p-8 shadow-sm dark:shadow-none group hover:border-red-500/30 transition-all">
        <div class="flex items-center gap-2 mb-6">
          <div class="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
            <span class="material-symbols-outlined text-red-600 text-lg">bar_chart</span>
          </div>
          <h3 class="text-[10px] font-black text-slate-800 dark:text-slate-300 uppercase tracking-widest italic">Métricas de Gestión</h3>
        </div>
        <div class="flex justify-center p-2 bg-slate-50 dark:bg-black/20 rounded-[2rem] border border-slate-100 dark:border-white/5">
          <img :src="barUrl" alt="Gráfico de Gestión" class="max-w-full h-auto rounded-xl group-hover:scale-105 transition-transform duration-700" />
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- ACTIVIDAD RECIENTE -->
      <div class="lg:col-span-2 space-y-4">
        <div class="flex items-center justify-between px-2">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-red-600">history</span>
            <h2 class="text-xs font-black text-slate-800 dark:text-white uppercase tracking-widest italic">Actividad Reciente</h2>
          </div>
          <button @click="router.push('/admin/historial')" 
                  class="text-[9px] font-black text-red-600 dark:text-red-500 uppercase tracking-widest flex items-center gap-1 group">
            Ver todo <span class="material-symbols-outlined text-[14px] group-hover:translate-x-1 transition-transform">trending_flat</span>
          </button>
        </div>

        <div class="bg-white dark:bg-[#13131f] border border-slate-200 dark:border-white/5 rounded-[2.5rem] overflow-hidden shadow-sm dark:shadow-none">
          <div v-if="historialStore.registros.length === 0" class="py-20 flex flex-col items-center text-slate-400">
            <span class="material-symbols-outlined text-5xl mb-2 opacity-20">history_toggle_off</span>
            <p class="text-[10px] font-black uppercase tracking-widest">Sin actividad registrada aún</p>
          </div>
          <div v-else class="divide-y divide-slate-100 dark:divide-white/5">
            <div v-for="log in historialStore.registros.slice(0, 6)" :key="log.id"
                 class="flex items-center gap-4 p-5 hover:bg-slate-50 dark:hover:bg-white/5 transition-all group">
              <div :class="[accionConfig[log.accion]?.bg || 'bg-slate-100 dark:bg-white/10', 'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-slate-200 dark:border-white/10']">
                <span class="material-symbols-outlined text-[18px]" :class="accionConfig[log.accion]?.color || 'text-slate-400'">
                  {{ accionConfig[log.accion]?.icon || 'visibility' }}
                </span>
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-0.5">
                  <span class="text-[8px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded border border-slate-200 dark:border-white/10">
                    {{ moduloConfig[log.modulo]?.label || log.modulo }}
                  </span>
                  <div v-if="!log.leido" class="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></div>
                </div>
                <p class="text-xs font-black text-slate-700 dark:text-slate-300 truncate">{{ log.descripcion }}</p>
                <p v-if="log.entidad_nombre" class="text-[9px] text-red-600 dark:text-red-400 font-bold italic truncate mt-0.5">→ {{ log.entidad_nombre }}</p>
              </div>
              <p class="text-[9px] font-black text-slate-400 dark:text-slate-600 shrink-0 italic">{{ formatRelativo(log.fecha_creacion) }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- SIDEBAR DASHBOARD CONTENT -->
      <div class="space-y-8">
        <!-- QUICK LINKS -->
        <div class="bg-white dark:bg-[#13131f] border border-slate-200 dark:border-white/5 rounded-[2.5rem] p-6 shadow-sm dark:shadow-none">
          <div class="flex items-center gap-2 mb-6">
            <span class="material-symbols-outlined text-red-600">bolt</span>
            <h2 class="text-xs font-black text-slate-800 dark:text-white uppercase tracking-widest italic">Accesos Rápidos</h2>
          </div>
          <div class="space-y-3">
            <button @click="router.push('/admin/eventos')"
                    class="w-full flex items-center gap-3 p-4 bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/5 rounded-2xl hover:border-red-500/50 hover:bg-slate-100 dark:hover:bg-red-900/10 transition-all group text-left">
              <span class="material-symbols-outlined text-slate-400 dark:text-slate-600 group-hover:text-red-600 transition-colors">corporate_fare</span>
              <span class="text-[10px] font-black text-slate-700 dark:text-slate-400 uppercase tracking-widest">Gestionar Eventos</span>
            </button>
            <button @click="router.push('/admin/actividades')"
                    class="w-full flex items-center gap-3 p-4 bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/5 rounded-2xl hover:border-red-500/50 hover:bg-slate-100 dark:hover:bg-red-900/10 transition-all group text-left">
              <span class="material-symbols-outlined text-slate-400 dark:text-slate-600 group-hover:text-red-600 transition-colors">school</span>
              <span class="text-[10px] font-black text-slate-700 dark:text-slate-400 uppercase tracking-widest">Actividades Académicas</span>
            </button>
          </div>
        </div>



        <!-- ACTIVITY BY MODULE (Only Super User) -->
        <div v-if="authStore.esSuperUsuario" class="bg-white dark:bg-[#13131f] border border-slate-200 dark:border-white/5 rounded-[2.5rem] p-6 shadow-sm dark:shadow-none">
          <div class="flex items-center gap-2 mb-6 text-red-600">
            <span class="material-symbols-outlined">analytics</span>
            <h2 class="text-xs font-black dark:text-white uppercase tracking-widest italic">Actividad por Módulo</h2>
          </div>
          <div class="space-y-5">
            <template v-if="historialStore.porModulo">
              <div v-for="(count, mod) in historialStore.porModulo" :key="mod" class="space-y-1.5">
                <div class="flex justify-between items-center px-1">
                  <span class="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1">
                    <span class="material-symbols-outlined text-[11px]">{{ moduloConfig[mod]?.icon || 'circle' }}</span>
                    {{ moduloConfig[mod]?.label || mod }}
                  </span>
                  <span class="text-[10px] font-black text-slate-800 dark:text-white">{{ count }}</span>
                </div>
                <div class="h-1.5 w-full bg-slate-100 dark:bg-black/50 rounded-full overflow-hidden">
                  <div class="h-full bg-red-600 transition-all duration-1000" :style="{ width: (count / (historialStore.registros.length || 1) * 100) + '%' }"></div>
                </div>
              </div>
            </template>
            <p v-if="!historialStore.porModulo || Object.keys(historialStore.porModulo).length === 0" class="text-[10px] text-slate-400 uppercase italic text-center py-4">Sin datos registrados</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
