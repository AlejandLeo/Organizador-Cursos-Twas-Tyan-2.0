import { createI18n } from 'vue-i18n'
import es from '../locales/es.json'
import en from '../locales/en.json'

export const i18n = createI18n({
  legacy: false, // Requerido para usar Composition API de Vue 3
  locale: localStorage.getItem('lang') || 'es', // Idioma por defecto
  fallbackLocale: 'en',
  messages: {
    es,
    en
  }
})
