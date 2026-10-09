import api from './api';
import type { Usuario } from '@/types';

export const usuariosService = {
  getAll(params?: { rol?: string; q?: string; soloActivos?: string; limit?: number; page?: number }) {
    return api.get<{ data: Usuario[]; total: number } | Usuario[]>('/usuarios', { params });
  },

  getById(id: number) {
    return api.get<Usuario>(`/usuarios/${id}`);
  },

  /**
   * Crea un usuario completo (credenciales + persona + rol) usando el endpoint
   * de ponente que maneja transacciones atómicas. Funciona para cualquier rol.
   */
  crearConRol(data: {
    email: string;
    password: string;
    nombres: string;
    primer_apellido: string;
    segundo_apellido?: string;
    documento_identidad?: string;
    id_rol: number;
    notificar?: boolean;
  }) {
    return api.post<Usuario>('/usuarios/ponente', data);
  },

  update(id: number, data: Partial<Usuario>, notificar = true) {
    return api.patch<Usuario>(`/usuarios/${id}`, data, {
      params: { notificar: String(notificar) }
    });
  },

  delete(id: number, notificar = true) {
    return api.delete(`/usuarios/${id}`, {
      params: { notificar: String(notificar) }
    });
  },

  eliminarFisico(id: number) {
    return api.delete(`/usuarios/${id}/fisico`);
  },

  // ── Gestión de Roles (Solo Super Usuario) ──────────────────────────────────

  /**
   * Asigna un rol adicional a un usuario existente.
   * @param usuarioId ID del usuario al que se le asigna el rol
   * @param rolId     ID del rol a asignar (1=SU, 2=Coord, 3=Log, 4=Estudiante, 5=Ponente)
   */
  asignarRol(usuarioId: number, rolId: number) {
    return api.post<Usuario>(`/usuarios/${usuarioId}/roles/asignar`, { rolId });
  },

  /**
   * Quita un rol específico de un usuario.
   */
  quitarRol(usuarioId: number, rolId: number) {
    return api.post<Usuario>(`/usuarios/${usuarioId}/roles/quitar`, { rolId });
  },

  /**
   * Obtiene todos los usuarios activos (estado=1) filtrados por rol.
   * Útil para listar candidatos a ser asignados como ponentes.
   */
  getEstudiantesActivos() {
    return api.get<{ data: Usuario[] }>('/usuarios', {
      params: { soloActivos: 'true' },
    });
  },

  /**
   * Verifica la contraseña de respaldo (CI) del usuario.
   */
  verificarRespaldo(ci: string) {
    return api.post<{ valid: boolean; message: string }>('/usuarios/verificar-respaldo', { ci });
  },
  
  /**
   * Activa el portal de ponente.
   */
  async activarPonente(ci: string, password: string) {
    const response = await api.post('/usuarios/activar-ponente', { ci, password });
    return response.data;
  },

  actualizarRolesBulk(usuarioId: number, rolIds: number[], notificar = true) {
    return api.patch<{ mensaje: string; correoEnviado: boolean }>(`/usuarios/${usuarioId}/roles`, {
      rolIds,
      notificar
    });
  },

  forzarReset(id: number, password: string) {
    return api.patch(`/usuarios/${id}/forzar-reset`, { password });
  },

  /**
   * Obtiene el perfil completo de un usuario (para administradores).
   */
  getPerfilAdmin(id: number) {
    return api.get<any>(`/usuarios/${id}/perfil`);
  },

  /**
   * Actualiza el perfil completo de un usuario (para administradores).
   */
  actualizarPerfilAdmin(id: number, data: any) {
    return api.patch<any>(`/usuarios/${id}/perfil-completo`, data);
  },
};
