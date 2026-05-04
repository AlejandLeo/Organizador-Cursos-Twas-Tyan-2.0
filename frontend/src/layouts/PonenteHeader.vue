<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

import api from '@/services/api'
import Swal from 'sweetalert2'

const router = useRouter()
const authStore = useAuthStore()
const isDark = ref(false)
const isProfileOpen = ref(false)
const profileDropdownRef = ref<HTMLElement | null>(null)

// Notificaciones
const ponenteNotifications = ref([] as any[])
const showNotifications = ref(false)
const notificationsRef = ref<HTMLElement | null>(null)

const toggleDark = () => {
  isDark.value = !isDark.value
  document.documentElement.classList.toggle('dark', isDark.value)
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
}

const fetchNotifications = async () => {
  try {
    const res = await api.get('/usuarios/alertas/estudiante'); // Usamos el mismo endpoint
    ponenteNotifications.value = res.data;
  } catch (error) {
    console.error('Error fetching notifications', error);
  }
}

const handleLogout = () => {
  authStore.logout();
  router.push('/login');
};

const abrirSoporte = () => {
  Swal.fire({
    title: 'Centro de Soporte Tyan',
    html: `
      <div class="text-left space-y-4">
        <p class="text-sm text-slate-600 font-medium italic">¿En qué podemos ayudarte hoy?</p>
        
        <div class="space-y-2">
          <button id="btn-soporte-pass" class="w-full p-4 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-2xl flex items-center gap-3 transition-all group text-left">
            <span class="material-symbols-outlined text-blue-500 group-hover:scale-110 transition-transform">lock_reset</span>
            <span class="text-xs font-bold text-slate-700">He olvidado mi contraseña</span>
          </button>

          <button id="btn-soporte-datos" class="w-full p-4 bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-200 rounded-2xl flex items-center gap-3 transition-all group text-left">
            <span class="material-symbols-outlined text-amber-500 group-hover:scale-110 transition-transform">edit_note</span>
            <span class="text-xs font-bold text-slate-700">Hay un error en mis datos personales</span>
          </button>

          <button id="btn-soporte-otro" class="w-full p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl flex items-center gap-3 transition-all group text-left">
            <span class="material-symbols-outlined text-slate-400 group-hover:scale-110 transition-transform">help</span>
            <span class="text-xs font-bold text-slate-700">Tengo otro tipo de problema</span>
          </button>
        </div>
      </div>
    `,
    showConfirmButton: false,
    showCloseButton: true,
    didOpen: () => {
      const showTicketForm = (tipo: string) => {
        Swal.fire({
          title: 'Enviar Ticket de Soporte',
          html: `
            <div class="text-left space-y-4">
              <div class="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                <p class="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400">Asunto:</p>
                <p class="text-xs font-bold text-slate-700 dark:text-gray-300">${tipo}</p>
              </div>
              <div class="space-y-2">
                <label class="text-[10px] font-black uppercase text-slate-400 pl-1">Describe tu problema:</label>
                <textarea id="swal-ticket-msg" class="swal2-textarea w-full rounded-2xl border-slate-200 text-sm" placeholder="Escribe aquí los detalles..." style="margin: 0; height: 120px;"></textarea>
              </div>
            </div>
          `,
          showCancelButton: true,
          confirmButtonText: 'Enviar Ticket',
          cancelButtonText: 'Volver',
          confirmButtonColor: '#2563eb',
          showLoaderOnConfirm: true,
          preConfirm: async () => {
            const mensaje = (document.getElementById('swal-ticket-msg') as HTMLTextAreaElement).value;
            if (!mensaje) { Swal.showValidationMessage('Por favor describe el problema.'); return false; }
            try {
              await api.post('/soporte', { tipo, mensaje });
              return true;
            } catch (error) {
              Swal.showValidationMessage('Error al enviar el ticket. Intente más tarde.');
            }
          }
        }).then((result) => {
          if (result.isConfirmed) {
            Swal.fire({
              icon: 'success',
              title: 'Ticket Enviado',
              text: 'Tu solicitud ha sido enviada al SuperUsuario.',
              timer: 2000,
              showConfirmButton: false
            });
          } else if (result.dismiss === Swal.DismissReason.cancel) {
            abrirSoporte();
          }
        });
      };

      document.getElementById('btn-soporte-pass')?.addEventListener('click', () => showTicketForm('Olvidé mi contraseña'));
      document.getElementById('btn-soporte-datos')?.addEventListener('click', () => showTicketForm('Error en mis datos personales'));
      document.getElementById('btn-soporte-otro')?.addEventListener('click', () => showTicketForm('Otros problemas técnicos'));
    }
  });
};

