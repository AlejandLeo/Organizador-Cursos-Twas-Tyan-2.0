<script setup lang="ts">
import { RouterView, useRouter, useRoute } from 'vue-router';
import AdminSidebar from '@/layouts/AdminSidebar.vue';
import { useUIStore } from '@/stores/ui';
import { useAuthStore } from '@/stores/auth';
import { computed, ref, onMounted, onUnmounted } from 'vue';
import api from '@/services/api';

const uiStore = useUIStore();
const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();

const isSuperAdminTheme = computed(() => authStore.esSuperUsuario);
const themeBorder = computed(() => isSuperAdminTheme.value ? 'dark:border-red-900/30' : 'dark:border-blue-900/30');
const themeText = computed(() => isSuperAdminTheme.value ? 'text-red-400' : 'text-blue-400');
const themeHover = computed(() => isSuperAdminTheme.value ? 'hover:bg-red-900/20' : 'hover:bg-blue-900/20');
const themeGradient = computed(() => isSuperAdminTheme.value ? 'from-red-600 to-rose-800 shadow-red-900/50' : 'from-blue-600 to-sky-700 shadow-blue-900/50');
const themeLogoText = computed(() => isSuperAdminTheme.value ? 'text-red-600 dark:text-red-500' : 'text-blue-600 dark:text-blue-400');

// --- LÓGICA DE NOTIFICACIONES ---
interface CoordinatorActivity {
  id: number;
  nombre: string;
  eventoNombre: string;
  count: number;
}
interface CoordinatorNotifications {
  total: number;
  accounts: number;
  activities: CoordinatorActivity[];
}

const notifications = ref<CoordinatorNotifications>({ total: 0, accounts: 0, activities: [] });
const showNotifications = ref(false);
const isProfileOpen = ref(false);
const autoCloseTimer = ref<ReturnType<typeof setTimeout> | null>(null);
const coordinatorNotificationsRef = ref<HTMLElement | null>(null);
const profileRef = ref<HTMLElement | null>(null);

const startAutoClose = () => {
  if (autoCloseTimer.value) clearTimeout(autoCloseTimer.value);
  autoCloseTimer.value = setTimeout(() => { 
    showNotifications.value = false; 
    isProfileOpen.value = false;
  }, 10000);
};

const resetAutoClose = () => {
  if (showNotifications.value || isProfileOpen.value) startAutoClose();
};

const toggleNotifications = () => {
  showNotifications.value = !showNotifications.value;
  isProfileOpen.value = false;
  if (showNotifications.value) startAutoClose();
  else if (autoCloseTimer.value) clearTimeout(autoCloseTimer.value);
};

const toggleProfile = () => {
  isProfileOpen.value = !isProfileOpen.value;
  showNotifications.value = false;
  if (isProfileOpen.value) startAutoClose();
  else if (autoCloseTimer.value) clearTimeout(autoCloseTimer.value);
};

const handleLogout = () => {
  authStore.logout();
  router.push('/login');
};

const fetchNotifications = async () => {
  try {
    const res = await api.get('/inscripciones/alertas-coordinador');
    notifications.value = res.data;
  } catch (error) {
    console.error('Error fetching coordinator notifications', error);
  }
};

const closeDropdowns = (e: MouseEvent) => {
  if (coordinatorNotificationsRef.value && !coordinatorNotificationsRef.value.contains(e.target as Node)) {
    showNotifications.value = false;
  }
  if (profileRef.value && !profileRef.value.contains(e.target as Node)) {
    isProfileOpen.value = false;
  }
};

onMounted(() => {
  fetchNotifications();
  document.addEventListener('click', closeDropdowns);
});

onUnmounted(() => {
  document.removeEventListener('click', closeDropdowns);
  if (autoCloseTimer.value) clearTimeout(autoCloseTimer.value);
});
</script>

