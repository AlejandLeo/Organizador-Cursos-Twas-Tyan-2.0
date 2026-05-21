<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useAdminHistorialStore } from '@/stores/adminHistorial';
import { usuariosService } from '@/services/usuarios.service';
import api from '@/services/api';
import Swal from 'sweetalert2';

const authStore = useAuthStore();
const historialStore = useAdminHistorialStore();
const isLoading = ref(true);
const usuarios = ref<any[]>([]);
const filtroTexto = ref('');
const filtroRol = ref('');

// Plantilla de correo de bienvenida
const plantillasCorreo = ref<any[]>([]);
const selectedTemplateId = ref('');
const showPreviewModal = ref(false);
const previewHtml = ref('');

const fetchPlantillas = async () => {
  try {
    const res = await api.get('/admin/mail-templates');
    plantillasCorreo.value = res.data || [];
  } catch { /* silencioso */ }
};

const openMailPreview = async () => {
  previewHtml.value = '';
  if (!selectedTemplateId.value) {
    // Plantilla por defecto: admission.hbs
    try {
      const res = await api.get('/admin/mail-templates/default-preview');
      previewHtml.value = res.data?.html || '<p>No se pudo cargar.</p>';
    } catch {
      previewHtml.value = '<p style="color:red">Error al cargar admission.hbs</p>';
    }
  } else {
    const t = plantillasCorreo.value.find((p: any) => String(p.id) === selectedTemplateId.value);
    if (!t) return;
    try {
      const resLayout = await api.get('/admin/configuracion/key/MAIL_MASTER_LAYOUT');
      const resUrl    = await api.get('/admin/configuracion/key/SYSTEM_URL');
      const masterLayout = resLayout.data?.valor || '<html><body>{{{content}}}</body></html>';
      const systemUrl    = resUrl.data?.valor    || window.location.origin;
      const ctx: Record<string, string | number> = {
        nombre: 'Juan Pérez', name: 'Juan Pérez', email: 'ejemplo@correo.com',
        password: 'Contraseña123', url_sistema: systemUrl, loginUrl: systemUrl,
        year: new Date().getFullYear(),
      };
      let html = (t.cuerpo || '').replace(/\n/g, '<br>');
      Object.keys(ctx).forEach(k => { html = html.replace(new RegExp(`{{${k}}}`, 'g'), String(ctx[k])); });
      previewHtml.value = masterLayout.replace('{{{content}}}', html).replace('{{year}}', String(new Date().getFullYear()));
    } catch {
      previewHtml.value = '<p style="color:red">Error al renderizar.</p>';
    }
  }
  showPreviewModal.value = true;
};

// Modales
const isCreating = ref(false);
const isGestionandoRoles = ref(false);
const usuarioSeleccionado = ref<any>(null);
const rolesCargando = ref(false);
const rolesTemp = ref<number[]>([]);
const notificarRoles = ref(true);

// IDs de roles (deben coincidir con la BD)
const ROLE_IDS = { SUPER_USUARIO: 1, COORDINADOR: 2, LOGISTICA: 3, ESTUDIANTE: 4, PONENTE: 5 };

const rolesDisponibles = [
  { id: ROLE_IDS.SUPER_USUARIO, nombre: 'Super Usuario' },
  { id: ROLE_IDS.COORDINADOR, nombre: 'Coordinador' },
  { id: ROLE_IDS.LOGISTICA,    nombre: 'Logística' },
  { id: ROLE_IDS.PONENTE,     nombre: 'Ponente' },
  { id: ROLE_IDS.ESTUDIANTE,  nombre: 'Estudiante' },
];

// Los Coordinadores no pueden asignar el rol Super Usuario
const rolesDisponiblesParaAsignar = computed(() => {
  if (authStore.esSuperUsuario) return rolesDisponibles;
  return rolesDisponibles.filter(r => r.id !== ROLE_IDS.SUPER_USUARIO);
});

const formUsuario = ref({
  email: '',
  password: '',
  nombres: '',
  primer_apellido: '',
  segundo_apellido: '',
  documento_identidad: '',
  id_rol: ROLE_IDS.COORDINADOR,
  notificar: true
});

const fetchUsuarios = async () => {
  try {
    isLoading.value = true;
    const res = await usuariosService.getAll({ soloActivos: 'false', limit: 1000 } as any);
    console.log('AdminUsuariosView: Datos recibidos:', res.data);
    const data = (res.data as any)?.data ?? res.data;
    usuarios.value = Array.isArray(data) ? data : [];
    console.log(`AdminUsuariosView: ${usuarios.value.length} usuarios cargados.`);
  } catch (error) {
    console.error('Error fetching usuarios:', error);
    Swal.fire('Error', 'No se pudo cargar la lista de usuarios', 'error');
  } finally {
    isLoading.value = false;
  }
};

const usuariosFiltrados = computed(() => {
  const list = [...usuarios.value].sort((a, b) => (b.id ?? 0) - (a.id ?? 0));
  
  return list.filter(u => {
    const nombresFull = `${u.persona?.nombres ?? ''} ${u.persona?.primer_apellido ?? ''}`.toLowerCase();
    const coincideTexto =
      !filtroTexto.value ||
      nombresFull.includes(filtroTexto.value.toLowerCase()) ||
      (u.email ?? '').toLowerCase().includes(filtroTexto.value.toLowerCase());
      
    const coincideRol =
      !filtroRol.value ||
      u.usuariosRoles?.some((ur: any) => ur.rol?.id === Number(filtroRol.value));
      
    return coincideTexto && coincideRol;
  });
});

// ── Paginación ─────────────────────────────────────────────────────────────
const currentPage = ref(1);
const itemsPerPage = ref(10);