const cambiarAEstudiante = () => {
  authStore.cambiarRolActivo('Estudiante');
  router.push('/estudiante');
};

const closeAll = (e: MouseEvent) => {
  if (profileDropdownRef.value && !profileDropdownRef.value.contains(e.target as Node)) {
    isProfileOpen.value = false
  }
  if (notificationsRef.value && !notificationsRef.value.contains(e.target as Node)) {
    showNotifications.value = false
  }
}

onMounted(() => {
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    isDark.value = true
    document.documentElement.classList.add('dark')
  }
  document.addEventListener('click', closeAll)
  fetchNotifications()
})

onUnmounted(() => {
  document.removeEventListener('click', closeAll)
})
</script>

<template>
  <header class="fixed top-0 left-0 right-0 h-[75px] bg-white dark:bg-gray-900 border-b border-slate-200 dark:border-gray-800 z-[100] px-4 md:px-8 flex items-center justify-between shadow-sm transition-colors duration-300">       
    <div class="flex items-center flex-1 space-x-6">
      <div class="hidden md:flex flex-col flex-shrink-0 cursor-pointer border-r border-slate-200 dark:border-gray-800 pr-6" @click="$router.push('/ponente')">
        <h2 class="text-primary-dark dark:text-white font-black italic text-2xl tracking-tighter leading-none">twas</h2>
        <p class="text-[6px] leading-tight text-primary-dark/60 dark:text-gray-400 uppercase font-bold tracking-tighter">The World Academy of Sciences</p>
      </div>

      <h1 class="text-base md:text-lg font-black text-umsa-blue dark:text-blue-500 tracking-widest uppercase italic hidden lg:block border-r border-slate-200 dark:border-gray-800 pr-6">
        Gestión Expositor
      </h1>
    </div>

    <div class="flex items-center space-x-2 md:space-x-4 pl-4 shrink-0">        
      <!-- Botón Modo Oscuro -->
      <button
        @click="toggleDark"
        class="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-gray-800 text-slate-500 dark:text-gray-400 hover:text-umsa-blue dark:hover:text-blue-500 transition-colors shadow-sm border border-slate-200 dark:border-gray-700"
      >
        <span class="material-symbols-outlined text-[20px]">{{ isDark ? 'light_mode' : 'dark_mode' }}</span>
      </button>

      <!-- Campanita de Notificaciones -->
      <div class="relative" ref="notificationsRef">
        <button
          @click="showNotifications = !showNotifications"
          class="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-gray-800 text-slate-500 dark:text-gray-400 hover:text-umsa-blue dark:hover:text-blue-500 transition-all shadow-sm border border-slate-200 dark:border-gray-700 relative"
        >
          <span class="material-symbols-outlined text-[22px]" :class="ponenteNotifications.some(n => n.prioridad === 'alta') ? 'animate-pulse text-primary-dark dark:text-white' : ''">notifications</span>
          <span v-if="ponenteNotifications.length > 0" class="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-gray-950"></span>
        </button>

        <!-- Dropdown Notificaciones -->
        <div v-if="showNotifications" @click.stop
          class="absolute right-0 mt-4 w-72 md:w-80 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-gray-800 z-[200] overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
          <div class="p-5 border-b border-slate-100 dark:border-gray-800 flex justify-between items-center bg-slate-50/50 dark:bg-gray-800/50">
            <h3 class="text-[10px] font-black text-primary-dark dark:text-white uppercase tracking-widest">Alertas del Ponente</h3>
            <span class="text-[8px] font-bold text-slate-400 uppercase bg-slate-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">{{ ponenteNotifications.length }}</span>
          </div>
          
          <div class="max-h-[60vh] overflow-y-auto overscroll-contain">
            <div v-for="notif in ponenteNotifications" :key="notif.id"
              @click="$router.push('/ponente/datos'); showNotifications = false"
              class="p-4 hover:bg-slate-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer border-b border-slate-50 dark:border-gray-800 last:border-0 group">
              <div class="flex items-start gap-3">
                <div :class="[
                  'w-9 h-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 shrink-0',
                  notif.tipo === 'success' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                ]">
                  <span class="material-symbols-outlined text-[20px]">{{ notif.tipo === 'success' ? 'verified' : 'info' }}</span>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-[10px] font-black text-primary-dark dark:text-white uppercase leading-tight truncate">{{ notif.titulo }}</p>
                  <p class="text-[9px] text-slate-500 dark:text-gray-400 mt-1 leading-relaxed">{{ notif.mensaje }}</p>
                </div>
              </div>
            </div>

            <div v-if="ponenteNotifications.length === 0" class="p-10 text-center">
              <span class="material-symbols-outlined text-4xl text-slate-200 dark:text-gray-800 mb-2">notifications_off</span>
              <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest">No hay nuevas alertas</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Menú Perfil SSA Style -->
      <div class="relative" ref="profileDropdownRef" @click.stop>
        <button @click="isProfileOpen = !isProfileOpen" class="flex items-center gap-2 md:gap-3 bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors rounded-xl pr-2 md:pr-3 py-1 pl-1 shadow-sm">
          <div class="h-8 w-8 rounded-full overflow-hidden bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 p-0.5 flex items-center justify-center">
            <span class="material-symbols-outlined text-2xl text-slate-400">account_circle</span>
          </div>
          <div class="hidden md:flex flex-col items-start pr-1">
            <span class="text-xs font-black text-primary-dark dark:text-white leading-tight">
              {{ authStore.user?.persona?.nombres || 'Ponente' }}
            </span>
            <span class="text-[9px] uppercase tracking-widest text-slate-400 dark:text-gray-500 font-bold">SSA - Mi Perfil</span>
          </div>
          <span class="material-symbols-outlined text-slate-400 text-sm transition-transform duration-200" :class="[isProfileOpen ? 'rotate-180' : '']">expand_more</span>
        </button>

        <!-- Dropdown flotante -->
        <div v-if="isProfileOpen" class="absolute right-0 top-full mt-2 w-[220px] bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
          
          <div class="p-2 space-y-1">
            <button @click="router.push('/ponente/datos')" class="w-full text-left px-3 py-2.5 rounded-lg text-xs font-bold text-slate-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-800 hover:text-umsa-blue transition-colors flex items-center gap-2">
              <span class="material-symbols-outlined text-[18px]">badge</span>
              Ver Perfil de Datos
            </button>

            <button @click="cambiarAEstudiante" class="w-full text-left px-3 py-2.5 rounded-lg text-xs font-bold text-slate-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-800 hover:text-umsa-blue transition-colors flex items-center gap-2">
              <span class="material-symbols-outlined text-[18px] text-blue-500">swap_horiz</span>
              Cambiar a Estudiante
            </button>

            <button @click="abrirSoporte" class="w-full text-left px-3 py-2.5 rounded-lg text-xs font-bold text-slate-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-800 hover:text-blue-600 transition-colors flex items-center gap-2">
              <span class="material-symbols-outlined text-[18px] text-slate-400">help</span>
              Ayuda y Soporte
            </button>

            <div class="h-[1px] bg-slate-100 dark:bg-gray-800 my-1"></div>

            <button @click="handleLogout" class="w-full text-left px-3 py-2.5 rounded-lg text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2">
              <span class="material-symbols-outlined text-[18px]">logout</span>
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>