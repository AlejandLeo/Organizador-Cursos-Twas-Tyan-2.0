import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GradoAcademico } from './entities/grado-academico.entity';

@Injectable()
export class GradosAcademicosService {
  constructor(
    @InjectRepository(GradoAcademico)
    private readonly repo: Repository<GradoAcademico>,
  ) {}

  findAll() {
    return this.repo.find({ order: { descripcion: 'ASC' } });
  }

  findOne(id: number) {
    return this.repo.findOneBy({ id });
  }
}
