import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
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

  // ══════════════════════════════════════════════════════════
  //  VISTA ESTUDIANTE — mis asistencias
  // ══════════════════════════════════════════════════════════

  /**
   * Devuelve todas las asistencias del usuario autenticado,
   * incluyendo datos de sesión (fecha, hora) y actividad académica.
   * Ordenadas de más reciente a más antigua.
   */
  async findByUsuario(usuarioId: number) {
    return this.asistenciaRepository.find({
      where: {
        inscripcionModalidad: {
          inscripcion: {
            usuario: { id: usuarioId },
          },
        },
      },
      relations: [
        'sesionAcademica',
        'sesionAcademica.cursoModalidad',
        'sesionAcademica.cursoModalidad.actividadAcademica',
        'sesionAcademica.cursoModalidad.actividadAcademica.evento',
        'inscripcionModalidad',
        'inscripcionModalidad.cursoModalidad',
      ],
      order: { fecha_hora_registro: 'DESC' },
    });
  }

  // ══════════════════════════════════════════════════════════
  //  VISTA COORDINADOR — asistencias por actividad
  // ══════════════════════════════════════════════════════════

  /**
   * Lista todas las asistencias de todas las sesiones de una actividad académica.
   * Incluye nombre del estudiante, fecha/hora de la sesión y estado de asistencia.
   * Usado por el panel del Coordinador y Logística.
   */
  async findByActividad(actividadId: number) {
    return this.asistenciaRepository.find({
      where: {
        sesionAcademica: {
          cursoModalidad: {
            actividadAcademica: { id: actividadId },
          },
        },
      },
      relations: [
        'sesionAcademica',
        'sesionAcademica.cursoModalidad',
        'inscripcionModalidad',
        'inscripcionModalidad.inscripcion',
        'inscripcionModalidad.inscripcion.usuario',
        'inscripcionModalidad.inscripcion.usuario.persona',
      ],
      order: {
        sesionAcademica: { fecha: 'ASC' },
        fecha_hora_registro: 'ASC',
      },
    });
  }

  // ══════════════════════════════════════════════════════════
  //  REGISTRO POR QR
  // ══════════════════════════════════════════════════════════

  /**
   * Registra la asistencia de un estudiante identificado por su
   * id_inscripcion_modalidad al escanear un QR.
   *
   * El QR del estudiante debe contener su id_inscripcion_modalidad
   * y el id_sesion_academica de la sesión activa.
   *
   * Validaciones:
   *  - La sesión existe.
   *  - La sesión tiene un PIN generado (cod_verificacion NOT NULL), lo que
   *    indica que el docente activó el registro para esta sesión.
   *  - No existe ya una asistencia para esta combinación (anti-duplicado).
   */
  async registrarPorQR(dto: {
    id_inscripcion_modalidad: number;
    id_sesion: number;
  }): Promise<{ mensaje: string; asistencia_id: number }> {
    const { id_inscripcion_modalidad, id_sesion } = dto;

    // 1. Verificar que la sesión existe y está activa (tiene PIN)
    const sesion = await this.asistenciaRepository.manager
      .getRepository('sesiones_academicas')
      .findOne({ where: { id: id_sesion } });

    if (!sesion) {
      throw new NotFoundException(`Sesión ${id_sesion} no encontrada.`);
    }

    if (!(sesion as any).cod_verificacion) {
      throw new BadRequestException(
        'El registro por QR no está habilitado para esta sesión. El docente debe generar un PIN primero.',
      );
    }

    // 2. Anti-duplicado
    const yaRegistro = await this.asistenciaRepository.findOne({
      where: {
        sesionAcademica: { id: id_sesion },
        inscripcionModalidad: { id: id_inscripcion_modalidad },
      },
    });

    if (yaRegistro) {
      throw new BadRequestException(
        'Ya se registró asistencia para este estudiante en esta sesión.',
      );
    }

    // 3. Insertar asistencia
    const nuevaAsistencia = this.asistenciaRepository.create({
      sesionAcademica: { id: id_sesion },
      inscripcionModalidad: { id: id_inscripcion_modalidad },
      estado: 1,
      fecha_hora_registro: new Date(),
    });
    const guardada = await this.asistenciaRepository.save(nuevaAsistencia);

    return {
      asistencia_id: guardada.id,
      mensaje: 'Asistencia registrada correctamente por QR.',
    };
  }

  /**
   * Registra la asistencia a partir del id_usuario (obtenido del QR del estudiante
   * o del login del estudiante escaneando la sesión) y el id_sesion.
   */
  async registrarAsistenciaEstudiante(id_usuario: number, id_sesion: number): Promise<{ mensaje: string; asistencia_id: number }> {
    // 1. Encontrar la sesión para saber el id_curso_modalidad
    const sesion = await this.asistenciaRepository.manager
      .getRepository('sesiones_academicas')
      .findOne({ where: { id: id_sesion }, relations: ['cursoModalidad'] });

    if (!sesion) throw new NotFoundException(`Sesión ${id_sesion} no encontrada.`);

    const id_curso_modalidad = (sesion as any).cursoModalidad?.id;
    if (!id_curso_modalidad) throw new BadRequestException('La sesión no tiene un curso modalidad asociado.');

    // 2. Encontrar inscripcion_modalidad del usuario para ese curso_modalidad
    const inscripcionModalidad = await this.asistenciaRepository.manager
      .getRepository('inscripcion_modalidades')
      .findOne({
        where: {
          cursoModalidad: { id: id_curso_modalidad },
          inscripcion: { usuario: { id: id_usuario } }
        },
        relations: ['inscripcion']
      });

    if (!inscripcionModalidad) throw new BadRequestException('El estudiante no está inscrito en esta modalidad del curso.');

    const id_inscripcion_modalidad = (inscripcionModalidad as any).id;

    // 3. Anti-duplicado
    const yaRegistro = await this.asistenciaRepository.findOne({
      where: {
        sesionAcademica: { id: id_sesion },
        inscripcionModalidad: { id: id_inscripcion_modalidad },
      },
    });

    if (yaRegistro) {
      return { asistencia_id: yaRegistro.id, mensaje: 'El estudiante ya tiene asistencia registrada para esta sesión.' };
    }

    // 4. Insertar asistencia
    const nuevaAsistencia = this.asistenciaRepository.create({
      sesionAcademica: { id: id_sesion },
      inscripcionModalidad: { id: id_inscripcion_modalidad },
      estado: 1,
      fecha_hora_registro: new Date(),
    });
    const guardada = await this.asistenciaRepository.save(nuevaAsistencia);

    return {
      asistencia_id: guardada.id,
      mensaje: 'Asistencia registrada correctamente.',
    };
  }

  // ── CRUD estándar ──────────────────────────────────────────

  create(data: Partial<Asistencia>) {
    return this.asistenciaRepository.save(
      this.asistenciaRepository.create(data),
    );
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
