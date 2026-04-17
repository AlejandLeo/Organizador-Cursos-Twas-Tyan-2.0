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
