import { Controller, Post, Param, ParseIntPipe, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SesionesAcademicasService } from './sesiones-academicas.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('Sesiones Académicas (Logística)')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Logística')
@ApiBearerAuth()
@Controller('logistica/sesiones-academicas')
export class SesionesAcademicasLogisticaController {
  constructor(private readonly service: SesionesAcademicasService) {}

  @Post(':id/generar-pin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generar PIN de asistencia (Logística)' })
  generarPin(@Param('id', ParseIntPipe) id: number) {
    return this.service.generarPin(id);
  }
}
