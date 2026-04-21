import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
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
          path: 'solicitudes',
          name: 'coordinador-solicitudes',
          component: () => import('../views/coordinador/CoordinadorSolicitudesView.vue'),
        },
        {
          path: 'actividades/:id',
          name: 'coordinador-actividades-detalle',
          component: () => import('../views/actividades/ActividadDetalleView.vue'),
        },
        {
          path: 'actividades/:id/certificado/workplace',
          name: 'coordinador-certificado-workplace',
          component: () => import('../views/actividades/CertificadoWorkplaceView.vue'),
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
          path: 'eventos',
          name: 'ponente-eventos',
          component: () => import('../views/ponente/PonenteEventosView.vue'),
        },
        {
          path: 'eventos/:evento_id/curso',
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
        },
        {
          path: 'perfil',
          name: 'estudiante-perfil',
          component: () => import('../views/estudiante/EstudiantePerfilView.vue'),
        }
      ]
    },
    // ... otras rutas
  ],
})

router.beforeEach(async (to, from, next) => {
  // Rutas que requieren estar autenticado
  const requireAuthPaths = ['/coordinador', '/ponente', '/estudiante'];
  
  const pathRequiresAuth = requireAuthPaths.some(path => to.path.startsWith(path));

  // Initialize store safely inside router hooks to prevent circular dependencies at load time
  const authStore = useAuthStore();

  if (pathRequiresAuth) {
    const token = localStorage.getItem('token');
    if (!token) {
      // No hay sesión activa, bloqueamos el acceso y mandamos al login
      return next({ name: 'login' });
    } else if (!authStore.user) {
      // Fetch fresh user dynamically with existing token before passing the guard
      await authStore.fetchUser();
      
      // If fetching the user fails, token is likely expired or invalid
      if (!authStore.isAuthenticated) {
         return next({ name: 'login' });
      }
    }
  }
  
  // Si no requiere autenticación o sí tiene token, lo dejamos continuar
  next();
});

export default router
