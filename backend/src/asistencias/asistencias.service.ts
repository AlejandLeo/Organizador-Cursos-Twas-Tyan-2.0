import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Asistencia } from './entities/asistencia.entity';

@Injectable()
export class AsistenciasService {
  constructor(
    @InjectRepository(Asistencia)
    private readonly asistenciaRepository: Repository<Asistencia>,
  ) {}

  create(data: Partial<Asistencia>) {
    const asistencia = this.asistenciaRepository.create(data);
    return this.asistenciaRepository.save(asistencia);
  }

  findAll() {
    return this.asistenciaRepository.find();
  }

  findOne(id: number) {
    return this.asistenciaRepository.findOneBy({ id: id });
  }

  update(id: number, data: Partial<Asistencia>) {
    return this.asistenciaRepository.update(id, data);
  }

  remove(id: number) {
    return this.asistenciaRepository.delete(id);
  }
}
