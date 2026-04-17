import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SesionAcademica } from './entities/sesion-academica.entity';
import { CreateSesionAcademicaDto } from './dto/create-sesion-academica.dto';
import { UpdateSesionAcademicaDto } from './dto/update-sesion-academica.dto';

@Injectable()
export class SesionesAcademicasService {
  constructor(
    @InjectRepository(SesionAcademica)
    private readonly sesionRepository: Repository<SesionAcademica>,
  ) {}

  // ── Coordinador ─────────────────────────────────────────────

  async create(dto: CreateSesionAcademicaDto) {
    const { id_curso_modalidad, ...rest } = dto;
    const sesion = this.sesionRepository.create({
      ...rest,
      modalidad: rest.modalidad_sesion, // Mapeo si el campo en entidad es 'modalidad'
      cursoModalidad: { id: id_curso_modalidad },
    });
    return this.sesionRepository.save(sesion);
  }

  async findByModalidad(modalidadId: number) {
    return this.sesionRepository.find({
      where: { cursoModalidad: { id: modalidadId } },
      order: { fecha: 'ASC', hora_inicio: 'ASC' },
      relations: ['asistencias'],
    });
  }

  async findOne(id: number) {
    const sesion = await this.sesionRepository.findOne({
      where: { id },
      relations: ['cursoModalidad', 'asistencias'],
    });
    if (!sesion) throw new NotFoundException(`Sesión ${id} no encontrada`);
    return sesion;
  }

  async update(id: number, dto: UpdateSesionAcademicaDto) {
    await this.findOne(id);
    const { id_curso_modalidad, ...rest } = dto;
    const payload: any = { ...rest };
    if (rest.modalidad_sesion) payload.modalidad = rest.modalidad_sesion;
    if (id_curso_modalidad) {
      payload.cursoModalidad = { id: id_curso_modalidad };
    }
    await this.sesionRepository.update(id, payload);
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.sesionRepository.delete(id);
    return { mensaje: `Sesión ${id} eliminada` };
  }

  findAll() {
    return this.sesionRepository.find({
      relations: ['cursoModalidad'],
    });
  }
}
