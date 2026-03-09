import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InfoCertificado } from './entities/info-certificado.entity';
import { CreateInfoCertificadoDto } from './dto/create-info-certificado.dto';
import { UpdateInfoCertificadoDto } from './dto/update-info-certificado.dto';

@Injectable()
export class InfoCertificadosService {
  constructor(
    @InjectRepository(InfoCertificado)
    private readonly infoCertificadoRepository: Repository<InfoCertificado>,
  ) {}

  create(createInfoCertificadoDto: CreateInfoCertificadoDto) {
    return this.infoCertificadoRepository.save(createInfoCertificadoDto);
  }

  findAll() {
    return this.infoCertificadoRepository.find();
  }

  findOne(id: string) {
    return this.infoCertificadoRepository.findOneBy({ id_info_certificado: id });
  }

  update(id: string, updateInfoCertificadoDto: UpdateInfoCertificadoDto) {
    return this.infoCertificadoRepository.update(id, updateInfoCertificadoDto);
  }

  remove(id: string) {
    return this.infoCertificadoRepository.delete(id);
  }
}
