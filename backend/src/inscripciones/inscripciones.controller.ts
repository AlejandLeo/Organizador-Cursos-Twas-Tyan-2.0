import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  ParseIntPipe,
  Query,
  UseGuards,
  Request,
  Patch,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { InscripcionesService } from './inscripciones.service';
import { CreateInscripcionDto } from './dto/create-inscripcion.dto';
import { RegistrarAsistenciaPinDto } from './dto/registrar-asistencia-pin.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('Inscripciones')
@Controller('inscripciones')
export class InscripcionesController {
  constructor(private readonly service: InscripcionesService) {}

  // ── Estudiante ─────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('mis-inscripciones')
  @ApiOperation({ summary: 'Listar las inscripciones del estudiante autenticado' })
  misInscripciones(@Request() req: any) {
    return this.service.findByUsuario(req.user.id || req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('preinscribir')
  @ApiOperation({ summary: 'Pre-inscripción de estudiante a una actividad' })
  preinscribir(@Request() req: any, @Body() body: any) {
    // Creamos la inscripción con estado 0 = Pendiente
    return this.service.inscribir({
      id_usuario: req.user.id || req.user.sub,
      id_actividad_academica: Number(body.id_actividad),
      miembro_tyan: body.miembro_tyan !== undefined ? Number(body.miembro_tyan) : 0,
      razon: body.razon || '',
      datos_adicionales: body.datos_adicionales || {},
      estado: 0, // 0 = pendiente
    });
  }

  // ══════════════════════════════════════════════════════════
  //  REGISTRO DE ASISTENCIA POR PIN (público, sin JWT)
  //  El estudiante ingresa su email + sesión + PIN para
  //  marcar su asistencia sin necesidad de iniciar sesión.
  // ══════════════════════════════════════════════════════════

  @Post('registrar-asistencia-pin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Registrar asistencia con PIN (público — sin JWT). Requiere email + id_sesion + pin.',
  })
  registrarAsistenciaPorPin(@Body() dto: RegistrarAsistenciaPinDto) {
    return this.service.registrarAsistenciaPorPin(dto);
  }

  // ── Coordinador ─────────────────────────────────────────────

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Coordinador', 'Super Usuario', 'Logística')
  @ApiBearerAuth()
  @Get()
  @ApiOperation({ summary: 'Listar inscripciones de un evento (Coordinador)' })
  @ApiQuery({ name: 'eventoId', required: false })
  findAll(
    @Query('eventoId') eventoId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    if (eventoId) {
      return this.service.findByEvento(
        Number(eventoId),
        page ? Number(page) : 1,
        limit ? Number(limit) : 20,
      );
    }
    return this.service.findAll();
  }

  /**
   * GET /inscripciones/usuario/:id
   * Lista las inscripciones de un usuario específico.
   * Uso exclusivo del coordinador para consultar el historial de un estudiante.
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Coordinador', 'Super Usuario', 'Logística')
  @ApiBearerAuth()
  @Get('usuario/:id')
  @ApiOperation({ summary: 'Inscripciones de un usuario por ID (Coordinador)' })
  findByUsuario(@Param('id', ParseIntPipe) id: number) {
    return this.service.findByUsuarioId(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Coordinador', 'Super Usuario', 'Logística')
  @ApiBearerAuth()
  @Get('actividad/:actividadId')
  @ApiOperation({ summary: 'Listar inscripciones por actividad específica' })
  findByActividad(@Param('actividadId', ParseIntPipe) actividadId: number) {
    return this.service.findByActividad(actividadId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Coordinador', 'Super Usuario')
  @ApiBearerAuth()
  @Patch(':id/nota')
  @ApiOperation({ summary: 'Actualizar nota de un estudiante' })
  actualizarNota(
    @Param('id', ParseIntPipe) id: number,
    @Body('nota') nota: number,
  ) {
    return this.service.actualizarNota(id, nota);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Coordinador', 'Super Usuario')
  @ApiBearerAuth()
  @Post()
  @ApiOperation({ summary: 'Inscribir estudiante manualmente (Coordinador)' })
  inscribir(@Body() dto: CreateInscripcionDto) {
    return this.service.inscribir(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Coordinador', 'Super Usuario')
  @ApiBearerAuth()
  @Put(':id')
  @ApiOperation({ summary: 'Cambiar estado de inscripción (Coordinador)' })
  cambiarEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body('estado', ParseIntPipe) estado: number,
    @Body('observacion') observacion?: string,
  ) {
    return this.service.cambiarEstado(id, Math.floor(estado), observacion);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Coordinador', 'Super Usuario')
  @ApiBearerAuth()
  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar inscripción (Coordinador)' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
