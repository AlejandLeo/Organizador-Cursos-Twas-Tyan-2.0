import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AsistenciasService } from './asistencias.service';
import { JwtAuthGuard } from '../../Seguridad/auth/jwt-auth.guard';

@ApiTags('Asistencias (Mi Cuenta)')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('me/asistencias')
export class AsistenciasMeController {
  constructor(private readonly service: AsistenciasService) {}

  @Get()
  @ApiOperation({ summary: 'Mis asistencias (Estudiante autenticado)' })
  misAsistencias(@Request() req: any) {
    return this.service.findByUsuario(req.user.id);
  }

  @Post('registro-qr')
  @ApiOperation({ summary: 'Registrar mi asistencia escaneando el QR de la sesión' })
  registrarAsistenciaQr(@Request() req: any, @Body() body: { id_sesion: number }) {
    return this.service.registrarPorQrEstudiante(req.user.id, body.id_sesion);
  }
}
