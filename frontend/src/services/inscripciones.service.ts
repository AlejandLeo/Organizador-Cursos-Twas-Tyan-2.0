import api from './api';
import type { Inscripcion } from '@/types';

export const inscripcionesService = {
  getAll() {
     return api.get<Inscripcion[]>('/inscripciones');
  },
  inscribir(data: Omit<Inscripcion, 'id_inscripcion'>) {
    return api.post<Inscripcion>('/inscripciones', data);
  },
  getByUsuarioId(usuarioId: number) {
    return api.get<Inscripcion[]>(`/inscripciones/usuario/${usuarioId}`);
  },
  getById(id: number) {
    return api.get<Inscripcion>(`/inscripciones/${id}`);
  }
};
