<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useUIStore } from '@/stores/ui';
import api from '@/services/api';

const isProfileOpen = ref(false);
const isDark = ref(false);
const authStore = useAuthStore();
const uiStore = useUIStore();
const profilePhotoUrl = ref('');

const studentNotifications = ref([] as any[])
const showStudentNotifications = ref(false)

const toggleDark = () => {
  isDark.value = !isDark.value;
  document.documentElement.classList.toggle('dark', isDark.value);
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light');
};

const fetchStudentNotifications = async () => {
  try {
    const res = await api.get('/usuarios/alertas/estudiante');
    studentNotifications.value = res.data;
  } catch (error) {
    console.error('Error fetching student notifications', error);
  }
}

onMounted(async () => {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    isDark.value = true;
    document.documentElement.classList.add('dark');
  }

  fetchStudentNotifications();
  setInterval(fetchStudentNotifications, 60000);

  try {
    const photoRes = await api.get('/usuarios/perfil/foto', { responseType: 'blob' });
    if (profilePhotoUrl.value) URL.revokeObjectURL(profilePhotoUrl.value);
    profilePhotoUrl.value = URL.createObjectURL(photoRes.data);
  } catch (e) {
    profilePhotoUrl.value = '';
  }
});
</script>

<template>
  <header class="fixed top-0 left-0 right-0 h-[75px] bg-white dark:bg-gray-900 border-b border-slate-200 dark:border-gray-800 z-[100] px-4 md:px-8 flex items-center justify-between shadow-sm transition-colors duration-300">       
    <!-- Logo & Title matching Ponente -->
    <!-- Logo & Title -->
    <div class="flex items-center flex-1 space-x-4 md:space-x-6">
      <button @click="uiStore.toggleSidebar()" class="lg:hidden w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-50 dark:hover:bg-gray-800 text-slate-500">
        <span class="material-symbols-outlined text-[24px]">menu</span>
      </button>

      <div class="hidden sm:flex flex-col flex-shrink-0 cursor-pointer border-r border-slate-200 dark:border-gray-800 pr-6">
        <h2 class="text-primary-dark dark:text-white font-black italic text-2xl tracking-tighter leading-none">twas</h2>
        <p class="text-[6px] leading-tight text-primary-dark/60 dark:text-gray-400 uppercase font-bold tracking-tighter">The World Academy of Sciences</p>
      </div>

      <h1 class="text-xs md:text-sm font-black text-umsa-blue dark:text-blue-500 tracking-widest uppercase italic hidden md:block">
        Portal Estudiante
      </h1>
    </div>

    <!-- Center Search Bar (Hidden to match exact layout, but can be kept if wanted. I'll hide it for identical structural match) -->
    <div class="hidden md:flex flex-1 max-w-xl mx-8">
      <div class="relative w-full">
        <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
        <input 
          type="text" 
          placeholder="Buscar cursos, calificaciones..." 
          class="w-full bg-slate-50 dark:bg-gray-900 border-none rounded-xl pl-12 pr-4 py-3 
                 text-sm outline-none focus:ring-2 focus:ring-umsa-blue/50 focus:bg-white dark:focus:bg-gray-800 
                 transition-all text-slate-700 dark:text-gray-200 shadow-inner"
        />
      </div>
    </div>

    <!-- Actions & Profile -->
    <div class="flex items-center space-x-2 md:space-x-4">
      <button
        @click="toggleDark"
        class="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-gray-800 text-slate-500 dark:text-gray-400 hover:text-umsa-blue hover:bg-slate-100 dark:hover:text-blue-500 dark:hover:bg-gray-700 transition-all shadow-sm border border-slate-200 dark:border-gray-700 mx-1 md:mx-2"
        aria-label="Toggle Dark Mode"
      >
        <span class="material-symbols-outlined text-[20px]">{{ isDark ? 'light_mode' : 'dark_mode' }}</span>
      </button>

      <div class="relative">
        <button
          @click="showStudentNotifications = !showStudentNotifications"
          class="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-gray-800 text-slate-500 dark:text-gray-400 hover:text-umsa-blue hover:bg-slate-100 dark:hover:text-blue-500 dark:hover:bg-gray-700 transition-all shadow-sm border border-slate-200 dark:border-gray-700 relative"
          aria-label="Notificaciones"
        >
          <span class="material-symbols-outlined text-[22px]" :class="studentNotifications.some(n => n.prioridad === 'alta') ? 'animate-pulse text-primary-dark dark:text-white' : ''">notifications</span>
          <span v-if="studentNotifications.length > 0" class="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-gray-950" :class="studentNotifications.some(n => n.prioridad === 'alta') ? 'animate-ping' : ''"></span>
          <span v-if="studentNotifications.length > 0" class="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-gray-950"></span>
        </button>

        <!-- Dropdown Estudiante -->
        <div v-if="showStudentNotifications" @click.stop
          class="absolute right-0 mt-4 w-72 md:w-80 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-gray-800 z-[200] overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
          <div class="p-5 border-b border-slate-100 dark:border-gray-800 flex justify-between items-center bg-slate-50/50 dark:bg-gray-800/50">
            <h3 class="text-[10px] font-black text-primary-dark dark:text-white uppercase tracking-widest">Alertas del Sistema</h3>
            <span class="text-[8px] font-bold text-slate-400 uppercase bg-slate-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">{{ studentNotifications.length }}</span>
          </div>
          
          <div class="max-h-[60vh] overflow-y-auto overscroll-contain">
            <div v-for="notif in studentNotifications" :key="notif.id"
              @click="$router.push('/estudiante/perfil'); showStudentNotifications = false"
              class="p-4 hover:bg-slate-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer border-b border-slate-50 dark:border-gray-800 last:border-0 group">
              <div class="flex items-start gap-3">
                <div :class="[
                  'w-9 h-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 shrink-0',
                  notif.tipo === 'success' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                ]">
                  <span class="material-symbols-outlined text-[20px]">{{ notif.tipo === 'success' ? 'verified' : 'priority_high' }}</span>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-[10px] font-black text-primary-dark dark:text-white uppercase leading-tight truncate">{{ notif.titulo }}</p>
                  <p class="text-[9px] text-slate-500 dark:text-gray-400 mt-1 leading-relaxed">{{ notif.mensaje }}</p>
                  <div class="flex items-center gap-1 mt-2 text-[7px] font-bold text-slate-400 uppercase tracking-tighter">
                    <span class="material-symbols-outlined text-[10px]">schedule</span>
                    {{ new Date(notif.fecha).toLocaleDateString() }}
                  </div>
                </div>
              </div>
            </div>

            <div v-if="studentNotifications.length === 0" class="p-10 text-center">
              <span class="material-symbols-outlined text-4xl text-slate-200 dark:text-gray-800 mb-2">notifications_off</span>
              <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest">No hay nuevas alertas</p>
            </div>
          </div>
        </div>
      </div>
      
      <div class="w-px h-8 bg-slate-200 dark:bg-gray-800 mx-2 hidden sm:block"></div>
      
      <!-- Profile Button matched exactly to Ponente -->
      <div class="relative" @click.stop>
        <button @click="isProfileOpen = !isProfileOpen" class="flex items-center gap-2 md:gap-3 bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors rounded-xl pr-2 md:pr-3 py-1 pl-1 shadow-sm">
          <div class="h-8 w-8 rounded-full overflow-hidden bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 p-0 flex flex-shrink-0 items-center justify-center">
            <img v-if="profilePhotoUrl" :src="profilePhotoUrl" alt="Foto" class="w-full h-full object-cover" />
            <span v-else class="material-symbols-outlined text-2xl text-slate-400">account_circle</span>
          </div>
          <div class="hidden md:flex flex-col items-start pr-1">
            <span class="text-xs font-black text-primary-dark dark:text-white leading-tight">{{ authStore.user?.persona?.nombres || 'Usuario' }} {{ authStore.user?.persona?.primer_apellido || '' }}</span>
            <span class="text-[9px] uppercase tracking-widest text-slate-400 dark:text-gray-500 font-bold">Portal - Mi Perfil</span>
          </div>
          <span class="material-symbols-outlined text-slate-400 text-sm transition-transform duration-200" :class="[isProfileOpen ? 'rotate-180' : '']">expand_more</span>
        </button>

        <!-- Dropdown -->
        <div v-if="isProfileOpen" class="absolute right-0 top-full mt-2 w-[220px] bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
          
          <div class="p-4 border-b border-slate-100 dark:border-gray-800 bg-slate-50 dark:bg-gray-800/50 block md:hidden">
             <span class="block text-xs font-black text-primary-dark dark:text-white">{{ authStore.user?.persona?.nombres || 'Usuario' }} {{ authStore.user?.persona?.primer_apellido || '' }}</span>
             <span class="block text-[9px] uppercase tracking-widest text-slate-400 font-bold mt-0.5">Estudiante</span>
          </div>

          <div class="p-2 space-y-1">
            <button @click="$router.push('/estudiante/perfil')" class="w-full text-left px-3 py-2.5 rounded-lg text-xs font-bold text-slate-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-800 hover:text-umsa-blue transition-colors flex items-center gap-2">
              <span class="material-symbols-outlined text-[18px]">badge</span>
              Ver Perfil
            </button>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>