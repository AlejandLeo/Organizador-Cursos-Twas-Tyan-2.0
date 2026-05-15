<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter, useRoute } from 'vue-router';
import { useEventoStore } from '@/stores/eventoStore';
import { useAuthStore } from '@/stores/auth';
import { getImageUrl } from '@/services/api';

const { t, locale } = useI18n();
const router = useRouter();
const route = useRoute();
const eventoStore = useEventoStore();
const authStore = useAuthStore();

const navLinks = computed(() => [
  { name: t('navbar.home'), href: '#inicio' },
  { name: t('navbar.info'), href: '#informacion' },
  { name: t('navbar.organization'), href: '#organizacion' },
  { name: t('navbar.location'), href: '#ubicacion' },
  { name: t('navbar.contact'), href: '#footer' },
]);

const isMenuOpen = ref(false);
const isDark = ref(false);

const scrollTo = (selector: string) => {
  isMenuOpen.value = false;
  if (route.path !== '/') {
    router.push('/').then(() => {
      // Esperar a que la página de Home se monte antes de hacer scroll
      setTimeout(() => {
        const element = document.querySelector(selector);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 300);
    });
  } else {
    // Si ya estamos en el Home resolviendolo en vivo
    const element = document.querySelector(selector);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }
};

const toggleDark = () => {
  isDark.value = !isDark.value;
  if (isDark.value) {
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  } else {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  }
};

const toggleLang = () => {
  locale.value = locale.value === 'es' ? 'en' : 'es';
  localStorage.setItem('lang', locale.value);
};

onMounted(async () => {
  if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    isDark.value = true;
    document.documentElement.classList.add('dark');
  }
  
  // Asegurar que tenemos la info de los eventos para el logo/contacto
  console.log('AppNavbar mounted, checking eventos store...');
  if (eventoStore.eventosAplanados.length === 0) {
    console.log('Store empty, fetching eventos info...');
    await eventoStore.fetchEventosInfo();
  }
});
</script>

