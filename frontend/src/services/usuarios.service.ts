import api from './api';
import type { Usuario } from '@/types';

export const usuariosService = {
  getAll() {
    return api.get<Usuario[]>('/usuarios');
  },
  getById(id: number) {
    return api.get<Usuario>(`/usuarios/${id}`);
  },
  create(data: Partial<Usuario>) {
    return api.post<Usuario>('/usuarios', data);
  },
  update(id: number, data: Partial<Usuario>) {
    return api.put<Usuario>(`/usuarios/${id}`, data);
  },
  delete(id: number) {
    return api.delete(`/usuarios/${id}`);
  }
};
