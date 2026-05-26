import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Afiliacion } from './entities/afiliacion.entity';

@Injectable()
export class AfiliacionesService {
  constructor(
    @InjectRepository(Afiliacion)
    private readonly afiliacionesRepository: Repository<Afiliacion>,
  ) {}
}
