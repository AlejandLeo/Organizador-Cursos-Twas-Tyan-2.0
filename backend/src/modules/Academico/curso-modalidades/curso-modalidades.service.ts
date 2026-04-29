import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CursoModalidad } from './entities/curso-modalidad.entity';
import { CreateCursoModalidadDto } from './dto/create-curso-modalidad.dto';
import { UpdateCursoModalidadDto } from './dto/update-curso-modalidad.dto';

@Injectable()
export class CursoModalidadesService {
  constructor(
    @InjectRepository(CursoModalidad)
    private readonly cursoModalidadesRepository: Repository<CursoModalidad>,
  ) {}

  // ── Coordinador ─────────────────────────────────────────────

  async create(dto: CreateCursoModalidadDto) {
    const { id_actividad_academica, ...datos } = dto;
    const modalidad = this.cursoModalidadesRepository.create({
      ...datos,
      actividadAcademica: { id: id_actividad_academica },
    });
    return this.cursoModalidadesRepository.save(modalidad);
  }

  async findAll() {
    return this.cursoModalidadesRepository.find({
      relations: ['actividadAcademica'],
    });
  }

  async findByActividad(actividadId: number) {
    return this.cursoModalidadesRepository.find({
      where: { actividadAcademica: { id: actividadId } },
      relations: ['sesiones'],
      order: { fecha_creacion: 'ASC' },
    });
  }

  async findOne(id: number) {
    const modalidad = await this.cursoModalidadesRepository.findOne({
      where: { id },
      relations: ['actividadAcademica', 'sesiones'],
    });
    if (!modalidad) throw new NotFoundException(`Modalidad ${id} no encontrada`);
    return modalidad;
  }

  async update(id: number, dto: UpdateCursoModalidadDto) {
    await this.findOne(id);
    const { id_actividad_academica, ...datos } = dto;
    const payload: any = { ...datos };
    if (id_actividad_academica) {
      payload.actividadAcademica = { id: id_actividad_academica };
    }
    await this.cursoModalidadesRepository.update(id, payload);
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.cursoModalidadesRepository.delete(id);
    return { mensaje: `Modalidad ${id} eliminada correctamente` };
  }
}
