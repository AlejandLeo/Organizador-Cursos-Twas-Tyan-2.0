import api from './api';
import type { Evento } from '@/types';

export const eventosService = {
  getAll() {
    return api.get<Evento[]>('/eventos');
  },
  getById(id: number) {
    return api.get<Evento>(`/eventos/${id}`);
  },
  create(data: Omit<Evento, 'id_eventos'>) {
    return api.post<Evento>('/eventos', data);
  },
  update(id: number, data: Partial<Evento>) {
    return api.put<Evento>(`/eventos/${id}`, data);
  },
  delete(id: number) {
    return api.delete(`/eventos/${id}`);
  }
};
