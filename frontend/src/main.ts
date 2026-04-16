import './style.css' // Importar Tailwindimport './style.css'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { i18n } from './i18n'

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(i18n as any) // "as any" evita el error de tipos de TypeScript con el Plugin de Vue

app.mount('#app')
