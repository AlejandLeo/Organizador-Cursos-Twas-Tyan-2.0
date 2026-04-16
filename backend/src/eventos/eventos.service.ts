import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Evento } from './entities/evento.entity';

@Injectable()
export class EventosService {
  constructor(
    @InjectRepository(Evento)
    private readonly eventoRepository: Repository<Evento>,
  ) {}

  create(data: Partial<Evento>) {
    const evento = this.eventoRepository.create(data);
    return this.eventoRepository.save(evento);
  }

  findAll() {
    return this.eventoRepository.find();
  }

  findOne(id: number) {
    return this.eventoRepository.findOneBy({ id: id });
  }

  update(id: number, data: Partial<Evento>) {
    return this.eventoRepository.update(id, data);
  }

  remove(id: number) {
    return this.eventoRepository.delete(id);
  }
}
