import { Controller, Get, Post, Param, ParseIntPipe, UseGuards, HttpCode, HttpStatus, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SesionesAcademicasService } from './sesiones-academicas.service';
import { JwtAuthGuard } from '../../Seguridad/auth/jwt-auth.guard';
import { RolesGuard } from '../../Seguridad/auth/roles.guard';
import { Roles } from '../../Seguridad/auth/roles.decorator';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CoordinacionEvento } from '../coordinaciones/entities/coordinacion.entity';

@ApiTags('Sesiones Académicas (Logística)')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Logística', 'Logistica')
@ApiBearerAuth()
@Controller('logistica/sesiones-academicas')
export class SesionesAcademicasLogisticaController {
  constructor(
    private readonly service: SesionesAcademicasService,
    @InjectRepository(CoordinacionEvento)
    private readonly coordinacionRepo: Repository<CoordinacionEvento>,
  ) {}

  @Post(':id/generar-pin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generar PIN de asistencia (Logística)' })
  generarPin(@Param('id', ParseIntPipe) id: number) {
    return this.service.generarPin(id);
  }

  /**
   * Devuelve los eventos asignados al usuario logístico con sus actividades y sesiones.
   */
  @Get('mis-eventos')
  @ApiOperation({ summary: 'Obtener eventos asignados al logístico con actividades y sesiones' })
  async misEventos(@Req() req: any) {
    const userId = req.user?.id || req.user?.sub;

    const coordinaciones = await this.coordinacionRepo.find({
      where: { usuario: { id: userId } },
      relations: [
        'evento',
        'evento.actividades',
        'evento.actividades.modalidades',
        'evento.actividades.modalidades.sesiones',
      ],
    });

    return coordinaciones.map(c => ({
      id: c.evento.id,
      nombre: c.evento.nombre,
      estado: c.evento.estado,
      fase: c.evento.fase,
      actividades: (c.evento.actividades || []).map((act: any) => ({
        id: act.id,
        nombre: act.nombre,
        estado: act.estado,
        sesiones: (act.modalidades || []).flatMap((m: any) =>
          (m.sesiones || []).map((s: any) => ({
            id: s.id,
            fecha: s.fecha,
            hora_inicio: s.hora_inicio,
            hora_fin: s.hora_fin,
            aula: s.aula,
          }))
        ),
      })),
    }));
  }
}