<template>
  <nav v-if="!authStore.isAuthenticated || ['/', '/login', '/register'].includes(route.path)" 
       class="fixed top-0 left-0 right-0 z-[100] transition-all duration-500 bg-white/90 dark:bg-[#020810]/95 backdrop-blur-lg border-b border-slate-200/50 dark:border-slate-800/50 shadow-md">
    <div class="w-full px-4 md:px-6">
      <div class="flex justify-between items-center h-16 md:h-18">
        
        <!-- SECCIÓN IZQUIERDA: IDENTIDAD DEL EVENTO (MINIMALISTA) -->
        <div class="flex items-center shrink-0 h-full">
          <RouterLink to="/" @click="scrollTo('#inicio')" class="flex items-center gap-2 group cursor-pointer">
            
            <!-- LOGO ESTÁTICO TRANSPARENTE -->
            <div class="relative flex items-center transition-all duration-300 group-hover:scale-105">
              <img src="/logo/logoOficial.png" 
                   class="h-10 md:h-12 w-auto object-contain dark:opacity-90 transition-all duration-300" alt="Logo Oficial" />
            </div>

            <!-- TEXTO DEL EVENTO (MINIATURA PREMIUM) -->
            <div class="flex flex-col items-start justify-center">
              <div :style="{ color: eventoStore.activeEvento?.color_principal || '#004a99' }"
                   class="text-sm md:text-lg font-black uppercase tracking-tighter italic leading-none transition-colors duration-500">
                {{ eventoStore.activeEvento?.sigla || 'SGEA' }}
              </div>
              <h1 class="text-[6px] md:text-[7px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em] leading-none max-w-[120px] md:max-w-[250px] truncate">
                {{ eventoStore.activeEvento?.nombre || 'Sistema de Gestión de Eventos y Actividades' }}
              </h1>
            </div>
          </RouterLink>
        </div>

        <!-- Middle: Navigation Links (Más Compactos) -->
        <div class="hidden lg:flex flex-1 justify-center px-1">
          <ul class="flex items-center gap-0.5">
            <li v-for="link in navLinks" :key="link.name">
              <a :href="link.href" 
                 @click.prevent="scrollTo(link.href)" 
                 class="relative px-3 py-1.5 text-[10px] xl:text-xs font-black text-slate-600 dark:text-slate-300 transition-all duration-500 uppercase tracking-widest hover:scale-105 rounded-lg group overflow-hidden">
                
                <span class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-lg"
                      :style="{ 
                        backgroundColor: isDark ? '#0ea5e908' : `${eventoStore.activeEvento?.color_principal || '#2563eb'}08`,
                        boxShadow: isDark 
                          ? `inset 0 0 8px #0ea5e915`
                          : `inset 0 0 8px ${eventoStore.activeEvento?.color_principal || '#2563eb'}15`
                      }"></span>
                
                <span class="relative z-10 transition-all duration-300 group-hover:text-slate-900 dark:group-hover:text-sky-300 dark:group-hover:[text-shadow:0_0_5px_rgba(14,165,233,0.6)]">
                  {{ link.name }}
                </span>
              </a>
            </li>
          </ul>
        </div>

        <!-- Right: Actions (Legibilidad y Tamaño Premium) -->
        <div class="flex items-center gap-2 md:gap-3 shrink-0">
          
          <!-- BOTÓN IDIOMA (TEXTO COMPLETO Y MÁS GRANDE) -->
          <button @click="toggleLang" class="hidden md:flex items-center gap-2 px-4 py-2 bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-white dark:hover:bg-slate-700 text-xs font-black uppercase tracking-widest transition-all shadow-sm">
            <span class="material-symbols-outlined text-base">language</span>
            <span>{{ t('navbar.language') }}</span>
          </button>

          <button @click="toggleDark" class="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100/80 dark:bg-slate-800/80 rounded-xl transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700 shadow-sm">
            <svg v-if="!isDark" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>
            <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
          </button>

          <!-- Botones de Acceso (Tamaño Premium) -->
          <div class="flex items-center gap-2 ml-1 md:ml-2">
            <router-link to="/register" 
                         class="hidden xl:flex items-center justify-center gap-2 px-6 py-2.5 text-white rounded-full font-black text-[11px] md:text-xs tracking-widest uppercase transition-all duration-300 hover:shadow-xl hover:scale-105 active:scale-95 shadow-md"
                         :style="{ 
                           background: isDark 
                             ? `linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)` 
                             : `linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)`,
                           boxShadow: isDark 
                             ? `0 4px 15px -1px rgba(14, 165, 233, 0.5)` 
                             : `0 4px 15px -1px rgba(14, 165, 233, 0.3)`
                         }">
              <span class="material-symbols-outlined text-lg">person_add</span>
              <span>{{ t('navbar.register') }}</span>
            </router-link>

            <router-link to="/login" 
                         class="hidden sm:flex items-center justify-center gap-2 px-8 py-2.5 text-white rounded-full font-black text-[11px] md:text-xs tracking-widest uppercase transition-all duration-300 hover:shadow-xl hover:scale-105 active:scale-95 ml-1 shadow-md"
                         :style="{ 
                           background: isDark 
                             ? `linear-gradient(135deg, ${eventoStore.activeEvento?.color_principal || '#004a99'} 0%, #001a35 100%)`
                           : `linear-gradient(135deg, ${eventoStore.activeEvento?.color_principal || '#002a52'} 0%, #010a14 100%)`,
                           boxShadow: isDark 
                             ? `0 6px 18px -3px rgba(14, 165, 233, 0.4)`
                             : `0 6px 18px -3px ${eventoStore.activeEvento?.color_principal ? eventoStore.activeEvento.color_principal + '55' : 'rgba(0,0,0,0.2)'}` 
                         }">
              <span class="material-symbols-outlined text-lg">lock</span>
              <span>{{ t('navbar.login') }}</span>
            </router-link>
          </div>
          
          <!-- LOGOS INSTITUCIONALES (TAMAÑO EQUILIBRADO) -->
          <div class="hidden sm:flex items-center gap-2 border-l pl-4 border-slate-200 dark:border-slate-800 ml-1">
             <a href="https://www.fcpn.edu.bo/" target="_blank" 
                class="w-10 h-10 flex items-center justify-center hover:scale-110 transition-all cursor-pointer">
               <img src="/logo/logoOficial.png" 
                    class="w-full h-full object-contain dark:opacity-90" alt="Logo Oficial" />
             </a>
             <a href="https://www.umsa.bo/" target="_blank" 
                class="w-10 h-10 rounded-full border border-slate-100 dark:border-slate-700 p-1 flex items-center justify-center bg-white dark:bg-slate-900 shadow-sm hover:scale-110 transition-all cursor-pointer">
               <img src="http://localhost:3000/uploads/logo/LOGO%20UMSA%20OFICIAL.png" 
                    class="w-full h-full object-contain dark:opacity-90" alt="UMSA" />
             </a>
          </div>

          <!-- BOTÓN MENÚ MÓVIL (HAMBURGUESA) -->
          <button @click="isMenuOpen = !isMenuOpen" 
                  class="lg:hidden p-2 ml-1 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all">
            <span class="material-symbols-outlined text-2xl">
              {{ isMenuOpen ? 'close' : 'menu' }}
            </span>
          </button>
        </div>
      </div>

      <!-- MENÚ MÓVIL DESPLEGABLE (PREMIUM) -->
      <div v-show="isMenuOpen" 
           class="lg:hidden absolute top-full left-0 right-0 bg-white/95 dark:bg-[#020810]/95 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden transition-all duration-300">
        <div class="px-6 py-8 flex flex-col gap-6">
          
          <!-- Enlaces de Navegación -->
          <ul class="flex flex-col gap-4">
            <li v-for="link in navLinks" :key="link.name">
              <a :href="link.href" 
                 @click.prevent="scrollTo(link.href)" 
                 class="flex items-center justify-between text-base font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest hover:text-sky-500 dark:hover:text-sky-400 transition-colors">
                {{ link.name }}
                <span class="material-symbols-outlined text-slate-400">chevron_right</span>
              </a>
            </li>
          </ul>

          <div class="h-px bg-slate-200 dark:bg-slate-800 w-full"></div>

          <!-- Acciones en Móvil -->
          <div class="flex flex-col gap-4">
            <div class="flex items-center gap-3">
              <button @click="toggleLang" class="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-black uppercase tracking-widest border border-slate-200 dark:border-slate-700">
                <span class="material-symbols-outlined text-lg">language</span>
                {{ t('navbar.language') }}
              </button>
              <button @click="toggleDark" class="p-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-700">
                <span class="material-symbols-outlined text-xl">{{ isDark ? 'light_mode' : 'dark_mode' }}</span>
              </button>
            </div>

            <router-link to="/register" 
                         @click="isMenuOpen = false"
                         class="flex items-center justify-center gap-3 py-4 text-white rounded-2xl font-black text-xs tracking-widest uppercase shadow-lg"
                         :style="{ background: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)' }">
              <span class="material-symbols-outlined">person_add</span>
              {{ t('navbar.register') }}
            </router-link>

            <router-link to="/login" 
                         @click="isMenuOpen = false"
                         class="flex items-center justify-center gap-3 py-4 text-white rounded-2xl font-black text-xs tracking-widest uppercase shadow-lg"
                         :style="{ 
                           background: `linear-gradient(135deg, ${eventoStore.activeEvento?.color_principal || '#004a99'} 0%, #001a35 100%)`
                         }">
              <span class="material-symbols-outlined">lock</span>
              {{ t('navbar.login') }}
            </router-link>
          </div>

          <!-- Logos Institucionales en Móvil -->
          <div class="flex justify-center items-center gap-6 pt-4">
             <img src="/logo/logoOficial.png" class="h-10 w-auto opacity-70" alt="Logo Oficial" />
             <img src="http://localhost:3000/uploads/logo/Logo%20UMSA.png" class="h-10 w-auto opacity-70" alt="UMSA" />
          </div>
        </div>
      </div>
    </div>
  </nav>
</template>