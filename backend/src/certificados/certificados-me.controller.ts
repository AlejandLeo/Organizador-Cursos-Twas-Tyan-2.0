import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CertificadosService } from './certificados.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Certificados (Mi Cuenta)')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('me/certificados')
export class CertificadosMeController {
  constructor(private readonly service: CertificadosService) {}

  @Get()
  @ApiOperation({ summary: 'Mis certificados (Estudiante autenticado)' })
  misCertificados(@Request() req: any) {
    return this.service.findByUsuario(req.user.sub || req.user.id);
  }
}
