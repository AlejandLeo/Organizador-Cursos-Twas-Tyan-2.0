import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import { QrService } from './qr.service';
import { JwtAuthGuard } from '../../Seguridad/auth/guards/jwt-auth.guard';

@Controller('qr')
@UseGuards(JwtAuthGuard)
export class QrController {
  constructor(private readonly qrService: QrService) {}

  /**
   * Obtiene el token QR dinámico del estudiante autenticado.
   * (Lo usa el frontend del alumno para dibujar el QR)
   */
  @Get('estudiante/me')
  getQrEstudiante(@Request() req) {
    const userId = req.user.userId; // En el sistema actual suele ser userId o id_usuario
    const token = this.qrService.generarTokenEstudiante(userId);
    return { qr_token: token, expires_in: 300 }; // 5 minutos = 300s
  }

  /**
   * Obtiene el token QR dinámico para una sesión específica.
   * (Lo usa el frontend del Docente/Logística para proyectarlo)
   */
  @Get('sesion/:id')
  getQrSesion(@Param('id', ParseIntPipe) idSesion: number) {
    const token = this.qrService.generarTokenSesion(idSesion);
    return { qr_token: token, expires_in: 30 }; // 30s
  }
}