const totalPages = computed(() => {
  const total = Math.ceil(usuariosFiltrados.value.length / itemsPerPage.value);
  return total > 0 ? total : 1;
});

const paginatedUsuarios = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  return usuariosFiltrados.value.slice(start, start + itemsPerPage.value);
});

// Reiniciar a la página 1 si cambian los filtros o la data
watch([filtroTexto, filtroRol, itemsPerPage, usuarios], () => {
  currentPage.value = 1;
});

const getRoles = (u: any): string[] =>
  u.usuariosRoles?.map((ur: any) => ur.rol?.nombre_rol).filter(Boolean) ?? [];

const tienePonente = (u: any) => getRoles(u).includes('Ponente');

const cleanCI = (ci: string) => {
  if (!ci) return 'N/A';
  // Eliminar prefijos comunes que vienen del backend por error o diseño antiguo
  return ci.replace(/Carnet de Identidad:|Otro Documento Válido:|Documento de Identidad:|CI:/gi, '').trim();
};

// ── Crear usuario ──────────────────────────────────────────────────────────
const isSavingForm = ref(false);

const handleSaveUsuario = async () => {
  if (isSavingForm.value) return;
  
  const { email, password, nombres, primer_apellido, id_rol, notificar } = formUsuario.value;
  if (!email || !password || !nombres || !primer_apellido) {
    return Swal.fire('Campos requeridos', 'Complete todos los campos obligatorios.', 'warning');
  }
  
  isSavingForm.value = true;
  try {
    const res = await usuariosService.crearConRol({
      email,
      password,
      nombres,
      primer_apellido,
      segundo_apellido: formUsuario.value.segundo_apellido || undefined,
      documento_identidad: formUsuario.value.documento_identidad || undefined,
      id_rol,
      notificar,
    });
    
    const resData = res.data as any;
    const rolName = rolesDisponibles.find(r => r.id === id_rol)?.nombre || 'Usuario';
    historialStore.registrar('usuario', 'crear', `Creó nuevo ${rolName}: ${email}`, { entidadNombre: email });
    
    if (resData.correoEnviado) {
      Swal.fire('¡Éxito!', `${rolName} creado correctamente. Se ha puesto en cola el envío de un correo con las credenciales temporales.`, 'success');
    } else {
      Swal.fire({
        title: '¡Usuario Creado!',
        text: `${rolName} registrado, pero NO se pudo enviar el correo de bienvenida. Verifique la configuración SMTP o notifique manualmente.`,
        icon: 'warning',
        confirmButtonColor: '#f59e0b'
      });
    }
    
    isCreating.value = false;
    formUsuario.value = { email: '', password: '', nombres: '', primer_apellido: '', segundo_apellido: '', documento_identidad: '', id_rol: ROLE_IDS.COORDINADOR, notificar: true };
    await fetchUsuarios();
    currentPage.value = 1;
  } catch (error: any) {
    let msg = error?.response?.data?.message || 'No se pudo crear el usuario.';
    if (Array.isArray(msg)) msg = msg.join(' | ');
    Swal.fire('Error', String(msg), 'error');
  } finally {
    isSavingForm.value = false;
  }
};

// ── Gestión de Múltiples Roles ─────────────────────────────────────────────
const abrirGestionRoles = (user: any) => {
  usuarioSeleccionado.value = user;
  rolesTemp.value = user.usuariosRoles?.map((ur: any) => ur.rol?.id) || [];
  notificarRoles.value = true;
  isGestionandoRoles.value = true;
};

const toggleRolLocal = (rolId: number) => {
  if (rolesTemp.value.includes(rolId)) {
    rolesTemp.value = rolesTemp.value.filter(id => id !== rolId);
  } else {
    rolesTemp.value.push(rolId);
  }
};

const guardarRoles = async () => {
  const u = usuarioSeleccionado.value;
  if (!u || rolesCargando.value) return;

  rolesCargando.value = true;
  try {
    const res = await usuariosService.actualizarRolesBulk(u.id, rolesTemp.value, notificarRoles.value);
    const data = res.data as any;
    
    if (data.mensaje === 'No se detectaron cambios en los roles.') {
      Swal.fire('Atención', data.mensaje, 'info');
      isGestionandoRoles.value = false;
      return;
    }

    if (data.correoEnviado) {
      Swal.fire('¡Éxito!', 'Roles actualizados y notificación encolada para el usuario.', 'success');
    } else if (notificarRoles.value) {
      Swal.fire('Actualizado', 'Roles actualizados, pero hubo un problema al encolar el correo.', 'warning');
    } else {
      Swal.fire('¡Éxito!', 'Roles actualizados correctamente.', 'success');
    }

    isGestionandoRoles.value = false;
    await fetchUsuarios();
  } catch (error: any) {
    Swal.fire('Error', error.response?.data?.message || 'No se pudo actualizar los roles.', 'error');
  } finally {
    rolesCargando.value = false;
  }
};

// ── Editar Detalles del Usuario ─────────────────────────────────────────────
const isEditingModal = ref(false);
const isLoadingDetails = ref(false);
const isSavingDetails = ref(false);
const editForm = ref({
  id: null as number | null,
  email: '',
  nombres: '',
  primer_apellido: '',
  segundo_apellido: '',
  documento_identidad: '',
  celular: '',
  fecha_nacimiento: '',
  genero: 2,
  pais_origen: '',
  pais_residencia: '',
  institucion: '',
  id_grado_academico: null as number | null,
  grado_academico: '',
  especialidad: ''
});
const detallesUsuario = ref<any>(null);

