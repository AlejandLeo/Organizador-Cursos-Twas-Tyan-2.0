import { Controller, Get, UseGuards, Request } from '@nestjs/common';
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
}
