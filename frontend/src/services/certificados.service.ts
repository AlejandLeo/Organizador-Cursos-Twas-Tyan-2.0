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
  },

  /** Reintenta el envío de TODOS los certificados con estado_envio = 'error' */
  reintentarFallidos() {
    return api.post('/admin/certificados/reintentar-fallidos');
  },

  /** Emite y encola para envío masivo todos los certificados elegibles del evento */
  enviarPorEvento(eventoId: number) {
    return api.post(`/admin/certificados/enviar-evento/${eventoId}`);
  },

  /** Actualiza el email de un usuario (corrección rápida desde el panel de envíos) */
  editarEmailUsuario(usuarioId: number, email: string) {
    return api.patch(`/usuarios/${usuarioId}`, { email }, { params: { notificar: 'false' } });
  },

  // ── Nuevos endpoints — Panel de Control de Certificados ─────

  /** Obtiene candidatos aptos para certificados según tipo de rol */
  getCandidatos(tipo: number, idActividad?: number, idEvento?: number) {
    return api.get('/admin/certificados/candidatos/buscar', {
      params: { tipo, idActividad, idEvento },
    });
  },

  /** Emite certificados masivamente para un tipo de rol específico */
  emitirLoteTipo(data: {
    id_info_certificado: number;
    id_actividad_academica?: number;
    id_evento?: number;
    tipo: number;
    personasIds: number[];
    firma: string;
  }) {
    return api.post('/admin/certificados/emitir-lote-tipo', data);
  },

  /** Obtiene la traza de envío de un certificado (mail_logs + mail_queue) */
  getMailTrace(id: number) {
    return api.get(`/admin/certificados/${id}/mail-trace`);
  },
};
