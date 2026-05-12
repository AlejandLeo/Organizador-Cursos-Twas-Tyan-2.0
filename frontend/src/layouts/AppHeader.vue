<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useEventoStore } from '../stores/eventoStore'
import { useUIStore } from '../stores/ui'
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'
import api from '../services/api'

const eventoStore = useEventoStore()
const uiStore = useUIStore()
const authStore = useAuthStore()
const router = useRouter()

const isDark = ref(false)

const versionActual = computed(() => {
  const current = eventoStore.versionesDisponibles.find(v => v.id === eventoStore.selectedEventoId);
  return current ? current.edicion : 'Sin Versión';
});
const notifications = ref({
  total: 0,
  accounts: 0,
  activities: [] as any[]
})
const showNotifications = ref(false)
const studentNotifications = ref([] as any[])
const showStudentNotifications = ref(false)
const coordinatorNotificationsRef = ref<HTMLElement | null>(null);
const studentNotificationsRef = ref<HTMLElement | null>(null);

const isCoordinadorOrAdmin = computed(() => {
  const roles = Array.isArray(authStore.user?.usuariosRoles) 
    ? authStore.user!.usuariosRoles.map((ur: any) => ur.rol?.nombre_rol) 
    : [];
  return roles.includes('Coordinador') || roles.includes('Super Usuario');
});

const isStudent = computed(() => {
  if (!authStore.user) return false;
  const roles = Array.isArray(authStore.user?.usuariosRoles) 
    ? authStore.user!.usuariosRoles.map((ur: any) => ur.rol?.nombre_rol) 
    : [];
  return roles.includes('Estudiante') || (!isCoordinadorOrAdmin.value);
});

const fetchNotifications = async () => {
  if (!isCoordinadorOrAdmin.value) return;
  try {
    const res = await api.get('/inscripciones/alertas-coordinador');
    notifications.value = res.data;
  } catch (error) {
    console.error('Error fetching coordinator notifications', error);
  }
}

const fetchStudentNotifications = async () => {
  if (!isStudent.value) return;
  console.log('--- ATTEMPTING TO FETCH STUDENT NOTIFICATIONS');
  try {
    const res = await api.get('/usuarios/alertas/estudiante');
    console.log('--- STUDENT NOTIFICATIONS RECEIVED:', res.data);
    studentNotifications.value = res.data;
  } catch (error) {
    console.error('Error fetching student notifications', error);
  }
}

const toggleDark = () => {
  isDark.value = !isDark.value
  document.documentElement.classList.toggle('dark', isDark.value)
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
}

const closeDropdowns = (e: MouseEvent) => {
  if (coordinatorNotificationsRef.value && !coordinatorNotificationsRef.value.contains(e.target as Node)) {
    showNotifications.value = false;
  }
  if (studentNotificationsRef.value && !studentNotificationsRef.value.contains(e.target as Node)) {
    showStudentNotifications.value = false;
  }
};

onMounted(async () => {
  await eventoStore.fetchEventosInfo();
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    isDark.value = true
    document.documentElement.classList.add('dark')
  }
  document.addEventListener('click', closeDropdowns);
})

onUnmounted(() => {
  document.removeEventListener('click', closeDropdowns);
})

// Reactivar fetch cuando el usuario esté listo o cambie
watch(() => isCoordinadorOrAdmin.value, (val) => {
  if (val) {
    fetchNotifications();
    setInterval(fetchNotifications, 60000);
  }
}, { immediate: true });

watch(() => isStudent.value, (val) => {
  console.log('--- IS STUDENT:', val);
  if (val) {
    fetchStudentNotifications();
    setInterval(fetchStudentNotifications, 60000);
  }
}, { immediate: true });

const onNombreChange = (event: Event) => {
  const target = event.target as HTMLSelectElement;
  eventoStore.setEventoPorNombre(target.value);
}
</script>

