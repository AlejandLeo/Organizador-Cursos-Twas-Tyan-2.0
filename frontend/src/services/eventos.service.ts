import api from './api';
import type { Evento } from '@/types';

export const eventosService = {
  // ── RUTAS PÚBLICAS ────────────────────────────────────────────────────────
  getAll() {
    return api.get<Evento[]>('/eventos');
  },
  getById(id: number) {
    return api.get<Evento>(`/eventos/${id}`);
  },

  // ── RUTAS ADMINISTRATIVAS ─────────────────────────────────────────────────
  /** Lista paginada para el panel de administración */
  getAllAdmin(params?: { estado?: number; page?: number; limit?: number }) {
    return api.get<{ data: Evento[]; total: number; page: number; limit: number }>('/admin/eventos/lista', { params });
  },

  create(formData: FormData) {
    // Usamos FormData porque el backend espera multipart/form-data para imágenes
    return api.post<Evento>('/admin/eventos', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  update(id: number, data: FormData | Partial<Evento>) {
    const url = `/admin/eventos/${id}`;
    if (data instanceof FormData) {
      return api.put<Evento>(url, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    }
    return api.patch<Evento>(url, data);
  },

  delete(id: number) {
    return api.delete(`/admin/eventos/${id}`);
  },

  /** Obtiene actividades de un evento (vista admin) */
  getActividades(id: number) {
    return api.get(`/admin/eventos/${id}/actividades-academicas`);
  }
};
