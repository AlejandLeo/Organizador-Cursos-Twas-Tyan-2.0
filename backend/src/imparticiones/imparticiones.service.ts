import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Imparticion } from './entities/imparticion.entity';
import { CreateImparticionDto } from './dto/create-imparticion.dto';

@Injectable()
export class ImparticionesService {
  constructor(
    @InjectRepository(Imparticion)
    private readonly imparticionRepository: Repository<Imparticion>,
  ) {}

  // ── Coordinador ─────────────────────────────────────────────

  /** Asignar un ponente a una actividad y evento */
  async asignar(dto: CreateImparticionDto) {
    const imparticion = this.imparticionRepository.create({
      usuario: { id: dto.id_usuario },
      actividadAcademica: { id: dto.id_actividad_academica },
      evento: { id: dto.id_evento },
    });
    return this.imparticionRepository.save(imparticion);
  }

  /** Remover una asignación de ponente */
  async remover(id: number) {
    const imparticion = await this.imparticionRepository.findOneBy({ id });
    if (!imparticion) {
      throw new NotFoundException(`Impartición ${id} no encontrada`);
    }
    await this.imparticionRepository.delete(id);
    return { mensaje: `Impartición ${id} eliminada` };
  }

  /** Listar imparticiones de un evento específico (directorio) */
  async findByEvento(eventoId: number) {
    return this.imparticionRepository.find({
      where: { evento: { id: eventoId } },
      relations: ['usuario', 'usuario.persona', 'actividadAcademica'],
    });
  }

  // ── Métodos legacy (scaffold default) ──────────────────────

  create(data: Partial<Imparticion>) {
    return this.imparticionRepository.save(this.imparticionRepository.create(data));
  }

  findAll() {
    return this.imparticionRepository.find({
      relations: ['usuario', 'actividadAcademica', 'evento'],
    });
  }

  findOne(id: number) {
    return this.imparticionRepository.findOne({
      where: { id },
      relations: ['usuario', 'actividadAcademica', 'evento'],
    });
  }

  update(id: number, data: Partial<Imparticion>) {
    return this.imparticionRepository.update(id, data);
  }

  remove(id: number) {
    return this.imparticionRepository.delete(id);
  }
}
