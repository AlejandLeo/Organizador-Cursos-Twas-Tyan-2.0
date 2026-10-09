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
  { label: 'Eventos', value: stats.value.eventos, icon: 'corporate_fare', color: 'from-[#003B71] to-[#0070BB]', route: 'admin-eventos' },
  { label: 'Actividades', value: stats.value.actividades, icon: 'school', color: 'from-[#0070BB] to-sky-500', route: 'admin-actividades' },
  { label: 'Usuarios', value: stats.value.usuarios, icon: 'manage_accounts', color: 'from-sky-600 to-sky-400', route: 'admin-usuarios' },
  { label: 'Solicitudes', value: stats.value.inscripciones, icon: 'how_to_reg', color: 'from-teal-700 to-teal-500', route: 'admin-solicitudes' },
  { label: 'Ponentes', value: stats.value.ponentes, icon: 'record_voice_over', color: 'from-[#0E7490] to-cyan-400', route: 'admin-ponentes' },
  { label: 'Estudiantes', value: stats.value.estudiantes, icon: 'groups', color: 'from-emerald-700 to-emerald-500', route: 'admin-estudiantes' },
]);

// --- Otros datos ---
const accionesHoyTotal = ref(0);
const accionesHoy = computed(() => accionesHoyTotal.value);

const STAFF_ROLES = ['coordinador', 'super usuario', 'super administrador', 'administrador', 'logistica', 'logística'];

const rolesDe = (u: any): string[] => {
  const desdeRelacion = (u.usuariosRoles || [])
    .map((ur: any) => ur?.rol?.nombre_rol)
    .filter((nombre): nombre is string => Boolean(nombre));
  if (desdeRelacion.length) return desdeRelacion;
  if (u.rol) return [String(u.rol)];
  return [];
};

const tieneRol = (roles: string[], nombre: string) =>
  roles.some((rol) => rol.toLowerCase() === nombre.toLowerCase());

const esStaff = (roles: string[]) =>
  roles.some((rol) => STAFF_ROLES.includes(rol.toLowerCase()));

const esPonente = (u: any) =>
  tieneRol(u.roles, 'Ponente') || (u.imparticiones || []).length > 0;

const esEstudiante = (u: any) =>
  tieneRol(u.roles, 'Estudiante') || (u.inscripciones || []).length > 0;

const categoriaDe = (roles: string[]) => {
  if (tieneRol(roles, 'Ponente')) return 'PONENTE';
  if (tieneRol(roles, 'Estudiante')) return 'ESTUDIANTE';
  if (esStaff(roles)) return 'STAFF';
  return 'USUARIO';
};

const fechaCorta = (value: unknown) => {
  if (!value) return '—';
  const texto = String(value);
  return texto.length >= 10 ? texto.substring(0, 10) : texto;
};

const inscritosDeEvento = (evento: any) => {
  const ids = new Set<number | string>();
  for (const actividad of evento.actividades || []) {
    for (const inscripcion of actividad.inscripciones || []) {
      const id = inscripcion.id_usuario ?? inscripcion.usuario?.id ?? inscripcion.id;
      if (id != null) ids.add(id);
    }
  }
  return ids.size;
};

const modalidadDeEvento = (evento: any) => {
  const tipos = new Set<string>();
  for (const actividad of evento.actividades || []) {
    const tipo = actividad.modalidad || actividad.modalidades?.[0]?.tipo;
    if (tipo) tipos.add(String(tipo));
  }
  return tipos.size ? Array.from(tipos).join(', ') : '—';
};

// --- Estado Extendido Maestro ---
const stats = ref({ eventos: 0, actividades: 0, usuarios: 0, inscripciones: 0, ponentes: 0, estudiantes: 0, coordinadores: 0 });
const usuariosDetalle = ref<any[]>([]);
const eventosDetalle = ref<any[]>([]);
const actividadesDetalle = ref<any[]>([]);
const isLoading = ref(true);

const hoyISO = () => {
  const hoy = new Date();
  const mes = String(hoy.getMonth() + 1).padStart(2, '0');
  const dia = String(hoy.getDate()).padStart(2, '0');
  return `${hoy.getFullYear()}-${mes}-${dia}`;
};

