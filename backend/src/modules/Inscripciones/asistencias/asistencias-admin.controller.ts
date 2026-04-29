import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AsistenciasService } from './asistencias.service';
import { BatchAsistenciaDto } from './dto/batch-asistencia.dto';
import { JwtAuthGuard } from '../../Seguridad/auth/jwt-auth.guard';
import { RolesGuard } from '../../Seguridad/auth/roles.guard';
import { Roles } from '../../Seguridad/auth/roles.decorator';

@ApiTags('Asistencias (Admin)')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Coordinador', 'Super Usuario')
@ApiBearerAuth()
@Controller('admin/asistencias')
export class AsistenciasAdminController {
  constructor(private readonly service: AsistenciasService) {}

  @Post('batch')
  @ApiOperation({ summary: 'Registrar múltiples asistencias (Coordinador)' })
  registerBatch(@Body() dto: BatchAsistenciaDto) {
    return this.service.registerBatch(dto);
  }

  @Post('registro-qr')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Registrar asistencia por QR escaneado (Coordinador)' })
  registrarPorQR(
    @Body('id_inscripcion_modalidad', ParseIntPipe) id_inscripcion_modalidad: number,
    @Body('id_sesion', ParseIntPipe) id_sesion: number,
  ) {
    return this.service.registrarPorQR({ id_inscripcion_modalidad, id_sesion });
  }

  @Get('sesion/:sesionId')
  @ApiOperation({ summary: 'Listar asistencias de una sesión' })
  getBySesion(@Param('sesionId', ParseIntPipe) sesionId: number) {
    return this.service.getBySesion(sesionId);
  }

  @Get('actividad/:actividadId')
  @ApiOperation({ summary: 'Asistencias de todas las sesiones de una actividad' })
  findByActividad(@Param('actividadId', ParseIntPipe) actividadId: number) {
    return this.service.findByActividad(actividadId);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas las asistencias' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle de asistencia' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar asistencia' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
