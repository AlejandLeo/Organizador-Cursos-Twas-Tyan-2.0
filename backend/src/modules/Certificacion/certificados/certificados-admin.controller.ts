import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CertificadosService } from './certificados.service';
import { EmitirLoteDto } from './dto/emitir-lote.dto';
import { JwtAuthGuard } from '../../Seguridad/auth/jwt-auth.guard';
import { RolesGuard } from '../../Seguridad/auth/roles.guard';
import { Roles } from '../../Seguridad/auth/roles.decorator';
import { CertificadosQueueService } from './certificados-queue.service';

@ApiTags('Certificados (Admin)')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Coordinador', 'Super Usuario')
@ApiBearerAuth()
@Controller('admin/certificados')
export class CertificadosAdminController {
  constructor(
    private readonly service: CertificadosService,
    private readonly queueService: CertificadosQueueService,
  ) {}

  /**
   * Encola un lote de certificados para envío asíncrono (BullMQ).
   * Responde de inmediato con la cantidad de jobs encolados.
   */
  @Post('enviar-masivo')
  @ApiOperation({ summary: 'Encolar certificados para envío masivo por email (asíncrono)' })
  enviarMasivo(@Body('ids') ids: number[]) {
    return this.queueService.encolarLote(ids);
  }

  @Post('enviar-evento/:eventoId')
  @ApiOperation({ summary: 'Generar y encolar certificados pendientes de un evento para envío masivo' })
  enviarEvento(@Param('eventoId', ParseIntPipe) eventoId: number) {
    return this.queueService.generarYEncolarPorEvento(eventoId);
  }

  /**
   * Encola el reintento de un certificado individual.
   */
  @Post(':id/reintentar-envio')
  @ApiOperation({ summary: 'Reintentar envío de un certificado individual (asíncrono)' })
  reintentarEnvio(@Param('id', ParseIntPipe) id: number) {
    return this.queueService.encolarUno(id);
  }

  /**
   * Busca todos los certificados con estado_envio = 'error'
   * y los encola para reintento masivo sin necesidad de seleccionarlos manualmente.
   */
  @Post('reintentar-fallidos')
  @ApiOperation({ summary: 'Reintentar masivamente todos los certificados con error' })
  reintentarFallidos() {
    return this.queueService.reintentarTodosLosFallidos();
  }

  @Post('emitir-lote')
  @ApiOperation({ summary: 'Emitir múltiples certificados (Coordinador)' })
  emitirLote(@Body() dto: EmitirLoteDto) {
    return this.service.emitirLote(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos los certificados emitidos' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle de un certificado' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un certificado' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
