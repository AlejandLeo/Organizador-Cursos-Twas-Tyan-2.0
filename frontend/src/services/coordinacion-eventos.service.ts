import api from './api';
import type { CoordinacionEvento } from '@/types';

export const coordinacionesService = {
  asignar(data: CoordinacionEvento) {
    return api.post<CoordinacionEvento>('/coordinaciones', data);
  },
  remover(id: number) {
    return api.delete(`/coordinaciones/${id}`);
  },
  getByVersionEventoId(versionEventoId: number) {
    return api.get<CoordinacionEvento[]>(`/coordinaciones/version/${versionEventoId}`);
  }
};
