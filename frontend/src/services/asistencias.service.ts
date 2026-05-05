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
  },

  // --- Endpoints de Asistencia por QR ---

  /**
   * Logística o Ponente escanea el QR del estudiante.
   */
  scanEstudianteQr(qr_token: string, id_sesion_academica: number) {
    return api.post('/asistencias/scan/estudiante', {
      qr_token,
      id_sesion_academica
    });
  },

  /**
   * Estudiante escanea el QR de la sesión o introduce el código manual.
   */
  scanSesionQr(data: { qr_token?: string, codigo_manual?: string }) {
    return api.post('/asistencias/scan/sesion', data);
  }
};
