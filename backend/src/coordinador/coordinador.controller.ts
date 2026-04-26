import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CoordinadorService } from './coordinador.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('Coordinador')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Coordinador', 'Super Usuario')
@Controller('coordinador')
export class CoordinadorController {
  constructor(private readonly coordinadorService: CoordinadorService) {}

  // ══════════════════════════════════════════════════════════
  //  DASHBOARD
  // ══════════════════════════════════════════════════════════

  @Get('dashboard-stats')
  @ApiOperation({ summary: 'Estadísticas generales para el dashboard del coordinador' })
  getDashboardStats() {
    return this.coordinadorService.getDashboardStats();
  }

  // ══════════════════════════════════════════════════════════
  //  ESTADÍSTICAS
  // ══════════════════════════════════════════════════════════

  /**
   * GET /coordinador/estadisticas/inscritos
   * Número de inscritos por actividad académica.
   * Soporta filtro por evento (?eventoId=X).
   * Usado para generar gráficas de barras en el dashboard.
   */
  @Get('estadisticas/inscritos')
  @ApiOperation({
    summary:
      'Inscritos por actividad académica — datos para gráfica de barras (Coord/Admin)',
  })
  @ApiQuery({ name: 'eventoId', required: false, type: Number })
  getEstadisticasInscritos(@Query('eventoId') eventoId?: string) {
    return this.coordinadorService.getEstadisticasInscritos(
      eventoId ? Number(eventoId) : undefined,
    );
  }

  // ══════════════════════════════════════════════════════════
  //  GESTIÓN DE PONENTES
  // ══════════════════════════════════════════════════════════

  /**
   * GET /coordinador/ponentes-disponibles
   * Lista los ponentes (rol=Ponente, estado=1) que NO tienen ninguna
   * impartición registrada en el evento indicado.
   * Soporta filtro por evento (?eventoId=X).
   * Equivalente al endpoint /ponentes-disponibles del sistema Flask.
   */
  @Get('ponentes-disponibles')
  @ApiOperation({
    summary:
      'Ponentes sin actividad asignada (disponibles para asignación) (Coord/Admin)',
  })
  @ApiQuery({ name: 'eventoId', required: false, type: Number })
  getPonentesSinActividad(@Query('eventoId') eventoId?: string) {
    return this.coordinadorService.getPonentesSinActividad(
      eventoId ? Number(eventoId) : undefined,
    );
  }

  // ══════════════════════════════════════════════════════════
  //  VISTA DE ACTIVIDAD
  // ══════════════════════════════════════════════════════════

  /**
   * GET /coordinador/actividad/:id/participantes
   * Ponente(s) asignados + lista de estudiantes inscritos de una actividad.
   * Equivalente al endpoint /cursos/:id/participantes del sistema Flask.
   */
  @Get('actividad/:id/participantes')
  @ApiOperation({
    summary:
      'Ponente(s) + lista de estudiantes de una actividad (Coord/Admin)',
  })
  getParticipantesActividad(@Param('id', ParseIntPipe) id: number) {
    return this.coordinadorService.getParticipantesActividad(id);
  }
}
