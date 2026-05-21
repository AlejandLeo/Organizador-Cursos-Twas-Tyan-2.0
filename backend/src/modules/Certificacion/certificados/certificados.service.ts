import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, In } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Certificado } from './entities/certificado.entity';
import { InfoCertificado } from '../../Certificacion/info-certificados/entities/info-certificado.entity';
import { UsuarioCertificado } from '../../Certificacion/usuarios-certificados/entities/usuario-certificado.entity';
import { EmitirLoteDto } from './dto/emitir-lote.dto';
import { EmitirLoteTipoDto } from './dto/emitir-lote-tipo.dto';
import { Inscripcion } from '../../Inscripciones/inscripciones/entities/inscripcion.entity';
import { Imparticion } from '../../Academico/imparticiones/entities/imparticion.entity';
import { CoordinacionEvento } from '../../Academico/coordinaciones/entities/coordinacion.entity';
import { MailLog } from '../../Comun/mail/entities/mail-log.entity';
import { MailQueue } from '../../Comun/mail/entities/mail-queue.entity';
import * as crypto from 'crypto';

@Injectable()
export class CertificadosService {
  constructor(
    @InjectRepository(Certificado)
    private readonly certificadoRepository: Repository<Certificado>,
    @InjectRepository(Inscripcion)
    private readonly inscripcionRepository: Repository<Inscripcion>,
    @InjectRepository(Imparticion)
    private readonly imparticionRepository: Repository<Imparticion>,
    @InjectRepository(CoordinacionEvento)
    private readonly coordinacionRepository: Repository<CoordinacionEvento>,
    @InjectRepository(MailLog)
    private readonly mailLogRepository: Repository<MailLog>,
    @InjectRepository(MailQueue)
    private readonly mailQueueRepository: Repository<MailQueue>,
    private readonly dataSource: DataSource,
  ) {}

  // ── Coordinador ─────────────────────────────────────────────

