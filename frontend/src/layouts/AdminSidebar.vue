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

// Definimos el color temático según el rol
const themeColor = authStore.esSuperUsuario ? 'bg-red-600' : 'bg-blue-600';
const themeText = authStore.esSuperUsuario ? 'text-red-600' : 'text-blue-600';
const themeHover = authStore.esSuperUsuario ? 'hover:bg-red-50 dark:hover:bg-red-900/10' : 'hover:bg-blue-50 dark:hover:bg-blue-900/10';
const themeBorder = authStore.esSuperUsuario ? 'border-red-100 dark:border-red-900/20' : 'border-blue-100 dark:border-blue-900/20';
</script>

<template>
  <aside :class="[
    uiStore.isSidebarOpen ? 'translate-x-0' : '-translate-x-full',
    'w-72 bg-white dark:bg-[#0d0d14] text-slate-600 dark:text-slate-300 flex flex-col px-4 py-8 fixed left-0 bottom-0 top-[72px] z-[45] border-r border-slate-200 dark:border-white/5 overflow-y-auto transition-all duration-300 ease-in-out'
  ]">

    <!-- Perfil Dinámico -->
    <div :class="authStore.esSuperUsuario ? 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/20' : 'bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/20'" 
         class="mb-8 p-4 rounded-2xl border transition-colors duration-500">
      <div class="flex items-center gap-3 mb-2">
        <div :class="themeColor" class="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-colors">
          <span class="material-symbols-outlined text-white text-[20px]">
            {{ authStore.esSuperUsuario ? 'shield_person' : 'manage_accounts' }}
          </span>
        </div>
        <div>
          <p :class="themeText" class="text-[9px] font-black uppercase tracking-widest leading-none mb-1">
            {{ authStore.esSuperUsuario ? 'Super Usuario' : 'Coordinador' }}
          </p>
          <h3 class="text-xs font-black text-slate-800 dark:text-white leading-tight">
            {{ authStore.user?.persona?.nombres || 'Usuario' }}
          </h3>
        </div>
      </div>
      <div class="flex items-center gap-2 mt-3 pt-3 border-t border-slate-200 dark:border-white/10">
        <div :class="themeColor" class="w-2 h-2 rounded-full animate-pulse"></div>
        <span class="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
          SGEA | Acceso {{ authStore.esSuperUsuario ? 'Total' : 'Gestión' }}
        </span>
      </div>
    </div>

    <!-- Navegación Inteligente -->
    <nav class="space-y-1.5 flex-1">
      
      <!-- SECCIÓN: GENERAL -->
      <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 pl-2">General</p>

      <button @click="navigate('admin-dashboard')"
        :class="[isActive('admin-dashboard') ? `${themeColor} text-white shadow-md` : `text-slate-600 dark:text-slate-400 ${themeHover}`]"
        class="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all group font-bold">
        <div class="flex items-center gap-3">
          <span class="material-symbols-outlined text-[20px]">monitoring</span>
          <span class="text-[11px] uppercase tracking-wider">Dashboard</span>
        </div>
        <span class="material-symbols-outlined text-[16px] opacity-0 group-hover:opacity-100 transition-opacity">chevron_right</span>
      </button>

      <!-- HISTORIAL (Solo Superadmin) -->
      <button v-if="authStore.esSuperUsuario" @click="navigate('admin-historial')"
        :class="[isActive('admin-historial') ? 'bg-red-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/10']"
        class="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all group font-bold">
        <div class="flex items-center gap-3">
          <span class="material-symbols-outlined text-[20px]">history</span>
          <span class="text-[11px] uppercase tracking-wider">Historial Sistema</span>
        </div>
      </button>

      <!-- SECCIÓN: GESTIÓN (Específica por Rol) -->
      <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 mt-6 pl-2">Gestión Académica</p>

      <template v-if="authStore.esSuperUsuario">
        <button @click="navigate('admin-gestion')"
          :class="[isActive('admin-gestion') ? 'bg-red-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/10']"
          class="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all group font-bold">
          <div class="flex items-center gap-3">
            <span class="material-symbols-outlined text-[20px]">settings_suggest</span>
            <span class="text-[11px] uppercase tracking-wider">Gestión General</span>
          </div>
        </button>

        <button @click="navigate('admin-certificados-envio')"
          :class="[isActive('admin-certificados-envio') ? 'bg-red-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/10']"
          class="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all group font-bold">
          <div class="flex items-center gap-3">
            <span class="material-symbols-outlined text-[20px]">workspace_premium</span>
            <span class="text-[11px] uppercase tracking-wider">Certificados</span>
          </div>
        </button>
      </template>

      <template v-else>
        <!-- Vista Coordinador: Accesos Directos (Tus herramientas de siempre) -->
        <button @click="navigate('admin-eventos')"
          :class="[isActive('admin-eventos') ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-blue-900/10']"
          class="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all group font-bold">
          <div class="flex items-center gap-3">
            <span class="material-symbols-outlined text-[20px]">corporate_fare</span>
            <span class="text-[11px] uppercase tracking-wider">Eventos</span>
          </div>
        </button>



        <button @click="navigate('admin-solicitudes')"
          :class="[isActive('admin-solicitudes') ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-blue-900/10']"
          class="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all group font-bold">
          <div class="flex items-center gap-3">
            <span class="material-symbols-outlined text-[20px]">how_to_reg</span>
            <span class="text-[11px] uppercase tracking-wider">Solicitudes</span>
          </div>
        </button>

        <button @click="navigate('admin-certificados-envio')"
          :class="[isActive('admin-certificados-envio') ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-blue-900/10']"
          class="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all group font-bold">
          <div class="flex items-center gap-3">
            <span class="material-symbols-outlined text-[20px]">workspace_premium</span>
            <span class="text-[11px] uppercase tracking-wider">Certificados</span>
          </div>
        </button>
      </template>

      <!-- SECCIÓN: USUARIOS (Solo Superadmin) -->
      <template v-if="authStore.esSuperUsuario">
        <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 mt-6 pl-2">Sistema</p>

        <button @click="navigate('admin-usuarios')"
          :class="[isActive('admin-usuarios') ? `bg-red-600 text-white shadow-md` : `text-slate-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/10`]"
          class="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all group font-bold">
          <div class="flex items-center gap-3">
            <span class="material-symbols-outlined text-[20px]">manage_accounts</span>
            <span class="text-[11px] uppercase tracking-wider">Directorio Usuarios</span>
          </div>
        </button>

        <button @click="navigate('admin-grados-administrativos')"
          :class="[isActive('admin-grados-administrativos') ? `bg-red-600 text-white shadow-md` : `text-slate-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/10`]"
          class="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all group font-bold">
          <div class="flex items-center gap-3">
            <span class="material-symbols-outlined text-[20px]">badge</span>
            <span class="text-[11px] uppercase tracking-wider">Grados Administrativos</span>
          </div>
        </button>

        <button @click="navigate('admin-inscripciones-excel')"
          :class="[isActive('admin-inscripciones-excel') ? `bg-red-600 text-white shadow-md` : `text-slate-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/10`]"
          class="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all group font-bold">
          <div class="flex items-center gap-3">
            <span class="material-symbols-outlined text-[20px]">upload_file</span>
            <span class="text-[11px] uppercase tracking-wider">Carga Masiva (Excel)</span>
          </div>
        </button>
      </template>

    </nav>

    <!-- Logout -->
    <button @click="logout()" 
      class="mt-8 flex items-center gap-3 px-4 py-3 text-red-600 font-black uppercase text-[10px] tracking-widest hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all">
      <span class="material-symbols-outlined text-[20px]">logout</span>
      <span>Cerrar Sesión</span>
    </button>
  </aside>
</template>

