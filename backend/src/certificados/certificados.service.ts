import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Certificado } from './entities/certificado.entity';
import { CreateCertificadoDto } from './dto/create-certificado.dto';
import { UpdateCertificadoDto } from './dto/update-certificado.dto';

@Injectable()
export class CertificadosService {
  constructor(
    @InjectRepository(Certificado)
    private readonly certificadoRepository: Repository<Certificado>,
  ) {}

  create(createCertificadoDto: CreateCertificadoDto) {
    return this.certificadoRepository.save(createCertificadoDto);
  }

  findAll() {
    return this.certificadoRepository.find();
  }

  findOne(id: string) {
    return this.certificadoRepository.findOneBy({ id_certificado: id });
  }

  update(id: string, updateCertificadoDto: UpdateCertificadoDto) {
    return this.certificadoRepository.update(id, updateCertificadoDto);
  }

  remove(id: string) {
    return this.certificadoRepository.delete(id);
  }
}
