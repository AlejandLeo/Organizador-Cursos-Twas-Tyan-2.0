import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActividadAcademica } from './entities/actividad-academica.entity';
import { CreateActividadDto } from './dto/create-actividad.dto';
import { UpdateActividadDto } from './dto/update-actividad.dto';

@Injectable()
export class ActividadesAcademicasService {
  constructor(
    @InjectRepository(ActividadAcademica)
    private readonly actividadRepository: Repository<ActividadAcademica>,
  ) {}

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
  findByEvento(eventoId: number) {
    return this.actividadRepository.find({
      where: { evento: { id: eventoId } },
      relations: ['modalidades'],
      order: { fecha_inicio: 'ASC' },
    });
  }

  /** Crea una actividad asignándola al evento indicado en el DTO */
  async crear(dto: CreateActividadDto) {
    const { id_evento, ...campos } = dto;
    const actividad = this.actividadRepository.create({
      ...campos,
      evento: { id: id_evento },
    });
    return this.actividadRepository.save(actividad);
  }

  async actualizar(id: number, dto: UpdateActividadDto) {
    await this.findOne(id);
    const { id_evento, ...campos } = dto;
    const data: any = { ...campos };
    if (id_evento) data.evento = { id: id_evento };
    await this.actividadRepository.update(id, data);
    return this.findOne(id);
  }

  async eliminar(id: number) {
    await this.findOne(id);
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
