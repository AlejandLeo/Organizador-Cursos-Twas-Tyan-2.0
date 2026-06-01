import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Usuario } from '@/types';
import api from '@/services/api';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<Usuario | null>(null);
  const token = ref<string | null>(localStorage.getItem('token'));

  // ── Cambio de contexto de rol ──────────────────────────────────────────────
  // Permite a usuarios con múltiples roles (ej. Estudiante + Ponente)
  // alternar de vista sin cerrar sesión. Se persiste en localStorage.
  const rolActivo = ref<string>(localStorage.getItem('rolActivo') || '');

  const isAuthenticated = computed(() => !!token.value);

  /** Todos los nombres de roles que posee el usuario autenticado (normalizados y únicos) */
  const userRoles = computed<string[]>(() => {
    const rawRoles: string[] = (user.value as any)?.usuariosRoles?.map((ur: any) => ur.rol?.nombre_rol) || [];
    const normalizedSet = new Set<string>();
    for (const r of rawRoles) {
      if (!r) continue;
      const lower = r.toLowerCase().trim();
      if (lower === 'estudiante') {
        normalizedSet.add('Estudiante');
      } else if (lower === 'ponente') {
        normalizedSet.add('Ponente');
      } else if (lower === 'logistica' || lower === 'logística') {
        normalizedSet.add('Logística');
      } else if (lower === 'super usuario') {
        normalizedSet.add('Super Usuario');
      } else if (lower === 'coordinador') {
        normalizedSet.add('Coordinador');
      } else {
        normalizedSet.add(r.charAt(0).toUpperCase() + r.slice(1));
      }
    }
    return Array.from(normalizedSet);
  });

  /** True si el usuario tiene al menos dos roles asignados */
  const tieneMultiplesRoles = computed(() => userRoles.value.length > 1);

  /** True si el usuario tiene el rol de Ponente */
  const esPonente = computed(() => userRoles.value.includes('Ponente'));

  /** True si el usuario tiene el rol de Estudiante */
  const esEstudiante = computed(() => userRoles.value.includes('Estudiante'));

  /** True si el usuario tiene el rol de Logística */
  const esLogistica = computed(() => userRoles.value.includes('Logística'));

  /** True si el usuario es Super Usuario */
  const esSuperUsuario = computed(
    () => userRoles.value.includes('Super Usuario') ||
      (user.value as any)?.usuariosRoles?.some((ur: any) => ur.rol?.id === 1)
  );

  /** True si el usuario es Super Usuario o Coordinador (Permisos Admin) */
  const esAdmin = computed(() => esSuperUsuario.value || userRoles.value.includes('Coordinador'));

  /** ID del rol principal (jerarquía: SU > Coord > Log > Ponente > Estudiante) */
  const id_rol = computed(() => {
    const roles = (user.value as any)?.usuariosRoles?.map((ur: any) => ur.rol?.id) || [];
    if (roles.includes(1)) return 1;
    if (roles.includes(2)) return 2;
    if (roles.includes(3)) return 3;
    if (roles.includes(5)) return 5;
    if (roles.includes(4)) return 4;
    return null;
  });

  /** Cambia el contexto de rol activo y lo persiste */
  function cambiarRolActivo(nuevoRol: string) {
    rolActivo.value = nuevoRol;
    localStorage.setItem('rolActivo', nuevoRol);
  }

  /** Determina la ruta de inicio según el rol activo o el rol de mayor jerarquía.
   * Modificado: Ahora prioriza el portal de estudiante por defecto para usuarios mixtos.
   */
  function getRutaInicio(): string {
    if (esSuperUsuario.value || userRoles.value.includes('Coordinador')) return '/admin';
    const roles = userRoles.value;
    const persona = user.value?.persona as any;

    // Si ya hay un rol activo seleccionado, lo respetamos
    if (rolActivo.value && roles.includes(rolActivo.value)) {
      if (rolActivo.value === 'Ponente') return '/ponente';
      if (rolActivo.value === 'Estudiante') return '/estudiante';
      if (rolActivo.value === 'Coordinador') return '/coordinador';
      if (rolActivo.value === 'Logística') return '/logistica';
    }

    // PRIORIDAD: Si es Ponente y ya está configurado, va a /ponente
    if (roles.includes('Ponente') && persona?.ponente_configurado) {
      return '/ponente';
    }

    // Por defecto, si es estudiante va a /estudiante
    if (roles.includes('Estudiante')) return '/estudiante';

    // Si solo es ponente (no configurado aún) o coordinador
    if (roles.includes('Coordinador')) return '/coordinador';
    if (roles.includes('Logística')) return '/logistica';
    if (roles.includes('Ponente')) return '/ponente';

    return '/estudiante';
  }

  /** Control de notificación de nuevo rol de ponente (específico por usuario) */
  const ponenteNotificado = ref<boolean>(false);

  function marcarPonenteNotificado() {
    if (!user.value) return;
    ponenteNotificado.value = true;
    localStorage.setItem(`ponenteNotificado_${user.value.id}`, 'true');
  }

  function checkNotificacionPendiente() {
    if (!user.value) return;
    const key = `ponenteNotificado_${user.value.id}`;
    ponenteNotificado.value = localStorage.getItem(key) === 'true';
  }

  async function login(email: string, password: string) {
    try {
      const response = await api.post('/auth/login', { email, password });

      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        token.value = response.data.token;

        // Asignar el token inmediatamente a la instancia de api para las siguientes llamadas
        api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      }

      // Perfil actualizado desde /auth/me para evitar usuarios cacheados
      const meResponse = await api.get('/auth/me');
      user.value = meResponse.data;
      checkNotificacionPendiente();

      // Capturar el rol sugerido según la contraseña usada
      const rolSugerido = response.data.user?.rolSugerido;
      if (rolSugerido) {
        localStorage.setItem('rolActivo', rolSugerido);
        rolActivo.value = rolSugerido;
      } else {
        // Resetear rol activo al hacer login si no hay sugerencia
        localStorage.removeItem('rolActivo');
        rolActivo.value = '';
      }

    } catch (error) {
      console.error('Login failed', error);
      throw error;
    }
  }

  async function fetchUser() {
    try {
      if (token.value) {
        const response = await api.get('/auth/me');
        if (response.data) {
          user.value = response.data;
          checkNotificacionPendiente();
        }
      }
    } catch (e: any) {
      console.error('Error fetching user', e);
      logout();
    }
  }

  function logout() {
    token.value = null;
    user.value = null;
    rolActivo.value = '';
    localStorage.removeItem('token');
    localStorage.removeItem('rolActivo');
  }

  return {
    user,
    token,
    rolActivo,
    ponenteNotificado,
    isAuthenticated,
    userRoles,
    tieneMultiplesRoles,
    esPonente,
    esEstudiante,
    esLogistica,
    esSuperUsuario,
    cambiarRolActivo,
    marcarPonenteNotificado,
    checkNotificacionPendiente,
    getRutaInicio,
    login,
    logout,
    fetchUser,
    esAdmin,
    id_rol,
  };
});
