<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useUIStore } from '../stores/ui';
import { useEventoStore } from '../stores/eventoStore';
import Swal from 'sweetalert2';

const router = useRouter();
const authStore = useAuthStore();
const uiStore = useUIStore();
const eventoStore = useEventoStore();

console.log("=== DEBUG ROLES ===");
console.log("User:", authStore.user);
console.log("User Roles from store:", authStore.userRoles);
console.log("Tiene múltiples roles:", authStore.tieneMultiplesRoles);

const navigate = (routeName: string) => {
  uiStore.closeSidebar();
  router.push({ name: routeName });
};

const onNombreChange = (e: any) => {
  eventoStore.setEventoPorNombre(e.target.value);
};

const cambiarRol = async () => {
  const roles = authStore.userRoles;
  if (roles.length <= 1) return;

  let rolActual = '';
  const path = router.currentRoute.value.path;
  if (path.startsWith('/coordinador')) rolActual = 'Coordinador';
  else if (path.startsWith('/estudiante')) rolActual = 'Estudiante';
  else if (path.startsWith('/ponente')) rolActual = 'Ponente';
  else if (path.startsWith('/logistica')) rolActual = 'Logística';
  else if (path.startsWith('/admin')) rolActual = 'Super Usuario';

  if (roles.length === 2) {
    const otroRol = roles.find(r => r !== rolActual) || roles[0];
    let targetPath = '/estudiante';
    if (otroRol === 'Coordinador') targetPath = '/coordinador';
    else if (otroRol === 'Ponente') targetPath = '/ponente';
    else if (otroRol === 'Logística') targetPath = '/logistica';
    else if (otroRol === 'Super Usuario') targetPath = '/admin';

    authStore.cambiarRolActivo(otroRol as string);
    router.push(targetPath);
    uiStore.closeSidebar();
    return;
  }

  const rolConfig: Record<string, { label: string, path: string, icon: string, color: string }> = {
    'Coordinador': { label: 'Coordinador', path: '/coordinador', icon: 'manage_accounts', color: '#0ea5e9' },
    'Estudiante': { label: 'Estudiante', path: '/estudiante', icon: 'school', color: '#10b981' },
    'Ponente': { label: 'Expositor / Ponente', path: '/ponente', icon: 'co_present', color: '#3b82f6' },
    'Logística': { label: 'Personal de Apoyo', path: '/logistica', icon: 'support_agent', color: '#14b8a6' },
    'Super Usuario': { label: 'Administrador', path: '/admin', icon: 'shield_person', color: '#ef4444' }
  };

  const htmlButtons = roles.map(r => {
    const config = rolConfig[r] || { label: r, path: '/', icon: 'account_circle', color: '#64748b' };
    const isCurrent = r === rolActual;
    return `
      <button data-role="${r}" data-path="${config.path}" class="swal-role-btn w-full flex items-center justify-between p-4 mb-2.5 rounded-2xl border-2 transition-all ${
        isCurrent 
          ? 'border-slate-300 bg-slate-50 dark:bg-gray-800 opacity-60 cursor-default' 
          : 'border-slate-100 hover:border-blue-400 bg-white dark:bg-gray-900 cursor-pointer shadow-sm hover:shadow'
      }">
        <div class="flex items-center gap-3 text-left">
          <div class="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0" style="background-color: ${config.color}">
            <span class="material-symbols-outlined text-[20px]">${config.icon}</span>
          </div>
          <span class="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">${config.label}</span>
        </div>
        ${isCurrent ? '<span class="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest bg-slate-100 dark:bg-gray-800 px-2 py-1 rounded">Activo</span>' : '<span class="material-symbols-outlined text-slate-300 text-sm">chevron_right</span>'}
      </button>
    `;
  }).join('');

  Swal.fire({
    title: '<span class="text-[#003a70] dark:text-white uppercase font-black tracking-tight text-lg">Cambiar Portal de Acceso</span>',
    html: `
      <div class="text-left py-2">
        <p class="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">Selecciona el rol con el que deseas trabajar:</p>
        <div class="flex flex-col">${htmlButtons}</div>
      </div>
    `,
    showConfirmButton: false,
    showCancelButton: true,
    cancelButtonText: 'Cancelar',
    cancelButtonColor: '#64748b',
    didOpen: () => {
      const container = Swal.getHtmlContainer();
      if (container) {
        const buttons = container.querySelectorAll('.swal-role-btn');
        buttons.forEach(btn => {
          btn.addEventListener('click', () => {
            const role = btn.getAttribute('data-role');
            const targetPath = btn.getAttribute('data-path');
            if (role && targetPath && role !== rolActual) {
              authStore.cambiarRolActivo(role);
              router.push(targetPath);
              uiStore.closeSidebar();
              Swal.close();
            }
          });
        });
      }
    }
  });
};
</script>

