import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inscripcion } from './entities/inscripcion.entity';

@Injectable()
export class InscripcionesService {
  constructor(
    @InjectRepository(Inscripcion)
    private readonly inscripcionRepository: Repository<Inscripcion>,
  ) {}

  create(data: Partial<Inscripcion>) {
    const inscripcion = this.inscripcionRepository.create(data);
    return this.inscripcionRepository.save(inscripcion);
  }

  findAll() {
    return this.inscripcionRepository.find();
  }

  findOne(id: number) {
    return this.inscripcionRepository.findOneBy({ id: id });
  }

  update(id: number, data: Partial<Inscripcion>) {
    return this.inscripcionRepository.update(id, data);
  }

  remove(id: number) {
    return this.inscripcionRepository.delete(id);
  }
}
