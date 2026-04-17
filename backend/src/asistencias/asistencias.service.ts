import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Asistencia } from './entities/asistencia.entity';
import { BatchAsistenciaDto } from './dto/batch-asistencia.dto';

@Injectable()
export class AsistenciasService {
  constructor(
    @InjectRepository(Asistencia)
    private readonly asistenciaRepository: Repository<Asistencia>,
  ) {}

  // ── Coordinador: Registro en Lote ──────────────────────────

  /**
   * Registra asistencias masivamente (batch) para una sesión.
   * Si la asistencia ya existe, la actualiza. Si no, la crea.
   */
  async registerBatch(dto: BatchAsistenciaDto) {
    const { id_sesion_academica, asistencias } = dto;
    
    // Obtener las asistencias existentes para esta sesión
    const existentes = await this.asistenciaRepository.find({
      where: { sesionAcademica: { id: id_sesion_academica } },
      relations: ['inscripcionModalidad'],
    });

    // Crear un mapa para búsqueda rápida
    const mapExistentes = new Map<number, Asistencia>();
    existentes.forEach((a) => {
      mapExistentes.set(a.inscripcionModalidad.id, a);
    });

    const guardados: Asistencia[] = [];

    for (const item of asistencias) {
      let asistencia = mapExistentes.get(item.id_inscripcion_modalidad);

      if (asistencia) {
        // Actualizar
        asistencia.estado = item.estado;
        asistencia.fecha_hora_registro = new Date();
      } else {
        // Crear nueva
        asistencia = this.asistenciaRepository.create({
          sesionAcademica: { id: id_sesion_academica },
          inscripcionModalidad: { id: item.id_inscripcion_modalidad },
          estado: item.estado,
          fecha_hora_registro: new Date(),
        });
      }

      guardados.push(await this.asistenciaRepository.save(asistencia));
    }

    return {
      mensaje: `Se procesaron ${guardados.length} registros de asistencia.`,
    };
  }

  /**
   * Obtener las asistencias de una sesión específica
   */
  async getBySesion(sesionId: number) {
    return this.asistenciaRepository.find({
      where: { sesionAcademica: { id: sesionId } },
      relations: [
        'inscripcionModalidad',
        'inscripcionModalidad.inscripcion',
        'inscripcionModalidad.inscripcion.usuario',
        'inscripcionModalidad.inscripcion.usuario.persona',
      ],
      order: { fecha_hora_registro: 'ASC' },
    });
  }

  // ── CRUD estándar ──────────────────────────────────────────

  create(data: Partial<Asistencia>) {
    return this.asistenciaRepository.save(this.asistenciaRepository.create(data));
  }

  findAll() {
    return this.asistenciaRepository.find();
  }

  findOne(id: number) {
    return this.asistenciaRepository.findOneBy({ id });
  }

  update(id: number, data: Partial<Asistencia>) {
    return this.asistenciaRepository.update(id, data);
  }

  remove(id: number) {
    return this.asistenciaRepository.delete(id);
  }
}
