import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Asistencia } from './entities/asistencia.entity';
import { CreateAsistenciaDto } from './dto/create-asistencia.dto';
import { UpdateAsistenciaDto } from './dto/update-asistencia.dto';

@Injectable()
export class AsistenciasService {
  constructor(
    @InjectRepository(Asistencia)
    private readonly asistenciaRepository: Repository<Asistencia>,
  ) {}

  create(createAsistenciaDto: CreateAsistenciaDto) {
    return this.asistenciaRepository.save(createAsistenciaDto);
  }

  findAll() {
    return this.asistenciaRepository.find();
  }

  findOne(id: string) {
    return this.asistenciaRepository.findOneBy({ id_asistencia: id });
  }

  update(id: string, updateAsistenciaDto: UpdateAsistenciaDto) {
    return this.asistenciaRepository.update(id, updateAsistenciaDto);
  }

  remove(id: string) {
    return this.asistenciaRepository.delete(id);
  }
}
