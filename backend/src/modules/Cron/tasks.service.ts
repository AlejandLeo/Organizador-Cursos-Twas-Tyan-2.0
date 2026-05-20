import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { MailQueue } from '../Comun/mail/entities/mail-queue.entity';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    @InjectRepository(MailQueue)
    private mailQueueRepository: Repository<MailQueue>,
  ) {}

  /**
   * Tarea programada que se ejecuta todos los días a la medianoche.
   * Limpia registros de cola de correos fallidos (FAILED) que tienen más de 30 días.
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleCronLimpiezaMailQueue() {
    this.logger.debug('Iniciando limpieza de registros antiguos en mail_queue...');
    
    const treintaDiasAtras = new Date();
    treintaDiasAtras.setDate(treintaDiasAtras.getDate() - 30);

    try {
      const result = await this.mailQueueRepository.delete({
        estado: 'FAILED',
        fecha_creacion: LessThan(treintaDiasAtras),
      });

      this.logger.debug(`Limpieza completada: ${result.affected || 0} registros eliminados.`);
    } catch (error) {
      this.logger.error('Error al limpiar mail_queue', error);
    }
  }
}
