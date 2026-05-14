import api from './api';

export const coordinacionesService = {
  getByEvento(eventoId: number) {
    return api.get<any[]>(`/coordinaciones/evento/${eventoId}`);
  },

  asignar(eventoId: number, usuarioId: number) {
    return api.post('/coordinaciones', {
      evento: { id: eventoId },
      usuario: { id: usuarioId },
      estado: 1
    });
  },

  quitar(id: number) {
    return api.delete(`/coordinaciones/${id}`);
  }
};
