import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Certificado } from './entities/certificado.entity';
import { CertificadosEnvioService } from './certificados-envio.service';

/**
 * Cola de envío en memoria — no requiere Redis ni ningún broker externo.
 *
 * Estrategia:
 *  - Los IDs se insertan en una cola interna (array FIFO).
 *  - Si el worker no está corriendo, se arranca con setImmediate() para no
 *    bloquear el ciclo de eventos (el endpoint responde de inmediato).
 *  - El worker procesa los certificados de uno en uno con un delay de 500 ms
 *    entre envíos para no saturar el SMTP.
 *  - Si un envío falla, el error queda registrado en la entidad (estado_envio='error')
 *    pero el worker continúa con el siguiente.
 */
@Injectable()
export class CertificadosQueueService {
  private readonly logger = new Logger(CertificadosQueueService.name);

  /** Cola FIFO de IDs pendientes de envío */
  private readonly queue: number[] = [];

  /** Evita que dos workers corran en paralelo */
  private isProcessing = false;

  constructor(
    private readonly envioService: CertificadosEnvioService,

    @InjectRepository(Certificado)
    private readonly certificadoRepository: Repository<Certificado>,
  ) {}

  // ── API pública ──────────────────────────────────────────────

  /**
   * Encola un lote de IDs para envío asíncrono.
   * Retorna inmediatamente; el envío ocurre en segundo plano.
   */
  async encolarLote(ids: number[]): Promise<{ mensaje: string; encolados: number }> {
    this.queue.push(...ids);
    this.logger.log(`[Queue] +${ids.length} certificados encolados. Total pendiente: ${this.queue.length}`);
    this.iniciarWorkerSiIdle();
    return {
      mensaje: `Se encolaron ${ids.length} certificados. El envío se procesa en segundo plano.`,
      encolados: ids.length,
    };
  }

  /**
   * Encola el reintento de un único certificado.
   */
  async encolarUno(id: number): Promise<{ mensaje: string }> {
    this.queue.push(id);
    this.logger.log(`[Queue] Certificado #${id} encolado para reintento.`);
    this.iniciarWorkerSiIdle();
    return { mensaje: `Certificado #${id} encolado para envío. Se procesará en breve.` };
  }

  /**
   * Busca todos los certificados con estado_envio = 'error'
   * y los encola para reintento masivo automático.
   */
  async reintentarTodosLosFallidos(): Promise<{ mensaje: string; encolados: number }> {
    const fallidos = await this.certificadoRepository.find({
      where: { estado_envio: 'error' },
      select: ['id'],
    });

    if (fallidos.length === 0) {
      return { mensaje: 'No hay certificados con errores pendientes de reintento.', encolados: 0 };
    }

    const ids = fallidos.map((c) => c.id);
    return this.encolarLote(ids);
  }

  // ── Worker interno ───────────────────────────────────────────

  /**
   * Arranca el worker solo si no hay uno activo ya.
   * Usa setImmediate para ceder el control al event loop
   * (el cliente HTTP recibe su respuesta antes de que empiece el procesamiento).
   */
  private iniciarWorkerSiIdle(): void {
    if (this.isProcessing) return;
    setImmediate(() => this.procesarCola());
  }

  /**
   * Procesa la cola de forma secuencial hasta vaciarla.
   */
  private async procesarCola(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;
    this.logger.log(`[Worker] Iniciando procesamiento. ${this.queue.length} jobs en cola.`);

    while (this.queue.length > 0) {
      const id = this.queue.shift()!;
      try {
        await this.envioService.enviarCertificadoIndividual(id);
        this.logger.log(`[Worker] ✓ Certificado #${id} enviado.`);
      } catch (error) {
        // El error ya fue registrado en DB por enviarCertificadoIndividual.
        // El worker continúa con el siguiente sin detenerse.
        this.logger.error(`[Worker] ✗ Certificado #${id} falló: ${error.message}`);
      }

      if (this.queue.length > 0) {
        // Pausa de 500 ms entre envíos para no saturar el SMTP
        await new Promise<void>((resolve) => setTimeout(resolve, 500));
      }
    }

    this.isProcessing = false;
    this.logger.log('[Worker] Cola vacía. Worker detenido.');
  }
}
