import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Coordinacion } from './entities/coordinacion.entity';
import { CreateCoordinacionDto } from './dto/create-coordinacion.dto';
import { UpdateCoordinacionDto } from './dto/update-coordinacion.dto';

@Injectable()
export class CoordinacionesService {
  constructor(
    @InjectRepository(Coordinacion)
    private readonly coordinacionRepository: Repository<Coordinacion>,
  ) {}

  create(createCoordinacionDto: CreateCoordinacionDto) {
    return this.coordinacionRepository.save(createCoordinacionDto);
  }

  findAll() {
    return this.coordinacionRepository.find();
  }

  findOne(id: string) {
    return this.coordinacionRepository.findOneBy({ id_coordinacion: id });
  }

  update(id: string, updateCoordinacionDto: UpdateCoordinacionDto) {
    return this.coordinacionRepository.update(id, updateCoordinacionDto);
  }

  remove(id: string) {
    return this.coordinacionRepository.delete(id);
  }
}