const abrirEditModal = async (user: any) => {
  editForm.value.id = user.id;
  isEditingModal.value = true;
  isLoadingDetails.value = true;
  
  try {
    const res = await usuariosService.getPerfilAdmin(user.id);
    const p = res.data;
    detallesUsuario.value = p;
    
    const af = p.afiliaciones && p.afiliaciones.length > 0 ? p.afiliaciones[0] : null;
    
    editForm.value = {
      id: p.id,
      email: p.email || '',
      nombres: p.persona?.nombres || '',
      primer_apellido: p.persona?.primer_apellido || '',
      segundo_apellido: p.persona?.segundo_apellido || '',
      documento_identidad: p.persona?.documento_identidad || '',
      celular: p.persona?.celular || '',
      fecha_nacimiento: p.persona?.fecha_nacimiento ? p.persona.fecha_nacimiento.split('T')[0] : '',
      genero: p.persona?.genero ?? 2,
      pais_origen: p.persona?.pais_origen || '',
      pais_residencia: p.persona?.pais_residencia || '',
      institucion: af?.institucion || '',
      id_grado_academico: af?.id_grado_academico || null,
      grado_academico: p.persona?.grado_academico || '',
      especialidad: af?.disciplina_cientifica || ''
    };
  } catch (error) {
    Swal.fire('Error', 'No se pudieron cargar los detalles del usuario', 'error');
    isEditingModal.value = false;
  } finally {
    isLoadingDetails.value = false;
  }
};

const guardarDetalles = async () => {
  if (!editForm.value.id) return;
  
  if (!editForm.value.email || !editForm.value.nombres || !editForm.value.primer_apellido) {
    return Swal.fire('Atención', 'El email, nombre y primer apellido son obligatorios', 'warning');
  }

  isSavingDetails.value = true;
  try {
    await usuariosService.actualizarPerfilAdmin(editForm.value.id, {
      email: editForm.value.email,
      nombres: editForm.value.nombres,
      primer_apellido: editForm.value.primer_apellido,
      segundo_apellido: editForm.value.segundo_apellido,
      documento_identidad: editForm.value.documento_identidad,
      celular: editForm.value.celular,
      fecha_nacimiento: editForm.value.fecha_nacimiento,
      genero: editForm.value.genero,
      pais_origen: editForm.value.pais_origen,
      pais_residencia: editForm.value.pais_residencia,
      institucion: editForm.value.institucion,
      id_grado_academico: editForm.value.id_grado_academico,
      grado_academico: editForm.value.grado_academico,
      especialidad: editForm.value.especialidad
    });
    
    Swal.fire('Guardado', 'Los datos del usuario han sido actualizados', 'success');
    isEditingModal.value = false;
    await fetchUsuarios();
  } catch (error: any) {
    Swal.fire('Error', error.response?.data?.message || 'Error al guardar los datos', 'error');
  } finally {
    isSavingDetails.value = false;
  }
};

// ── Activar / Desactivar cuenta ────────────────────────────────────────────
const toggleEstado = async (user: any) => {
  const nuevoEstado = user.estado === 1 ? 0 : 1;
  const result = await Swal.fire({
    title: nuevoEstado === 0 ? 'Desactivar cuenta' : 'Activar cuenta',
    html: `
      <div class="space-y-4">
        <p>¿Confirmar cambio de estado de <b>${user.email}</b>?</p>
        <div class="flex items-center justify-center gap-2 mt-4">
          <input type="checkbox" id="swal-notificar" checked class="w-4 h-4 cursor-pointer">
          <label for="swal-notificar" class="text-sm cursor-pointer">Notificar por correo electrónico</label>
        </div>
      </div>
    `,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Confirmar',
    cancelButtonText: 'Cancelar',
    preConfirm: () => {
      return (document.getElementById('swal-notificar') as HTMLInputElement).checked;
    }
  });
  
  if (!result.isConfirmed) return;
  const notificar = result.value;

  try {
    await usuariosService.update(user.id, { estado: nuevoEstado } as any, notificar);
    user.estado = nuevoEstado;
    historialStore.registrar('usuario', 'editar', `Cambió estado de ${user.email} a ${nuevoEstado === 1 ? 'Activo' : 'Inactivo'} (Notificar: ${notificar})`, { entidadId: user.id, entidadNombre: user.email });
    Swal.fire('¡Éxito!', 'Estado actualizado.', 'success');
  } catch (error: any) {
    Swal.fire('Error', error.response?.data?.message || 'No se pudo actualizar el estado.', 'error');
  }
};

// ── ELIMINACIÓN DE CUENTA ──────────────────────────────────────────────────
const eliminarProgramada = async (user: any) => {
  const result = await Swal.fire({
    title: '¿Programar eliminación?',
    html: `
      <div class="space-y-4 text-left px-4">
        <p>La cuenta de <b>${user.email}</b> será desactivada ahora y eliminada físicamente de forma automática en 30 días.</p>
        <div class="flex items-center gap-2 mt-4 p-3 bg-slate-50 dark:bg-white/5 rounded-xl">
          <input type="checkbox" id="swal-notificar-del" checked class="w-4 h-4 cursor-pointer">
          <label for="swal-notificar-del" class="text-xs font-bold uppercase cursor-pointer">Notificar al usuario por correo</label>
        </div>
      </div>
    `,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, programar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#e11d48',
    preConfirm: () => {
      return (document.getElementById('swal-notificar-del') as HTMLInputElement).checked;
    }
  });

  if (!result.isConfirmed) return;
  const notificar = result.value;

  try {
    await usuariosService.delete(user.id, notificar);
    Swal.fire('Programado', 'La cuenta se eliminara definitivamente en 30 días.', 'success');
    fetchUsuarios();
  } catch (err: any) {
    Swal.fire('Error', err.response?.data?.message || 'No se pudo programar la eliminación.', 'error');
  }
};

