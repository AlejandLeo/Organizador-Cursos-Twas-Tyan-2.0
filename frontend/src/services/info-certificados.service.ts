import api from './api';
import type { InfoCertificado } from '@/types';

export const infoCertificadosService = {
  getAll() {
    return api.get<InfoCertificado[]>('/info-certificados');
  },
  getById(id: number) {
    return api.get<InfoCertificado>(`/info-certificados/${id}`);
  },
  create(data: Omit<InfoCertificado, 'id_info_certificado'>) {
    return api.post<InfoCertificado>('/info-certificados', data);
  },
  update(id: number, data: Partial<InfoCertificado>) {
    return api.put<InfoCertificado>(`/info-certificados/${id}`, data);
  }
};
