import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PreInscripcion } from './entities/pre-inscripcion.entity';
import { CreatePreInscripcionDto } from './dto/create-pre-inscripcion.dto';
import { UpdatePreInscripcionDto } from './dto/update-pre-inscripcion.dto';

@Injectable()
export class PreInscripcionesService {
  constructor(
    @InjectRepository(PreInscripcion)
    private readonly preInscripcionRepository: Repository<PreInscripcion>,
  ) {}

  create(createPreInscripcionDto: CreatePreInscripcionDto) {
    return this.preInscripcionRepository.save(createPreInscripcionDto);
  }

  findAll() {
    return this.preInscripcionRepository.find();
  }

  findOne(id: string) {
    return this.preInscripcionRepository.findOneBy({ id_pre_inscripcion: id });
  }

  update(id: string, updatePreInscripcionDto: UpdatePreInscripcionDto) {
    return this.preInscripcionRepository.update(id, updatePreInscripcionDto);
  }

  remove(id: string) {
    return this.preInscripcionRepository.delete(id);
  }
}
