import api from './api';
import type { Asistencia } from '@/types';

export const asistenciasService = {
  registrar(data: Omit<Asistencia, 'id_asistencia'>) {
    return api.post<Asistencia>('/asistencias', data);
  },
  getBySesionId(sesionId: number) {
    return api.get<Asistencia[]>(`/asistencias/sesion/${sesionId}`);
  },
  update(id: number, data: Partial<Asistencia>) {
    return api.put<Asistencia>(`/asistencias/${id}`, data);
  }
};
