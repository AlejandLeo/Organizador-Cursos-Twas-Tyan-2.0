import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CertificadosService } from './certificados.service';
import { JwtAuthGuard } from '../../Seguridad/auth/jwt-auth.guard';
import { RolesGuard } from '../../Seguridad/auth/roles.guard';
import { Roles } from '../../Seguridad/auth/roles.decorator';

@ApiTags('Certificados (Logística)')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Logística', 'Logistica')
@ApiBearerAuth()
@Controller('logistica/certificados')
export class CertificadosLogisticaController {
  constructor(private readonly service: CertificadosService) {}

  @Get('mis-certificados')
  @ApiOperation({ summary: 'Obtener los certificados del usuario logístico autenticado' })
  async misCertificados(@Req() req: any) {
    const userId = req.user?.id || req.user?.sub;
    return this.service.findByUsuario(userId);
  }
}
