import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Certificado } from './entities/certificado.entity';

@Injectable()
export class CertificadosService {
  constructor(
    @InjectRepository(Certificado)
    private readonly certificadoRepository: Repository<Certificado>,
  ) {}

  create(data: Partial<Certificado>) {
    const certificado = this.certificadoRepository.create(data);
    return this.certificadoRepository.save(certificado);
  }

  findAll() {
    return this.certificadoRepository.find();
  }

  findOne(id: number) {
    return this.certificadoRepository.findOneBy({ id: id });
  }

  update(id: number, data: Partial<Certificado>) {
    return this.certificadoRepository.update(id, data);
  }

  remove(id: number) {
    return this.certificadoRepository.delete(id);
  }
}
