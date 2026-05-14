import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { UsuariosService } from './usuarios.service';

@Injectable()
export class UsuariosCronService {
  private readonly logger = new Logger(UsuariosCronService.name);

  constructor(private readonly usuariosService: UsuariosService) {}

  /**
   * Tarea que se ejecuta todos los días a la medianoche (00:00).
   * Busca y elimina físicamente a los usuarios cuya fecha de gracia ha expirado.
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleScheduledDeletions() {
    this.logger.log('Iniciando proceso diario de eliminación de cuentas expiradas...');
    try {
      await this.usuariosService.procesarEliminacionesProgramadas();
    } catch (error) {
      this.logger.error(`Error en el proceso de eliminación programada: ${error.message}`);
    }
  }
}
