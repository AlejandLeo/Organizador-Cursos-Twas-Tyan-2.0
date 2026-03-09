import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inscripcion } from './entities/inscripcion.entity';
import { CreateInscripcionDto } from './dto/create-inscripcion.dto';
import { UpdateInscripcionDto } from './dto/update-inscripcion.dto';

@Injectable()
export class InscripcionesService {
  constructor(
    @InjectRepository(Inscripcion)
    private readonly inscripcionRepository: Repository<Inscripcion>,
  ) {}

  create(createInscripcionDto: CreateInscripcionDto) {
    return this.inscripcionRepository.save(createInscripcionDto);
  }

  findAll() {
    return this.inscripcionRepository.find();
  }

  findOne(id: string) {
    return this.inscripcionRepository.findOneBy({ id_inscripcion: id });
  }

  update(id: string, updateInscripcionDto: UpdateInscripcionDto) {
    return this.inscripcionRepository.update(id, updateInscripcionDto);
  }

  remove(id: string) {
    return this.inscripcionRepository.delete(id);
  }
}
