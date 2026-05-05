import api from './api';

export const QrService = {
  /**
   * Obtiene el token QR del estudiante logueado (Modalidad A).
   */
  async getEstudianteQr() {
    const response = await api.get('/qr/estudiante/me');
    return response.data; // { qr_token, expires_in }
  },

  /**
   * Obtiene el token QR dinámico para una sesión específica (Modalidad B).
   */
  async getSesionQr(id_sesion: number) {
    const response = await api.get(`/qr/sesion/${id_sesion}`);
    return response.data; // { qr_token, expires_in }
  }
};
