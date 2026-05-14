import api from './api';
import type { Certificado } from '@/types';

export const certificadosService = {
  getAll() {
    return api.get<Certificado[]>('/certificados');
  },
  getByUsuarioId(usuarioId: number) {
    return api.get<Certificado[]>(`/certificados/usuario/${usuarioId}`);
  },
  generar(data: Omit<Certificado, 'id_certificado'>) {
    return api.post<Certificado>('/certificados', data);
  },
  getById(id: number) {
    return api.get<Certificado>(`/certificados/${id}`);
  },

  // ── Admin ───────────────────────────────────────────────────
  adminGetAll() {
    return api.get<Certificado[]>('/admin/certificados');
  },
  
  enviarMasivo(ids: number[]) {
    return api.post('/admin/certificados/enviar-masivo', { ids });
  },

  reintentarEnvio(id: number) {
    return api.post(`/admin/certificados/${id}/reintentar-envio`);
  }
};
