<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useUIStore } from '@/stores/ui';
import Swal from 'sweetalert2';

const router = useRouter();
const authStore = useAuthStore();
const uiStore = useUIStore();

const navigate = (routeName: string) => {
  router.push({ name: routeName });
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

    authStore.cambiarRolActivo(otroRol);
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
      uiStore.isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
      'w-64 lg:w-72 bg-white dark:bg-gray-950 text-slate-600 dark:text-gray-300 flex flex-col px-4 py-8 fixed left-0 bottom-0 top-[75px] z-[110] border-r border-slate-200 dark:border-gray-800 overflow-y-auto transition-transform duration-300'
    ]">
    <div class="mb-8 p-5 bg-slate-50 dark:bg-gray-900 rounded-2xl border border-slate-100 dark:border-gray-800 shadow-sm relative overflow-hidden group">       
      <!-- Decorative color (UMSA Blue) -->
      <div class="absolute left-0 top-0 bottom-0 w-1 bg-umsa-blue dark:bg-blue-500"></div>

      <div class="flex items-center gap-3 mb-2">
        <div class="w-10 h-10 rounded-full bg-blue-100 dark:bg-gray-800 text-umsa-blue font-black flex items-center justify-center text-lg border border-blue-200 dark:border-gray-700 shadow-inner">
          {{ authStore.user?.persona?.nombres?.charAt(0) || 'P' }}
        </div>
        <div>
          <p class="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-0.5">Bienvenido</p>
          <h3 class="text-sm font-black text-slate-800 dark:text-white leading-tight uppercase">{{ authStore.user?.persona?.nombres || 'Ponente' }}</h3>
        </div>
      </div>
      <p class="text-[10px] text-umsa-blue dark:text-blue-400 mt-2 uppercase tracking-widest font-black bg-blue-50 w-max px-2 py-1 rounded-md dark:bg-gray-800 border border-blue-100 dark:border-gray-700">Expositor</p>
    </div>

    <nav class="space-y-1 flex-1">
      <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 mt-2 pl-2 border-b border-slate-100 dark:border-gray-800 pb-2">Mi área de Trabajo</p>

      <button @click="navigate('ponente-eventos'); uiStore.closeSidebar()"
        :class="[ $route.name === 'ponente-eventos' || $route.name === 'ponente-evento-detalle' ? 'nav-active bg-umsa-blue text-white shadow-lg shadow-umsa-blue/30' : 'hover:bg-slate-50 dark:hover:bg-gray-900 text-slate-500 hover:text-umsa-blue hover:translate-x-1' ]"
        class="w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all group mt-1">
        <span class="text-xs uppercase tracking-widest font-bold">Mis Eventos Asignados</span>
        <span class="material-symbols-outlined text-[18px] transition-colors" :class="[ $route.name === 'ponente-eventos' || $route.name === 'ponente-evento-detalle' ? 'text-white' : 'text-slate-400 group-hover:text-umsa-blue' ]">event</span>
      </button>

      <button @click="navigate('ponente-historial-notas'); uiStore.closeSidebar()"
        :class="[ $route.name === 'ponente-historial-notas' ? 'nav-active bg-umsa-blue text-white shadow-lg shadow-umsa-blue/30' : 'hover:bg-slate-50 dark:hover:bg-gray-900 text-slate-500 hover:text-umsa-blue hover:translate-x-1' ]"
        class="w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all group mt-1">
        <span class="text-xs uppercase tracking-widest font-bold">Historial de Notas</span>
        <span class="material-symbols-outlined text-[18px] transition-colors" :class="[ $route.name === 'ponente-historial-notas' ? 'text-white' : 'text-slate-400 group-hover:text-umsa-blue' ]">history_edu</span>
      </button>


      <button @click="navigate('ponente-certificados'); uiStore.closeSidebar()"
        :class="[ $route.name === 'ponente-certificados' ? 'nav-active bg-umsa-blue text-white shadow-lg shadow-umsa-blue/30' : 'hover:bg-slate-50 dark:hover:bg-gray-900 text-slate-500 hover:text-umsa-blue hover:translate-x-1' ]"
        class="w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all group mt-1">
        <span class="text-xs uppercase tracking-widest font-bold">Mis Certificados</span>
        <span class="material-symbols-outlined text-[18px] transition-colors" :class="[ $route.name === 'ponente-certificados' ? 'text-white' : 'text-slate-400 group-hover:text-umsa-blue' ]">workspace_premium</span>
      </button>
    </nav>

    <!-- CAMBIO DE CONTEXTO DE ROL -->
    <div v-if="authStore.tieneMultiplesRoles" class="mt-6 pt-4 border-t border-slate-100 dark:border-gray-800">
      <button @click="cambiarRol"
        class="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-gray-900 border border-transparent">
        <span class="text-[10px] uppercase tracking-widest">Cambiar Rol</span>
        <span class="material-symbols-outlined text-[18px]">cached</span>
      </button>
    </div>

  </aside>
</template>
