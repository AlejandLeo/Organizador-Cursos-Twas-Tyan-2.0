  <script setup lang="ts">
  import { useI18n } from 'vue-i18n';
  import { useEventoStore } from '@/stores/eventoStore';

  const { t } = useI18n();
  const eventoStore = useEventoStore();

  const socialLinks = [
    { name: 'TWAS', href: 'https://twas.org/', img: '/images/TWAS_Logo.webp' },
    { name: 'TYAN', href: 'https://twas.org/tyan', img: '/images/TYAN.webp' },
    { name: 'Embajada de Brasil', href: 'https://www.gov.br/mre/pt-br/embaixada-la-paz', img: '/images/EmbajadaBrasil.png' },
  ];

  const universityLinks = [
      { name: 'UMSA', href: 'https://www.umsa.bo/', img: '/images/EscudoUMSA.png' },
      { name: 'FCPN', href: 'https://www.fcpn.edu.bo/', img: '/images/EscudoFCPN.webp' },
      { name: 'Carrera de Química', href: '#', img: '/images/CarreraQuimica.png' },
      { name: 'Ingeniería Química', href: '#', img: '/images/ing-quimica.jpg' },
  ]
  </script>

  <template>
  <footer id="footer" class="bg-primary-dark dark:bg-gray-900 text-white pt-16 pb-8 transition-colors duration-300">
      <div class="container mx-auto px-4 lg:px-8">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <!-- Columna de ubicación -->
          <div>
            <h3 class="font-bold text-lg mb-4 border-b-2 border-umsa-blue dark:border-blue-500 pb-2 inline-block">{{ t('footer.where_we_are') }}</h3>
            <p class="text-gray-300 leading-relaxed">{{ eventoStore.activeEvento?.direccion || eventoStore.activeEvento?.ubicacion || t('footer.address') }}</p>
          </div>
          
          <!-- Columna de contacto -->
          <div>
            <h3 class="font-bold text-lg mb-4 border-b-2 border-umsa-blue dark:border-blue-500 pb-2 inline-block">{{ t('footer.contact_us') }}</h3>
            <p class="text-gray-300 leading-relaxed">{{ t('footer.phone') }}: {{ eventoStore.activeEvento?.telefono || '+591 76706873' }}</p>
            <p class="text-gray-300 leading-relaxed">{{ t('footer.email') }}: {{ eventoStore.activeEvento?.email || 'lktejeda@umsa.bo' }}</p>
          </div>
          
          <!-- Columna de logos / Organización -->
          <div>
              <h3 class="font-bold text-lg mb-4 border-b-2 border-umsa-blue dark:border-blue-500 pb-2 inline-block">{{ t('footer.organization') }}</h3>
              
              <!-- Si el evento tiene organizadores personalizados -->
              <div v-if="eventoStore.activeEvento?.organizadores" class="text-gray-300 leading-relaxed font-semibold">
                {{ eventoStore.activeEvento.organizadores }}
              </div>

              <!-- Fallback: Logos Institucionales por defecto -->
              <template v-else>
                <div class="flex flex-wrap items-center gap-6 mb-4">
                    <a v-for="link in socialLinks" :key="link.name" :href="link.href" target="_blank" rel="noopener noreferrer">
                        <span class="hover:text-umsa-blue dark:hover:text-blue-400 font-semibold transition-colors">{{ link.name }}</span>
                    </a>
                </div>
                <div class="flex flex-wrap items-center gap-6">
                    <a v-for="link in universityLinks" :key="link.name" :href="link.href" target="_blank" rel="noopener noreferrer">
                        <span class="hover:text-umsa-blue dark:hover:text-blue-400 font-semibold transition-colors">{{ link.name }}</span>
                    </a>
                </div>
              </template>
          </div>
        </div>

        <div class="border-t border-gray-700 dark:border-gray-800 mt-12 pt-6 text-center text-gray-400 flex flex-col md:flex-row justify-between items-center gap-4">
          <p class="mb-0 text-sm md:text-base">{{ t('footer.rights') }} - BattleBread</p>
          <p class="text-sm md:text-base">{{ t('footer.developed_by') }} <a href="https://aiverke.github.io/BattleBread-Web-Site/" target="_blank" rel="noopener noreferrer" class="text-umsa-blue dark:text-blue-400 hover:text-blue-300 transition-colors font-medium hover:underline">BattleBread Academy</a></p>
        </div>
      </div>
    </footer>
  </template>