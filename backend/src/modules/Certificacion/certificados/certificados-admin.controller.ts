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
  Req,
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
import { MailService } from '../../Comun/mail/mail.service';

@ApiTags('Certificados (Admin)')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Coordinador', 'Super Usuario')
@ApiBearerAuth()
@Controller('admin/certificados')
export class CertificadosAdminController {
  constructor(
    private readonly service: CertificadosService,
    private readonly queueService: CertificadosQueueService,
    private readonly mailService: MailService,
  ) {}

  // ── Envío masivo con notificación a SuperUsuario ────────────

  /**
   * Encola un lote de certificados para envío asíncrono.
   * Notifica al SuperUsuario sobre la acción.
   */
  @Post('enviar-masivo')
  @ApiOperation({ summary: 'Encolar certificados para envío masivo por email (asíncrono)' })
  async enviarMasivo(@Body('ids') ids: number[], @Req() req: any) {
    const resultado = await this.queueService.encolarLote(ids);

    // Notificar al SuperUsuario
    const usuario = req.user;
    const adminEmail = process.env.MAIL_USER || 'coursemanagementsystemumsa@gmail.com';
    const nombreSolicitante = usuario?.persona
      ? `${usuario.persona.nombres} ${usuario.persona.primer_apellido}`
      : usuario?.email || 'Sistema';

    this.mailService.sendMail(
      adminEmail,
      'Notificación: Envío Masivo de Certificados Iniciado',
      'certificate-send-notification',
      {
        nombre: 'Administrador',
        solicitante: nombreSolicitante,
        cantidad: ids.length,
        fecha: new Date().toLocaleString('es-BO'),
        tipo: 'Envío Masivo',
      },
      `<html><body>
        <h2>Envío Masivo de Certificados</h2>
        <p><strong>${nombreSolicitante}</strong> ha iniciado el envío masivo de <strong>${ids.length}</strong> certificados.</p>
        <p>Fecha: ${new Date().toLocaleString('es-BO')}</p>
        <p>Los certificados se están procesando en segundo plano.</p>
      </body></html>`,
    ).catch(() => { /* No bloquear si falla la notificación */ });

    return resultado;
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
   * y los encola para reintento masivo.
   */
  @Post('reintentar-fallidos')
  @ApiOperation({ summary: 'Reintentar masivamente todos los certificados con error' })
  async reintentarFallidos(@Req() req: any) {
    const resultado = await this.queueService.reintentarTodosLosFallidos();

    if (resultado.encolados > 0) {
      const usuario = req.user;
      const adminEmail = process.env.MAIL_USER || 'coursemanagementsystemumsa@gmail.com';
      const nombreSolicitante = usuario?.persona
        ? `${usuario.persona.nombres} ${usuario.persona.primer_apellido}`
        : usuario?.email || 'Sistema';

      this.mailService.sendMail(
        adminEmail,
        'Notificación: Reintento Masivo de Certificados Fallidos',
        undefined,
        undefined,
        `<html><body>
          <h2>Reintento Masivo de Certificados</h2>
          <p><strong>${nombreSolicitante}</strong> ha iniciado el reintento de <strong>${resultado.encolados}</strong> certificados fallidos.</p>
          <p>Fecha: ${new Date().toLocaleString('es-BO')}</p>
        </body></html>`,
      ).catch(() => {});
    }

    return resultado;
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
