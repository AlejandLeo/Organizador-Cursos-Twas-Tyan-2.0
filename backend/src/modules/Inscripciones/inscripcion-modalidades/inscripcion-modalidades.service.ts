import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InscripcionModalidad } from './entities/inscripcion-modalidad.entity';

@Injectable()
export class InscripcionModalidadesService {
  constructor(
    @InjectRepository(InscripcionModalidad)
    private readonly inscripcionModalidadesRepository: Repository<InscripcionModalidad>,
  ) {}
}
