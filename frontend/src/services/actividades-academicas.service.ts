import api from './api';
import type { ActividadAcademica } from '@/types';

export const actividadesAcademicasService = {
  getAll() {
    return api.get<ActividadAcademica[]>('/actividades-academicas');
  },
  getByVersionEventoId(versionEventoId: number) {
    return api.get<ActividadAcademica[]>(`/actividades-academicas/version/${versionEventoId}`);
  },
  getById(id: number) {
    return api.get<ActividadAcademica>(`/actividades-academicas/${id}`);
  },
  create(data: Omit<ActividadAcademica, 'id_actividad_academica'>) {
    return api.post<ActividadAcademica>('/actividades-academicas', data);
  },
  update(id: number, data: Partial<ActividadAcademica>) {
    return api.put<ActividadAcademica>(`/actividades-academicas/${id}`, data);
  },
  delete(id: number) {
    return api.delete(`/actividades-academicas/${id}`);
  }
};
