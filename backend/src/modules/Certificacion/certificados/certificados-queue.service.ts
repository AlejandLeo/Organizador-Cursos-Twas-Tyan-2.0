import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';
import { Certificado } from './entities/certificado.entity';
import { CertificadosEnvioService } from './certificados-envio.service';
import { InfoCertificado } from '../../Certificacion/info-certificados/entities/info-certificado.entity';
import { UsuarioCertificado } from '../../Certificacion/usuarios-certificados/entities/usuario-certificado.entity';
import { Inscripcion } from '../../Inscripciones/inscripciones/entities/inscripcion.entity';
import { Imparticion } from '../../Academico/imparticiones/entities/imparticion.entity';
import { CoordinacionEvento } from '../../Academico/coordinaciones/entities/coordinacion.entity';
import { ActividadAcademica } from '../../Academico/actividades-academicas/entities/actividad-academica.entity';

/**
 * Cola de envío en memoria — no requiere Redis ni ningún broker externo.
 *
 * Estrategia:
 *  - Los IDs se insertan en una cola interna (array FIFO).
 *  - Si el worker no está corriendo, se arranca con setImmediate() para no
 *    bloquear el ciclo de eventos (el endpoint responde de inmediato).
 *  - El worker procesa los certificados de uno en uno con un delay de 500 ms
 *    entre envíos para no saturar el SMTP.
 *  - Si un envío falla, el error queda registrado en la entidad (estado_envio='error')
 *    pero el worker continúa con el siguiente.
 */
@Injectable()
export class CertificadosQueueService {
  private readonly logger = new Logger(CertificadosQueueService.name);

  /** Cola FIFO de IDs pendientes de envío y su plantilla opcional */
  private readonly queue: { id: number; idTemplate?: number }[] = [];

  /** Evita que dos workers corran en paralelo */
  private isProcessing = false;

  constructor(
    private readonly envioService: CertificadosEnvioService,
    private readonly dataSource: DataSource,

    @InjectRepository(Certificado)
    private readonly certificadoRepository: Repository<Certificado>,
  ) {}

  // ── API pública ──────────────────────────────────────────────

  /**
   * Encola un lote de IDs para envío asíncrono.
   * Retorna inmediatamente; el envío ocurre en segundo plano.
   */
  async encolarLote(ids: number[], idTemplate?: number): Promise<{ mensaje: string; encolados: number }> {
    const items = ids.map(id => ({ id, idTemplate }));
    this.queue.push(...items);
    this.logger.log(`[Queue] +${ids.length} certificados encolados. Total pendiente: ${this.queue.length}`);
    this.iniciarWorkerSiIdle();
    return {
      mensaje: `Se encolaron ${ids.length} certificados. El envío se procesa en segundo plano.`,
      encolados: ids.length,
    };
  }

  /**
   * Encola el reintento de un único certificado.
   */
  async encolarUno(id: number, idTemplate?: number): Promise<{ mensaje: string }> {
    this.queue.push({ id, idTemplate });
    this.logger.log(`[Queue] Certificado #${id} encolado para reintento.`);
    this.iniciarWorkerSiIdle();
    return { mensaje: `Certificado #${id} encolado para envío. Se procesará en breve.` };
  }

  /**
   * Busca todos los certificados con estado_envio = 'error'
   * y los encola para reintento masivo automático.
   */
  async reintentarTodosLosFallidos(): Promise<{ mensaje: string; encolados: number }> {
    const fallidos = await this.certificadoRepository.find({
      where: { estado_envio: 'error' },
      select: ['id'],
    });

    if (fallidos.length === 0) {
      return { mensaje: 'No hay certificados con errores pendientes de reintento.', encolados: 0 };
    }

    const ids = fallidos.map((c) => c.id);
    return this.encolarLote(ids);
  }

  /**
   * Genera de forma inteligente certificados para todos los usuarios elegibles del evento
   * (Estudiantes aprobados/excelencia, Ponentes, Logística) si no existen ya,
   * y luego encola para envío masivo todos los certificados pendientes de dicho evento.
   */
  async generarYEncolarPorEvento(eventoId: number): Promise<{ mensaje: string; creados: number; encolados: number }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      this.logger.log(`[Queue] Iniciando generación automática para Evento #${eventoId}`);

      // 1. Cargar las plantillas de certificados configuradas para este evento
      const infoCertificados = await queryRunner.manager.find(InfoCertificado, {
        where: { evento: { id: eventoId } },
      });

      if (infoCertificados.length === 0) {
        throw new Error('No hay ninguna plantilla de certificado configurada para este evento.');
      }

      // Agrupar plantillas por tipo y es_excelencia
      // tipo: 1=Logística, 2=Expositor, 3=Organizador, 4=Asistente (Estudiante)
      const plantillaLogistica = infoCertificados.find(i => i.tipo === 1);
      const plantillaExpositor = infoCertificados.find(i => i.tipo === 2);
      const plantillaEstudianteRegular = infoCertificados.find(i => i.tipo === 4 && i.es_excelencia === 0);
      const plantillaEstudianteExcelencia = infoCertificados.find(i => i.tipo === 4 && i.es_excelencia === 1);

