import { Controller, Get, Post, Param, ParseIntPipe, UseGuards, HttpCode, HttpStatus, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SesionesAcademicasService } from './sesiones-academicas.service';
import { JwtAuthGuard } from '../../Seguridad/auth/jwt-auth.guard';
import { RolesGuard } from '../../Seguridad/auth/roles.guard';
import { Roles } from '../../Seguridad/auth/roles.decorator';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CoordinacionEvento } from '../coordinaciones/entities/coordinacion.entity';
import { ActividadAcademica } from '../actividades-academicas/entities/actividad-academica.entity';

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
    private readonly dataSource: DataSource,
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

    const actividades = await this.dataSource.getRepository(ActividadAcademica).createQueryBuilder('act')
      .innerJoinAndSelect('act.evento', 'evento')
      .leftJoinAndSelect('act.modalidades', 'modalidad')
      .leftJoinAndSelect('modalidad.sesiones', 'sesion')
      .where("act.logistica_ids @> :userIdJson", { userIdJson: JSON.stringify([Number(userId)]) })
      .getMany();

    const eventosMap = new Map<number, any>();
    for (const act of actividades) {
      const ev = act.evento;
      if (!eventosMap.has(ev.id)) {
        eventosMap.set(ev.id, {
          id: ev.id,
          nombre: ev.nombre,
          estado: ev.estado,
          fase: ev.fase,
          actividades: []
        });
      }

      const mappedAct = {
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
      };
      eventosMap.get(ev.id).actividades.push(mappedAct);
    }

    return Array.from(eventosMap.values());
  }
}
