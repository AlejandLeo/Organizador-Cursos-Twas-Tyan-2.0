import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CursoModalidad } from './entities/curso-modalidad.entity';

@Injectable()
export class CursoModalidadesService {
  constructor(
    @InjectRepository(CursoModalidad)
    private readonly cursoModalidadesRepository: Repository<CursoModalidad>,
  ) {}
}
