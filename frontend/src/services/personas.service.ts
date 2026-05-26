import api from './api';
import type { Persona } from '@/types';

export const perfilesService = {
  getAll() {
    return api.get<Persona[]>('/perfiles');
  },
  getById(id: number) {
    return api.get<Persona>(`/perfiles/${id}`);
  },
  getByUsuarioId(usuarioId: number) {
    return api.get<Persona>(`/perfiles/usuario/${usuarioId}`);
  },
  create(data: Partial<Persona>) {
    return api.post<Persona>('/perfiles', data);
  },
  update(id: number, data: Partial<Persona>) {
    return api.put<Persona>(`/perfiles/${id}`, data);
  },
  delete(id: number) {
    return api.delete(`/perfiles/${id}`);
  }
};
