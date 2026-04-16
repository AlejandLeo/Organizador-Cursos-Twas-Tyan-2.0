import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SesionAcademica } from './entities/sesion-academica.entity';

@Injectable()
export class SesionesAcademicasService {
  constructor(
    @InjectRepository(SesionAcademica)
    private readonly sesionRepository: Repository<SesionAcademica>,
  ) {}

  create(data: Partial<SesionAcademica>) {
    const sesion = this.sesionRepository.create(data);
    return this.sesionRepository.save(sesion);
  }

  findAll() {
    return this.sesionRepository.find();
  }

  findOne(id: number) {
    return this.sesionRepository.findOneBy({ id: id });
  }

  update(id: number, data: Partial<SesionAcademica>) {
    return this.sesionRepository.update(id, data);
  }

  remove(id: number) {
    return this.sesionRepository.delete(id);
  }
}
