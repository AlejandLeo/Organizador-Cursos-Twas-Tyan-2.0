<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useUIStore } from '@/stores/ui';
import { computed } from 'vue';
import Swal from 'sweetalert2';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const uiStore = useUIStore();

const menuItems = [
  { name: 'Inicio', icon: 'dashboard', path: '/logistica' },
  { name: 'Asistencias (QR/PIN)', icon: 'qr_code_scanner', path: '/logistica/asistencia' },
  { name: 'Mis Certificados', icon: 'workspace_premium', path: '/logistica/certificados' },
];

const userName = computed(() => {
  const p = (authStore.user as any)?.persona;
  if (p) return `${p.nombres || ''} ${p.primer_apellido || ''}`.trim();
  return (authStore.user as any)?.email || 'Usuario';
});

const handleLogout = () => {
  authStore.logout();
  router.push('/login');
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
    uiStore.isSidebarOpen ? 'translate-x-0' : '-translate-x-full',
    'fixed top-[72px] bottom-0 left-0 w-72 bg-white dark:bg-[#0d0d14] border-r border-slate-200 dark:border-teal-900/30 z-[45] transition-all duration-300 shadow-2xl shadow-black/5'
  ]">
    <div class="h-full flex flex-col p-6 overflow-y-auto custom-scrollbar">
      <div class="mb-8 p-4 bg-teal-50 dark:bg-teal-900/20 rounded-2xl border border-teal-100 dark:border-teal-800 flex items-center gap-4">
        <div class="w-12 h-12 rounded-xl bg-teal-600 flex items-center justify-center shadow-lg shadow-teal-900/40 text-white">
          <span class="material-symbols-outlined text-[28px]">support_agent</span>
        </div>
        <div>
          <p class="text-[10px] font-black text-teal-600 dark:text-teal-400 uppercase tracking-widest leading-none">Personal de Apoyo</p>
          <h2 class="text-sm font-black text-slate-800 dark:text-white mt-1 leading-tight">{{ userName }}</h2>
        </div>
      </div>

      <nav class="flex-1 space-y-2">
        <div v-for="item in menuItems" :key="item.path">
          <router-link :to="item.path" 
            :class="[
              route.path === item.path 
                ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/30 border-teal-500 scale-105' 
                : 'text-slate-500 dark:text-gray-500 hover:bg-teal-50 dark:hover:bg-teal-900/20 hover:text-teal-600 dark:hover:text-teal-400 border-transparent',
              'flex items-center gap-4 px-5 py-4 rounded-2xl font-bold text-sm transition-all border group'
            ]">
            <span class="material-symbols-outlined transition-transform group-hover:scale-110">{{ item.icon }}</span>
            <span class="uppercase tracking-widest text-[11px]">{{ item.name }}</span>
          </router-link>
        </div>
      </nav>

      <div class="mt-auto pt-6 border-t border-slate-100 dark:border-gray-800 space-y-3">
        <button @click="cambiarRol" v-if="authStore.tieneMultiplesRoles"
          class="w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold text-sm text-slate-500 hover:bg-slate-50 dark:hover:bg-gray-900 transition-all border border-transparent group cursor-pointer">
          <span class="material-symbols-outlined text-teal-600">cached</span>
          <span class="uppercase tracking-widest text-[11px]">Cambiar Rol</span>
        </button>

        <button @click="handleLogout" 
          class="w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all border border-transparent group">
          <span class="material-symbols-outlined transition-transform group-hover:translate-x-1">logout</span>
          <span class="uppercase tracking-widest text-[11px]">Cerrar Sesión</span>
        </button>
      </div>
    </div>
  </aside>
</template>
