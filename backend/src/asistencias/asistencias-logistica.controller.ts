import { Controller, Post, Body, UseGuards, HttpCode, HttpStatus, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AsistenciasService } from './asistencias.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('Asistencias (Logística)')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Logística')
@ApiBearerAuth()
@Controller('logistica/asistencias')
export class AsistenciasLogisticaController {
  constructor(private readonly service: AsistenciasService) {}

  @Post('registro-qr')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Registrar asistencia por QR escaneado (Logística)' })
  registrarPorQR(
    @Body('id_inscripcion_modalidad', ParseIntPipe) id_inscripcion_modalidad: number,
    @Body('id_sesion', ParseIntPipe) id_sesion: number,
  ) {
    return this.service.registrarPorQR({ id_inscripcion_modalidad, id_sesion });
  }
}