      let creadosCount = 0;

      // ─── A) PROCESAR ESTUDIANTES (INSCRIPCIONES) ─────────────────
      const inscripciones = await queryRunner.manager.find(Inscripcion, {
        where: {
          actividadAcademica: { evento: { id: eventoId } },
          estado: 1,
        },
        relations: [
          'usuario',
          'usuario.persona',
          'actividadAcademica',
          'modalidades',
          'modalidades.cursoModalidad',
        ],
      });

      for (const ins of inscripciones) {
        if (!ins.usuario) continue;

        // Evaluar aprobación en base a las modalidades registradas
        let esAprobado = false;
        let notaEstudiante = 0;

        if (ins.modalidades && ins.modalidades.length > 0) {
          for (const im of ins.modalidades) {
            const minNota = im.cursoModalidad?.min_nota ?? 0;
            const minAsistencia = im.cursoModalidad?.min_asistencia ?? 0;
            
            const imAprobado = im.aprobado === 1 || (im.nota >= minNota && im.num_asistencia >= minAsistencia);
            if (imAprobado) {
              esAprobado = true;
              if (im.nota > notaEstudiante) {
                notaEstudiante = im.nota;
              }
            }
          }
        } else if (ins.nota_principal !== null && ins.nota_principal >= 51) {
          esAprobado = true;
          notaEstudiante = ins.nota_principal;
        }

        if (!esAprobado) continue;

        // Determinar excelencia académica (calificación >= 90)
        const requiereExcelencia = notaEstudiante >= 90;
        const plantillaDestino = requiereExcelencia 
          ? (plantillaEstudianteExcelencia || plantillaEstudianteRegular) 
          : plantillaEstudianteRegular;

        if (!plantillaDestino) continue;

        // Verificar si ya existe certificado
        const existeCert = await queryRunner.manager.findOne(Certificado, {
          where: {
            usuario: { id: ins.usuario.id },
            actividadAcademica: { id: ins.actividadAcademica.id },
            infoCertificado: { id: plantillaDestino.id },
          },
        });

        if (!existeCert) {
          const uuidArchivo = uuidv4();
          const codigoCertificado = crypto.randomBytes(8).toString('hex').toUpperCase();

          const certificado = queryRunner.manager.create(Certificado, {
            infoCertificado: { id: plantillaDestino.id },
            actividadAcademica: { id: ins.actividadAcademica.id },
            usuario: { id: ins.usuario.id },
            tipo: 4, // Asistente (Estudiante)
            codigo_certificado: codigoCertificado,
            uuid_archivo: uuidArchivo,
            hash_integridad: 'PENDIENTE',
            estado_envio: 'pendiente',
          });

          const guardado = await queryRunner.manager.save(certificado);

          const ucBeneficiario = queryRunner.manager.create(UsuarioCertificado, {
            usuario: { id: ins.usuario.id },
            certificado: { id: guardado.id },
            tipo_relacion: 'Beneficiario',
            es_beneficiario: 1,
          });
          await queryRunner.manager.save(ucBeneficiario);

          creadosCount++;
        }
      }

      // ─── B) PROCESAR EXPONENTES (IMPARTICIONES) ──────────────────
      if (plantillaExpositor) {
        const imparticiones = await queryRunner.manager.find(Imparticion, {
          where: { evento: { id: eventoId } },
          relations: ['usuario', 'usuario.persona', 'actividadAcademica'],
        });

        for (const imp of imparticiones) {
          if (!imp.usuario) continue;

          const existeCert = await queryRunner.manager.findOne(Certificado, {
            where: {
              usuario: { id: imp.usuario.id },
              actividadAcademica: { id: imp.actividadAcademica.id },
              infoCertificado: { id: plantillaExpositor.id },
            },
          });

          if (!existeCert) {
            const uuidArchivo = uuidv4();
            const codigoCertificado = crypto.randomBytes(8).toString('hex').toUpperCase();

            const certificado = queryRunner.manager.create(Certificado, {
              infoCertificado: { id: plantillaExpositor.id },
              actividadAcademica: { id: imp.actividadAcademica.id },
              usuario: { id: imp.usuario.id },
              tipo: 2, // Expositor
              codigo_certificado: codigoCertificado,
              uuid_archivo: uuidArchivo,
              hash_integridad: 'PENDIENTE',
              estado_envio: 'pendiente',
            });

            const guardado = await queryRunner.manager.save(certificado);

            const ucBeneficiario = queryRunner.manager.create(UsuarioCertificado, {
              usuario: { id: imp.usuario.id },
              certificado: { id: guardado.id },
              tipo_relacion: 'Beneficiario',
              es_beneficiario: 1,
            });
            await queryRunner.manager.save(ucBeneficiario);

            creadosCount++;
          }
        }
      }

