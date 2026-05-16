<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useUIStore } from '../stores/ui';
import { useAdminHistorialStore } from '../stores/adminHistorial';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const uiStore = useUIStore();
const historialStore = useAdminHistorialStore();

const navigate = (routeName: string) => {
  uiStore.closeSidebar();
  router.push({ name: routeName });
};

const logout = () => {
  authStore.logout?.();
  router.push('/login');
};

const isActive = (name: string) => route.name === name;
</script>

<template>
  <aside :class="[
    uiStore.isSidebarOpen ? 'translate-x-0' : '-translate-x-full',
    'w-72 bg-white dark:bg-[#0d0d14] text-slate-600 dark:text-slate-300 flex flex-col px-4 py-8 fixed left-0 bottom-0 top-[72px] z-[45] border-r border-slate-200 dark:border-red-900/20 overflow-y-auto transition-all duration-300 ease-in-out'
  ]">

    <!-- Perfil Admin -->
    <div class="mb-8 p-4 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-100 dark:border-red-900/30">
      <div class="flex items-center gap-3 mb-2">
        <div class="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center shadow-lg">
          <span class="material-symbols-outlined text-white text-[20px]">shield_person</span>
        </div>
        <div>
          <p class="text-[9px] font-black text-red-600 dark:text-red-400 uppercase tracking-widest leading-none mb-1">Super Admin</p>
          <h3 class="text-xs font-black text-slate-800 dark:text-white leading-tight">
            {{ authStore.user?.persona?.nombres?.split(' ')[0] || 'Admin' }}
            {{ authStore.user?.persona?.primer_apellido || '' }}
          </h3>
        </div>
      </div>
      <div class="flex items-center gap-2 mt-3 pt-3 border-t border-red-200/50 dark:border-red-800/30">
        <div class="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
        <span class="text-[9px] font-bold text-red-700 dark:text-red-400 uppercase tracking-widest">Acceso Total Activo</span>
      </div>
    </div>

    <!-- Navegación -->
    <nav class="space-y-1.5 flex-1">
      <p class="text-[9px] font-black text-slate-400 dark:text-red-900/60 uppercase tracking-widest mb-3 pl-2">General</p>

      <!-- Dashboard -->
      <button @click="navigate('admin-dashboard')"
        :class="[isActive('admin-dashboard') ? 'bg-red-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5']"
        class="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all group font-bold">
        <div class="flex items-center gap-3">
          <span class="material-symbols-outlined text-[20px]">monitoring</span>
          <span class="text-[11px] uppercase tracking-wider">Dashboard</span>
        </div>
        <span class="material-symbols-outlined text-[16px] opacity-0 group-hover:opacity-100 transition-opacity">chevron_right</span>
      </button>

      <!-- Historial -->
      <button @click="navigate('admin-historial')"
        :class="[isActive('admin-historial') ? 'bg-red-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5']"
        class="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all group font-bold">
        <div class="flex items-center gap-3">
          <span class="material-symbols-outlined text-[20px]">history</span>
          <span class="text-[11px] uppercase tracking-wider">Historial</span>
        </div>
        <div class="flex items-center gap-2">
          <span v-if="historialStore.totalPendientes > 0" 
                class="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white">
            {{ historialStore.totalPendientes }}
          </span>
          <span class="material-symbols-outlined text-[16px] opacity-0 group-hover:opacity-100 transition-opacity">chevron_right</span>
        </div>
      </button>

      <p class="text-[9px] font-black text-slate-400 dark:text-red-900/60 uppercase tracking-widest mb-3 mt-6 pl-2">Gestión Académica</p>

      <!-- Eventos -->
      <button @click="navigate('admin-eventos')"
        :class="[
          isActive('admin-eventos') || 
          (isActive('admin-gestion-eventos') && (route.query.edit || route.query.create))
          ? 'bg-red-600 text-white shadow-md' 
          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'
        ]"
        class="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all group font-bold">
        <div class="flex items-center gap-3">
          <span class="material-symbols-outlined text-[20px]">corporate_fare</span>
          <span class="text-[11px] uppercase tracking-wider">Eventos</span>
        </div>
      </button>

      <!-- Actividades -->
      <button @click="navigate('admin-actividades')"
        :class="[
          isActive('admin-actividades') || 
          isActive('admin-gestion-eventos-detalle') || 
          (isActive('admin-gestion-eventos') && (route.query.newAct || route.query.editAct))
          ? 'bg-red-600 text-white shadow-md' 
          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'
        ]"
        class="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all group font-bold mt-1">
        <div class="flex items-center gap-3">
          <span class="material-symbols-outlined text-[20px]">school</span>
          <span class="text-[11px] uppercase tracking-wider">Actividades</span>
        </div>
      </button>

      <!-- Solicitudes -->
      <button @click="navigate('admin-solicitudes')"
        :class="[isActive('admin-solicitudes') ? 'bg-red-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5']"
        class="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all group font-bold mt-1">
        <div class="flex items-center gap-3">
          <span class="material-symbols-outlined text-[20px]">notification_important</span>
          <span class="text-[11px] uppercase tracking-wider">Solicitudes</span>
        </div>
      </button>

      <!-- Gestión General -->
      <button @click="navigate('admin-gestion')"
        :class="[isActive('admin-gestion') ? 'bg-red-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5']"
        class="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all group font-bold mt-1">
        <div class="flex items-center gap-3">
          <span class="material-symbols-outlined text-[20px]">settings_suggest</span>
          <span class="text-[11px] uppercase tracking-wider">Gestión General</span>
        </div>
      </button>


      <p class="text-[9px] font-black text-slate-400 dark:text-red-900/60 uppercase tracking-widest mb-3 mt-6 pl-2">Usuarios</p>

      <!-- Directorio -->
      <button @click="navigate('admin-usuarios')"
        :class="[isActive('admin-usuarios') ? 'bg-red-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5']"
        class="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all group font-bold">
        <div class="flex items-center gap-3">
          <span class="material-symbols-outlined text-[20px]">manage_accounts</span>
          <span class="text-[11px] uppercase tracking-wider">Directorio</span>
        </div>
      </button>

      <!-- Inscripciones Excel -->
      <button @click="navigate('admin-inscripciones-excel')"
        :class="[isActive('admin-inscripciones-excel') ? 'bg-red-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5']"
        class="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all group font-bold mt-1">
        <div class="flex items-center gap-3">
          <span class="material-symbols-outlined text-[20px]">upload_file</span>
          <span class="text-[11px] uppercase tracking-wider">Importar Excel</span>
        </div>
        <span class="text-[9px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider">Nuevo</span>
      </button>

      <!-- Tickets de Soporte -->
      <button @click="navigate('admin-soporte')"
        :class="[isActive('admin-soporte') ? 'bg-red-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5']"
        class="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all group font-bold mt-1">
        <div class="flex items-center gap-3">
          <span class="material-symbols-outlined text-[20px]">support_agent</span>
          <span class="text-[11px] uppercase tracking-wider">Tickets de Soporte</span>
        </div>
        <span class="material-symbols-outlined text-[16px] opacity-0 group-hover:opacity-100 transition-opacity">chevron_right</span>
      </button>

    </nav>

    <!-- Logout -->
    <button @click="logout()" 
      class="mt-8 flex items-center gap-3 px-4 py-3 text-red-600 font-black uppercase text-[10px] tracking-widest hover:bg-red-50 rounded-xl transition-all">
      <span class="material-symbols-outlined text-[20px]">logout</span>
      <span>Cerrar Sesión</span>
    </button>
  </aside>
</template>
