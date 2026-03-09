import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActividadAcademica } from './entities/actividad-academica.entity';
import { CreateActividadAcademicaDto } from './dto/create-actividad-academica.dto';
import { UpdateActividadAcademicaDto } from './dto/update-actividad-academica.dto';

@Injectable()
export class ActividadesAcademicasService {
  constructor(
    @InjectRepository(ActividadAcademica)
    private readonly actividadAcademicaRepository: Repository<ActividadAcademica>,
  ) {}

  create(createActividadAcademicaDto: CreateActividadAcademicaDto) {
    return this.actividadAcademicaRepository.save(createActividadAcademicaDto);
  }

  findAll() {
    return this.actividadAcademicaRepository.find();
  }

  findOne(id: string) {
    return this.actividadAcademicaRepository.findOneBy({ id_actividad_academica: id });
  }

  update(id: string, updateActividadAcademicaDto: UpdateActividadAcademicaDto) {
    return this.actividadAcademicaRepository.update(id, updateActividadAcademicaDto);
  }

  remove(id: string) {
    return this.actividadAcademicaRepository.delete(id);
  }
}
