import api from './api';
import type { Imparticion } from '@/types';

export const imparticionesService = {
  asignar(data: Imparticion) {
    return api.post<Imparticion>('/imparticiones', data);
  },
  remover(id: number) {
    return api.delete(`/imparticiones/${id}`);
  },
  getByDetalleActividadId(detalleId: number) {
    return api.get<Imparticion[]>(`/imparticiones/detalle/${detalleId}`);
  }
};
