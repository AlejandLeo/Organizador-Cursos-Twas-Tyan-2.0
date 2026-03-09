import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DetalleActividadAcademica } from './entities/detalle-actividad-academica.entity';
import { CreateDetalleActividadAcademicaDto } from './dto/create-detalle-actividad-academica.dto';
import { UpdateDetalleActividadAcademicaDto } from './dto/update-detalle-actividad-academica.dto';

@Injectable()
export class DetallesActividadesAcademicasService {
  constructor(
    @InjectRepository(DetalleActividadAcademica)
    private readonly detalleActividadAcademicaRepository: Repository<DetalleActividadAcademica>,
  ) {}

  create(createDetalleActividadAcademicaDto: CreateDetalleActividadAcademicaDto) {
    return this.detalleActividadAcademicaRepository.save(createDetalleActividadAcademicaDto);
  }

  findAll() {
    return this.detalleActividadAcademicaRepository.find();
  }

  findOne(id: string) {
    return this.detalleActividadAcademicaRepository.findOneBy({ id_detalle_actividad_academica: id });
  }

  update(id: string, updateDetalleActividadAcademicaDto: UpdateDetalleActividadAcademicaDto) {
    return this.detalleActividadAcademicaRepository.update(id, updateDetalleActividadAcademicaDto);
  }

  remove(id: string) {
    return this.detalleActividadAcademicaRepository.delete(id);
  }
}