const eliminarInmediata = async (user: any) => {
  const result = await Swal.fire({
    title: '¿ELIMINACIÓN DEFINITIVA?',
    text: `Esta acción es IRREVERSIBLE. Se borrarán todos los datos de ${user.email} de forma inmediata.`,
    icon: 'error',
    showCancelButton: true,
    confirmButtonText: 'SÍ, BORRAR AHORA',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#991b1b',
  });

  if (!result.isConfirmed) return;

  try {
    await usuariosService.eliminarFisico(user.id);
    Swal.fire('Eliminado', 'Usuario borrado permanentemente.', 'success');
    fetchUsuarios();
  } catch (err: any) {
    Swal.fire('Error', err.response?.data?.message || 'No se pudo realizar la eliminación.', 'error');
  }
};

// ── Reportes ───────────────────────────────────────────────────────────────
const exportarExcel = () => {
  const contentHtml = `
    <tr><td colspan="4" style="background-color: #10b981; color: white; font-weight: bold; font-size: 16pt; text-align: center;">DIRECTORIO DE USUARIOS</td></tr>
    <tr style="background-color: #ecfdf5; font-weight: bold;"><td>Nombre</td><td>Email</td><td>Roles</td><td>Estado</td></tr>
    ${usuariosFiltrados.value.map(u => `<tr><td>${u.persona?.nombres || ''} ${u.persona?.primer_apellido || ''}</td><td>${u.email}</td><td>${getRoles(u).join(', ')}</td><td>${u.estado === 1 ? 'Activo' : 'Inactivo'}</td></tr>`).join('')}
  `;
  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head><meta charset="utf-8"><style>td { border: 1px solid #cbd5e1; font-family: sans-serif; font-size: 10pt; }</style></head>
    <body><table>${contentHtml}</table></body></html>
  `;
  const blob = new Blob(['\uFEFF', html], { type: 'application/vnd.ms-excel' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Reporte_Usuarios_${new Date().toISOString().slice(0, 10)}.xls`;
  a.click();
  window.URL.revokeObjectURL(url);
  Swal.fire({ toast: true, icon: 'success', title: 'Excel Generado', timer: 2000, showConfirmButton: false });
};

const exportarPDF = async () => {
  try {
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    const doc = new jsPDF();
    
    doc.setFillColor(16, 185, 129); // emerald-500
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('DIRECTORIO DE USUARIOS', 105, 25, { align: 'center' });
    
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(10);
    doc.text(`Generado el: ${new Date().toLocaleString()}`, 105, 50, { align: 'center' });

    const head = [['NOMBRE', 'EMAIL', 'ROLES', 'ESTADO']];
    const body = usuariosFiltrados.value.map(u => [
      `${u.persona?.nombres || ''} ${u.persona?.primer_apellido || ''}`, 
      u.email, 
      getRoles(u).join(', '),
      u.estado === 1 ? 'Activo' : 'Inactivo'
    ]);

    autoTable(doc, {
      head,
      body,
      startY: 60,
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 3 }
    });

    doc.save(`Reporte_Usuarios_${new Date().toISOString().slice(0, 10)}.pdf`);
    Swal.fire({ toast: true, icon: 'success', title: 'PDF Generado', timer: 2000, showConfirmButton: false });
  } catch (e) {
    Swal.fire('Error', 'No se pudo generar el PDF.', 'error');
  }
};

onMounted(() => { fetchUsuarios(); fetchPlantillas(); });

</script>

