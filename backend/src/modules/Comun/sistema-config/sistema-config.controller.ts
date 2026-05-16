import { Controller, Get, Patch, Body, UseGuards, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SistemaConfigService } from './sistema-config.service';
import { JwtAuthGuard } from '../../Seguridad/auth/jwt-auth.guard';
import { RolesGuard } from '../../Seguridad/auth/roles.guard';
import { Roles } from '../../Seguridad/auth/roles.decorator';
import { MailQueueService } from '../mail/mail-queue.service';

@ApiTags('Configuración del Sistema')
@Controller('admin/configuracion')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Super Usuario')
@ApiBearerAuth()
export class SistemaConfigController {
  constructor(
    private readonly configService: SistemaConfigService,
    private readonly mailQueueService: MailQueueService,
  ) { }

  @Get()
  @ApiOperation({ summary: 'Obtener todas las configuraciones del sistema' })
  async getAll() {
    return this.configService.getAllConfigs();
  }

  @Patch()
  @ApiOperation({ summary: 'Actualizar una configuración' })
  async update(@Body() body: { clave: string; valor: string }) {
    await this.configService.setConfig(body.clave, body.valor);
    return { mensaje: 'Configuración actualizada correctamente.' };
  }

  @Get('key/:clave')
  @ApiOperation({ summary: 'Obtener el valor de una configuración por su clave' })
  @Roles('Super Usuario', 'Coordinador')
  async getByKey(@Param('clave') clave: string) {
    const valor = await this.configService.getConfig(clave);
    return { clave, valor };
  }

  @Get('mail-stats')
  @Roles('Super Usuario')
  @ApiOperation({ summary: 'Obtener estadísticas de la cola de correos' })
  async getMailStats() {
    return this.mailQueueService.getStats();
  }

  @Get('mail-audit')
  @Roles('Super Usuario')
  @ApiOperation({ summary: 'Auditoría unificada de correos: enviados, cancelados y fallidos' })
  async getMailAudit(
    @Param() _: any,
  ) {
    return this.mailQueueService.getAuditoria();
  }
}
