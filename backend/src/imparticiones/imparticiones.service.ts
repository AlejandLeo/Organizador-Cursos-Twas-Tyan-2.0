import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Imparticion } from './entities/imparticion.entity';

@Injectable()
export class ImparticionesService {
  constructor(
    @InjectRepository(Imparticion)
    private readonly imparticionRepository: Repository<Imparticion>,
  ) {}

  create(data: Partial<Imparticion>) {
    const imparticion = this.imparticionRepository.create(data);
    return this.imparticionRepository.save(imparticion);
  }

  findAll() {
    return this.imparticionRepository.find();
  }

  findOne(id: number) {
    return this.imparticionRepository.findOneBy({ id_imparticion: id });
  }

  update(id: number, data: Partial<Imparticion>) {
    return this.imparticionRepository.update(id, data);
  }

  remove(id: number) {
    return this.imparticionRepository.delete(id);
  }
}
