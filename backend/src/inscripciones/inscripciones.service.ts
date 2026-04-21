import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
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
  ) { }

  // ── Estudiante ─────────────────────────────────────────────

  async findByUsuario(usuarioId: number) {
    return this.inscripcionRepository.find({
      where: { usuario: { id: usuarioId } },
      relations: [
        'actividadAcademica',
        'actividadAcademica.evento',
        'actividadAcademica.modalidades',
      ],
      order: { fecha_creacion: 'DESC' },
    });
  }

  // ── Coordinador ─────────────────────────────────────────────

  async findByEvento(eventoId: number, page = 1, limit = 20) {
    const [data, total] = await this.inscripcionRepository.findAndCount({
      where: { actividadAcademica: { evento: { id: eventoId } } },
      relations: [
        'usuario',
        'usuario.persona',
        'actividadAcademica',
        'actividadAcademica.evento',
        'modalidades',
        'modalidades.cursoModalidad',
      ],
      order: { fecha_creacion: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit };
  }

  async findByActividad(actividadId: number) {
    return this.inscripcionRepository.find({
      where: { actividadAcademica: { id: actividadId } },
      relations: [
        'usuario',
        'usuario.persona',
        'usuario.afiliaciones',
        'usuario.afiliaciones.gradoAcademico',
        'modalidades',
        'modalidades.cursoModalidad',
      ],
      order: { usuario: { persona: { primer_apellido: 'ASC' } } },
    });
  }

  async actualizarNota(id: number, nota: number) {
    const ins = await this.inscripcionRepository.findOneBy({ id });
    if (!ins) throw new NotFoundException('Inscripción no encontrada');
    await this.inscripcionRepository.update(id, { nota_principal: nota });
    return { id, nota_principal: nota, mensaje: 'Nota actualizada' };
  }

  async inscribir(dto: CreateInscripcionDto) {
    const { id_usuario, id_actividad_academica, ...rest } = dto;

    // Check if the user is already inscribed or pre-inscribed
    const existing = await this.inscripcionRepository.findOne({
      where: {
        usuario: { id: id_usuario },
        actividadAcademica: { id: id_actividad_academica }
      }
    });

    if (existing) {
      throw new ConflictException(`El usuario ya cuenta con una inscripción o pre-inscripción en esta actividad.`);
    }

    const inscripcion = this.inscripcionRepository.create({
      ...rest,
      usuario: { id: id_usuario },
      actividadAcademica: { id: id_actividad_academica },
    });
    return this.inscripcionRepository.save(inscripcion);
  }

  async cambiarEstado(id: number, estado: number, observacion?: string) {
    const inscripcion = await this.inscripcionRepository.findOneBy({ id });
    if (!inscripcion) throw new NotFoundException(`Inscripción ${id} no encontrada`);
    await this.inscripcionRepository.update(id, { estado, observacion });
    return this.inscripcionRepository.findOneBy({ id });
  }

  // ── Métodos CRUD estándar ──────────────────────────────────

  create(data: Partial<Inscripcion>) {
    return this.inscripcionRepository.save(this.inscripcionRepository.create(data));
  }

  findAll() {
    return this.inscripcionRepository.find({
      relations: ['usuario', 'usuario.persona', 'actividadAcademica', 'actividadAcademica.evento'],
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

