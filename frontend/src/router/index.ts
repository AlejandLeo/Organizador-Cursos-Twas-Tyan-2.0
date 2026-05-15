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
          path: 'gestion-eventos',
          name: 'coordinador-gestion-eventos',
          component: () => import('../views/eventos/GestionEventoMaster.vue'),
        },
        {
          path: 'solicitudes',
          name: 'coordinador-solicitudes',
          component: () => import('../views/coordinador/CoordinadorSolicitudesView.vue'),
        },
        {
          path: 'gestion-eventos/:id',
          name: 'coordinador-gestion-eventos-detalle',
          component: () => import('../views/actividades/ActividadDetalleView.vue'),
        },
        {
          path: 'eventos/:id/certificado/workplace',
          name: 'coordinador-certificado-workplace-evento',
          component: () => import('../views/actividades/CertificadoWorkplaceView.vue'),
          meta: { hideSidebar: true, fullWidth: true }
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
          path: 'certificados/envio',
          name: 'coordinador-certificados-envio',
          component: () => import('../views/admin/AdminCertificadosEnvioView.vue'),
        },
        {
          path: 'eventos',
          name: 'coordinador-eventos',
          component: () => import('../views/eventos/ListaEventosView.vue'),
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
          component: () => import('../views/eventos/GestionEventoMaster.vue'),
        },
        {
          path: 'gestion-eventos',
          name: 'admin-gestion-eventos',
          component: () => import('../views/eventos/GestionEventoMaster.vue'),
        },
        {
          path: 'gestion-eventos/:id',
          name: 'admin-gestion-eventos-detalle',
          component: () => import('../views/actividades/ActividadDetalleView.vue'),
        },
        {
          path: 'eventos/:id/certificado/workplace',
          name: 'admin-certificado-workplace-evento',
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
          path: 'certificados/envio',
          name: 'admin-certificados-envio',
          component: () => import('../views/admin/AdminCertificadosEnvioView.vue'),
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
        {
          path: 'soporte',
          name: 'admin-soporte',
          component: () => import('../views/admin/AdminSoporteView.vue'),
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
        {
          path: 'actividad/:id/proyectar-qr',
          name: 'ponente-proyectar-qr',
          component: () => import('../views/ponente/PonenteProyectarQrView.vue'),
        },
        {
          path: 'actividad/:id/escanear-alumnos',
          name: 'ponente-escanear-alumnos',
          component: () => import('../views/ponente/PonenteEscanearEstudiantesView.vue'),
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
        },
        {
          path: 'mi-qr',
          name: 'estudiante-mi-qr',
          component: () => import('../views/estudiante/EstudianteMiQrView.vue'),
        },
        {
          path: 'marcar-asistencia',
          name: 'estudiante-marcar-asistencia',
          component: () => import('../views/estudiante/EstudianteMarcarAsistenciaView.vue'),
        }
      ]
    },
    {
      path: '/logistica',
      component: () => import('../layouts/LogisticaLayout.vue'),
      children: [
        {
          path: '',
          name: 'logistica-dashboard',
          component: () => import('../views/logistica/LogisticaDashboard.vue'),
        },
        {
          path: 'asistencia',
          name: 'logistica-asistencia',
          component: () => import('../views/logistica/LogisticaAsistenciaView.vue'),
        },
        {
          path: 'eventos',
          name: 'logistica-eventos',
          component: () => import('../views/logistica/LogisticaEventosView.vue'),
        },
        {
          path: 'usuarios',
          name: 'logistica-usuarios',
          component: () => import('../views/logistica/LogisticaUsuariosView.vue'),
        }
      ]
    },
  ],
})

router.beforeEach(async (to) => {
  const requireAuthPaths = ['/coordinador', '/ponente', '/estudiante', '/admin', '/logistica'];
  const pathRequiresAuth = requireAuthPaths.some(path => to.path.startsWith(path));
  const authStore = useAuthStore();

  if (pathRequiresAuth) {
    const token = localStorage.getItem('token');
    if (!token) return { name: 'login' };

    if (!authStore.user) {
      await authStore.fetchUser();
      if (!authStore.isAuthenticated) return { name: 'login' };
    }

    const userRoles: string[] = (authStore.user as any)?.usuariosRoles?.map((ur: any) => ur.rol?.nombre_rol) || [];
    const rolIds: number[] = (authStore.user as any)?.usuariosRoles?.map((ur: any) => ur.rol?.id) || [];

    const isSuperAdmin = userRoles.includes('Super Usuario') || rolIds.includes(1);
    const isCoordinador = userRoles.includes('Coordinador');
    const isPonente = userRoles.includes('Ponente');
    const isLogistica = userRoles.includes('Logística');

    if (to.path.startsWith('/admin') && !isSuperAdmin) {
      return isCoordinador ? '/coordinador' : isLogistica ? '/logistica' : isPonente ? '/ponente' : '/estudiante';
    }

    if (to.path.startsWith('/coordinador') && !isCoordinador && !isSuperAdmin) {
      return isLogistica ? '/logistica' : isPonente ? '/ponente' : '/estudiante';
    }

    if (to.path.startsWith('/logistica') && !isLogistica && !isSuperAdmin) {
      return isPonente ? '/ponente' : '/estudiante';
    }

    if (to.path.startsWith('/ponente') && !isPonente && !isSuperAdmin) {
      return '/estudiante';
    }
  }
  return true;
});

export default router
