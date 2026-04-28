import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ActividadAcademica } from './entities/actividad-academica.entity';
import { CreateActividadDto } from './dto/create-actividad.dto';
import { UpdateActividadDto } from './dto/update-actividad.dto';

@Injectable()
export class ActividadesAcademicasService {
  constructor(
    @InjectRepository(ActividadAcademica)
    private readonly actividadRepository: Repository<ActividadAcademica>,
    private readonly dataSource: DataSource,
  ) {}

  async verificarPropiedad(eventoId: number, usuario: any) {
    if (!usuario) return;
    if (usuario.roles?.includes('Super Usuario')) return;

    const coord = await this.dataSource.query(
      `SELECT 1 FROM coordinacion_eventos WHERE id_evento = $1 AND id_usuario = $2`,
      [eventoId, usuario.id]
    );

    if (coord.length === 0) {
      throw new ForbiddenException('No tienes permisos sobre el evento de esta actividad académica.');
    }
  }

  // ── CRUD básico ────────────────────────────────────────────

  findAll() {
    return this.actividadRepository.find({ relations: ['evento', 'inscripciones'] });
  }

  async findOne(id: number) {
    const act = await this.actividadRepository.findOne({
      where: { id },
      relations: ['evento', 'modalidades', 'imparticiones', 'imparticiones.usuario', 'imparticiones.usuario.persona'],
    });
    if (!act) throw new NotFoundException(`Actividad ${id} no encontrada.`);
    return act;
  }

  // ── Coordinador ─────────────────────────────────────────────

  /** Lista todas las actividades de un evento (para el panel del coordinador) */
  findByEvento(eventoId: number, usuario?: any) {
    const query = this.actividadRepository.createQueryBuilder('a')
      .leftJoinAndSelect('a.modalidades', 'm')
      .innerJoin('a.evento', 'e')
      .where('e.id = :eventoId', { eventoId })
      .orderBy('a.fecha_inicio', 'ASC');

    if (usuario && !usuario.roles?.includes('Super Usuario')) {
      query.innerJoin('e.coordinaciones', 'c')
           .andWhere('c.usuario.id = :usuarioId', { usuarioId: usuario.id });
    }

    return query.getMany();
  }

  /** Crea una actividad asignándola al evento indicado en el DTO */
  async crear(dto: CreateActividadDto, usuario?: any) {
    if (usuario) {
      await this.verificarPropiedad(dto.id_evento, usuario);
    }
    const { id_evento, ...campos } = dto;
    const actividad = this.actividadRepository.create({
      ...campos,
      evento: { id: id_evento },
    });
    return this.actividadRepository.save(actividad);
  }

  async actualizar(id: number, dto: UpdateActividadDto, usuario?: any) {
    const act = await this.findOne(id);
    
    if (usuario) {
      // Verificar permiso en el evento original
      await this.verificarPropiedad(act.evento.id, usuario);
      // Si cambia de evento, verificar permiso en el nuevo evento
      if (dto.id_evento && dto.id_evento !== act.evento.id) {
        await this.verificarPropiedad(dto.id_evento, usuario);
      }
    }

    const { id_evento, ...campos } = dto;
    const data: any = { ...campos };
    if (id_evento) data.evento = { id: id_evento };
    await this.actividadRepository.update(id, data);
    return this.findOne(id);
  }

  async eliminar(id: number, usuario?: any) {
    const act = await this.findOne(id);
    if (usuario) {
      await this.verificarPropiedad(act.evento.id, usuario);
    }
    await this.actividadRepository.delete(id);
    return { mensaje: `Actividad ${id} eliminada correctamente.` };
  }

  // Métodos legacy
  create(data: Partial<ActividadAcademica>) {
    const actividad = this.actividadRepository.create(data);
    return this.actividadRepository.save(actividad);
  }

  update(id: number, data: Partial<ActividadAcademica>) {
    return this.actividadRepository.update(id, data);
  }

  remove(id: number) {
    return this.actividadRepository.delete(id);
  }
}
