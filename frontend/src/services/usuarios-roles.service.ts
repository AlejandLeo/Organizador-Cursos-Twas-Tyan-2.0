import api from './api';
import type { UsuarioRol } from '@/types';

export const usuariosRolesService = {
  assign(data: Omit<UsuarioRol, 'id_usuario_rol' | 'estado'>) {
    return api.post<UsuarioRol>('/usuarios-roles', data);
  },
  
  remove(id: number) {
    return api.delete(`/usuarios-roles/${id}`);
  },

  getByUsuario(usuarioId: number) {
      return api.get<UsuarioRol[]>(`/usuarios-roles/usuario/${usuarioId}`);
  }
};