<template>
  <aside :class="[
    uiStore.isSidebarOpen ? 'translate-x-0' : '-translate-x-full',
    'w-72 bg-white dark:bg-gray-950 text-slate-600 dark:text-gray-300 flex flex-col px-4 py-8 fixed left-0 bottom-0 top-[75px] z-[45] border-r border-slate-200 dark:border-gray-800 overflow-y-auto transition-all duration-300 ease-in-out'
  ]">

    <div class="mb-6 p-5 bg-slate-50 dark:bg-gray-900 rounded-2xl border border-slate-100 dark:border-gray-800 shadow-sm">
      <p class="text-[10px] uppercase tracking-widest text-umsa-blue dark:text-blue-400 font-bold mb-1">Bienvenido</p>
      <h3 class="text-sm font-black text-primary-dark dark:text-white leading-tight">
        {{ authStore.user?.persona?.nombres || 'Super' }} {{ authStore.user?.persona?.primer_apellido || 'Admin' }}
      </h3>
      <p class="text-xs text-slate-500 dark:text-gray-400 mt-1">
        {{ authStore.user?.persona?.segundo_apellido || 'Sistema' }}
      </p>

    </div>



    <nav class="space-y-1 flex-1">
      <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 mt-2 pl-2">Menú Principal</p>

      <button @click="navigate('coordinador-dashboard')"
        :class="[ $route.name === 'coordinador-dashboard' ? 'nav-active bg-umsa-blue text-white shadow-md shadow-umsa-blue/20' : 'hover:bg-slate-50 dark:hover:bg-gray-900 text-slate-500' ]"
        class="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all group">
        <span class="text-[10px] sm:text-xs uppercase tracking-wider font-bold">Dashboard</span>
        <span class="material-symbols-outlined text-[18px] transition-colors" :class="[ $route.name === 'coordinador-dashboard' ? 'text-white' : 'text-slate-400 group-hover:text-umsa-blue' ]">dashboard</span>        
      </button>

      <button @click="navigate('coordinador-gestion-eventos')"
        :class="[ $route.name === 'coordinador-gestion-eventos' ? 'nav-active bg-umsa-blue text-white shadow-md shadow-umsa-blue/20' : 'hover:bg-slate-50 dark:hover:bg-gray-900 text-slate-500' ]"
        class="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all group mt-2">
        <span class="text-[10px] sm:text-xs uppercase tracking-wider font-bold">Gestión de Eventos</span>
        <span class="material-symbols-outlined text-[18px] transition-colors" :class="[ $route.name === 'coordinador-gestion-eventos' ? 'text-white' : 'text-slate-400 group-hover:text-umsa-blue' ]">event_note</span>
      </button>

      <button @click="navigate('coordinador-solicitudes')"
        :class="[ $route.name === 'coordinador-solicitudes' ? 'nav-active bg-umsa-blue text-white shadow-md shadow-umsa-blue/20' : 'hover:bg-slate-50 dark:hover:bg-gray-900 text-slate-500' ]"
        class="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all group mt-2">
        <span class="text-[10px] sm:text-xs uppercase tracking-wider font-bold">Solicitudes y Asignación</span>
        <span class="material-symbols-outlined text-[18px] transition-colors" :class="[ $route.name === 'coordinador-solicitudes' ? 'text-white' : 'text-slate-400 group-hover:text-umsa-blue' ]">how_to_reg</span>
      </button>

      <button @click="navigate('coordinador-inscripciones-excel')"
        :class="[ $route.name === 'coordinador-inscripciones-excel' ? 'nav-active bg-umsa-blue text-white shadow-md shadow-umsa-blue/20' : 'hover:bg-slate-50 dark:hover:bg-gray-900 text-slate-500' ]"
        class="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all group mt-2">
        <span class="text-[10px] sm:text-xs uppercase tracking-wider font-bold">Importar Excel</span>
        <div class="flex items-center gap-2">
          <span class="text-[8px] font-black text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-full uppercase tracking-wider">Nuevo</span>
          <span class="material-symbols-outlined text-[18px] transition-colors" :class="[ $route.name === 'coordinador-inscripciones-excel' ? 'text-white' : 'text-slate-400 group-hover:text-umsa-blue' ]">upload_file</span>
        </div>
      </button>
      <p v-if="authStore.esAdmin" class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 mt-6 pl-2">Configuración</p>

      <button v-if="authStore.esAdmin" @click="navigate('coordinador-mail-templates')"
        :class="[ $route.name === 'coordinador-mail-templates' ? 'nav-active bg-umsa-blue text-white shadow-md shadow-umsa-blue/20' : 'hover:bg-slate-50 dark:hover:bg-gray-900 text-slate-500' ]"
        class="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all group mt-2">
        <span class="text-[10px] sm:text-xs uppercase tracking-wider font-bold">Plantillas de Correo</span>
        <span class="material-symbols-outlined text-[18px] transition-colors" :class="[ $route.name === 'coordinador-mail-templates' ? 'text-white' : 'text-slate-400 group-hover:text-umsa-blue' ]">mail</span>
      </button>

    </nav>

    <div class="mt-auto space-y-2">
      <button @click="cambiarRol" v-if="authStore.tieneMultiplesRoles"
        class="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-gray-900 border border-transparent">
        <span class="text-[10px] uppercase tracking-widest">Cambiar Rol</span>
        <span class="material-symbols-outlined text-[18px]">cached</span>
      </button>

      <button @click="authStore.logout(); router.push('/login')" class="flex items-center justify-between px-4 py-3.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl font-bold transition-all uppercase text-[10px] tracking-widest border border-red-100 dark:border-red-900/30 w-full group">
        <span>Cerrar Sesión</span>
        <span class="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform">logout</span>
      </button>
    </div>
  </aside>
</template>
