import { Controller, Post, Body, UseGuards, HttpCode, HttpStatus, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AsistenciasService } from './asistencias.service';
import { BatchAsistenciaDto } from './dto/batch-asistencia.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('Asistencias (Ponente)')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Ponente')
@ApiBearerAuth()
@Controller('ponente/asistencias')
export class AsistenciasPonenteController {
  constructor(private readonly service: AsistenciasService) {}

  @Post('batch')
  @ApiOperation({ summary: 'Registrar múltiples asistencias (Ponente)' })
  registerBatch(@Body() dto: BatchAsistenciaDto) {
    return this.service.registerBatch(dto);
  }

  @Post('registro-qr')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Registrar asistencia por QR escaneado (Ponente)' })
  registrarPorQR(
    @Body('id_inscripcion_modalidad', ParseIntPipe) id_inscripcion_modalidad: number,
    @Body('id_sesion', ParseIntPipe) id_sesion: number,
  ) {
    return this.service.registrarPorQR({ id_inscripcion_modalidad, id_sesion });
  }
}
