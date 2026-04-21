import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsuarioCertificado } from './entities/usuario-certificado.entity';

@Injectable()
export class UsuariosCertificadosService {
  constructor(
    @InjectRepository(UsuarioCertificado)
    private readonly repository: Repository<UsuarioCertificado>,
  ) {}

  async findAll() {
    return this.repository.find({
      relations: ['usuario', 'certificado'],
    });
  }

  async findByCertificado(certificadoId: number) {
    return this.repository.find({
      where: { certificado: { id: certificadoId } },
      relations: ['usuario', 'usuario.persona'],
    });
  }

  async create(data: { id_usuario: number; id_certificado: number; tipo_relacion: string; es_beneficiario: number }) {
    const uc = this.repository.create({
      usuario: { id: data.id_usuario },
      certificado: { id: data.id_certificado },
      tipo_relacion: data.tipo_relacion,
      es_beneficiario: data.es_beneficiario,
    });
    return this.repository.save(uc);
  }

  async remove(id: number) {
    const uc = await this.repository.findOneBy({ id });
    if (!uc) throw new NotFoundException(`Relación ${id} no encontrada`);
    await this.repository.delete(id);
    return { mensaje: `Relación ${id} eliminada` };
  }
}
