import { Controller, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CertificadosService } from './certificados.service';
import { JwtAuthGuard } from '../../Seguridad/auth/jwt-auth.guard';
import { RolesGuard } from '../../Seguridad/auth/roles.guard';
import { Roles } from '../../Seguridad/auth/roles.decorator';

@ApiTags('Certificados (Ponente)')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Ponente')
@ApiBearerAuth()
@Controller('ponente/certificados')
export class CertificadosPonenteController {
  constructor(private readonly service: CertificadosService) {}

  // Plantilla: Endpoints exclusivos de ponente para certificados
}