  /**
   * Emite certificados masivamente en una transacción.
   */
  async emitirLote(dto: EmitirLoteDto) {
    const { id_info_certificado, id_actividad_academica, personasIds, firma } = dto;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Validar InfoCertificado
      const infoCert = await queryRunner.manager.findOne(InfoCertificado, {
        where: { id: id_info_certificado },
      });

      if (!infoCert) {
        throw new NotFoundException(`Info de Certificado ${id_info_certificado} no existe.`);
      }

      const certificadosCreados: Certificado[] = [];

      // 2. Iterar sobre usuarios
      for (const idUsuario of personasIds) {
        // Generar códigos de seguridad
        const uuidArchivo = uuidv4();
        const codigoCertificado = crypto.randomBytes(8).toString('hex').toUpperCase();

        // 3. Crear Certificado
        const certificado = queryRunner.manager.create(Certificado, {
          infoCertificado: { id: id_info_certificado },
          actividadAcademica: { id: id_actividad_academica },
          usuario: { id: idUsuario },
          tipo: 1, // Asistente por defecto
          codigo_certificado: codigoCertificado,
          uuid_archivo: uuidArchivo,
          hash_integridad: 'PENDIENTE', 
        });
        const guardado = await queryRunner.manager.save(certificado);
        certificadosCreados.push(guardado);

        // 4. Crear UsuarioCertificado (relación como Beneficiario)
        const ucBeneficiario = queryRunner.manager.create(UsuarioCertificado, {
          usuario: { id: idUsuario },
          certificado: { id: guardado.id },
          tipo_relacion: 'Beneficiario',
          es_beneficiario: 1,
        });
        await queryRunner.manager.save(ucBeneficiario);
      }

      await queryRunner.commitTransaction();

      return {
        mensaje: `Se emitieron ${certificadosCreados.length} certificados con éxito.`,
        certificados: certificadosCreados.map(c => c.id),
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Obtiene la lista de firmantes autorizados para un evento (coordinadores y ponentes).
   * Devuelve su información de firma, grado, nombre y rol.
   */
  async obtenerFirmantesEvento(id_evento: number): Promise<any[]> {
    // 1. Coordinadores del evento
    const coordinadores = await this.coordinacionRepository.find({
      where: { evento: { id: id_evento } },
      relations: [
        'usuario',
        'usuario.persona',
        'gradoAdministrativo',
        'usuario.afiliaciones',
        'usuario.afiliaciones.gradoAcademico',
        'usuario.afiliaciones.gradoAdministrativo',
      ],
    });

    // 2. Ponentes (Imparticiones) de todas las actividades del evento
    const imparticiones = await this.imparticionRepository.find({
      where: { actividadAcademica: { evento: { id: id_evento } } },
      relations: [
        'usuario',
        'usuario.persona',
        'usuario.afiliaciones',
        'usuario.afiliaciones.gradoAcademico',
        'usuario.afiliaciones.gradoAdministrativo',
      ],
    });

    const firmantes: any[] = [];

    // Map Coordinadores
    for (const c of coordinadores) {
      if (c.usuario?.persona?.firma_dig) {
        // Obtener grado académico
        const afiliacion = c.usuario.afiliaciones?.[0];
        const gradoAcademico = c.usuario.persona?.grado_academico || afiliacion?.gradoAcademico?.abreviacion || afiliacion?.gradoAcademico?.descripcion || '';

        // Obtener grado administrativo (cargo) del evento, o por defecto de su afiliación, fallback a 'Coordinador'
        const cargo = c.gradoAdministrativo?.nombre || c.gradoAdministrativo?.abreviatura
          || afiliacion?.gradoAdministrativo?.nombre || afiliacion?.gradoAdministrativo?.abreviatura
          || 'Coordinador';

        firmantes.push({
          id_usuario: c.usuario.id,
          nombre: `${c.usuario.persona.nombres} ${c.usuario.persona.primer_apellido}`,
          rol: cargo,
          grado: gradoAcademico,
          firma_url: `/usuarios/${c.usuario.id}/firma-publica`,
          firma_filename: c.usuario.persona.firma_dig,
          origen: 'coordinador',
        });
      }
    }

    // Map Ponentes
    // Evitar duplicados si un ponente está en varias actividades
    const ponentesVistos = new Set<number>();
    for (const i of imparticiones) {
      if (i.usuario?.persona?.firma_dig && !ponentesVistos.has(i.usuario.id)) {
        ponentesVistos.add(i.usuario.id);

        // Obtener grado académico principal
        const afiliacion = i.usuario.afiliaciones?.[0];
        const gradoAcademico = i.usuario.persona?.grado_academico || afiliacion?.gradoAcademico?.abreviacion || afiliacion?.gradoAcademico?.descripcion || '';

        // Obtener cargo (si tiene un cargo administrativo en su afiliación lo usamos, sino 'Expositor')
        const cargo = afiliacion?.gradoAdministrativo?.nombre || afiliacion?.gradoAdministrativo?.abreviatura || 'Expositor';

        firmantes.push({
          id_usuario: i.usuario.id,
          nombre: `${i.usuario.persona.nombres} ${i.usuario.persona.primer_apellido}`,
          rol: cargo,
          grado: gradoAcademico,
          firma_url: `/usuarios/${i.usuario.id}/firma-publica`,
          firma_filename: i.usuario.persona.firma_dig,
          origen: 'ponente',
        });
      }
    }

    return firmantes;
  }

  // ── Legacy ──────────────────────────────────────────────────

  // ══════════════════════════════════════════════════════════
  //  VERIFICACIÓN PÚBLICA Y CONSULTA DE ESTUDIANTE
  // ══════════════════════════════════════════════════════════

  /**
   * Verifica la autenticidad de un certificado por su código público.
   * Este código es el que aparece en el QR impreso en el certificado PDF.
   * Endpoint público (sin JWT): cualquier persona puede verificar.
   *
   * Retorna datos del beneficiario, la actividad y el estado del certificado.
   * Si el certificado está revocado (estado=0), lo indica en la respuesta.
   */
  async verificar(codigo: string) {
    const certificado = await this.certificadoRepository.findOne({
      where: { codigo_certificado: codigo },
      relations: [
        'usuario',
        'usuario.persona',
        'actividadAcademica',
        'actividadAcademica.evento',
        'infoCertificado',
        'usuariosCertificados',
        'usuariosCertificados.usuario',
        'usuariosCertificados.usuario.persona',
      ],
    });

    if (!certificado) {
      return {
        valido: false,
        mensaje:
          'Certificado no encontrado. El código no corresponde a ningún certificado emitido.',
      };
    }

    const esValido = certificado.estado === 1;

    return {
      valido: esValido,
      estado: esValido ? 'VIGENTE' : 'REVOCADO',
      mensaje: esValido
        ? 'Certificado válido y vigente.'
        : 'Este certificado ha sido revocado y ya no es válido.',
      certificado: {
        id: certificado.id,
        codigo_certificado: certificado.codigo_certificado,
        tipo: certificado.tipo,
        fecha_emision: certificado.fecha_emision,
        tipo_certificado: certificado.infoCertificado?.cabecera ?? null,
        beneficiario: {
          nombres: certificado.usuario?.persona?.nombres,
          primer_apellido: certificado.usuario?.persona?.primer_apellido,
          segundo_apellido: certificado.usuario?.persona?.segundo_apellido,
          email: certificado.usuario?.email,
        },
        actividad: {
          nombre: (certificado.actividadAcademica as any)?.nombre,
          evento: certificado.actividadAcademica?.evento?.nombre,
        },
      },
    };
  }

  /**
   * Devuelve los certificados emitidos para un usuario específico.
   * Usado por el estudiante autenticado y por el coordinador.
   */
  async findByUsuario(usuarioId: number) {
    return this.certificadoRepository.find({
      where: { usuario: { id: usuarioId } },
      relations: [
        'actividadAcademica',
        'actividadAcademica.evento',
        'infoCertificado',
      ],
      order: { fecha_emision: 'DESC' },
    });
  }

  create(data: Partial<Certificado>) {
    return this.certificadoRepository.save(this.certificadoRepository.create(data));
  }

  findAll() {
    return this.certificadoRepository.find({
      relations: ['usuario', 'usuario.persona', 'actividadAcademica'],
    });
  }

  findOne(id: number) {
    return this.certificadoRepository.findOne({
      where: { id },
      relations: [
        'usuario',
        'usuario.persona',
        'usuario.afiliaciones',
        'infoCertificado',
        'infoCertificado.evento',
        'actividadAcademica',
        'actividadAcademica.evento',
        'usuariosCertificados',
      ],
    });
  }

  update(id: number, data: Partial<Certificado>) {
    return this.certificadoRepository.update(id, data);
  }

  remove(id: number) {
    return this.certificadoRepository.delete(id);
  }

  // ══════════════════════════════════════════════════════════
  //  PANEL DE CERTIFICADOS — CANDIDATOS Y EMISIÓN POR TIPO
  // ══════════════════════════════════════════════════════════

  /**
   * Obtiene los candidatos aptos para recibir certificados según su tipo/rol.
   * Cruza con la tabla de certificados para indicar quién ya tiene uno emitido.
   */
  async obtenerCandidatos(tipo: number, idActividad?: number, idEvento?: number) {
    let candidatos: { id: number; email: string; nombres: string; primer_apellido: string; yaTieneCertificado: boolean }[] = [];

    // Obtener certificados ya emitidos para esta actividad/evento y tipo
    const certsExistentes = await this.certificadoRepository.find({
      where: {
        tipo,
        ...(idActividad ? { actividadAcademica: { id: idActividad } } : {}),
      },
      relations: ['usuario'],
      select: ['id', 'usuario'],
    });
    const idsConCert = new Set(certsExistentes.map(c => c.usuario?.id).filter(Boolean));

    if (tipo === 1) {
      // Asistentes — desde inscripciones
      if (!idActividad) return { candidatos: [], mensaje: 'Se requiere id_actividad_academica para tipo Asistente.' };
      const inscripciones = await this.inscripcionRepository.find({
        where: { actividadAcademica: { id: idActividad }, estado: 1 },
        relations: ['usuario', 'usuario.persona'],
      });
      candidatos = inscripciones.map(i => ({
        id: i.usuario.id,
        email: i.usuario.email,
        nombres: i.usuario.persona?.nombres || '',
        primer_apellido: i.usuario.persona?.primer_apellido || '',
        yaTieneCertificado: idsConCert.has(i.usuario.id),
      }));
    } else if (tipo === 2 || tipo === 4) {
      // Expositores/Docentes — desde imparticiones
      const where: any = {};
      if (idActividad) where.actividadAcademica = { id: idActividad };
      if (idEvento) where.evento = { id: idEvento };
      if (!idActividad && !idEvento) return { candidatos: [], mensaje: 'Se requiere id_actividad o id_evento para tipo Expositor/Docente.' };

      const imparticiones = await this.imparticionRepository.find({
        where,
        relations: ['usuario', 'usuario.persona'],
      });
      // Deduplicar por usuario
      const map = new Map<number, typeof candidatos[0]>();
      for (const imp of imparticiones) {
        if (!map.has(imp.usuario.id)) {
          map.set(imp.usuario.id, {
            id: imp.usuario.id,
            email: imp.usuario.email,
            nombres: imp.usuario.persona?.nombres || '',
            primer_apellido: imp.usuario.persona?.primer_apellido || '',
            yaTieneCertificado: idsConCert.has(imp.usuario.id),
          });
        }
      }
      candidatos = Array.from(map.values());
    } else if (tipo === 3) {
      // Logística/Apoyo — desde coordinacion_eventos filtrando rol Logística (id=3)
      if (!idEvento) return { candidatos: [], mensaje: 'Se requiere id_evento para tipo Logística.' };
      const coordinaciones = await this.coordinacionRepository.find({
        where: { evento: { id: idEvento } },
        relations: ['usuario', 'usuario.persona', 'usuario.usuariosRoles', 'usuario.usuariosRoles.rol'],
      });
      // Filtrar solo los que tienen rol Logística
      const logisticos = coordinaciones.filter(c =>
        c.usuario?.usuariosRoles?.some((ur: any) => ur.rol?.id === 3 || ur.rol?.nombre_rol === 'Logistica')
      );
      candidatos = logisticos.map(c => ({
        id: c.usuario.id,
        email: c.usuario.email,
        nombres: c.usuario.persona?.nombres || '',
        primer_apellido: c.usuario.persona?.primer_apellido || '',
        yaTieneCertificado: idsConCert.has(c.usuario.id),
      }));
    }

    return { candidatos };
  }

  /**
   * Emite certificados masivamente para un tipo de rol específico.
   */
  async emitirLoteTipo(dto: EmitirLoteTipoDto) {
    const { id_info_certificado, id_actividad_academica, id_evento, tipo, personasIds, firma } = dto;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const infoCert = await queryRunner.manager.findOne(InfoCertificado, {
        where: { id: id_info_certificado },
      });
      if (!infoCert) throw new NotFoundException(`Info de Certificado ${id_info_certificado} no existe.`);

      const certificadosCreados: Certificado[] = [];

      for (const idUsuario of personasIds) {
        const uuidArchivo = uuidv4();
        const codigoCertificado = crypto.randomBytes(8).toString('hex').toUpperCase();

        const certificado = queryRunner.manager.create(Certificado, {
          infoCertificado: { id: id_info_certificado },
          ...(id_actividad_academica ? { actividadAcademica: { id: id_actividad_academica } } : {}),
          usuario: { id: idUsuario },
          tipo,
          codigo_certificado: codigoCertificado,
          uuid_archivo: uuidArchivo,
          hash_integridad: 'PENDIENTE',
        });
        const guardado = await queryRunner.manager.save(certificado);
        certificadosCreados.push(guardado);

        const ucBeneficiario = queryRunner.manager.create(UsuarioCertificado, {
          usuario: { id: idUsuario },
          certificado: { id: guardado.id },
          tipo_relacion: 'Beneficiario',
          es_beneficiario: 1,
        });
        await queryRunner.manager.save(ucBeneficiario);
      }

      await queryRunner.commitTransaction();

      const tiposMap: Record<number, string> = { 1: 'Asistente', 2: 'Expositor', 3: 'Logística', 4: 'Docente' };
      return {
        mensaje: `Se emitieron ${certificadosCreados.length} certificados de tipo "${tiposMap[tipo] || tipo}" con éxito.`,
        certificados: certificadosCreados.map(c => c.id),
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Obtiene la traza de envío de un certificado cruzando mail_logs y mail_queue.
   */
  async obtenerMailTrace(certificadoId: number) {
    const cert = await this.certificadoRepository.findOne({
      where: { id: certificadoId },
      relations: ['usuario', 'actividadAcademica'],
    });
    if (!cert) throw new NotFoundException(`Certificado ${certificadoId} no encontrado.`);

    const email = cert.usuario?.email;
    if (!email) return { cert_id: certificadoId, mensaje: 'El certificado no tiene usuario asociado.', logs: [], cola: [] };

    // Buscar en mail_logs por destinatario y asunto que contenga el nombre de la actividad
    const actividadNombre = (cert.actividadAcademica as any)?.nombre || '';
    const logs = await this.mailLogRepository.createQueryBuilder('log')
      .where('log.destinatario = :email', { email })
      .andWhere('log.asunto ILIKE :asunto', { asunto: `%certificado%${actividadNombre}%` })
      .orderBy('log.fecha_creacion', 'DESC')
      .take(20)
      .getMany();

    // Buscar en mail_queue por destinatario
    const cola = await this.mailQueueRepository.createQueryBuilder('q')
      .where('q.destinatario = :email', { email })
      .andWhere('q.asunto ILIKE :asunto', { asunto: `%certificado%` })
      .orderBy('q.fecha_creacion', 'DESC')
      .take(10)
      .getMany();

    return {
      cert_id: certificadoId,
      estado_certificado: cert.estado_envio,
      fecha_emision: cert.fecha_emision,
      fecha_ultimo_envio: cert.fecha_ultimo_envio,
      reintentos: cert.reintentos,
      log_error: cert.log_error_envio,
      destinatario: email,
      logs,
      cola,
    };
  }

  /**
   * Obtiene la temática de la ponencia impartida por un usuario en una actividad o evento.
   * Usa find() con filtros para evitar problemas del query builder con columnas null.
   */
  async obtenerTematicaPonente(idUsuario: number, idActividad?: number, idEvento?: number): Promise<string> {
    if (!idUsuario) return '';

    // Primero buscar directamente por actividad (más preciso)
    if (idActividad) {
      const byActividad = await this.imparticionRepository.findOne({
        where: { usuario: { id: idUsuario }, actividadAcademica: { id: idActividad } },
        relations: ['usuario', 'actividadAcademica'],
      });
      if (byActividad?.tematica) return byActividad.tematica;
    }

    // Luego buscar por evento (directo en imparticion.id_evento)
    if (idEvento) {
      const byEvento = await this.imparticionRepository.findOne({
        where: { usuario: { id: idUsuario }, evento: { id: idEvento } },
        relations: ['usuario', 'evento'],
      });
      if (byEvento?.tematica) return byEvento.tematica;

      // Finalmente buscar via actividad → evento
      const byActividadEvento = await this.imparticionRepository.findOne({
        where: { usuario: { id: idUsuario }, actividadAcademica: { evento: { id: idEvento } } },
        relations: ['usuario', 'actividadAcademica', 'actividadAcademica.evento'],
      });
      if (byActividadEvento?.tematica) return byActividadEvento.tematica;
    }

    // Si ninguna búsqueda específica funcionó, buscar solo por usuario
    if (!idActividad && !idEvento) return '';
    const byUsuario = await this.imparticionRepository.findOne({
      where: { usuario: { id: idUsuario } },
      relations: ['usuario'],
      order: { fecha_creacion: 'DESC' },
    });
    return byUsuario?.tematica || '';
  }
}
