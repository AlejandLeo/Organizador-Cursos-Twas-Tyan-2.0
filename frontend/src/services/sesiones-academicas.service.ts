import api from './api';
import type { SesionAcademica } from '@/types';

export const sesionesAcademicasService = {
  getByDetalleActividadId(detalleId: number) {
    return api.get<SesionAcademica[]>(`/sesiones-academicas/detalle/${detalleId}`);
  },
  getById(id: number) {
    return api.get<SesionAcademica>(`/sesiones-academicas/${id}`);
  },
  create(data: Omit<SesionAcademica, 'id_sesion_academica'>) {
    return api.post<SesionAcademica>('/sesiones-academicas', data);
  },
  update(id: number, data: Partial<SesionAcademica>) {
    return api.put<SesionAcademica>(`/sesiones-academicas/${id}`, data);
  },
  delete(id: number) {
    return api.delete(`/sesiones-academicas/${id}`);
  }
};
