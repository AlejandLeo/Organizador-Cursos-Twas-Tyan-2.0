import { Controller, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { SesionesAcademicasService } from './sesiones-academicas.service';
import { JwtAuthGuard } from '../../Seguridad/auth/jwt-auth.guard';

@ApiTags('Sesiones Académicas (Mi Cuenta)')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('me/sesiones-academicas')
export class SesionesAcademicasMeController {
  constructor(private readonly service: SesionesAcademicasService) {}

  // Plantilla: Endpoints exclusivos del estudiante para sesiones
}
