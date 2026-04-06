import api from './api';
import type { Rol } from '@/types';

export const rolesService = {
  getAll() {
    return api.get<Rol[]>('/roles');
  },
  getById(id: number) {
    return api.get<Rol>(`/roles/${id}`);
  },
  create(data: Partial<Rol>) {
    return api.post<Rol>('/roles', data);
  },
  update(id: number, data: Partial<Rol>) {
    return api.put<Rol>(`/roles/${id}`, data);
  },
  delete(id: number) {
    return api.delete(`/roles/${id}`);
  }
};
