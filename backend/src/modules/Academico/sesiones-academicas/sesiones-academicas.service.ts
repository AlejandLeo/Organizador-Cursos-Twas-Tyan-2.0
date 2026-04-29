import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
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

  // ══════════════════════════════════════════════════════════
  //  PIN DE ASISTENCIA
  // ══════════════════════════════════════════════════════════

  /**
   * Genera un PIN numérico de 6 dígitos para la sesión indicada.
   *
   * El PIN se almacena hasheado en el campo cod_verificacion usando bcrypt
   * (mismo mecanismo que las contraseñas), y también se devuelve en texto
   * plano para que el docente lo proyecte en clase.
   *
   * Cada llamada sobrescribe el PIN anterior, por lo que el coordinador
   * puede rotar el PIN si sospecha que fue filtrado.
   */
  async generarPin(sesionId: number): Promise<{
    pin: string;
    sesion_id: number;
    mensaje: string;
  }> {
    await this.findOne(sesionId); // valida existencia

    // Genera PIN aleatorio de 6 dígitos: 000000 – 999999
    const pin = String(Math.floor(Math.random() * 1_000_000)).padStart(6, '0');

    // Hashea con bcrypt (costo 10, mismo que contraseñas)
    const pinHash = await bcrypt.hash(pin, 10);

    // Persiste el hash en cod_verificacion
    await this.sesionRepository.update(sesionId, {
      cod_verificacion: pinHash,
    });

    return {
      pin,
      sesion_id: sesionId,
      mensaje: 'PIN generado. Muéstralo en clase para el registro de asistencia.',
    };
  }

  /**
   * Valida el PIN ingresado comparándolo contra el hash almacenado.
   *
   * No expone el hash ni el PIN original.
   * Retorna { valido: true } o lanza BadRequestException.
   */
  async verificarPin(
    sesionId: number,
    pin: string,
  ): Promise<{ valido: boolean; sesion_id: number }> {
    const sesion = await this.findOne(sesionId);

    if (!sesion.cod_verificacion) {
      throw new BadRequestException(
        `La sesión ${sesionId} no tiene un PIN generado aún.`,
      );
    }

    if (!pin || pin.trim() === '') {
      throw new BadRequestException('El PIN no puede estar vacío.');
    }

    const valido = await bcrypt.compare(pin.trim(), sesion.cod_verificacion);

    if (!valido) {
      throw new BadRequestException('PIN incorrecto.');
    }

    return { valido: true, sesion_id: sesionId };
  }

  /**
   * Devuelve las sesiones de hoy (o de una modalidad específica) que ya
   * tienen un PIN generado (cod_verificacion NOT NULL).
   * Usado por el formulario público de registro de asistencia por PIN.
   */
  async findActivas(modalidadId?: number) {
    const hoy = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    const qb = this.sesionRepository
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.cursoModalidad', 'cm')
      .leftJoinAndSelect('cm.actividadAcademica', 'act')
      .where('s.fecha = :hoy', { hoy })
      .andWhere('s.cod_verificacion IS NOT NULL');

    if (modalidadId) {
      qb.andWhere('cm.id = :modalidadId', { modalidadId });
    }

    return qb.orderBy('s.hora_inicio', 'ASC').getMany();
  }
}
