import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not, IsNull } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Inscripcion } from './entities/inscripcion.entity';
import { CreateInscripcionDto } from './dto/create-inscripcion.dto';
import { UpdateInscripcionDto } from './dto/update-inscripcion.dto';
import { RegistrarAsistenciaPinDto } from './dto/registrar-asistencia-pin.dto';
import { SesionAcademica } from '../../Academico/sesiones-academicas/entities/sesion-academica.entity';
import { Asistencia } from '../../Inscripciones/asistencias/entities/asistencia.entity';
import { InscripcionModalidad } from '../../Inscripciones/inscripcion-modalidades/entities/inscripcion-modalidad.entity';
import { Imparticion } from '../../Academico/imparticiones/entities/imparticion.entity';
import { Usuario } from '../../Usuario/usuarios/entities/usuario.entity';
import { MailService } from '../../Comun/mail/mail.service';

@Injectable()
export class InscripcionesService {
  constructor(
    @InjectRepository(Inscripcion)
    private readonly inscripcionRepository: Repository<Inscripcion>,
    @InjectRepository(SesionAcademica)
    private readonly sesionRepository: Repository<SesionAcademica>,
    @InjectRepository(Asistencia)
    private readonly asistenciaRepository: Repository<Asistencia>,
    @InjectRepository(InscripcionModalidad)
    private readonly inscripcionModalidadRepository: Repository<InscripcionModalidad>,
    @InjectRepository(Imparticion)
    private readonly imparticionRepository: Repository<Imparticion>,
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    private readonly mailService: MailService,
  ) {}

  // ── Estudiante ─────────────────────────────────────────────

  async findByUsuario(usuarioId: number) {
    return this.inscripcionRepository.find({
      where: { usuario: { id: usuarioId } },
      relations: [
        'actividadAcademica',
        'actividadAcademica.evento',
        'actividadAcademica.modalidades',
        'modalidades',
        'modalidades.cursoModalidad',
      ],
      order: { fecha_creacion: 'DESC' },
    });
  }

  // ── Ponente ─────────────────────────────────────────────

  async findByActividadParaPonente(actividadId: number, ponenteId: number) {
    const esPonente = await this.imparticionRepository.findOne({
      where: {
        actividadAcademica: { id: actividadId },
        usuario: { id: ponenteId },
      },
    });

    if (!esPonente) {
      throw new ForbiddenException('No estás asignado como ponente a esta actividad académica');
    }

    return this.findByActividad(actividadId);
  }

  async actualizarNotaParaPonente(actividadId: number, inscripcionId: number, nota: number, ponenteId: number) {
    const esPonente = await this.imparticionRepository.findOne({
      where: {
        actividadAcademica: { id: actividadId },
        usuario: { id: ponenteId },
      },
    });

    if (!esPonente) {
      throw new ForbiddenException('No estás asignado como ponente a esta actividad académica');
    }

    const inscripcion = await this.inscripcionRepository.findOne({
      where: { id: inscripcionId, actividadAcademica: { id: actividadId } }
    });

    if (!inscripcion) {
      throw new NotFoundException('Inscripción no encontrada en esta actividad');
    }

    return this.actualizarNota(inscripcionId, nota);
  }

  async getHistorialPonente(ponenteId: number) {
    // Buscar inscripciones con nota_principal IS NOT NULL
    // para las actividades donde este usuario es ponente
    const imparticiones = await this.imparticionRepository.find({
      where: { usuario: { id: ponenteId } },
      relations: ['actividadAcademica'],
    });

    if (imparticiones.length === 0) return [];

    const actividadIds = imparticiones.map(i => i.actividadAcademica.id);

    const inscripciones = await this.inscripcionRepository.find({
      where: {
        actividadAcademica: { id: In(actividadIds) },
        nota_principal: Not(IsNull()),
      },
      relations: ['usuario', 'usuario.persona', 'actividadAcademica'],
      order: { fecha_actualizacion: 'DESC' },
    });

    return inscripciones.map(ins => ({
      id: ins.id,
      estudiante: ins.usuario?.persona 
        ? `${ins.usuario.persona.nombres} ${ins.usuario.persona.primer_apellido}`.trim()
        : 'Desconocido',
      actividad: ins.actividadAcademica?.nombre || 'Desconocida',
      nota_anterior: 0, 
      nota_nueva: ins.nota_principal,
      fecha: ins.fecha_actualizacion,
      estado: ins.nota_principal >= 51 ? 'aprobado' : 'reprobado',
    }));
  }

