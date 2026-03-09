import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SesionAcademica } from './entities/sesion-academica.entity';
import { CreateSesionAcademicaDto } from './dto/create-sesion-academica.dto';
import { UpdateSesionAcademicaDto } from './dto/update-sesion-academica.dto';

@Injectable()
export class SesionesAcademicasService {
  constructor(
    @InjectRepository(SesionAcademica)
    private readonly sesionAcademicaRepository: Repository<SesionAcademica>,
  ) {}

  create(createSesionAcademicaDto: CreateSesionAcademicaDto) {
    return this.sesionAcademicaRepository.save(createSesionAcademicaDto);
  }

  findAll() {
    return this.sesionAcademicaRepository.find();
  }

  findOne(id: string) {
    return this.sesionAcademicaRepository.findOneBy({ id_sesion_academica: id });
  }

  update(id: string, updateSesionAcademicaDto: UpdateSesionAcademicaDto) {
    return this.sesionAcademicaRepository.update(id, updateSesionAcademicaDto);
  }

  remove(id: string) {
    return this.sesionAcademicaRepository.delete(id);
  }
}
