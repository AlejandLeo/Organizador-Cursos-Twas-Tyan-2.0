import api from './api';
import type { Coordinacion } from '@/types';

export const coordinacionesService = {
  asignar(data: Coordinacion) {
    return api.post<Coordinacion>('/coordinaciones', data);
  },
  remover(id: number) {
    return api.delete(`/coordinaciones/${id}`);
  },
  getByVersionEventoId(versionEventoId: number) {
    return api.get<Coordinacion[]>(`/coordinaciones/version/${versionEventoId}`);
  }
};
