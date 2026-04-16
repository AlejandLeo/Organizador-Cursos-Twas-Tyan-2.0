import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/auth/LoginView.vue'
import RegisterView from '../views/auth/RegisterView.vue'
import DashboardLayout from '../layouts/DashboardLayout.vue'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView,
    },
    {
      path: '/coordinador',
      component: DashboardLayout,
      children: [
        {
          path: '',
          name: 'coordinador-dashboard',
          component: () => import('../views/dashboard/CoordinadorView.vue'),
        },
        {
          path: 'actividades',
          name: 'coordinador-actividades',
          component: () => import('../views/actividades/ActividadesListView.vue'),
        },
        {
          path: 'actividades/:id',
          name: 'coordinador-actividades-detalle',
          component: () => import('../views/actividades/ActividadDetalleView.vue'),
        },
        {
          path: 'estudiantes',
          name: 'coordinador-estudiantes-global',
          component: () => import('../views/directorios/EstudiantesGlobalView.vue'),
        },
        {
          path: 'ponentes',
          name: 'coordinador-ponentes-global',
          component: () => import('../views/directorios/PonentesGlobalView.vue'),
        },
        {
          path: 'usuarios',
          name: 'coordinador-usuarios',
          component: () => import('../views/usuarios/UsuariosView.vue'),
        },
        {          path: 'certificados',
          name: 'coordinador-certificados',
          component: () => import('../views/certificados/CertificadosView.vue'),
        },
        {          path: 'eventos',
          name: 'coordinador-eventos',
          component: () => import('../views/eventos/EventosView.vue'),
        },

      ]
    },
    // ... otras rutas
  ],
})

export default router
