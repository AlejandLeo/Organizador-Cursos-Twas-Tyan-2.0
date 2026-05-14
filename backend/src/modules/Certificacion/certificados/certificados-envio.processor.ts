/**
 * ARCHIVO OBSOLETO — No se usa.
 *
 * El sistema de cola fue migrado a una implementación en memoria
 * (CertificadosQueueService) que no requiere Redis ni ningún broker externo.
 *
 * Este archivo puede eliminarse de forma segura.
 */
export const CERT_QUEUE_NAME = 'certificados-envio';
export const CERT_JOB_ENVIAR = 'enviar-individual';

export interface EnviarCertificadoJobData {
  certificadoId: number;
}
