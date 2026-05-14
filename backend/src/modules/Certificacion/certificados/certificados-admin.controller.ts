import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CertificadosService } from './certificados.service';
import { EmitirLoteDto } from './dto/emitir-lote.dto';
import { JwtAuthGuard } from '../../Seguridad/auth/jwt-auth.guard';
import { RolesGuard } from '../../Seguridad/auth/roles.guard';
import { Roles } from '../../Seguridad/auth/roles.decorator';

import { CertificadosEnvioService } from './certificados-envio.service';

@ApiTags('Certificados (Admin)')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Coordinador', 'Super Usuario')
@ApiBearerAuth()
@Controller('admin/certificados')
export class CertificadosAdminController {
  constructor(
    private readonly service: CertificadosService,
    private readonly envioService: CertificadosEnvioService,
  ) {}

  @Post('enviar-masivo')
  @ApiOperation({ summary: 'Enviar certificados por email masivamente' })
  enviarMasivo(@Body('ids') ids: number[]) {
    return this.envioService.enviarLoteMasivo(ids);
  }

  @Post(':id/reintentar-envio')
  @ApiOperation({ summary: 'Reintentar envío de un certificado individual' })
  reintentarEnvio(@Param('id', ParseIntPipe) id: number) {
    return this.envioService.enviarCertificadoIndividual(id);
  }

  @Post('emitir-lote')
  @ApiOperation({ summary: 'Emitir múltiples certificados (Coordinador)' })
  emitirLote(@Body() dto: EmitirLoteDto) {
    return this.service.emitirLote(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos los certificados emitidos' })
  findAll() {
    return this.service.findAll();
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
