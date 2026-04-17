import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inscripcion } from './entities/inscripcion.entity';
import { CreateInscripcionDto } from './dto/create-inscripcion.dto';
import { UpdateInscripcionDto } from './dto/update-inscripcion.dto';

@Injectable()
export class InscripcionesService {
  constructor(
    @InjectRepository(Inscripcion)
    private readonly inscripcionRepository: Repository<Inscripcion>,
  ) {}

  // ── Coordinador ─────────────────────────────────────────────

  async findByEvento(eventoId: number, page = 1, limit = 20) {
    const [data, total] = await this.inscripcionRepository.findAndCount({
      where: { actividadAcademica: { evento: { id: eventoId } } },
      relations: [
        'usuario',
        'usuario.persona',
        'actividadAcademica',
        'modalidades',
      ],
      order: { fecha_creacion: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit };
  }

  async inscribir(dto: CreateInscripcionDto) {
    const { id_usuario, id_actividad_academica, ...rest } = dto;
    const inscripcion = this.inscripcionRepository.create({
      ...rest,
      usuario: { id: id_usuario },
      actividadAcademica: { id: id_actividad_academica },
    });
    return this.inscripcionRepository.save(inscripcion);
  }

  async cambiarEstado(id: number, estado: number) {
    const inscripcion = await this.inscripcionRepository.findOneBy({ id });
    if (!inscripcion) throw new NotFoundException(`Inscripción ${id} no encontrada`);
    await this.inscripcionRepository.update(id, { estado });
    return this.inscripcionRepository.findOneBy({ id });
  }

  // ── Métodos CRUD estándar ──────────────────────────────────

  create(data: Partial<Inscripcion>) {
    return this.inscripcionRepository.save(this.inscripcionRepository.create(data));
  }

  findAll() {
    return this.inscripcionRepository.find({
      relations: ['usuario', 'actividadAcademica'],
    });
  }

  findOne(id: number) {
    return this.inscripcionRepository.findOne({
      where: { id },
      relations: ['usuario', 'actividadAcademica', 'modalidades'],
    });
  }

  update(id: number, data: Partial<Inscripcion>) {
    return this.inscripcionRepository.update(id, data);
  }

  remove(id: number) {
    return this.inscripcionRepository.delete(id);
  }
}
