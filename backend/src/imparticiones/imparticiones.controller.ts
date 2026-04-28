import {
  Controller,
  Get,
  Post,
  Body,
  Delete,
  Param,
  ParseIntPipe,
  UseGuards,
  Query,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ImparticionesService } from './imparticiones.service';
import { CreateImparticionDto } from './dto/create-imparticion.dto';
import { AsignarPonenteDto } from './dto/asignar-ponente.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('Imparticiones')
@Controller('imparticiones')
export class ImparticionesController {
  constructor(private readonly service: ImparticionesService) {}

  // ── Coordinador ─────────────────────────────────────────────

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Coordinador', 'Super Usuario')
  @ApiBearerAuth()
  @Post()
  @ApiOperation({ summary: 'Asignar un usuario existente a una actividad (Coordinador)' })
  asignar(@Body() dto: CreateImparticionDto) {
    return this.service.asignar(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Coordinador', 'Super Usuario')
  @ApiBearerAuth()
  @Post('asignar-ponente')
  @ApiOperation({ summary: 'Vincular/Crear un ponente a una actividad (Coordinador)' })
  asignarPonente(@Body() dto: AsignarPonenteDto) {
    return this.service.asignarPonente(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Coordinador', 'Super Usuario')
  @ApiBearerAuth()
  @Get()
  @ApiOperation({ summary: 'Ver asignaciones filtrables por evento (Coordinador)' })
  findByEvento(@Query('eventoId') eventoId?: string) {
    if (eventoId) {
      return this.service.findByEvento(Number(eventoId));
    }
    return this.service.findAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Coordinador', 'Super Usuario')
  @ApiBearerAuth()
  @Get('actividad/:actividadId')
  @ApiOperation({ summary: 'Ver ponentes de una actividad específica (Coordinador)' })
  findByActividad(@Param('actividadId', ParseIntPipe) actividadId: number) {
    return this.service.findByActividad(actividadId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Coordinador', 'Super Usuario')
  @ApiBearerAuth()
  @Delete(':id')
  @ApiOperation({ summary: 'Remover asignación de ponente (Coordinador)' })
  remover(@Param('id', ParseIntPipe) id: number) {
    return this.service.remover(id);
  }

  // ══════════════════════════════════════════════════════════
  //  PONENTE — Vista personal
  // ══════════════════════════════════════════════════════════

  /**
   * GET /imparticiones/mis-actividades
   * Lista las actividades académicas que imparte el ponente autenticado.
   * El ponente no necesita pasar su ID — se extrae del JWT.
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Ponente', 'Coordinador', 'Super Usuario')
  @ApiBearerAuth()
  @Get('mis-actividades')
  @ApiOperation({ summary: 'Mis actividades (Ponente autenticado)' })
  misActividades(@Request() req: any) {
    return this.service.findMisActividades(req.user.id);
  }

  /**
   * GET /imparticiones/mis-estudiantes
   * Lista los estudiantes inscritos en las actividades del ponente autenticado.
   * Incluye notas y asistencias. Agrupado por actividad.
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Ponente', 'Coordinador', 'Super Usuario')
  @ApiBearerAuth()
  @Get('mis-estudiantes')
  @ApiOperation({ summary: 'Mis estudiantes con notas (Ponente autenticado)' })
  misEstudiantes(@Request() req: any) {
    return this.service.findMisEstudiantes(req.user.id);
  }
}
