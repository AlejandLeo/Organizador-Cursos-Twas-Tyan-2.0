  <script setup lang="ts">
  import { computed } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { useEventoStore } from '@/stores/eventoStore';

  const { t } = useI18n();
  const eventoStore = useEventoStore();

  const organizadoresVisibles = computed(() => {
    const raw = eventoStore.activeEvento?.organizadores;
    if (raw == null) return [];
    const texto = String(raw).trim();
    if (!texto || texto === '[]' || texto === 'null') return [];
    try {
      const parsed = JSON.parse(texto);
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => (typeof item === 'string' ? item : item?.nombre))
          .map((item) => String(item || '').trim())
          .filter(Boolean);
      }
    } catch {
      /* texto plano */
    }
    return texto.split(/[,;\n]/).map((item) => item.trim()).filter(Boolean);
  });

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
        <p class="text-[10px] font-black uppercase tracking-[0.18em] text-sky-200 mb-8">
          Validado por la Universidad Mayor de San Andrés y la Facultad de Ciencias Puras y Naturales
        </p>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <!-- Columna de ubicación -->
          <div>
            <h3 class="font-bold text-lg mb-4 border-b-2 border-umsa-blue dark:border-blue-500 pb-2 inline-block">{{ t('footer.where_we_are') }}</h3>
            <p class="text-gray-300 leading-relaxed">{{ eventoStore.activeEvento?.direccion || eventoStore.activeEvento?.ubicacion || t('footer.address') }}</p>
          </div>
          
          <!-- Columna de contacto -->
          <div>
            <h3 class="font-bold text-lg mb-4 border-b-2 border-umsa-blue dark:border-blue-500 pb-2 inline-block">{{ t('footer.contact_us') }}</h3>
            <p v-if="eventoStore.activeEvento?.telefono" class="text-gray-300 leading-relaxed">{{ t('footer.phone') }}: {{ eventoStore.activeEvento.telefono }}</p>
            <p v-if="eventoStore.activeEvento?.email" class="text-gray-300 leading-relaxed">{{ t('footer.email') }}: {{ eventoStore.activeEvento.email }}</p>
            <p v-if="!eventoStore.activeEvento?.telefono && !eventoStore.activeEvento?.email" class="text-gray-300 leading-relaxed">www.umsa.bo · www.fcpn.edu.bo</p>
          </div>
          
          <!-- Columna de logos / Organización -->
          <div>
              <h3 class="font-bold text-lg mb-4 border-b-2 border-umsa-blue dark:border-blue-500 pb-2 inline-block">{{ t('footer.organization') }}</h3>
              
              <!-- Si el evento tiene organizadores personalizados -->
              <div v-if="organizadoresVisibles.length" class="text-gray-300 leading-relaxed font-semibold">
                {{ organizadoresVisibles.join(' · ') }}
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
      </div>
    </footer>
  </template>