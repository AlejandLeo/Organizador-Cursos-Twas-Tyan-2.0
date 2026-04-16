import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InfoCertificado } from './entities/info-certificado.entity';

@Injectable()
export class InfoCertificadosService {
  constructor(
    @InjectRepository(InfoCertificado)
    private readonly infoRepository: Repository<InfoCertificado>,
  ) {}

  create(data: Partial<InfoCertificado>) {
    const info = this.infoRepository.create(data);
    return this.infoRepository.save(info);
  }

  findAll() {
    return this.infoRepository.find();
  }

  findOne(id: number) {
    return this.infoRepository.findOneBy({ id: id });
  }

  update(id: number, data: Partial<InfoCertificado>) {
    return this.infoRepository.update(id, data);
  }

  remove(id: number) {
    return this.infoRepository.delete(id);
  }
}