// --- Fetch data ---
onMounted(async () => {
  const fecha = hoyISO();
  try {
    const [eventosRes, actividadesRes, usuariosRes, solicitudesRes, historialHoyRes] = await Promise.allSettled([
      api.get('/eventos'),
      api.get('/actividades-academicas'),
      api.get('/usuarios', { params: { soloActivos: 'false', page: 1, limit: 5000 } }),
      api.get('/usuarios/solicitudes/pendientes'),
      api.get('/audit-log', { params: { fechaDesde: fecha, fechaHasta: fecha, limit: 1 } }),
      historialStore.cargar({ limit: 100 }),
    ]);
    
    if (eventosRes.status === 'fulfilled') {
      const eData = eventosRes.value.data?.data || eventosRes.value.data || [];
      const lista = Array.isArray(eData) ? eData : [];
      eventosDetalle.value = lista.map((evento: any) => ({
        ...evento,
        modalidadTexto: modalidadDeEvento(evento),
        inscritos: inscritosDeEvento(evento),
      }));
      stats.value.eventos = eventosDetalle.value.length;
    }

    if (actividadesRes.status === 'fulfilled') {
      const aData = actividadesRes.value.data?.data || actividadesRes.value.data || [];
      actividadesDetalle.value = Array.isArray(aData) ? aData : [];
      stats.value.actividades = actividadesDetalle.value.length;
    }
    
    if (usuariosRes.status === 'fulfilled') {
      const payload = usuariosRes.value.data;
      const rawUsers = Array.isArray(payload) ? payload : (payload?.data || []);
      
      usuariosDetalle.value = rawUsers.map((u: any) => {
        const roles = rolesDe(u);
        const usuario = {
          ...u,
          roles,
          nombreFull: u.persona 
            ? `${u.persona.nombres || ''} ${u.persona.primer_apellido || ''} ${u.persona.segundo_apellido || ''}`.trim() 
            : u.email,
          rolNombre: roles.join(', ') || ( (u.imparticiones || []).length ? 'Ponente' : (u.inscripciones || []).length ? 'Estudiante' : 'Usuario'),
          categoria: categoriaDe(roles),
        };
        if (!roles.length && (u.imparticiones || []).length) usuario.categoria = 'PONENTE';
        else if (!roles.length && (u.inscripciones || []).length) usuario.categoria = 'ESTUDIANTE';
        return usuario;
      });
      
      stats.value.usuarios = Number(payload?.total || usuariosDetalle.value.length);
      stats.value.ponentes = usuariosDetalle.value.filter(esPonente).length;
      stats.value.estudiantes = usuariosDetalle.value.filter(esEstudiante).length;
      stats.value.coordinadores = usuariosDetalle.value.filter(u => esStaff(u.roles)).length;
    }

    if (solicitudesRes.status === 'fulfilled') {
      const pendientes = solicitudesRes.value.data?.data || solicitudesRes.value.data || [];
      stats.value.inscripciones = Array.isArray(pendientes) ? pendientes.length : 0;
    }

    if (historialHoyRes.status === 'fulfilled') {
      accionesHoyTotal.value = Number(historialHoyRes.value.data?.total || 0);
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
const COLORES_UMSA = {
  marino: '#003B71',
  azul: '#0070BB',
  celeste: '#38BDF8',
  verde: '#0F766E',
};

const pieUrl = computed(() => {
  const config = {
    type: 'horizontalBar',
    data: {
      labels: ['Ponentes', 'Estudiantes', 'Staff'],
      datasets: [{
        data: [stats.value.ponentes, stats.value.estudiantes, stats.value.coordinadores || 0],
        backgroundColor: [COLORES_UMSA.marino, COLORES_UMSA.celeste, COLORES_UMSA.azul],
        barThickness: 28,
      }],
    },
    options: {
      legend: { display: false },
      layout: { padding: { right: 36 } },
      plugins: {
        datalabels: {
          anchor: 'end',
          align: 'end',
          color: '#003B71',
          font: { weight: 'bold', size: 13 },
        },
      },
      scales: {
        xAxes: [{ ticks: { beginAtZero: true, fontColor: '#64748b' }, gridLines: { color: '#e2e8f0' } }],
        yAxes: [{ ticks: { fontColor: '#0f172a', fontStyle: 'bold' }, gridLines: { display: false } }],
      },
    },
  };
  return `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(config))}&w=520&h=260`;
});

const barUrl = computed(() => {
  const config = {
    type: 'bar',
    data: {
      labels: ['Eventos', 'Actividades', 'Usuarios'],
      datasets: [{
        label: 'Total',
        backgroundColor: [COLORES_UMSA.marino, COLORES_UMSA.azul, COLORES_UMSA.celeste],
        data: [stats.value.eventos, stats.value.actividades, stats.value.usuarios],
      }]
    },
    options: { 
      title: { display: true, text: 'Comparativa de Gestión', fontColor: '#334155' },
      legend: { labels: { fontColor: '#334155' } },
      scales: { yAxes: [{ ticks: { beginAtZero: true, fontColor: '#64748b' } }], xAxes: [{ ticks: { fontColor: '#334155' } }] }
    }
  };
  return `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(config))}&w=500&h=250`;
});

const csvCell = (value: unknown) => {
  const texto = value == null || value === '' ? '' : String(value);
  if (/[",\n\r]/.test(texto)) return `"${texto.replace(/"/g, '""')}"`;
  return texto;
};

const csvFila = (celdas: unknown[]) => celdas.map(csvCell).join(',');

const descargarCsv = (nombre: string, filas: unknown[][]) => {
  const contenido = ['sep=,', ...filas.map(csvFila)].join('\r\n');
  const blob = new Blob(['\uFEFF', contenido], { type: 'text/csv;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  a.click();
  window.URL.revokeObjectURL(url);
};

// ─── EXPORTAR CSV (mismas secciones del informe gerencial) ────────
const exportarCsvGlobal = () => {
  try {
    const fileName = `INFORME_EJECUTIVO_SGEA_${new Date().toISOString().slice(0, 10)}.csv`;
    const filas: unknown[][] = [
      ['SISTEMA DE GESTIÓN DE EVENTOS Y ACTIVIDADES (SGEA)'],
      ['INFORME GERENCIAL Y AUDITORÍA DE GESTIÓN ACADÉMICA'],
      [`Generado automáticamente: ${new Date().toLocaleString()}`],
      [],
      ['INDICADORES DE GESTIÓN'],
      ['Métrica', 'Total'],
      ['Eventos', stats.value.eventos],
      ['Actividades', stats.value.actividades],
      ['Usuarios', stats.value.usuarios],
      ['Solicitudes pendientes', stats.value.inscripciones],
      ['Ponentes y expositores', stats.value.ponentes],
      ['Estudiantes y alumnos', stats.value.estudiantes],
      ['Staff', stats.value.coordinadores],
      [],
      ['ANÁLISIS ESTADÍSTICO DE PARTICIPACIÓN'],
      ['Distribución de roles', 'Total'],
      ['Ponentes', stats.value.ponentes],
      ['Estudiantes', stats.value.estudiantes],
      ['Staff', stats.value.coordinadores],
      [],
      ['Comparativa de gestión', 'Total'],
      ['Eventos', stats.value.eventos],
      ['Actividades', stats.value.actividades],
      ['Usuarios', stats.value.usuarios],
      [],
      ['DESGLOSE DE PROYECTOS Y EVENTOS'],
      ['Título del evento', 'Modalidad', 'Fecha inicio', 'Inscritos', 'Estado'],
      ...eventosDetalle.value.map((e) => [
        e.nombre || e.titulo || '—',
        e.modalidadTexto || '—',
        fechaCorta(e.fecha_inicio),
        e.inscritos ?? 0,
        estadoLabel(e.estado),
      ]),
      [],
      ['DIRECTORIO INTEGRAL DE PERSONAL (DOCENTES Y ALUMNOS)'],
      ['Nombre completo', 'Correo institucional', 'Rol', 'Categoría', 'Fecha registro'],
      ...usuariosDetalle.value.map((u) => [
        u.nombreFull || '—',
        u.email || '—',
        u.rolNombre,
        u.categoria,
        fechaCorta(u.fecha_creacion),
      ]),
    ];

    descargarCsv(fileName, filas);
    Swal.fire({
      icon: 'success',
      title: 'CSV generado',
      text: 'El informe gerencial conserva las mismas secciones, ahora en columnas que Excel puede abrir sin superponer las tablas.',
      confirmButtonColor: '#003B71',
    });
  } catch (e) {
    console.error(e);
    Swal.fire('Error', 'No se pudo generar el CSV.', 'error');
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
        ['Solicitudes pendientes', stats.value.inscripciones.toString(), 'Auditado'],
        ['Cuerpo de Ponentes', stats.value.ponentes.toString(), 'Activo'],
        ['Alumnado Registrado', stats.value.estudiantes.toString(), 'Activo'],
        ['Staff', stats.value.coordinadores.toString(), 'Activo'],
      ],
      headStyles: { fillColor: AZUL_CORP },
      styles: { fontSize: 10, cellPadding: 4 }
    });

    // Agregar Gráficos al PDF
    const currentY = (doc as any).lastAutoTable.finalY + 15;
    doc.text('II. ANÁLISIS ESTADÍSTICO DE PARTICIPACIÓN', 15, currentY);
    try {
      const pieConfig = {
        type: 'horizontalBar',
        data: {
          labels: ['Ponentes', 'Estudiantes', 'Staff'],
          datasets: [{
            data: [stats.value.ponentes, stats.value.estudiantes, stats.value.coordinadores || 0],
            backgroundColor: [COLORES_UMSA.marino, COLORES_UMSA.celeste, COLORES_UMSA.azul],
          }],
        },
        options: {
          legend: { display: false },
          plugins: { datalabels: { anchor: 'end', align: 'end', color: '#003B71' } },
        },
      };
      
      const barConfig = {
        type: 'bar',
        data: {
          labels: ['Eventos', 'Actividades', 'Usuarios'],
          datasets: [{
            label: 'Total',
            backgroundColor: [COLORES_UMSA.marino, COLORES_UMSA.azul, COLORES_UMSA.celeste],
            data: [stats.value.eventos, stats.value.actividades, stats.value.usuarios],
          }]
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
      head: [['Título del Evento', 'Modalidad', 'Inicio', 'Inscritos', 'Estado']],
      body: eventosDetalle.value.map((e: any) => [
        e.nombre || e.titulo || '—',
        e.modalidadTexto || '—',
        fechaCorta(e.fecha_inicio),
        String(e.inscritos ?? 0),
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
      body: usuariosDetalle.value.map(u => [u.nombreFull, u.email, u.rolNombre, u.categoria]),
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

const handleNavigation = (card: any) => {
  if (card.route === 'admin-eventos') {
    router.push({ name: 'admin-gestion', query: { tab: 'eventos' } });
  } else if (card.route === 'admin-actividades') {
    router.push({ name: 'admin-gestion', query: { tab: 'actividades' } });
  } else {
    router.push({ name: card.route });
  }
};

</script>

<template>
  <div class="space-y-8 animate-in fade-in duration-500">

    <!-- PAGE HEADER -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-3 mb-2">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-[#003B71] to-[#0070BB] flex items-center justify-center shadow-lg shadow-[#003B71]/30">
            <span class="material-symbols-outlined text-white text-[22px]">monitoring</span>
          </div>
          <div>
            <p class="text-[10px] font-black text-umsa-blue dark:text-sky-400 uppercase tracking-widest leading-none">
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
                  class="flex items-center gap-2 px-4 py-2.5 bg-umsa-blue hover:bg-[#005a96] text-white rounded-xl transition-all shadow-lg shadow-[#0070BB]/30 group">
            <span class="material-symbols-outlined text-[18px] group-hover:rotate-12 transition-transform">picture_as_pdf</span>
            <span class="text-[10px] font-black uppercase tracking-widest">PDF Auditoría</span>
          </button>
          <button @click="exportarCsvGlobal" 
                  class="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all shadow-lg shadow-emerald-900/30 group">
            <span class="material-symbols-outlined text-[18px] group-hover:scale-110 transition-transform">table_chart</span>
            <span class="text-[10px] font-black uppercase tracking-widest">CSV Gerencial</span>
          </button>
        </div>

        <div class="px-4 py-2 bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-700/30 rounded-xl text-center min-w-[100px]">
          <p class="text-[9px] text-umsa-blue dark:text-sky-400 uppercase tracking-widest font-bold">Acciones hoy</p>
          <p class="text-2xl font-black text-slate-800 dark:text-white leading-none mt-1">{{ accionesHoy }}</p>
        </div>
        <div class="px-4 py-2 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-center min-w-[100px]">
          <p class="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Total historial</p>
          <p class="text-2xl font-black text-slate-800 dark:text-white leading-none mt-1">{{ historialStore.total }}</p>
        </div>
      </div>
    </div>

    <!-- STAT CARDS -->
    <div class="grid grid-cols-2 lg:grid-cols-6 gap-4">
      <div v-for="card in statCards" :key="card.label"
           @click="handleNavigation(card)"
           class="bg-white dark:bg-[#13131f] border border-slate-200 dark:border-white/5 rounded-2xl p-5 cursor-pointer hover:border-umsa-blue/40 hover:-translate-y-1 transition-all duration-300 group shadow-sm dark:shadow-none">
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
      <div class="bg-white dark:bg-[#13131f] border border-slate-200 dark:border-white/5 rounded-[2.5rem] p-8 shadow-sm dark:shadow-none group hover:border-sky-400/50 transition-all">
        <div class="flex items-center gap-2 mb-6">
          <div class="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-900/25 flex items-center justify-center">
            <span class="material-symbols-outlined text-umsa-blue text-lg">leaderboard</span>
          </div>
          <h3 class="text-[10px] font-black text-slate-800 dark:text-slate-300 uppercase tracking-widest italic">Análisis de Participación</h3>
        </div>
        <div class="flex justify-center p-2 bg-slate-50 dark:bg-black/20 rounded-[2rem] border border-slate-100 dark:border-white/5">
          <img :src="pieUrl" alt="Gráfico de Roles" class="max-w-full h-auto rounded-xl group-hover:scale-105 transition-transform duration-700" />
        </div>
      </div>

      <div class="bg-white dark:bg-[#13131f] border border-slate-200 dark:border-white/5 rounded-[2.5rem] p-8 shadow-sm dark:shadow-none group hover:border-sky-400/50 transition-all">
        <div class="flex items-center gap-2 mb-6">
          <div class="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-900/25 flex items-center justify-center">
            <span class="material-symbols-outlined text-umsa-blue text-lg">bar_chart</span>
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
            <span class="material-symbols-outlined text-umsa-blue">history</span>
            <h2 class="text-xs font-black text-slate-800 dark:text-white uppercase tracking-widest italic">Actividad Reciente</h2>
          </div>
          <button @click="router.push('/admin/historial')" 
                  class="text-[9px] font-black text-umsa-blue dark:text-sky-400 uppercase tracking-widest flex items-center gap-1 group">
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
                  <div v-if="!log.leido" class="w-1.5 h-1.5 rounded-full bg-umsa-blue animate-pulse"></div>
                </div>
                <p class="text-xs font-black text-slate-700 dark:text-slate-300 truncate">{{ log.descripcion }}</p>
                <p v-if="log.entidad_nombre" class="text-[9px] text-umsa-blue dark:text-sky-300 font-bold italic truncate mt-0.5">→ {{ log.entidad_nombre }}</p>
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
            <span class="material-symbols-outlined text-umsa-blue">bolt</span>
            <h2 class="text-xs font-black text-slate-800 dark:text-white uppercase tracking-widest italic">Accesos Rápidos</h2>
          </div>
          <div class="space-y-3">
            <button @click="router.push({ name: 'admin-gestion', query: { tab: 'eventos' } })"
                    class="w-full flex items-center gap-3 p-4 bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/5 rounded-2xl hover:border-umsa-blue/40 hover:bg-slate-100 dark:hover:bg-sky-900/15 transition-all group text-left">
              <span class="material-symbols-outlined text-slate-400 dark:text-slate-600 group-hover:text-umsa-blue transition-colors">corporate_fare</span>
              <span class="text-[10px] font-black text-slate-700 dark:text-slate-400 uppercase tracking-widest">Gestionar Eventos</span>
            </button>
            <button @click="router.push({ name: 'admin-gestion', query: { tab: 'actividades' } })"
                    class="w-full flex items-center gap-3 p-4 bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/5 rounded-2xl hover:border-umsa-blue/40 hover:bg-slate-100 dark:hover:bg-sky-900/15 transition-all group text-left">
              <span class="material-symbols-outlined text-slate-400 dark:text-slate-600 group-hover:text-umsa-blue transition-colors">school</span>
              <span class="text-[10px] font-black text-slate-700 dark:text-slate-400 uppercase tracking-widest">Actividades Académicas</span>
            </button>
          </div>
        </div>



        <!-- ACTIVITY BY MODULE (Only Super User) -->
        <div v-if="authStore.esSuperUsuario" class="bg-white dark:bg-[#13131f] border border-slate-200 dark:border-white/5 rounded-[2.5rem] p-6 shadow-sm dark:shadow-none">
          <div class="flex items-center gap-2 mb-6 text-umsa-blue">
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
                  <div class="h-full bg-umsa-blue transition-all duration-1000" :style="{ width: (count / (historialStore.registros.length || 1) * 100) + '%' }"></div>
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
