import api from './api';
import type { Perfil } from '@/types';

export const perfilesService = {
  getAll() {
    return api.get<Perfil[]>('/perfiles');
  },
  getById(id: number) {
    return api.get<Perfil>(`/perfiles/${id}`);
  },
  getByUsuarioId(usuarioId: number) {
    return api.get<Perfil>(`/perfiles/usuario/${usuarioId}`);
  },
  create(data: Partial<Perfil>) {
    return api.post<Perfil>('/perfiles', data);
  },
  update(id: number, data: Partial<Perfil>) {
    return api.put<Perfil>(`/perfiles/${id}`, data);
  },
  delete(id: number) {
    return api.delete(`/perfiles/${id}`);
  }
};
