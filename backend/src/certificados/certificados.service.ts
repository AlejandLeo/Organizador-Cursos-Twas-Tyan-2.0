import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Certificado } from './entities/certificado.entity';
import { InfoCertificado } from '../info-certificados/entities/info-certificado.entity';
import { UsuarioCertificado } from '../usuarios-certificados/entities/usuario-certificado.entity';
import { EmitirLoteDto } from './dto/emitir-lote.dto';
import * as crypto from 'crypto';

@Injectable()
export class CertificadosService {
  constructor(
    @InjectRepository(Certificado)
    private readonly certificadoRepository: Repository<Certificado>,
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
        // Generar códigos de seguridad mockeados/iniciales
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
      relations: ['usuario', 'usuario.persona', 'infoCertificado', 'actividadAcademica', 'usuariosCertificados'],
    });
  }

  update(id: number, data: Partial<Certificado>) {
    return this.certificadoRepository.update(id, data);
  }

  remove(id: number) {
    return this.certificadoRepository.delete(id);
  }
}