<template>
  <header class="fixed top-0 left-0 right-0 h-[75px] bg-white dark:bg-gray-900 border-b border-slate-200 dark:border-gray-800 z-[100] px-4 md:px-8 flex items-center justify-between shadow-sm transition-all duration-300">       
    <div class="flex items-center flex-1 space-x-4 md:space-x-6">
      
      <!-- Botón Menú Móvil -->
      <button @click="uiStore.toggleSidebar" class="flex-shrink-0 p-2 -ml-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors lg:hidden flex items-center justify-center">
        <span class="material-symbols-outlined text-2xl">{{ uiStore.isSidebarOpen ? 'menu_open' : 'menu' }}</span>
      </button>

      <!-- Logo -->
      <div class="flex flex-col flex-shrink-0 cursor-pointer border-r border-slate-200 dark:border-gray-800 pr-4 md:pr-6">
        <h2 class="text-primary-dark dark:text-white font-black italic text-xl md:text-2xl tracking-tighter leading-none">twas</h2>
        <p class="hidden md:block text-[6px] leading-tight text-primary-dark/60 dark:text-gray-400 uppercase font-bold tracking-tighter">The World Academy of Sciences</p>
      </div>

      <!-- Selector Móvil (Visible solo en móvil al lado del logo) -->
      <div class="lg:hidden flex-1 max-w-[180px] relative group/select ml-2">
        <select :value="eventoStore.selectedEventoNombre" @change="onNombreChange"
          style="text-align: left !important; text-align-last: left !important;"
          :class="[(eventoStore.activeEvento?.estado === 1 || eventoStore.activeEvento?.estado === 2) ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500 dark:border-emerald-600 text-emerald-700 dark:text-emerald-300' : 'bg-slate-100 dark:bg-gray-800 border-slate-300 dark:border-gray-700 text-slate-500 dark:text-gray-400']"
          class="w-full border text-[10px] font-black rounded-lg py-1.5 pl-2 pr-6 appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all truncate">
          <option v-for="(nombre, idx) in eventoStore.nombresEventos" :key="idx" :value="nombre">{{ nombre }}</option>
        </select>
        <span class="material-symbols-outlined absolute right-1 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">unfold_more</span>
      </div>

      <!-- Selectores (Sólo Escritorio - Vista Premium) -->
      <div class="hidden lg:flex items-center gap-4">
        <div class="relative group/select">
          <label class="absolute -top-2 left-3 bg-white dark:bg-gray-900 px-1 text-[8px] font-black text-slate-400 group-focus-within/select:text-emerald-500 uppercase tracking-[0.2em] z-10 transition-colors">Evento Académico</label>
          <div class="relative">
            <select :value="eventoStore.selectedEventoNombre" @change="onNombreChange"
              style="text-align: left !important; text-align-last: left !important;"
              :class="[(eventoStore.activeEvento?.estado === 1 || eventoStore.activeEvento?.estado === 2) ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500 dark:border-emerald-600 text-emerald-700 dark:text-emerald-300' : 'bg-slate-100 dark:bg-gray-800 border-slate-300 dark:border-gray-700 text-slate-500 dark:text-gray-400']"
              class="border text-xs font-black rounded-xl py-2.5 pl-12 pr-10 appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:shadow-lg focus:shadow-emerald-500/10 w-80 truncate cursor-pointer transition-all">
              <option v-for="(nombre, idx) in eventoStore.nombresEventos" :key="idx" :value="nombre">{{ nombre }}</option>
            </select>
            <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-xl pointer-events-none transition-colors"
              :class="[(eventoStore.activeEvento?.estado === 1 || eventoStore.activeEvento?.estado === 2) ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400']">event_seat</span>
            <span class="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 text-lg pointer-events-none group-hover/select:translate-y-[-40%] transition-transform">unfold_more</span>
          </div>
        </div>

        <div class="relative group/select" v-if="eventoStore.selectedEventoNombre">
          <label class="absolute -top-2 left-3 bg-white dark:bg-gray-900 px-1 text-[8px] font-black uppercase tracking-[0.2em] z-10 transition-colors"
            :class="[(eventoStore.activeEvento?.estado === 1 || eventoStore.activeEvento?.estado === 2) ? 'text-emerald-500' : 'text-slate-400']">Versión (Gestión)</label>
          <div class="relative">
            <div :class="[(eventoStore.activeEvento?.estado === 1 || eventoStore.activeEvento?.estado === 2) ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500 dark:border-emerald-600 text-emerald-700 dark:text-emerald-300' : 'bg-slate-100 dark:bg-gray-800 border-slate-300 dark:border-gray-700 text-slate-500 dark:text-gray-400']"
              class="border text-xs font-black rounded-xl py-2.5 pl-12 pr-10 w-64 transition-all flex items-center">
              {{ versionActual }}
            </div>
            <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-xl pointer-events-none transition-colors"
              :class="[(eventoStore.activeEvento?.estado === 1 || eventoStore.activeEvento?.estado === 2) ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400']">history_toggle_off</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Controles -->
    <div class="flex items-center space-x-2 md:space-x-4 shrink-0">
      
      <!-- Campanita de Notificaciones (Solo Coordinador/Admin) -->
      <div v-if="isCoordinadorOrAdmin" class="relative" ref="coordinatorNotificationsRef">
        <button @click="showNotifications = !showNotifications; showStudentNotifications = false" 
          class="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-full bg-slate-100 dark:bg-gray-800 text-slate-500 dark:text-gray-400 border border-slate-200 dark:border-gray-700 hover:bg-slate-200 dark:hover:bg-gray-700 transition-all relative">
          <span class="material-symbols-outlined text-[18px] md:text-[20px] transition-transform" :class="notifications.total > 0 ? 'animate-bounce' : ''">notifications</span>
          <span v-if="notifications.total > 0" class="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900 shadow-sm">
            {{ notifications.total }}
          </span>
        </button>

        <!-- Dropdown de Notificaciones -->
        <div v-if="showNotifications" 
          class="absolute right-0 mt-4 w-80 bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-slate-100 dark:border-gray-800 z-[200] overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
          <div class="p-6 border-b border-slate-100 dark:border-gray-800 flex justify-between items-center bg-slate-50/50 dark:bg-gray-800/50">
            <h3 class="text-xs font-black text-primary-dark dark:text-white uppercase tracking-widest">Gestión Académica</h3>
            <span class="text-[9px] font-bold text-slate-400 uppercase">{{ notifications.total }} Pendientes</span>
          </div>
          
          <div class="max-h-96 overflow-y-auto">
            <!-- Solicitudes de Registro -->
            <div v-if="notifications.accounts > 0" 
              @click="router.push('/coordinador/solicitudes'); showNotifications = false"
              class="p-5 hover:bg-slate-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer border-b border-slate-50 dark:border-gray-800 last:border-0 group">
              <div class="flex items-start gap-4">
                <div class="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
                  <span class="material-symbols-outlined">person_add</span>
                </div>
                <div class="flex-1">
                  <p class="text-[11px] font-black text-primary-dark dark:text-white uppercase leading-tight">Nuevos Registros</p>
                  <p class="text-[10px] text-slate-500 dark:text-gray-400 mt-1">Hay {{ notifications.accounts }} cuentas esperando aprobación.</p>
                </div>
              </div>
            </div>

            <!-- Solicitudes de Actividades -->
            <div v-for="act in notifications.activities" :key="act.id"
              @click="router.push(`/coordinador/gestion-eventos/${act.id}?tab=solicitudes`); showNotifications = false"
              class="p-5 hover:bg-slate-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer border-b border-slate-50 dark:border-gray-800 last:border-0 group">
              <div class="flex items-start gap-4">
                <div class="w-10 h-10 rounded-2xl bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center text-sky-600 dark:text-sky-400 group-hover:scale-110 transition-transform">
                  <span class="material-symbols-outlined">app_registration</span>
                </div>
                <div class="flex-1">
                  <p class="text-[11px] font-black text-primary-dark dark:text-white uppercase leading-tight">{{ act.nombre }}</p>
                  <p class="text-[9px] text-umsa-gold font-bold uppercase tracking-tighter">{{ act.eventoNombre }}</p>
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

      <!-- Campanita de Notificaciones (Estudiante / Usuario Regular) -->
      <div v-if="isStudent" class="relative" ref="studentNotificationsRef">
        <button @click="showStudentNotifications = !showStudentNotifications; showNotifications = false" 
          class="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-full bg-slate-100 dark:bg-gray-800 text-slate-500 dark:text-gray-400 border border-slate-200 dark:border-gray-700 hover:bg-slate-200 dark:hover:bg-gray-700 transition-all relative">
          <span class="material-symbols-outlined text-[18px] md:text-[20px]" :class="studentNotifications.some(n => n.prioridad === 'alta') ? 'animate-pulse text-primary-dark dark:text-white' : ''">notifications</span>
          <span v-if="studentNotifications.length > 0" class="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-gray-900 shadow-sm" :class="studentNotifications.some(n => n.prioridad === 'alta') ? 'animate-ping' : ''"></span>
          <span v-if="studentNotifications.length > 0" class="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-gray-900 shadow-sm"></span>
        </button>

        <!-- Dropdown Estudiante -->
        <div v-if="showStudentNotifications" 
          class="absolute right-0 mt-4 w-80 bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-slate-100 dark:border-gray-800 z-[200] overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
          <div class="p-6 border-b border-slate-100 dark:border-gray-800 flex justify-between items-center bg-slate-50/50 dark:bg-gray-800/50">
            <h3 class="text-xs font-black text-primary-dark dark:text-white uppercase tracking-widest">Notificaciones</h3>
            <span class="text-[9px] font-bold text-slate-400 uppercase">{{ studentNotifications.length }} Activas</span>
          </div>
          
          <div class="max-h-96 overflow-y-auto">
            <div v-for="notif in studentNotifications" :key="notif.id"
              @click="router.push('/estudiante/perfil'); showStudentNotifications = false"
              class="p-5 hover:bg-slate-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer border-b border-slate-50 dark:border-gray-800 last:border-0 group">
              <div class="flex items-start gap-4">
                <div :class="[
                  'w-10 h-10 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110',
                  notif.tipo === 'success' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                ]">
                  <span class="material-symbols-outlined">{{ notif.tipo === 'success' ? 'verified' : 'priority_high' }}</span>
                </div>
                <div class="flex-1">
                  <p class="text-[11px] font-black text-primary-dark dark:text-white uppercase leading-tight">{{ notif.titulo }}</p>
                  <p class="text-[10px] text-slate-500 dark:text-gray-400 mt-1 leading-relaxed">{{ notif.mensaje }}</p>
                  <div class="flex items-center gap-1 mt-2 text-[8px] font-bold text-slate-400 uppercase tracking-tighter">
                    <span class="material-symbols-outlined text-[10px]">schedule</span>
                    {{ new Date(notif.fecha).toLocaleDateString() }}
                  </div>
                </div>
              </div>
            </div>

            <div v-if="studentNotifications.length === 0" class="p-12 text-center">
              <span class="material-symbols-outlined text-4xl text-slate-200 dark:text-gray-800 mb-2">notifications_off</span>
              <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">No hay nuevas alertas</p>
            </div>
          </div>
        </div>
      </div>

      <button @click="toggleDark" class="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-full bg-slate-100 dark:bg-gray-800 text-slate-500 dark:text-gray-400 border border-slate-200 dark:border-gray-700">
        <span class="material-symbols-outlined text-[18px] md:text-[20px]">{{ isDark ? 'light_mode' : 'dark_mode' }}</span>
      </button>
      <div class="w-9 h-9 md:w-10 md:h-10 bg-slate-100 dark:bg-gray-800 border-2 border-white dark:border-gray-700 rounded-full flex items-center justify-center shadow-sm ring-2 ring-slate-200 dark:ring-gray-600 overflow-hidden">  
        <img src="https://upload.wikimedia.org/wikipedia/commons/a/af/Escudo_de_la_Universidad_Mayor_de_San_Andr%C3%A9s.png" alt="UMSA" class="h-full w-full object-cover">
      </div>
    </div>
  </header>
</template>

<style scoped>
.animate-in {
  animation: fadeIn 0.3s ease-out;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
