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
    {
      path: '/ponente',
      component: () => import('../layouts/PonenteLayout.vue'),
      children: [
        {
          path: '',
          redirect: '/ponente/catalogo'
        },
        {
          path: 'catalogo',
          name: 'ponente-catalogo',
          component: () => import('../views/ponente/PonenteCatalogoView.vue'),
        },
        {
          path: 'datos',
          name: 'ponente-datos',
          component: () => import('../views/ponente/PonenteDatosView.vue'),
        },
        {
          path: 'curso',
          name: 'ponente-curso',
          component: () => import('../views/ponente/PonenteCursosView.vue'),
        },
        {
          path: 'curso/:id',
          name: 'ponente-curso-detalle',
          component: () => import('../views/ponente/PonenteCursoDetalleView.vue'),
        },
        {
          path: 'calificacion',
          name: 'ponente-calificacion',
          component: () => import('../views/ponente/PonenteCalificacionesView.vue'),
        },
        {
          path: 'certificados',
          name: 'ponente-certificados',
          component: () => import('../views/ponente/PonenteCertificadosView.vue'),
        }
      ]
    },
    {
      path: '/estudiante',
      component: () => import('../layouts/EstudianteLayout.vue'),
      children: [
        {
          path: '',
          name: 'estudiante-dashboard',
          component: () => import('../views/estudiante/EstudianteDashboard.vue'),
        },
        {
          path: 'catalogo',
          name: 'estudiante-catalogo',
          component: () => import('../views/estudiante/EstudianteCatalogoView.vue'),
        },
        {
          path: 'actividades',
          name: 'estudiante-actividades',
          component: () => import('../views/estudiante/EstudianteActividadesView.vue'),
        },
        {
          path: 'actividades/:id',
          name: 'estudiante-actividades-detalle',
          component: () => import('../views/estudiante/EstudianteActividadDetalleView.vue'),
        },
        {
          path: 'calificaciones',
          name: 'estudiante-calificaciones',
          component: () => import('../views/estudiante/EstudianteCalificacionesView.vue'),
        },
        {
          path: 'certificados',
          name: 'estudiante-certificados',
          component: () => import('../views/estudiante/EstudianteCertificadosView.vue'),
        }
      ]
    },
    // ... otras rutas
  ],
})

export default router
