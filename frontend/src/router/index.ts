import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import LoginView from '../views/auth/LoginView.vue'
import RegisterView from '../views/auth/RegisterView.vue'
import DashboardLayout from '../layouts/DashboardLayout.vue'
import AdminLayout from '../layouts/AdminLayout.vue'
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
        {
          path: 'certificados',
          name: 'coordinador-certificados',
          component: () => import('../views/certificados/CertificadosView.vue'),
        },
        {
          path: 'eventos',
          name: 'coordinador-eventos',
          component: () => import('../views/eventos/EventosView.vue'),
        },
        {
          path: 'eventos/:id',
          name: 'coordinador-evento-detalle',
          component: () => import('../views/eventos/EventoDetalleView.vue'),
        },
        {
          path: 'eventos/nuevo',
          name: 'coordinador-evento-nuevo',
          component: () => import('../views/eventos/EventoNuevoView.vue'),
        },
      ]
    },
    // ─── RUTAS SUPER ADMINISTRADOR ───────────────────────────────────────────
    {
      path: '/admin',
      component: AdminLayout,
      children: [
        {
          path: '',
          name: 'admin-dashboard',
          component: () => import('../views/admin/AdminDashboardView.vue'),
        },
        {
          path: 'historial',
          name: 'admin-historial',
          component: () => import('../views/admin/AdminHistorialView.vue'),
        },
        {
          path: 'gestion',
          name: 'admin-gestion',
          component: () => import('../views/admin/AdminGestionView.vue'),
        },
        {
          path: 'eventos',
          name: 'admin-eventos',
          component: () => import('../views/admin/AdminGestionView.vue'),
        },
        {
          path: 'actividades',
          name: 'admin-actividades',
          component: () => import('../views/admin/AdminGestionView.vue'),
        },
        {
          path: 'actividades/:id',
          name: 'admin-actividades-detalle',
          component: () => import('../views/actividades/ActividadDetalleView.vue'),
        },
        {
          path: 'actividades/:id/certificado/workplace',
          name: 'admin-certificado-workplace',
          component: () => import('../views/actividades/CertificadoWorkplaceView.vue'),
        },
        {
          path: 'solicitudes',
          name: 'admin-solicitudes',
          component: () => import('../views/coordinador/CoordinadorSolicitudesView.vue'),
        },
        {
          path: 'certificados',
          name: 'admin-certificados',
          component: () => import('../views/certificados/CertificadosView.vue'),
        },
        {
          path: 'usuarios',
          name: 'admin-usuarios',
          component: () => import('../views/admin/AdminUsuariosView.vue'),
        },
        {
          path: 'estudiantes',
          name: 'admin-estudiantes',
          component: () => import('../views/directorios/EstudiantesGlobalView.vue'),
        },
        {
          path: 'ponentes',
          name: 'admin-ponentes',
          component: () => import('../views/directorios/PonentesGlobalView.vue'),
        },
      ]
    },
    // ─── RUTAS COORDINADOR ────────────────────────────────────────────────────
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
          path: 'actividad/:actividadId/calificaciones',
          name: 'ponente-actividad-calificaciones',
          component: () => import('../views/ponente/PonenteCalificacionesView.vue'),
        },
        {
          path: 'certificados',
          name: 'ponente-certificados',
          component: () => import('../views/ponente/PonenteCertificadosView.vue'),
        },
        {
          path: 'historial-notas',
          name: 'ponente-historial-notas',
          component: () => import('../views/ponente/PonenteHistorialNotasView.vue'),
        },
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
      return next({ name: 'login' });
    }

    // Cargar usuario si aún no está en memoria
    if (!authStore.user) {
      await authStore.fetchUser();
      if (!authStore.isAuthenticated) {
        return next({ name: 'login' });
      }
    }

    // ── Guard de roles ──────────────────────────────────────────────────
    const userRoles: string[] = (authStore.user as any)?.usuariosRoles?.map((ur: any) => ur.rol?.nombre_rol) || [];
    const rolIds: number[] = (authStore.user as any)?.usuariosRoles?.map((ur: any) => ur.rol?.id) || [];

    const isSuperAdmin = userRoles.includes('Super Usuario') || rolIds.includes(1);
    const isCoordinador = userRoles.includes('Coordinador');
    const isPonente = userRoles.includes('Ponente');

    // /admin → solo Super Admin
    if (to.path.startsWith('/admin') && !isSuperAdmin) {
      return next(isCoordinador ? '/coordinador' : isPonente ? '/ponente' : '/estudiante');
    }

    // /coordinador → solo Coordinador (o Super Admin que tiene acceso total)
    if (to.path.startsWith('/coordinador') && !isCoordinador && !isSuperAdmin) {
      return next(isPonente ? '/ponente' : '/estudiante');
    }

    // /ponente → solo Ponente (o superior)
    if (to.path.startsWith('/ponente') && !isPonente && !isSuperAdmin) {
      return next('/estudiante');
    }
  }


  next();
});

export default router