<template>
  <div class="space-y-8 animate-in fade-in duration-500">

    <!-- HEADER -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-3 mb-2">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-rose-800 flex items-center justify-center shadow-lg shadow-red-900/50">
            <span class="material-symbols-outlined text-white text-[22px]">manage_accounts</span>
          </div>
          <div>
            <p class="text-[10px] font-black text-red-600 dark:text-red-500 uppercase tracking-widest leading-none">Administración</p>
            <h1 class="text-2xl font-black text-slate-800 dark:text-white tracking-tight uppercase italic">Directorio de Usuarios</h1>
            <p v-if="!isLoading" class="text-[9px] font-bold text-slate-500 mt-1 uppercase tracking-tighter">
              Total: {{ usuarios.length }} | Filtrados: {{ usuariosFiltrados.length }}
            </p>
          </div>
        </div>
        <p class="text-slate-500 text-sm ml-1">Crea, administra y asigna roles desde un solo lugar</p>
      </div>
      <div class="flex items-center gap-3">
        <!-- Selector de plantilla de bienvenida -->
        <div class="hidden md:flex items-center gap-2 bg-slate-50 dark:bg-white/5 px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10">
          <span class="material-symbols-outlined text-slate-400 text-sm">mail</span>
          <select v-model="selectedTemplateId"
                  class="bg-transparent text-[11px] font-bold text-slate-600 dark:text-slate-300 outline-none cursor-pointer min-w-[150px]">
            <option value="">Plantilla por Defecto (admission)</option>
            <option v-for="p in plantillasCorreo" :key="p.id" :value="String(p.id)">{{ p.nombre }}</option>
          </select>
          <button @click="openMailPreview" class="w-6 h-6 flex items-center justify-center text-blue-500 hover:bg-blue-500/10 rounded-lg transition-all" title="Previsualizar plantilla">
            <span class="material-symbols-outlined text-[17px]">visibility</span>
          </button>
        </div>
        <button @click="isCreating = true"
                class="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-red-600/20 hover:-translate-y-1 transition-all">
          <span class="material-symbols-outlined text-[18px]">person_add</span>
          Nuevo Usuario
        </button>
      </div>
    </div>

    <!-- FILTROS -->
    <div class="bg-white dark:bg-[#13131f] border border-slate-200 dark:border-white/5 rounded-2xl p-5">
      <div class="flex flex-wrap items-center gap-4">
        <div class="flex-1 min-w-[250px] relative">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400">search</span>
          <input v-model="filtroTexto" type="text" placeholder="Buscar usuario..."
                 class="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm outline-none focus:border-red-600/50 transition-all" />
        </div>
        <select v-model="filtroRol" class="px-4 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold uppercase outline-none">
          <option value="">Todos los roles</option>
          <option v-for="rol in rolesDisponibles" :key="rol.id" :value="rol.id">{{ rol.nombre }}</option>
        </select>
        
        <div class="flex items-center gap-2 ml-auto">
          <button @click="exportarExcel" title="Exportar a Excel" class="bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white px-3 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-1 transition-all">
            <span class="material-symbols-outlined text-[16px]">grid_on</span> Excel
          </button>
          <button @click="exportarPDF" title="Exportar a PDF" class="bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white px-3 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-1 transition-all">
            <span class="material-symbols-outlined text-[16px]">picture_as_pdf</span> PDF
          </button>
        </div>
      </div>
    </div>

    <!-- TABLA -->
    <div class="bg-white dark:bg-[#13131f] border border-slate-200 dark:border-white/5 rounded-[2rem] overflow-hidden">
      <div v-if="isLoading" class="flex justify-center items-center py-16">
        <span class="material-symbols-outlined animate-spin text-3xl text-red-600">progress_activity</span>
      </div>
      <div v-else class="overflow-x-auto">
        <table class="w-full text-left">
          <thead class="bg-slate-50 dark:bg-white/5 text-[10px] font-black text-slate-500 uppercase tracking-widest">
            <tr>
              <th class="px-6 py-4">Usuario</th>
              <th class="px-6 py-4">Cédula / CI</th>
              <th class="px-6 py-4">Roles</th>
              <th class="px-6 py-4 text-center">Estado</th>
              <th class="px-6 py-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-white/5">
            <tr v-for="user in paginatedUsuarios" :key="user.id" class="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/20 text-red-600 flex items-center justify-center font-black text-sm">
                    {{ user.persona?.nombres?.charAt(0) || '?' }}
                  </div>
                  <div>
                    <p class="text-sm font-black text-slate-800 dark:text-white">{{ user.persona?.nombres }} {{ user.persona?.primer_apellido }}</p>
                    <p class="text-[10px] text-slate-500 font-bold uppercase">{{ user.email }}</p>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4">
                <span class="text-xs font-black font-mono text-slate-600 dark:text-slate-300">
                  {{ cleanCI(user.persona?.documento_identidad) }}
                </span>
              </td>
              <td class="px-6 py-4">
                <div class="flex gap-1 flex-wrap">
                  <span v-for="nombre in getRoles(user)" :key="nombre"
                        :class="[
                          nombre === 'Super Usuario' ? 'bg-red-600 text-white border-red-700 shadow-sm' :
                          nombre === 'Coordinador' ? 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800' :
                          nombre === 'Ponente' ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800' :
                          nombre === 'Logística' ? 'bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-400 dark:border-teal-800' :
                          'bg-slate-100 text-slate-600 border-slate-200 dark:bg-white/5 dark:text-slate-400 dark:border-white/10'
                        ]"
                        class="px-2 py-0.5 rounded border text-[9px] font-black uppercase tracking-wider">
                    {{ nombre }}
                  </span>
                  <span v-if="getRoles(user).length === 0" class="text-[9px] text-slate-400 italic">Sin rol</span>
                </div>
              </td>
              <td class="px-6 py-4 text-center">
                <div class="flex flex-col items-center gap-1">
                  <span :class="user.estado === 1 ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'text-red-500 bg-red-50 dark:bg-red-900/20'"
                        class="text-[9px] font-black uppercase px-2 py-1 rounded-full">
                    {{ user.estado === 1 ? 'ACTIVO' : 'INACTIVO' }}
                  </span>
                  <span v-if="user.fecha_eliminacion" class="text-[8px] bg-red-600 text-white px-2 py-0.5 rounded-full font-black animate-pulse uppercase">
                    Pendiente Borrado
                  </span>
                </div>
              </td>
              <td class="px-6 py-4">
                <div class="flex items-center justify-end gap-1">
                  <!-- Botón editar detalles -->
                  <button @click="abrirEditModal(user)"
                          title="Ver / Editar Detalles"
                          class="p-2 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-slate-400 hover:text-emerald-500 transition-all">
                    <span class="material-symbols-outlined text-[18px]">edit_document</span>
                  </button>
                  <!-- Botón gestionar roles -->
                  <button @click="abrirGestionRoles(user)"
                          title="Gestionar Roles"
                          class="p-2 rounded-lg hover:bg-sky-50 dark:hover:bg-sky-900/20 text-slate-400 hover:text-sky-500 transition-all">
                    <span class="material-symbols-outlined text-[18px]">verified_user</span>
                  </button>
                  <!-- Botón activar/desactivar -->
                  <button @click="toggleEstado(user)"
                          :title="user.estado === 1 ? 'Desactivar' : 'Activar'"
                          class="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-600 transition-all">
                    <span class="material-symbols-outlined text-[18px]">{{ user.estado === 1 ? 'lock' : 'lock_open' }}</span>
                  </button>
                  <!-- Botones de eliminación -->
                  <div class="flex items-center border-l border-slate-200 dark:border-white/10 ml-1 pl-1 gap-1">
                    <button @click="eliminarProgramada(user)"
                            v-if="!user.fecha_eliminacion"
                            title="Programar eliminación (30 días)"
                            class="p-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-400 hover:text-rose-600 transition-all">
                      <span class="material-symbols-outlined text-[18px]">delete_sweep</span>
                    </button>
                    <button @click="eliminarInmediata(user)"
                            v-if="authStore.esSuperUsuario"
                            title="Eliminar AHORA (Permanente)"
                            class="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 transition-all">
                      <span class="material-symbols-outlined text-[18px]">delete_forever</span>
                    </button>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Paginación Footer -->
      <div v-if="usuariosFiltrados.length > 0" class="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-slate-100 dark:border-gray-800 bg-slate-50 dark:bg-gray-800/30">
        <div class="flex items-center gap-3 text-xs font-bold text-slate-500">
          <span>Mostrar</span>
          <select v-model="itemsPerPage" class="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-lg px-2 py-1 outline-none focus:border-umsa-blue transition-colors">
            <option :value="10">10</option>
            <option :value="25">25</option>
            <option :value="50">50</option>
            <option :value="100">100</option>
          </select>
          <span>registros (Total: {{ usuariosFiltrados.length }})</span>
        </div>

        <div class="flex items-center gap-2">
          <button @click="currentPage--" :disabled="currentPage === 1" class="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 dark:border-gray-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-gray-800 hover:text-umsa-blue transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            <span class="material-symbols-outlined text-[16px]">chevron_left</span>
          </button>
          
          <div class="flex items-center gap-1">
            <span class="text-xs font-black text-primary-dark dark:text-white px-2">Página {{ currentPage }} de {{ totalPages }}</span>
          </div>

          <button @click="currentPage++" :disabled="currentPage === totalPages" class="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 dark:border-gray-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-gray-800 hover:text-umsa-blue transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            <span class="material-symbols-outlined text-[16px]">chevron_right</span>
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL: CREAR USUARIO -->
    <div v-if="isCreating" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
      <div class="bg-white dark:bg-[#0d0d14] w-full max-w-lg rounded-[2rem] border border-white/10 overflow-hidden animate-in zoom-in duration-300">
        <div class="p-8">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-xl font-black text-slate-800 dark:text-white uppercase italic">Crear Nuevo Acceso</h2>
            <button @click="isCreating = false" class="text-slate-400 hover:text-red-600 transition-colors">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>
          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-1">
                <label class="text-[10px] font-black text-slate-500 uppercase ml-2">Nombres *</label>
                <input v-model="formUsuario.nombres" type="text" class="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm dark:text-white outline-none focus:border-red-600/50" />
              </div>
              <div class="space-y-1">
                <label class="text-[10px] font-black text-slate-500 uppercase ml-2">Primer Apellido *</label>
                <input v-model="formUsuario.primer_apellido" type="text" class="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm dark:text-white outline-none focus:border-red-600/50" />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-1">
                <label class="text-[10px] font-black text-slate-500 uppercase ml-2">Segundo Apellido</label>
                <input v-model="formUsuario.segundo_apellido" type="text" class="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm dark:text-white outline-none focus:border-red-600/50" />
              </div>
              <div class="space-y-1">
                <label class="text-[10px] font-black text-slate-500 uppercase ml-2">Cédula / CI</label>
                <input v-model="formUsuario.documento_identidad" type="text" class="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm dark:text-white outline-none focus:border-red-600/50" />
              </div>
            </div>
            <div class="space-y-1">
              <label class="text-[10px] font-black text-slate-500 uppercase ml-2">Rol del Sistema *</label>
              <select v-model="formUsuario.id_rol" class="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm dark:text-white outline-none focus:border-red-600/50 font-bold uppercase">
                <option v-for="rol in rolesDisponiblesParaAsignar" :key="rol.id" :value="rol.id">{{ rol.nombre }}</option>
              </select>
            </div>
            <div class="space-y-1">
              <label class="text-[10px] font-black text-slate-500 uppercase ml-2">Correo Electrónico *</label>
              <input v-model="formUsuario.email" type="email" class="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm dark:text-white outline-none focus:border-red-600/50" />
            </div>
            <div class="space-y-1">
              <label class="text-[10px] font-black text-slate-500 uppercase ml-2">Contraseña Temporal *</label>
              <input v-model="formUsuario.password" type="password" placeholder="••••••••"
                     class="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm dark:text-white outline-none focus:border-red-600/50" />
            </div>

            <!-- Notificar checkbox -->
            <div class="col-span-1 md:col-span-2 pt-2 border-t border-slate-100 dark:border-white/5">
              <div class="flex items-center gap-2 cursor-pointer w-fit" @click="formUsuario.notificar = !formUsuario.notificar">
                <div :class="formUsuario.notificar ? 'bg-red-600 border-red-600' : 'bg-transparent border-slate-300 dark:border-slate-600'" 
                     class="w-5 h-5 rounded border flex items-center justify-center transition-colors">
                  <span v-if="formUsuario.notificar" class="material-symbols-outlined text-white text-[14px] font-bold">check</span>
                </div>
                <span class="text-[11px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors select-none">
                  Enviar correo con credenciales de acceso
                </span>
              </div>
            </div>
          </div>
          <!-- Botones -->
          <div class="flex items-center gap-3 pt-6 mt-4 border-t border-slate-100 dark:border-gray-800">
            <button type="button" @click="isCreating = false" :disabled="isSavingForm"
                    class="flex-1 px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-gray-700 text-slate-500 dark:text-gray-400 font-bold text-xs uppercase hover:bg-slate-50 dark:hover:bg-gray-800 hover:border-slate-300 dark:hover:border-gray-600 transition-all">
              Cancelar
            </button>
            <button type="submit" @click="handleSaveUsuario()" :disabled="isSavingForm"
                    class="flex-1 px-4 py-3 rounded-xl bg-umsa-blue text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:bg-blue-700 hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
              <span v-if="isSavingForm" class="material-symbols-outlined animate-spin text-[16px]">refresh</span>
              <span v-else class="material-symbols-outlined text-[16px]">person_add</span>
              {{ isSavingForm ? 'Guardando...' : 'Crear Usuario' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL: GESTIÓN DE ROLES MÚLTIPLES -->
    <div v-if="isGestionandoRoles && usuarioSeleccionado" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
      <div class="bg-white dark:bg-[#0d0d14] w-full max-w-md rounded-[2.5rem] border border-white/10 overflow-hidden animate-in zoom-in duration-300">
        <div class="p-8">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-xl font-black text-slate-800 dark:text-white uppercase italic">
              Gestionar Permisos
            </h2>
            <button @click="isGestionandoRoles = false" class="text-slate-400 hover:text-red-600 transition-colors">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>

          <!-- Info del usuario -->
          <div class="flex items-center gap-4 p-4 bg-slate-50 dark:bg-white/5 rounded-2xl mb-6 border border-slate-100 dark:border-white/5">
            <div class="w-12 h-12 rounded-full bg-sky-100 dark:bg-sky-900/30 text-sky-600 flex items-center justify-center font-black text-xl shadow-inner">
              {{ usuarioSeleccionado.persona?.nombres?.charAt(0) || '?' }}
            </div>
            <div>
              <p class="font-black text-slate-800 dark:text-white">{{ usuarioSeleccionado.persona?.nombres }} {{ usuarioSeleccionado.persona?.primer_apellido }}</p>
              <p class="text-[10px] text-slate-500 font-bold uppercase tracking-tight">{{ usuarioSeleccionado.email }}</p>
            </div>
          </div>

          <!-- Lista de Roles -->
          <div class="space-y-2 mb-6">
            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-3">Roles asignados al sistema</p>
            
            <div v-for="rol in rolesDisponiblesParaAsignar" :key="rol.id"
                 @click="toggleRolLocal(rol.id)"
                 :class="[
                   rolesTemp.includes(rol.id) 
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300' 
                    : 'border-slate-100 dark:border-white/5 bg-white dark:bg-white/3 text-slate-400 hover:border-red-200'
                 ]"
                 class="flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all group">
              <div class="flex items-center gap-3">
                <span class="material-symbols-outlined text-[20px]" 
                      :class="rolesTemp.includes(rol.id) ? 'text-red-500' : 'text-slate-300'">
                  {{ rolesTemp.includes(rol.id) ? 'check_circle' : 'radio_button_unchecked' }}
                </span>
                <span class="text-xs font-black uppercase tracking-wide">{{ rol.nombre }}</span>
              </div>
            </div>

            <div v-if="!authStore.esSuperUsuario" class="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-900/30 flex items-start gap-2">
              <span class="material-symbols-outlined text-blue-500 text-[18px]">info</span>
              <p class="text-[10px] text-blue-700 dark:text-blue-300 leading-snug">
                El rol <strong>Super Usuario</strong> solo puede ser asignado o removido por otro Super Usuario.
              </p>
            </div>
          </div>

          <!-- Opción de Notificación -->
          <div class="flex items-center gap-3 p-4 bg-slate-50 dark:bg-white/5 rounded-2xl mb-8 border border-slate-100 dark:border-white/5">
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" v-model="notificarRoles" class="sr-only peer">
              <div class="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-white/10 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-red-600"></div>
            </label>
            <span class="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-tight">Notificar cambios por correo</span>
          </div>

          <div class="flex gap-3">
            <button @click="guardarRoles" :disabled="rolesCargando"
                    class="flex-1 py-4 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-xl hover:-translate-y-1 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              <span v-if="rolesCargando" class="material-symbols-outlined animate-spin text-[16px]">refresh</span>
              Listo, Guardar Cambios
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Previsualización Correo de Bienvenida -->
    <div v-if="showPreviewModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div class="bg-white dark:bg-[#1a1a24] w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-white/10 flex flex-col max-h-[90vh]">
        <div class="p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-black/20">
          <h3 class="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
            <span class="material-symbols-outlined text-blue-500">mark_email_read</span>
            Vista Previa — Correo de Bienvenida
          </h3>
          <button @click="showPreviewModal = false" class="w-10 h-10 rounded-full hover:bg-slate-200 dark:hover:bg-white/10 flex items-center justify-center transition-all">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        <div class="flex-1 overflow-y-auto bg-slate-100 dark:bg-black/40 p-4 md:p-8">
          <div class="bg-white rounded-xl shadow-sm overflow-hidden mx-auto max-w-[600px] border border-slate-200">
            <div v-html="previewHtml"></div>
          </div>
        </div>
        <div class="p-4 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-black/20 text-center">
          <p class="text-[10px] text-slate-400 font-medium">※ Los datos mostrados son solo de ejemplo para previsualización.</p>
        </div>
      </div>
    </div>

    <!-- Modal Editar Detalles -->
    <div v-if="isEditingModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div class="bg-white dark:bg-[#0d0d14] w-full max-w-3xl rounded-[2rem] border border-white/10 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        <div class="p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
          <h2 class="text-xl font-black text-slate-800 dark:text-white uppercase italic flex items-center gap-2">
            <span class="material-symbols-outlined text-emerald-500">edit_document</span>
            Detalles del Usuario
          </h2>
          <button @click="isEditingModal = false" class="text-slate-400 hover:text-red-600 transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-50 dark:hover:bg-red-900/20">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <div class="flex-1 overflow-y-auto p-6 md:p-8">
          <div v-if="isLoadingDetails" class="flex flex-col items-center justify-center py-12">
            <span class="material-symbols-outlined animate-spin text-4xl text-emerald-500 mb-4">progress_activity</span>
            <p class="text-sm font-bold text-slate-500 uppercase tracking-widest">Cargando detalles...</p>
          </div>
          
          <div v-else class="space-y-8">
            
            <!-- Sección: Cuenta -->
            <div class="space-y-4">
              <h3 class="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-white/5 pb-2">Información de Cuenta</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="space-y-1">
                  <label class="text-[10px] font-black text-slate-500 uppercase ml-2">Correo Electrónico *</label>
                  <input v-model="editForm.email" type="email" class="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm dark:text-white outline-none focus:border-emerald-500/50" />
                </div>
                <div class="space-y-1">
                  <label class="text-[10px] font-black text-slate-500 uppercase ml-2">Estado del Perfil</label>
                  <div class="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 flex items-center gap-2">
                    <span :class="detallesUsuario?.persona?.perfil_completado ? 'text-emerald-500' : 'text-amber-500'" class="material-symbols-outlined text-[18px]">
                      {{ detallesUsuario?.persona?.perfil_completado ? 'check_circle' : 'pending' }}
                    </span>
                    <span class="text-sm font-bold" :class="detallesUsuario?.persona?.perfil_completado ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'">
                      {{ detallesUsuario?.persona?.perfil_completado ? 'Completado' : 'Incompleto' }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Sección: Datos Personales -->
            <div class="space-y-4">
              <h3 class="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-white/5 pb-2">Datos Personales</h3>
              
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="space-y-1">
                  <label class="text-[10px] font-black text-slate-500 uppercase ml-2">Nombres *</label>
                  <input v-model="editForm.nombres" type="text" class="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm dark:text-white outline-none focus:border-emerald-500/50" />
                </div>
                <div class="space-y-1">
                  <label class="text-[10px] font-black text-slate-500 uppercase ml-2">Primer Apellido *</label>
                  <input v-model="editForm.primer_apellido" type="text" class="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm dark:text-white outline-none focus:border-emerald-500/50" />
                </div>
                <div class="space-y-1">
                  <label class="text-[10px] font-black text-slate-500 uppercase ml-2">Segundo Apellido</label>
                  <input v-model="editForm.segundo_apellido" type="text" class="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm dark:text-white outline-none focus:border-emerald-500/50" />
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="space-y-1">
                  <label class="text-[10px] font-black text-slate-500 uppercase ml-2">Documento de Identidad (CI)</label>
                  <input v-model="editForm.documento_identidad" type="text" class="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm dark:text-white outline-none focus:border-emerald-500/50" />
                </div>
                <div class="space-y-1">
                  <label class="text-[10px] font-black text-slate-500 uppercase ml-2">Teléfono / Celular</label>
                  <input v-model="editForm.celular" type="text" class="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm dark:text-white outline-none focus:border-emerald-500/50" />
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="space-y-1">
                  <label class="text-[10px] font-black text-slate-500 uppercase ml-2">Fecha de Nacimiento</label>
                  <input v-model="editForm.fecha_nacimiento" type="date" class="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm dark:text-white outline-none focus:border-emerald-500/50" />
                </div>
                <div class="space-y-1">
                  <label class="text-[10px] font-black text-slate-500 uppercase ml-2">Género</label>
                  <select v-model="editForm.genero" class="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm dark:text-white outline-none focus:border-emerald-500/50">
                    <option :value="0">Masculino</option>
                    <option :value="1">Femenino</option>
                    <option :value="2">Prefiero no decirlo</option>
                  </select>
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="space-y-1">
                  <label class="text-[10px] font-black text-slate-500 uppercase ml-2">País de Origen</label>
                  <input v-model="editForm.pais_origen" type="text" class="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm dark:text-white outline-none focus:border-emerald-500/50" />
                </div>
                <div class="space-y-1">
                  <label class="text-[10px] font-black text-slate-500 uppercase ml-2">País de Residencia</label>
                  <input v-model="editForm.pais_residencia" type="text" class="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm dark:text-white outline-none focus:border-emerald-500/50" />
                </div>
              </div>
            </div>

            <!-- Sección: Datos Académicos -->
            <div class="space-y-4">
              <h3 class="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-white/5 pb-2">Información Institucional / Académica</h3>
              
              <div class="space-y-1">
                <label class="text-[10px] font-black text-slate-500 uppercase ml-2">Institución u Organización</label>
                <input v-model="editForm.institucion" type="text" class="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm dark:text-white outline-none focus:border-emerald-500/50" />
              </div>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="space-y-1">
                  <label class="text-[10px] font-black text-slate-500 uppercase ml-2">Grado Académico (Abreviado)</label>
                  <input v-model="editForm.grado_academico" type="text" placeholder="Ej: Lic. o MSc." class="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm dark:text-white outline-none focus:border-emerald-500/50" />
                </div>
                <div class="space-y-1">
                  <label class="text-[10px] font-black text-slate-500 uppercase ml-2">Especialidad / Disciplina</label>
                  <input v-model="editForm.especialidad" type="text" class="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm dark:text-white outline-none focus:border-emerald-500/50" />
                </div>
              </div>
            </div>

          </div>
        </div>

        <div class="p-6 border-t border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-[#13131f] flex items-center justify-end gap-3">
          <button @click="isEditingModal = false" :disabled="isSavingDetails"
                  class="px-6 py-3 rounded-xl border-2 border-slate-200 dark:border-gray-700 text-slate-500 font-bold text-xs uppercase hover:bg-slate-100 dark:hover:bg-gray-800 transition-all">
            Cancelar
          </button>
          <button @click="guardarDetalles" :disabled="isSavingDetails || isLoadingDetails"
                  class="px-8 py-3 rounded-xl bg-emerald-600 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
            <span v-if="isSavingDetails" class="material-symbols-outlined animate-spin text-[16px]">refresh</span>
            <span v-else class="material-symbols-outlined text-[16px]">save</span>
            {{ isSavingDetails ? 'Guardando...' : 'Guardar Cambios' }}
          </button>
        </div>

      </div>
    </div>

  </div>
</template>
