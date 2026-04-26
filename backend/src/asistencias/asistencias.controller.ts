import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  ParseIntPipe,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AsistenciasService } from './asistencias.service';
import { BatchAsistenciaDto } from './dto/batch-asistencia.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('Asistencias')
@Controller('asistencias')
export class AsistenciasController {
  constructor(private readonly service: AsistenciasService) {}

  // ── Coordinador / Ponente: Registro en lote ─────────────────

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Coordinador', 'Super Usuario', 'Ponente', 'Logística')
  @ApiBearerAuth()
  @Post('batch')
  @ApiOperation({ summary: 'Registrar múltiples asistencias (Coord/Docente)' })
  registerBatch(@Body() dto: BatchAsistenciaDto) {
    return this.service.registerBatch(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Coordinador', 'Super Usuario', 'Ponente', 'Logística')
  @ApiBearerAuth()
  @Get('sesion/:sesionId')
  @ApiOperation({ summary: 'Listar asistencias de una sesión (Coord/Docente)' })
  getBySesion(@Param('sesionId', ParseIntPipe) sesionId: number) {
    return this.service.getBySesion(sesionId);
  }

  // ══════════════════════════════════════════════════════════
  //  VISTA ESTUDIANTE — mis asistencias
  // ══════════════════════════════════════════════════════════

  /**
   * GET /asistencias/mis-asistencias
   * Devuelve todas las asistencias del usuario autenticado.
   * Incluye datos de la sesión (fecha, hora, aula) y la actividad académica.
   */
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('mis-asistencias')
  @ApiOperation({
    summary: 'Mis asistencias (Estudiante autenticado)',
  })
  misAsistencias(@Request() req: any) {
    return this.service.findByUsuario(req.user.sub || req.user.id);
  }

  // ══════════════════════════════════════════════════════════
  //  VISTA COORDINADOR — asistencias por actividad
  // ══════════════════════════════════════════════════════════

  /**
   * GET /asistencias/actividad/:actividadId
   * Lista todas las asistencias de todas las sesiones de una actividad.
   * Útil para exportar el reporte completo de una materia.
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Coordinador', 'Super Usuario', 'Logística', 'Ponente')
  @ApiBearerAuth()
  @Get('actividad/:actividadId')
  @ApiOperation({
    summary:
      'Asistencias de todas las sesiones de una actividad (Coord/Ponente)',
  })
  findByActividad(@Param('actividadId', ParseIntPipe) actividadId: number) {
    return this.service.findByActividad(actividadId);
  }

  // ══════════════════════════════════════════════════════════
  //  REGISTRO POR QR
  // ══════════════════════════════════════════════════════════

  /**
   * POST /asistencias/registro-qr
   * El Super Usuario, Ponente, Coordinador, Logistica escanea el QR del estudiante.
   * El cuerpo debe incluir id_inscripcion_modalidad e id_sesion.
   * Valida que la sesión esté activa (con PIN) y que no haya duplicado.
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Coordinador', 'Super Usuario', 'Ponente', 'Logística')
  @ApiBearerAuth()
  @Post('registro-qr')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Registrar asistencia por QR escaneado (Ponente/Coordinador)',
  })
  registrarPorQR(
    @Body('id_inscripcion_modalidad', ParseIntPipe)
    id_inscripcion_modalidad: number,
    @Body('id_sesion', ParseIntPipe) id_sesion: number,
  ) {
    return this.service.registrarPorQR({
      id_inscripcion_modalidad,
      id_sesion,
    });
  }

  // ── Legacy ──────────────────────────────────────────────────

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Coordinador', 'Super Usuario')
  @ApiBearerAuth()
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
