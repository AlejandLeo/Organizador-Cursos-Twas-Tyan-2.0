import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Evento } from './entities/evento.entity';
import { CreateEventoDto } from './dto/create-evento.dto';
import { UpdateEventoDto } from './dto/update-evento.dto';

@Injectable()
export class EventosService {
  constructor(
    @InjectRepository(Evento)
    private readonly eventoRepository: Repository<Evento>,
  ) {}

  create(createEventoDto: CreateEventoDto) {
    return this.eventoRepository.save(createEventoDto);
  }

  findAll() {
    return this.eventoRepository.find();
  }

  findOne(id: string) {
    return this.eventoRepository.findOneBy({ id_evento: id });
  }

  update(id: string, updateEventoDto: UpdateEventoDto) {
    return this.eventoRepository.update(id, updateEventoDto);
  }

  remove(id: string) {
    return this.eventoRepository.delete(id);
  }
}
