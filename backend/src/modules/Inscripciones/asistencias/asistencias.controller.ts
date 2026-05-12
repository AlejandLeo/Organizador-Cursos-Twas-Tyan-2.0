import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  ParseIntPipe,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AsistenciasService } from './asistencias.service';


import { JwtAuthGuard } from '../Seguridad/auth/guards/jwt-auth.guard';
import { QrService } from '../../Comun/qr/qr.service';

@ApiTags('Asistencias')
@Controller('asistencias')
@UseGuards(JwtAuthGuard)
export class AsistenciasController {
  constructor(
    private readonly service: AsistenciasService,
    private readonly qrService: QrService
  ) {}

  /**
   * Endpoint usado por Docente/Logística para escanear el QR del estudiante.
   * El QR del estudiante contiene su id_usuario.
   */
  @Post('scan/estudiante')
  async scanStudentQr(
    @Body('qr_token') token: string,
    @Body('id_sesion_academica') idSesion: number,
  ) {
    if (!token || !idSesion) {
      throw new BadRequestException('Falta qr_token o id_sesion_academica.');
    }

    const payload = this.qrService.verificarTokenQr(token);
    if (!payload || payload.tipo !== 'qr_estudiante') {
      throw new BadRequestException('QR inválido o expirado.');
    }

    const idUsuario = payload.sub;
    return this.service.registrarAsistenciaEstudiante(idUsuario, idSesion);
  }

  /**
   * Endpoint usado por el Estudiante para escanear el QR de la sesión
   * (o ingresar el código de verificación manualmente).
   */
  @Post('scan/sesion')
  async scanSessionQr(
    @Request() req,
    @Body('qr_token') token: string,
    @Body('codigo_manual') codigoManual: string,
  ) {
    const idUsuario = req.user.userId || req.user.id_usuario;

    let idSesion: number;

    if (token) {
      const payload = this.qrService.verificarTokenQr(token);
      if (!payload || payload.tipo !== 'qr_sesion') {
        throw new BadRequestException('QR de sesión inválido o expirado.');
      }
      idSesion = payload.sub;
    } else if (codigoManual) {
      // Podrías implementar lógica para buscar la sesión por código_manual
      // idSesion = await this.service.buscarSesionPorCodigo(codigoManual);
      throw new BadRequestException('El escaneo por código manual aún requiere implementación en base de datos.');
    } else {
      throw new BadRequestException('Debe proveer un qr_token o un codigo_manual.');
    }

    return this.service.registrarAsistenciaEstudiante(idUsuario, idSesion);
  }
}