  // ── Coordinador ─────────────────────────────────────────────

  /**
   * Lista inscripciones de un usuario específico por su ID.
   * Diseñado para el panel del coordinador.
   */
  async findByUsuarioId(usuarioId: number) {
    return this.inscripcionRepository.find({
      where: { usuario: { id: usuarioId } },
      relations: [
        'actividadAcademica',
        'actividadAcademica.evento',
        'modalidades',
        'modalidades.cursoModalidad',
      ],
      order: { fecha_creacion: 'DESC' },
    });
  }

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
        actividadAcademica: { id: id_actividad_academica },
      },
    });

    if (existing) {
      throw new ConflictException(
        `El usuario ya cuenta con una inscripción o pre-inscripción en esta actividad.`,
      );
    }

    const inscripcion = this.inscripcionRepository.create({
      ...rest,
      usuario: { id: id_usuario },
      actividadAcademica: { id: id_actividad_academica },
      datos_adicionales: dto.datos_adicionales,
    });
    return this.inscripcionRepository.save(inscripcion);
  }

  async cambiarEstado(id: number, estado: number, observacion?: string) {
    const inscripcion = await this.inscripcionRepository.findOne({
      where: { id },
      relations: ['usuario', 'usuario.persona', 'actividadAcademica', 'actividadAcademica.evento'],
    });

    if (!inscripcion)
      throw new NotFoundException(`Inscripción ${id} no encontrada`);

    await this.inscripcionRepository.update(id, { estado, observacion });

    // Notificación por correo
    const email = inscripcion.usuario?.email;
    const nombre = inscripcion.usuario?.persona 
      ? `${inscripcion.usuario.persona.nombres} ${inscripcion.usuario.persona.primer_apellido}`
      : 'Estudiante';
    const actividad = inscripcion.actividadAcademica?.nombre || 'Actividad';
    const evento = inscripcion.actividadAcademica?.evento?.nombre || 'Evento';

    if (estado === 1) {
      await this.mailService.sendEnrollmentConfirmedEmail(email, nombre, actividad, evento);
    } else if (estado === 2) { 
      await this.mailService.sendEnrollmentRejectedEmail(email, nombre, actividad, observacion);
    }


    return this.inscripcionRepository.findOneBy({ id });
  }

  // ══════════════════════════════════════════════════════════
  //  REGISTRO DE ASISTENCIA POR PIN (flujo público)
  // ══════════════════════════════════════════════════════════

  /**
   * Registra la asistencia de un estudiante usando su email y el PIN
   * de 6 dígitos proyectado en clase.
   *
   * Flujo de validación:
   *  1. Busca la sesión activa y verifica que tiene un PIN generado.
   *  2. Compara el PIN con el hash almacenado (bcrypt.compare).
   *  3. Busca al usuario por email y verifica que esté inscrito en la actividad
   *     correspondiente a la sesión (a través de CursoModalidad → ActividadAcademica).
   *  4. Busca su InscripcionModalidad coincidente con la modalidad de la sesión.
   *  5. Verifica que no haya registrado asistencia ya en esta sesión (anti-duplicado).
   *  6. Inserta el registro en `asistencias` y actualiza `num_asistencia`.
   */
  async registrarAsistenciaPorPin(dto: RegistrarAsistenciaPinDto): Promise<{
    mensaje: string;
    asistencia_id: number;
    es: string;
    en: string;
  }> {
    const { email, id_sesion, pin } = dto;

    // ── 1. Cargar sesión con su modalidad y actividad ──────────
    const sesion = await this.sesionRepository.findOne({
      where: { id: id_sesion },
      relations: [
        'cursoModalidad',
        'cursoModalidad.actividadAcademica',
      ],
    });

    if (!sesion) {
      throw new NotFoundException(`Sesión ${id_sesion} no encontrada.`);
    }

    if (!sesion.cod_verificacion) {
      throw new BadRequestException(
        'Esta sesión no tiene un PIN activo. Contacte al docente.',
      );
    }

    // ── 2. Verificar el PIN ────────────────────────────────────
    const pinValido = await bcrypt.compare(pin.trim(), sesion.cod_verificacion);
    if (!pinValido) {
      throw new BadRequestException('PIN incorrecto. Verifique el código con su docente.');
    }

    // ── 3. Buscar inscripción del estudiante ───────────────────
    const actividadId = sesion.cursoModalidad?.actividadAcademica?.id;
    if (!actividadId) {
      throw new BadRequestException(
        'La sesión no está asociada a una actividad académica válida.',
      );
    }

    const inscripcion = await this.inscripcionRepository.findOne({
      where: {
        usuario: { email },
        actividadAcademica: { id: actividadId },
        estado: 1,
      },
      relations: ['usuario', 'modalidades', 'modalidades.cursoModalidad'],
    });

    if (!inscripcion) {
      throw new NotFoundException(
        `El estudiante con email "${email}" no está inscrito activamente en esta actividad.`,
      );
    }

    // ── 4. Buscar InscripcionModalidad que coincida ────────────
    const modalidadId = sesion.cursoModalidad?.id;
    const inscripcionModalidad = inscripcion.modalidades?.find(
      (m) => m.cursoModalidad?.id === modalidadId,
    );

    if (!inscripcionModalidad) {
      throw new NotFoundException(
        'No se encontró inscripción en la modalidad correspondiente a esta sesión.',
      );
    }

    // ── 5. Anti-duplicado: verificar asistencia del día ───────
    const yaRegistro = await this.asistenciaRepository.findOne({
      where: {
        sesionAcademica: { id: id_sesion },
        inscripcionModalidad: { id: inscripcionModalidad.id },
      },
    });

    if (yaRegistro) {
      throw new ConflictException(
        'Ya registraste tu asistencia en esta sesión. No puedes registrarte dos veces.',
      );
    }

    // ── 6. Insertar asistencia ────────────────────────────────
    const nuevaAsistencia = this.asistenciaRepository.create({
      sesionAcademica: { id: id_sesion },
      inscripcionModalidad: { id: inscripcionModalidad.id },
      estado: 1,
      fecha_hora_registro: new Date(),
    });
    const guardada = await this.asistenciaRepository.save(nuevaAsistencia);

    // Incrementar contador num_asistencia en InscripcionModalidad
    await this.inscripcionModalidadRepository.increment(
      { id: inscripcionModalidad.id },
      'num_asistencia',
      1,
    );

    return {
      asistencia_id: guardada.id,
      mensaje: 'Asistencia registrada correctamente.',
      es: '¡Tu asistencia fue registrada exitosamente!',
      en: 'Your attendance has been successfully recorded!',
    };
  }

  // ── Métodos CRUD estándar ──────────────────────────────────

  create(data: Partial<Inscripcion>) {
    return this.inscripcionRepository.save(
      this.inscripcionRepository.create(data),
    );
  }

  findAll() {
    return this.inscripcionRepository.find({
      relations: {
        usuario: {
          persona: true,
        },
        actividadAcademica: {
          evento: true,
        },
      },
      order: { fecha_creacion: 'DESC' },
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

  async getCoordinadorNotifications() {
    try {
      const [pendingInscriptions, pendingAccounts] = await Promise.all([
        this.inscripcionRepository.find({
          where: { estado: 0 },
          relations: ['actividadAcademica', 'actividadAcademica.evento'],
        }),
        this.usuarioRepository.find({ where: { estado: 2 } }),
      ]);

      const activityMap = new Map<number, { id: number; nombre: string; eventoNombre: string; count: number }>();
      pendingInscriptions.forEach(ins => {
        const act = ins.actividadAcademica;
        if (!act) return;
        if (!activityMap.has(act.id)) {
          activityMap.set(act.id, {
            id: act.id,
            nombre: act.nombre,
            eventoNombre: act.evento?.nombre || 'Evento',
            count: 0
          });
        }
        activityMap.get(act.id)!.count++;
      });

      return {
        total: pendingInscriptions.length + pendingAccounts.length,
        accounts: pendingAccounts.length,
        activities: Array.from(activityMap.values()),
      };
    } catch (error) {
      console.error('ERROR IN getCoordinadorNotifications:', error);
      return { total: 0, accounts: 0, activities: [], error: error.message };
    }
  }
}
