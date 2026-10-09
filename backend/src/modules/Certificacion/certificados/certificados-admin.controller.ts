import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CertificadosService } from './certificados.service';
import { EmitirLoteDto } from './dto/emitir-lote.dto';
import { EmitirLoteTipoDto } from './dto/emitir-lote-tipo.dto';
import { GetCandidatosDto } from './dto/get-candidatos.dto';
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
  ) { }

  // ── Envío masivo ────────────────────────────────────────────

  /**
   * Encola un lote de certificados para envío asíncrono.
   */
  @Post('enviar-masivo')
  @ApiOperation({ summary: 'Encolar certificados para envío masivo por email (asíncrono)' })
  async enviarMasivo(@Body('ids') ids: number[], @Body('idTemplate') idTemplate?: number) {
    return this.queueService.encolarLote(ids, idTemplate);
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
  reintentarEnvio(@Param('id', ParseIntPipe) id: number, @Body('idTemplate') idTemplate?: number) {
    return this.queueService.encolarUno(id, idTemplate);
  }

  /**
   * Busca todos los certificados con estado_envio = 'error'
   * y los encola para reintento masivo.
   */
  @Post('reintentar-fallidos')
  @ApiOperation({ summary: 'Reintentar masivamente todos los certificados con error' })
  async reintentarFallidos() {
    return this.queueService.reintentarTodosLosFallidos();
  }

  // ── Emisión por tipo ────────────────────────────────────────

  @Post('emitir-lote')
  @ApiOperation({ summary: 'Emitir múltiples certificados (Coordinador)' })
  emitirLote(@Body() dto: EmitirLoteDto) {
    return this.service.emitirLote(dto);
  }

  @Post('emitir-lote-tipo')
  @ApiOperation({ summary: 'Emitir certificados por tipo de rol (Asistente, Expositor, Logística, Docente)' })
  emitirLoteTipo(@Body() dto: EmitirLoteTipoDto) {
    return this.service.emitirLoteTipo(dto);
  }

  // ── Candidatos ──────────────────────────────────────────────

  @Get('candidatos/buscar')
  @ApiOperation({ summary: 'Obtener candidatos aptos para certificado según tipo' })
  @ApiQuery({ name: 'tipo', type: Number, required: true, description: '1=Asistente, 2=Expositor, 3=Logística, 4=Docente' })
  @ApiQuery({ name: 'idActividad', type: Number, required: false })
  @ApiQuery({ name: 'idEvento', type: Number, required: false })
  getCandidatos(@Query() query: GetCandidatosDto) {
    return this.service.obtenerCandidatos(
      query.tipo ? Number(query.tipo) : 1,
      query.idActividad ? Number(query.idActividad) : undefined,
      query.idEvento ? Number(query.idEvento) : undefined,
    );
  }

  // ── Mail Trace ──────────────────────────────────────────────

  @Get(':id/mail-trace')
  @ApiOperation({ summary: 'Obtener la traza de envío de un certificado (mail_logs + mail_queue)' })
  getMailTrace(@Param('id', ParseIntPipe) id: number) {
    return this.service.obtenerMailTrace(id);
  }

  // ── CRUD básico ─────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'Listar todos los certificados emitidos' })
  findAll() {
    return this.service.findAll();
  }

  // ── Firmantes de un Evento ───────────────────────────────────

  @Get('eventos/:id/firmantes')
  @ApiOperation({ summary: 'Obtener la lista de firmantes (Coordinadores y Ponentes) para un evento' })
  async getFirmantesEvento(@Param('id', ParseIntPipe) id: number) {
    return this.service.obtenerFirmantesEvento(id);
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