      // ─── C) PROCESAR LOGÍSTICA (COORDINACION) ─────────────────────
      if (plantillaLogistica) {
        const coordinaciones = await queryRunner.manager.find(CoordinacionEvento, {
          where: { evento: { id: eventoId } },
          relations: ['usuario', 'usuario.persona', 'usuario.usuariosRoles', 'usuario.usuariosRoles.rol'],
        });

        const unaActividad = await queryRunner.manager.findOne(ActividadAcademica, {
          where: { evento: { id: eventoId } },
        });

        if (unaActividad) {
          for (const coord of coordinaciones) {
            if (!coord.usuario) continue;

            const esLogistica = coord.usuario.usuariosRoles?.some(ur => 
              ur.rol && (ur.rol.id === 3 || ur.rol.nombre_rol.toLowerCase().includes('logis'))
            );

            if (!esLogistica) continue; // Coordinadores no reciben certificado

            const existeCert = await queryRunner.manager.findOne(Certificado, {
              where: {
                usuario: { id: coord.usuario.id },
                actividadAcademica: { id: unaActividad.id },
                infoCertificado: { id: plantillaLogistica.id },
              },
            });

            if (!existeCert) {
              const uuidArchivo = uuidv4();
              const codigoCertificado = crypto.randomBytes(8).toString('hex').toUpperCase();

              const certificado = queryRunner.manager.create(Certificado, {
                infoCertificado: { id: plantillaLogistica.id },
                actividadAcademica: { id: unaActividad.id },
                usuario: { id: coord.usuario.id },
                tipo: 1, // Logística
                codigo_certificado: codigoCertificado,
                uuid_archivo: uuidArchivo,
                hash_integridad: 'PENDIENTE',
                estado_envio: 'pendiente',
              });

              const guardado = await queryRunner.manager.save(certificado);

              const ucBeneficiario = queryRunner.manager.create(UsuarioCertificado, {
                usuario: { id: coord.usuario.id },
                certificado: { id: guardado.id },
                tipo_relacion: 'Beneficiario',
                es_beneficiario: 1,
              });
              await queryRunner.manager.save(ucBeneficiario);

              creadosCount++;
            }
          }
        }
      }

      await queryRunner.commitTransaction();

      // ─── D) ENCOLAR TODOS LOS CERTIFICADOS PENDIENTES DEL EVENTO ──
      const certificadosPendientes = await this.certificadoRepository.createQueryBuilder('cert')
        .innerJoin('cert.actividadAcademica', 'act')
        .innerJoin('act.evento', 'ev')
        .where('ev.id = :eventoId', { eventoId })
        .andWhere('cert.estado_envio != :estado', { estado: 'enviado' })
        .select(['cert.id'])
        .getMany();

      const idsAEncolar = certificadosPendientes.map(c => c.id);
      let encoladosCount = 0;

      if (idsAEncolar.length > 0) {
        const resQueue = await this.encolarLote(idsAEncolar);
        encoladosCount = resQueue.encolados;
      }

      this.logger.log(`[Queue] Completado para Evento #${eventoId}. Creados: ${creadosCount}, Encolados: ${encoladosCount}`);

      return {
        mensaje: `Se evaluó la elegibilidad de los participantes. Se emitieron ${creadosCount} nuevos certificados y se encolaron ${encoladosCount} para envío masivo por correo electrónico.`,
        creados: creadosCount,
        encolados: encoladosCount,
      };

    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`[Queue] Falló la generación para Evento #${eventoId}: ${error.message}`);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // ── Worker interno ───────────────────────────────────────────

  /**
   * Arranca el worker solo si no hay uno activo ya.
   * Usa setImmediate para ceder el control al event loop
   * (el cliente HTTP recibe su respuesta antes de que empiece el procesamiento).
   */
  private iniciarWorkerSiIdle(): void {
    if (this.isProcessing) return;
    setImmediate(() => this.procesarCola());
  }

  /**
   * Procesa la cola de forma secuencial hasta vaciarla.
   */
  private async procesarCola(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;
    this.logger.log(`[Worker] Iniciando procesamiento. ${this.queue.length} jobs en cola.`);

    while (this.queue.length > 0) {
      const task = this.queue.shift();
      if (task) {
        try {
          await this.envioService.enviarCertificado(task.id, task.idTemplate);
          this.logger.log(`[Worker] ✓ Certificado #${task.id} enviado.`);
        } catch (error) {
          this.logger.error(`[Worker] ✗ Certificado #${task.id} falló: ${error.message}`);
        }
      }
      
      if (this.queue.length > 0) {
        await new Promise<void>((resolve) => setTimeout(resolve, 500));
      }
    }

    this.isProcessing = false;
    this.logger.log('[Worker] Cola vacía. Worker detenido.');
  }
}
