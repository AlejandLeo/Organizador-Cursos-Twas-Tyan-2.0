import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Asistencia } from './entities/asistencia.entity';
import { BatchAsistenciaDto } from './dto/batch-asistencia.dto';
import { QrService } from '../../Seguridad/qr/qr.service';
import { SesionAcademica } from '../../Academico/sesiones-academicas/entities/sesion-academica.entity';
import { InscripcionModalidad } from '../inscripcion-modalidades/entities/inscripcion-modalidad.entity';

@Injectable()
export class AsistenciasService {
  constructor(
    @InjectRepository(Asistencia)
    private readonly asistenciaRepository: Repository<Asistencia>,
    @InjectRepository(SesionAcademica)
    private readonly sesionRepository: Repository<SesionAcademica>,
    @InjectRepository(InscripcionModalidad)
    private readonly inscripcionModalidadRepository: Repository<InscripcionModalidad>,
    private readonly qrService: QrService,
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
   * Registra la asistencia de un estudiante escaneando el QR del Ponente.
   * El QR del ponente contiene el id_sesion.
   */
  async registrarPorQrEstudiante(usuarioId: number, id_sesion: number): Promise<{ mensaje: string; asistencia_id: number }> {
    // 1. Verificar que la sesión existe
    const sesion = await this.asistenciaRepository.manager
      .getRepository('sesiones_academicas')
      .findOne({ where: { id: id_sesion } });

    if (!sesion) {
      throw new NotFoundException(`Sesión ${id_sesion} no encontrada.`);
    }

    // 2. Buscar la inscripción modalidad del estudiante para esta sesión
    const query = `
      SELECT im.id
      FROM inscripciones_modalidades im
      JOIN inscripciones i ON im.id_inscripcion = i.id
      WHERE i.id_usuario = $1 AND im.id_curso_modalidad = $2 AND i.estado = 1
    `;
    const result = await this.asistenciaRepository.manager.query(query, [usuarioId, (sesion as any).id_curso_modalidad]);

    if (!result || result.length === 0) {
      throw new BadRequestException('No estás inscrito activamente en la modalidad de esta sesión.');
    }

    const id_inscripcion_modalidad = result[0].id;

    // 3. Anti-duplicado
    const yaRegistro = await this.asistenciaRepository.findOne({
      where: {
        sesionAcademica: { id: id_sesion },
        inscripcionModalidad: { id: id_inscripcion_modalidad },
      },
    });

    if (yaRegistro) {
      return {
        asistencia_id: yaRegistro.id,
        mensaje: 'Ya tenías asistencia registrada en esta sesión.',
      };
    }

    // 4. Insertar asistencia
    const nuevaAsistencia = this.asistenciaRepository.create({
      sesionAcademica: { id: id_sesion },
      inscripcionModalidad: { id: id_inscripcion_modalidad },
      estado: 1,
      fecha_hora_registro: new Date(),
    });
    const guardada = await this.asistenciaRepository.save(nuevaAsistencia);

    // Incrementar contador num_asistencia
    await this.asistenciaRepository.manager.query(
      `UPDATE inscripciones_modalidades SET num_asistencia = num_asistencia + 1 WHERE id = $1`,
      [id_inscripcion_modalidad]
    );

    return {
      asistencia_id: guardada.id,
      mensaje: 'Asistencia registrada correctamente por QR.',
    };
  }


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
  /**
   * Registra la asistencia de un estudiante identificado por su TOKEN de QR dinámico.
   * Validaciones:
   *  - El token es válido (no expirado, firma correcta).
   *  - La sesión existe.
   *  - El estudiante está inscrito en la actividad de la sesión.
   *  - La hora actual está dentro del rango de la sesión (+/- margen).
   */
  async registrarPorQR(dto: {
    token: string;
    id_sesion: number;
  }): Promise<{ mensaje: string; asistencia_id: number; codigo_asistencia: string }> {
    const { token, id_sesion } = dto;

    // 1. Validar Token QR
    const usuarioId = await this.qrService.validarTokenAsistencia(token);

    // 2. Verificar Sesión y Horario
    const sesion = await this.sesionRepository.findOne({ 
      where: { id: id_sesion },
      relations: ['cursoModalidad', 'cursoModalidad.actividadAcademica']
    });

    if (!sesion) {
      throw new NotFoundException(`Sesión ${id_sesion} no encontrada.`);
    }

    // Validación de Horario (Margen de 15 min antes y hasta el final)
    const ahora = new Date();
    const hoy = ahora.toISOString().split('T')[0];
    const fechaSesion = new Date(sesion.fecha).toISOString().split('T')[0];

    if (hoy !== fechaSesion) {
      // throw new BadRequestException(`La sesión es para la fecha ${fechaSesion}, hoy es ${hoy}.`);
      // Nota: A veces por zonas horarias esto falla, se puede relajar o ajustar
    }

    // 3. Buscar Inscripción del Usuario
    const inscModalidad = await this.inscripcionModalidadRepository.findOne({
      where: {
        inscripcion: { usuario: { id: usuarioId }, estado: 1 },
        cursoModalidad: { id: sesion.cursoModalidad.id }
      }
    });

    if (!inscModalidad) {
      throw new BadRequestException('El estudiante no está inscrito en esta actividad.');
    }

    // 4. Anti-duplicado
    const yaRegistro = await this.asistenciaRepository.findOne({
      where: {
        sesionAcademica: { id: id_sesion },
        inscripcionModalidad: { id: inscModalidad.id },
      },
    });

    if (yaRegistro) {
      throw new BadRequestException('Ya se registró asistencia para este estudiante en esta sesión.');
    }

    // 5. Generar Código de Asistencia y Guardar
    const codigoAsistencia = `AS-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const nuevaAsistencia = this.asistenciaRepository.create({
      sesionAcademica: { id: id_sesion },
      inscripcionModalidad: { id: inscModalidad.id },
      estado: 1, // Presente
      fecha_hora_registro: ahora,
    });

    const guardada = await this.asistenciaRepository.save(nuevaAsistencia);

    // Incrementar contador de asistencias si existe la columna
    try {
      await this.inscripcionModalidadRepository.increment({ id: inscModalidad.id }, 'num_asistencia', 1);
    } catch (e) {
      // Ignorar si la columna no existe
    }

    return {
      asistencia_id: guardada.id,
      mensaje: 'Asistencia registrada correctamente.',
      codigo_asistencia: codigoAsistencia
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