<template>
  <div :class="[uiStore.isDark ? 'dark' : '', 'min-h-screen bg-slate-100 dark:bg-[#0a0a0f] transition-colors duration-300 relative']">
    <!-- Admin Header -->
    <header :class="['fixed top-0 left-0 right-0 z-50 h-[72px] flex items-center justify-between px-6 bg-white dark:bg-[#0d0d14] border-b border-slate-200 shadow-sm dark:shadow-lg dark:shadow-black/40 transition-colors', themeBorder]">
      <div class="flex items-center gap-4">
        <button @click="uiStore.toggleSidebar()" :class="['w-10 h-10 flex items-center justify-center rounded-xl transition-all', themeText, themeHover]">
          <span class="material-symbols-outlined">menu</span>
        </button>
        <div class="flex items-center gap-3">
          <div :class="['w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center shadow-lg', themeGradient]">
            <span class="material-symbols-outlined text-white text-[16px]">
              {{ isSuperAdminTheme ? 'shield_person' : 'manage_accounts' }}
            </span>
          </div>
          <div class="hidden sm:block">
            <p :class="['text-[10px] font-black uppercase tracking-widest leading-none', themeLogoText]">Sistema SGEA</p>
            <h1 class="text-sm font-black text-slate-800 dark:text-white leading-tight">
              {{ isSuperAdminTheme ? 'Panel de Super Administrador' : 'Portal del Coordinador' }}
            </h1>
          </div>
        </div>
      </div>
      
      <div class="flex items-center gap-4">
        <!-- Campanita de Notificaciones -->
        <div class="relative" ref="coordinatorNotificationsRef">
          <button @click="toggleNotifications" 
            class="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-gray-800 text-slate-500 dark:text-gray-400 border border-slate-200 dark:border-gray-700 hover:bg-slate-200 dark:hover:bg-gray-700 transition-all relative shrink-0">
            <span class="material-symbols-outlined text-[18px] md:text-[20px] transition-transform" :class="notifications.total > 0 ? 'animate-bounce' : ''">notifications</span>
            <span v-if="notifications.total > 0" class="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900 shadow-sm">
              {{ notifications.total }}
            </span>
          </button>

          <!-- Dropdown de Notificaciones -->
          <div v-if="showNotifications" @mousemove="resetAutoClose"
            class="absolute right-0 mt-4 w-80 bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-slate-100 dark:border-gray-800 z-[200] overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
            <div class="p-6 border-b border-slate-100 dark:border-gray-800 flex justify-between items-center bg-slate-50/50 dark:bg-gray-800/50">
              <h3 class="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">Gestión Académica</h3>
              <span class="text-[9px] font-bold text-slate-400 uppercase">{{ notifications.total }} Pendientes</span>
            </div>
            
            <div class="max-h-96 overflow-y-auto">
              <!-- Solicitudes de Registro -->
              <div v-if="notifications.accounts > 0" 
                @click="router.push({ name: 'admin-solicitudes' }); showNotifications = false"
                class="p-5 hover:bg-slate-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer border-b border-slate-50 dark:border-gray-800 last:border-0 group">
                <div class="flex items-start gap-4">
                  <div class="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
                    <span class="material-symbols-outlined">person_add</span>
                  </div>
                  <div class="flex-1">
                    <p class="text-[11px] font-black text-slate-800 dark:text-white uppercase leading-tight">Nuevos Registros</p>
                    <p class="text-[10px] text-slate-500 dark:text-gray-400 mt-1">Hay {{ notifications.accounts }} cuentas esperando aprobación.</p>
                  </div>
                </div>
              </div>

              <!-- Solicitudes de Actividades -->
              <div v-for="act in notifications.activities" :key="act.id"
                @click="router.push({ name: 'admin-gestion-eventos-detalle', params: { id: act.id }, query: { tab: 'solicitudes' } }); showNotifications = false"
                class="p-5 hover:bg-slate-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer border-b border-slate-50 dark:border-gray-800 last:border-0 group">
                <div class="flex items-start gap-4">
                  <div class="w-10 h-10 rounded-2xl bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center text-sky-600 dark:text-sky-400 group-hover:scale-110 transition-transform">
                    <span class="material-symbols-outlined">app_registration</span>
                  </div>
                  <div class="flex-1">
                    <p class="text-[11px] font-black text-slate-800 dark:text-white uppercase leading-tight">{{ act.nombre }}</p>
                    <p class="text-[9px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-tighter">{{ act.eventoNombre }}</p>
                    <p class="text-[10px] text-slate-500 dark:text-gray-400 mt-1">Hay {{ act.count }} solicitudes de inscripción.</p>
                  </div>
                </div>
              </div>

              <div v-if="notifications.total === 0" class="p-12 text-center">
                <span class="material-symbols-outlined text-4xl text-slate-200 dark:text-gray-800 mb-2">notifications_off</span>
                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">No hay pendientes</p>
              </div>
            </div>
          </div>
        </div>

        <!-- BOTÓN MODO CLARO/OSCURO -->
        <button @click="uiStore.toggleTheme()" 
                class="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-gray-800 text-slate-500 dark:text-gray-400 border border-slate-200 dark:border-gray-700 hover:bg-slate-200 dark:hover:bg-gray-700 transition-all shadow-sm shrink-0">
          <span class="material-symbols-outlined text-[18px] md:text-[20px]">{{ uiStore.isDark ? 'light_mode' : 'dark_mode' }}</span>
        </button>

        <!-- Información del Usuario y Menú -->
        <div class="relative" ref="profileRef">
          <button @click="toggleProfile" class="flex items-center gap-3 pl-4 border-l border-slate-200 dark:border-gray-800 text-left hover:opacity-80 transition-opacity">
            <div class="hidden sm:block">
              <p :class="['text-[11px] font-black leading-tight truncate max-w-[150px] uppercase', themeText]">
                {{ authStore.user?.persona?.nombres || (isSuperAdminTheme ? 'Super Admin' : 'Coordinador') }}
              </p>
              <p class="text-[9px] font-bold text-slate-400 dark:text-gray-500 truncate max-w-[150px]">
                {{ authStore.user?.email || 'usuario@sgea.edu.bo' }}
              </p>
            </div>
            <div class="w-10 h-10 bg-slate-100 dark:bg-gray-800 border-2 border-white dark:border-gray-700 rounded-full flex items-center justify-center shadow-sm ring-2 ring-slate-100 dark:ring-gray-800 overflow-hidden shrink-0">  
              <span class="material-symbols-outlined text-xl text-slate-500 dark:text-gray-400">account_circle</span>
            </div>
            <span class="material-symbols-outlined text-slate-400 text-sm transition-transform duration-200 hidden sm:block" :class="[isProfileOpen ? 'rotate-180' : '']">expand_more</span>
          </button>

          <!-- Dropdown Menú Usuario -->
          <div v-if="isProfileOpen" @mousemove="resetAutoClose" class="absolute right-0 top-full mt-4 w-56 bg-white dark:bg-gray-900 border border-slate-100 dark:border-gray-800 rounded-2xl shadow-2xl overflow-hidden z-[200] animate-in fade-in slide-in-from-top-2 duration-200">
            <div class="p-4 border-b border-slate-100 dark:border-gray-800 bg-slate-50/50 dark:bg-gray-800/50 block sm:hidden">
               <span :class="['block text-[11px] font-black uppercase', themeText]">{{ authStore.user?.persona?.nombres || (isSuperAdminTheme ? 'Super Admin' : 'Coordinador') }}</span>
               <span class="block text-[9px] font-bold text-slate-400">{{ authStore.user?.email }}</span>
            </div>
            <div class="p-2 space-y-1">
              <button @click="$router.push({ name: 'admin-perfil' }); isProfileOpen = false" class="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-800 hover:text-blue-600 transition-colors flex items-center gap-3">
                <span class="material-symbols-outlined text-[18px]">badge</span>
                Mi Perfil
              </button>
              <button v-if="authStore.esSuperUsuario" @click="$router.push({ name: 'admin-configuracion' }); isProfileOpen = false" class="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-800 hover:text-red-600 transition-colors flex items-center gap-3">
                <span class="material-symbols-outlined text-[18px]">settings</span>
                Configuración del Sistema
              </button>
              <div class="h-px bg-slate-100 dark:bg-gray-800 my-1"></div>
              <button @click="handleLogout" class="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors flex items-center gap-3">
                <span class="material-symbols-outlined text-[18px]">logout</span>
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>

        <div v-if="authStore.esSuperUsuario" 
             class="px-3 py-1.5 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-700/40 rounded-full hidden lg:flex items-center gap-2">
          <div class="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
          <span class="text-[9px] font-black text-red-700 dark:text-red-400 uppercase tracking-widest">Acceso Total</span>
        </div>
      </div>
    </header>

    <AdminSidebar v-if="!route.meta.hideSidebar" />

    <!-- Mobile overlay -->
    <div v-if="uiStore.isMobile && uiStore.isSidebarOpen && !route.meta.hideSidebar"
         @click="uiStore.closeSidebar()"
         class="fixed inset-0 bg-black/70 backdrop-blur-sm z-[40] animate-in fade-in duration-300">
    </div>

    <main :class="[
            uiStore.isSidebarOpen && !uiStore.isMobile && !route.meta.hideSidebar ? 'ml-72' : 'ml-0',
            route.meta.fullWidth ? 'p-0 pt-[72px]' : 'p-4 md:p-10 pt-[88px] md:pt-[92px]',
            'transition-all duration-300 min-h-screen relative'
          ]">
      <div :class="route.meta.fullWidth ? 'w-full flex-grow' : 'max-w-7xl mx-auto'">
        <RouterView />
      </div>
    </main>
  </div>
</template>
